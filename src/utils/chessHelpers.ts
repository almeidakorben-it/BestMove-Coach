import { Chess } from 'chess.js';

/**
 * Finds the starting and ending squares for a move in a given position.
 * This is crucial for drawing arrows on the board.
 */
export function getMoveFromAndTo(fen: string, apiMove: string): { from: string; to: string } | null {
  if (!apiMove) return null;
  
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    
    // Normalize apiMove (remove check '+' and mate '#' signs, and convert to lowercase/uppercase properly)
    const cleanApiMove = apiMove.replace(/[+#]/g, '').trim();
    
    // 1. Try matching by SAN (Standard Algebraic Notation, e.g., "Nf3", "O-O")
    let match = moves.find(m => m.san.replace(/[+#]/g, '') === cleanApiMove);
    if (match) return { from: match.from, to: match.to };
    
    // 2. Try matching by LAN (Long Algebraic Notation, e.g., "g1f3")
    match = moves.find(m => m.lan.replace(/[+#]/g, '') === cleanApiMove || m.lan === cleanApiMove);
    if (match) return { from: match.from, to: match.to };

    // 3. Try matching by from-to coordinate string directly (e.g., "e2e4")
    if (cleanApiMove.length >= 4) {
      const from = cleanApiMove.substring(0, 2);
      const to = cleanApiMove.substring(2, 4);
      const validSquare = /^[a-h][1-8]$/;
      if (validSquare.test(from) && validSquare.test(to)) {
        return { from, to };
      }
    }
  } catch (e) {
    console.error('Error in getMoveFromAndTo:', e);
  }
  return null;
}

/**
 * Generates a verbose, beginner-friendly description of a chess move.
 * Example: "Move Pawn from e2 to e4" or "Move Knight from f3 to d4 (capturing Bishop)"
 */
export function getVerboseMoveDescription(fen: string, apiMove: string): string {
  if (!apiMove) return '';
  
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    
    const cleanApiMove = apiMove.replace(/[+#]/g, '').trim();
    
    // 1. Try matching by SAN
    let match = moves.find(m => m.san.replace(/[+#]/g, '') === cleanApiMove);
    
    // 2. Try matching by LAN
    if (!match) {
      match = moves.find(m => m.lan.replace(/[+#]/g, '') === cleanApiMove || m.lan === cleanApiMove);
    }

    // 3. Try matching by from-to coordinate string directly (e.g., "e2e4")
    if (!match && cleanApiMove.length >= 4) {
      const from = cleanApiMove.substring(0, 2);
      const to = cleanApiMove.substring(2, 4);
      match = moves.find(m => m.from === from && m.to === to);
    }

    if (match) {
      const names: Record<string, string> = {
        p: 'Pawn',
        n: 'Knight',
        b: 'Bishop',
        r: 'Rook',
        q: 'Queen',
        k: 'King',
      };

      const pieceName = names[match.piece] || 'Piece';
      const fromSq = match.from;
      const toSq = match.to;
      
      // Check for Castling
      if (match.flags.includes('k')) {
        return `Castle Kingside (O-O) with King to ${toSq}`;
      }
      if (match.flags.includes('q')) {
        return `Castle Queenside (O-O-O) with King to ${toSq}`;
      }

      // Check for capture
      let captureStr = '';
      if (match.captured) {
        const capturedName = names[match.captured] || 'piece';
        captureStr = ` (capturing ${capturedName})`;
      } else if (match.flags.includes('e')) {
        captureStr = ` (capturing Pawn en passant)`;
      }

      // Check for promotion
      let promotionStr = '';
      if (match.promotion) {
        const promoName = names[match.promotion] || 'Queen';
        promotionStr = ` promoting to ${promoName}`;
      }

      return `Move ${pieceName} from ${fromSq} to ${toSq}${captureStr}${promotionStr}`;
    }
  } catch (e) {
    console.error('Error in getVerboseMoveDescription:', e);
  }

  // Fallback to basic coordinate parse
  try {
    const clean = apiMove.replace(/[+#]/g, '').trim();
    if (clean.length >= 4) {
      const from = clean.substring(0, 2);
      const to = clean.substring(2, 4);
      return `Move from ${from} to ${to}`;
    }
  } catch {}

  return apiMove;
}

/**
 * Translates raw engine text (like "Move g1 → f3 (Nf3): [0.34]") to beginner friendly notation (like "Move Knight from g1 to f3 (Nf3): [0.34]")
 */
export function getVerboseAnalysisText(fen: string, text: string): string {
  if (!text) return '';
  
  try {
    const regex = /Move\s+([a-h][1-8])\s*(?:[\u2192\u21d2→to-])\s*([a-h][1-8])\s*(?:\(([^)]+)\))?/gi;
    
    return text.replace(regex, (match, from, to, san) => {
      try {
        const chess = new Chess(fen);
        const piece = chess.get(from as any);
        if (piece) {
          const names: Record<string, string> = {
            p: 'Pawn',
            n: 'Knight',
            b: 'Bishop',
            r: 'Rook',
            q: 'Queen',
            k: 'King',
          };
          const pieceName = names[piece.type] || 'Piece';
          
          let result = `Move ${pieceName} from ${from} to ${to}`;
          if (san) {
            result += ` (${san})`;
          }
          return result;
        }
      } catch (e) {
        console.warn('Error parsing piece inside getVerboseAnalysisText replacement:', e);
      }
      return match;
    });
  } catch (err) {
    console.error('Error in getVerboseAnalysisText:', err);
    return text;
  }
}

/**
 * Format evaluation number (centipawns) or mate score into a human-readable string.
 */
export function formatEvaluation(evalScore: number | undefined, mate: number | null | undefined, turn: 'w' | 'b'): string {
  if (mate !== undefined && mate !== null) {
    return `M${Math.abs(mate)}`;
  }
  
  if (evalScore === undefined) return '0.00';
  
  // Convert centipawns to pawn units (e.g. 150 -> 1.50)
  // Check if eval is already in pawn units (sometimes API returns e.g. 1.5)
  const isPawnUnits = Math.abs(evalScore) < 50; 
  let score = isPawnUnits ? evalScore : evalScore / 100;
  
  // Stockfish may return evaluation from the perspective of the side to move.
  // Let's standardise it: positive is white advantage, negative is black advantage.
  if (turn === 'b') {
    // If it is black's turn and API returns score from black's perspective, we invert it for white-centric display
    // However, usually chess-api returns white-relative or side-relative. We will assume it's white-relative.
  }
  
  const sign = score > 0 ? '+' : '';
  return `${sign}${score.toFixed(2)}`;
}

/**
 * Common preset positions for training or rapid analysis.
 */
export const PRESET_POSITIONS = [
  {
    name: 'Starting Position',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    description: 'The standard starting layout.'
  },
  {
    name: 'Sicilian Defense: Najdorf',
    fen: 'rnbqkbnr/1p1ppppp/p7/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3',
    description: 'Sharpest and most popular counter-attacking line of the Sicilian Defense.'
  },
  {
    name: 'Ruy Lopez (Spanish Opening)',
    fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    description: 'Classical opening focusing on rapid kingside development and center pressure.'
  },
  {
    name: 'French Defense: Advance Variation',
    fen: 'rnbqkbnr/pp3ppp/2p1p3/3pP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4',
    description: 'Closed-center strategic battle with space advantage for White.'
  },
  {
    name: 'Caro-Kann Defense: Main Line',
    fen: 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    description: 'Solid, resilient counter-attacking opening for Black.'
  },
  {
    name: 'Queen\'s Gambit Accepted',
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2',
    description: 'Classical center pawn struggle, sacrificing the c-pawn temporarily.'
  },
  {
    name: 'Italian Game: Giuoco Piano',
    fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    description: 'Symmetric piece play aiming for active, rapid kingside play.'
  },
  {
    name: 'King\'s Indian Defense',
    fen: 'rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N5/PP2BPPP/R1BQK1NR b KQ - 5 5',
    description: 'Hypermodern defense where Black allows white center space to strike back later.'
  },
  {
    name: 'Scandinavian Defense',
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    description: 'Immediate center-pawn challenge after 1.e4 d5.'
  },
  {
    name: 'Lucena Position',
    fen: '1K6/1P1k4/8/8/8/8/1r6/5R2 w - - 0 1',
    description: 'Fundamental endgame theory: building a bridge to win with a rook and pawn.'
  },
  {
    name: 'Philidor Position',
    fen: '4k3/1r6/4R3/2P5/8/8/4K3/8 b - - 0 1',
    description: 'Key defensive technique in rook endgames: drawing a pawn down.'
  },
  {
    name: 'Opera Mate Puzzle',
    fen: '4kb1r/p2bqppp/5n2/1B2p1B1/4P3/1Q6/PP3PPP/2KR4 w k - 0 14',
    description: 'Morphy\'s famous mate in 2. White to move.'
  },
  {
    name: 'Smothered Mate Puzzle',
    fen: '6rk/5Npp/8/8/8/8/8/6QK b - - 0 1',
    description: 'A classical tactical finish. Black to move and get mated.'
  },
  {
    name: 'Anastasia\'s Mate Setup',
    fen: 'r4rk1/pp3ppp/2n5/1B1p4/4p3/1NP5/PP3qPP/R1B4K b - - 0 18',
    description: 'Famous mating net using a knight and rook against castled king.'
  },
  {
    name: 'Opposition Endgame (King + Pawn)',
    fen: '8/8/4k3/8/4P3/4K3/8/8 w - - 0 1',
    description: 'Testing the concept of vertical opposition. White must keep opposition to win.'
  },
  {
    name: 'Double Rook Endgame',
    fen: 'r3r1k1/ppp2ppp/8/8/8/8/PPP2PPP/R3R1K1 w - - 0 1',
    description: 'Even rook endgame requiring precise activity and king positioning.'
  },
  {
    name: 'Lasker vs Thomas Attack',
    fen: 'r1b2rk1/pp3ppp/2n1p3/q7/1b1PP3/3B1N2/PP1B1PPP/R2QK2R w KQ - 3 10',
    description: 'Position leading to Lasker\'s famous walking king mate hunt.'
  }
];
