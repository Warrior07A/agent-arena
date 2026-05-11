import { heuristicStrategy, resetStrategyMemory } from "./strategy";
import type {
  Agent,
  Food,
  GameAgentMetadata,
  GameSnapshot,
  Point,
  World,
} from "@repo/types";

const SPRITE_SIZE = 60;
const INITIAL_SCALE = 0.6;
const BASE_SIZE = SPRITE_SIZE * INITIAL_SCALE;
const INITIAL_TAIL_SECTIONS = 30;
const SPEED = 130;
const SIZE_GROWTH_FACTOR = 1.01;
const EDGE_OFFSET = 4;

const FOOD_COUNT = 100;
const FOOD_SIZE = 8;
const FOOD_PULL_PER_FRAME = 14;

const WORLD: World = {
  width: 1600,
  height: 1000,
};

type AgentInternal = Agent & {
  headPath: Point[];
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function randomInt(min: number, max: number): number {
  return (
    Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
    Math.ceil(min)
  );
}

function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function preferredDistance(size: number): number {
  return 17 * (size / SPRITE_SIZE);
}

function createFood(id: string, x: number, y: number): Food {
  return { id, x, y };
}

function createRandomFood(id: string): Food {
  return createFood(id, randomInt(0, WORLD.width), randomInt(0, WORLD.height));
}

function spawnOffset(index: number, total: number): Point {
  return {
    x: (index - (total - 1) / 2) * 200,
    y: 0,
  };
}

function createAgent(
  agentData: GameAgentMetadata,
  index: number,
  total: number,
): AgentInternal {
  const offset = spawnOffset(index, total);
  const head = {
    x: WORLD.width / 2 + offset.x,
    y: WORLD.height / 2 + offset.y,
  };
  const headPath: Point[] = [{ x: head.x, y: head.y }];

  for (let i = 1; i <= INITIAL_TAIL_SECTIONS; i++) {
    headPath.push({
      x: head.x,
      y: head.y + i * preferredDistance(BASE_SIZE),
    });
  }

  return {
    id: agentData.id,
    name: agentData.name,
    color: agentData.color,
    accent: agentData.accent,
    alive: true,
    score: 0,
    size: BASE_SIZE,
    angle: 0,
    head,
    body: [],
    length: INITIAL_TAIL_SECTIONS + 1,
    survivedMs: 0,
    rank: null,
    headPath: headPath,
  };
}

function nextSectionIndex(
  headPath: Point[],
  currentIndex: number,
  sectionDistance: number,
): number {
  let len = 0;
  let dif = len - sectionDistance;
  let i = currentIndex;
  let prevDif: number | null = null;

  while (i + 1 < headPath.length && dif < 0) {
    const current = headPath[i]!;
    const next = headPath[i + 1]!;
    len += Math.hypot(current.x - next.x, current.y - next.y);
    prevDif = dif;
    dif = len - sectionDistance;
    i++;
  }

  if (prevDif === null || Math.abs(prevDif) > Math.abs(dif)) return i;
  return i - 1;
}

export type GameConfig = {
  id: number;
  name: string;
  pool: number;
  durationMs: number;
  startedAtMs?: number;
  agents: GameAgentMetadata[];
};

export class GameEngine {
  public readonly id: number;
  public readonly name: string;
  public pool: number;

  private matchDuration: number;
  private remainingMs: number;
  private elapsedMs: number;
  private startedAt: number;
  private food: Food[];
  private agents: AgentInternal[];
  private readonly internals = new Map<string, AgentInternal>();
  private nextFoodSeq = 0;
  private winnerId: string | null = null;

  constructor(config: GameConfig) {
    this.id = config.id;
    this.name = config.name;
    this.pool = config.pool;
    this.matchDuration = Math.max(config.durationMs, 30000);
    this.startedAt = config.startedAtMs ?? Date.now();
    this.elapsedMs = clamp(Date.now() - this.startedAt, 0, this.matchDuration);
    this.remainingMs = Math.max(0, this.matchDuration - this.elapsedMs);

    this.food = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
      this.food.push(createRandomFood(this.nextFoodId()));
    }

    resetStrategyMemory();
    this.agents = [];

    config.agents.forEach((agentData, index) => {
      const agent = createAgent(agentData, index, config.agents.length);
      this.agents.push(agent);
      this.internals.set(agent.id, agent);
    });

    for (const agent of this.internals.values()) {
      this.recomputeSections(agent);
    }
    this.updateRanks();
  }

  public isMatchComplete(): boolean {
    if (this.remainingMs <= 0) return true;

    let alive = 0;
    for (const agent of this.agents) {
      if (agent.alive) alive++;
    }
    return alive <= 1;
  }

  public finishMatch(): void {
    this.updateRanks();
    this.winnerId = this.agents[0]?.id ?? null;
    this.remainingMs = 0;
  }

  public tick(deltaSeconds: number, now: number): void {
    const elapsedMs = clamp(now - this.startedAt, 0, this.matchDuration);
    this.elapsedMs = elapsedMs;
    this.remainingMs = Math.max(0, this.matchDuration - elapsedMs);

    for (const agent of this.internals.values()) {
      if (!agent.alive) continue;
      agent.survivedMs = elapsedMs;
      agent.angle = heuristicStrategy({ self: agent, deltaSeconds });
      this.moveAgent(agent, deltaSeconds);
      const lastIndex = this.recomputeSections(agent);
      this.adjustHeadPath(agent, lastIndex);
    }

    this.handleFoodTouches(deltaSeconds);
    this.resolveCollisions();
    this.updateRanks();
  }

  public getSnapshot(): GameSnapshot {
    return {
      gameId: this.id,
      gameName: this.name,
      startedAt: this.startedAt,
      elapsedMs: this.elapsedMs,
      durationMs: this.matchDuration,
      world: WORLD,
      agents: this.agents,
      food: this.food,
      remainingMs: this.remainingMs,
      winnerId: this.winnerId,
    };
  }

  public getWinner(): Agent | null {
    return this.agents.find((x) => x.id === this.winnerId) || null;
  }

  public getAgents(): GameAgentMetadata[] {
    return this.agents;
  }

  private nextFoodId(): string {
    return `f-${this.nextFoodSeq++}`;
  }

  private moveAgent(agent: AgentInternal, deltaSeconds: number): void {
    const padding = agent.size * 0.5;
    const minX = padding;
    const minY = padding;
    const maxX = WORLD.width - padding;
    const maxY = WORLD.height - padding;

    let nextX = agent.head.x + Math.sin(agent.angle) * SPEED * deltaSeconds;
    let nextY = agent.head.y - Math.cos(agent.angle) * SPEED * deltaSeconds;

    const hitWall =
      nextX < minX || nextX > maxX || nextY < minY || nextY > maxY;

    if (hitWall) {
      nextX = clamp(nextX, minX, maxX);
      nextY = clamp(nextY, minY, maxY);
      agent.angle = Math.atan2(
        WORLD.width / 2 - nextX,
        nextY - WORLD.height / 2,
      );
    }

    agent.head.x = nextX;
    agent.head.y = nextY;

    agent.headPath.pop();
    agent.headPath.unshift({ x: nextX, y: nextY });
  }

  private recomputeSections(agent: AgentInternal): number {
    const { body, headPath, length, size } = agent;
    let index = 0;
    let written = 0;
    const sectionDistance = preferredDistance(size);

    for (let i = 0; i < length; i++) {
      const point = headPath[index];
      if (!point) break;

      let section = body[written];
      if (!section) {
        section = { x: 0, y: 0 };
        body[written] = section;
      }
      section.x = point.x;
      section.y = point.y;
      written++;

      index = nextSectionIndex(headPath, index, sectionDistance);
    }

    body.length = written;
    return index;
  }

  private adjustHeadPath(agent: AgentInternal, lastIndex: number): void {
    if (agent.headPath.length === 0) {
      agent.headPath.push({ x: agent.head.x, y: agent.head.y });
      return;
    }

    if (lastIndex >= agent.headPath.length - 1) {
      const last = agent.headPath[agent.headPath.length - 1]!;
      agent.headPath.push({ x: last.x, y: last.y });
    } else {
      agent.headPath.pop();
    }
  }

  private handleFoodTouches(deltaSeconds: number): void {
    const pull = FOOD_PULL_PER_FRAME * (deltaSeconds * 60);

    for (const agent of this.internals.values()) {
      if (!agent.alive) continue;
      const reach = agent.size * 0.5 + FOOD_SIZE;
      const reachSq = reach * reach;

      for (let i = 0; i < this.food.length; i++) {
        const food = this.food[i]!;

        if (distanceSquared(agent.head, food) <= reachSq) {
          const dx = agent.head.x - food.x;
          const dy = agent.head.y - food.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= pull) {
            agent.score += 1;
            agent.length += 1;
            agent.size *= SIZE_GROWTH_FACTOR;
            this.recomputeSections(agent);
            this.food[i] = createRandomFood(this.nextFoodId());
          } else if (dist > 0) {
            const step = Math.min(pull, dist);
            food.x += (dx / dist) * step;
            food.y += (dy / dist) * step;
          }
        }
      }
    }
  }

  private resolveCollisions(): void {
    const living = this.agents.filter((agent) => agent.alive);
    if (living.length < 2) return;

    const losers = new Set<string>();

    for (const agent of living) {
      const edge = {
        x:
          agent.head.x +
          Math.sin(agent.angle) * (agent.size * 0.5 + EDGE_OFFSET),
        y:
          agent.head.y -
          Math.cos(agent.angle) * (agent.size * 0.5 + EDGE_OFFSET),
      };

      for (const other of living) {
        if (other.id === agent.id) continue;
        const hitDistance = EDGE_OFFSET + other.size * 0.5;
        const hitDistanceSq = hitDistance * hitDistance;

        for (const section of other.body) {
          if (distanceSquared(edge, section) <= hitDistanceSq) {
            losers.add(agent.id);
            break;
          }
        }
      }
    }

    for (const id of losers) {
      const loser = this.internals.get(id);
      if (loser) this.eliminate(loser);
    }
  }

  private eliminate(agent: AgentInternal): void {
    if (!agent.alive) return;

    agent.alive = false;
    agent.survivedMs = this.elapsedMs;

    const step = Math.max(
      1,
      Math.round(agent.headPath.length / agent.length) * 2,
    );
    for (let i = 0; i < agent.headPath.length; i += step) {
      const point = agent.headPath[i]!;
      this.food.push(
        createFood(
          this.nextFoodId(),
          clamp(point.x + randomInt(-10, 10), 0, WORLD.width),
          clamp(point.y + randomInt(-10, 10), 0, WORLD.height),
        ),
      );
    }
  }

  private updateRanks(): void {
    this.agents.sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return b.survivedMs - a.survivedMs;
    });

    this.agents.forEach((agent, index) => {
      agent.rank = index + 1;
    });
  }
}
