import { atom } from "jotai";
import { MOCK_BETS } from "./mock-data";
import type { Bet, Game } from "@repo/db";

export const selectedGameAtom = atom<Game | null>(null);

export const spectatingAgentAtom = atom<string | null>(null);

export const betsAtom = atom<Bet[]>(MOCK_BETS);