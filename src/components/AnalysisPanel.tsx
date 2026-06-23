import React, { useState } from 'react';
import { AnalysisResult, AnalysisVariant } from '../types';
import { Play, Copy, Check, Info, Award, Brain } from 'lucide-react';
import { getVerboseMoveDescription, getVerboseAnalysisText } from '../utils/chessHelpers';

interface AnalysisPanelProps {
  analysis: AnalysisResult;
  onPlayMove: (move: string) => void;
  trainingMode: boolean;
  trainingGuessed: boolean;
  onRevealSolution: () => void;
  fen: string;
  useBeginnerFriendlyMoves: boolean;
  onToggleBeginnerFriendlyMoves: (val: boolean) => void;
}

export default function AnalysisPanel({
  analysis,
  onPlayMove,
  trainingMode,
  trainingGuessed,
  onRevealSolution,
  fen,
  useBeginnerFriendlyMoves,
  onToggleBeginnerFriendlyMoves,
}: AnalysisPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyLine = (lineMoves: string[] | undefined, index: number) => {
    if (!lineMoves || lineMoves.length === 0) return;
    navigator.clipboard.writeText(lineMoves.join(' '));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Get status badge colors
  const getStatusBadge = () => {
    switch (analysis.status) {
      case 'analyzing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Analyzing with Stockfish...
          </span>
        );
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Engine Live
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Analysis Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
            Idle
          </span>
        );
    }
  };

  // Get win chance description
  const getWinChanceDescription = (chance: number) => {
    if (chance > 85) return 'Decisive advantage for White (Winning)';
    if (chance > 65) return 'Strong advantage for White';
    if (chance > 53) return 'Slight advantage for White';
    if (chance > 47) return 'Position is balanced / equal';
    if (chance > 35) return 'Slight advantage for Black';
    if (chance > 15) return 'Strong advantage for Black';
    return 'Decisive advantage for Black (Winning)';
  };

  if (trainingMode && !trainingGuessed) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col items-center justify-center text-center py-12" id="analysis-panel-training">
        <Brain className="w-12 h-12 text-amber-500 mb-3 animate-bounce" />
        <h3 className="text-lg font-bold text-neutral-100">Training Mode Active</h3>
        <p className="text-sm text-neutral-400 max-w-sm mt-1.5 leading-relaxed">
          The Stockfish engine has calculated the best path. Make a move on the board to guess, or reveal the answer.
        </p>
        <button
          onClick={onRevealSolution}
          className="mt-6 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-550 text-neutral-950 rounded-lg text-sm font-bold tracking-wide transition-all shadow-md"
          id="btn-reveal-solution"
        >
          Reveal Best Move
        </button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col gap-5" id="analysis-panel">
      {/* Header and status */}
      <div className="flex flex-col gap-3 border-b border-neutral-800 pb-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-400" />
            Engine Analysis
          </h2>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Beginner Guide Toggle */}
        <div className="flex items-center justify-between bg-neutral-950/60 p-2 px-3 rounded-lg border border-neutral-850" id="beginner-toggle-container">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-neutral-200">Beginner Piece Names</span>
            <span className="text-[10px] text-neutral-500">Show exact piece names and locations</span>
          </div>
          <button
            onClick={() => onToggleBeginnerFriendlyMoves(!useBeginnerFriendlyMoves)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              useBeginnerFriendlyMoves ? 'bg-amber-500' : 'bg-neutral-800'
            }`}
            id="toggle-beginner-moves"
            role="switch"
            aria-checked={useBeginnerFriendlyMoves}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-neutral-900 shadow ring-0 transition duration-200 ease-in-out ${
                useBeginnerFriendlyMoves ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {analysis.status === 'error' && (
        <div className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-3.5 text-xs text-rose-300">
          <strong>Error analyzing position:</strong> {analysis.errorMessage || 'Chess-API timed out or received invalid FEN.'}
        </div>
      )}

      {/* Primary recommendation */}
      {analysis.bestMove && (
        <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between bg-neutral-850/50 border border-neutral-800 p-4 rounded-xl shadow-inner">
          <div className="flex items-center gap-4">
            {/* Best Move Medal */}
            <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shadow-md">
              <Award className="w-6 h-6" />
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Best Move</div>
              <div className="text-2xl font-black font-mono text-emerald-400" id="best-move-display">
                {analysis.bestMove}
              </div>
              {useBeginnerFriendlyMoves && (
                <div className="text-xs font-semibold text-amber-400 mt-1" id="verbose-best-move-desc">
                  {getVerboseMoveDescription(fen, analysis.bestMove)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-row md:flex-col justify-between md:justify-center items-end text-right border-t md:border-t-0 border-neutral-800 pt-3 md:pt-0">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-bold mr-1">Depth:</span>
              <span className="text-xs font-semibold font-mono text-neutral-300">{analysis.depth ?? '-'} plies</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-bold mr-1">Win Chance:</span>
              <span className="text-xs font-semibold font-mono text-emerald-400">{analysis.winChance ?? 50}%</span>
            </div>
          </div>
        </div>
      )}

      {analysis.text && (
        <div className="text-xs text-neutral-400 italic bg-neutral-950/40 px-3 py-2 rounded-lg border border-neutral-850" id="engine-text-commentary">
          "{useBeginnerFriendlyMoves ? getVerboseAnalysisText(fen, analysis.text) : analysis.text}"
        </div>
      )}

      {/* Multiple Candidate Lines */}
      {analysis.variants && analysis.variants.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            Top candidate lines
          </h3>

          <div className="flex flex-col gap-2.5" id="variants-list">
            {analysis.variants.map((v, idx) => {
              const scoreText = v.mate !== undefined && v.mate !== null
                ? `M${v.mate}`
                : v.eval !== undefined
                  ? `${v.eval > 0 ? '+' : ''}${(v.eval / 100).toFixed(2)}`
                  : `${v.winChance ?? 50}%`;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
                    idx === 0
                      ? 'bg-emerald-950/10 border-emerald-900/30'
                      : 'bg-neutral-850/40 border-neutral-850 hover:border-neutral-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-[10px] font-bold">
                        #{idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black font-mono text-neutral-100">{v.bestMove}</span>
                          <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            idx === 0 ? 'bg-emerald-950/50 text-emerald-400' : 'bg-neutral-800 text-neutral-300'
                          }`}>
                            {scoreText}
                          </span>
                        </div>
                        {useBeginnerFriendlyMoves && (
                          <span className="text-[11px] text-amber-400 font-semibold mt-0.5">
                            {getVerboseMoveDescription(fen, v.bestMove)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyLine(v.continuationArr, idx)}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 transition-colors"
                        title="Copy continuation moves"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => onPlayMove(v.bestMove)}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 transition-colors"
                        title="Force play this move"
                      >
                        <Play className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    </div>
                  </div>

                  {v.continuationArr && v.continuationArr.length > 0 ? (
                    <div className="text-[11px] font-mono text-neutral-400 break-all bg-neutral-950/50 p-2 rounded border border-neutral-850/50 flex flex-wrap gap-1">
                      {v.continuationArr.map((m, mIdx) => (
                        <span key={mIdx} className="hover:text-amber-400 cursor-pointer" onClick={() => onPlayMove(m)}>
                          {mIdx % 2 === 0 ? `${Math.floor(mIdx / 2) + 1}. ` : ''}
                          <strong className="font-medium text-neutral-300">{m}</strong>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-600 font-mono italic">No moves calculated...</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
