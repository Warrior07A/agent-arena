import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { resolveGameEscrow } from "@/lib/escrow";
import { PublicKey } from "@solana/web3.js";

const FEE_BPS = parseInt(
  process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS ?? "100",
  10
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, agentRanks } = body as {
      gameId: number;
      agentRanks: Array<{ agentId: string; rank: number | null }>;
    };

    if (!gameId || !agentRanks?.length) {
      return NextResponse.json(
        { error: "Missing gameId or agentRanks" },
        { status: 400 }
      );
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status !== "ENDED") {
      return NextResponse.json(
        { error: "Game has not ended" },
        { status: 400 }
      );
    }

    const bets = await prisma.bet.findMany({
      where: { gameId, status: "PENDING" },
      include: { user: true },
    });

    if (bets.length === 0) {
      return NextResponse.json({ resolved: false, reason: "no_bets" });
    }

    const rankMap = new Map<string, number>();
    for (const r of agentRanks) {
      if (r.rank !== null) rankMap.set(r.agentId, r.rank);
    }

    const uniqueUsers = new Set(bets.map((b) => b.userId));

    let winningAgentIds: Set<string>;

    if (uniqueUsers.size === 1) {
      winningAgentIds = new Set([bets[0].agentId]);
    } else {
      let bestRank = Infinity;

      for (const bet of bets) {
        const rank = rankMap.get(bet.agentId);
        if (rank !== undefined && rank < bestRank) bestRank = rank;
      }

      winningAgentIds = new Set<string>();
      for (const bet of bets) {
        const rank = rankMap.get(bet.agentId);
        if (rank !== undefined && rank === bestRank) {
          winningAgentIds.add(bet.agentId);
        }
      }
    }

    const winningBets = bets.filter((b) => winningAgentIds.has(b.agentId));
    const losingBets = bets.filter((b) => !winningAgentIds.has(b.agentId));

    const totalWinningPool = winningBets.reduce(
      (sum, b) => sum + Number(b.amount),
      0
    );
    const totalPool = bets.reduce(
      (sum, b) => sum + Number(b.amount),
      0
    );

    const feeAmount = Math.floor((totalPool * FEE_BPS) / 10_000); // 1_000_000 is 100% in bips
    const payoutPool = totalPool - feeAmount;

    const winningEntrants = winningBets
      .map((bet) => ({
        walletAddress: bet.walletAddress,
        betAmount: Number(bet.amount),
        payoutAmount:
          totalWinningPool > 0
            ? Math.floor((Number(bet.amount) / totalWinningPool) * payoutPool)
            : 0,
      }))
      .filter((w) => {
        try {
          new PublicKey(w.walletAddress);
          return true;
        } catch {
          return false;
        }
      });

    let txIds: string[] = [];
    let actualFee = 0;

    try {
      const result = await resolveGameEscrow({
        winners: winningEntrants,
        totalPool,
      });
      txIds = result.txIds;
      actualFee = result.totalFee;
    } catch (err) {
      console.error("[resolve] escrow payout failed", err);
    }

    for (let i = 0; i < winningBets.length; i++) {
      const bet = winningBets[i];
      const payout = winningEntrants[i]?.payoutAmount ?? 0;
      const payoutTxHash = txIds[i] || undefined;

      await prisma.bet.update({
        where: { id: bet.id },
        data: {
          status: "WON",
          payout,
          payoutTxHash,
          settledAt: new Date(),
        },
      });

      try {
        await prisma.user.update({
          where: { id: bet.userId },
          data: {
            totalBetsWon: { increment: 1 },
            totalPayout: { increment: BigInt(payout) },
            netEarnings: {
              increment: BigInt(payout - Number(bet.amount)),
            },
          },
        });
      } catch {}
    }

    for (const bet of losingBets) {
      await prisma.bet.update({
        where: { id: bet.id },
        data: { status: "LOST", settledAt: new Date() },
      });

      try {
        await prisma.user.update({
          where: { id: bet.userId },
          data: { totalBetsLost: { increment: 1 } },
        });
      } catch {}
    }

    await prisma.game.update({
      where: { id: gameId },
      data: { feeAmount: actualFee },
    });

    return NextResponse.json({
      resolved: true,
      winningAgentIds: Array.from(winningAgentIds),
      winningBets: winningBets.length,
      losingBets: losingBets.length,
      totalPayout: payoutPool,
      platformFee: actualFee,
      payoutTxIds: txIds,
    });
  } catch (error) {
    console.error("[resolve] error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Resolution failed" },
      { status: 500 }
    );
  }
}
