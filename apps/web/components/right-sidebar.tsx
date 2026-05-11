"use client";

import { useAtomValue } from "jotai";
import type { Agent, GameAgentMetadata } from "@repo/types";
import {
  gameSnapshotAtom,
  gameMetadataAtom,
  matchWinnerAtom,
} from "@/lib/store";
import { useLeaderboard } from "@/lib/swr";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

type SidebarAgent = (Agent | GameAgentMetadata) & {
  score: number;
  alive: boolean;
  rank?: number | null;
};

function SegmentedBar({
  value,
  max,
  color = "foreground",
}: {
  value: number;
  max: number;
  color?: "foreground" | "muted";
}) {
  const segments = 12;
  const filled = Math.round((value / Math.max(max, 1)) * segments);
  const filledClass =
    color === "muted" ? "bg-muted-foreground" : "bg-foreground";

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 ${i < filled ? filledClass : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function AgentStatus({
  name,
  score,
  maxScore,
  alive,
  isWinner,
}: {
  name: string;
  score: number;
  maxScore: number;
  alive: boolean;
  isWinner?: boolean;
}) {
  return (
    <div className="py-2">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`size-1.5 ${alive ? "bg-foreground" : "bg-muted-foreground"}`}
          />
          <span
            className={`text-body-sm tracking-wide uppercase ${alive ? "text-foreground" : "text-muted-foreground line-through"}`}
          >
            {name}
          </span>
          {isWinner && (
            <span className="text-label border border-success px-1.5 py-0.5 text-success">
              WIN
            </span>
          )}
        </div>
        <span className="text-data text-foreground">{score}</span>
      </div>
      <SegmentedBar
        value={score}
        max={maxScore}
        color={alive ? "foreground" : "muted"}
      />
    </div>
  );
}

function LeaderboardRow({
  rank,
  name,
  netEarnings,
}: {
  rank: number;
  name: string;
  netEarnings: number;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 hover:bg-secondary">
      <div className="flex items-center gap-3">
        <span className="text-label w-5 text-right text-muted-foreground">
          #{rank}
        </span>
        <span className="text-body-sm font-mono tracking-wide text-foreground uppercase">
          {name}
        </span>
      </div>
      <span
        className={`text-label text-data ${netEarnings >= 0 ? "text-success" : "text-muted-foreground"}`}
      >
        {netEarnings >= 0 ? "+" : ""}
        {netEarnings.toFixed(1)}
      </span>
    </div>
  );
}

export function RightSidebarContent() {
  const snapshot = useAtomValue(gameSnapshotAtom);
  const gameMetadata = useAtomValue(gameMetadataAtom);
  const matchWinner = useAtomValue(matchWinnerAtom);

  const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard();

  const liveAgents =
    snapshot &&
    gameMetadata?.status === "LIVE" &&
    snapshot.gameId === gameMetadata.id
      ? snapshot.agents
      : null;
  const metaAgents = gameMetadata?.agents ?? [];

  const agents: SidebarAgent[] = liveAgents
    ? [...liveAgents].sort(
        (a, b) =>
          (a.rank ?? Number.MAX_SAFE_INTEGER) -
          (b.rank ?? Number.MAX_SAFE_INTEGER)
      )
    : metaAgents.map((a) => ({ ...a, score: 0, alive: true }));

  const maxScore = Math.max(...agents.map((a) => a.score), 1);

  if (!gameMetadata) {
    return (
      <div className="flex h-full flex-col gap-0 bg-card">
        <div className="flex items-center justify-center py-16">
          <p className="text-label text-muted-foreground">[ NO ACTIVE GAME ]</p>
        </div>
      </div>
    );
  }

  const isLive = gameMetadata?.status === "LIVE";

  return (
    <div className="flex min-h-full flex-col gap-0 bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="text-display-sm text-foreground">
              {gameMetadata.name}
            </h3>
            <div className="mt-1 flex items-center gap-3">
              {isLive && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="live-dot" />
                  <span className="text-label text-destructive">LIVE</span>
                </span>
              )}
              <span className="text-label text-muted-foreground">
                R{gameMetadata.id}
              </span>
            </div>
          </div>
        </div>

        <div className="border-b border-border py-3">
          <span className="text-label mb-1 block text-muted-foreground">
            PRIZE POOL
          </span>
          <span className="text-display-md text-data text-foreground">
            {gameMetadata.pool.toFixed(1)}
            <span className="text-label ml-2 text-muted-foreground">USDC</span>
          </span>
        </div>

        <div className="pt-3">
          <span className="text-label mb-2 block text-muted-foreground">
            STATUS
          </span>
          {agents.map((agent) => (
            <AgentStatus
              key={agent.id}
              name={agent.name}
              score={agent.score}
              maxScore={maxScore}
              alive={agent.alive}
              isWinner={matchWinner?.winnerId === agent.id}
            />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-y border-border">
        <div className="border-b border-border bg-secondary px-4 py-2.5">
          <span className="text-label text-muted-foreground">TOP BETTORS</span>
        </div>
        <ScrollArea className="flex-1">
          {leaderboardLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-label text-muted-foreground">[ NO DATA ]</p>
            </div>
          ) : (
            leaderboard.map((player) => (
              <LeaderboardRow key={player.rank} {...player} />
            ))
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

export function RightSidebar() {
  return (
    <aside className="relative z-10 hidden h-full w-75 flex-col border-l border-border bg-card lg:flex">
      <div className="flex items-center border-b border-border bg-secondary px-4 py-2.5">
        <span className="text-label text-muted-foreground">TELEMETRY</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-card">
        <RightSidebarContent />
      </div>

      <div className="flex items-center justify-between border-t border-border bg-secondary px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-success" />
          <span className="text-label text-foreground">SYNCED</span>
        </div>
      </div>
    </aside>
  );
}
