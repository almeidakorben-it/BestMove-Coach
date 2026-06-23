import React, { useRef, useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Compass, Undo2, RefreshCw, RotateCcw } from 'lucide-react';
import { AnalysisResult } from '../types';
import { getMoveFromAndTo } from '../utils/chessHelpers';

interface ChessAnalysisBoardProps {
  fen: string;
  onMovePlayed: (from: string, to: string, promotion?: string) => void;
  orientation: 'white' | 'black';
  analysis: AnalysisResult;
  showBestMoveArrow: boolean;
  trainingMode: boolean;
  trainingGuessed: boolean;
  userLastMove?: { from: string; to: string } | null;
  interactive?: boolean;
  isEditorMode?: boolean;
  activeEditorTool?: string;
  onSquareClick?: (square: string) => void;
  onUndo?: () => void;
  onFlip?: () => void;
  onReset?: () => void;
  useBeginnerFriendlyMoves?: boolean;
}

export default function ChessAnalysisBoard({
  fen,
  onMovePlayed,
  orientation,
  analysis,
  showBestMoveArrow,
  trainingMode,
  trainingGuessed,
  userLastMove,
  interactive = true,
  isEditorMode = false,
  activeEditorTool = 'move',
  onSquareClick,
  onUndo,
  onFlip,
  onReset,
  useBeginnerFriendlyMoves = true,
}: ChessAnalysisBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(450);

  // Responsive Board Sizing via ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.min(entry.contentRect.width, 560);
        if (width > 280) {
          setBoardWidth(width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Helper to query piece details
  const getPieceDetails = (square: string) => {
    try {
      const chess = new Chess(fen);
      const piece = chess.get(square as any);
      if (!piece) return null;
      
      const names: Record<string, string> = {
        p: 'Pawn',
        n: 'Knight',
        b: 'Bishop',
        r: 'Rook',
        q: 'Queen',
        k: 'King',
      };
      
      const name = names[piece.type] || 'Piece';
      const colorName = piece.color === 'w' ? 'White' : 'Black';
      return { name, color: piece.color, colorName };
    } catch (e) {
      return null;
    }
  };

  const hasMovesPlayed = userLastMove !== null && userLastMove !== undefined;

  // Determine arrows to draw
  const customArrows: [string, string, string?][] = [];

  // Draw best move arrow if enabled or if at least one move has been played
  const shouldShowBestMove = showBestMoveArrow || hasMovesPlayed;
  if (shouldShowBestMove && analysis.bestMove) {
    const arrowCoords = getMoveFromAndTo(fen, analysis.bestMove);
    if (arrowCoords) {
      customArrows.push([arrowCoords.from, arrowCoords.to, 'rgba(16, 185, 129, 0.85)']); // Emerald
    }
  }

  // Draw last move played by user
  if (userLastMove) {
    customArrows.push([userLastMove.from, userLastMove.to, 'rgba(239, 68, 68, 0.4)']); // Light Red for tracking
  }

  // Compute square styles for highlighting
  const squareStyles: Record<string, React.CSSProperties> = {};

  // Highlight user last move squares
  if (userLastMove) {
    squareStyles[userLastMove.from] = {
      backgroundColor: 'rgba(59, 130, 246, 0.2)', // Translucent blue
    };
    squareStyles[userLastMove.to] = {
      backgroundColor: 'rgba(59, 130, 246, 0.25)', // Slightly stronger translucent blue
    };
  }

  // Highlight best move squares if enabled or if at least one move has been played
  if (shouldShowBestMove && analysis.bestMove) {
    const coords = getMoveFromAndTo(fen, analysis.bestMove);
    if (coords) {
      // Highlight what piece to use (from square) in warm high-contrast golden/amber
      squareStyles[coords.from] = {
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0.15) 100%)',
        boxShadow: 'inset 0 0 0 3px #f59e0b, 0 0 12px rgba(245, 158, 11, 0.6)',
        borderRadius: '6px',
      };
      
      // Highlight the target square (best next move) in rich high-contrast emerald/green
      squareStyles[coords.to] = {
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.15) 100%)',
        boxShadow: 'inset 0 0 0 3px #10b981, 0 0 12px rgba(16, 185, 129, 0.6)',
        borderRadius: '6px',
      };
    }
  }

  // Calculate evaluation bar metrics
  const winChance = analysis.winChance ?? 50;
  
  // Bar styling: White is white, Black is dark grey/black
  // We align the white percentage with orientation. If white is at the bottom, white filling is at the bottom.
  const isWhiteOnBottom = orientation === 'white';
  const displayWhitePercent = isWhiteOnBottom ? winChance : 100 - winChance;
  const displayBlackPercent = 100 - displayWhitePercent;

  // Render evaluation score text
  const getEvalText = () => {
    if (analysis.mate !== undefined && analysis.mate !== null) {
      return `M${analysis.mate}`;
    }
    if (analysis.eval !== undefined) {
      const isPawnUnits = Math.abs(analysis.eval) < 50;
      const score = isPawnUnits ? analysis.eval : analysis.eval / 100;
      const sign = score > 0 ? '+' : '';
      return `${sign}${score.toFixed(1)}`;
    }
    return '';
  };

  const evalText = getEvalText();

  const handlePieceDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (!interactive) return false;
    
    // Support pawn promotion (auto promote to queen for simplicity, unless we want a selector)
    const isPawn = piece[1] === 'P';
    const isPromotionRow = (piece[0] === 'w' && targetSquare[1] === '8') || (piece[0] === 'b' && targetSquare[1] === '1');
    const promotion = isPawn && isPromotionRow ? 'q' : undefined;

    onMovePlayed(sourceSquare, targetSquare, promotion);
    return true;
  };

  const bestMoveCoords = analysis.bestMove ? getMoveFromAndTo(fen, analysis.bestMove) : null;
  const recommendedPiece = bestMoveCoords ? getPieceDetails(bestMoveCoords.from) : null;

  return (
    <div className="flex flex-col gap-3 w-full" id="chess-board-and-coach-wrapper">
      {/* Quick Access Top Left Controls */}
      {(onUndo || onFlip || onReset) && (
        <div className="flex items-center justify-between w-full" id="board-top-controls">
          <div className="flex items-center gap-1.5" id="top-left-buttons">
            {onUndo && (
              <button
                onClick={onUndo}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/80 hover:bg-neutral-800 active:bg-neutral-750 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-neutral-800 hover:border-neutral-700 shadow-sm"
                title="Undo last move"
                id="top-btn-undo"
              >
                <Undo2 className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>Undo</span>
              </button>
            )}
            {onFlip && (
              <button
                onClick={onFlip}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/80 hover:bg-neutral-800 active:bg-neutral-750 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-neutral-800 hover:border-neutral-700 shadow-sm"
                title="Flip Board Orientation"
                id="top-btn-flip"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                <span>Flip</span>
              </button>
            )}
            {onReset && (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/80 hover:bg-neutral-800 active:bg-neutral-750 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-neutral-800 hover:border-neutral-700 shadow-sm"
                title="Reset Board to Starting Position"
                id="top-btn-reset"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-row items-stretch gap-4 w-full" id="board-layout-container">
        {/* Evaluation Bar */}
        {!trainingMode && (
          <div 
            className="w-7 md:w-9 bg-neutral-800 rounded-lg overflow-hidden flex flex-col relative border border-neutral-700 shadow-inner select-none shrink-0" 
            style={{ height: `${boardWidth}px` }}
            id="evaluation-bar"
          >
            {/* Flipped representation: we partition Black and White sections */}
            <div 
              className="transition-all duration-500 ease-out bg-neutral-950 flex items-center justify-center text-[10px] md:text-xs font-mono font-semibold text-neutral-400"
              style={{ height: `${displayBlackPercent}%` }}
            >
              {!isWhiteOnBottom && evalText && (
                <span className="rotate-180 writing-mode-vertical py-2">{evalText}</span>
              )}
            </div>
            
            <div 
              className="transition-all duration-500 ease-out bg-neutral-100 flex items-center justify-center text-[10px] md:text-xs font-mono font-semibold text-neutral-800 border-t border-neutral-300"
              style={{ height: `${displayWhitePercent}%` }}
            >
              {isWhiteOnBottom && evalText && (
                <span className="py-2">{evalText}</span>
              )}
            </div>

            {/* Centered line */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-amber-500/50 pointer-events-none" />
          </div>
        )}

        {/* Responsive Chessboard Container */}
        <div 
          ref={containerRef} 
          className="flex-1 bg-neutral-900 rounded-xl p-2 border border-neutral-800 shadow-xl relative" 
          id="chessboard-container"
        >
          <Chessboard
            options={{
              position: fen,
              onPieceDrop: ({ sourceSquare, targetSquare, piece }) => {
                if (!targetSquare) return false;
                return handlePieceDrop(sourceSquare, targetSquare, piece.pieceType);
              },
              onSquareClick: onSquareClick ? ({ square }) => onSquareClick(square) : undefined,
              boardOrientation: orientation,
              arrows: customArrows.map(([start, end, color]) => ({
                startSquare: start,
                endSquare: end,
                color: color || 'rgba(16, 185, 129, 0.85)',
              })),
              allowDragging: interactive || isEditorMode,
              boardStyle: {
                borderRadius: '8px',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4)',
                width: boardWidth,
                height: boardWidth,
              },
              darkSquareStyle: { backgroundColor: '#718096' },
              lightSquareStyle: { backgroundColor: '#e2e8f0' },
              squareStyles,
            }}
          />

          {/* Training Mode Overlay */}
          {trainingMode && !trainingGuessed && (
            <div className="absolute top-4 right-4 bg-amber-500/90 text-neutral-900 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase animate-pulse shadow-md pointer-events-none select-none">
              🎯 Guess the Move
            </div>
          )}
        </div>
      </div>

      {/* Coach Advice Card */}
      {hasMovesPlayed && bestMoveCoords && recommendedPiece && (
        <div className="p-3.5 bg-neutral-950 border border-neutral-800/80 rounded-xl flex items-center justify-between gap-3 shadow-md animate-fade-in" id="coach-advice-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-inner">
              <Compass className="w-4.5 h-4.5 shrink-0" />
            </div>
            <div className="text-xs leading-relaxed text-neutral-300">
              <span className="text-neutral-400 font-medium">Coach Recommendation:</span>{' '}
              {useBeginnerFriendlyMoves ? (
                <>
                  Move the{' '}
                  <strong className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/10">
                    {recommendedPiece.colorName} {recommendedPiece.name}
                  </strong>{' '}
                  on{' '}
                  <strong className="text-amber-300 font-mono font-bold bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                    {bestMoveCoords.from}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {bestMoveCoords.to}
                  </strong>
                </>
              ) : (
                <>
                  Play{' '}
                  <strong className="text-amber-400 font-mono font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/10">
                    {analysis.bestMove}
                  </strong>{' '}
                  (move{' '}
                  <strong className="text-neutral-300 font-mono font-semibold">
                    {bestMoveCoords.from}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-emerald-400 font-mono font-semibold">
                    {bestMoveCoords.to}
                  </strong>
                  )
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-neutral-500 bg-neutral-900/50 px-2.5 py-1 rounded-md border border-neutral-850">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Analysis Hint</span>
          </div>
        </div>
      )}
    </div>
  );
}
