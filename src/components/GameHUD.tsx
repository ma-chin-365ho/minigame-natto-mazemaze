import React from 'react';
import { GameMode, RankInfo, ToppingType } from '../types';
import { TOPPINGS, RANKS, getLengthComparison } from '../constants';
import { Volume2, VolumeX, RotateCcw, Sparkles, ChevronUp, ChevronDown, Timer, Flame, Ruler } from 'lucide-react';
import { playStretchSound } from '../audio';

interface GameHUDProps {
  stirCount: number;
  currentRank: RankInfo;
  nextRank: RankInfo | null;
  rankProgress: number; // 0..100
  combo: number;
  liftRatio: number;
  setLiftRatio: (val: number | ((prev: number) => number)) => void;
  activeToppings: Set<ToppingType>;
  toggleTopping: (t: ToppingType) => void;
  gameMode: GameMode;
  setGameMode: (m: GameMode) => void;
  timerSeconds: number;
  isTimerRunning: boolean;
  startTimerChallenge: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  resetGame: () => void;
  stretchLengthCm: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stirCount,
  currentRank,
  nextRank,
  rankProgress,
  combo,
  liftRatio,
  setLiftRatio,
  activeToppings,
  toggleTopping,
  gameMode,
  setGameMode,
  timerSeconds,
  isTimerRunning,
  startTimerChallenge,
  isMuted,
  toggleMute,
  resetGame,
  stretchLengthCm,
}) => {
  const isLifted = liftRatio > 0.4;

  const handleToggleLift = () => {
    if (isLifted) {
      setLiftRatio(0);
    } else {
      setLiftRatio(0.85);
      playStretchSound(Math.min(1, stirCount / 100));
    }
  };

  // Format stretch length
  const formattedLength =
    stretchLengthCm >= 100
      ? `${(stretchLengthCm / 100).toFixed(2)} m`
      : `${stretchLengthCm.toFixed(1)} cm`;

  // Get current comparison milestone object (猫、人間、象、家、etc.)
  const lengthComp = getLengthComparison(stretchLengthCm);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none z-10">
      {/* ----------------- TOP BAR: Header & Stats ----------------- */}
      <header className="w-full flex flex-col gap-2 pointer-events-auto">
        {/* Top Control Strip */}
        <div className="flex items-center justify-between gap-2">
          {/* Game Title & Mode Selector */}
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 bg-amber-950/80 border border-amber-500/30 rounded-lg backdrop-blur-md flex items-center gap-1.5 shadow-sm">
              <span className="text-base">🥢</span>
              <h1 className="text-xs sm:text-sm font-bold tracking-wide text-amber-100">納豆まぜまぜ</h1>
            </div>

            {/* Mode Switcher */}
            <div className="bg-stone-900/80 border border-stone-700/60 p-0.5 rounded-lg flex items-center text-xs">
              <button
                id="btn-mode-free"
                onClick={() => setGameMode('free')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  gameMode === 'free'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                自由
              </button>
              <button
                id="btn-mode-timer"
                onClick={() => setGameMode('timer')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                  gameMode === 'timer'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Timer className="w-3 h-3" />
                <span>30秒</span>
              </button>
            </div>
          </div>

          {/* Audio & Reset Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id="btn-toggle-mute"
              onClick={toggleMute}
              className="p-1.5 bg-stone-900/80 border border-stone-700/60 hover:border-amber-500/50 rounded-lg text-stone-300 hover:text-white transition-all shadow-sm active:scale-95"
              aria-label={isMuted ? 'ミュート解除' : 'ミュート'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              id="btn-reset-natto"
              onClick={resetGame}
              className="px-2 py-1 bg-stone-900/80 border border-stone-700/60 hover:border-amber-500/50 rounded-lg text-stone-300 hover:text-white text-xs flex items-center gap-1 transition-all shadow-sm active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>もう一杯</span>
            </button>
          </div>
        </div>

        {/* 30-Second Timer Banner (if in timer mode) */}
        {gameMode === 'timer' && (
          <div className="w-full bg-amber-950/85 border border-amber-500/40 rounded-xl p-2.5 backdrop-blur-md flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <Timer className={`w-5 h-5 ${isTimerRunning ? 'text-amber-400 animate-spin' : 'text-stone-400'}`} />
              <div>
                <div className="text-[10px] text-amber-300/80 font-medium">30秒早混ぜ勝負</div>
                <div className="text-sm font-bold text-amber-100">
                  残り時間: <span className="text-amber-400 text-base font-mono">{timerSeconds}</span> 秒
                </div>
              </div>
            </div>
            {!isTimerRunning && (
              <button
                id="btn-start-timer"
                onClick={startTimerChallenge}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold rounded-lg shadow-md active:scale-95 transition-all"
              >
                スタート！
              </button>
            )}
          </div>
        )}

        {/* Main Stats Card (Stir Count, Thread Stretch, Rank) */}
        <div className="w-full bg-stone-950/75 border border-amber-900/40 rounded-2xl p-3 backdrop-blur-md shadow-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {/* Left: Stir Count */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-amber-400/80 font-semibold flex items-center gap-1">
                <span>かき混ぜ回数</span>
                {combo > 3 && (
                  <span className="text-xs font-bold text-orange-400 animate-bounce flex items-center gap-0.5">
                    <Flame className="w-3 h-3 fill-orange-400" />
                    {combo}連打!
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                  {stirCount}
                </span>
                <span className="text-xs text-stone-400 font-medium">回</span>
              </div>
            </div>

            {/* Center: Thread Stretch Visual Meter */}
            <div className="text-center px-3 py-1 bg-amber-950/50 rounded-xl border border-amber-600/30 min-w-[100px]">
              <div className="text-[10px] text-amber-300/90 font-medium flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>糸の伸び</span>
              </div>
              <div className="text-base sm:text-lg font-black text-amber-200 font-mono tracking-tight">
                {formattedLength}
              </div>
              <div className="text-[10px] text-amber-300/90 font-semibold truncate flex items-center justify-center gap-1 mt-0.5">
                <span>{lengthComp.emoji}</span>
                <span>{lengthComp.name}級</span>
              </div>
            </div>

            {/* Right: Current Rank Title */}
            <div className="text-right">
              <div className="text-[10px] text-stone-400 font-medium">ネバネバ称号</div>
              <div className="flex items-center justify-end gap-1">
                <span className="text-sm">{currentRank.badge}</span>
                <span className="text-xs sm:text-sm font-bold text-amber-300">
                  {currentRank.title}
                </span>
              </div>
            </div>
          </div>

          {/* Rank Progress Bar */}
          <div className="w-full flex flex-col gap-0.5">
            <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                style={{ width: `${rankProgress}%` }}
              />
            </div>
            {nextRank && (
              <div className="text-[9px] text-stone-400 flex justify-between">
                <span>{currentRank.sub}</span>
                <span>次の称号まであと {Math.max(0, nextRank.minStir - stirCount)} 回</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ----------------- BOTTOM BAR: Controls & Toppings ----------------- */}
      <footer className="w-full flex flex-col gap-2.5 pointer-events-auto">
        {/* Lift Chopsticks Feature Button (ユーザー要望: 糸が長く伸びる視覚効果) */}
        <div className="w-full flex items-center justify-center">
          <button
            id="btn-lift-chopsticks"
            onClick={handleToggleLift}
            className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl backdrop-blur-md transition-all duration-300 active:scale-95 ${
              isLifted
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-2 border-amber-300 shadow-amber-500/30'
                : 'bg-stone-900/90 hover:bg-stone-800 text-amber-200 border border-amber-500/40 shadow-black/40'
            }`}
          >
            {isLifted ? (
              <>
                <ChevronDown className="w-4 h-4 animate-bounce" />
                <span>お箸を器に戻す (かき混ぜ再開)</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 animate-bounce" />
                <span>お箸を持ち上げて糸を伸ばす！ ({formattedLength} : {lengthComp.emoji}{lengthComp.name}級)</span>
              </>
            )}
          </button>
        </div>

        {/* Lift Height Slider (Precise control when lifted) */}
        {isLifted && (
          <div className="w-full max-w-xs mx-auto px-3 py-1.5 bg-stone-950/80 border border-amber-500/30 rounded-xl backdrop-blur-md flex items-center gap-2">
            <span className="text-[10px] text-amber-300/80 font-medium shrink-0">持ち上げ高:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.01"
              value={liftRatio}
              onChange={(e) => setLiftRatio(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Toppings Selector Tray */}
        <div className="w-full bg-stone-950/80 border border-stone-800/80 rounded-2xl p-2 backdrop-blur-md flex items-center justify-between gap-1 shadow-md">
          <div className="text-[10px] text-amber-400/90 font-medium px-1 flex flex-col">
            <span>薬味</span>
            <span className="text-[8px] text-stone-400">トッピング</span>
          </div>

          <div className="flex items-center gap-1.5 flex-1 justify-end">
            {TOPPINGS.map((top) => {
              const active = activeToppings.has(top.id);
              return (
                <button
                  key={top.id}
                  id={`btn-topping-${top.id}`}
                  onClick={() => toggleTopping(top.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all active:scale-90 ${
                    active
                      ? 'bg-amber-600/90 text-white border border-amber-400/60 shadow-sm'
                      : 'bg-stone-900/70 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                  title={top.desc}
                >
                  <span className="text-sm">{top.icon}</span>
                  <span className="hidden sm:inline text-[11px]">{top.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
};
