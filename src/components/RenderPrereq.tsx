import { useRouter } from "next/router";
import { useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { api } from "../utils/api";
import { Bars3Icon, TrashIcon } from "@heroicons/react/24/outline";
import IconButton from "./IconButton";
import { handleError } from "../utils/handleError";
import clsx from "clsx";
import { Checkbox } from "./base/Checkbox";
import ReactTextareaAutosize from "react-textarea-autosize";
import { useStackStore } from "../utils/zustand/stackStore";
import { Fade } from "./animate/Fade";
import { useSortable } from "@dnd-kit/sortable";
import { type Goal } from "@prisma/client";
import { useAutoSave } from "../hooks/useAutosave";

interface RenderPrereqProps {
  linkId: string;
  goalId: string;
  parentGoalId: string;
  isEditMode?: boolean;
  interactionDisabled?: boolean;
}
export function RenderPrereq(props: RenderPrereqProps) {
  const {
    linkId,
    goalId,
    parentGoalId,
    isEditMode = false,
    interactionDisabled = false,
  } = props;

  const [goal, setGoal] = useState<Goal | null>(null);

  const setHoveredGoalId = useStackStore((state) => state.hover);

  const { mutateAsync: updateGoal } = api.goal.update.useMutation({});
  useAutoSave({
    queryOutput: api.goal.get.useQuery({ id: goalId }),
    data: goal,
    setData: setGoal,
    saveFunction: updateGoal,
    shouldSave: (prev, next) => {
      const keys = ["title", "completed"] as const;
      return keys.some((key) => prev?.[key] !== next?.[key]);
    },
  });

  const router = useRouter();

  // DND STUFF
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: linkId,
    });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const utils = api.useContext();
  const { mutateAsync: deleteGoal } = api.goal.delete.useMutation({
    onMutate: async ({ id }) => {
      const query = utils.link.getAllUnderGoal;

      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await query.cancel({ parentGoalId });

      // Get the data from the queryCache
      const prevData = query.getData({ parentGoalId });

      query.setData({ parentGoalId }, (link) => {
        if (!link) return link;
        return link.filter((link) => link.childId !== id);
      });

      return { prevData };
    },
    onError(err, newPost, ctx) {
      // If the mutation fails, use the context-value from onMutate
      utils.link.getAllUnderGoal.setData({ parentGoalId }, ctx?.prevData);
    },
    onSettled() {
      // Sync with server once mutation has settled
      utils.link.getAllUnderGoal
        .invalidate({ parentGoalId })
        .catch(handleError);
    },
  });

  // Code to generate the response
  const listenersIfNotDisabled = interactionDisabled ? {} : listeners;
  const addChild = useStackStore((state) => state.addChild);
  if (!goal) return null;

  return (
    <div
      className="flex w-full items-start"
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <div className="w-6 shrink-0 overflow-visible pt-1">
        {isEditMode ? (
          <Fade key="trash-icon">
            <IconButton
              disabled={interactionDisabled}
              icon={TrashIcon}
              onClick={() => {
                deleteGoal({ id: goal.id }).catch(handleError);
              }}
              className="-ml-2 text-gray-400"
            />
          </Fade>
        ) : (
          <Fade key="checkbox" className="mt-1">
            <Checkbox
              disabled={interactionDisabled}
              checked={goal.completed}
              onCheckedChange={(newVal) => {
                if (newVal === "indeterminate") return;
                setGoal((o) => (o ? { ...o, completed: newVal } : o));
              }}
            />
          </Fade>
        )}
      </div>
      <button
        onMouseEnter={() => {
          if (!isEditMode) setHoveredGoalId(goal.id);
        }}
        onMouseLeave={() => {
          if (!isEditMode) setHoveredGoalId(null);
        }}
        disabled={interactionDisabled || isEditMode}
        onClick={() => {
          addChild(parentGoalId, goal.id);
          router.push(`/goal/${goal.id}`).catch(handleError);
        }}
        className="flex w-full flex-1 items-center justify-between rounded-sm bg-white/30 px-3 py-2 text-left font-medium transition-all"
      >
        <ReactTextareaAutosize
          disabled={!isEditMode || interactionDisabled}
          minRows={1}
          className={clsx({
            "mr-2 w-full resize-none rounded-sm bg-transparent outline-none":
              true,
            "ring-1 ring-gray-300 focus:ring-gray-500": isEditMode,
            "cursor-pointer": !isEditMode,
          })}
          value={goal.title}
          onChange={(e) => {
            setGoal((o) => (o ? { ...o, title: e.target.value } : o));
          }}
        />

        {isEditMode ? (
          <Bars3Icon
            {...listenersIfNotDisabled}
            className={clsx({
              "h-4 w-4": true,
              "cursor-grab": !interactionDisabled,
              "cursor-not-allowed text-gray-400": interactionDisabled,
            })}
          />
        ) : null}
      </button>
    </div>
  );
}
