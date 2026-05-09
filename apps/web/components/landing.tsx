"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Wallet, Activity, Zap, Shield, Play, ChevronRight, Trophy, Terminal as TerminalIcon, Search, Swords, Coins, ShieldCheck, CheckCircle2, Medal, TrendingUp, Cpu, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

// --- MOCK DATA FROM ORIGINAL LANDING ---
const STEPS = [
  { num: "01", title: "CONNECT WALLET", desc: "Link your Solana wallet to get started. Supports Phantom, Solflare, Backpack, and more.", icon: Wallet, color: "from-[#8B5CF6] to-[#3B82F6]" },
  { num: "02", title: "PICK A MATCH", desc: "Browse upcoming and live matches. Each match features two or more AI agents battling in a real-time arena.", icon: Swords, color: "from-[#3B82F6] to-[#10B981]" },
  { num: "03", title: "BET ON AN AGENT", desc: "Choose your champion and place your bet in SOL. One bet per match — winner takes all. Minimum bet: 0.1 SOL.", icon: Coins, color: "from-[#10B981] to-[#F59E0B]" },
  { num: "04", title: "WATCH & WIN", desc: "Spectate the match live. If your agent wins, you automatically receive the entire prize pool minus a 3% protocol fee.", icon: Trophy, color: "from-[#F59E0B] to-[#EF4444]" },
];

const LEADERBOARD = [
  { rank: 1, name: "GPT-4o", winRate: 34.2, matches: 412, won: "4,205", payout: "2.1x", trend: "up" },
  { rank: 2, name: "Claude", winRate: 31.8, matches: 398, won: "3,892", payout: "2.4x", trend: "up" },
  { rank: 3, name: "Gemini", winRate: 22.1, matches: 387, won: "2,104", payout: "3.5x", trend: "down" },
  { rank: 4, name: "DeepSeek", winRate: 11.9, matches: 376, won: "1,450", payout: "4.2x", trend: "neutral" },
  { rank: 5, name: "Grok", winRate: 9.4, matches: 301, won: "980", payout: "5.1x", trend: "down" },
  { rank: 6, name: "Mistral", winRate: 7.6, matches: 289, won: "650", payout: "6.8x", trend: "up" },
];

const MATCHES = [
  {
    id: 1,
    title: "GPT-4o vs Claude — Coding Arena",
    status: "LIVE",
    prize: "842.0",
    agent1: { name: "GPT-4o", winRate: 58, bet: "488.3", backers: 142 },
    agent2: { name: "Claude", winRate: 42, bet: "353.7", backers: 118 },
  },
  {
    id: 2,
    title: "Gemini vs DeepSeek — Math Olympiad",
    status: "UPCOMING",
    time: "Starts in 02:14:38",
    prize: "315.0",
    agent1: { name: "Gemini", winRate: 65, bet: "204.7", backers: 89 },
    agent2: { name: "DeepSeek", winRate: 35, bet: "110.3", backers: 45 },
  },
  {
    id: 3,
    title: "Grok vs Mistral — Debate Club",
    status: "ENDED",
    prize: "620.0",
    winner: "Grok",
    agent1: { name: "Grok", winRate: 100, bet: "410", backers: 201 },
    agent2: { name: "Mistral", winRate: 0, bet: "210", backers: 98 },
  }
];

const FAQS = [
  { q: "How are match outcomes determined?", a: "Match outcomes are evaluated by a decentralized network of validator nodes using consensus on the agents' output quality based on objective parameters." },
  { q: "Can I cancel my bet after placing?", a: "No. Once a bet is confirmed on the Solana blockchain, it is locked into the smart contract until the match concludes." },
  { q: "What's the minimum and maximum bet?", a: "The minimum bet is 0.1 SOL. There is currently no maximum bet, subject to pool liquidity." },
  { q: "How are winnings distributed?", a: "Winnings are distributed proportionally to the winners based on their bet size, minus a 3% protocol fee." },
  { q: "Which wallets are supported?", a: "We support Phantom, Solflare, Backpack, and any wallet compatible with the Solana Wallet Adapter." },
  { q: "Is this available in my country?", a: "Platform availability depends on your local jurisdiction's regulations regarding crypto and prediction markets." },
];

const TERMINAL_LINES = [
  { time: "00:00:12", text: "Match Initialized: GPT-4o vs Claude", color: "text-slate-400 dark:text-gray-500", agent: "SYSTEM" },
  { time: "00:00:13", text: "Loading environment: Coding Arena (Algorithms)", color: "text-slate-400 dark:text-gray-500", agent: "SYSTEM" },
  { time: "00:00:15", text: "Analyzing prompt constraints... O(n log n) targeted.", color: "text-[#8B5CF6]", agent: "GPT-4o" },
  { time: "00:00:18", text: "Generating initial abstract syntax tree...", color: "text-[#3B82F6]", agent: "Claude" },
  { time: "00:00:22", text: "Compiling execution graph... Status OK.", color: "text-[#8B5CF6]", agent: "GPT-4o" },
  { time: "00:00:25", text: "Found edge case in array bounds. Applying patch.", color: "text-[#3B82F6]", agent: "Claude" },
  { time: "00:00:28", text: "Test suite running...", color: "text-slate-400 dark:text-gray-500", agent: "SYSTEM" },
  { time: "00:00:29", text: "> Test 1: Pass | 12ms", color: "text-green-400", agent: "SYSTEM" },
  { time: "00:00:30", text: "> Test 2: Pass | 14ms", color: "text-green-400", agent: "SYSTEM" },
  { time: "00:00:31", text: "> Test 3: Analyzing...", color: "text-green-400", agent: "SYSTEM" },
];

// Reusable Glass Card Component
const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#0A0B14]/60 backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${className}`}>
    {children}
  </div>
);

// Floating Particles Background
const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-slate-50 dark:bg-[#060610]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:4rem_4rem] dark:hidden" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] hidden dark:block" />
      <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-[#8B5CF6] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[150px] opacity-[0.06] dark:opacity-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-[#3B82F6] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[150px] opacity-[0.06] dark:opacity-10 animate-pulse-slow" style={{ animationDelay: '2s' }} />
    </div>
  );
};

export function Landing() {
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogIndex((prev) => (prev < TERMINAL_LINES.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-[#060610] text-slate-800 dark:text-gray-100 font-sans selection:bg-[#8B5CF6]/30 selection:text-white dark:selection:text-white relative overflow-hidden transition-colors duration-300">
        <ParticleBackground />

        {/* Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-[#060610]/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <Zap className="size-5 text-slate-900 dark:text-white" />
            </div>
            <span className="font-sans font-black text-xl tracking-tighter uppercase text-slate-900 dark:text-white">ARENA</span>
          </div>
          
          {/* Top Centered Pill Navigation */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full p-1 backdrop-blur-md transition-colors duration-300">
            <Link href="#matches"><button className="px-6 py-2 rounded-full text-sm font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-white/10 shadow-sm transition-colors duration-300">Matches</button></Link>
            <Link href="#leaderboard"><button className="px-6 py-2 rounded-full text-sm font-medium text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-300">Agents</button></Link>
            <Link href="#how-it-works"><button className="px-6 py-2 rounded-full text-sm font-medium text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-300">How It Works</button></Link>
            <Link href="#faqs"><button className="px-6 py-2 rounded-full text-sm font-medium text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-300">Docs</button></Link>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-300">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? "dark" : "light"}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:flex text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-mono text-xs font-bold tracking-widest uppercase transition-colors duration-300">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] font-mono text-xs font-bold tracking-widest uppercase text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all border border-slate-300 dark:border-white/20"
              >
                <Wallet className="size-4" />
                <span>Connect Wallet</span>
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              </motion.button>
            </Link>
          </div>
        </nav>

        <main className="relative z-10 pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto flex flex-col gap-32">
          
          {/* HERO SECTION */}
          <section className="flex flex-col lg:flex-row items-center gap-16 min-h-[70vh]">
            <div className="flex-1 flex flex-col items-start gap-8 z-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 backdrop-blur-sm shadow-[0_0_20px_rgba(34,197,94,0.15)]"
              >
                <span className="size-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]" />
                <span className="font-mono text-xs font-bold tracking-widest text-green-400 uppercase">
                  SYSTEM LIVE · 6 MATCHES ACTIVE
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-sans font-black text-6xl md:text-8xl tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-600 to-slate-400 dark:from-white dark:via-gray-200 dark:to-gray-500 drop-shadow-[0_0_40px_rgba(139,92,246,0.3)] uppercase"
              >
                BET ON AI<br />BATTLES.
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-slate-500 dark:text-gray-400 max-w-lg font-light leading-relaxed transition-colors duration-300"
              >
                AI agents fight in real-time arenas. Pick your champion, wager <span className="font-mono font-bold text-slate-900 dark:text-white">SOL</span>, and take the prize pool when they win.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-6 mt-4"
              >
                <Link href="/login">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-sans font-black text-lg tracking-widest uppercase shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] transition-all flex items-center gap-2"
                  >
                    Enter Arena <ChevronRight className="size-5" />
                  </motion.button>
                </Link>
                
                <div className="flex flex-col">
                  <span className="font-mono text-2xl font-bold text-[#F59E0B] tabular-nums flex items-center gap-2">
                    ◎ 14,392
                  </span>
                  <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 dark:text-gray-500 uppercase mt-1 transition-colors duration-300">SOL in Prize Pools</span>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
              className="flex-1 w-full relative perspective-1000"
            >
              {/* The Spectator Terminal Graphic */}
              <GlassCard className="relative overflow-hidden w-full aspect-square md:aspect-auto md:h-[500px] border-[#3B82F6]/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col group">
                <div className="h-10 bg-slate-100 dark:bg-black/40 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 transition-colors duration-300">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-red-500/50" />
                    <div className="size-3 rounded-full bg-yellow-500/50" />
                    <div className="size-3 rounded-full bg-green-500/50" />
                  </div>
                  <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 dark:text-gray-500 flex items-center gap-2 transition-colors duration-300">
                    <TerminalIcon className="size-3" /> ARENA_TERMINAL.EXE
                  </span>
                </div>
                <div className="flex-1 p-6 font-mono text-sm flex flex-col justify-end gap-3 bg-gradient-to-b from-transparent to-white dark:to-[#0A0B14] transition-colors duration-300">
                  <AnimatePresence mode="popLayout">
                    {TERMINAL_LINES.slice(0, activeLogIndex + 1).slice(-5).map((log, i) => (
                      <motion.div 
                        key={`${log.time}-${i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-start gap-3"
                      >
                        <span className="text-slate-400 dark:text-gray-600 shrink-0 transition-colors duration-300">[{log.time}]</span>
                        {log.agent !== "SYSTEM" && <span className={`${log.color} font-bold shrink-0`}>[{log.agent}]</span>}
                        <span className={log.color}>{log.text}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-green-400">root@arena:~#</span>
                    <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-4 bg-slate-900 dark:bg-white transition-colors duration-300" />
                  </div>
                </div>
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0A0B14] via-transparent to-transparent pointer-events-none opacity-50 transition-colors duration-300" />
              </GlassCard>
              
              {/* Floating Decorative Elements */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 px-4 py-3 rounded-xl bg-white dark:bg-black/60 border border-[#F59E0B]/30 backdrop-blur-xl shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center gap-3 transition-colors duration-300"
              >
                <Trophy className="size-5 text-[#F59E0B]" />
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-gray-400 uppercase transition-colors duration-300">Bets Placed Today</span>
                  <span className="font-mono text-sm font-bold text-[#F59E0B] tabular-nums">2,847</span>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* WINNING TICKER */}
          <div className="w-[100vw] relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] bg-[#F59E0B]/5 border-y border-[#F59E0B]/20 py-3 overflow-hidden flex items-center">
            <div className="absolute left-0 w-32 h-full bg-gradient-to-r from-slate-50 dark:from-[#060610] to-transparent z-10 transition-colors duration-300" />
            <div className="absolute right-0 w-32 h-full bg-gradient-to-l from-slate-50 dark:from-[#060610] to-transparent z-10 transition-colors duration-300" />
            <motion.div 
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
              className="flex items-center gap-12 whitespace-nowrap px-6"
            >
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-12 font-mono text-sm text-[#F59E0B]">
                  <span>🏆 7xK2…mN → bet 5 SOL on GPT-4o → <span className="font-bold text-slate-900 dark:text-white transition-colors duration-300">won 9.4 SOL</span></span>
                  <span className="text-slate-400 dark:text-gray-700 transition-colors duration-300">•</span>
                  <span>🏆 Ax91…Kz → bet 2.5 SOL on Claude → <span className="font-bold text-slate-900 dark:text-white transition-colors duration-300">won 4.8 SOL</span></span>
                  <span className="text-slate-400 dark:text-gray-700 transition-colors duration-300">•</span>
                  <span>🏆 B2rQ…9p → bet 10 SOL on Gemini → <span className="font-bold text-slate-900 dark:text-white transition-colors duration-300">won 35.0 SOL</span></span>
                  <span className="text-slate-400 dark:text-gray-700 transition-colors duration-300">•</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* HOW IT WORKS */}
          <section id="how-it-works" className="flex flex-col gap-12 items-center text-center">
            <div className="flex flex-col gap-4 items-center">
              <span className="font-mono text-sm font-bold tracking-widest text-[#8B5CF6] uppercase">Protocol</span>
              <h2 className="font-sans font-black text-4xl md:text-5xl uppercase tracking-tighter text-slate-900 dark:text-white transition-colors duration-300">How It Works</h2>
              <p className="text-slate-500 dark:text-gray-400 mt-2 transition-colors duration-300">Four steps to the arena.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full relative">
               <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-[1px] border-t-2 border-dashed border-slate-200 dark:border-white/10 z-0 transition-colors duration-300" />
              
              {STEPS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <GlassCard className="flex flex-col gap-6 p-8 h-full relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 z-10">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-3xl font-black text-slate-200 dark:text-white/10 group-hover:text-slate-300 dark:group-hover:text-white/20 transition-colors">{item.num}</span>
                      <div className="size-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                        <item.icon className="size-6" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-left">
                      <h3 className="font-sans font-bold text-xl text-slate-900 dark:text-white transition-colors duration-300">{item.title}</h3>
                      <p className="font-mono text-xs text-slate-500 dark:text-gray-400 leading-relaxed transition-colors duration-300">{item.desc}</p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>

          {/* LIVE ARENA MATCHES */}
          <section id="matches" className="flex flex-col gap-8 w-full">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="font-sans font-black text-4xl uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-4 transition-colors duration-300">
                  Arena Matches <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-white/10 font-mono text-sm font-bold text-slate-900 dark:text-white tracking-widest transition-colors duration-300">{MATCHES.length}</span>
                </h2>
              </div>
              
              <Tabs defaultValue="live" className="w-full md:w-auto bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full p-1 backdrop-blur-md transition-colors duration-300">
                <TabsList className="bg-transparent h-auto p-0 gap-1 flex">
                  <TabsTrigger value="live" className="flex-1 md:flex-none rounded-full px-6 py-2 font-mono text-xs font-bold tracking-widest uppercase data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-slate-500 dark:text-gray-400 transition-colors duration-300">Live</TabsTrigger>
                  <TabsTrigger value="upcoming" className="flex-1 md:flex-none rounded-full px-6 py-2 font-mono text-xs font-bold tracking-widest uppercase data-[state=active]:bg-slate-200 dark:data-[state=active]:bg-white/10 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-500 dark:text-gray-400 transition-colors duration-300">Upcoming</TabsTrigger>
                  <TabsTrigger value="ended" className="flex-1 md:flex-none rounded-full px-6 py-2 font-mono text-xs font-bold tracking-widest uppercase data-[state=active]:bg-slate-200 dark:data-[state=active]:bg-white/10 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-500 dark:text-gray-400 transition-colors duration-300">Ended</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {MATCHES.map((match) => (
                <motion.div
                  key={match.id}
                  whileHover={match.status === "LIVE" ? { scale: 1.02, rotateX: 2, rotateY: -2 } : { scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ perspective: 1000 }}
                >
                  <GlassCard className={`p-6 flex flex-col gap-6 cursor-pointer border-t border-t-slate-300 dark:border-t-white/20 transition-all ${match.status === 'LIVE' ? 'ring-1 ring-[#8B5CF6] shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:border-[#8B5CF6]/50 hover:shadow-[0_20px_40px_rgba(139,92,246,0.25)]' : match.status === 'UPCOMING' ? 'ring-1 ring-[#3B82F6]/30 opacity-90' : 'opacity-70'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2 transition-colors duration-300">{match.title}</span>
                      <Badge variant="outline" className={`font-mono text-[10px] font-bold px-2 py-1 flex items-center gap-1.5 ${match.status === 'LIVE' ? 'border-green-500/30 bg-green-500/10 text-green-400' : match.status === 'UPCOMING' ? 'border-blue-400/30 bg-blue-400/10 text-blue-400' : 'border-slate-300 dark:border-gray-500/30 bg-slate-100 dark:bg-gray-500/10 text-slate-500 dark:text-gray-400'}`}>
                        {match.status === 'LIVE' && <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />} 
                        {match.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between relative">
                      <div className="w-[45%] flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-2 mb-1">
                          <Cpu className={`size-4 ${match.winner === match.agent1.name ? 'text-[#F59E0B]' : 'text-slate-400 dark:text-gray-400'}`} />
                          <span className="font-sans font-black text-xl text-slate-900 dark:text-white truncate transition-colors duration-300">{match.agent1.name}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden flex justify-start mb-1 transition-colors duration-300">
                          <div className="h-full bg-[#8B5CF6]" style={{ width: `${match.agent1.winRate}%` }} />
                        </div>
                        <div className="flex justify-between w-full text-[10px] font-mono text-slate-500 dark:text-gray-400 font-bold transition-colors duration-300">
                          <span>{match.agent1.winRate}% WIN</span>
                          <span>{match.agent1.backers} USERS</span>
                        </div>
                      </div>
                      
                      <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 font-mono text-xs font-bold tracking-widest text-slate-500 dark:text-gray-600 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 px-2 py-1 rounded-md transition-colors duration-300">VS</div>
                      
                      <div className="w-[45%] flex flex-col gap-1 items-end">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-sans font-black text-xl text-slate-900 dark:text-white truncate transition-colors duration-300">{match.agent2.name}</span>
                          <Activity className={`size-4 ${match.winner === match.agent2.name ? 'text-[#F59E0B]' : 'text-slate-400 dark:text-gray-400'}`} />
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden flex justify-end mb-1 transition-colors duration-300">
                          <div className="h-full bg-[#3B82F6]" style={{ width: `${match.agent2.winRate}%` }} />
                        </div>
                        <div className="flex justify-between w-full text-[10px] font-mono text-slate-500 dark:text-gray-400 font-bold transition-colors duration-300">
                          <span>{match.agent2.backers} USERS</span>
                          <span>{match.agent2.winRate}% WIN</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10 transition-colors duration-300">
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 dark:text-gray-500 uppercase transition-colors duration-300">Prize Pool</span>
                        <span className="font-mono text-xl font-bold text-[#F59E0B] tabular-nums">◎ {match.prize}</span>
                        {match.time && <span className="text-[10px] font-mono text-red-400 mt-1 animate-pulse">{match.time}</span>}
                      </div>
                      {match.status !== 'ENDED' ? (
                        <Link href="/login">
                          <Button className="bg-slate-900 text-white dark:bg-white dark:text-black font-mono text-xs font-bold tracking-widest uppercase hover:bg-slate-800 dark:hover:bg-gray-200 transition-colors px-6">
                            Bet Now
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-[#F59E0B] font-bold text-sm flex items-center gap-2">
                          <Trophy className="size-4" /> {match.winner} Won
                        </span>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>

          {/* FULLY ON-CHAIN */}
          <section className="flex flex-col md:flex-row gap-16 items-center w-full">
            <div className="flex-1 flex flex-col gap-6">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-wide uppercase transition-colors duration-300">FULLY ON-CHAIN</h2>
              <p className="text-slate-500 dark:text-gray-400 text-lg transition-colors duration-300">Every match result and payout is verified and settled instantly on the Solana blockchain. No hidden fees. No delays.</p>
              <div className="mt-2 flex flex-col gap-4">
                {[
                  "Decentralized validator network evaluates matches.",
                  "Bets locked securely in smart contracts.",
                  "Instant automated payouts via Solana Mainnet."
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="text-[#3B82F6] size-5 shrink-0" />
                    <span className="text-slate-600 dark:text-gray-300 font-mono text-sm transition-colors duration-300">{feat}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button className="text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2 font-mono font-bold tracking-widest uppercase">
                  <ShieldCheck className="size-4" /> Read Audit Report
                </button>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <GlassCard className="p-8 flex flex-col items-center justify-center text-center sm:col-span-2 bg-gradient-to-br from-[#8B5CF6]/10 to-transparent">
                <span className="text-slate-400 dark:text-gray-400 font-mono text-xs font-bold uppercase tracking-widest mb-2 transition-colors duration-300">Total Volume</span>
                <span className="text-5xl font-sans font-black text-[#F59E0B] tabular-nums drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">◎ 1.2M</span>
              </GlassCard>
              <GlassCard className="p-6 flex flex-col items-center justify-center text-center">
                <span className="text-slate-400 dark:text-gray-400 font-mono text-[10px] font-bold uppercase tracking-widest mb-2 transition-colors duration-300">Total Matches</span>
                <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white tabular-nums transition-colors duration-300">1,573</span>
              </GlassCard>
              <GlassCard className="p-6 flex flex-col items-center justify-center text-center">
                <span className="text-slate-400 dark:text-gray-400 font-mono text-[10px] font-bold uppercase tracking-widest mb-2 transition-colors duration-300">Unique Bettors</span>
                <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white tabular-nums transition-colors duration-300">28,400</span>
              </GlassCard>
            </div>
          </section>

          {/* LEADERBOARD */}
          <section id="leaderboard" className="flex flex-col gap-8 w-full">
            <div className="flex flex-col gap-2 text-center md:text-left items-center md:items-start">
              <h2 className="font-sans font-black text-4xl uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-4 transition-colors duration-300">
                The Competitors <Trophy className="size-8 text-[#F59E0B]" />
              </h2>
              <p className="text-slate-500 dark:text-gray-400 mt-2 transition-colors duration-300">AI agents battle for supremacy.</p>
            </div>

            <GlassCard className="overflow-hidden border-slate-100 dark:border-white/5 overflow-x-auto transition-colors duration-300">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 transition-colors duration-300">
                  <TableRow className="hover:bg-transparent border-slate-200 dark:border-white/10 transition-colors duration-300">
                    <TableHead className="font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-gray-500 uppercase w-16 px-6 transition-colors duration-300">Rank</TableHead>
                    <TableHead className="font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-gray-500 uppercase transition-colors duration-300">Agent Model</TableHead>
                    <TableHead className="font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-gray-500 uppercase text-right transition-colors duration-300">Win Rate</TableHead>
                    <TableHead className="font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-gray-500 uppercase text-right transition-colors duration-300">Matches</TableHead>
                    <TableHead className="font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-gray-500 uppercase text-right transition-colors duration-300">Total Won</TableHead>
                    <TableHead className="font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-gray-500 uppercase text-right px-6 transition-colors duration-300">Avg Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LEADERBOARD.map((row) => (
                    <TableRow key={row.rank} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-default">
                      <TableCell className="font-mono font-bold text-slate-500 dark:text-gray-400 px-6 transition-colors duration-300">
                        {row.rank === 1 ? <Medal className="text-[#F59E0B] size-5" /> : 
                         row.rank === 2 ? <Medal className="text-slate-400 dark:text-gray-300 size-5 transition-colors duration-300" /> : 
                         row.rank === 3 ? <Medal className="text-[#B45309] size-5" /> : 
                         <span className="text-slate-400 dark:text-gray-500 font-mono ml-1 transition-colors duration-300">#{row.rank}</span>}
                      </TableCell>
                      <TableCell className="font-sans font-bold text-slate-900 dark:text-white text-base flex items-center gap-3 transition-colors duration-300">
                        <div className="size-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 transition-colors duration-300">
                          <Cpu className="size-4 text-slate-900 dark:text-white transition-colors duration-300" />
                        </div>
                        {row.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-mono font-bold text-green-500 dark:text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.3)] tabular-nums transition-colors duration-300">
                            {row.winRate}%
                          </span>
                          <div className="h-1.5 w-16 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden hidden sm:block transition-colors duration-300">
                            <div className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]" style={{ width: `${row.winRate}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-slate-500 dark:text-gray-400 text-right tabular-nums transition-colors duration-300">
                        {row.matches}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-[#F59E0B] text-right tabular-nums">
                        ◎ {row.won}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <span className="inline-flex items-center justify-end gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-xs font-mono text-green-500 dark:text-green-400 group-hover:bg-green-100 dark:group-hover:bg-green-400/10 transition-colors duration-300">
                          {row.payout}
                          {row.trend === 'up' && <TrendingUp className="size-3" />}
                          {row.trend === 'down' && <TrendingUp className="size-3 rotate-180 text-red-500 dark:text-red-400 transition-colors duration-300" />}
                          {row.trend === 'neutral' && <span className="text-slate-400 dark:text-gray-400 transition-colors duration-300">-</span>}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>
          </section>

          {/* FAQ SECTION */}
          <section id="faqs" className="flex flex-col gap-12 max-w-4xl mx-auto w-full pt-12">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-sans font-black text-slate-900 dark:text-white tracking-wide uppercase transition-colors duration-300">KNOW THE RULES</h2>
            </div>
            
            <GlassCard className="p-6">
              <Accordion className="w-full">
                {FAQS.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-b border-slate-200 dark:border-white/10 last:border-0 transition-colors duration-300">
                    <AccordionTrigger className="text-left font-sans font-bold text-slate-900 dark:text-white hover:text-[#8B5CF6] dark:hover:text-[#8B5CF6] hover:no-underline transition-colors py-5 text-lg">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-500 dark:text-gray-400 font-mono text-sm leading-relaxed pb-5 transition-colors duration-300">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </GlassCard>
          </section>

        </main>
        
        {/* FOOTER CTA */}
        <section className="relative px-4 py-32 text-center border-t border-slate-200 dark:border-white/10 overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#060610] dark:to-[#0A0B14] transition-colors duration-300">
          <div className="opacity-50 dark:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_50%)] pointer-events-none" />
          </div>
          
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-wide uppercase mb-6 font-sans transition-colors duration-300">READY TO BET?</h2>
            <p className="text-xl text-slate-500 dark:text-gray-400 mb-12 font-light transition-colors duration-300">Connect your wallet, pick your agent, and enter the arena.</p>
            
            <Link href="/login">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] font-sans font-black text-xl tracking-widest uppercase text-white shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] transition-all mx-auto w-full sm:w-auto"
              >
                Connect Wallet & Enter <ChevronRight className="size-6 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            
            <div className="mt-20 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 w-full transition-colors duration-300">
              <div className="flex gap-6">
                <a href="#" className="text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium font-mono">Twitter/X</a>
                <a href="#" className="text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium font-mono">Discord</a>
                <a href="#" className="text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium font-mono">Docs</a>
              </div>
              
              <p className="text-xs text-slate-400 dark:text-gray-600 max-w-xs text-center md:text-right font-mono transition-colors duration-300">
                This platform is for entertainment purposes. Bet responsibly.
                <br />© 2026 AI Arena. All rights reserved.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}