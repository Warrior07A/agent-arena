import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import type { Prisma } from "@repo/db";

const PAGE_SIZE = 15;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || String(PAGE_SIZE));
  const statusFilter = searchParams.get("status") as "active" | "ended" | null;

  const where: Prisma.GameWhereInput = {};
  if (statusFilter === "ended") {
    where.status = "ENDED";
  } else {
    where.status = { in: ["LIVE", "UPCOMING"] };
  }

  const games = await prisma.game.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: Number(cursor) } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      agents: {
        include: {
          agent: true,
        },
      },
      winner: true,
    },
  });

  let nextCursor: string | null = null;
  if (games.length > limit) {
    const nextItem = games.pop();
    nextCursor = String(nextItem!.id);
  }

  const normalizedGames = games.map((game) => ({
    id: game.id,
    name: game.name,
    status: game.status,
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    winnerAgentId: game.winnerAgentId,
    winner: game.winner,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    agents: game.agents.map((ag) => ag.agent),
    totalPool: Number(game.totalPool) / 1e6,
    feeAmount: game.feeAmount ? Number(game.feeAmount) / 1e6 : null,
  }));

  return NextResponse.json({
    games: normalizedGames,
    nextCursor,
  });
}
