import React, { useState, useEffect } from 'react';
import { SavedSession } from '../types';
import { Save, FolderOpen, Trash2, Check, Clock, Edit2 } from 'lucide-react';

interface SavedSessionsProps {
  currentFen: string;
  currentPgn: string;
  onLoadSession: (fen: string, pgn: string) => void;
}

export default function SavedSessions({
  currentFen,
  currentPgn,
  onLoadSession,
}: SavedSessionsProps) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bestmove_sessions');
      if (stored) {
        setSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading saved sessions:', e);
    }
  }, []);

  const saveSessionsToStorage = (updatedList: SavedSession[]) => {
    setSessions(updatedList);
    localStorage.setItem('bestmove_sessions', JSON.stringify(updatedList));
  };

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToUse = sessionName.trim() || `Session - ${new Date().toLocaleTimeString()}`;
    
    const newSession: SavedSession = {
      id: crypto.randomUUID(),
      name: nameToUse,
      fen: currentFen,
      pgn: currentPgn,
      createdAt: Date.now(),
    };

    const updated = [newSession, ...sessions];
    saveSessionsToStorage(updated);
    setSessionName('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    saveSessionsToStorage(updated);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col gap-4 animate-fade-in" id="saved-sessions-panel">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
        <FolderOpen className="w-4 h-4 text-amber-500" />
        Saved Sessions
      </h3>

      {/* Save Session Form */}
      <form onSubmit={handleSaveCurrent} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Save current board position..."
            className="flex-1 bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-1.5 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 font-sans"
            id="input-session-name"
          />
          <button
            type="submit"
            className="px-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-550 text-neutral-950 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0"
            id="btn-save-session"
          >
            {saveSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saveSuccess ? 'Saved!' : 'Save'}</span>
          </button>
        </div>
      </form>

      {/* Sessions List */}
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1" id="saved-sessions-list">
        {sessions.length === 0 ? (
          <div className="text-xs text-neutral-500 text-center py-4 italic border border-dashed border-neutral-800 rounded-lg bg-neutral-950/20">
            No saved sessions yet.
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => onLoadSession(s.fen, s.pgn)}
              className="flex items-center justify-between p-2.5 bg-neutral-850 hover:bg-neutral-800 border border-neutral-850 rounded-lg cursor-pointer transition-all group"
            >
              <div className="flex flex-col gap-0.5 truncate pr-2">
                <span className="text-xs font-semibold text-neutral-200 group-hover:text-amber-400 transition-colors truncate">
                  {s.name}
                </span>
                <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-mono">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>

              <button
                onClick={(e) => handleDeleteSession(s.id, e)}
                className="p-1.5 hover:bg-neutral-750 rounded text-neutral-500 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
                title="Delete saved session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
