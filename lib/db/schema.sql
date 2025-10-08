-- Journee Database Schema (Phase 8)
-- Supabase PostgreSQL

-- 1. ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- 2. しおりテーブル
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  destination VARCHAR(255),
  start_date DATE,
  end_date DATE,
  duration INT,
  summary TEXT,
  total_budget DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'JPY',
  status VARCHAR(50) DEFAULT 'draft', -- draft, completed, archived
  
  -- Phase 5.5: 公開設定
  is_public BOOLEAN DEFAULT FALSE,
  public_slug VARCHAR(50) UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INT DEFAULT 0,
  allow_pdf_download BOOLEAN DEFAULT TRUE,
  custom_message TEXT,
  
  -- Phase 4: 段階的作成システム
  phase VARCHAR(50) DEFAULT 'initial', -- initial, collecting, skeleton, detailing, completed
  current_day INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON itineraries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itineraries_updated_at ON itineraries(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_itineraries_public_slug ON itineraries(public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_itineraries_is_public ON itineraries(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_itineraries_status ON itineraries(status);

-- フルテキスト検索用インデックス（日本語対応）
CREATE INDEX IF NOT EXISTS idx_itineraries_search ON itineraries 
  USING GIN (to_tsvector('simple', title || ' ' || COALESCE(destination, '') || ' ' || COALESCE(summary, '')));

-- 3. 日程詳細テーブル
CREATE TABLE IF NOT EXISTS day_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  day INT NOT NULL,
  date DATE,
  title VARCHAR(255),
  total_distance DECIMAL(10, 2), -- km
  total_cost DECIMAL(10, 2), -- 円
  status VARCHAR(50) DEFAULT 'draft', -- draft, skeleton, detailed, completed
  theme TEXT,
  is_loading BOOLEAN DEFAULT FALSE,
  error TEXT,
  progress INT DEFAULT 0, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 複合ユニークキー（同じしおりの同じ日は1つだけ）
  UNIQUE(itinerary_id, day)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_day_schedules_itinerary_id ON day_schedules(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_day_schedules_day ON day_schedules(itinerary_id, day);

-- 4. 観光スポットテーブル
CREATE TABLE IF NOT EXISTS tourist_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_schedule_id UUID NOT NULL REFERENCES day_schedules(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_time TIME, -- HH:mm
  duration INT, -- 分
  category VARCHAR(50), -- sightseeing, dining, transportation, accommodation, other
  estimated_cost DECIMAL(10, 2),
  notes TEXT,
  image_url TEXT,
  
  -- 位置情報
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  location_place_id VARCHAR(255),
  
  -- 順序（並び順）
  order_index INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_tourist_spots_day_schedule_id ON tourist_spots(day_schedule_id);
CREATE INDEX IF NOT EXISTS idx_tourist_spots_order ON tourist_spots(day_schedule_id, order_index);
CREATE INDEX IF NOT EXISTS idx_tourist_spots_location ON tourist_spots(location_lat, location_lng) WHERE location_lat IS NOT NULL;

-- 5. チャット履歴テーブル
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_chat_messages_itinerary_id ON chat_messages(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(itinerary_id, created_at DESC);

-- 6. ユーザー設定テーブル
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- AI設定
  encrypted_claude_api_key TEXT,
  ai_model_preference VARCHAR(50) DEFAULT 'gemini', -- gemini, claude
  
  -- アプリケーション設定（JSON）
  app_settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- 7. updated_at自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at BEFORE UPDATE ON itineraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_day_schedules_updated_at BEFORE UPDATE ON day_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tourist_spots_updated_at BEFORE UPDATE ON tourist_spots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Row Level Security (RLS) の有効化とポリシー設定

-- usersテーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- itinerariesテーブル
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own itineraries and public ones" ON itineraries
  FOR SELECT USING (user_id = auth.uid() OR is_public = TRUE);

CREATE POLICY "Users can insert their own itineraries" ON itineraries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own itineraries" ON itineraries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own itineraries" ON itineraries
  FOR DELETE USING (user_id = auth.uid());

-- day_schedulesテーブル
ALTER TABLE day_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view day schedules of their itineraries and public ones" ON day_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = day_schedules.itinerary_id 
      AND (itineraries.user_id = auth.uid() OR itineraries.is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert day schedules to their itineraries" ON day_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = day_schedules.itinerary_id 
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update day schedules of their itineraries" ON day_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = day_schedules.itinerary_id 
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete day schedules of their itineraries" ON day_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = day_schedules.itinerary_id 
      AND itineraries.user_id = auth.uid()
    )
  );

-- tourist_spotsテーブル
ALTER TABLE tourist_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view spots of their itineraries and public ones" ON tourist_spots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM day_schedules 
      JOIN itineraries ON itineraries.id = day_schedules.itinerary_id
      WHERE day_schedules.id = tourist_spots.day_schedule_id
      AND (itineraries.user_id = auth.uid() OR itineraries.is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert spots to their itineraries" ON tourist_spots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM day_schedules 
      JOIN itineraries ON itineraries.id = day_schedules.itinerary_id
      WHERE day_schedules.id = tourist_spots.day_schedule_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update spots of their itineraries" ON tourist_spots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM day_schedules 
      JOIN itineraries ON itineraries.id = day_schedules.itinerary_id
      WHERE day_schedules.id = tourist_spots.day_schedule_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete spots of their itineraries" ON tourist_spots
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM day_schedules 
      JOIN itineraries ON itineraries.id = day_schedules.itinerary_id
      WHERE day_schedules.id = tourist_spots.day_schedule_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- chat_messagesテーブル
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat messages of their itineraries" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = chat_messages.itinerary_id 
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chat messages to their itineraries" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = chat_messages.itinerary_id 
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chat messages of their itineraries" ON chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = chat_messages.itinerary_id 
      AND itineraries.user_id = auth.uid()
    )
  );

-- user_settingsテーブル
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (user_id = auth.uid());

-- 9. pgcrypto拡張（APIキー暗号化用）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE 'Journee database schema created successfully!';
END $$;
