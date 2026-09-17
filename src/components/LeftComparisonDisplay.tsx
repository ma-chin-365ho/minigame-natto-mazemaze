import React from 'react';
import { getLengthComparison } from '../constants';

interface LeftComparisonDisplayProps {
  stretchLengthCm: number;
  isLifted: boolean;
  liftRatio: number;
}

// Visual Illustrations (イラストと名前のみ表示)
const MilestoneIllustration: React.FC<{ name: string; className?: string }> = ({
  name,
  className = 'w-48 h-48 sm:w-64 sm:h-64',
}) => {
  switch (name) {
    case '猫':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          {/* Shadow */}
          <ellipse cx="50" cy="88" rx="38" ry="8" fill="rgba(0,0,0,0.25)" />
          {/* Body */}
          <ellipse cx="50" cy="62" rx="32" ry="24" fill="#F59E0B" />
          <ellipse cx="50" cy="66" rx="22" ry="17" fill="#FEF3C7" />
          {/* Head */}
          <circle cx="50" cy="40" r="22" fill="#F59E0B" />
          {/* Ears */}
          <polygon points="32,28 40,12 47,26" fill="#D97706" />
          <polygon points="35,27 40,16 45,26" fill="#F472B6" />
          <polygon points="68,28 60,12 53,26" fill="#D97706" />
          <polygon points="65,27 60,16 55,26" fill="#F472B6" />
          {/* Eyes */}
          <ellipse cx="42" cy="38" rx="3.5" ry="5" fill="#1F2937" />
          <ellipse cx="58" cy="38" rx="3.5" ry="5" fill="#1F2937" />
          <circle cx="43.5" cy="36.5" r="1.5" fill="#FFFFFF" />
          <circle cx="59.5" cy="36.5" r="1.5" fill="#FFFFFF" />
          {/* Cute Nose & Mouth */}
          <polygon points="50,44 47,41 53,41" fill="#EC4899" />
          <path d="M47 45 Q50 48 53 45" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Cheeks */}
          <circle cx="36" cy="43" r="3" fill="#FCA5A5" opacity="0.6" />
          <circle cx="64" cy="43" r="3" fill="#FCA5A5" opacity="0.6" />
          {/* Whiskers */}
          <line x1="26" y1="42" x2="38" y2="43" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
          <line x1="26" y1="47" x2="38" y2="46" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
          <line x1="74" y1="42" x2="62" y2="43" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
          <line x1="74" y1="47" x2="62" y2="46" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
          {/* Tail */}
          <path d="M78 68 C90 62, 94 45, 84 38" stroke="#D97706" strokeWidth="7" strokeLinecap="round" fill="none" />
        </svg>
      );

    case '人間':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          {/* Shadow */}
          <ellipse cx="50" cy="92" rx="26" ry="6" fill="rgba(0,0,0,0.25)" />
          {/* Head */}
          <circle cx="50" cy="22" r="12" fill="#FDE68A" />
          {/* Hair */}
          <path d="M38 20 C38 10, 62 10, 62 20 C62 16, 56 12, 50 12 C44 12, 38 16, 38 20 Z" fill="#92400E" />
          {/* Eyes & Smile */}
          <circle cx="46" cy="21" r="1.8" fill="#1F2937" />
          <circle cx="54" cy="21" r="1.8" fill="#1F2937" />
          <path d="M47 26 Q50 29 53 26" stroke="#B45309" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {/* Body / Clothes */}
          <path d="M36 38 L64 38 L60 66 L40 66 Z" fill="#3B82F6" />
          {/* Arms raised happily */}
          <path d="M36 40 L22 26" stroke="#FDE68A" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M64 40 L78 26" stroke="#FDE68A" strokeWidth="5.5" strokeLinecap="round" />
          {/* Legs */}
          <path d="M43 66 L42 88" stroke="#1E293B" strokeWidth="7" strokeLinecap="round" />
          <path d="M57 66 L58 88" stroke="#1E293B" strokeWidth="7" strokeLinecap="round" />
          {/* Shoes */}
          <ellipse cx="40" cy="89" rx="5.5" ry="3" fill="#DC2626" />
          <ellipse cx="60" cy="89" rx="5.5" ry="3" fill="#DC2626" />
        </svg>
      );

    case '象':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          {/* Shadow */}
          <ellipse cx="50" cy="88" rx="42" ry="8" fill="rgba(0,0,0,0.25)" />
          {/* Body */}
          <ellipse cx="56" cy="54" rx="30" ry="24" fill="#9CA3AF" />
          {/* Head */}
          <circle cx="32" cy="46" r="20" fill="#9CA3AF" />
          {/* Large Ear */}
          <ellipse cx="40" cy="42" rx="12" ry="16" fill="#D1D5DB" stroke="#6B7280" strokeWidth="2" />
          {/* Eye */}
          <circle cx="26" cy="42" r="2.5" fill="#1F2937" />
          <circle cx="27" cy="41" r="0.9" fill="#FFFFFF" />
          {/* Trunk */}
          <path d="M20 48 Q14 62 20 72 Q24 76 28 68" stroke="#9CA3AF" strokeWidth="7" fill="none" strokeLinecap="round" />
          {/* Tusk */}
          <path d="M22 55 Q28 62 33 58" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Legs */}
          <rect x="36" y="66" width="9" height="22" rx="4" fill="#6B7280" />
          <rect x="52" y="66" width="9" height="22" rx="4" fill="#9CA3AF" />
          <rect x="68" y="66" width="9" height="22" rx="4" fill="#6B7280" />
          {/* Tail */}
          <path d="M84 54 Q90 60 88 70" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );

    case '家（2階建て）':
    case '家':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          {/* Shadow */}
          <ellipse cx="50" cy="90" rx="40" ry="7" fill="rgba(0,0,0,0.25)" />
          {/* Chimney */}
          <rect x="65" y="15" width="9" height="18" fill="#B91C1C" />
          <rect x="62" y="12" width="15" height="4.5" fill="#7F1D1D" rx="1.5" />
          {/* Roof */}
          <polygon points="50,14 14,40 86,40" fill="#DC2626" />
          <polygon points="50,17 20,38 80,38" fill="#EF4444" />
          {/* Base Wall */}
          <rect x="22" y="40" width="56" height="48" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2.5" />
          {/* 2nd Floor Windows */}
          <rect x="28" y="46" width="13" height="13" rx="2" fill="#60A5FA" stroke="#1E3A8A" strokeWidth="1.5" />
          <line x1="34.5" y1="46" x2="34.5" y2="59" stroke="#1E3A8A" strokeWidth="1.5" />
          <line x1="28" y1="52.5" x2="41" y2="52.5" stroke="#1E3A8A" strokeWidth="1.5" />
          <rect x="59" y="46" width="13" height="13" rx="2" fill="#60A5FA" stroke="#1E3A8A" strokeWidth="1.5" />
          <line x1="65.5" y1="46" x2="65.5" y2="59" stroke="#1E3A8A" strokeWidth="1.5" />
          <line x1="59" y1="52.5" x2="72" y2="52.5" stroke="#1E3A8A" strokeWidth="1.5" />
          {/* 1st Floor Door & Window */}
          <rect x="43" y="66" width="14" height="22" rx="2" fill="#92400E" />
          <circle cx="53" cy="77" r="1.5" fill="#FCD34D" />
          <rect x="28" y="67" width="11" height="11" rx="2" fill="#60A5FA" stroke="#1E3A8A" strokeWidth="1.5" />
          <rect x="61" y="67" width="11" height="11" rx="2" fill="#60A5FA" stroke="#1E3A8A" strokeWidth="1.5" />
        </svg>
      );

    case 'キリン':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <ellipse cx="50" cy="90" rx="36" ry="6" fill="rgba(0,0,0,0.25)" />
          {/* Long Neck & Head */}
          <rect x="44" y="24" width="9" height="42" rx="4" fill="#FBBF24" />
          <circle cx="48" cy="20" r="9" fill="#FBBF24" />
          <line x1="44" y1="12" x2="45" y2="16" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
          <line x1="52" y1="12" x2="51" y2="16" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="56" cy="62" rx="20" ry="14" fill="#FBBF24" />
          {/* Spots */}
          <circle cx="47" cy="32" r="2.8" fill="#92400E" />
          <circle cx="48" cy="44" r="2.8" fill="#92400E" />
          <circle cx="47" cy="56" r="2.8" fill="#92400E" />
          <circle cx="58" cy="62" r="3.5" fill="#92400E" />
          {/* Legs */}
          <line x1="44" y1="74" x2="44" y2="90" stroke="#FBBF24" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="66" y1="74" x2="66" y2="90" stroke="#FBBF24" strokeWidth="5.5" strokeLinecap="round" />
        </svg>
      );

    case 'シロナガスクジラ':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <ellipse cx="50" cy="85" rx="44" ry="7" fill="rgba(0,0,0,0.25)" />
          <path d="M16 50 C16 32, 56 30, 80 48 C90 54, 88 66, 72 66 C48 66, 16 62, 16 50 Z" fill="#38BDF8" />
          <path d="M72 60 C66 66, 44 66, 26 60" fill="#E0F2FE" />
          <circle cx="28" cy="46" r="2.8" fill="#0369A1" />
          <polygon points="78,48 96,34 90,52 96,68" fill="#0284C7" />
          <path d="M40 34 C40 24, 34 18, 30 15" stroke="#BAE6FD" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M44 34 C44 20, 52 18, 56 15" stroke="#BAE6FD" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'スマートフォン':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <ellipse cx="50" cy="88" rx="26" ry="6" fill="rgba(0,0,0,0.25)" />
          <rect x="34" y="16" width="32" height="64" rx="6" fill="#1F2937" stroke="#4B5563" strokeWidth="2.5" />
          <rect x="37" y="24" width="26" height="48" rx="2" fill="#38BDF8" />
          <circle cx="50" cy="20" r="1.5" fill="#9CA3AF" />
          <circle cx="50" cy="75" r="2" fill="#E5E7EB" />
        </svg>
      );

    default:
      return (
        <div className={`flex items-center justify-center text-7xl sm:text-8xl filter drop-shadow-lg ${className}`}>
          {name.includes('東京') || name.includes('タワー')
            ? '🗼'
            : name.includes('自由の女神')
            ? '🗽'
            : name.includes('富士山')
            ? '🗻'
            : name.includes('ギター')
            ? '🎸'
            : name.includes('自転車')
            ? '🚲'
            : name.includes('机')
            ? '🪑'
            : '🌾'}
        </div>
      );
  }
};

export const LeftComparisonDisplay: React.FC<LeftComparisonDisplayProps> = ({
  stretchLengthCm,
  isLifted,
  liftRatio,
}) => {
  // お箸を持ち上げている時（isLifted または liftRatio > 0.05）のみ左側に表示
  if (!isLifted && liftRatio <= 0.05) {
    return null;
  }

  const currentMilestone = getLengthComparison(stretchLengthCm);

  // 表示する名前（「家（2階建て）」なら短く「家」）
  const displayName = currentMilestone.name.includes('家') ? '家' : currentMilestone.name;

  return (
    <div
      className="fixed left-3 sm:left-10 lg:left-20 top-1/2 -translate-y-1/2 z-20 pointer-events-none select-none flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-400 ease-out max-w-[45vw] sm:max-w-xs"
      aria-label="長さ比較イラスト表示"
    >
      {/* イラストのみ表示 */}
      <div className="w-36 h-36 sm:w-56 sm:h-56 lg:w-64 lg:h-64 flex items-center justify-center filter drop-shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition-all duration-300 transform scale-100 hover:scale-105">
        <MilestoneIllustration name={currentMilestone.name} className="w-full h-full" />
      </div>

      {/* 名前のみ表示 (余計な説明文や数値・ゲージなどは非表示) */}
      <div className="mt-2 sm:mt-4 px-4 py-1.5 rounded-2xl bg-black/40 border border-amber-400/30 backdrop-blur-sm text-center">
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-amber-200 tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-sans">
          {displayName}
        </h2>
      </div>
    </div>
  );
};
