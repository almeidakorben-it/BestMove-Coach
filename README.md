BestMove Coach ♟️

A modern chess analysis application powered by Stockfish through Chess-API. Analyze positions, discover the strongest engine moves, explore checkmate lines, and review multiple candidate continuations through an interactive chess board.

Features
Interactive Chess Board
Drag-and-drop chess pieces
Legal move validation
Flip board orientation
Undo and redo moves
Reset board to starting position
Custom position editor
Engine Analysis
Find the best move for any position
Real-time Stockfish analysis
Evaluation score display
Win probability percentage
Search depth information
Mate detection and "Mate in X" announcements
Visual move highlighting and arrows
Advanced Analysis
Multiple engine variations (Top 3–5 moves)
Principal variation display
Continuation lines
Forced checkmate sequences
Move-by-move engine recommendations
Position evaluation history
Import & Export
Import FEN positions
Export FEN positions
Import PGN game files
Export PGN game files
Copy analysis lines
Share positions via URL
Save and load analysis sessions
Training Tools
Guess-the-best-move mode
Blunder detection
Move comparison against engine recommendations
Tactical puzzle generation
Checkmate trainer
Technology Stack
Frontend
React
TypeScript
react-chessboard
chess.js
Backend Services
Chess-API
Stockfish Engine
Analysis API

This project uses Chess-API for engine analysis.

HTTP Endpoint

POST https://chess-api.com/v1

WebSocket Endpoint

wss://chess-api.com/v1

The API supports:

FEN position analysis
Move list analysis
Best move generation
Multi-variation output
Evaluation scores
Mate calculations
Continuation lines
Example Response or simple Move pawn to from e2 to e4
{
  "bestmove": "e2e4",
  "eval": 0.73,
  "depth": 18,
  "mate": null,
  "winChance": 58,
  "continuation": "e4 e5 Nf3 Nc6"
}
User Workflow
Create or import a position.
Click Analyze Position.
Review the engine's best move.
Explore alternative variations.
Follow continuation lines.
Study checkmate sequences when available.
Export your analysis or share the position.
