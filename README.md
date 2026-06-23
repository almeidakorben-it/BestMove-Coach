<h1>BestMove Coach ♟️</h1>

<p>
  A modern chess analysis app powered by <strong>Stockfish</strong> through
  <strong>Chess-API</strong>. Analyze positions, find the best move, explore
  checkmate lines, and review engine continuations on an interactive chess board.
</p>

<hr>

<h2>Features</h2>

<h3>Interactive Chess Board</h3>

<ul>
  <li>Drag-and-drop chess pieces</li>
  <li>Legal move validation</li>
  <li>Flip board orientation</li>
  <li>Undo and redo moves</li>
  <li>Reset board to starting position</li>
  <li>Custom position editor</li>
</ul>

<h3>Engine Analysis</h3>

<ul>
  <li>Find the best move for any position</li>
  <li>Show evaluation score</li>
  <li>Show win chance percentage</li>
  <li>Display search depth</li>
  <li>Detect <strong>Mate in X</strong></li>
  <li>Highlight best moves with arrows</li>
</ul>

<h3>Import and Export</h3>

<ul>
  <li>Import FEN positions</li>
  <li>Export FEN positions</li>
  <li>Import PGN games</li>
  <li>Export PGN games</li>
  <li>Copy best move lines</li>
  <li>Share board positions with links</li>
</ul>

<h2>Chess API</h2>

<p>This app uses Chess-API for Stockfish-powered analysis.</p>

<h3>HTTP Endpoint</h3>

<pre><code>POST https://chess-api.com/v1</code></pre>

<h3>WebSocket Endpoint</h3>

<pre><code>wss://chess-api.com/v1</code></pre>

<h3>Example Request</h3>

<pre><code>{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
}</code></pre>

<h3>Example Response</h3>

<pre><code>{
  "bestmove": "e2e4",
  "eval": 0.73,
  "depth": 18,
  "mate": null,
  "winChance": 58,
  "continuation": "e4 e5 Nf3 Nc6"
}</code></pre>

<h2>Tech Stack</h2>

<ul>
  <li>React</li>
  <li>TypeScript</li>
  <li>Tailwind CSS</li>
  <li>react-chessboard</li>
  <li>chess.js</li>
  <li>Chess-API</li>
</ul>

<h2>User Workflow</h2>

<ol>
  <li>Create or import a chess position.</li>
  <li>Click <strong>Analyze Position</strong>.</li>
  <li>Review the best engine move.</li>
  <li>Explore alternative move lines.</li>
  <li>Follow continuation lines.</li>
  <li>Export or share the analysis.</li>
</ol>

<h2>Installation</h2>

<pre><code>git clone https://github.com/yourusername/bestmove-coach.git
cd bestmove-coach
npm install
npm run dev</code></pre>

<h2>Environment Variables</h2>

<pre><code>VITE_CHESS_API_URL=https://chess-api.com/v1</code></pre>

<h2>Planned Features</h2>

<ul>
  <li>Opening explorer</li>
  <li>Evaluation graph</li>
  <li>AI coaching explanations</li>
  <li>Checkmate trainer</li>
  <li>Blunder detection</li>
  <li>Full game review reports</li>
</ul>

<h2>Mission</h2>

<p>
  <strong>BestMove Coach</strong> helps chess players understand positions,
  avoid mistakes, discover stronger moves, and learn from engine analysis in
  a clean and simple interface.
</p>
