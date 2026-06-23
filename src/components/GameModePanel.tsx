import React, { useState } from 'react';
import { GameMode, BlunderReport } from '../types';
import { Eye, ShieldAlert, Brain, Target, ArrowRight, Zap, Search, Dices } from 'lucide-react';
import { PRESET_POSITIONS } from '../utils/chessHelpers';

interface GameModePanelProps {
  currentMode: GameMode;
  setMode: (mode: GameMode) => void;
  blunderReport?: BlunderReport | null;
  onSelectPreset: (fen: string) => void;
}

export default function GameModePanel({
  currentMode,
  setMode,
  blunderReport,
  onSelectPreset,
}: GameModePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPositions = PRESET_POSITIONS.filter(pos => 
    pos.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    pos.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRandomSelect = () => {
    if (PRESET_POSITIONS.length === 0) return;
    const randomIndex = Math.floor(Math.random() * PRESET_POSITIONS.length);
    const randomPosition = PRESET_POSITIONS[randomIndex];
    onSelectPreset(randomPosition.fen);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col gap-4" id="game-mode-panel">
      {/* Tab Selectors */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider">Coach Mode</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2" id="mode-tabs">
          {[
            { id: 'analysis', label: 'Analysis', icon: Eye, color: 'text-emerald-400' },
            { id: 'training', label: 'Training', icon: Brain, color: 'text-amber-400' },
            { id: 'blunder', label: 'Blunder Check', icon: ShieldAlert, color: 'text-rose-400' },
            { id: 'mate', label: 'Find Mate', icon: Target, color: 'text-indigo-400' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as GameMode)}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-neutral-800 text-white border-neutral-700 shadow-md scale-[1.02]'
                    : 'bg-neutral-850 text-neutral-400 border-transparent hover:bg-neutral-800 hover:text-neutral-200'
                }`}
                id={`tab-mode-${tab.id}`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span className="text-xs font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Instructions */}
      <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-850 text-xs text-neutral-400 leading-relaxed" id="mode-explanation">
        {currentMode === 'analysis' && (
          <p>
            <strong>Standard Analysis:</strong> Drag chess pieces freely. Stockfish evaluates each position instantly and displays candidate paths with precise evaluation scores.
          </p>
        )}
        {currentMode === 'training' && (
          <p>
            <strong>Training Mode:</strong> Move hints and calculations are completely hidden. Drag a piece to make your guess for the best tactical move in the position.
          </p>
        )}
        {currentMode === 'blunder' && (
          <p>
            <strong>Blunder Check:</strong> Play your candidate moves. Stockfish evaluates both your move and the optimal move, triggering alerts if you drop more than 5% win chance.
          </p>
        )}
        {currentMode === 'mate' && (
          <p>
            <strong>Find Mate:</strong> Focuses heavily on forced checkmating combinations. Highly recommended for solving tactical puzzles and practicing winning blow formulas.
          </p>
        )}
      </div>

      {/* Blunder Report Alert Card */}
      {currentMode === 'blunder' && blunderReport && (
        <div 
          className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${
            blunderReport.isBlunder 
              ? 'bg-rose-950/15 border-rose-900/30 text-rose-300'
              : blunderReport.isMistake
                ? 'bg-amber-950/15 border-amber-900/30 text-amber-300'
                : blunderReport.isInaccuracy
                  ? 'bg-yellow-950/10 border-yellow-900/20 text-yellow-300'
                  : 'bg-emerald-950/15 border-emerald-900/30 text-emerald-300'
          }`}
          id="blunder-report-card"
        >
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 shrink-0 ${
              blunderReport.isBlunder ? 'text-rose-400' : blunderReport.isMistake ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            <h4 className="font-bold text-sm tracking-wide">
              {blunderReport.isBlunder 
                ? 'Blunder Detected!' 
                : blunderReport.isMistake 
                  ? 'Mistake Made' 
                  : blunderReport.isInaccuracy 
                    ? 'Inaccuracy Played' 
                    : 'Optimal Move Played!'}
            </h4>
          </div>

          <div className="text-xs flex flex-col gap-1 font-sans">
            <div>
              You played: <strong className="font-mono bg-neutral-900 px-1 py-0.5 rounded">{blunderReport.userMove}</strong>
            </div>
            {blunderReport.isBlunder || blunderReport.isMistake || blunderReport.isInaccuracy ? (
              <>
                <div>
                  Stockfish recommended: <strong className="font-mono text-emerald-400 bg-neutral-900 px-1 py-0.5 rounded">{blunderReport.bestMove}</strong>
                </div>
                <div className="mt-1 text-[11px] opacity-90 border-t border-neutral-800/40 pt-1.5 flex justify-between">
                  <span>Win Chance drop:</span>
                  <span className="font-mono font-bold">-{blunderReport.scoreDifference.toFixed(1)}%</span>
                </div>
              </>
            ) : (
              <p className="text-[11px] opacity-80 mt-1">Excellent vision. Your move matches Stockfish's top recommendation perfectly.</p>
            )}
          </div>
        </div>
      )}

      {/* Preset Positions Selector */}
      <div className="border-t border-neutral-800 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Practice Positions</h3>
          
          <button
            onClick={handleRandomSelect}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all shadow-sm shrink-0"
            title="Randomize board into a real game state"
            id="btn-random-position"
          >
            <Dices className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Random Position</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search openings, endgames, tactics..."
            className="w-full bg-neutral-950 border border-neutral-850 rounded-lg pl-9 pr-12 py-1.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 font-sans"
            id="search-positions-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-300 text-[10px] font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Practice Positions List with scrollable container */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-800" id="preset-positions-list">
          {filteredPositions.length > 0 ? (
            filteredPositions.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPreset(preset.fen)}
                className="flex items-start justify-between w-full p-2.5 bg-neutral-850 hover:bg-neutral-800 border border-neutral-850 rounded-lg text-left transition-all group"
              >
                <div className="flex flex-col gap-0.5 pr-2">
                  <span className="text-xs font-bold text-neutral-200 group-hover:text-amber-400 transition-colors">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-neutral-500 leading-normal">
                    {preset.description}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-amber-400 self-center shrink-0 transition-all" />
              </button>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-neutral-500 bg-neutral-950/20 rounded-lg border border-neutral-850/30">
              No positions match "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
