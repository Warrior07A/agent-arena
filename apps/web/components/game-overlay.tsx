"use client";

import { useAtom, useAtomValue } from "jotai";
import { gameSnapshotAtom, spectatingAgentAtom } from "@/lib/store";

export function GameOverlay() {
  const snapshot = useAtomValue(gameSnapshotAtom)
  const [spectatingAgent, setSpectatingAgent] = useAtom(spectatingAgentAtom);
  const aliveAgents = snapshot?.snakes.filter((s) => s.alive);
  const currentSnake = snapshot?.snakes.find((s) => s.id === spectatingAgent);

  return (
    <>
      <div className="pointer-events-none absolute bottom-nd-sm left-1/2 z-10 -translate-x-1/2 sm:bottom-nd-md">
        <div className="pointer-events-auto flex items-center gap-nd-sm rounded-full border border-nd-border-visible bg-nd-black/80 px-3 py-1.5">
          <span className="font-mono text-[8px] tracking-widest text-nd-text-disabled uppercase sm:text-[9px]">
            SPECTATING
          </span>
          {currentSnake ? (
            <>
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ backgroundColor: currentSnake.color }}
              />
              <span className="font-body text-xs text-nd-text-primary">
                {currentSnake.name}
              </span>
            </>
          ) : (
            <span className="font-body text-xs text-nd-text-secondary">
              Auto
            </span>
          )}
          {spectatingAgent && (
            <button
              type="button"
              onClick={() => setSpectatingAgent(null)}
              className="ml-nd-2xs font-mono text-[8px] tracking-[0.08em] text-nd-text-disabled uppercase transition-colors hover:text-nd-text-primary sm:text-[9px]"
            >
              RESET
            </button>
          )}
        </div>
      </div>

      <div className="absolute right-nd-sm bottom-nd-sm z-10 sm:right-nd-md sm:bottom-nd-md">
        <div className="flex flex-col gap-nd-2xs rounded-lg border border-nd-border-visible bg-nd-black/80 p-nd-xs">
          <span className="px-nd-xs font-mono text-[8px] tracking-widest text-nd-text-disabled uppercase">
            FOLLOW
          </span>
          {aliveAgents?.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSpectatingAgent(agent.id)}
              className={`flex items-center gap-nd-xs rounded px-nd-xs py-1 text-xs transition-colors ${spectatingAgent === agent.id
                ? "bg-nd-surface-raised text-nd-text-display"
                : "text-nd-text-secondary hover:text-nd-text-primary"
                }`}
            >
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ backgroundColor: agent.color }}
              />
              <span className="font-mono text-[10px]">{agent.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
