import { Provider } from "jotai";
import { Game } from "@/components/game";
import { Navbar } from "@/components/navbar";
import { GameOverlay } from "@/components/game-overlay";
import { LeftSidebar, LeftSidebarContent, LeftSidebarToggle } from "@/components/left-sidebar";
import { RightSidebar, RightSidebarContent } from "@/components/right-sidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ContentTab = "games" | "bets" | "info";

const TERMINAL_LOGS = [
  "> INITIALIZING NEURAL ENGINE...",
  "> ALLOCATING AGENT RESOURCES...",
  "> SYNCING ON-CHAIN DATA STATE...",
  "> ARENA READY. AWAITING DEPLOYMENT.",
];

function BattleTerminal() {
  const [logs, setLogs] = useState<string[]>([]);
  const selectedGame = useAtomValue(selectedGameAtom);

  useEffect(() => {
    let i = 0;
    setLogs([]);
    const interval = setInterval(() => {
      if (i < TERMINAL_LOGS.length) {
        setLogs((prev) => [...prev, TERMINAL_LOGS[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [selectedGame]);

  return (
    <div className="relative flex h-full w-full items-center justify-center p-8 overflow-hidden font-sans">
      {/* Subtle Glowing Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_2px,transparent_2px),linear-gradient(to_bottom,#80808012_2px,transparent_2px)] bg-[size:48px_48px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,#8B5CF620,transparent)]" />
      </div>

      <Card className="relative z-10 flex w-full max-w-4xl flex-col bg-white/90 p-8 md:p-16 rounded-3xl border border-[#3B82F6]/20 backdrop-blur-xl shadow-[0_0_80px_-15px_rgba(59,130,246,0.2)] transition-all overflow-hidden dark:bg-[#04050A]/80 dark:border-[#3B82F6]/30">
        {/* Decorative Top Bar for Terminal */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-slate-100 dark:bg-white/5 border-b border-slate-300 dark:border-white/10 flex items-center px-4 gap-2">
          <div className="size-3 rounded-full bg-red-500/80" />
          <div className="size-3 rounded-full bg-yellow-500/80" />
          <div className="size-3 rounded-full bg-green-500/80" />
          <span className="ml-2 font-mono text-[10px] text-slate-400 dark:text-gray-500 font-bold">TERMINAL.EXE</span>
        </div>

        <div className="mt-8 flex flex-col items-center gap-10 text-center">
          {selectedGame ? (
            <>
              <span className="font-sans font-black text-5xl md:text-6xl tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-[#8B5CF6] dark:from-white dark:via-gray-100 dark:to-[#8B5CF6] drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                {selectedGame.name}
              </span>
              
              <div className="flex flex-col gap-2 bg-white dark:bg-black/60 w-full rounded-xl border border-slate-300 dark:border-white/10 p-4 text-left min-h-[120px] font-mono text-sm text-[#3B82F6] shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]">
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {log}
                  </motion.div>
                ))}
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-2 h-4 bg-[#3B82F6] mt-1"
                />
              </div>

              {selectedGame.status === "UPCOMING" && (
                <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                  <span className="font-mono text-sm font-bold tracking-widest text-[#F59E0B] uppercase">
                    AWAITING DEPLOYMENT — PLACE BETS
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-12 w-full pt-8">
              <span className="font-sans font-black text-6xl md:text-7xl tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-600 to-slate-400 dark:from-white dark:via-gray-200 dark:to-gray-600 drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                AGENT ARENA
              </span>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ boxShadow: ["0 0 20px rgba(139,92,246,0.4)", "0 0 60px rgba(139,92,246,0.8)", "0 0 20px rgba(139,92,246,0.4)"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-10 py-5 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white font-sans font-black text-2xl uppercase tracking-widest shadow-2xl"
              >
                SELECT A GAME
              </motion.button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export function Home() {
  const selectedGame = useAtomValue(selectedGameAtom);
  const isLive = selectedGame?.status === "LIVE";
  const [mobileTab, setMobileTab] = useState<ContentTab>("games");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

  return (
    <Provider>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-slate-900 font-sans selection:bg-[#8B5CF6]/30 selection:text-white dark:bg-[#04050A] dark:text-gray-100">
        <Navbar />

        {/* Desktop Layout */}
        <div className="hidden min-h-0 flex-1 lg:flex relative w-full h-full">
          
          <LeftSidebar isCollapsed={!isLeftSidebarOpen} onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} />
          
          {/* Main Content Area */}
          <main className="relative min-w-0 flex-1 bg-transparent flex flex-col w-full h-full z-0">
            <LeftSidebarToggle />
            <Game />
            <GameOverlay />
          </main>
          
          <RightSidebar />
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:hidden w-full h-full bg-[#04050A]">
          <div className="relative aspect-video w-full border-b border-[#3B82F6]/30">
            <Game />
            <GameOverlay />
          </div>

          <div className="flex border-b border-slate-300 dark:border-white/10 bg-white dark:bg-[#04050A]/90 backdrop-blur-xl px-2 pt-2">
            <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as any)} className="w-full">
              <TabsList className="w-full bg-transparent p-0 gap-2 h-12 border-b-0 rounded-none flex">
                <TabsTrigger 
                  value="games" 
                  className="flex-1 rounded-none font-mono text-xs font-bold tracking-widest uppercase data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 dark:data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 dark:data-[state=active]:border-[#8B5CF6] text-slate-500 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-gray-300"
                >
                  GAMES
                </TabsTrigger>
                <TabsTrigger 
                  value="bets" 
                  className="flex-1 rounded-none font-mono text-xs font-bold tracking-widest uppercase data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 dark:data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 dark:data-[state=active]:border-[#8B5CF6] text-slate-500 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-gray-300"
                >
                  MY BETS
                </TabsTrigger>
                <TabsTrigger 
                  value="info" 
                  className="flex-1 rounded-none font-mono text-xs font-bold tracking-widest uppercase data-[state=active]:bg-transparent data-[state=active]:text-blue-600 dark:data-[state=active]:text-[#3B82F6] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-[#3B82F6] text-slate-500 dark:text-gray-500 hover:text-blue-500 dark:hover:text-gray-300"
                >
                  INFO
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-2">
            {mobileTab === "games" && <LeftSidebarContent tab="games" />}
            {mobileTab === "bets" && <LeftSidebarContent tab="bets" />}
            {mobileTab === "info" && <RightSidebarContent />}
          </div>
        </div>
      </div>
    </Provider>
  );
}