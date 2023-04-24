import { LocalStorage, LocalStorageKey } from "./../localstorage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface StackState {
  goalIdStack: string[];
  highlightedGoalId: string | null;
  hoveredGoalId: string | null;
  init: (goalId: string) => void;
  addChild: (parentId: string, childId: string) => void;
  highlight: (goalId: string) => void;
  hover: (goalId: string | null) => void;
}

export const useStackStore = create(
  persist<StackState>(
    (set, get) => ({
      goalIdStack: [] as string[], // Index n - 1 is the top of the stack
      highlightedGoalId: null,
      hoveredGoalId: null,
      init: (goalId: string) => set({ goalIdStack: [goalId] }),
      addChild: (parentId: string, childId: string) => {
        // Find parent, remove it and all its children, then add the parent and the child
        const { goalIdStack } = get();
        const parentIndex = goalIdStack.indexOf(parentId);
        if (parentIndex === -1) {
          throw new Error("Parent not found in stack");
        }
        const newStack = [...goalIdStack.slice(0, parentIndex + 1), childId];
        set({ goalIdStack: newStack });
      },
      highlight: (goalId: string) => set({ highlightedGoalId: goalId }),
      hover: (goalId: string | null) => set({ hoveredGoalId: goalId }),
    }),
    {
      name: LocalStorageKey.StackStore, // name of the item in the storage (must be unique)
    }
  )
);
