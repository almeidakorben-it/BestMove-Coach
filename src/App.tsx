import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import ChessAnalysisBoard from './components/ChessAnalysisBoard';
import ControlPanel from './components/ControlPanel';
import AnalysisPanel from './components/AnalysisPanel';
import GameModePanel from './components/GameModePanel';
import SavedSessions from './components/SavedSessions';
import MoveHistoryNavigator from './components/MoveHistoryNavigator';
import CustomStateCreator from './components/CustomStateCreator';
import { AnalysisResult, GameMode, BlunderReport, PgnStep } from './types';
import { Sparkles, Trophy, BrainCircuit, RotateCcw } from 'lucide-react';
import { getVerboseMoveDescription } from './utils/chessHelpers';

export default function App() {
  // Game state
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [pgn, setPgn] = useState(game.pgn());
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [userLastMove, setUserLastMove] = useState<{ from: string; to: string } | null>(null);

  // Board Editor states
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [activeEditorTool, setActiveEditorTool] = useState('move');
  const [initialFen, setInitialFen] = useState<string>(() => new Chess().fen());

  // Game Move Navigator states
  const [pgnSteps, setPgnSteps] = useState<PgnStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);

  // Derived active turn color from current FEN
  const activeTurnColor = (fen.split(' ')[1] || 'w') as 'w' | 'b';

  // Stockfish configuration
  const [depth, setDepth] = useState(12);
  const [variantsCount, setVariantsCount] = useState(3);
  const [useBeginnerFriendlyMoves, setUseBeginnerFriendlyMoves] = useState(true);

  // Coach Modes
  const [currentMode, setMode] = useState<GameMode>('analysis');
  
  // Analysis results
  const [analysis, setAnalysis] = useState<AnalysisResult>({
    bestMove: '',
    status: 'idle',
  });

  // Training specific states
  const [hiddenAnalysis, setHiddenAnalysis] = useState<AnalysisResult | null>(null);
  const [trainingGuessed, setTrainingGuessed] = useState(false);
  const [trainingFeedback, setTrainingFeedback] = useState<{
    status: 'correct' | 'incorrect' | 'idle';
    message: string;
  }>({ status: 'idle', message: '' });

  // Blunder check specific states
  const [blunderReport, setBlunderReport] = useState<BlunderReport | null>(null);
  const [pendingBlunderValidation, setPendingBlunderValidation] = useState<{
    prevFen: string;
    prevAnalysis: AnalysisResult;
    userMove: string;
  } | null>(null);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup helper
  const closeWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  /**
   * Primary Stockfish query function
   * Integrates WebSockets for progressive streaming and falls back to HTTP POST
   */
  const triggerStockfishAnalysis = useCallback((targetFen: string, isForHiddenTraining = false) => {
    // Clear any pending analysis timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    closeWebSocket();

    // Set temporary status
    if (!isForHiddenTraining) {
      setAnalysis(prev => ({ ...prev, status: 'analyzing' }));
    }

    let wsUrl = 'wss://chess-api.com/v1';
    let socket: WebSocket;

    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        const payload = JSON.stringify({
          fen: targetFen,
          depth: depth,
          variants: variantsCount,
        });
        socket.send(payload);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          const result: AnalysisResult = {
            bestMove: data.bestMove || '',
            eval: data.eval,
            mate: data.mate,
            winChance: data.winChance ?? 50,
            depth: data.depth,
            continuationArr: data.continuationArr,
            text: data.text,
            variants: data.variants || [],
            status: 'success',
          };

          if (isForHiddenTraining) {
            setHiddenAnalysis(result);
          } else {
            setAnalysis(result);
          }
        } catch (e) {
          console.error('Error parsing WebSocket frame', e);
        }
      };

      socket.onerror = (err) => {
        console.warn('WebSocket encountered an error, falling back to HTTP POST', err);
        triggerPostFallback(targetFen, isForHiddenTraining);
      };

      // Auto-fallback if WebSocket remains silent for 3 seconds
      analysisTimeoutRef.current = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          console.warn('WebSocket failed to open in 3s, triggering POST fallback');
          closeWebSocket();
          triggerPostFallback(targetFen, isForHiddenTraining);
        }
      }, 3000);

    } catch (e) {
      console.warn('Failed to construct WebSocket, trying HTTP fallback', e);
      triggerPostFallback(targetFen, isForHiddenTraining);
    }
  }, [depth, variantsCount]);

  /**
   * HTTP POST Fallback
   */
  const triggerPostFallback = async (targetFen: string, isForHiddenTraining = false) => {
    try {
      const response = await fetch('https://chess-api.com/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen: targetFen,
          depth: depth,
          variants: variantsCount,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const result: AnalysisResult = {
        bestMove: data.bestMove || '',
        eval: data.eval,
        mate: data.mate,
        winChance: data.winChance ?? 50,
        depth: data.depth,
        continuationArr: data.continuationArr,
        text: data.text,
        variants: data.variants || [],
        status: 'success',
      };

      if (isForHiddenTraining) {
        setHiddenAnalysis(result);
      } else {
        setAnalysis(result);
      }
    } catch (err: any) {
      console.error('Post fallback failed', err);
      if (!isForHiddenTraining) {
        setAnalysis({
          bestMove: '',
          status: 'error',
          errorMessage: err.message || 'Engine connection timeout.',
        });
      }
    }
  };

  // Re-run analysis when FEN, Depth, or Variants change
  useEffect(() => {
    if (currentMode === 'training') {
      // In training mode, calculate Stockfish answer in the background but do not reveal it
      triggerStockfishAnalysis(fen, true);
    } else {
      triggerStockfishAnalysis(fen, false);
    }

    return () => {
      closeWebSocket();
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [fen, depth, variantsCount, currentMode, triggerStockfishAnalysis]);

  // Handle URL share parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFen = params.get('fen');
    if (urlFen) {
      try {
        const decoded = decodeURIComponent(urlFen);
        const testGame = new Chess(decoded);
        setGame(testGame);
        setFen(decoded);
        setPgn(testGame.pgn());
      } catch (e) {
        console.error('Error importing FEN from URL query parameters', e);
      }
    }
  }, []);

  // Handle Blunder calculation when a new evaluation arrives after a user move
  useEffect(() => {
    if (currentMode === 'blunder' && pendingBlunderValidation && analysis.status === 'success') {
      const { prevAnalysis, userMove } = pendingBlunderValidation;
      
      const prevWinChance = prevAnalysis.winChance ?? 50;
      const currentWinChance = analysis.winChance ?? 50;

      // Score diff represents how much the played move dropped the winning prospects
      // In chess, standard win chance is from current player's perspective.
      // If user plays a move, they finish their turn, so the next evaluation is from the opponent's perspective.
      // Therefore, the new win chance for the active side = 100 - currentWinChance.
      const adjustedCurrentChance = 100 - currentWinChance;
      const scoreDrop = prevWinChance - adjustedCurrentChance;

      // Determine blunder level
      const report: BlunderReport = {
        userMove,
        bestMove: prevAnalysis.bestMove || 'N/A',
        userWinChance: adjustedCurrentChance,
        bestWinChance: prevWinChance,
        scoreDifference: scoreDrop > 0 ? scoreDrop : 0,
        isBlunder: scoreDrop >= 12,
        isMistake: scoreDrop >= 6 && scoreDrop < 12,
        isInaccuracy: scoreDrop >= 3 && scoreDrop < 6,
      };

      setBlunderReport(report);
      setPendingBlunderValidation(null);
    }
  }, [currentMode, pendingBlunderValidation, analysis]);

  /**
   * Action: Play a Move
   */
  const handleMovePlayed = (from: string, to: string, promotion?: string) => {
    if (isEditorMode) {
      // Free drag-and-drop piece placing
      try {
        const currentChess = new Chess(game.fen());
        const piece = currentChess.get(from as any);
        if (piece) {
          currentChess.remove(from as any);
          currentChess.remove(to as any); // Remove target piece if any
          currentChess.put({ type: piece.type, color: piece.color }, to as any);
          
          const newFen = currentChess.fen();
          setGame(currentChess);
          setFen(newFen);
          setInitialFen(newFen);
          setPgn('');
          setPgnSteps([]);
          setCurrentStepIndex(-1);
          setUserLastMove(null);
          setBlunderReport(null);
        }
      } catch (err) {
        console.error('Editor free-move error:', err);
      }
      return;
    }

    try {
      const currentChess = new Chess(game.fen());
      const moveResult = currentChess.move({ from, to, promotion });

      if (moveResult) {
        const moveSan = moveResult.san;

        if (currentMode === 'training') {
          // Training Mode Guess validation
          if (hiddenAnalysis && hiddenAnalysis.bestMove) {
            const isCorrect = 
              moveSan === hiddenAnalysis.bestMove || 
              moveResult.lan === hiddenAnalysis.bestMove ||
              `${from}${to}` === hiddenAnalysis.bestMove.replace(/[+#]/g, '');

            if (isCorrect) {
              const verbose = useBeginnerFriendlyMoves ? getVerboseMoveDescription(game.fen(), hiddenAnalysis.bestMove) : '';
              setTrainingFeedback({
                status: 'correct',
                message: `Brilliant! ${moveSan}${verbose ? ` (${verbose})` : ''} is indeed the best move.`,
              });
              setTrainingGuessed(true);
              // Promote hidden analysis to active display
              setAnalysis({ ...hiddenAnalysis, status: 'success' });
            } else {
              const verbose = useBeginnerFriendlyMoves ? getVerboseMoveDescription(game.fen(), moveSan) : '';
              setTrainingFeedback({
                status: 'incorrect',
                message: `Not quite! ${moveSan}${verbose ? ` (${verbose})` : ''} is playable, but there is a stronger option. Try again!`,
              });
              return;
            }
          }
        } else if (currentMode === 'blunder') {
          // Blunder Mode: Save current status before setting new FEN
          setPendingBlunderValidation({
            prevFen: game.fen(),
            prevAnalysis: { ...analysis },
            userMove: moveSan,
          });
        }

        // Commit move
        setGame(currentChess);
        const newFen = currentChess.fen();
        setFen(newFen);

        // Update PGN and History navigation steps
        const nextSteps = pgnSteps.slice(0, currentStepIndex + 1);
        const newStep: PgnStep = {
          san: moveSan,
          fen: newFen,
          from,
          to,
        };
        const updatedSteps = [...nextSteps, newStep];
        setPgnSteps(updatedSteps);
        setCurrentStepIndex(updatedSteps.length - 1);

        // Reconstruct subset PGN
        const historySubset = updatedSteps.map(s => s.san);
        let formattedPgn = '';
        for (let i = 0; i < historySubset.length; i += 2) {
          const moveNum = Math.floor(i / 2) + 1;
          formattedPgn += `${moveNum}. ${historySubset[i]} ${historySubset[i+1] || ''} `;
        }
        setPgn(formattedPgn.trim());
        setUserLastMove({ from, to });
      }
    } catch (err) {
      console.warn('Invalid chess move attempted:', err);
    }
  };

  /**
   * Action: Force play a move from Candidate list
   */
  const handleForcePlayMove = (moveText: string) => {
    try {
      const currentChess = new Chess(game.fen());
      const moves = currentChess.moves({ verbose: true });
      const cleanMove = moveText.replace(/[+#]/g, '');

      // Try finding move
      const matchedMove = moves.find(
        m => m.san.replace(/[+#]/g, '') === cleanMove || m.lan === cleanMove || m.san === moveText
      );

      if (matchedMove) {
        currentChess.move({ from: matchedMove.from, to: matchedMove.to, promotion: matchedMove.promotion });
        const newFen = currentChess.fen();
        const moveSan = matchedMove.san;
        
        setGame(currentChess);
        setFen(newFen);

        const nextSteps = pgnSteps.slice(0, currentStepIndex + 1);
        const newStep: PgnStep = {
          san: moveSan,
          fen: newFen,
          from: matchedMove.from,
          to: matchedMove.to,
        };
        const updatedSteps = [...nextSteps, newStep];
        setPgnSteps(updatedSteps);
        setCurrentStepIndex(updatedSteps.length - 1);

        // Reconstruct subset PGN
        const historySubset = updatedSteps.map(s => s.san);
        let formattedPgn = '';
        for (let i = 0; i < historySubset.length; i += 2) {
          const moveNum = Math.floor(i / 2) + 1;
          formattedPgn += `${moveNum}. ${historySubset[i]} ${historySubset[i+1] || ''} `;
        }
        setPgn(formattedPgn.trim());
        setUserLastMove({ from: matchedMove.from, to: matchedMove.to });
        
        // Reset training guess if we were in training
        if (currentMode === 'training') {
          setTrainingGuessed(false);
          setTrainingFeedback({ status: 'idle', message: '' });
        }
      }
    } catch (e) {
      console.error('Error playing line move:', e);
    }
  };

  /**
   * Reset Board
   */
  const handleResetBoard = () => {
    const newGame = new Chess();
    const startFen = newGame.fen();
    setGame(newGame);
    setFen(startFen);
    setInitialFen(startFen);
    setPgn('');
    setPgnSteps([]);
    setCurrentStepIndex(-1);
    setUserLastMove(null);
    setBlunderReport(null);
    setTrainingGuessed(false);
    setTrainingFeedback({ status: 'idle', message: '' });
  };

  /**
   * Toggle Turn/Active Side-to-move in FEN
   */
  const handleToggleTurnColor = () => {
    try {
      const currentChess = new Chess(game.fen());
      const fenParts = currentChess.fen().split(' ');
      fenParts[1] = fenParts[1] === 'w' ? 'b' : 'w';
      
      const newFen = fenParts.join(' ');
      const testGame = new Chess(newFen);
      setGame(testGame);
      setFen(newFen);
      setInitialFen(newFen);
      setPgn('');
      setPgnSteps([]);
      setCurrentStepIndex(-1);
      setUserLastMove(null);
      setBlunderReport(null);
    } catch (e) {
      console.error("Illegal to swap turn in check position", e);
    }
  };

  /**
   * Clear all pieces from board
   */
  const handleClearBoard = () => {
    try {
      const emptyFen = '8/8/8/8/8/8/8/8 w - - 0 1';
      const emptyGame = new Chess(emptyFen);
      setGame(emptyGame);
      setFen(emptyFen);
      setInitialFen(emptyFen);
      setPgn('');
      setPgnSteps([]);
      setCurrentStepIndex(-1);
      setUserLastMove(null);
      setBlunderReport(null);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Handle Click on a Square (Board Editor Placement or Eraser)
   */
  const handleSquareClick = (square: string) => {
    if (!isEditorMode) return;
    
    try {
      const currentChess = new Chess(game.fen());
      if (activeEditorTool === 'eraser') {
        currentChess.remove(square as any);
      } else if (activeEditorTool && activeEditorTool !== 'move') {
        const color = activeEditorTool[0] as 'w' | 'b';
        const type = activeEditorTool[1].toLowerCase() as 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
        currentChess.remove(square as any);
        currentChess.put({ type, color }, square as any);
      }
      
      const newFen = currentChess.fen();
      setGame(currentChess);
      setFen(newFen);
      setInitialFen(newFen);
      setPgn('');
      setPgnSteps([]);
      setCurrentStepIndex(-1);
      setUserLastMove(null);
      setBlunderReport(null);
    } catch (e) {
      console.error('Editor click placement error:', e);
    }
  };

  /**
   * Navigate Game History PGN Step
   */
  const handleNavigateHistory = (index: number) => {
    const targetFen = index === -1 ? initialFen : pgnSteps[index].fen;
    try {
      const updatedGame = new Chess(targetFen);
      setGame(updatedGame);
      setFen(targetFen);
      setCurrentStepIndex(index);
      
      // Update PGN for the subset of moves up to this point
      const historySubset = pgnSteps.slice(0, index + 1).map(s => s.san);
      let formattedPgn = '';
      for (let i = 0; i < historySubset.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        formattedPgn += `${moveNum}. ${historySubset[i]} ${historySubset[i+1] || ''} `;
      }
      setPgn(formattedPgn.trim());

      // If there's a last move, highlight it
      if (index >= 0) {
        const step = pgnSteps[index];
        setUserLastMove({ from: step.from, to: step.to });
      } else {
        setUserLastMove(null);
      }
      
      setBlunderReport(null);
      setTrainingGuessed(false);
      setTrainingFeedback({ status: 'idle', message: '' });
    } catch (e) {
      console.error('Navigation history error:', e);
    }
  };

  /**
   * Flip board view
   */
  const handleFlipBoard = () => {
    setOrientation(prev => (prev === 'white' ? 'black' : 'white'));
  };

  /**
   * Undo last move
   */
  const handleUndo = () => {
    try {
      // Determine the index to undo. If currentStepIndex is -1 and no moves are made, we can't undo.
      if (currentStepIndex === -1 && pgnSteps.length === 0) {
        console.warn('No moves to undo');
        return;
      }

      // If we are navigating, we undo from the current position. Otherwise we undo from the end.
      const targetIndex = currentStepIndex !== -1 ? currentStepIndex : pgnSteps.length - 1;
      if (targetIndex < 0 || targetIndex >= pgnSteps.length) {
        console.warn('No moves to undo');
        return;
      }

      // Get steps up to targetIndex, but exclude the one at targetIndex (which is being undone)
      const nextSteps = pgnSteps.slice(0, targetIndex);

      // Reconstruct the chess game from the initial FEN
      const currentChess = new Chess(initialFen);
      for (const step of nextSteps) {
        currentChess.move({ from: step.from, to: step.to });
      }
      const newFen = currentChess.fen();
      
      setGame(currentChess);
      setFen(newFen);
      setPgnSteps(nextSteps);
      setCurrentStepIndex(nextSteps.length - 1);

      // Re-reconstruct the PGN
      const historySubset = nextSteps.map(s => s.san);
      let formattedPgn = '';
      for (let i = 0; i < historySubset.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        formattedPgn += `${moveNum}. ${historySubset[i]} ${historySubset[i+1] || ''} `;
      }
      setPgn(formattedPgn.trim());

      // Set user last move highlight to the new last step
      if (nextSteps.length > 0) {
        const lastS = nextSteps[nextSteps.length - 1];
        setUserLastMove({ from: lastS.from, to: lastS.to });
      } else {
        setUserLastMove(null);
      }

      setBlunderReport(null);
      setTrainingGuessed(false);
      setTrainingFeedback({ status: 'idle', message: '' });
    } catch (e) {
      console.warn('Undo error:', e);
    }
  };

  /**
   * Direct FEN Import
   */
  const handleImportFen = (newFen: string) => {
    try {
      const testGame = new Chess(newFen);
      setGame(testGame);
      setFen(newFen);
      setInitialFen(newFen);
      setPgn(testGame.pgn());
      setPgnSteps([]);
      setCurrentStepIndex(-1);
      setUserLastMove(null);
      setBlunderReport(null);
      setTrainingGuessed(false);
      setTrainingFeedback({ status: 'idle', message: '' });
    } catch (e) {
      console.error('Invalid FEN imported');
    }
  };

  /**
   * Direct PGN Import
   */
  const handleImportPgn = (newPgn: string) => {
    try {
      const testGame = new Chess();
      testGame.loadPgn(newPgn);
      
      const history = testGame.history({ verbose: true });
      const steps: PgnStep[] = [];
      const playbackChess = new Chess();
      
      const pgnHeaderFen = testGame.header()?.FEN;
      if (pgnHeaderFen) {
        playbackChess.load(pgnHeaderFen);
      }
      
      for (const h of history) {
        playbackChess.move(h.san);
        steps.push({
          san: h.san,
          fen: playbackChess.fen(),
          from: h.from,
          to: h.to,
        });
      }

      setGame(testGame);
      setFen(testGame.fen());
      setPgn(newPgn);
      setPgnSteps(steps);
      setCurrentStepIndex(steps.length - 1);
      setUserLastMove(null);
      setBlunderReport(null);
      setTrainingGuessed(false);
      setTrainingFeedback({ status: 'idle', message: '' });
    } catch (e) {
      console.error('Invalid PGN imported');
    }
  };

  /**
   * Action: Reveal Training Solution
   */
  const handleRevealSolution = () => {
    if (hiddenAnalysis) {
      setAnalysis({ ...hiddenAnalysis, status: 'success' });
      setTrainingGuessed(true);
      const verbose = useBeginnerFriendlyMoves ? getVerboseMoveDescription(game.fen(), hiddenAnalysis.bestMove) : '';
      setTrainingFeedback({
        status: 'correct',
        message: `Revealed: Stockfish recommends playing ${hiddenAnalysis.bestMove}${verbose ? ` (${verbose})` : ''}.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Visual Navigation Bar */}
      <header className="border-b border-neutral-900 bg-neutral-900/40 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black tracking-tight text-neutral-100">
              BestMove <span className="text-amber-400 font-medium">Coach</span>
            </h1>
            <p className="text-[10px] text-neutral-500 font-medium">Interactive Tactical Stockfish Analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active indicator */}
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-neutral-400 font-medium bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            Stockfish 16 Engine Active
          </span>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Board & Primary Analysis (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          {/* Feedback bar for Training mode */}
          {currentMode === 'training' && trainingFeedback.status !== 'idle' && (
            <div 
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                trainingFeedback.status === 'correct' 
                  ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' 
                  : 'bg-rose-950/25 border-rose-900/30 text-rose-300'
              }`}
              id="training-feedback-banner"
            >
              {trainingFeedback.status === 'correct' ? (
                <Trophy className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
              ) : (
                <RotateCcw className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="text-xs font-bold leading-normal">{trainingFeedback.message}</span>
            </div>
          )}

          {/* Interactive Board Wrapper */}
          <ChessAnalysisBoard
            fen={fen}
            onMovePlayed={handleMovePlayed}
            orientation={orientation}
            analysis={analysis}
            showBestMoveArrow={currentMode !== 'training' || trainingGuessed}
            trainingMode={currentMode === 'training'}
            trainingGuessed={trainingGuessed}
            userLastMove={userLastMove}
            isEditorMode={isEditorMode}
            activeEditorTool={activeEditorTool}
            onSquareClick={handleSquareClick}
            onUndo={handleUndo}
            onFlip={handleFlipBoard}
            onReset={handleResetBoard}
            useBeginnerFriendlyMoves={useBeginnerFriendlyMoves}
          />

          {/* Game Move Navigator */}
          <MoveHistoryNavigator
            steps={pgnSteps}
            currentIndex={currentStepIndex}
            onNavigate={handleNavigateHistory}
          />

          {/* Live Analysis Engine Box */}
          <AnalysisPanel
            analysis={analysis}
            onPlayMove={handleForcePlayMove}
            trainingMode={currentMode === 'training'}
            trainingGuessed={trainingGuessed}
            onRevealSolution={handleRevealSolution}
            fen={fen}
            useBeginnerFriendlyMoves={useBeginnerFriendlyMoves}
            onToggleBeginnerFriendlyMoves={setUseBeginnerFriendlyMoves}
          />
        </div>

        {/* Right Side: Navigation, Custom Modes, and Exporters (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 w-full">
          {/* Coach Settings & Practice Preset Lists */}
          <GameModePanel
            currentMode={currentMode}
            setMode={(m) => {
              setMode(m);
              setBlunderReport(null);
              setTrainingGuessed(false);
              setTrainingFeedback({ status: 'idle', message: '' });
              // Clear analysis arrows and trigger standard
              setAnalysis(prev => ({ ...prev, bestMove: '' }));
            }}
            blunderReport={blunderReport}
            onSelectPreset={handleImportFen}
          />

          {/* Custom State & Board Editor */}
          <CustomStateCreator
            isEditorMode={isEditorMode}
            setIsEditorMode={setIsEditorMode}
            activeEditorTool={activeEditorTool}
            setActiveEditorTool={setActiveEditorTool}
            activeTurnColor={activeTurnColor}
            onToggleTurnColor={handleToggleTurnColor}
            onClearBoard={handleClearBoard}
            onResetStandard={handleResetBoard}
          />

          {/* Core Settings & Engine depth / variants selection */}
          <ControlPanel
            fen={fen}
            pgn={pgn}
            depth={depth}
            setDepth={setDepth}
            variantsCount={variantsCount}
            setVariantsCount={setVariantsCount}
            onReset={handleResetBoard}
            onFlip={handleFlipBoard}
            onUndo={handleUndo}
            onImportFen={handleImportFen}
            onImportPgn={handleImportPgn}
          />

          {/* Persistent Sessions */}
          <SavedSessions
            currentFen={fen}
            currentPgn={pgn}
            onLoadSession={handleImportFen}
          />
        </div>
      </main>

      <footer className="border-t border-neutral-900 py-6 text-center text-[11px] text-neutral-600 font-mono mt-auto select-none">
        BestMove Coach • Chess-API Stockfish Engine Server integration • Clean Workspace
      </footer>
    </div>
  );
}
