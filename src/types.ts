export type GameMode = 'free' | 'timer';

export type ToppingType = 'negi' | 'karashi' | 'tare' | 'egg';

export interface Bean {
  id: number;
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  sizeX: number;
  sizeY: number;
  shade: number; // 0..1 color variation
  liftedCling: number; // 0 (in bowl) .. 1 (fully clings to chopstick tip)
  clingTipIndex: 0 | 1;
  clingOffsetX: number;
  clingOffsetY: number;
  fallProgress: number; // 0 (at chopstick) .. 1 (fallen into bowl)
  fallDelay: number; // delay before this bean starts sliding down
  fallSpeed: number; // sliding speed
  isFallen: boolean; // whether this bean has completely dropped back into bowl
  stickTimer: number; // brief momentary cling time when stirred in bowl (e.g. 0.12 - 0.2s)
  stickCooldown: number; // cooldown before bean can latch onto chopsticks again
  stickTip: 0 | 1;
}

export interface StringPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface StickyThread {
  id: number;
  beanId: number;
  chopstickTipIndex: 0 | 1;
  points: StringPoint[];
  thickness: number;
  dropletT: number; // 0..1 progress of droplet falling
  dropletSpeed: number;
  hasDroplet: boolean;
  opacity: number;
  wobblePhase: number;
}

export interface FoamBubble {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  age: number;
  maxAge: number;
}

export interface LengthComparison {
  minCm: number;
  name: string;
  emoji: string;
  approx: string;
  description: string;
}

export interface ToppingParticle {
  id: number;
  type: ToppingType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  size: number;
}

export interface RankInfo {
  title: string;
  sub: string;
  minStir: number;
  color: string;
  badge: string;
}
