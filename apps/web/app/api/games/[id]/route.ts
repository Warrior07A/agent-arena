import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const idNum = Number(id);

  const game = await prisma.game.findUnique({
    where: { id: idNum },
    include: {
      agents: {
        include: {
          agent: true,
        },
      },
      winner: true,
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  let userBets: Awaited<ReturnType<typeof prisma.bet.findMany>> = [];
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user) {
      userBets = await prisma.bet.findMany({
        where: {
          gameId: idNum,
          userId: session.user.id,
        },
      });
    }
  } catch {
    // no session, no bets
  }

  return NextResponse.json({
    game: {
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
    },
    userBets: userBets.map((b) => ({
      id: b.id,
      userId: b.userId,
      agentId: b.agentId,
      gameId: b.gameId,
      status: b.status,
      placedAt: b.placedAt,
      walletAddress: b.walletAddress,
      txHash: b.txHash,
      payoutTxHash: b.payoutTxHash,
      settledAt: b.settledAt,
      amount: Number(b.amount) / 1e6,
      payout: b.payout ? Number(b.payout) / 1e6 : null,
    })),
  });
}