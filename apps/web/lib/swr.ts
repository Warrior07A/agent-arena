import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import type {
  GamesResponse,
  GameDetailResponse,
  BetsResponse,
  BetPlacementResponse,
  BetInitResponse,
  LeaderboardResponse,
} from "@/lib/swr-types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export function useGames(statusFilter?: "active" | "ended") {
  const { data, error, isLoading, size, setSize, isValidating, mutate } =
    useSWRInfinite<GamesResponse>((pageIndex, previousPageData) => {
      const cursor = pageIndex === 0 ? null : previousPageData?.nextCursor;
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "15");
      if (statusFilter) params.set("status", statusFilter);
      return `/api/games?${params.toString()}`;
    }, fetcher);

  const games = data ? data.flatMap((page) => page.games) : [];
  const hasMore = data ? data[data.length - 1]?.nextCursor !== null : true;
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  return {
    games,
    hasMore: !!hasMore,
    isLoading,
    isLoadingMore: !!isLoadingMore,
    isValidating,
    error,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}

export function useGameDetail(gameId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<GameDetailResponse>(
    gameId ? `/api/games/${gameId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    game: data?.game ?? null,
    userBets: data?.userBets ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useBets(enabled = true) {
  const { data, error, isLoading, size, setSize, isValidating, mutate } =
    useSWRInfinite<BetsResponse>((pageIndex, previousPageData) => {
      if (!enabled) return null;
      if (previousPageData && !previousPageData.nextCursor) return null;
      const cursor = pageIndex === 0 ? null : previousPageData?.nextCursor;
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "20");
      return `/api/bets?${params.toString()}`;
    },
      fetcher,
      {
        refreshInterval: 3000,
      }
    );

  const bets = data ? data.flatMap((page) => page.bets) : [];
  const hasMore = data ? data[data.length - 1]?.nextCursor !== null : true;

  return {
    bets,
    hasMore: !!hasMore,
    isLoading,
    isLoadingMore: !!(
      isLoading ||
      (size > 0 && data && typeof data[size - 1] === "undefined")
    ),
    isValidating,
    error,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}

export function useLeaderboard() {
  const { data, error, isLoading, mutate } = useSWR<LeaderboardResponse>(
    "/api/leaderboard",
    fetcher
  );

  return {
    leaderboard: data?.leaderboard ?? [],
    isLoading,
    error,
    mutate,
  };
}

export async function requestBetSwap(
  gameId: number,
  agentId: string,
  amount: number,
): Promise<BetInitResponse> {
  const res = await fetch("/api/bets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, agentId, amount }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ error: "Failed to initiate bet" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function confirmBet(
  gameId: number,
  agentId: string,
  amount: number,
  walletAddress: string,
  txHash: string): Promise<BetPlacementResponse> {
  const res = await fetch("/api/bets", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gameId,
      agentId,
      amount,
      walletAddress,
      txHash,
    }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ error: "Failed to confirm bet" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}
