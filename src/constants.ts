import { RankInfo, ToppingType, LengthComparison } from './types';

export const RANKS: RankInfo[] = [
  {
    title: 'サラサラ大豆',
    sub: 'まだ混ぜていない新鮮な豆',
    minStir: 0,
    color: '#94a3b8',
    badge: '🌱',
  },
  {
    title: 'ほんのり糸引き',
    sub: '細い糸が少しずつ伸び始めた！',
    minStir: 15,
    color: '#38bdf8',
    badge: '🥢',
  },
  {
    title: '手応えネバネバ',
    sub: 'お箸にしっかり絡みつく粘り気！',
    minStir: 40,
    color: '#4ade80',
    badge: '✨',
  },
  {
    title: '白泡ふわふわ',
    sub: '空気を含んで旨味と泡が倍増！',
    minStir: 80,
    color: '#facc15',
    badge: '☁️',
  },
  {
    title: '極上職人ネバネバ',
    sub: 'プロも認める完璧な糸引き！',
    minStir: 150,
    color: '#fb923c',
    badge: '👑',
  },
  {
    title: 'トルネード糸引き',
    sub: '何十本もの太い糸が天空へ伸びる！',
    minStir: 300,
    color: '#f43f5e',
    badge: '🌪️',
  },
  {
    title: '無限ネバネバ次元',
    sub: 'どこまでも切れない驚異の弾力！',
    minStir: 600,
    color: '#c084fc',
    badge: '🔮',
  },
  {
    title: '伝説の納豆神',
    sub: '成層圏を突破する奇跡の糸！',
    minStir: 1200,
    color: '#e879f9',
    badge: '🌌',
  },
];

export interface ToppingConfig {
  id: ToppingType;
  name: string;
  desc: string;
  icon: string;
  color: string;
}

export const TOPPINGS: ToppingConfig[] = [
  {
    id: 'negi',
    name: '刻みネギ',
    desc: 'シャキシャキ青ネギで風味アップ',
    icon: '🌿',
    color: '#22c55e',
  },
  {
    id: 'tare',
    name: '特製タレ',
    desc: '出汁が効いた旨味たっぷりの醤油タレ',
    icon: '🥣',
    color: '#78350f',
  },
  {
    id: 'karashi',
    name: '練りからし',
    desc: 'ピリッと引き締まる黄色いアクセント',
    icon: '🟡',
    color: '#eab308',
  },
  {
    id: 'egg',
    name: '新鮮な卵黄',
    desc: 'とろ〜り濃厚なコクとまろやかさ',
    icon: '🥚',
    color: '#f97316',
  },
];

export const LENGTH_COMPARISONS: LengthComparison[] = [
  {
    minCm: 0,
    name: '米粒',
    emoji: '🌾',
    approx: '約5mm',
    description: '生まれたての大豆のちいさな糸',
  },
  {
    minCm: 6,
    name: '消しゴム',
    emoji: '✏️',
    approx: '約6cm',
    description: '手のひらに収まる文房具サイズ',
  },
  {
    minCm: 15,
    name: 'スマートフォン',
    emoji: '📱',
    approx: '約15cm',
    description: 'スマホと同じくらいの長さ！',
  },
  {
    minCm: 30,
    name: '猫',
    emoji: '🐈',
    approx: '約30cm',
    description: '丸くなって寝ている可愛いネコちゃんサイズ！',
  },
  {
    minCm: 60,
    name: 'アコースティックギター',
    emoji: '🎸',
    approx: '約60cm',
    description: '抱えて弾ける楽器のボディサイズ！',
  },
  {
    minCm: 100,
    name: '学校の勉強机',
    emoji: '🪑',
    approx: '約1m',
    description: '学習机の高さ（1m）に到達！',
  },
  {
    minCm: 150,
    name: '自転車',
    emoji: '🚲',
    approx: '約1.5m',
    description: '街で見かける自転車の全長と同じ！',
  },
  {
    minCm: 200,
    name: '人間',
    emoji: '🧍',
    approx: '約2m',
    description: '背の高い大人1人分（2m）の高さ！',
  },
  {
    minCm: 300,
    name: '象',
    emoji: '🐘',
    approx: '約3m',
    description: '巨大なアフリカゾウの堂々たる体高（3m）！',
  },
  {
    minCm: 500,
    name: 'キリン',
    emoji: '🦒',
    approx: '約5m',
    description: '見上げるほど高いキリンの頭の高さ！',
  },
  {
    minCm: 1000,
    name: '家（2階建て）',
    emoji: '🏠',
    approx: '約10m',
    description: '2階建ての一軒家の屋根（10m）に到達！',
  },
  {
    minCm: 2000,
    name: '大型バス2台分',
    emoji: '🚌',
    approx: '約20m',
    description: '巨大な大型バスを縦に2台並べた長さ！',
  },
  {
    minCm: 3500,
    name: 'シロナガスクジラ',
    emoji: '🐋',
    approx: '約35m',
    description: '地球上最大の生物の全長に匹敵！',
  },
  {
    minCm: 9300,
    name: '自由の女神',
    emoji: '🗽',
    approx: '約93m',
    description: '台座を含めたアメリカの巨像クラス！',
  },
  {
    minCm: 33300,
    name: '東京タワー',
    emoji: '🗼',
    approx: '約333m',
    description: '昭和の赤いシンボルタワーのてっぺん！',
  },
  {
    minCm: 63400,
    name: '東京スカイツリー',
    emoji: '🗼',
    approx: '約634m',
    description: '世界一の自立式電波塔と同じ高さ！',
  },
  {
    minCm: 377600,
    name: '富士山',
    emoji: '🗻',
    approx: '約3,776m',
    description: '成層圏を突き抜ける奇跡の納豆神話！',
  },
];

export function getLengthComparison(cm: number): LengthComparison {
  for (let i = LENGTH_COMPARISONS.length - 1; i >= 0; i--) {
    if (cm >= LENGTH_COMPARISONS[i].minCm) {
      return LENGTH_COMPARISONS[i];
    }
  }
  return LENGTH_COMPARISONS[0];
}
