import { type Goal } from "@prisma/client";
import { atom } from "jotai";

export const goalAtom = atom<Goal | null>(null);

export const newPrereqAtom = atom<string | null>(null);
export const newSubgoalAtom = atom<string | null>(null);
export const loadingAiAtom = atom<boolean>(false);

export const newGuideAtom = atom<string | null>(null);
