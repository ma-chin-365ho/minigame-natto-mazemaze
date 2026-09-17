import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode, RankInfo, ToppingType } from './types';
import { RANKS, getLengthComparison } from './constants';
import { NattoCanvas } from './components/NattoCanvas';
import { GameHUD } from './components/GameHUD';
import { LeftComparisonDisplay } from './components/LeftComparisonDisplay';
import { setMuted, getIsMuted, playMilestoneSound, playChopstickClick } from './audio';
import { Trophy, Sparkles, RotateCcw } from 'lucide-react';

export default function App() {
  const [stirCount, setStirCount] = useState<number>(0);
  const [liftRatio, setLiftRatio] = useState<number>(0);
  const [activeToppings, setActiveToppings] = useState<Set<ToppingType>>(
    new Set<ToppingType>(['negi', 'tare'])
  );
  const [gameMode, setGameMode] = useState<GameMode>('free');
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [combo, setCombo] = useState<number>(0);
  const [isMutedState, setIsMutedState] = useState<boolean>(getIsMuted());
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [resetCount, setResetCount] = useState<number>(0);

  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevRankIndexRef = useRef<number>(0);

  // Compute current rank from stirCount
  const currentRankIndex = RANKS.reduce((acc, rank, idx) => {
    return stirCount >= rank.minStir ? idx : acc;
  }, 0);
  const currentRank = RANKS[currentRankIndex];
  const nextRank = currentRankIndex < RANKS.length - 1 ? RANKS[currentRankIndex + 1] : null;

  // Rank progress percentage (0..100)
  const rankProgress = nextRank
    ? Math.min(
        100,
        Math.max(
          0,
          ((stirCount - currentRank.minStir) / (nextRank.minStir - currentRank.minStir)) * 100
        )
      )
    : 100;

  // Milestone fanfare when reaching new rank
  useEffect(() => {
    if (currentRankIndex > prevRankIndexRef.current) {
      playMilestoneSound();
    }
    prevRankIndexRef.current = currentRankIndex;
  }, [currentRankIndex]);

  // Handle stir increment from NattoCanvas (both tap & swirl)
  const handleStir = useCallback(
    (increment = 1) => {
      // In timer mode, only allow stirring if timer is running or auto-start it
      if (gameMode === 'timer' && !isTimerRunning && timerSeconds === 30) {
        setIsTimerRunning(true);
      }

      setStirCount((prev) => prev + increment);

      // Increment combo and decay after 600ms of inactivity
      setCombo((prev) => prev + 1);
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
      comboTimerRef.current = setTimeout(() => {
        setCombo(0);
      }, 700);
    },
    [gameMode, isTimerRunning, timerSeconds]
  );

  // 30-Second Challenge Timer Logic
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsTimerRunning(false);
            setFinalScore(stirCount);
            setShowResultModal(true);
            playMilestoneSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerSeconds, stirCount]);

  const startTimerChallenge = () => {
    setStirCount(0);
    setTimerSeconds(30);
    setIsTimerRunning(true);
    setShowResultModal(false);
    setLiftRatio(0);
    setResetCount((c) => c + 1);
  };

  const toggleTopping = (topping: ToppingType) => {
    playChopstickClick();
    setActiveToppings((prev) => {
      const next = new Set(prev);
      if (next.has(topping)) {
        next.delete(topping);
      } else {
        next.add(topping);
      }
      return next;
    });
  };

  const toggleMute = () => {
    const nextVal = !isMutedState;
    setMuted(nextVal);
    setIsMutedState(nextVal);
  };

  const resetGame = () => {
    playChopstickClick();
    setStirCount(0);
    setLiftRatio(0);
    setCombo(0);
    setTimerSeconds(30);
    setIsTimerRunning(false);
    setShowResultModal(false);
    setResetCount((c) => c + 1);
  };

  // Calculate thread stretch length in cm based purely on stir count
  // (Fixed: Do not include liftRatio so the displayed length never changes when lifting/lowering chopsticks)
  // Milestone targets:
  // ~30cm (猫) at ~10 stirs
  // ~200cm / 2m (人間) at ~45 stirs
  // ~300cm / 3m (象) at ~62 stirs
  // ~1000cm / 10m (家) at ~158 stirs
  const stretchLengthCm =
    stirCount === 0
      ? 0
      : Math.min(
          999999,
          Math.round((2.0 + Math.pow(stirCount, 1.28) * 1.5) * 10) / 10
        );

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#161311] flex flex-col items-center justify-center select-none touch-none">
      {/* Background Japanese Ceramic & Tatami Wood Atmosphere */}
      <div className="absolute inset-0 bg-radial from-[#2a241f] via-[#1c1815] to-[#0f0d0b] pointer-events-none" />

      {/* Subtle wood grain texture pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Natto Interactive Physics Canvas */}
      <NattoCanvas
        stirCount={stirCount}
        onStir={handleStir}
        liftRatio={liftRatio}
        activeToppings={activeToppings}
        resetCount={resetCount}
      />

      {/* Heads-up Overlay */}
      <GameHUD
        stirCount={stirCount}
        currentRank={currentRank}
        nextRank={nextRank}
        rankProgress={rankProgress}
        combo={combo}
        liftRatio={liftRatio}
        setLiftRatio={setLiftRatio}
        activeToppings={activeToppings}
        toggleTopping={toggleTopping}
        gameMode={gameMode}
        setGameMode={setGameMode}
        timerSeconds={timerSeconds}
        isTimerRunning={isTimerRunning}
        startTimerChallenge={startTimerChallenge}
        isMuted={isMutedState}
        toggleMute={toggleMute}
        resetGame={resetGame}
        stretchLengthCm={stretchLengthCm}
      />

      {/* Left-side Comparison Illustration & Name (お箸持ち上げ時に左側にイラストと名前のみ表示) */}
      <LeftComparisonDisplay
        stretchLengthCm={stretchLengthCm}
        isLifted={liftRatio > 0.05}
        liftRatio={liftRatio}
      />

      {/* 30-Second Challenge Result Modal */}
      {showResultModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-stone-900 border border-amber-500/50 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-3xl shadow-inner animate-bounce">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold">タイムアップ！</div>
              <h2 className="text-2xl font-black text-amber-100">30秒チャレンジ結果</h2>
            </div>

            {/* Score & Stretch Summary */}
            <div className="w-full bg-stone-950/80 border border-stone-800 rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-400">かき混ぜ回数:</span>
                <span className="text-xl font-bold font-mono text-amber-300">{finalScore} 回</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-400">最大糸の伸び:</span>
                <span className="text-lg font-bold font-mono text-amber-200">
                  {stretchLengthCm >= 100
                    ? `${(stretchLengthCm / 100).toFixed(2)} m`
                    : `${stretchLengthCm.toFixed(1)} cm`}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm bg-amber-950/40 p-2 rounded-xl border border-amber-500/20">
                <span className="text-stone-400">長さの目安:</span>
                <span className="text-sm font-bold text-amber-300 flex items-center gap-1">
                  <span>{getLengthComparison(stretchLengthCm).emoji}</span>
                  <span>【{getLengthComparison(stretchLengthCm).name}】級 ({getLengthComparison(stretchLengthCm).approx})</span>
                </span>
              </div>
              <div className="border-t border-stone-800/80 pt-2 flex justify-between items-center text-sm">
                <span className="text-stone-400">獲得称号:</span>
                <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
                  <span>{currentRank.badge}</span>
                  <span>{currentRank.title}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex items-center gap-2">
              <button
                id="btn-retry-timer"
                onClick={startTimerChallenge}
                className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>もう一度挑戦</span>
              </button>
              <button
                id="btn-close-modal"
                onClick={() => setShowResultModal(false)}
                className="px-4 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-sm rounded-xl active:scale-95 transition-all"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
