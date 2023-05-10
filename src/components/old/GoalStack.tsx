import { ArrowUpIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { useQueryParam } from "../../hooks/useQueryParam";
import { api } from "../../utils/api";
import { handleError } from "../../utils/handleError";
import { goalAtom } from "../../utils/jotai";
import { useStackStore } from "../../utils/zustand/stackStore";

interface RenderGoalProps {
  goalId: string;
  highlighted?: boolean;
  hovered?: boolean;
  showArrow?: boolean;
}

function RenderGoal(props: RenderGoalProps) {
  const router = useRouter();
  const { goalId, highlighted, hovered, showArrow = false } = props;

  const [localGoal] = useAtom(goalAtom);

  const { data: remoteGoal } = api.question.get.useQuery(
    { id: goalId },
    {
      enabled: localGoal?.id !== goalId,
    }
  );

  const goal = localGoal?.id === remoteGoal?.id ? localGoal : remoteGoal;

  const styles = clsx({
    "p-2 shadow rounded cursor-pointer hover:bg-white/50 border text-sm": true,
    "bg-white/20": !highlighted && !hovered,
    "bg-white/50": highlighted && !hovered,
    "bg-blue-50": hovered,
  });

  const highlight = useStackStore((state) => state.highlight);

  if (!goal) return null;

  return (
    <div className="relative">
      {showArrow && (
        <div className="absolute bottom-full flex w-full justify-center pb-1.5">
          <ArrowUpIcon height={20} width={20} className="text-gray-400" />
        </div>
      )}
      <div
        // initial={{ opacity: 0 }}
        // animate={{ opacity: 1 }}
        // exit={{ opacity: 0 }}
        // transition={{ duration: 0.3 }}
        className={styles}
        onClick={() => {
          highlight(goal.id);
          router.push(`/question/${goal.id}`).catch(handleError);
        }}
      >
        {goal.title}
      </div>
    </div>
  );
}

export function GoalStack() {
  const goalIdStack = useStackStore((state) => state.goalIdStack);

  const highlightedGoalId = useStackStore((state) => state.highlightedGoalId);
  const highlight = useStackStore((state) => state.highlight);
  const hover = useStackStore((state) => state.hover);
  const hoveredGoalId = useStackStore((state) => state.hoveredGoalId);

  const goalId = useQueryParam("goalId", "string");
  useEffect(() => {
    if (goalId) {
      highlight(goalId);
      hover(null);
    }
  }, [goalId, highlight, hover]);

  const indexOfHighlightedGoal = highlightedGoalId
    ? goalIdStack.indexOf(highlightedGoalId)
    : -1;

  return (
    <div className="flex flex-col justify-start gap-8">
      {goalIdStack.map((goalId, index) => {
        if (
          indexOfHighlightedGoal >= 0 &&
          index > indexOfHighlightedGoal &&
          hoveredGoalId
        )
          return null;
        return (
          <RenderGoal
            key={index}
            showArrow={index > 0}
            goalId={goalId}
            highlighted={goalId === highlightedGoalId}
          />
        );
      })}
      {hoveredGoalId && (
        <div className="relative">
          <div className="absolute bottom-full flex w-full justify-center pb-1.5">
            <ArrowUpIcon height={20} width={20} className="text-gray-400" />
          </div>

          <RenderGoal goalId={hoveredGoalId} hovered={true} />
        </div>
      )}
    </div>
  );
}
