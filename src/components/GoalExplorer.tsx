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
import { goalAtom, newSubgoalAtom } from "../utils/jotai";
import { useStackStore } from "../utils/zustand/stackStore";
import { Fade } from "./animate/Fade";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./base/Tooltip";
import { IconButton } from "./IconButton";
import { SmallIconButton } from "./SmallIconButton";

interface RenderGoalItemProps {
  goalId: string;
  parentGoalId?: string;
}
function RenderGoalItem(props: RenderGoalItemProps) {
  const { goalId, parentGoalId } = props;

  const journeyId = useQueryParam("journeyId", "string");
  const router = useRouter();

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

  const [newSubgoal, setNewSubgoal] = useAtom(newSubgoalAtom);

  // ADDING NEW SUBGOALS
  const [newGoal, setNewGoal] = useState("");
  const { mutateAsync: createSubgoal, isLoading: createSubgoalLoading } =
    api.link.createChildren.useMutation({});

  const handleCreateSubgoal = useCallback(() => {
    const trimmed = newGoal.trim();
    const processed = trimmed || "Untitled";

    toast
      .promise(
        createSubgoal({
          parentGoalId: goalId,
          goalTitles: [processed],
        }).then(async (res) => {
          await utils.link.getAllUnderGoal.invalidate({
            parentGoalId: goalId,
          });
          setNewGoal("");
          setAdding(false);
          if (res[0] && journeyId) {
            router
              .push(`/journey/${journeyId}/goal/${res[0]?.goalId}`)
              .catch(handleError);
          }
        }),
        {
          loading: "Creating question...",
          success: "Question created!",
          error: "Error creating question.",
        }
      )
      .catch(handleError);
  }, [
    newGoal,
    createSubgoal,
    goalId,
    utils.link.getAllUnderGoal,
    journeyId,
    router,
  ]);

  // DELETING SUBGOALS
  const { mutateAsync: deleteGoal } = api.goal.delete.useMutation({});

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

      const newLinks = prevData;
      // ?.map((o) => {
      //   if (o.id === id) {
      //     return {
      //       ...o,
      //       lexoRankIndex: lexoRankIndex ?? o.lexoRankIndex,
      //     };
      //   } else {
      //     return o;
      //   }
      // })
      // .sort((a, b) => {
      //   if (a.lexoRankIndex < b.lexoRankIndex) {
      //     return -1;
      //   } else if (a.lexoRankIndex > b.lexoRankIndex) {
      //     return 1;
      //   } else {
      //     return 0;
      //   }
      // }) ?? [];

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

  const [adding, setAdding] = useState(false);
  const addRef = useClickOutside<HTMLTextAreaElement>(() => {
    setAdding(false);
    setNewGoal("");
  });

  const handleAddClick = useCallback(
    (newGoal?: string) => {
      setAdding(true);
      setExpanded(true);
      if (newGoal) {
        setNewGoal(newGoal);
      }
      addRef.current?.focus();
    },
    [addRef]
  );

  useEffect(() => {
    const handleAddEvent = (e: any) => {
      const ev = e as CustomEvent<{ subgoal: string; parentGoalId: string }>;
      const subgoal = ev.detail.subgoal;
      const parentGoalId = ev.detail.parentGoalId;

      if (parentGoalId !== goalId) {
        return;
      }

      if (subgoal) {
        handleAddClick(subgoal);
        setNewSubgoal(null);
      }
    };
    window.addEventListener("explorerAdd", handleAddEvent);
    return () => {
      window.removeEventListener("explorerAdd", handleAddEvent);
    };
  }, [goalId, handleAddClick, setNewSubgoal]);

  // const highlightNewSubgoal = isViewingThisGoal && !!newSubgoal;
  const highlightNewSubgoal = false; // This is for the new subgoal textarea
  const showNewSubgoal = !!newSubgoal && goalId === newSubgoal.parentGoalId;

  if (!goal) {
    return null;
  }

  return (
    <Fade className="flex flex-col">
      <div
        className="relative mb-1 flex w-full items-start gap-0.5 text-black"
        onMouseEnter={() => {
          setHovering(true);
        }}
        onMouseLeave={() => {
          setHovering(false);
        }}
      >
        <button
          onClick={() => {
            setExpanded((prev) => !prev);
          }}
        >
          <ChevronDownIcon
            className={clsx({
              "mt-1 h-3 w-3 shrink-0 transition": true,
              "-rotate-90": !expanded,
              "rotate-0": expanded,
            })}
          />
        </button>
        <button
          className={clsx({
            "w-full flex-1 shrink-0 text-left": true,
            "hover:text-gray-700": !isViewingThisGoal,
            "font-semibold": isViewingThisGoal,
          })}
          onClick={(e) => {
            e.stopPropagation();
            if (!goal || !journey) return;
            router
              .push(`/journey/${journey.id}/goal/${goal.id}`)
              .catch(handleError);
          }}
        >
          {goal?.title}
        </button>
        {hovering && (
          <Fade className="absolute right-0 flex shrink-0 items-center justify-end gap-0.5">
            {/* <button
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
            </button> */}

            <SmallIconButton
              tooltipText="Add question"
              icon={PlusIcon}
              onMouseEnter={() => {
                setNewSubgoal({
                  parentGoalId: goalId,
                  subgoalTitle: "Untitled",
                });
              }}
              onMouseLeave={() => {
                setNewSubgoal(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                // handleAddClick();
                handleCreateSubgoal();
              }}
            />
            {!isViewingThisGoal && (
              <SmallIconButton
                icon={TrashIcon}
                tooltipText="Delete question"
                className="text-red-800"
                onClick={(e) => {
                  e.stopPropagation();
                  toast
                    .promise(
                      deleteGoal({
                        id: goalId,
                      }).then(async () => {
                        if (parentGoalId)
                          await utils.link.getAllUnderGoal.invalidate({
                            parentGoalId: parentGoalId,
                          });
                      }),
                      {
                        loading: "Deleting question...",
                        success: "Question deleted.",
                        error: "Error deleting question.  ",
                      }
                    )
                    .catch(handleError);
                }}
              />
            )}
          </Fade>
        )}
      </div>
      {expanded && (
        <Fade
          className={clsx({
            "ml-1.5 flex flex-col border-l pl-1.5": true,
            "border-black/10": !isViewingThisGoal,
            "border-black/30": isViewingThisGoal,
          })}
        >
          {/* {!!links?.length && <div className="h-1"></div>} */}
          {(highlightNewSubgoal || adding) && (
            <div
              className={clsx(
                {
                  "mb-1 ml-2.5 flex items-center justify-between pl-1 text-left":
                    true,
                  "bg-white/30": !highlightNewSubgoal,
                  "bg-blue-50": highlightNewSubgoal,
                },
                {
                  "bg-gray-200": createSubgoalLoading,
                }
              )}
            >
              <ReactTextareaAutosize
                ref={addRef}
                minRows={1}
                autoFocus
                disabled={highlightNewSubgoal || createSubgoalLoading}
                className={clsx({
                  "w-full resize-none rounded-sm bg-transparent py-0 outline-none":
                    true,
                  // "bg-blue-50": isViewingThisGoal && !!newSubgoal,
                })}
                placeholder="Type question..."
                value={
                  highlightNewSubgoal ? newSubgoal?.subgoalTitle ?? "" : newGoal
                }
                onChange={(e) => {
                  setNewGoal(e.target.value);
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateSubgoal();
                  }
                }}
              />
              <IconButton
                icon={PlusIcon}
                className="h-5 w-5 shrink-0"
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateSubgoal();
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
                return (
                  <RenderGoalItem
                    key={link.id}
                    goalId={link.childId}
                    parentGoalId={goalId}
                  />
                );
              })}
              {showNewSubgoal && (
                <Fade className="my-1 ml-2.5 bg-white/30 px-1">
                  {newSubgoal?.subgoalTitle}
                </Fade>
              )}
            </SortableContext>
          </DndContext>
        </Fade>
      )}
    </Fade>
  );
}

export function GoalExplorer() {
  const journeyId = useQueryParam("journeyId", "string");

  const { data } = api.journey.get.useQuery({ id: journeyId ?? "" });

  if (!data)
    return (
      <div className="w-1/2 animate-pulse rounded-sm bg-black/5">&nbsp;</div>
    );

  return <RenderGoalItem goalId={data.goalId} />;
}
