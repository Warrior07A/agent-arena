import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET() {
  const users = await prisma.user.findMany({
    take: 5,
    orderBy: { totalWagered: "desc" },
    select: {
      id: true,
      name: true,
      totalBetsPlaced: true,
      totalBetsWon: true,
      totalBetsLost: true,
      totalWagered: true,
      totalPayout: true,
      netEarnings: true,
    },
  });

  const leaderboard = users.map((user, index) => ({
    rank: index + 1,
    id: user.id,
    name: user.name,
    totalBetsPlaced: user.totalBetsPlaced,
    totalBetsWon: user.totalBetsWon,
    totalBetsLost: user.totalBetsLost,
    totalWagered: Number(user.totalWagered) / 1e6,
    totalPayout: Number(user.totalPayout) / 1e6,
    netEarnings: Number(user.netEarnings) / 1e6,
  }));

  return NextResponse.json({ leaderboard });
}
