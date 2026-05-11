"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  gameSnapshotAtom,
  spectatingAgentAtom,
  connectionStatusAtom,
  matchWinnerAtom,
  gameMetadataAtom,
  matchStartCountdownAtom,
} from "@/lib/store";
import { Loader2, WifiOff, Wifi, Trophy } from "lucide-react";

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0s";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function GameOverlay() {
  const snapshot = useAtomValue(gameSnapshotAtom);
  const spectatingAgent = useAtomValue(spectatingAgentAtom);
  const setSpectatingAgent = useSetAtom(spectatingAgentAtom);
  const connectionStatus = useAtomValue(connectionStatusAtom);
  const matchWinner = useAtomValue(matchWinnerAtom);
  const gameMetadata = useAtomValue(gameMetadataAtom);
  const matchStartCountdown = useAtomValue(matchStartCountdownAtom);

  const aliveAgents = snapshot?.agents.filter((a) => a.alive);
  const currentAgent = snapshot?.agents.find((a) => a.id === spectatingAgent);

  if (connectionStatus === "connecting") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="text-label text-muted-foreground uppercase">
            Connecting to arena...
          </span>
        </div>
      </div>
    );
  }

  if (connectionStatus === "disconnected") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
        <div className="flex flex-col items-center gap-3">
          <WifiOff className="size-6 text-muted-foreground" />
          <span className="text-label text-muted-foreground uppercase">
            Disconnected
          </span>
        </div>
      </div>
    );
  }

  const isLive =
    gameMetadata?.status === "LIVE" &&
    snapshot?.gameId === gameMetadata.id &&
    snapshot;

  return (
    <>
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-2 border border-border bg-card/90 px-2.5 py-1.5">
          {connectionStatus === "connected" ? (
            <Wifi className="size-3 text-success" />
          ) : (
            <WifiOff className="size-3 text-muted-foreground" />
          )}
          <span className="text-label text-muted-foreground uppercase">
            {connectionStatus}
          </span>
        </div>
      </div>

      {matchStartCountdown !== null && matchStartCountdown > 0 && !isLive && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center border border-border bg-card/90 px-6 py-4">
            <span className="text-label mb-1 block text-center text-muted-foreground uppercase">
              Match starts in
            </span>
            <span className="text-display-md text-data text-center text-foreground">
              {formatCountdown(matchStartCountdown)}
            </span>
          </div>
        </div>
      )}

      {matchWinner && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
          <div className="flex flex-col items-center gap-3 border border-border bg-card px-8 py-6">
            <Trophy className="size-8 text-foreground" />
            <span className="text-label text-muted-foreground uppercase">
              Winner
            </span>
            <span className="text-display-md text-foreground uppercase">
              {matchWinner.winnerName ?? "No winner"}
            </span>
          </div>
        </div>
      )}

      {isLive && (
        <>
          <div className="pointer-events-none absolute bottom-3 left-3 z-10">
            <div className="pointer-events-auto flex items-center gap-2 border border-border bg-card/90 px-2.5 py-1.5">
              <span className="text-label text-muted-foreground">
                SPECTATING
              </span>
              {currentAgent ? (
                <>
                  <div
                    className="size-1.5"
                    style={{ backgroundColor: currentAgent.color }}
                  />
                  <span className="text-caption text-foreground uppercase">
                    {currentAgent.name}
                  </span>
                </>
              ) : (
                <span className="text-caption text-foreground uppercase">
                  AUTO
                </span>
              )}
            </div>
          </div>

          <div className="absolute right-3 bottom-3 z-10">
            <div className="flex flex-col gap-0.5 border border-border bg-card/90 p-1.5">
              <span className="text-label px-1.5 pb-1 text-muted-foreground">
                ROSTER
              </span>
              {aliveAgents?.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSpectatingAgent(agent.id)}
                  className={`flex items-center gap-2 px-2 py-1 text-left ${
                    spectatingAgent === agent.id
                      ? "bg-secondary"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <div
                    className="size-1.5"
                    style={{ backgroundColor: agent.color }}
                  />
                  <span
                    className={`text-label ${spectatingAgent === agent.id ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {agent.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {gameMetadata && (
        <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2">
          <div className="flex items-center gap-3 border border-border bg-card/90 px-3 py-1.5">
            <span className="text-label text-foreground uppercase">
              {gameMetadata.name}
            </span>
            <span className="text-label text-muted-foreground">
              {gameMetadata.pool.toFixed(1)} USDC
            </span>
            <span
              className={`text-label uppercase ${
                gameMetadata.status === "LIVE"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {gameMetadata.status}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
