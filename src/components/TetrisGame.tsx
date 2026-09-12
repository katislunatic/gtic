// DEPRECATED — not imported anywhere. Snake (SnakeGame.tsx) is now the
// offline mini-game used by OfflineGate.tsx. Safe to delete this file.
import { useCallback, useEffect, useRef, useState } from "react";

const COLS = 10;
const ROWS = 20;
const CELL = 24;

type Cell = string | null;
type Board = Cell[][];

const COLORS: Record<string, string> = {
  I: "#38bdf8",
  O: "#facc15",
  T: "#c084fc",
  S: "#4ade80",
  Z: "#f87171",
  J: "#60a5fa",
  L: "#fb923c",
};

// Each shape defined as 4 rotation states, each a list of [row, col] offsets.
const SHAPES: Record<string, number[][][]> = {
  I: [
    [[1, 0], [1, 1], [1, 2], [1, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 1], [1, 1], [2, 1], [3, 1]],
  ],
  O: [
    [[0, 1], [0, 2], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [1, 2]],
  ],
  T: [
    [[0, 1], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 1]],
    [[0, 1], [1, 0], [1, 1], [2, 1]],
  ],
  S: [
    [[0, 1], [0, 2], [1, 0], [1, 1]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 1], [1, 2], [2, 0], [2, 1]],
    [[0, 0], [1, 0], [1, 1], [2, 1]],
  ],
  Z: [
    [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 2], [1, 1], [1, 2], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[0, 1], [1, 0], [1, 1], [2, 0]],
  ],
  J: [
    [[0, 0], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 0], [2, 1]],
  ],
  L: [
    [[0, 2], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [1, 2], [2, 0]],
    [[0, 0], [0, 1], [1, 1], [2, 1]],
  ],
};

const PIECE_KEYS = Object.keys(SHAPES);

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

function randomPiece() {
  return PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
}

interface ActivePiece {
  type: string;
  rotation: number;
  row: number;
  col: number;
}

function collides(board: Board, piece: ActivePiece, dRow: number, dCol: number, dRot: number) {
  const rotation = (piece.rotation + dRot + 4) % 4;
  const cells = SHAPES[piece.type][rotation];
  for (const [r, c] of cells) {
    const row = piece.row + r + dRow;
    const col = piece.col + c + dCol;
    if (col < 0 || col >= COLS || row >= ROWS) return true;
    if (row >= 0 && board[row][col]) return true;
  }
  return false;
}

export function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<Board>(emptyBoard());
  const pieceRef = useRef<ActivePiece>({ type: randomPiece(), rotation: 0, row: -2, col: 3 });
  const dropCounterRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>();
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const gameOverRef = useRef(false);
  const pausedRef = useRef(false);
  const scoreRef = useRef(0);

  const spawnPiece = useCallback(() => {
    const type = randomPiece();
    const piece: ActivePiece = { type, rotation: 0, row: -2, col: 3 };
    if (collides(boardRef.current, piece, 0, 0, 0)) {
      gameOverRef.current = true;
      setGameOver(true);
    }
    pieceRef.current = piece;
  }, []);

  const lockPiece = useCallback(() => {
    const board = boardRef.current;
    const piece = pieceRef.current;
    const cells = SHAPES[piece.type][piece.rotation];
    for (const [r, c] of cells) {
      const row = piece.row + r;
      const col = piece.col + c;
      if (row >= 0) board[row][col] = piece.type;
    }
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((cell) => cell)) {
        board.splice(r, 1);
        board.unshift(Array<Cell>(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      scoreRef.current += [0, 100, 300, 500, 800][cleared] ?? cleared * 200;
      setScore(scoreRef.current);
    }
    spawnPiece();
  }, [spawnPiece]);

  const move = useCallback(
    (dCol: number) => {
      if (gameOverRef.current || pausedRef.current) return;
      const piece = pieceRef.current;
      if (!collides(boardRef.current, piece, 0, dCol, 0)) piece.col += dCol;
    },
    []
  );

  const rotate = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const piece = pieceRef.current;
    if (!collides(boardRef.current, piece, 0, 0, 1)) {
      piece.rotation = (piece.rotation + 1) % 4;
    }
  }, []);

  const softDrop = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const piece = pieceRef.current;
    if (!collides(boardRef.current, piece, 1, 0, 0)) {
      piece.row += 1;
      scoreRef.current += 1;
      setScore(scoreRef.current);
    } else {
      lockPiece();
    }
  }, [lockPiece]);

  const hardDrop = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const piece = pieceRef.current;
    let dist = 0;
    while (!collides(boardRef.current, piece, dist + 1, 0, 0)) dist++;
    piece.row += dist;
    scoreRef.current += dist * 2;
    setScore(scoreRef.current);
    lockPiece();
  }, [lockPiece]);

  const restart = useCallback(() => {
    boardRef.current = emptyBoard();
    scoreRef.current = 0;
    setScore(0);
    gameOverRef.current = false;
    setGameOver(false);
    spawnPiece();
  }, [spawnPiece]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "p" || e.key === "P") {
        setPaused((p) => !p);
        return;
      }
      if (gameOverRef.current) {
        if (e.key === "Enter") restart();
        return;
      }
      if (pausedRef.current) return;
      if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowDown") softDrop();
      else if (e.key === "ArrowUp") rotate();
      else if (e.key === " ") hardDrop();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [move, rotate, softDrop, hardDrop, restart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DROP_INTERVAL = 700;

    const draw = () => {
      ctx.fillStyle = "#0f0f17";
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

      const board = boardRef.current;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = board[r][c];
          if (cell) drawCell(ctx, r, c, COLORS[cell]);
        }
      }

      if (!gameOverRef.current) {
        const piece = pieceRef.current;
        const cells = SHAPES[piece.type][piece.rotation];
        for (const [r, c] of cells) {
          const row = piece.row + r;
          const col = piece.col + c;
          if (row >= 0) drawCell(ctx, row, col, COLORS[piece.type]);
        }
      }

      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL, 0);
        ctx.lineTo(c * CELL, ROWS * CELL);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(COLS * CELL, r * CELL);
        ctx.stroke();
      }
    };

    const drawCell = (c: CanvasRenderingContext2D, row: number, col: number, color: string) => {
      c.fillStyle = color;
      c.fillRect(col * CELL + 1, row * CELL + 1, CELL - 2, CELL - 2);
      c.fillStyle = "rgba(255,255,255,0.15)";
      c.fillRect(col * CELL + 1, row * CELL + 1, CELL - 2, 4);
    };

    const loop = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;
      if (!gameOverRef.current && !pausedRef.current) {
        dropCounterRef.current += delta;
        if (dropCounterRef.current > DROP_INTERVAL) {
          dropCounterRef.current = 0;
          const piece = pieceRef.current;
          if (!collides(boardRef.current, piece, 1, 0, 0)) {
            piece.row += 1;
          } else {
            lockPiece();
          }
        }
      }
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [lockPiece]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-6 text-sm">
        <span className="text-muted-foreground">
          Score: <span className="font-semibold text-foreground">{score}</span>
        </span>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="text-primary hover:underline"
        >
          {paused ? "Resume" : "Pause"} (P)
        </button>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          className="rounded-lg border border-border"
        />
        {(gameOver || paused) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 rounded-lg backdrop-blur-sm">
            <p className="text-lg font-bold text-white">{gameOver ? "Game Over" : "Paused"}</p>
            {gameOver && <p className="text-sm text-white/70">Score: {score}</p>}
            <button
              type="button"
              onClick={gameOver ? restart : () => setPaused(false)}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {gameOver ? "Play Again" : "Resume"}
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        \u2190 \u2192 move &middot; \u2191 rotate &middot; \u2193 soft drop &middot; Space hard drop &middot; P pause
      </p>
    </div>
  );
}
