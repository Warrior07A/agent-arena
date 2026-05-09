"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { betsAtom, leftSidebarOpenAtom } from "@/lib/store";
import { MOCK_GAMES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Zap, Lock, ChevronRight, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bet, Game } from "@repo/db";

function statusBadge(status: Game["status"]) {
  switch (status) {
    case "LIVE":
      return (
        <Badge
          variant="outline"
          className="border-green-500/50 bg-green-500/10 font-mono text-[10px] text-green-400 font-bold"
        >
          <span className="mr-1.5 size-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          LIVE
        </Badge>
      );
    case "UPCOMING":
      return (
        <Badge
          variant="outline"
          className="border-[#F59E0B]/50 bg-[#F59E0B]/10 font-mono text-[10px] text-[#F59E0B] font-bold"
        >
          OPEN
        </Badge>
      );
    case "ENDED":
      return (
        <Badge
          variant="outline"
          className="border-gray-700 font-mono text-[10px] text-slate-400 dark:text-gray-500 font-bold"
        >
          ENDED
        </Badge>
      );
  }
}

function betStatusColor(status: Bet["status"]) {
  switch (status) {
    case "PENDING":
      return "text-slate-900 dark:text-white";
    case "WON":
      return "text-green-400";
    case "LOST":
      return "text-red-400";
  }
}

function GamesList({
  onSelectGame,
  bets,
}: {
  onSelectGame: (game: Game) => void;
  bets: Bet[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[11px] font-bold tracking-widest text-[#8B5CF6] uppercase">
        ALL GAMES
      </span>
      {MOCK_GAMES.map((game) => {
        const hasBet = bets.some((b) => b.gameId === game.id);
        return (
          <button
            key={game.id}
            type="button"
            onClick={() => onSelectGame(game)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/40 px-3 py-3 text-left transition-all hover:border-[#8B5CF6]/40 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-white/5 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-sm text-slate-700 dark:text-gray-200">
                  {game.name}
                </span>
                {hasBet && (
                  <span className="inline-block size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                )}
              </div>
              <span className="font-mono text-[10px] text-slate-400 dark:text-gray-500 tabular-nums">
                {game.totalPool.toFixed(1)} SOL · R{game.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {statusBadge(game.status)}
              <ChevronRight className="size-4 text-slate-400 dark:text-gray-600" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function GameDetail({
  game,
  onBack,
  onPlaceBet,
  existingBet,
}: {
  game: Game;
  onBack: () => void;
  onPlaceBet: (agentId: string, agentName: string, amount: number) => void;
  existingBet: Bet | undefined;
}) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canBet = game.status === "UPCOMING" && !existingBet;
  const isLive = game.status === "LIVE";
  const agent = game?.agents.find((a) => a.id === selectedAgent);

  const handleConfirmBet = () => {
    if (!selectedAgent || !agent) return;
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    onPlaceBet(selectedAgent, agent.name, amount);
    setConfirmOpen(false);
    setSelectedAgent(null);
    setBetAmount("");
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 dark:text-gray-400 transition-colors hover:text-slate-900 dark:hover:text-slate-900 dark:text-white"
        >
          <ArrowLeft className="size-4" />
          <span className="font-mono text-[10px] font-bold tracking-widest uppercase">
            ALL GAMES
          </span>
        </button>

        <div className="flex items-center justify-between">
          <span className="font-sans text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {game.name}
          </span>
          {statusBadge(game.status)}
        </div>

        <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 p-3">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 dark:text-gray-500 uppercase">
              POOL
            </span>
            <span className="font-mono text-sm font-bold text-[#8B5CF6] tabular-nums drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]">
              {game.totalPool.toFixed(1)} SOL
            </span>
          </div>
          <Separator orientation="vertical" className="h-8 bg-slate-200 dark:bg-white/10" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 dark:text-gray-500 uppercase">
              ROUND
            </span>
            <span className="font-mono text-sm text-slate-700 dark:text-gray-200 tabular-nums">
              {game.id}
            </span>
          </div>
          <Separator orientation="vertical" className="h-8 bg-slate-200 dark:bg-white/10" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 dark:text-gray-500 uppercase">
              AGENTS
            </span>
            <span className="font-mono text-sm text-slate-700 dark:text-gray-200 tabular-nums">
              {game?.agents.length}
            </span>
          </div>
        </div>

        {isLive && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-3">
            <Lock className="size-4 text-red-400" />
            <span className="font-mono text-[10px] tracking-widest text-red-400 uppercase">
              BETTING CLOSED — MATCH IS LIVE
            </span>
          </div>
        )}

        {existingBet && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-3 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]">
            <span className="font-mono text-[10px] tracking-widest text-green-400 uppercase">
              YOU BET {existingBet.amount.toFixed(2)} SOL ON{" "}
              {existingBet.agentId.toUpperCase()}
            </span>
          </div>
        )}

        {game.status === "ENDED" && game.winnerAgentId && (
          <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-3 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <span className="font-mono text-[10px] tracking-widest text-[#F59E0B] uppercase">
              WINNER:{" "}
              <span className="font-bold text-slate-900 dark:text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                {game.winnerAgentId.toUpperCase()}
              </span>
            </span>
          </div>
        )}

        <Separator className="bg-slate-200 dark:bg-white/10 my-1" />

        <span className="font-mono text-[11px] font-bold tracking-widest text-[#8B5CF6] uppercase">
          {canBet ? "TAP AN AGENT TO BET" : "AGENTS"}
        </span>

        {game?.agents.map((a) => {
          const isSelected = selectedAgent === a.id;
          const isBetAgent = existingBet?.agentId === a.id;
          return (
            <div key={a.id} className="flex flex-col">
              <button
                type="button"
                disabled={!canBet}
                onClick={() => {
                  if (!canBet) return;
                  setSelectedAgent(isSelected ? null : a.id);
                  setBetAmount("");
                }}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-all ${isSelected
                  ? "border-[#3B82F6] bg-[#3B82F6]/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                  : isBetAgent
                    ? "border-green-500/30 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    : "border-slate-200 dark:border-white/5 hover:border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/40"
                  } ${!canBet ? "cursor-default" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block size-3 rounded-full shadow-[0_0_10px_currentColor]"
                    style={{ backgroundColor: a.color, color: a.color }}
                  />
                  <span
                    className={`font-sans font-bold text-sm ${a.alive
                      ? "text-slate-700 dark:text-gray-200"
                      : "text-slate-400 dark:text-gray-600 line-through"
                      }`}
                  >
                    {a.name}
                  </span>
                  {game.winnerAgentId === a.id && (
                    <Badge
                      variant="outline"
                      className="border-[#F59E0B]/30 font-mono text-[8px] text-[#F59E0B]"
                    >
                      WINNER
                    </Badge>
                  )}
                  {isBetAgent && (
                    <Badge
                      variant="outline"
                      className="border-green-500/30 font-mono text-[8px] text-green-400"
                    >
                      YOUR BET
                    </Badge>
                  )}
                </div>
                {game.status !== "UPCOMING" && (
                  <span className="font-mono text-xs text-slate-400 dark:text-gray-500 tabular-nums">
                    {a.score}
                  </span>
                )}
              </button>

              {canBet && isSelected && (
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/5 p-2">
                  <Input
                    id={`bet-${a.id}`}
                    type="number"
                    placeholder="0.00"
                    autoFocus
                    className="h-10 flex-1 border-slate-300 dark:border-white/10 bg-white dark:bg-black/60 font-mono text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:text-gray-600 focus-visible:ring-[#3B82F6]"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <span className="font-mono text-[10px] text-slate-400 dark:text-gray-500">
                    SOL
                  </span>
                  <Button
                    id={`confirm-bet-${a.id}`}
                    disabled={!betAmount || parseFloat(betAmount) <= 0}
                    className="h-10 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] px-6 font-mono text-xs font-bold tracking-widest text-slate-900 dark:text-white uppercase hover:opacity-90 disabled:opacity-30 border-0"
                    onClick={() => setConfirmOpen(true)}
                  >
                    BET
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm border-slate-300 dark:border-white/10 bg-white dark:bg-[#04050A] backdrop-blur-xl shadow-[0_0_50px_rgba(139,92,246,0.15)]">
          <DialogHeader>
            <DialogTitle className="font-sans font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">
              Confirm Bet
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-slate-500 dark:text-gray-400">
              Placing bet on {agent?.name} in {game.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between py-2">
              <span className="font-mono text-[11px] tracking-widest text-slate-400 dark:text-gray-500 uppercase">
                AGENT
              </span>
              <span className="font-sans font-bold text-sm text-slate-900 dark:text-white">
                {agent?.name}
              </span>
            </div>
            <Separator className="bg-slate-200 dark:bg-white/10" />
            <div className="flex items-center justify-between py-2">
              <span className="font-mono text-[11px] tracking-widest text-slate-400 dark:text-gray-500 uppercase">
                AMOUNT
              </span>
              <span className="font-mono text-lg font-bold text-[#8B5CF6] tabular-nums drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]">
                {betAmount} SOL
              </span>
            </div>
            <Separator className="bg-slate-200 dark:bg-white/10" />
            <div className="flex items-center justify-between py-2">
              <span className="font-mono text-[11px] tracking-widest text-slate-400 dark:text-gray-500 uppercase">
                PAYOUT
              </span>
              <span className="font-mono text-[10px] text-[#3B82F6] font-bold">
                WINNER TAKES ALL
              </span>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-slate-300 dark:border-white/10 bg-transparent font-mono text-xs font-bold tracking-widest text-slate-500 dark:text-gray-400 uppercase hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-white/5 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white"
                onClick={() => setConfirmOpen(false)}
              >
                CANCEL
              </Button>
              <Button
                className="flex-1 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] font-mono text-xs font-bold tracking-widest text-slate-900 dark:text-white uppercase hover:opacity-90 border-0"
                onClick={handleConfirmBet}
              >
                CONFIRM
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MyBetsView({ bets }: { bets: Bet[] }) {
  return (
    <div className="flex flex-col">
      <span className="mb-4 font-mono text-[11px] font-bold tracking-widest text-[#8B5CF6] uppercase">
        BET HISTORY
      </span>

      {bets.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-mono text-sm text-slate-500 dark:text-gray-400">
            [NO BETS PLACED]
          </p>
          <p className="mt-2 font-mono text-[10px] text-slate-400 dark:text-gray-600">
            Select a game and pick an agent to bet
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {bets.map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/40 rounded-xl p-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-sans font-bold text-sm text-slate-700 dark:text-gray-200">
                    {bet.agentId.toUpperCase()}
                  </span>
                  <span className="font-mono text-[10px] tracking-widest text-slate-400 dark:text-gray-500 uppercase">
                    {bet.gameId}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                    {bet.amount.toFixed(2)} SOL
                  </span>
                  <div className="flex items-center gap-2">
                    {bet.status === "WON" && (
                      <span className="font-mono text-[10px] font-bold text-green-400 tabular-nums">
                        +{((bet.payout || 0) - bet.amount).toFixed(2)}
                      </span>
                    )}
                    {bet.status === "LOST" && (
                      <span className="font-mono text-[10px] font-bold text-red-400 tabular-nums">
                        -{bet.amount.toFixed(2)}
                      </span>
                    )}
                    <span
                      className={`font-mono text-[10px] font-bold tracking-widest uppercase ${betStatusColor(bet.status)}`}
                    >
                      {bet.status === "PENDING" && "● "}
                      {bet.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6 bg-slate-200 dark:bg-white/10" />
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-black/60 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 dark:text-gray-500 uppercase">
                TOTAL WAGERED
              </span>
              <span className="font-mono text-xs text-slate-600 dark:text-gray-300 tabular-nums">
                {bets.reduce((s, b) => s + b.amount, 0).toFixed(2)} SOL
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 dark:text-gray-500 uppercase">
                NET P&L
              </span>
              {(() => {
                const totalIn = bets.reduce((s, b) => s + b.amount, 0);
                const totalOut = bets
                  .filter((b) => b.status === "WON")
                  .reduce((s, b) => s + (b.payout || 0), 0);
                const pnl = totalOut - totalIn;
                return (
                  <span
                    className={`font-mono text-xs font-bold tabular-nums ${pnl >= 0 ? "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "text-red-400"}`}
                  >
                    {pnl >= 0 ? "+" : ""}
                    {pnl.toFixed(2)} SOL
                  </span>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function LeftSidebarContent({ tab }: { tab: "games" | "bets" }) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [bets, setBets] = useAtom(betsAtom);

  const handlePlaceBet = (
    agentId: string,
    agentName: string,
    amount: number
  ) => {
    if (!selectedGame) return;
    const newBet: Bet = {
      id: `bet-${Date.now()}`,
      gameId: selectedGame.id,
      payoutTxHash: "",
      settledAt: null,
      txHash: "",
      userId: "",
      walletAddress: "",
      agentId,
      amount,
      payout: 0,
      status: "PENDING",
      placedAt: new Date(),
    };
    setBets((prev) => [newBet, ...prev]);
  };

  const existingBet = selectedGame
    ? bets.find((b) => b.gameId === selectedGame.id)
    : undefined;

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {tab === "games" ? (
          selectedGame ? (
            <GameDetail
              game={selectedGame}
              onBack={() => setSelectedGame(null)}
              onPlaceBet={handlePlaceBet}
              existingBet={existingBet}
            />
          ) : (
            <GamesList onSelectGame={setSelectedGame} bets={bets} />
          )
        ) : (
          <MyBetsView bets={bets} />
        )}
      </div>
    </ScrollArea>
  );
}

export function LeftSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(leftSidebarOpenAtom)

  return (
    <div className={`relative h-full transition-all duration-300 ease-in-out ${!isSidebarOpen ? "w-0 overflow-hidden" : "w-72"}`}>
      <aside className="flex h-full w-72 flex-col border-r border-[#8B5CF6]/30 bg-white dark:bg-[#04050A]/90 backdrop-blur-xl shadow-[5px_0_30px_rgba(139,92,246,0.1)]">
        <div className="flex border-b border-slate-300 dark:border-white/10 pt-2 px-2 bg-slate-50 dark:bg-black/20">
          <Tabs defaultValue="games" className="w-full">
            <TabsList className="w-full bg-transparent p-0 gap-4 h-10 border-b-0 rounded-none justify-start">
              <TabsTrigger
                value="games"
                className="px-2 pb-2 rounded-none font-mono text-[11px] font-bold tracking-widest uppercase data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 dark:data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 dark:data-[state=active]:border-[#8B5CF6] text-slate-500 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-gray-300"
              >
                GAMES
              </TabsTrigger>
              <TabsTrigger
                value="bets"
                className="px-2 pb-2 rounded-none font-mono text-[11px] font-bold tracking-widest uppercase data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 dark:data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 dark:data-[state=active]:border-[#8B5CF6] text-slate-500 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-gray-300"
              >
                MY BETS
              </TabsTrigger>
            </TabsList>
            <div className="mt-2 min-h-0 flex-1 absolute top-14 bottom-12 left-0 right-0">
              <TabsContent value="games" className="h-full m-0 data-[state=inactive]:hidden">
                <LeftSidebarContent tab="games" />
              </TabsContent>
              <TabsContent value="bets" className="h-full m-0 data-[state=inactive]:hidden">
                <LeftSidebarContent tab="bets" />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-slate-300 dark:border-white/10 px-4 py-3 bg-slate-100 dark:bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Zap className="size-3 text-[#3B82F6] animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-[#3B82F6] uppercase drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
              SOLANA MAINNET
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 dark:text-gray-500">
            v1.0.0
          </span>
        </div>
      </aside>
    </div>
  );
}

export function LeftSidebarToggle() {
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(leftSidebarOpenAtom)

  return (
    <button
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="absolute top-6 left-6 z-50 p-2.5 bg-slate-50/80 dark:bg-black/80 border border-slate-300 dark:border-white/10 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-200 dark:bg-white/10 hover:border-[#8B5CF6]/50 backdrop-blur-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)] group"
    >
      {isSidebarOpen ? (
        <PanelLeftClose className="size-6 text-gray-400 group-hover:text-white transition-colors" />
      ) : (
        <PanelLeftOpen className="size-6 text-gray-400 group-hover:text-white transition-colors" />
      )}
    </button>
  )
}