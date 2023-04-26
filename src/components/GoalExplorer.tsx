import {
  useSensors,
  useSensor,
  PointerSensor,
  type DragEndEvent,
  closestCenter,
  DndContext,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowUpIcon,
  ChevronDownIcon,
  DocumentIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useClickOutside } from "@mantine/hooks";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import ReactTextareaAutosize from "react-textarea-autosize";
import { utils } from "remarkable/lib";

import { useQueryParam } from "../hooks/useQueryParam";
import { getLexoRankIndexBetween } from "../utils";
import { api } from "../utils/api";
import { handleError } from "../utils/handleError";
import { goalAtom } from "../utils/jotai";
import { useStackStore } from "../utils/zustand/stackStore";
import { Fade } from "./animate/Fade";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./base/Tooltip";
import IconButton from "./IconButton";

interface RenderGoalItemProps {
  goalId: string;
}
function RenderGoalItem(props: RenderGoalItemProps) {
  const { goalId } = props;

  const journeyId = useQueryParam("journeyId", "string");

  const { data: journey } = api.journey.get.useQuery({ id: journeyId ?? "" });

  const [localGoal] = useAtom(goalAtom);
  const { data: remoteGoal } = api.goal.get.useQuery(
    { id: goalId },
    { enabled: localGoal?.id !== goalId }
  );
  const goal = localGoal?.id === remoteGoal?.id ? localGoal : remoteGoal;

  const utils = api.useContext();

  const { data: links } = api.link.getAllUnderGoal.useQuery({
    parentGoalId: goalId,
  });

  const paramGoalId = useQueryParam("goalId", "string");

  const isViewingThisGoal = paramGoalId === goalId;

  // ADDING NEW TO-DOS
  const [newGoal, setNewGoal] = useState("");
  const { mutateAsync: createPrereqs, isLoading: isAdding } =
    api.link.createChildren.useMutation({
      onSuccess(data) {
        // Invalidate links
        utils.link.getAllUnderGoal
          .invalidate({
            parentGoalId: goalId,
          })
          .catch(handleError);
      },
    });

  // REACT DND BELOW
  const sensors = useSensors(useSensor(PointerSensor));

  const linkItemsSortKeys = useMemo(() => {
    return links?.map((link) => link.id) ?? [];
  }, [links]);

  const { mutateAsync: updateLexoRankIndex } = api.link.update.useMutation({
    onMutate: async ({ id, lexoRankIndex }) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      const query = utils.link.getAllUnderGoal;

      await query.cancel({ parentGoalId: goalId });

      // Get the data from the queryCache
      const prevData = query.getData({ parentGoalId: goalId });

      const newLinks =
        prevData
          ?.map((o) => {
            if (o.id === id) {
              return {
                ...o,
                lexoRankIndex: lexoRankIndex ?? o.lexoRankIndex,
              };
            } else {
              return o;
            }
          })
          .sort((a, b) => {
            if (a.lexoRankIndex < b.lexoRankIndex) {
              return -1;
            } else if (a.lexoRankIndex > b.lexoRankIndex) {
              return 1;
            } else {
              return 0;
            }
          }) ?? [];

      query.setData({ parentGoalId: goalId }, (goal) => {
        if (!goal) return goal;
        return newLinks;
      });

      return { prevData };
    },
    onError(err, newPost, ctx) {
      // If the mutation fails, use the context-value from onMutate
      utils.link.getAllUnderGoal.setData(
        { parentGoalId: goalId },
        ctx?.prevData
      );
    },
    onSettled() {
      // Sync with server once mutation has settled
      utils.link.getAllUnderGoal
        .invalidate({ parentGoalId: goalId })
        .catch(handleError);
    },
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!active || !over || !links) {
        return;
      }

      if (active.id !== over.id) {
        const oldIndex = links.findIndex((link) => {
          return link.id === active.id;
        }); // Index that active item is being dragged from
        const newIndex = links.findIndex((link) => {
          return link.id === over.id;
        }); // Index that active item is being dropped into
        const newArray = arrayMove(links, oldIndex, newIndex);

        const beforeNewIndex = newArray[newIndex - 1]?.lexoRankIndex ?? null;
        const afterNewIndex = newArray[newIndex + 1]?.lexoRankIndex ?? null;

        const betweenIndex = getLexoRankIndexBetween(
          beforeNewIndex,
          afterNewIndex
        );

        updateLexoRankIndex({
          id: active.id as string,
          lexoRankIndex: betweenIndex,
        }).catch(handleError);
      }
    },
    [links, updateLexoRankIndex]
  );

  const [expanded, setExpanded] = useState(true);

  const [hovering, setHovering] = useState(false);

  const router = useRouter();

  const [adding, setAdding] = useState(false);
  const addRef = useClickOutside<HTMLTextAreaElement>(() => {
    setAdding(false);
  });
  const handleAddClick = useCallback(() => {
    setAdding(true);
    setExpanded(true);
    addRef.current?.focus();
  }, [addRef]);

  return (
    <div className="flex flex-col">
      <button
        className="relative mb-1 flex w-full items-start gap-0.5 text-black"
        onClick={() => {
          setExpanded((prev) => !prev);
        }}
        onMouseEnter={() => {
          setHovering(true);
        }}
        onMouseLeave={() => {
          setHovering(false);
        }}
      >
        <ChevronDownIcon
          className={clsx({
            "mt-1 h-3 w-3 shrink-0 transition": true,
            "-rotate-90": !expanded,
            "rotate-0": expanded,
          })}
        />
        <TooltipProvider delayDuration={1000}>
          <Tooltip>
            <TooltipTrigger className="flex-1 shrink-0 text-left">
              <div
                className={clsx({
                  "w-full shrink-0 text-left text-sm": true,
                })}
              >
                {goal?.title}
              </div>
            </TooltipTrigger>
            <TooltipContent>{goal?.title}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {hovering && (
          <Fade className="absolute right-0 flex shrink-0 items-center justify-end gap-0.5">
            <button
              className="h-5 w-5 bg-white p-0.5 shadow-sm hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                if (!goal || !journey) return;
                router
                  .push(`/journey/${journey.id}/goal/${goal.id}`)
                  .catch(handleError);
              }}
            >
              <DocumentTextIcon />
            </button>
            <button
              className="h-5 w-5 bg-white p-0.5 shadow-sm hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                handleAddClick();
              }}
            >
              <PlusIcon />
            </button>
            <button
              className="h-5 w-5 bg-white p-0.5 shadow-sm hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                toast.error("Not implemented yet");
              }}
            >
              <TrashIcon className="text-red-800" />
            </button>
          </Fade>
        )}
      </button>
      {expanded && (
        <Fade className="ml-3 flex flex-col">
          {/* {!!links?.length && <div className="h-1"></div>} */}

          {adding && (
            <div className="mb-1 ml-2.5 flex w-full flex-1 items-center justify-between bg-white/30 pl-1 text-left text-sm transition-all">
              <ReactTextareaAutosize
                ref={addRef}
                minRows={1}
                autoFocus
                className={clsx({
                  "resize-none rounded-sm bg-transparent py-0 outline-none":
                    true,
                  "ring-1 ring-gray-300 focus:ring-gray-500": isAdding,
                })}
                placeholder="Name of subgoal"
                value={newGoal}
                onChange={(e) => {
                  setNewGoal(e.target.value);
                }}
              />
              <IconButton
                icon={PlusIcon}
                className="h-5 w-5"
                onClick={() => {
                  if (!goal) return;
                  createPrereqs({
                    parentGoalId: goal.id,
                    goalTitles: [newGoal],
                  }).catch(handleError);
                  setNewGoal("");
                  toast.success("Subgoal created");
                }}
              />
            </div>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={linkItemsSortKeys}
              strategy={verticalListSortingStrategy}
            >
              {links?.map((link) => {
                return <RenderGoalItem key={link.id} goalId={link.childId} />;
              })}
            </SortableContext>
          </DndContext>
        </Fade>
      )}
    </div>
  );
}

export function GoalExplorer() {
  const journeyId = useQueryParam("journeyId", "string");

  const { data } = api.journey.get.useQuery({ id: journeyId ?? "" });

  if (!data) return null;

  return <RenderGoalItem goalId={data.goalId} />;
}
