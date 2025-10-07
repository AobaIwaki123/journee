/**
 * Phase 4.8: 情報抽出関数
 * チャット履歴から旅行情報を自動抽出
 */

import type { ChatMessage } from '@/types/chat';
import type { ItineraryData } from '@/types/itinerary';

/**
 * 行き先を抽出
 */
export function extractDestination(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): string | null {
  // しおりに既に設定されている場合
  if (itinerary?.destination) {
    return itinerary.destination;
  }
  
  // チャット履歴から抽出
  const destinationKeywords = ['行きたい', '旅行', '行く', '訪れる', '行こう'];
  const placePatterns = [
    // 国内
    /(?:東京|大阪|京都|北海道|沖縄|名古屋|福岡|広島|仙台|札幌|神戸|横浜|千葉|埼玉|栃木|群馬|茨城|長野|新潟|富山|石川|福井|山梨|岐阜|静岡|愛知|三重|滋賀|奈良|和歌山|鳥取|島根|岡山|山口|徳島|香川|愛媛|高知|佐賀|長崎|熊本|大分|宮崎|鹿児島)/,
    // 海外
    /(?:ハワイ|グアム|サイパン|パリ|ロンドン|ニューヨーク|ロサンゼルス|ラスベガス|バリ|プーケット|台湾|台北|韓国|ソウル|釜山|タイ|バンコク|シンガポール|香港|マカオ|ベトナム|ホーチミン|ハノイ|マレーシア|クアラルンプール|フィリピン|マニラ|セブ|インドネシア|ジャカルタ|オーストラリア|シドニー|メルボルン|ニュージーランド|オークランド|イタリア|ローマ|ミラノ|スペイン|バルセロナ|マドリード|ドイツ|ベルリン|フランクフルト|オランダ|アムステルダム|スイス|チューリッヒ)/,
  ];
  
  for (const msg of messages.slice().reverse()) {
    if (msg.role === 'user') {
      // キーワードが含まれているか
      const hasKeyword = destinationKeywords.some(kw => msg.content.includes(kw));
      
      if (hasKeyword || true) { // キーワードなしでも地名を探す
        // 地名パターンにマッチするか
        for (const pattern of placePatterns) {
          const match = msg.content.match(pattern);
          if (match) {
            return match[0];
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * 日程を抽出
 */
export function extractDuration(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): number | null {
  // しおりに既に設定されている場合
  if (itinerary?.duration) {
    return itinerary.duration;
  }
  
  // チャット履歴から抽出
  const durationPatterns = [
    /(\d+)日/,
    /(\d+)泊/,
    /(\d+)泊(\d+)日/,
  ];
  
  for (const msg of messages.slice().reverse()) {
    if (msg.role === 'user') {
      for (const pattern of durationPatterns) {
        const match = msg.content.match(pattern);
        if (match) {
          // 「3泊4日」の場合は4を返す
          if (match[2]) {
            return parseInt(match[2], 10);
          }
          return parseInt(match[1], 10);
        }
      }
    }
  }
  
  return null;
}

/**
 * 予算を抽出
 */
export function extractBudget(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): number | null {
  if (itinerary?.totalBudget) {
    return itinerary.totalBudget;
  }
  
  const budgetPatterns = [
    /予算.*?(\d+)万/,
    /(\d+)万円/,
    /(\d+)円くらい/,
    /(\d+)円以内/,
  ];
  
  for (const msg of messages.slice().reverse()) {
    if (msg.role === 'user') {
      for (const pattern of budgetPatterns) {
        const match = msg.content.match(pattern);
        if (match) {
          const value = parseInt(match[1], 10);
          // 「万円」の場合は10000倍
          if (msg.content.includes('万')) {
            return value * 10000;
          }
          return value;
        }
      }
    }
  }
  
  return null;
}

/**
 * 旅行者情報を抽出
 */
export function extractTravelers(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): { count: number; type?: string } | null {
  const travelerPatterns = [
    /(\d+)人/,
    /(一人|ソロ|1人|ひとり)/,
    /(カップル|恋人|二人|2人|ふたり)/,
    /(家族|子供|親子)/,
    /(友達|友人)/,
  ];
  
  for (const msg of messages.slice().reverse()) {
    if (msg.role === 'user') {
      for (const pattern of travelerPatterns) {
        const match = msg.content.match(pattern);
        if (match) {
          if (match[0].includes('一人') || match[0].includes('ソロ') || match[0].includes('ひとり')) {
            return { count: 1, type: 'solo' };
          }
          if (match[0].includes('カップル') || match[0].includes('恋人') || match[0].includes('ふたり')) {
            return { count: 2, type: 'couple' };
          }
          if (match[0].includes('家族') || match[0].includes('子供')) {
            return { count: 3, type: 'family' };
          }
          if (match[0].includes('友達') || match[0].includes('友人')) {
            return { count: 2, type: 'friends' };
          }
          const count = parseInt(match[1], 10);
          if (!isNaN(count)) {
            return { count };
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * 興味・テーマを抽出
 */
export function extractInterests(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): string[] {
  const interests: string[] = [];
  const interestKeywords: Record<string, string[]> = {
    sightseeing: ['観光', '名所', '観る', '見る', '巡る'],
    gourmet: ['グルメ', '食べ物', '料理', 'レストラン', '食事', '食べる', '美味しい'],
    nature: ['自然', '山', '海', '景色', '絶景', 'ハイキング'],
    history: ['歴史', '文化', '寺', '神社', '城', '博物館'],
    shopping: ['ショッピング', '買い物', 'お土産'],
    relaxation: ['リラックス', '温泉', 'スパ', 'のんびり', 'ゆっくり'],
    adventure: ['アクティビティ', 'アドベンチャー', '冒険', 'スポーツ'],
    nightlife: ['夜景', 'バー', 'ナイトライフ', '夜'],
  };
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      for (const [key, keywords] of Object.entries(interestKeywords)) {
        if (keywords.some(kw => msg.content.includes(kw))) {
          if (!interests.includes(key)) {
            interests.push(key);
          }
        }
      }
    }
  }
  
  return interests;
}

/**
 * テーマアイデアを抽出（skeleton フェーズ用）
 */
export function extractThemeIdeas(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): string | null {
  // しおりに骨組みが既にある場合
  if (itinerary?.schedule && itinerary.schedule.length > 0) {
    const hasThemes = itinerary.schedule.some(day => day.theme);
    if (hasThemes) {
      return 'テーマあり';
    }
  }
  
  // ユーザーが各日のテーマについて言及しているか
  const themeKeywords = ['1日目', '2日目', '3日目', '初日', '最終日', 'エリア', 'テーマ'];
  
  for (const msg of messages.slice().reverse()) {
    if (msg.role === 'user') {
      if (themeKeywords.some(kw => msg.content.includes(kw))) {
        return '言及あり';
      }
    }
  }
  
  return null;
}

/**
 * エリアの希望を抽出
 */
export function extractAreaPreferences(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): string[] {
  const areas: string[] = [];
  
  // エリア名のパターン（例：東京の場合）
  const areaPatterns = [
    /(?:浅草|上野|秋葉原|銀座|新宿|渋谷|原宿|池袋|六本木|お台場|東京駅|品川|目黒|恵比寿)/,
    /(?:清水寺|金閣寺|銀閣寺|嵐山|祇園|河原町|京都駅)/,
    /(?:道頓堀|梅田|難波|心斎橋|天王寺|新大阪)/,
  ];
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      for (const pattern of areaPatterns) {
        const matches = msg.content.match(pattern);
        if (matches) {
          if (!areas.includes(matches[0])) {
            areas.push(matches[0]);
          }
        }
      }
    }
  }
  
  return areas;
}

/**
 * 骨組みが作成されているかチェック
 */
export function checkSkeletonCreated(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): boolean {
  if (!itinerary || !itinerary.schedule) {
    return false;
  }
  
  // すべての日にテーマが設定されているか
  const allDaysHaveTheme = itinerary.schedule.every(day => day.theme);
  
  return allDaysHaveTheme && itinerary.schedule.length > 0;
}

/**
 * 観光スポットの希望を抽出
 */
export function extractSpotPreferences(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): string[] {
  const spots: string[] = [];
  
  // 既にしおりに含まれているスポット
  if (itinerary?.schedule) {
    for (const day of itinerary.schedule) {
      for (const spot of day.spots) {
        if (!spots.includes(spot.name)) {
          spots.push(spot.name);
        }
      }
    }
  }
  
  // ユーザーの希望（簡易的な検出）
  const spotKeywords = ['行きたい', '見たい', '訪れたい', '寄りたい'];
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      if (spotKeywords.some(kw => msg.content.includes(kw))) {
        // 簡易的に「〜に行きたい」などのパターンを検出
        // 本格的にはNLPが必要
        spots.push('希望あり');
        break;
      }
    }
  }
  
  return spots;
}

/**
 * 食事の希望を抽出
 */
export function extractMealPreferences(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): string[] {
  const meals: string[] = [];
  const mealKeywords = [
    '寿司', 'ラーメン', 'うどん', 'そば', '焼肉', '和食', '洋食', '中華',
    'イタリアン', 'フレンチ', '居酒屋', 'カフェ', 'スイーツ', 'デザート',
  ];
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      for (const keyword of mealKeywords) {
        if (msg.content.includes(keyword) && !meals.includes(keyword)) {
          meals.push(keyword);
        }
      }
    }
  }
  
  return meals;
}