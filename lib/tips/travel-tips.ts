/**
 * Phase 3.5.3: 旅行Tipsデータベース
 * 
 * LLM応答待ち時間中に表示する有益な情報を提供
 */

export interface TravelTip {
  id: string;
  category: 'travel' | 'planning' | 'app' | 'fun';
  content: string;
  icon?: string;
}

/**
 * 旅行豆知識
 */
const travelTips: TravelTip[] = [
  // 旅行の豆知識
  {
    id: 'travel-001',
    category: 'travel',
    content: '✈️ 飛行機のチケットは火曜日と水曜日が最も安い傾向があります。',
    icon: '✈️',
  },
  {
    id: 'travel-002',
    category: 'travel',
    content: '🌍 旅行先の現地時間に合わせて、出発前から生活リズムを調整すると時差ぼけを軽減できます。',
    icon: '🌍',
  },
  {
    id: 'travel-003',
    category: 'travel',
    content: '📸 写真は縦・横・斜めなど様々な角度から撮ると、後で見返したときに思い出が鮮明に蘇ります。',
    icon: '📸',
  },
  {
    id: 'travel-004',
    category: 'travel',
    content: '🎒 荷物は「必要なもの」ではなく「絶対に必要なもの」だけを入れると軽量化できます。',
    icon: '🎒',
  },
  {
    id: 'travel-005',
    category: 'travel',
    content: '🗺️ Google Mapsのオフラインマップ機能を使えば、圏外でも地図が使えます。',
    icon: '🗺️',
  },
  {
    id: 'travel-006',
    category: 'travel',
    content: '💰 クレジットカードは2枚以上持参すると安心です。1枚が使えなくてもバックアップがあります。',
    icon: '💰',
  },
  {
    id: 'travel-007',
    category: 'travel',
    content: '🏨 ホテルのチェックイン時刻より早く着いても、荷物を預かってもらえることが多いです。',
    icon: '🏨',
  },
  {
    id: 'travel-008',
    category: 'travel',
    content: '🍽️ 現地の人気レストランは事前予約がおすすめ。観光シーズンは特に混雑します。',
    icon: '🍽️',
  },
  {
    id: 'travel-009',
    category: 'travel',
    content: '🚆 公共交通機関の1日乗車券は、3回以上乗るなら元が取れることが多いです。',
    icon: '🚆',
  },
  {
    id: 'travel-010',
    category: 'travel',
    content: '☔ 旅行先の天気予報は1週間前から毎日チェックすると、持ち物の準備がスムーズです。',
    icon: '☔',
  },
  {
    id: 'travel-011',
    category: 'travel',
    content: '🔋 モバイルバッテリーは旅行の必需品。カメラや地図アプリでバッテリー消費が激しくなります。',
    icon: '🔋',
  },
  {
    id: 'travel-012',
    category: 'travel',
    content: '🎫 観光施設の前売りチケットを買うと、当日の行列を避けられることがあります。',
    icon: '🎫',
  },
  {
    id: 'travel-013',
    category: 'travel',
    content: '👟 履き慣れた靴で旅行しましょう。新品の靴は靴擦れの原因になります。',
    icon: '👟',
  },
  {
    id: 'travel-014',
    category: 'travel',
    content: '🧳 スーツケースには目印となるステッカーやベルトをつけると、取り違えを防げます。',
    icon: '🧳',
  },
  {
    id: 'travel-015',
    category: 'travel',
    content: '📱 旅行中はスマホの「機内モード」を活用すると、バッテリーが長持ちします。',
    icon: '📱',
  },

  // 旅行計画のコツ
  {
    id: 'planning-001',
    category: 'planning',
    content: '📝 旅程は詰め込みすぎず、余裕を持たせると予期せぬ発見や休憩時間が生まれます。',
    icon: '📝',
  },
  {
    id: 'planning-002',
    category: 'planning',
    content: '⏰ 観光スポットの営業時間・定休日は必ず事前確認しましょう。',
    icon: '⏰',
  },
  {
    id: 'planning-003',
    category: 'planning',
    content: '🌅 朝早い時間帯は観光客が少なく、写真撮影にも最適です。',
    icon: '🌅',
  },
  {
    id: 'planning-004',
    category: 'planning',
    content: '🗓️ 連休や祝日は混雑するので、平日に旅行すると快適です。',
    icon: '🗓️',
  },
  {
    id: 'planning-005',
    category: 'planning',
    content: '🎯 「絶対行きたい場所」と「時間があれば行きたい場所」を分けて計画すると効率的です。',
    icon: '🎯',
  },
  {
    id: 'planning-006',
    category: 'planning',
    content: '🚇 移動時間は余裕を持って計画しましょう。Google Mapsの所要時間+15分が目安です。',
    icon: '🚇',
  },
  {
    id: 'planning-007',
    category: 'planning',
    content: '🍱 昼食の時間帯（12-13時）を避けると、レストランの待ち時間が短くなります。',
    icon: '🍱',
  },
  {
    id: 'planning-008',
    category: 'planning',
    content: '💡 旅行の目的（観光/グルメ/ショッピング/リラックス）を明確にすると計画が立てやすくなります。',
    icon: '💡',
  },
  {
    id: 'planning-009',
    category: 'planning',
    content: '🎨 美術館・博物館は所要時間2-3時間を見込むと、じっくり鑑賞できます。',
    icon: '🎨',
  },
  {
    id: 'planning-010',
    category: 'planning',
    content: '🌃 夜景スポットは日没の30分前に到着すると、昼と夜の景色両方を楽しめます。',
    icon: '🌃',
  },

  // アプリの使い方
  {
    id: 'app-001',
    category: 'app',
    content: '💬 AIに「もっと詳しく」「別の案を」と伝えると、しおりの内容を調整できます。',
    icon: '💬',
  },
  {
    id: 'app-002',
    category: 'app',
    content: '✏️ しおりのスポットをクリックすると、詳細を編集できます。',
    icon: '✏️',
  },
  {
    id: 'app-003',
    category: 'app',
    content: '📥 作成したしおりは自動保存されるので、安心して編集を続けられます。',
    icon: '📥',
  },
  {
    id: 'app-004',
    category: 'app',
    content: '🎨 ドラッグ&ドロップでスポットの順番を自由に入れ替えられます。',
    icon: '🎨',
  },
  {
    id: 'app-005',
    category: 'app',
    content: '⏪ 間違えた編集は「元に戻す」ボタンで取り消せます。',
    icon: '⏪',
  },
  {
    id: 'app-006',
    category: 'app',
    content: '🖨️ PDFエクスポート機能で、しおりを印刷して持ち歩けます。',
    icon: '🖨️',
  },
  {
    id: 'app-007',
    category: 'app',
    content: '🔗 しおりを公開して、家族や友人と共有できます。',
    icon: '🔗',
  },
  {
    id: 'app-008',
    category: 'app',
    content: '🤖 GeminiとClaudeの2つのAIモデルを選択できます。',
    icon: '🤖',
  },
  {
    id: 'app-009',
    category: 'app',
    content: '📍 地図表示をONにすると、観光ルートが視覚的に確認できます。',
    icon: '📍',
  },
  {
    id: 'app-010',
    category: 'app',
    content: '💾 複数のしおりを保存して、いつでも見返すことができます。',
    icon: '💾',
  },

  // 楽しい豆知識
  {
    id: 'fun-001',
    category: 'fun',
    content: '🗼 東京タワーは冬に約4cm縮むことがあります。金属の収縮によるものです。',
    icon: '🗼',
  },
  {
    id: 'fun-002',
    category: 'fun',
    content: '🌸 桜の開花予想は、600℃の法則（2月1日からの最高気温の合計が600℃）で予測できます。',
    icon: '🌸',
  },
  {
    id: 'fun-003',
    category: 'fun',
    content: '🍣 回転寿司のレーンは時速約8kmで動いています。',
    icon: '🍣',
  },
  {
    id: 'fun-004',
    category: 'fun',
    content: '🏯 姫路城は白く美しいことから「白鷺城」とも呼ばれています。',
    icon: '🏯',
  },
  {
    id: 'fun-005',
    category: 'fun',
    content: '🚅 新幹線の清掃時間は平均7分。チームワークで迅速に行われています。',
    icon: '🚅',
  },
  {
    id: 'fun-006',
    category: 'fun',
    content: '🗻 富士山の山頂は、実は私有地です（浅間大社の所有）。',
    icon: '🗻',
  },
  {
    id: 'fun-007',
    category: 'fun',
    content: '🎎 京都には約1600もの寺院があります。',
    icon: '🎎',
  },
  {
    id: 'fun-008',
    category: 'fun',
    content: '🌊 沖縄の海の透明度は、サンゴ礁が天然のフィルターの役割を果たしているからです。',
    icon: '🌊',
  },
  {
    id: 'fun-009',
    category: 'fun',
    content: '🦌 奈良公園の鹿は野生動物で、国の天然記念物に指定されています。',
    icon: '🦌',
  },
  {
    id: 'fun-010',
    category: 'fun',
    content: '🎆 日本三大花火大会は、秋田の大曲、新潟の長岡、茨城の土浦です。',
    icon: '🎆',
  },
];

/**
 * カテゴリー別にTipsを取得
 */
export function getTipsByCategory(category: TravelTip['category']): TravelTip[] {
  return travelTips.filter((tip) => tip.category === category);
}

/**
 * ランダムなTipを取得
 */
export function getRandomTip(): TravelTip {
  const randomIndex = Math.floor(Math.random() * travelTips.length);
  return travelTips[randomIndex];
}

/**
 * ランダムなTipを複数取得（重複なし）
 */
export function getRandomTips(count: number): TravelTip[] {
  const shuffled = [...travelTips].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, travelTips.length));
}

/**
 * カテゴリーを指定してランダムなTipを取得
 */
export function getRandomTipByCategory(category: TravelTip['category']): TravelTip {
  const categoryTips = getTipsByCategory(category);
  const randomIndex = Math.floor(Math.random() * categoryTips.length);
  return categoryTips[randomIndex];
}

/**
 * IDでTipを取得
 */
export function getTipById(id: string): TravelTip | undefined {
  return travelTips.find((tip) => tip.id === id);
}

/**
 * すべてのTipsを取得
 */
export function getAllTips(): TravelTip[] {
  return travelTips;
}

/**
 * Tipsの総数を取得
 */
export function getTipsCount(): number {
  return travelTips.length;
}

/**
 * カテゴリーごとのTips数を取得
 */
export function getTipsCountByCategory(): Record<TravelTip['category'], number> {
  return {
    travel: getTipsByCategory('travel').length,
    planning: getTipsByCategory('planning').length,
    app: getTipsByCategory('app').length,
    fun: getTipsByCategory('fun').length,
  };
}
