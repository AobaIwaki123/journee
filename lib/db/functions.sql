-- Supabase RPC Functions (Phase 8)

-- 1. 閲覧数をインクリメントする関数
CREATE OR REPLACE FUNCTION increment_view_count(slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE itineraries
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE public_slug = slug AND is_public = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. しおりの検索（フルテキスト検索）
CREATE OR REPLACE FUNCTION search_itineraries(
  user_id_param UUID,
  search_query TEXT,
  limit_param INT DEFAULT 20,
  offset_param INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  destination VARCHAR,
  start_date DATE,
  end_date DATE,
  status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.destination,
    i.start_date,
    i.end_date,
    i.status,
    i.created_at,
    i.updated_at,
    ts_rank(
      to_tsvector('simple', i.title || ' ' || COALESCE(i.destination, '') || ' ' || COALESCE(i.summary, '')),
      plainto_tsquery('simple', search_query)
    ) AS rank
  FROM itineraries i
  WHERE 
    i.user_id = user_id_param
    AND to_tsvector('simple', i.title || ' ' || COALESCE(i.destination, '') || ' ' || COALESCE(i.summary, ''))
        @@ plainto_tsquery('simple', search_query)
  ORDER BY rank DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ユーザーの統計情報を取得
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_itineraries', COUNT(*),
    'completed_itineraries', COUNT(*) FILTER (WHERE status = 'completed'),
    'draft_itineraries', COUNT(*) FILTER (WHERE status = 'draft'),
    'public_itineraries', COUNT(*) FILTER (WHERE is_public = TRUE),
    'total_days', COALESCE(SUM(duration), 0),
    'destinations', COUNT(DISTINCT destination)
  ) INTO result
  FROM itineraries
  WHERE user_id = user_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. しおりのクローン（コピー）
CREATE OR REPLACE FUNCTION clone_itinerary(
  itinerary_id_param UUID,
  user_id_param UUID,
  new_title TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_itinerary_id UUID;
  original_itinerary RECORD;
  day_schedule RECORD;
  spot RECORD;
  new_day_id UUID;
BEGIN
  -- オリジナルのしおりを取得
  SELECT * INTO original_itinerary
  FROM itineraries
  WHERE id = itinerary_id_param
  AND (user_id = user_id_param OR is_public = TRUE);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Itinerary not found or access denied';
  END IF;
  
  -- 新しいしおりを作成
  INSERT INTO itineraries (
    user_id, title, destination, start_date, end_date, duration,
    summary, total_budget, currency, status, phase
  ) VALUES (
    user_id_param,
    COALESCE(new_title, original_itinerary.title || ' (コピー)'),
    original_itinerary.destination,
    original_itinerary.start_date,
    original_itinerary.end_date,
    original_itinerary.duration,
    original_itinerary.summary,
    original_itinerary.total_budget,
    original_itinerary.currency,
    'draft',
    'initial'
  ) RETURNING id INTO new_itinerary_id;
  
  -- 日程をコピー
  FOR day_schedule IN
    SELECT * FROM day_schedules
    WHERE itinerary_id = itinerary_id_param
    ORDER BY day
  LOOP
    INSERT INTO day_schedules (
      itinerary_id, day, date, title, total_distance, total_cost, status, theme
    ) VALUES (
      new_itinerary_id,
      day_schedule.day,
      day_schedule.date,
      day_schedule.title,
      day_schedule.total_distance,
      day_schedule.total_cost,
      day_schedule.status,
      day_schedule.theme
    ) RETURNING id INTO new_day_id;
    
    -- スポットをコピー
    FOR spot IN
      SELECT * FROM tourist_spots
      WHERE day_schedule_id = day_schedule.id
      ORDER BY order_index
    LOOP
      INSERT INTO tourist_spots (
        day_schedule_id, name, description, scheduled_time, duration,
        category, estimated_cost, notes, image_url,
        location_lat, location_lng, location_address, location_place_id,
        order_index
      ) VALUES (
        new_day_id,
        spot.name,
        spot.description,
        spot.scheduled_time,
        spot.duration,
        spot.category,
        spot.estimated_cost,
        spot.notes,
        spot.image_url,
        spot.location_lat,
        spot.location_lng,
        spot.location_address,
        spot.location_place_id,
        spot.order_index
      );
    END LOOP;
  END LOOP;
  
  RETURN new_itinerary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. APIキーの暗号化保存
CREATE OR REPLACE FUNCTION save_encrypted_api_key(
  p_user_id UUID,
  p_api_key TEXT,
  p_encryption_key TEXT
)
RETURNS VOID AS $$
BEGIN
  -- user_settingsレコードがなければ作成
  INSERT INTO user_settings (user_id, encrypted_claude_api_key)
  VALUES (
    p_user_id,
    encode(pgp_sym_encrypt(p_api_key, p_encryption_key), 'base64')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET encrypted_claude_api_key = encode(pgp_sym_encrypt(p_api_key, p_encryption_key), 'base64'),
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. APIキーの復号化取得
CREATE OR REPLACE FUNCTION get_decrypted_api_key(
  p_user_id UUID,
  p_encryption_key TEXT
)
RETURNS TEXT AS $$
DECLARE
  encrypted_key TEXT;
  decrypted_key TEXT;
BEGIN
  -- 暗号化されたAPIキーを取得
  SELECT encrypted_claude_api_key INTO encrypted_key
  FROM user_settings
  WHERE user_id = p_user_id;
  
  -- レコードがない、またはAPIキーが設定されていない場合
  IF encrypted_key IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- 復号化
  BEGIN
    decrypted_key := pgp_sym_decrypt(decode(encrypted_key, 'base64')::bytea, p_encryption_key);
    RETURN decrypted_key;
  EXCEPTION WHEN OTHERS THEN
    -- 復号化に失敗した場合（キーが間違っている、データが破損している等）
    RAISE WARNING 'Failed to decrypt API key for user %: %', p_user_id, SQLERRM;
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE 'Supabase RPC functions created successfully!';
END $$;
