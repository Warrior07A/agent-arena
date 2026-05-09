import type { Food, GameSnapshot, Point, Snake, World } from "@repo/types";

export type Viewport = {
  width: number;
  height: number;
  ratio: number;
};

export type Camera = {
  x: number;
  y: number;
  followingId: string | null;
};

type Bbox = { x: number; y: number; w: number; h: number };

const SPRITE_SIZE = 60;
const SHADOW_SIZE = 83;
const FOOD_RADIUS = 8;

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function inBbox(p: Point, margin: number, b: Bbox): boolean {
  return (
    p.x + margin >= b.x &&
    p.x - margin <= b.x + b.w &&
    p.y + margin >= b.y &&
    p.y - margin <= b.y + b.h
  );
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  world: World,
  view: Bbox,
  tile: HTMLImageElement
) {
  const x = Math.max(view.x, 0);
  const y = Math.max(view.y, 0);
  const w = Math.min(view.x + view.w, world.WIDTH) - x;
  const h = Math.min(view.y + view.h, world.HEIGHT) - y;
  if (w <= 0 || h <= 0) return;

  ctx.fillStyle = ctx.createPattern(tile, "repeat") || "#444";
  ctx.fillRect(x, y, w, h);
}

function imageReady(image: HTMLImageElement): boolean {
  return image.complete && image.naturalWidth > 0;
}

function drawFood(ctx: CanvasRenderingContext2D, food: Food[], view: Bbox) {
  const sides = 6;
  const angle = (Math.PI * 2) / sides;

  ctx.fillStyle = "#ff0000";
  for (const item of food) {
    if (!inBbox(item, FOOD_RADIUS, view)) continue;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const x = item.x + FOOD_RADIUS * Math.cos(angle * i);
      const y = item.y + FOOD_RADIUS * Math.sin(angle * i);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function drawShadows(
  ctx: CanvasRenderingContext2D,
  snake: Snake,
  shadow: HTMLImageElement,
  view: Bbox
) {
  if (!imageReady(shadow)) return;

  const scale = snake.size / SPRITE_SIZE;
  const drawSize = SHADOW_SIZE * scale;
  const half = drawSize / 2;

  ctx.save();
  ctx.globalAlpha = 0.72;
  for (let i = snake.body.length - 1; i >= 0; i--) {
    const section = snake.body[i]!;
    if (!inBbox(section, half, view)) continue;
    ctx.drawImage(
      shadow,
      section.x - half,
      section.y - half,
      drawSize,
      drawSize
    );
  }
  ctx.restore();
}

function drawSnakeBody(
  ctx: CanvasRenderingContext2D,
  snake: Snake,
  circle: HTMLImageElement,
  view: Bbox
) {
  const half = snake.size / 2;

  for (let i = snake.body.length - 1; i >= 0; i--) {
    const section = snake.body[i]!;
    if (!inBbox(section, half, view)) continue;

    if (imageReady(circle)) {
      ctx.drawImage(
        circle,
        section.x - half,
        section.y - half,
        snake.size,
        snake.size
      );
    } else {
      ctx.beginPath();
      ctx.arc(section.x, section.y, half, 0, Math.PI * 2);
      ctx.fillStyle = snake.color;
      ctx.fill();
      ctx.lineWidth = Math.max(1.3, snake.size * 0.036);
      ctx.strokeStyle = snake.accent;
      ctx.stroke();
    }
  }
}

function rotateLocal(angle: number, x: number, y: number): Point {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  snake: Snake,
  eyeWhite: HTMLImageElement,
  eyeBlack: HTMLImageElement
) {
  if (!imageReady(eyeWhite) || !imageReady(eyeBlack)) return;

  const scale = snake.size / SPRITE_SIZE;
  const whiteSize = 28 * scale;
  const blackSize = 14 * scale;
  const whiteHalf = whiteSize / 2;
  const blackHalf = blackSize / 2;
  const lateral = snake.size * 0.25;
  const forward = snake.size * 0.125;
  const pupilForward = whiteSize * 0.25;

  const left = rotateLocal(snake.angle, -lateral, -forward);
  const right = rotateLocal(snake.angle, lateral, -forward);
  const pupil = rotateLocal(snake.angle, 0, -pupilForward);

  const lx = snake.head.x + left.x;
  const ly = snake.head.y + left.y;
  const rx = snake.head.x + right.x;
  const ry = snake.head.y + right.y;

  ctx.drawImage(eyeWhite, lx - whiteHalf, ly - whiteHalf, whiteSize, whiteSize);
  ctx.drawImage(eyeWhite, rx - whiteHalf, ry - whiteHalf, whiteSize, whiteSize);
  ctx.drawImage(
    eyeBlack,
    lx + pupil.x - blackHalf,
    ly + pupil.y - blackHalf,
    blackSize,
    blackSize
  );
  ctx.drawImage(
    eyeBlack,
    rx + pupil.x - blackHalf,
    ry + pupil.y - blackHalf,
    blackSize,
    blackSize
  );
}

export function pickCameraTarget(
  snapshot: GameSnapshot,
  followingId: string | null
): Point & { followingId: string | null } {
  if (followingId) {
    const selected = snapshot.snakes.find((snake) => snake.id === followingId);
    if (selected?.alive) return { ...selected.head, followingId: selected.id };
  }

  const firstLiving = snapshot.snakes.find((snake) => snake.alive);
  if (firstLiving) return { ...firstLiving.head, followingId: firstLiving.id };

  const world = snapshot.world;
  return {
    x: world.WIDTH / 2,
    y: world.HEIGHT / 2,
    followingId: null,
  };
}

export function advanceCamera(
  camera: Camera,
  viewport: Viewport,
  world: World
): void {
  const halfW = Math.min(viewport.width / 2, world.WIDTH / 2);
  const halfH = Math.min(viewport.height / 2, world.HEIGHT / 2);
  camera.x = clamp(camera.x, halfW, world.WIDTH - halfW);
  camera.y = clamp(camera.y, halfH, world.HEIGHT - halfH);
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  snapshot: GameSnapshot,
  camera: Camera,
  tile: HTMLImageElement,
  circle: HTMLImageElement,
  shadow: HTMLImageElement,
  eyeWhite: HTMLImageElement,
  eyeBlack: HTMLImageElement
): void {
  ctx.setTransform(viewport.ratio, 0, 0, viewport.ratio, 0, 0);
  ctx.fillStyle = "#444";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const world = snapshot.world;

  ctx.save();
  ctx.translate(viewport.width / 2 - camera.x, viewport.height / 2 - camera.y);

  const view: Bbox = {
    x: camera.x - viewport.width / 2,
    y: camera.y - viewport.height / 2,
    w: viewport.width,
    h: viewport.height,
  };

  drawBackground(ctx, world, view, tile);
  drawFood(ctx, snapshot.food, view);

  for (const snake of snapshot.snakes) {
    if (!snake.alive) continue;
    drawShadows(ctx, snake, shadow, view);
  }

  for (const snake of snapshot.snakes) {
    if (!snake.alive) continue;
    drawSnakeBody(ctx, snake, circle, view);
    if (inBbox(snake.head, snake.size + 40, view)) {
      drawEyes(ctx, snake, eyeWhite, eyeBlack);
    }
  }

  ctx.restore();
}
