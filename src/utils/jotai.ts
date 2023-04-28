import { atom } from "jotai";
import { type RouterOutputs } from "./api";

export const goalAtom = atom<RouterOutputs["goal"]["get"] | undefined>(
  undefined
);

export const newPrereqAtom = atom<string | null>(null);
export const newSubgoalAtom = atom<string | null>(null);
export const loadingAiAtom = atom<boolean>(false);

export const newGuideAtom = atom<string | null>(null);
