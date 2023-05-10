import { atom } from "jotai";
import { atomWithStorage, selectAtom, splitAtom } from "jotai/utils";
import { type RouterOutputs } from "./api";
import { LocalStorage, LocalStorageKey } from "./localstorage";

export const goalAtom = atom<RouterOutputs["question"]["get"] | undefined>(
  undefined
);

export const allQuestionsAtom = atom<RouterOutputs["question"]["get"][]>([]);

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
