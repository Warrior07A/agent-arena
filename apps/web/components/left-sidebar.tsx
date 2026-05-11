"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";
import { leftSidebarOpenAtom, gameMetadataAtom, gameSnapshotAtom } from "@/lib/store";
import {
  useGames,
  useBets,
  useGameDetail,
  requestBetSwap,
  confirmBet,
} from "@/lib/swr";
import type { GameWithAgents } from "@/lib/swr-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  Target,
  Wallet,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Game, Agent } from "@repo/db";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Transaction,
  PublicKey,
  Connection,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { USDC_MINT } from "@/lib/jupiter";

const rpcUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

function StatusBadge({ status }: { status: Game["status"] }) {
  if (status === "LIVE") {
    return (
      <span className="text-label inline-flex items-center gap-2 text-destructive">
        <span className="live-dot" />
        LIVE
      </span>
    );
  }
  if (status === "UPCOMING") {
    return <span className="text-label text-muted-foreground">UPCOMING</span>;
  }
  if (status === "CANCELLED") {
    return <span className="text-label text-muted-foreground">CANCELLED</span>;
  }
  return <span className="text-label text-muted-foreground">ENDED</span>;
}

function GameRow({
  game,
  onClick,
  hasBet,
}: {
  game: GameWithAgents;
  onClick: () => void;
  hasBet: boolean;
}) {
  const liveMetadata = useAtomValue(gameMetadataAtom);
  const isLiveGame = liveMetadata?.id === game.id && liveMetadata.status === "LIVE";
  const displayPool = isLiveGame ? liveMetadata.pool : game.totalPool;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full border-b border-border px-4 py-3 text-left hover:bg-secondary"
    >
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-subheading truncate text-foreground">
              {game.name}
            </span>
            {hasBet && (
              <span className="size-1.5 rounded-full bg-muted-foreground" />
            )}
          </div>
          <div className="text-label flex items-center gap-2 text-muted-foreground">
            <span>R{game.id}</span>
            <span className="text-border">·</span>
            <span>{displayPool.toFixed(1)} USDC</span>
          </div>
        </div>
        <div className="ml-3 flex shrink-0 items-center gap-3">
          <StatusBadge status={game.status} />
          <ChevronRight className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
        </div>
      </div>
    </button>
  );
}

function LoadMoreTrigger({
  onLoadMore,
  hasMore,
  isLoading,
}: {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoading]);

  return <div ref={ref} className="h-px" />;
}

function GameListTab({
  statusFilter,
  onSelectGame,
  userBetGameIds,
}: {
  statusFilter: "active" | "ended";
  onSelectGame: (game: GameWithAgents) => void;
  userBetGameIds: Set<number>;
}) {
  const { games, hasMore, isLoading, isLoadingMore, error, loadMore } =
    useGames(statusFilter);

  if (isLoading && !games.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !games.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-label text-muted-foreground">[ ERROR LOADING ]</p>
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-label text-muted-foreground">[ NO MATCHES ]</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {games.map((game) => (
        <GameRow
          key={game.id}
          game={game}
          onClick={() => onSelectGame(game)}
          hasBet={userBetGameIds.has(game.id)}
        />
      ))}
      {hasMore && (
        <LoadMoreTrigger
          onLoadMore={loadMore}
          hasMore={hasMore}
          isLoading={isLoadingMore}
        />
      )}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
        </div>
      )}
      {!hasMore && games.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <p className="text-label text-muted-foreground">[ END OF LIST ]</p>
        </div>
      )}
    </div>
  );
}

function GamesList({
  onSelectGame,
  userBetGameIds,
}: {
  onSelectGame: (game: GameWithAgents) => void;
  userBetGameIds: Set<number>;
}) {
  return (
    <Tabs defaultValue="active" className="flex h-full flex-col overflow-hidden">
      <TabsList className="h-10 w-full rounded-none border-b border-border bg-secondary p-0">
        <TabsTrigger
          value="active"
          className="text-label h-full flex-1 rounded-none text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground"
        >
          LIVE / UPCOMING
        </TabsTrigger>
        <TabsTrigger
          value="ended"
          className="text-label h-full flex-1 rounded-none text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground"
        >
          ENDED
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="flex-1 overflow-hidden">
        <GameListTab
          statusFilter="active"
          onSelectGame={onSelectGame}
          userBetGameIds={userBetGameIds}
        />
      </TabsContent>
      <TabsContent value="ended" className="flex-1 overflow-hidden">
        <GameListTab
          statusFilter="ended"
          onSelectGame={onSelectGame}
          userBetGameIds={userBetGameIds}
        />
      </TabsContent>
    </Tabs>
  );
}

function AgentCard({
  agent,
  isSelected,
  isBetAgent,
  isWinner,
  canBet,
  onSelect,
}: {
  agent: Agent;
  isSelected: boolean;
  isBetAgent: boolean;
  isWinner: boolean;
  canBet: boolean;
  onSelect: () => void;
}) {
  const active = isSelected || isBetAgent;

  return (
    <button
      type="button"
      disabled={!canBet}
      onClick={onSelect}
      className={`transition-percussive w-full px-3 py-3 text-left ${active
        ? "border border-border bg-secondary"
        : "border border-transparent hover:bg-secondary/50"
        } ${!canBet ? "cursor-default opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`size-2.5 ${active ? "bg-foreground" : "bg-muted-foreground"}`}
          />
          <span className="text-body tracking-wide text-foreground uppercase">
            {agent.name}
          </span>
        </div>
        {isWinner && (
          <span className="text-label border border-success px-2 py-0.5 text-success">
            WINNER
          </span>
        )}
      </div>
    </button>
  );
}

function BetInputInline({
  value,
  onChange,
  onSubmit,
  submitting,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const num = parseFloat(value);
  const valid = !isNaN(num) && num > 0;

  return (
    <div className="px-3 pt-1 pb-3">
      <div className="flex items-center gap-2 border border-border bg-background p-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Target className="size-3.5 shrink-0 text-muted-foreground" />
          <Input
            type="number"
            placeholder="0.00"
            autoFocus
            className="text-data h-8 rounded-none border-0 bg-transparent px-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min="0"
            step="0.01"
            onKeyDown={(e) => {
              if (e.key === "Enter" && valid) onSubmit();
            }}
          />
          <span className="text-label shrink-0 text-muted-foreground">
            USDC
          </span>
        </div>
        <Button
          disabled={!valid || submitting}
          className="text-label h-8 shrink-0 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          onClick={onSubmit}
        >
          {submitting ? <Loader2 className="size-3 animate-spin" /> : "PLACE"}
        </Button>
      </div>
    </div>
  );
}

function GameDetail({
  game: initialGame,
  onBack,
  onBetPlaced,
}: {
  game: GameWithAgents;
  onBack: () => void;
  onBetPlaced: () => void;
}) {
  const { game, userBets, isLoading } = useGameDetail(initialGame.id);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { publicKey, sendTransaction, connected } = useWallet();

  const liveMetadata = useAtomValue(gameMetadataAtom);
  const snapshot = useAtomValue(gameSnapshotAtom);

  const isLiveGame = liveMetadata?.id === initialGame.id && liveMetadata.status === "LIVE";
  const displayPool = isLiveGame ? liveMetadata.pool : (game || initialGame).totalPool;
  const displayGame = game || initialGame;

  const agentAliveMap = new Map<string, boolean>();
  if (snapshot?.gameId === initialGame.id) {
    for (const agent of snapshot.agents) {
      agentAliveMap.set(agent.id, agent.alive);
    }
  }

  const canBet = isLiveGame || displayGame.status === "LIVE";
  const displayStatus = isLiveGame ? liveMetadata.status : displayGame.status;
  const hasBetOnAgent = (agentId: string) => userBets.some((b) => b.agentId === agentId);
  const selectedAgentData = displayGame?.agents.find(
    (a) => a.id === selectedAgent
  );

  const handlePlaceBet = async () => {
    if (!selectedAgent || !selectedAgentData) return;

    if (!publicKey || !connected) {
      toast.error("Wallet not connected", {
        description: "Connect your wallet to place a bet",
      });
      return;
    }

    const amountUsdc = Math.round(parseFloat(betAmount) * 100) / 100;
    if (isNaN(amountUsdc) || amountUsdc <= 0) return;

    setSubmitting(true);
    try {
      const initData = await requestBetSwap(
        displayGame.id,
        selectedAgent,
        amountUsdc,
      );

      const usdcMint = new PublicKey(USDC_MINT);
      const escrowPubkey = new PublicKey(initData.escrowPublicKey);
      const userATA = getAssociatedTokenAddressSync(usdcMint, publicKey);
      const escrowATA = new PublicKey(initData.escrowUSDCAddress);

      const connection = new Connection(rpcUrl);

      const [userATAInfo, escrowATAInfo] = await Promise.all([
        connection.getAccountInfo(userATA),
        connection.getAccountInfo(escrowATA),
      ]);

      const tx = new Transaction();
      if (!userATAInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            userATA,
            publicKey,
            usdcMint
          )
        );
      }

      if (!escrowATAInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            escrowATA,
            escrowPubkey,
            usdcMint
          )
        );
      }

      tx.add(
        createTransferInstruction(
          userATA,
          escrowATA,
          publicKey,
          BigInt(initData.usdcAmount),
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      const txHash = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: txHash, blockhash, lastValidBlockHeight });

      await confirmBet(
        displayGame.id,
        selectedAgent,
        amountUsdc,
        publicKey.toBase58(),
        txHash,
      );

      toast.success("Bet placed", {
        description: `${betAmount} USDC on ${selectedAgentData.name}`,
        duration: 3000,
      });
      setSelectedAgent(null);
      setBetAmount("");
      onBetPlaced();
    } catch (err) {
      toast.error("Bet failed", {
        description: err instanceof Error ? err.message : "Could not place bet",
        duration: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && !game) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-label transition-percussive mb-4 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          BACK
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-display-sm text-foreground">
              {displayGame.name}
            </h2>
            <div className="mt-1.5 flex items-center gap-3">
              <StatusBadge status={displayStatus} />
              <span className="text-label text-muted-foreground">
                R{displayGame.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-secondary px-4 py-6">
        <span className="text-label mb-2 block text-muted-foreground">
          PRIZE POOL
        </span>
        <span className="text-display-lg text-data text-foreground">
          {displayPool.toFixed(1)}
          <span className="text-label ml-2 text-muted-foreground">USDC</span>
        </span>
      </div>

      {displayStatus === "LIVE" && !userBets.length && (
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <Target className="size-3 text-destructive" />
          <span className="text-label text-destructive">
            BETTING OPEN — MATCH IN PROGRESS
          </span>
        </div>
      )}

      {userBets.map((bet) => (
        <div key={bet.id} className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-success" />
            <span className="text-label text-foreground">
              {bet.amount.toFixed(2)} USDC ON{" "}
              {bet.agentId.toUpperCase()}
            </span>
          </div>
          <span className="text-label text-muted-foreground">
            [{bet.status}]
          </span>
        </div>
      ))}

      {displayStatus === "ENDED" && displayGame.winnerAgentId && (
        <div className="border-b border-border bg-foreground px-4 py-2.5 text-background">
          <span className="text-label">
            WINNER: {displayGame.winnerAgentId.toUpperCase()}
          </span>
        </div>
      )}

      {displayStatus === "CANCELLED" && (
        <div className="border-b border-border px-4 py-2.5">
          <span className="text-label text-muted-foreground">
            MATCH CANCELLED — ALL BETS REFUNDED
          </span>
        </div>
      )}

      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="text-label text-muted-foreground">
            {canBet ? "SELECT CONTESTANT" : "ROSTER"}
          </span>
          <span className="text-label text-muted-foreground">
            {displayGame.agents.length} AGENTS
          </span>
        </div>

        {!connected && canBet && (
          <div className="flex items-center gap-3 border-b border-border bg-secondary/50 px-4 py-3">
            <Wallet className="size-4 text-muted-foreground" />
            <span className="text-label text-muted-foreground">
              Connect wallet to place bets
            </span>
          </div>
        )}

        <div className="flex flex-col">
          {displayGame?.agents.map((a) => {
            const alreadyBet = hasBetOnAgent(a.id);
            const isAlive = agentAliveMap.get(a.id) ?? true;
            const agentCanBet = canBet && !alreadyBet && isAlive;
            return (
              <div key={a.id} className="border-b border-border last:border-b-0">
                <AgentCard
                  agent={a}
                  isSelected={selectedAgent === a.id}
                  isBetAgent={alreadyBet}
                  isWinner={displayGame.winnerAgentId === a.id}
                  canBet={agentCanBet}
                  onSelect={() => {
                    if (!agentCanBet) return;
                    if (selectedAgent === a.id) {
                      setSelectedAgent(null);
                      setBetAmount("");
                    } else {
                      setSelectedAgent(a.id);
                      setBetAmount("");
                    }
                  }}
                />
                {agentCanBet && selectedAgent === a.id && (
                  <BetInputInline
                    value={betAmount}
                    onChange={setBetAmount}
                    onSubmit={handlePlaceBet}
                    submitting={submitting}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MyBetsView() {
  const { bets, hasMore, isLoading, isLoadingMore, error, loadMore } =
    useBets();

  if (isLoading && !bets.length) {
    return (
      <div className="flex flex-col">
        <div className="border-b border-border bg-secondary px-4 py-2.5">
          <span className="text-label text-muted-foreground">BET HISTORY</span>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error && !bets.length) {
    return (
      <div className="flex flex-col">
        <div className="border-b border-border bg-secondary px-4 py-2.5">
          <span className="text-label text-muted-foreground">BET HISTORY</span>
        </div>
        <div className="flex items-center justify-center py-16">
          <p className="text-label text-muted-foreground">[ ERROR LOADING ]</p>
        </div>
      </div>
    );
  }

  if (!bets.length) {
    return (
      <div className="flex flex-col">
        <div className="border-b border-border bg-secondary px-4 py-2.5">
          <span className="text-label text-muted-foreground">BET HISTORY</span>
        </div>
        <div className="flex items-center justify-center py-16">
          <p className="text-label text-muted-foreground">[ NO BETS ]</p>
        </div>
      </div>
    );
  }

  const totalWagered = bets.reduce((s, b) => s + b.amount, 0);
  const totalOut = bets
    .filter((b) => b.status === "WON")
    .reduce((s, b) => s + (b.payout || 0), 0);
  const pnl = totalOut - totalWagered;

  return (
    <div className="flex flex-col">
      <div className="border-b border-border bg-secondary px-4 py-2.5">
        <span className="text-label text-muted-foreground">BET HISTORY</span>
      </div>

      <div className="flex flex-col">
        {bets.map((bet) => (
          <div
            key={bet.id}
            className="flex items-center justify-between border-b border-border px-4 py-3 hover:bg-secondary"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-body tracking-wide text-foreground uppercase">
                {bet.agent.name?.toUpperCase() || bet.agentId.toUpperCase()}
              </span>
              <span className="text-label text-muted-foreground">
                R{bet.gameId}
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-data text-foreground">
                {bet.amount.toFixed(2)} USDC
              </span>
              <div className="flex items-center gap-2">
                {bet.status === "WON" && bet.payout && (
                  <span className="text-label text-data text-success">
                    +{(bet.payout - bet.amount).toFixed(2)}
                  </span>
                )}
                <span
                  className={`text-label ${bet.status === "WON"
                    ? "text-success"
                    : bet.status === "LOST"
                      ? "text-muted-foreground"
                      : bet.status === "REFUNDED"
                        ? "text-warning"
                        : "text-foreground"
                    }`}
                >
                  [{bet.status}]
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <LoadMoreTrigger
          onLoadMore={loadMore}
          hasMore={hasMore}
          isLoading={isLoadingMore}
        />
      )}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="border-t border-border bg-card px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-label text-muted-foreground">
            TOTAL WAGERED
          </span>
          <span className="text-data text-foreground">
            {totalWagered.toFixed(2)} USDC
          </span>
        </div>
        <Separator className="my-2 bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-label text-muted-foreground">NET RESULT</span>
          <span
            className={`text-data ${pnl >= 0 ? "text-success" : "text-muted-foreground"}`}
          >
            {pnl >= 0 ? "+" : ""}
            {pnl.toFixed(2)} USDC
          </span>
        </div>
      </div>
    </div>
  );
}

export function LeftSidebarContent({ tab }: { tab: "games" | "bets" }) {
  const [selectedGame, setSelectedGame] = useState<GameWithAgents | null>(null);
  const [userBetGameIds, setUserBetGameIds] = useState<Set<number>>(new Set());

  const handleBetPlaced = useCallback(() => {
    if (selectedGame) {
      setUserBetGameIds((prev) => new Set(prev).add(selectedGame.id));
    }
  }, [selectedGame]);

  return tab === "games" ? (
    selectedGame ? (
      <GameDetail
        game={selectedGame}
        onBack={() => setSelectedGame(null)}
        onBetPlaced={handleBetPlaced}
      />
    ) : (
      <GamesList
        onSelectGame={setSelectedGame}
        userBetGameIds={userBetGameIds}
      />
    )
  ) : (
    <MyBetsView />
  );
}

export function LeftSidebar() {
  const [isSidebarOpen] = useAtom(leftSidebarOpenAtom);

  return (
    <div
      className={`relative h-full transition-all duration-0 ${!isSidebarOpen ? "w-0 overflow-hidden" : "w-85"}`}
    >
      <aside className="flex h-full w-85 flex-col overflow-hidden border-r border-border bg-card">
        <Tabs
          defaultValue="games"
          className="flex w-full flex-1 flex-col overflow-hidden"
        >
          <TabsList className="h-10 w-full rounded-none border-b border-border bg-secondary p-0">
            {["GAMES", "MY BETS"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLocaleLowerCase().split(" ").join("_")}
                className="text-label h-full flex-1 rounded-none text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="games" className="h-full overflow-hidden">
            <LeftSidebarContent tab="games" />
          </TabsContent>

          <TabsContent value="my_bets" className="h-full overflow-hidden">
            <LeftSidebarContent tab="bets" />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between border-t border-border bg-secondary px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-success" />
            <span className="text-label text-foreground">DEVNET</span>
          </div>
          <span className="text-label text-muted-foreground">v1.0</span>
        </div>
      </aside>
    </div>
  );
}

export function LeftSidebarToggle() {
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(leftSidebarOpenAtom);

  return (
    <button
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="absolute top-3 left-3 z-50 border border-border bg-card p-1.5 text-foreground hover:bg-secondary"
    >
      {isSidebarOpen ? (
        <PanelLeftClose className="size-3.5" />
      ) : (
        <PanelLeftOpen className="size-3.5" />
      )}
    </button>
  );
}
