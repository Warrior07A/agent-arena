import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  verifyUSDCDeposit,
  getSharedEscrowUSDCAddress,
  getSharedEscrowPublicKey,
} from "@/lib/escrow";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || String(PAGE_SIZE));

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { placedAt: "desc" },
    include: {
      game: true,
      agent: true,
    },
  });

  let nextCursor: string | null = null;
  if (bets.length > limit) {
    const nextItem = bets.pop();
    nextCursor = nextItem!.id;
  }

  const normalizedBets = bets.map((bet) => ({
    ...bet,
    amount: Number(bet.amount) / 1e6,
    payout: bet.payout ? Number(bet.payout) / 1e6 : null,
    game: {
      ...bet.game,
      totalPool: Number(bet.game.totalPool) / 1e6,
      feeAmount: bet.game.feeAmount ? Number(bet.game.feeAmount) / 1e6 : null,
    }
  }));

  return NextResponse.json({
    bets: normalizedBets,
    nextCursor,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { gameId, agentId, amount } = body;

  if (!gameId || !agentId || !amount) {
    return NextResponse.json(
      { error: "Missing required fields: gameId, agentId, amount" },
      { status: 400 }
    );
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { agents: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "LIVE") {
    return NextResponse.json(
      { error: "Betting is only open during live matches" },
      { status: 400 }
    );
  }

  const existingBet = await prisma.bet.findFirst({
    where: { gameId, userId: session.user.id, agentId },
  });

  if (existingBet) {
    return NextResponse.json(
      { error: "Already placed a bet on this agent" },
      { status: 409 }
    );
  }

  const escrowPublicKey = getSharedEscrowPublicKey();
  const escrowUSDCAddress = await getSharedEscrowUSDCAddress();
  const usdcBase = Math.round(amount * 1e6);

  return NextResponse.json({
    escrowPublicKey,
    escrowUSDCAddress,
    usdcAmount: usdcBase,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { gameId, agentId, amount, walletAddress, txHash } = body;

  if (!gameId || !agentId || !amount || !walletAddress || !txHash) {
    return NextResponse.json(
      { error: "Missing required fields: gameId, agentId, amount, walletAddress, txHash" },
      { status: 400 }
    );
  }

  const existingBet = await prisma.bet.findFirst({
    where: { gameId, userId: session.user.id, agentId },
  });

  if (existingBet) {
    return NextResponse.json(
      { error: "Already placed a bet on this agent" },
      { status: 409 }
    );
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const amountBase = Math.round(amount * 1e6);

  const verify = async (retry: number = 0) => {
    if (retry === 5) {
      return false;
    }
    const done = await verifyUSDCDeposit(txHash, amountBase);
    if (done) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 500));
    return await verify(retry + 1);
  }

  if (!(await verify())) {
    return NextResponse.json(
      { error: "Could not verify deposit to escrow. Ensure the transaction is confirmed." },
      { status: 400 }
    );
  }

  const bet = await prisma.bet.create({
    data: {
      userId: session.user.id,
      gameId,
      agentId,
      amount: amountBase,
      walletAddress,
      txHash,
      status: "PENDING",
    },
  });

  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: {
      totalPool: { increment: amountBase },
    },
    select: {
      id: true,
      totalPool: true,
    }
  });

  const agentUrl = process.env.AGENT_SERVER_URL ?? "http://localhost:3001";
  fetch(`${agentUrl}/bet-confirmed`).catch((err) => console.warn("[bets] failed to notify agent", err));

  return NextResponse.json({
    bet: {
      ...bet,
      amount: Number(bet.amount) / 1e6,
      payout: bet.payout ? Number(bet.payout) / 1e6 : null,
    },
  });
}
