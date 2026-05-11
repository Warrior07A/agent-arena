import type {
  GameAgentMetadata,
  GameMetadata,
  ServerMessage,
} from "@repo/types";
import type { GameStatus } from "@repo/db";
import { prisma } from "@repo/db";
import { GameEngine, type GameConfig } from "./engine";

type ClientData = { id: string };
type Client = Bun.ServerWebSocket<ClientData>;

const clients = new Set<Client>();

const PORT = process.env.PORT || 3001;
const TICK_INTERVAL_MS = Math.floor(1000 / 24);
const INTERMISSION_MS = 30_000;
const MATCH_DURATION_MS = 3 * 60 * 1000;

const GAME_NAMES = [
  "Phoenix Fury", "Velocity Vault", "Alpha Clash", "Beta Blitz",
  "Gamma Grid", "Delta Dash", "Epsilon Edge", "Zeta Zone",
  "Theta Thunder", "Iota Impact", "Kappa Krush", "Sigma Storm",
  "Omega Onslaught", "Nova Nexus", "Rift Rumble", "Void Vortex",
];

const AGENT_COUNT = 5;

let engine: GameEngine | null = null;
let lastEngineTickAt = Date.now();
let nextMatchCheckAt = Date.now();
let nextMatchAt = Date.now();
let transitioning = false;
let showWinnerUntil = 0;
let lastCountdownBroadcast = 0;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function makeClientId(): string {
  return `c-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function scheduleMatchCheck(delayMs: number): void {
  nextMatchCheckAt = Date.now() + Math.max(0, delayMs);
}

function broadcast(message: ServerMessage): void {
  const payload = JSON.stringify(message);
  for (const client of clients) client.send(payload);
}

function broadcastSnapshot(): void {
  if (!engine) return;
  broadcast({ type: "snapshot", data: engine.getSnapshot() });
}

function broadcastStatus(status: GameMetadata): void {
  broadcast({ type: "status", data: status });
}

async function updateGameStatus(
  gameId: number,
  status: GameStatus,
  winnerAgentId?: string | null,
) {
  try {
    return await prisma.game.update({
      where: { id: gameId },
      data: {
        status,
        ...(winnerAgentId !== undefined ? { winnerAgentId } : {}),
        ...(status === "LIVE" ? { startedAt: new Date() } : {}),
        ...(status === "ENDED" ? { endedAt: new Date() } : {}),
      },
    });
  } catch (error) {
    console.error("[arena] failed to update game status", { gameId, status, error });
    return null;
  }
}

async function fetchNextGame() {
  try {
    return await prisma.game.findFirst({
      where: { status: "UPCOMING" },
      orderBy: { createdAt: "asc" },
      include: { agents: { include: { agent: true } } },
    });
  } catch (error) {
    console.error("[arena] failed to fetch next game", error);
    return null;
  }
}

async function createNextGame(): Promise<void> {
  try {
    const agents = await prisma.agent.findMany({ take: AGENT_COUNT });
    if (agents.length === 0) {
      console.warn("[arena] no agents in database, cannot create game");
      return;
    }
    const name = GAME_NAMES[Math.floor(Math.random() * GAME_NAMES.length)]!;
    const game = await prisma.game.create({
      data: {
        name,
        status: "UPCOMING",
        agents: { create: agents.map((a) => ({ agentId: a.id })) },
      },
    });
    console.log("[arena] created new upcoming game", { gameId: game.id, name });
  } catch (error) {
    console.error("[arena] failed to create next game", error);
  }
}

function toGameMetadata(
  game: { id: number; name: string; totalPool: bigint; startedAt: Date | null; agents: { agent: GameAgentMetadata }[] },
  status: GameStatus = "UPCOMING",
): GameMetadata {
  return {
    id: game.id,
    name: game.name,
    pool: Number(game.totalPool) / 1e6,
    status,
    startedAt: game.startedAt?.toISOString(),
    agents: game.agents.map((x) => x.agent),
  };
}

function getLiveMetadata(activeEngine: GameEngine): GameMetadata {
  return {
    id: activeEngine.id,
    name: activeEngine.name,
    pool: activeEngine.pool,
    status: "LIVE",
    startedAt: new Date(activeEngine.getSnapshot().startedAt).toISOString(),
    agents: activeEngine.getAgents(),
  };
}

function handleBetConfirmed(body: { gameId: number; pool: number }): void {
  const { gameId, pool } = body;
  if (
    gameId === undefined || gameId === null ||
    pool === undefined || pool === null ||
    !engine || engine.id !== gameId
  ) return;

  engine.pool = pool;
  broadcastStatus(getLiveMetadata(engine));
  console.log("[arena] pool updated via bet", { gameId, pool });
}

async function finishCurrentMatch(): Promise<void> {
  if (!engine) return;

  engine.finishMatch();

  const id = engine.id;
  const winner = engine.getWinner()!;
  const agents = engine.getAgents();
  engine = null;

  broadcastSnapshot();
  broadcast({ type: "winner", data: { gameId: id, winnerId: winner.id, winnerName: winner.name } });

  showWinnerUntil = Date.now() + 6_000;
  nextMatchAt = Date.now() + INTERMISSION_MS;
  scheduleMatchCheck(INTERMISSION_MS);

  try {
    await updateGameStatus(id, "ENDED", winner.id);
    console.log("[arena] triggering payout resolution", { gameId: id });
    const res = await fetch("http://localhost:3000/api/games/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: id, agentRanks: agents }),
    });
    const data = await res.json();
    console.log("[arena] game resolved", { gameId: id, data });
  } catch (err) {
    console.error("[arena] resolve failed", { gameId: id, err });
  }

  const upcomingCount = await prisma.game.count({ where: { status: "UPCOMING" } });
  if (upcomingCount < 3) {
    await createNextGame();
  }

  transitioning = false;
}

function tickLoop(): void {
  const now = Date.now();

  if (!engine) {
    if (!transitioning && now >= nextMatchCheckAt) {
      transitioning = true;
      startNextMatch();
      return;
    }

    if (now < showWinnerUntil) return;

    if (now - lastCountdownBroadcast < 500) return;
    lastCountdownBroadcast = now;

    const remaining = Math.max(0, Math.ceil((nextMatchAt - now) / 1000));
    broadcastStatus({
      id: 0,
      name: "Next match incoming...",
      pool: 0,
      status: "ENDED",
      remainingSeconds: remaining,
      agents: [],
    });
    return;
  }

  const deltaSeconds = clamp((now - lastEngineTickAt) / 1000, 0, 0.12);
  lastEngineTickAt = now;
  engine.tick(deltaSeconds, now);

  if (engine.isMatchComplete()) {
    transitioning = true;
    finishCurrentMatch();
    return;
  }

  broadcastSnapshot();
}

async function startNextMatch(): Promise<void> {
  const game = await fetchNextGame();

  if (!game) {
    console.log("[arena] no upcoming games, creating one...");
    await createNextGame();
    scheduleMatchCheck(2_000);
    transitioning = false;
    return;
  }

  const liveGame = await updateGameStatus(game.id, "LIVE");
  if (!liveGame) {
    scheduleMatchCheck(1_000);
    transitioning = false;
    return;
  }

  const startedAtMs = liveGame.startedAt?.getTime() ?? Date.now();
  const config: GameConfig = {
    id: game.id,
    name: game.name,
    pool: Number(game.totalPool) / 1e6,
    durationMs: MATCH_DURATION_MS,
    startedAtMs,
    agents: game.agents.map((x) => x.agent),
  };

  engine = new GameEngine(config);
  lastEngineTickAt = Date.now();
  transitioning = false;

  broadcastStatus({
    ...toGameMetadata(game, "LIVE"),
    startedAt: new Date(startedAtMs).toISOString(),
  });

  console.log("[arena] starting match", { gameId: game.id, name: game.name, durationMs: MATCH_DURATION_MS });
}

const server = Bun.serve<ClientData, never>({
  port: PORT,

  async fetch(request, server) {
    const url = new URL(request.url);

    if (url.pathname === "/bet-confirmed") {
      if (engine?.id) {
        prisma.game.findUnique({
          where: { id: engine.id },
          select: {
            id: true,
            totalPool: true,
          }
        }).then(game => {
          if (!game) {
            console.warn("[arena] bet confirmed for non-existent game", { gameId: engine?.id });
            return;
          }
          handleBetConfirmed({ gameId: game.id, pool: Number(game.totalPool) / 1e6 });
        })
      }
      return new Response("ok", { status: 200 });
    }

    const ok = server.upgrade(request, { data: { id: makeClientId() } });
    if (ok) return;

    return new Response(
      "Upgrade required: connect via WebSocket to receive game state.",
      { status: 426 },
    );
  },

  websocket: {
    open(client) {
      clients.add(client);
      console.log("[arena] client connected", {
        clientId: client.data.id,
        clients: clients.size,
      });
      if (engine) {
        client.send(
          JSON.stringify({ type: "status", data: getLiveMetadata(engine) }),
        );
        client.send(
          JSON.stringify({ type: "snapshot", data: engine.getSnapshot() }),
        );
      }
    },

    message(client, raw) { },

    close(client, code, reason) {
      clients.delete(client);
      console.log("[arena] client disconnected", {
        clientId: client.data.id,
        clients: clients.size,
        code,
        reason: reason || undefined,
      });
    },
  },
});

async function init() {
  const liveGames = await prisma.game.findMany({
    where: { status: "LIVE" },
    include: { bets: { where: { status: "PENDING" } } },
  });

  for (const game of liveGames) {
    const pendingBets = game.bets;

    await prisma.bet.updateMany({
      where: { id: { in: pendingBets.map((b) => b.id) } },
      data: { status: "REFUNDED", },
    });

    // refund bets via escrow cancellation

    await prisma.game.update({
      where: { id: game.id },
      data: { status: "CANCELLED", endedAt: new Date() },
    });
  }
  setInterval(tickLoop, TICK_INTERVAL_MS);
}

await init().catch((err) => {
  console.error("[arena] initialization failed", err);
  process.exit(1);
});

console.log("[arena] listening", { url: `ws://localhost:${server.port}` });
