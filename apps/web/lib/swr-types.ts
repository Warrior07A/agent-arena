import type { Game, Agent, Bet } from "@repo/db";

type NormalizedGame = Omit<Game, "totalPool" | "feeAmount"> & {
  totalPool: number;
  feeAmount: number | null;
};
export type GameWithAgents = NormalizedGame & { agents: Agent[] };

export type GamesResponse = {
  games: GameWithAgents[];
  nextCursor: number | null;
};

export type GameDetailResponse = {
  game: GameWithAgents;
  userBets: NormalizedBet[];
};

type NormalizedBet = Omit<Bet, "amount" | "payout"> & {
  amount: number;
  payout: number | null;
};

export type BetsResponse = {
  bets: (NormalizedBet & { game: Game; agent: Agent })[];
  nextCursor: string | null;
};

export type BetPlacementResponse = {
  bet: NormalizedBet;
};

export type BetInitResponse = {
  escrowPublicKey: string;
  escrowUSDCAddress: string;
  usdcAmount: number;
};

export type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  totalBetsPlaced: number;
  totalBetsWon: number;
  totalBetsLost: number;
  totalWagered: number;
  totalPayout: number;
  netEarnings: number;
};

export type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
};
