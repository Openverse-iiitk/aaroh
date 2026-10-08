import React from 'react';
import { FlipDigit } from './FlipDigit';

interface FlipUnitProps {
  val: string;
  label: string;
  isHighlight?: boolean;
}

/**
 * FlipUnit
 * Pairs two independent FlipDigit split-flap cards for Hours, Minutes, or Seconds.
 * Features:
 * - Independent flip animations: only the digit that changes folds down in 190ms!
 * - Brought close together (gap-1.5 sm:gap-2) to avoid awkward gaps while maintaining individual split-flap action
 * - High-contrast cosmic styling and legible labels
 */
export const FlipUnit: React.FC<FlipUnitProps> = ({
  val,
  label,
  isHighlight = false,
}) => {
  const safeVal = (val || '00').padStart(2, '0');
  const d1 = safeVal[0];
  const d2 = safeVal[1];

  return (
    <div className="flex flex-col items-center">
      {/* Two split-flap digits paired side-by-side */}
      <div className="flex items-center gap-1 sm:gap-2">
        <FlipDigit digit={d1} isHighlight={isHighlight} />
        <FlipDigit digit={d2} isHighlight={isHighlight} />
      </div>

      {/* Label */}
      <span
        className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-2 sm:mt-2.5 flex items-center gap-1.5 ${
          isHighlight ? 'text-purple-300' : 'text-zinc-400'
        }`}
      >
        {isHighlight && (
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping inline-block" />
        )}
        {label}
      </span>
    </div>
  );
};
