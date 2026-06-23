import React, { useState } from 'react';
import { RotateCcw, RefreshCw, Undo2, Copy, Share2, Download, Upload, Check } from 'lucide-react';

interface ControlPanelProps {
  fen: string;
  pgn: string;
  depth: number;
  setDepth: (depth: number) => void;
  variantsCount: number;
  setVariantsCount: (count: number) => void;
  onReset: () => void;
  onFlip: () => void;
  onUndo: () => void;
  onImportFen: (fen: string) => void;
  onImportPgn: (pgn: string) => void;
}

export default function ControlPanel({
  fen,
  pgn,
  depth,
  setDepth,
  variantsCount,
  setVariantsCount,
  onReset,
  onFlip,
  onUndo,
  onImportFen,
  onImportPgn,
}: ControlPanelProps) {
  const [copiedType, setCopiedType] = useState<'fen' | 'pgn' | 'share' | null>(null);
  const [importText, setImportText] = useState('');
  const [importType, setImportType] = useState<'fen' | 'pgn'>('fen');
  const [importError, setImportError] = useState('');

  const triggerCopy = (text: string, type: 'fen' | 'pgn' | 'share') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleShareUrl = () => {
    // Generate a shareable URL containing the current FEN encoded
    const encodedFen = encodeURIComponent(fen);
    const shareUrl = `${window.location.origin}${window.location.pathname}?fen=${encodedFen}`;
    triggerCopy(shareUrl, 'share');
  };

  const handleImportSubmit = () => {
    setImportError('');
    const trimmed = importText.trim();
    if (!trimmed) {
      setImportError('Please enter some text to import.');
      return;
    }

    if (importType === 'fen') {
      // Basic FEN validation: 6 parts separated by space
      const parts = trimmed.split(/\s+/);
      if (parts.length < 4) {
        setImportError('Invalid FEN format. Must contain at least 4 fields.');
        return;
      }
      onImportFen(trimmed);
      setImportText('');
    } else {
      // Import PGN
      onImportPgn(trimmed);
      setImportText('');
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col gap-6" id="control-panel">
      {/* Primary Actions */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider">Board Controls</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onUndo}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-neutral-200 hover:text-white rounded-lg text-xs font-medium transition-all border border-neutral-700/50"
            title="Undo last move"
            id="btn-undo"
          >
            <Undo2 className="w-4 h-4 text-amber-500" />
            <span>Undo</span>
          </button>
          <button
            onClick={onFlip}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-neutral-200 hover:text-white rounded-lg text-xs font-medium transition-all border border-neutral-700/50"
            title="Flip board orientation"
            id="btn-flip"
          >
            <RefreshCw className="w-4 h-4 text-emerald-500" />
            <span>Flip</span>
          </button>
          <button
            onClick={onReset}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-750 text-neutral-200 hover:text-white rounded-lg text-xs font-medium transition-all border border-neutral-700/50"
            title="Reset to starting position"
            id="btn-reset"
          >
            <RotateCcw className="w-4 h-4 text-rose-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Engine Settings */}
      <div className="border-t border-neutral-800 pt-4">
        <h3 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider">Stockfish Parameters</h3>
        <div className="flex flex-col gap-4">
          {/* Depth Selection */}
          <div>
            <div className="flex justify-between items-center text-xs text-neutral-300 mb-1.5 font-medium">
              <span>Target Depth:</span>
              <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">{depth} plies</span>
            </div>
            <input
              type="range"
              min="8"
              max="18"
              step="1"
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              id="slider-depth"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
              <span>8 (Fast)</span>
              <span>13 (Medium)</span>
              <span>18 (Deep)</span>
            </div>
          </div>

          {/* Variants Selection */}
          <div>
            <div className="flex justify-between items-center text-xs text-neutral-300 mb-1.5 font-medium">
              <span>Candidate Lines:</span>
              <span className="font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/30">{variantsCount} lines</span>
            </div>
            <div className="grid grid-cols-5 gap-1" id="variants-selectors">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setVariantsCount(num)}
                  className={`py-1 rounded-md text-xs font-semibold font-mono transition-all border ${
                    variantsCount === num
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                      : 'bg-neutral-850 text-neutral-400 border-neutral-850 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copy Board State / Share */}
      <div className="border-t border-neutral-800 pt-4 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Share & Export</h3>
        
        {/* Copy FEN */}
        <button
          onClick={() => triggerCopy(fen, 'fen')}
          className="w-full flex items-center justify-between py-2 px-3 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-mono transition-all border border-neutral-800 group"
          id="btn-copy-fen"
        >
          <span className="truncate pr-4 text-left font-mono">FEN: {fen}</span>
          {copiedType === 'fen' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
          )}
        </button>

        {/* Copy PGN */}
        <button
          onClick={() => triggerCopy(pgn || '[Event "Casual Play"]\n\n*', 'pgn')}
          className="w-full flex items-center justify-between py-2 px-3 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-mono transition-all border border-neutral-800 group"
          id="btn-copy-pgn"
        >
          <span className="truncate pr-4 text-left font-mono">PGN: {pgn || 'No moves yet...'}</span>
          {copiedType === 'pgn' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
          )}
        </button>

        {/* Share Analysis URL */}
        <button
          onClick={handleShareUrl}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-all shadow-md mt-1"
          id="btn-share-url"
        >
          {copiedType === 'share' ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Copied Share Link!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Copy Analysis Share Link</span>
            </>
          )}
        </button>
      </div>

      {/* Import Panel */}
      <div className="border-t border-neutral-800 pt-4">
        <h3 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider">Import Position</h3>
        <div className="flex gap-2 mb-2 bg-neutral-950 p-1 rounded-md" id="import-type-selector">
          <button
            onClick={() => { setImportType('fen'); setImportError(''); }}
            className={`flex-1 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
              importType === 'fen' ? 'bg-neutral-850 text-amber-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            FEN String
          </button>
          <button
            onClick={() => { setImportType('pgn'); setImportError(''); }}
            className={`flex-1 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
              importType === 'pgn' ? 'bg-neutral-850 text-amber-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            PGN / Moves
          </button>
        </div>

        {importType === 'pgn' && (
          <div className="text-[11px] text-neutral-400 mb-2 px-1 leading-normal" id="pgn-mentor-link-container">
            Tip: Download grandmaster game databases and openings from{' '}
            <a 
              href="https://www.pgnmentor.com/files.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-amber-400 hover:underline font-bold inline-flex items-center gap-0.5"
            >
              PGN Mentor
            </a>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <textarea
            value={importText}
            onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
            placeholder={
              importType === 'fen'
                ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
                : '1. e4 e5 2. Nf3 Nc6 3. Bb5 ...'
            }
            className="w-full h-18 bg-neutral-950 border border-neutral-850 rounded-lg p-2.5 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 font-mono resize-none"
            id="textarea-import"
          />
          {importError && (
            <p className="text-[11px] text-rose-400 font-medium" id="import-error-msg">{importError}</p>
          )}
          <button
            onClick={handleImportSubmit}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-neutral-700/40"
            id="btn-submit-import"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Into Coach</span>
          </button>
        </div>
      </div>
    </div>
  );
}
