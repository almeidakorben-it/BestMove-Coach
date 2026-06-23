import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Play, Eye } from 'lucide-react';
import { PgnStep } from '../types';

interface MoveHistoryNavigatorProps {
  steps: PgnStep[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export default function MoveHistoryNavigator({
  steps,
  currentIndex,
  onNavigate,
}: MoveHistoryNavigatorProps) {
  if (steps.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center" id="empty-history-navigator">
        <p className="text-xs text-neutral-500 font-medium">No moves played or imported yet. Make moves on the board to start history navigation.</p>
      </div>
    );
  }

  // Group moves into pairs (White / Black) for standard PGN listing
  const movePairs: { white: { index: number; san: string }; black?: { index: number; san: string } }[] = [];
  for (let i = 0; i < steps.length; i += 2) {
    movePairs.push({
      white: { index: i, san: steps[i].san },
      black: steps[i + 1] ? { index: i + 1, san: steps[i + 1].san } : undefined,
    });
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-lg" id="move-history-navigator">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-amber-500" />
          Game Move Navigator
        </h3>
        <span className="text-[10px] font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded text-amber-400">
          Move {currentIndex + 1} of {steps.length}
        </span>
      </div>

      {/* Grid of moves */}
      <div className="max-h-28 overflow-y-auto bg-neutral-950/60 rounded-lg p-2.5 border border-neutral-850/60 flex flex-wrap gap-x-2 gap-y-1.5 font-mono text-xs">
        {/* Start Position (Move 0) */}
        <button
          onClick={() => onNavigate(-1)}
          className={`px-1.5 py-0.5 rounded transition-all font-sans font-bold text-[11px] uppercase ${
            currentIndex === -1
              ? 'bg-amber-500 text-neutral-950'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          Start
        </button>

        {movePairs.map((pair, pIdx) => (
          <div key={pIdx} className="flex items-center gap-1">
            <span className="text-neutral-500 font-bold">{pIdx + 1}.</span>
            
            {/* White Move */}
            <button
              onClick={() => onNavigate(pair.white.index)}
              className={`px-1.5 py-0.5 rounded transition-all font-semibold ${
                currentIndex === pair.white.index
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {pair.white.san}
            </button>

            {/* Black Move if exists */}
            {pair.black && (
              <button
                onClick={() => onNavigate(pair.black!.index)}
                className={`px-1.5 py-0.5 rounded transition-all font-semibold ${
                  currentIndex === pair.black.index
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {pair.black.san}
            </button>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="flex gap-2 justify-center" id="navigator-controls">
        <button
          onClick={() => onNavigate(-1)}
          disabled={currentIndex === -1}
          className="p-1.5 bg-neutral-850 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-850 rounded text-neutral-300 transition-colors"
          title="Go to Start"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          disabled={currentIndex === -1}
          className="p-1.5 bg-neutral-850 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-850 rounded text-neutral-300 transition-colors"
          title="Previous Move"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          disabled={currentIndex === steps.length - 1}
          className="p-1.5 bg-neutral-850 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-850 rounded text-neutral-300 transition-colors"
          title="Next Move"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate(steps.length - 1)}
          disabled={currentIndex === steps.length - 1}
          className="p-1.5 bg-neutral-850 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-850 rounded text-neutral-300 transition-colors"
          title="Go to End"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
