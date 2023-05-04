import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { type RouterOutputs } from "./api";
import { LocalStorage, LocalStorageKey } from "./localstorage";

export const goalAtom = atom<RouterOutputs["goal"]["get"] | undefined>(
  undefined
);

export const newSubgoalAtom = atom<{
  parentGoalId: string;
  subgoalTitle: string;
} | null>(null);
export const loadingAiAtom = atom<boolean>(false);

export const newGuideAtom = atom<string | null>(null);

export const turboModeAtom = atomWithStorage<boolean>(
  LocalStorageKey.TurboMode,
  false
);
