import React from 'react';
import { ToggleLeft, ToggleRight, Trash2, RotateCcw, Wrench, Eraser, Move, HelpCircle } from 'lucide-react';

interface CustomStateCreatorProps {
  isEditorMode: boolean;
  setIsEditorMode: (val: boolean) => void;
  activeEditorTool: string;
  setActiveEditorTool: (tool: string) => void;
  activeTurnColor: 'w' | 'b';
  onToggleTurnColor: () => void;
  onClearBoard: () => void;
  onResetStandard: () => void;
}

export default function CustomStateCreator({
  isEditorMode,
  setIsEditorMode,
  activeEditorTool,
  setActiveEditorTool,
  activeTurnColor,
  onToggleTurnColor,
  onClearBoard,
  onResetStandard,
}: CustomStateCreatorProps) {
  
  const whitePieces = [
    { code: 'wk', symbol: '♔', label: 'White King' },
    { code: 'wq', symbol: '♕', label: 'White Queen' },
    { code: 'wr', symbol: '♖', label: 'White Rook' },
    { code: 'wb', symbol: '♗', label: 'White Bishop' },
    { code: 'wn', symbol: '♘', label: 'White Knight' },
    { code: 'wp', symbol: '♙', label: 'White Pawn' },
  ];

  const blackPieces = [
    { code: 'bk', symbol: '♚', label: 'Black King' },
    { code: 'bq', symbol: '♛', label: 'Black Queen' },
    { code: 'br', symbol: '♜', label: 'Black Rook' },
    { code: 'bb', symbol: '♝', label: 'Black Bishop' },
    { code: 'bn', symbol: '♞', label: 'Black Knight' },
    { code: 'bp', symbol: '♟', label: 'Black Pawn' },
  ];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col gap-4" id="custom-state-creator">
      
      {/* 1. Turn Color Indicator & Toggle */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            Whose Move / Turn Indicator
          </h3>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded transition-all ${
            activeTurnColor === 'w' ? 'bg-white text-neutral-950 font-black' : 'bg-neutral-950 text-neutral-300 border border-neutral-800'
          }`}>
            {activeTurnColor === 'w' ? 'White to Move' : 'Black to Move'}
          </span>
        </div>

        <div className="flex bg-neutral-950 p-1.5 rounded-lg border border-neutral-850 gap-1" id="turn-toggle-group">
          <button
            onClick={() => activeTurnColor !== 'w' && onToggleTurnColor()}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition-all ${
              activeTurnColor === 'w' 
                ? 'bg-neutral-800 text-white shadow' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-neutral-400" />
            White Analysis
          </button>
          <button
            onClick={() => activeTurnColor !== 'b' && onToggleTurnColor()}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition-all ${
              activeTurnColor === 'b' 
                ? 'bg-neutral-800 text-white shadow' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-950 border border-neutral-700" />
            Black Analysis
          </button>
        </div>
        <p className="text-[10px] text-neutral-500 mt-1.5 leading-relaxed font-sans">
          Toggle whose turn it is to let Stockfish instantly calculate the best move for White or Black in this position.
        </p>
      </div>

      {/* 2. Board Editor Mode Toggle */}
      <div className="border-t border-neutral-800 pt-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-neutral-200">Custom Position Editor</h3>
          </div>
          <button
            onClick={() => setIsEditorMode(!isEditorMode)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all flex items-center gap-1 border ${
              isEditorMode 
                ? 'bg-amber-500 text-neutral-950 border-amber-400 font-extrabold shadow-md' 
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
            }`}
          >
            {isEditorMode ? 'Active' : 'Disabled'}
          </button>
        </div>

        {isEditorMode ? (
          <div className="flex flex-col gap-4 bg-neutral-950/40 p-3.5 rounded-xl border border-neutral-800 animate-fade-in" id="editor-controls-box">
            <p className="text-[11px] text-amber-400 font-medium leading-relaxed mb-1">
              🛠️ <strong>Board Editor is active:</strong> Choose a piece tool from the trays below and click squares to insert/remove pieces, or drag pieces freely to create any position.
            </p>

            {/* Selection Trays */}
            <div className="flex flex-col gap-2.5">
              {/* Tool Tray (Move, Eraser) */}
              <div className="flex justify-between items-center gap-2 bg-neutral-950 p-1 rounded-md border border-neutral-900">
                <button
                  onClick={() => setActiveEditorTool('move')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-bold uppercase transition-all ${
                    activeEditorTool === 'move' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  title="Free drag and place pieces"
                >
                  <Move className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Free Drag</span>
                </button>
                <button
                  onClick={() => setActiveEditorTool('eraser')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-bold uppercase transition-all ${
                    activeEditorTool === 'eraser' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  title="Click on any piece to delete it"
                >
                  <Eraser className="w-3.5 h-3.5 text-rose-400" />
                  <span>Eraser</span>
                </button>
              </div>

              {/* White Pieces Palette */}
              <div>
                <div className="text-[10px] text-neutral-500 font-bold mb-1 uppercase tracking-wider">White Pieces</div>
                <div className="grid grid-cols-6 gap-1 bg-neutral-900 p-1 rounded-md border border-neutral-850">
                  {whitePieces.map((p) => (
                    <button
                      key={p.code}
                      onClick={() => setActiveEditorTool(p.code)}
                      className={`h-9 rounded flex items-center justify-center text-xl font-medium transition-all ${
                        activeEditorTool === p.code 
                          ? 'bg-amber-500 text-neutral-950 border border-amber-400 shadow scale-105' 
                          : 'text-neutral-200 hover:bg-neutral-800 hover:text-white'
                      }`}
                      title={p.label}
                    >
                      {p.symbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Black Pieces Palette */}
              <div>
                <div className="text-[10px] text-neutral-500 font-bold mb-1 uppercase tracking-wider">Black Pieces</div>
                <div className="grid grid-cols-6 gap-1 bg-neutral-900 p-1 rounded-md border border-neutral-850">
                  {blackPieces.map((p) => (
                    <button
                      key={p.code}
                      onClick={() => setActiveEditorTool(p.code)}
                      className={`h-9 rounded flex items-center justify-center text-xl font-medium transition-all ${
                        activeEditorTool === p.code 
                          ? 'bg-amber-500 text-neutral-950 border border-amber-400 shadow scale-105' 
                          : 'text-neutral-200 hover:bg-neutral-800 hover:text-white'
                      }`}
                      title={p.label}
                    >
                      {p.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Board Utilities */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-neutral-850">
              <button
                onClick={onClearBoard}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 rounded-lg text-xs font-bold transition-all border border-rose-900/30"
                id="btn-clear-board"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Board</span>
              </button>
              <button
                onClick={onResetStandard}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 rounded-lg text-xs font-bold transition-all border border-neutral-700/40"
                id="btn-setup-standard"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>Starting Position</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
            To customize the piece layout or create custom endgame/tactical positions, activate the Custom Position Editor toggle.
          </p>
        )}
      </div>
    </div>
  );
}
