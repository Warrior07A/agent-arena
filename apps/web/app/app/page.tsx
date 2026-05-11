import type { GamesResponse } from "@/lib/swr-types";
import { unstable_serialize } from "swr/infinite";
import { prisma } from "@repo/db";
import { SWRConfig } from "swr";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Provider } from "jotai";
import { Game } from "@/components/game";
import { Navbar } from "@/components/navbar";
import { GameOverlay } from "@/components/game-overlay";
import { GameStatusBar } from "@/components/game-status-bar";
import { RightSidebar, RightSidebarContent } from "@/components/right-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LeftSidebar,
  LeftSidebarContent,
  LeftSidebarToggle,
} from "@/components/left-sidebar";

async function getInitialGames() {
  try {
    const games = await prisma.game.findMany({
      take: 16,
      orderBy: { startedAt: "desc" },
      include: {
        agents: {
          include: {
            agent: true,
          },
        },
        winner: true,
      },
    });

    let nextCursor: number | null = null;
    if (games.length > 15) {
      const nextItem = games.pop();
      nextCursor = nextItem!.id;
    }

    const normalizedGames: GamesResponse = {
      games: games.map((game) => ({
        ...game,
        agents: game.agents.map((ag) => ag.agent),
        totalPool: Number(game.totalPool) / 1e6,
        feeAmount: game.feeAmount ? Number(game.feeAmount) / 1e6 : null,
      })),
      nextCursor,
    };

    return [normalizedGames];
  } catch {
    return null;
  }
}

export default async function App() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <Provider>
      <SWRConfig
        value={{
          fallback: {
            [unstable_serialize(() => "/api/games?limit=15")]:
              getInitialGames(),
          },
        }}
      >
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
          <Navbar />

          <div className="hidden min-h-0 w-full flex-1 lg:flex">
            <LeftSidebar />

            <main className="relative flex min-w-0 flex-1 flex-col bg-muted">
              <LeftSidebarToggle />
              <div className="flex flex-1 items-center justify-center p-4 md:p-6">
                <div className="relative aspect-video w-full max-w-5xl border border-border bg-card">
                  <Game />
                  <GameOverlay />
                </div>
              </div>

              <GameStatusBar />
            </main>

            <RightSidebar />
          </div>

          <div className="flex min-h-0 w-full flex-1 flex-col bg-background lg:hidden">
            <div className="relative aspect-video w-full border-b border-border bg-card">
              <Game />
              <GameOverlay />
            </div>

            <div className="flex border-b border-border bg-background">
              <Tabs defaultValue="games" className="w-full">
                <TabsList className="flex h-10 w-full rounded-none border-b-0 bg-transparent p-0">
                  <TabsTrigger
                    value="games"
                    className="text-label flex-1 rounded-none text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    GAMES
                  </TabsTrigger>
                  <TabsTrigger
                    value="bets"
                    className="text-label flex-1 rounded-none text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    MY BETS
                  </TabsTrigger>
                  <TabsTrigger
                    value="info"
                    className="text-label flex-1 rounded-none text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    DATA
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="games" className="mt-0">
                  <LeftSidebarContent tab="games" />
                </TabsContent>
                <TabsContent value="bets" className="mt-0">
                  <LeftSidebarContent tab="bets" />
                </TabsContent>
                <TabsContent value="info" className="mt-0">
                  <RightSidebarContent />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </SWRConfig>
    </Provider>
  );
}
