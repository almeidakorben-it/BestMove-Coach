export interface PgnStep {
  san: string;
  fen: string;
  from: string;
  to: string;
}

export interface AnalysisVariant {
  bestMove: string;
  eval?: number;
  mate?: number | null;
  winChance?: number;
  continuationArr?: string[];
}

export interface AnalysisResult {
  bestMove: string;
  eval?: number;
  mate?: number | null;
  winChance?: number;
  depth?: number;
  continuationArr?: string[];
  text?: string;
  variants?: AnalysisVariant[];
  status?: 'idle' | 'analyzing' | 'success' | 'error';
  errorMessage?: string;
}

export type GameMode = 'analysis' | 'training' | 'blunder' | 'mate';

export interface SavedSession {
  id: string;
  name: string;
  fen: string;
  pgn: string;
  createdAt: number;
}

export interface BlunderReport {
  userMove: string;
  bestMove: string;
  userEval?: number;
  bestEval?: number;
  userWinChance?: number;
  bestWinChance?: number;
  isBlunder: boolean;
  isMistake: boolean;
  isInaccuracy: boolean;
  scoreDifference: number;
}
