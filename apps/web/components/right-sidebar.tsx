"use client";

import { useAtomValue } from "jotai";
import { gameSnapshotAtom } from "@/lib/store";
import { useTheme } from "next-themes";
import { MOCK_GAMES, MOCK_LEADERBOARD } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Activity, Trophy, Info } from "lucide-react";

export function RightSidebarContent() {
  const snapshot = useAtomValue(gameSnapshotAtom);
  
  // Use the first game as the active game for static data (like title, pool)
  const activeGame = MOCK_GAMES[0];

  const liveSnakes = snapshot ? snapshot.snakes : null;

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-hidden">
      {activeGame ? (
        <Card className="shrink-0 bg-slate-100 dark:bg-black/40 border-[#8B5CF6]/30 backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.1)]">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="font-sans font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="size-4 text-[#8B5CF6]" />
                {activeGame.name}
              </CardTitle>
              <Badge
                variant="outline"
                className={`font-mono text-[9px] font-bold ${
                  activeGame.status === "LIVE"
                    ? "border-green-500/50 bg-green-500/10 text-green-400"
                    : activeGame.status === "UPCOMING"
                      ? "border-[#F59E0B]/50 bg-[#F59E0B]/10 text-[#F59E0B]"
                      : "border-gray-700 text-slate-400 dark:text-gray-500"
                }`}
              >
                {activeGame.status === "LIVE" && <span className="mr-1.5 size-1.5 rounded-full bg-green-500 animate-pulse" />}
                {activeGame.status.toUpperCase()}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 font-mono text-[10px] font-bold text-slate-500 dark:text-gray-400 tabular-nums">
              <span>ROUND {activeGame.id}</span>
              <span>·</span>
              <span className="text-[#8B5CF6]">{activeGame.totalPool.toFixed(1)} SOL POOL</span>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <span className="font-mono text-[10px] font-bold tracking-widest text-[#8B5CF6] uppercase">
              AGENT STATUS
            </span>
            <div className="mt-2 flex flex-col gap-3">
              {(liveSnakes || activeGame?.agents || [])
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((agent) => {
                  const agentsArr = liveSnakes || activeGame.agents;
                  const maxScore = Math.max(...agentsArr.map((a) => a.score), 1);
                  const segments = 12;
                  const filled = Math.round((agent.score / maxScore) * segments);
                  return (
                    <div key={agent.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block size-1.5 rounded-full"
                            style={{ backgroundColor: agent.color }}
                          />
                          <span className={`font-mono text-[10px] ${agent.alive ? 'text-slate-700 dark:text-gray-200' : 'text-slate-400 dark:text-gray-600 line-through'}`}>
                            {agent.name}
                          </span>
                          {activeGame.winnerAgentId === agent.id && (
                            <span className="text-[9px] text-[#F59E0B] font-bold">★ WINNER</span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-900 dark:text-white tabular-nums">
                          {agent.score}
                        </span>
                      </div>
                      <div className="flex gap-px">
                        {Array.from({ length: segments }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-sm ${
                              i < filled
                                ? agent.alive
                                  ? "bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]"
                                  : "bg-gray-700"
                                : "bg-slate-100 dark:bg-white/5"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shrink-0 bg-slate-100 dark:bg-black/40 border-slate-200 dark:border-white/5 backdrop-blur-md flex items-center justify-center py-8">
          <span className="font-mono text-xs font-bold tracking-widest text-slate-400 dark:text-gray-600 uppercase">
            [NO GAME SELECTED]
          </span>
        </Card>
      )}

      {/* Top Bettors List */}
      <Card className="flex-1 flex flex-col min-h-0 bg-slate-100 dark:bg-black/40 border-slate-300 dark:border-white/10 backdrop-blur-md">
        <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 shrink-0">
          <CardTitle className="font-mono text-[11px] font-bold tracking-widest text-slate-600 dark:text-gray-300 uppercase flex items-center gap-2">
            <Trophy className="size-3 text-[#F59E0B]" />
            TOP BETTORS
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1">
          <Table>
            <TableBody>
              {MOCK_LEADERBOARD.map((player) => (
                <TableRow key={player.rank} className="border-b border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-white/5 transition-colors">
                  <TableCell className="font-mono text-[10px] text-slate-400 dark:text-gray-500 w-8">
                    #{player.rank}
                  </TableCell>
                  <TableCell className="font-sans font-bold text-xs text-slate-700 dark:text-gray-200">
                    {player.name}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-mono text-[10px] font-bold tabular-nums ${
                        player.winRate >= 50
                          ? "text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]"
                          : "text-slate-400 dark:text-gray-500"
                      }`}
                    >
                      {player.winRate.toFixed(1)}% WR
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Live Activity Feed */}
      <Card className="shrink-0 h-48 flex flex-col bg-white/90 dark:bg-[#04050A]/80 border-slate-300 dark:border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-50" />
        <CardHeader className="py-2 px-3 border-b border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 shrink-0">
          <CardTitle className="font-mono text-[10px] font-bold tracking-widest text-[#3B82F6] uppercase flex items-center gap-2">
            <Activity className="size-3 animate-pulse" />
            LIVE ACTIVITY
          </CardTitle>
        </CardHeader>
        <div className="flex-1 p-3 overflow-hidden flex flex-col justify-end gap-2 font-mono text-[9px] text-slate-500 dark:text-gray-400">
          {/* Mock Activity */}
          <div className="flex items-center gap-2 opacity-40">
            <span className="text-[#3B82F6]">14:02:11</span>
            <span>SYSTEM</span>
            <span className="text-slate-400 dark:text-gray-500">Initializing Arena Match R201...</span>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <span className="text-[#3B82F6]">14:02:15</span>
            <span className="text-[#8B5CF6]">0x4A...2f9</span>
            <span className="text-slate-600 dark:text-gray-300">Placed 2.5 SOL on Sentinel</span>
          </div>
          <div className="flex items-center gap-2 opacity-80">
            <span className="text-[#3B82F6]">14:02:18</span>
            <span className="text-[#8B5CF6]">0x9C...1b4</span>
            <span className="text-slate-600 dark:text-gray-300">Placed 1.0 SOL on Oracle</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#3B82F6]">14:02:22</span>
            <span className="text-green-400">ARENA</span>
            <span className="text-slate-900 dark:text-white">Match Started. Betting locked.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function RightSidebar() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <aside className="hidden h-full w-[340px] flex-col border-l border-[#3B82F6]/20 bg-white dark:bg-[#04050A]/90 backdrop-blur-xl shadow-[-5px_0_30px_rgba(59,130,246,0.05)] lg:flex">
      <div className="flex items-center justify-between border-b border-slate-300 dark:border-white/10 px-4 py-3 bg-slate-50 dark:bg-black/20">
        <span className="font-mono text-[11px] font-bold tracking-widest text-slate-600 dark:text-gray-300 uppercase">
          ARENA DATA
        </span>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-slate-200 dark:bg-white/10 transition-colors"
        >
          {resolvedTheme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          )}
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <RightSidebarContent />
      </div>
      <div className="flex items-center justify-between border-t border-slate-300 dark:border-white/10 px-4 py-3 bg-slate-100 dark:bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          <span className="font-mono text-[10px] font-bold tracking-widest text-green-400 uppercase">
            CONNECTED
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-gray-500">
          {MOCK_LEADERBOARD.length} PLAYERS
        </span>
      </div>
    </aside>
  );
}