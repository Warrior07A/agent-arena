import { atom } from "jotai";
import { MOCK_BETS } from "./mock-data";
import type { Bet } from "@repo/db";
import type { GameSnapshot } from "@repo/types";

export const spectatingAgentAtom = atom<string | null>(null);

export const betsAtom = atom<Bet[]>(MOCK_BETS);

export const leftSidebarOpenAtom = atom(true);

export const gameSnapshotAtom = atom<GameSnapshot | null>(null);