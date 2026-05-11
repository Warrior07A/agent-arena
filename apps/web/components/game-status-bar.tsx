"use client";

import { useAtomValue } from "jotai";
import { gameMetadataAtom } from "@/lib/store";

export function GameStatusBar() {
  const gameMetadata = useAtomValue(gameMetadataAtom);

  return (
    <div className="flex items-center justify-between border-t border-border bg-card px-4 py-2">
      <div className="flex items-center gap-4">
        <span className="text-label text-muted-foreground">
          ROUND{" "}
          <span className="text-foreground">
            #{gameMetadata?.id || "---"}
          </span>
        </span>
        <span className="text-label text-muted-foreground">
          STATUS{" "}
          <span
            className={
              gameMetadata?.status === "LIVE"
                ? "text-success"
                : "text-muted-foreground"
            }
          >
            {gameMetadata?.status || "IDLE"}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-label text-muted-foreground">
          POOL{" "}
          <span className="text-foreground">
            {gameMetadata ? `${gameMetadata.pool.toFixed(1)}` : "0.0"} USDC
          </span>
        </span>
      </div>
    </div>
  );
}
