import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

const COLS = 18;
const ROWS = 18;
const CELL = 20;
const TICK_MS = 130;

type Point = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

// Google Snake-style palette \u2014 alternating checkerboard tiles + friendly greens.
const TILE_LIGHT = "#3a3f4b";
const TILE_DARK = "#343842";
const SNAKE_HEAD = "#8bd450";
const SNAKE_BODY_A = "#a3e072";
const SNAKE_BODY_B = "#94d962";
const APPLE_RED = "#ef5350";
const APPLE_LEAF = "#4ade80";

function randomFood(snake: Point[]): Point {
  let food: Point;
  do {
    food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
  return food;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Point[]>([{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }]);
  const dirRef = useRef<Direction>("right");
  const nextDirRef = useRef<Direction>("right");
  const foodRef = useRef<Point>(randomFood(snakeRef.current));
  const gameOverRef = useRef(false);
  const pausedRef = useRef(false);
  const startedRef = useRef(false);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const tickRef = useRef<number>();

  const restart = useCallback(() => {
    snakeRef.current = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
    dirRef.current = "right";
    nextDirRef.current = "right";
    foodRef.current = randomFood(snakeRef.current);
    gameOverRef.current = false;
    startedRef.current = false;
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setStarted(false);
  }, []);

  const beginIfNeeded = useCallback(() => {
    if (!startedRef.current && !gameOverRef.current) {
      startedRef.current = true;
      setStarted(true);
    }
  }, []);

  const setDirection = useCallback(
    (dir: Direction) => {
      if (gameOverRef.current || pausedRef.current) return;
      beginIfNeeded();
      if (OPPOSITE[dir] === dirRef.current) return;
      nextDirRef.current = dir;
    },
    [beginIfNeeded]
  );

  // Keyboard controls (desktop)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "p" || e.key === "P") {
        if (startedRef.current) setPaused((p) => !p);
        return;
      }
      if (gameOverRef.current) {
        if (e.key === "Enter") restart();
        return;
      }
      if (e.key === "ArrowLeft") setDirection("left");
      else if (e.key === "ArrowRight") setDirection("right");
      else if (e.key === "ArrowUp") setDirection("up");
      else if (e.key === "ArrowDown") setDirection("down");
      else if (e.key === " ") beginIfNeeded();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [restart, setDirection, beginIfNeeded]);

  // Tap / swipe controls (mobile) \u2014 a tap alone starts the game without
  // forcing a direction change; a swipe both starts and steers.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (gameOverRef.current) {
        restart();
        return;
      }
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
        beginIfNeeded();
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        setDirection(dx > 0 ? "right" : "left");
      } else {
        setDirection(dy > 0 ? "down" : "up");
      }
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [setDirection, beginIfNeeded, restart]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const step = () => {
      if (gameOverRef.current || pausedRef.current || !startedRef.current) return;
      dirRef.current = nextDirRef.current;
      const snake = snakeRef.current;
      const head = snake[0];
      const next: Point = { ...head };
      if (dirRef.current === "up") next.y -= 1;
      else if (dirRef.current === "down") next.y += 1;
      else if (dirRef.current === "left") next.x -= 1;
      else next.x += 1;

      const hitsWall = next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS;
      const hitsSelf = snake.some((s) => s.x === next.x && s.y === next.y);
      if (hitsWall || hitsSelf) {
        gameOverRef.current = true;
        setGameOver(true);
        return;
      }

      snake.unshift(next);
      if (next.x === foodRef.current.x && next.y === foodRef.current.y) {
        scoreRef.current += 10;
        setScore(scoreRef.current);
        foodRef.current = randomFood(snake);
      } else {
        snake.pop();
      }
    };

    const drawApple = (x: number, y: number) => {
      const cx = x * CELL + CELL / 2;
      const cy = y * CELL + CELL / 2;
      const radius = CELL / 2.7;
      ctx.fillStyle = APPLE_RED;
      ctx.beginPath();
      ctx.arc(cx, cy - 1, radius, 0, Math.PI * 2);
      ctx.fill();
      // shine
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.arc(cx - radius * 0.35, cy - radius * 0.5, radius * 0.28, 0, Math.PI * 2);
      ctx.fill();
      // leaf
      ctx.fillStyle = APPLE_LEAF;
      ctx.beginPath();
      ctx.ellipse(cx + 2, cy - radius - 1, 3.2, 2, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      // checkerboard board
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? TILE_LIGHT : TILE_DARK;
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        }
      }

      const snake = snakeRef.current;

      // body first (drawn back to front), then head on top with a face
      for (let i = snake.length - 1; i >= 1; i--) {
        const seg = snake[i];
        ctx.fillStyle = i % 2 === 0 ? SNAKE_BODY_A : SNAKE_BODY_B;
        roundedRect(ctx, seg.x * CELL + 1.5, seg.y * CELL + 1.5, CELL - 3, CELL - 3, 6);
        ctx.fill();
      }

      const head = snake[0];
      ctx.fillStyle = SNAKE_HEAD;
      roundedRect(ctx, head.x * CELL + 1, head.y * CELL + 1, CELL - 2, CELL - 2, 7);
      ctx.fill();

      // eyes, oriented with current direction
      const dir = dirRef.current;
      const hx = head.x * CELL + CELL / 2;
      const hy = head.y * CELL + CELL / 2;
      const eyeOffset = CELL * 0.22;
      let e1 = { x: hx, y: hy };
      let e2 = { x: hx, y: hy };
      if (dir === "up" || dir === "down") {
        const s = dir === "up" ? -1 : 1;
        e1 = { x: hx - eyeOffset, y: hy + s * eyeOffset * 0.4 };
        e2 = { x: hx + eyeOffset, y: hy + s * eyeOffset * 0.4 };
      } else {
        const s = dir === "left" ? -1 : 1;
        e1 = { x: hx + s * eyeOffset * 0.4, y: hy - eyeOffset };
        e2 = { x: hx + s * eyeOffset * 0.4, y: hy + eyeOffset };
      }
      ctx.fillStyle = "#1c2410";
      [e1, e2].forEach((e) => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      drawApple(foodRef.current.x, foodRef.current.y);
    };

    const loop = () => {
      step();
      draw();
    };

    tickRef.current = window.setInterval(loop, TICK_MS);
    draw();
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  const dpadBtn = "flex h-11 w-11 items-center justify-center rounded-lg bg-muted/60 active:bg-muted text-foreground";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-6 text-sm">
        <span className="text-muted-foreground">
          Score: <span className="font-semibold text-foreground">{score}</span>
        </span>
        {started && !gameOver && (
          <button type="button" onClick={() => setPaused((p) => !p)} className="text-primary hover:underline">
            {paused ? "Resume" : "Pause"} (P)
          </button>
        )}
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          onClick={beginIfNeeded}
          className="rounded-xl border border-border touch-none cursor-pointer"
        />
        {!started && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 rounded-xl backdrop-blur-sm">
            <p className="text-base font-semibold text-white">Tap or press an arrow key</p>
            <p className="text-xs text-white/70">to start playing</p>
          </div>
        )}
        {paused && started && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 rounded-xl backdrop-blur-sm">
            <p className="text-lg font-bold text-white">Paused</p>
            <button
              type="button"
              onClick={() => setPaused(false)}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Resume
            </button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 rounded-xl backdrop-blur-sm">
            <p className="text-lg font-bold text-white">Game Over</p>
            <p className="text-sm text-white/70">Score: {score}</p>
            <button
              type="button"
              onClick={restart}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* On-screen D-pad — always available, most useful on touch devices */}
      <div className="grid grid-cols-3 gap-1.5 sm:hidden">
        <div />
        <button type="button" className={dpadBtn} onClick={() => setDirection("up")} aria-label="Up">
          <ArrowUp className="h-5 w-5" />
        </button>
        <div />
        <button type="button" className={dpadBtn} onClick={() => setDirection("left")} aria-label="Left">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button type="button" className={dpadBtn} onClick={() => setDirection("down")} aria-label="Down">
          <ArrowDown className="h-5 w-5" />
        </button>
        <button type="button" className={dpadBtn} onClick={() => setDirection("right")} aria-label="Right">
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Arrow keys or swipe to move &middot; P to pause
      </p>
    </div>
  );
}
