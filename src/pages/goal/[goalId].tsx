// Next.js page

import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { CSS } from "@dnd-kit/utilities";

import { GoalStack } from "../../components/GoalStack";
import { useQueryParam } from "../../hooks/useQueryParam";
import { api, type RouterOutputs } from "../../utils/api";
import {
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  DocumentPlusIcon,
  LinkIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { PencilSquareIcon as SolidPencilSquareIcon } from "@heroicons/react/24/solid";
import { DocumentPlusIcon as SolidDocumentPlusIcon } from "@heroicons/react/24/solid";
import IconButton from "../../components/IconButton";
import { handleError } from "../../utils/handleError";
import clsx from "clsx";
import { Checkbox } from "../../components/base/Checkbox";
import ReactTextareaAutosize from "react-textarea-autosize";
import { usePrevious } from "../../hooks/usePrevious";
import { useStackStore } from "../../utils/zustand/stackStore";
import { SidePadding } from "../../components/layout/SidePadding";
import { Fade } from "../../components/animate/Fade";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { getLexoRankIndexBetween } from "../../utils";
import { Navbar } from "../../components/Navbar";
import { ScrollArea } from "../../components/base/ScrollArea";

import { type Goal, type Link } from "@prisma/client";
import { useAuth } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { atom, useAtom } from "jotai";
import { useAutoSave } from "../../hooks/useAutosave";
import { Textarea } from "../../components/base/Textarea";
import { useChatCompletion } from "../../hooks/useChatCompletion";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "../../components/base/ContextMenu";
import { useTextSelection } from "@mantine/hooks";
import { Button } from "../../components/base/Button";
import {
  newPrereqAtom,
  goalAtom,
  queryAtom,
  newGuideAtom,
  loadingAiAtom,
} from "../../utils/jotai";
import { parseDiff, Diff, Hunk, type FileData } from "react-diff-view";
import { applyPatch as diffApplyPatch } from "diff";
import { Sparkles } from "../../components/Sparkles";

function applyPatch(before: string, patchText: string): string {
  return diffApplyPatch(before, patchText);
}

interface DiffComponentProps {
  patchString: string;
}

const DiffComponent: React.FC<DiffComponentProps> = ({ patchString }) => {
  // Parse the diff string
  const files = useMemo(() => {
    try {
      return parseDiff(patchString);
    } catch {
      return null;
    }
  }, [patchString]);

  const [goal, setGoal] = useAtom(goalAtom);
  const [newGuide, setNewGuide] = useAtom(newGuideAtom);

  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);

  const newGeneratedGuide = useMemo(() => {
    if (loadingAi) return null;
    try {
      return applyPatch(goal?.guideMarkdown || "", patchString);
    } catch {
      return null;
    }
  }, [goal?.guideMarkdown, loadingAi, patchString]);

  const handleMouseEnter = useCallback(() => {
    if (loadingAi || !newGeneratedGuide) return;

    console.log(patchString);

    setNewGuide(newGeneratedGuide);
  }, [loadingAi, newGeneratedGuide, patchString, setNewGuide]);

  const handleMouseLeave = useCallback(() => {
    if (loadingAi) return;
    setNewGuide(null);
  }, [loadingAi, setNewGuide]);

  const handleClick = useCallback(() => {
    if (loadingAi) return;

    if (!newGeneratedGuide) return;

    // Set goal guide to new guide
    setGoal((goal) => {
      if (!goal) return goal;
      return {
        ...goal,
        guideMarkdown: newGeneratedGuide,
      };
    });
    setNewGuide(null);
  }, [loadingAi, newGeneratedGuide, setGoal, setNewGuide]);

  const file = files?.[0];

  if (!file) return <div>...</div>;

  // Get the first file from the parsed diff

  const disabled = loadingAi || !newGeneratedGuide;

  return (
    <button
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={clsx({
        transition: true,
        "hover:shadow-md hover:brightness-110": !disabled,
        "cursor-not-allowed": disabled,
      })}
    >
      <Diff viewType="unified" diffType={file.type} hunks={file.hunks}>
        {(hunks) =>
          hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
        }
      </Diff>
    </button>
  );
};

interface RenderPrereqProps {
  linkId: string;
  goalId: string;
  parentGoalId: string;
  isEditMode?: boolean;
  interactionDisabled?: boolean;
}

function RenderPrereq(props: RenderPrereqProps) {
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

function ChatBot() {
  const [goal, setGoal] = useAtom(goalAtom);

  const [query, setQuery] = useAtom(queryAtom);

  const [response, setResponse] = useState<string>("");

  const handleNewToken = useCallback((token: string) => {
    setResponse((prev) => `${prev}${token}`);
  }, []);

  const [loadingAi] = useAtom(loadingAiAtom);
  const { initiateChatCompletion } = useChatCompletion(
    "/api/ai/goal-chat",
    handleNewToken
  );

  useEffect(() => {
    // If the goal changes, reset the chatbot
    setResponse("");
    setQuery("");
  }, [goal?.id, setQuery]);

  const util = api.useContext();
  const { mutateAsync: createPrereqs } = api.link.createChildren.useMutation({
    onSuccess(data) {
      // Invalidate links
      util.link.getAllUnderGoal
        .invalidate({
          parentGoalId: goal?.id ?? "",
        })
        .catch(handleError);
    },
  });

  return (
    <div className="h-full w-full">
      <div className="text-2xl font-bold text-black">Ask for help</div>
      <div className="h-2"></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => {
            setQuery(
              "I don't know where to start. Please help me pick a first step!"
            );
          }}
        >
          {"Don't know where to start"}
        </Button>
        <Button
          onClick={() => {
            setQuery(
              "I cannot comprehend the guide. What can I do to obtain the necessary context or knowledge?"
            );
          }}
        >
          {"Cannot comprehend the guide"}
        </Button>
      </div>
      <div className="h-2"></div>
      <Textarea
        className="w-full text-sm"
        placeholder="Type here…"
        value={query}
        onValueChange={setQuery}
        minRows={4}
      />
      <div className="h-1"></div>
      <Button
        className="w-full"
        disabled={loadingAi}
        onClick={() => {
          setResponse("");
          initiateChatCompletion({
            goal: goal?.title ?? "",
            article: goal?.guideMarkdown ?? "",
            query: query,
          });
        }}
      >
        Submit
      </Button>

      <div className="h-4"></div>

      <div className="rounded-sm bg-white/30 px-3 py-2">
        <ReactMarkdown
          className={clsx({
            "prose prose-sm": true,
            "text-gray-400": !response,
          })}
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const language = match?.[1];
              // if (language === "patchfile") {
              //   return (
              //     <PatchViewer
              //       oldString={goal?.guideMarkdown ?? "-"}
              //       patchString={children.join("")}
              //     />
              //   );
              // }
              if (language === "patchfile") {
                // remove "patchfile" from start of string
                const patchString = children
                  .join("")
                  .trim()
                  .replace(/^patchfile/, "")
                  .trim();

                try {
                  // applyPatch(goal?.guideMarkdown ?? "", patchString);
                  return <DiffComponent patchString={patchString} />;
                } catch {}
              }
              return (
                <code {...props} className={className}>
                  {children}
                </code>
              );
            },
            pre({ className, children, ...props }) {
              // // If any children are <code> as a patchfile, then render a div instead
              // const hasPatchfile = children.some((child) => {
              //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              //   if (child?.props?.className === "language-patchfile") {
              //     return true;
              //   }
              //   return false;
              // });
              // if (hasPatchfile) {
              //   return <div className={className}>{children}</div>;
              // }
              return (
                <pre {...props} className={className}>
                  {children}
                </pre>
              );
            },

            p({ className, children, ...props }) {
              // Get text from props.children
              const text = children.join("");
              const isPrereqBlock = text.startsWith("@@@@");

              if (isPrereqBlock) {
                // Strip out all instances of the string "@@@@"
                const stripped = text.replace(/@@@@/g, "");
                if (!goal) return null;
                return (
                  <button
                    className="mb-2 mr-2 block rounded-sm bg-white/40 px-3 py-2 text-left hover:bg-white/50"
                    onClick={() => {
                      createPrereqs({
                        parentGoalId: goal.id,
                        goalTitles: [stripped],
                      }).catch(handleError);
                    }}
                  >
                    {stripped}
                  </button>
                );
              }
              return (
                <p
                  {...props}
                  className={clsx({
                    "text-gray-500": isPrereqBlock,
                    [className as string]: className,
                  })}
                >
                  {children}
                </p>
              );
            },
          }}
        >
          {response || "Response will appear here…"}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function ManageGuide() {
  const [goal, setGoal] = useAtom(goalAtom);

  const selection = useTextSelection();

  const handleNewToken = useCallback(
    (token: string) => {
      setGoal((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          guideMarkdown: `${prev.guideMarkdown ?? ""}${token}`,
        };
      });
    },
    [setGoal]
  );
  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);
  const { initiateChatCompletion } = useChatCompletion(
    "/api/ai/get-goal-guide",
    handleNewToken
  );

  const [isEditing, setIsEditing] = useState(false);

  const [, setQuery] = useAtom(queryAtom);

  const [newGuide] = useAtom(newGuideAtom);

  if (!goal) return null;

  const generateButtonDisabled = !!goal.guideMarkdown || loadingAi;

  return (
    <div className="">
      <div className="flex items-center">
        <div className="text-xl font-bold">Guide</div>
        <div className="ml-2">
          <Sparkles enabled={!generateButtonDisabled}>
            <IconButton
              icon={SparklesIcon}
              disabled={generateButtonDisabled}
              onClick={() => {
                initiateChatCompletion({
                  goal: goal.title,
                });
              }}
              tooltipText="Generate Guide"
            />
          </Sparkles>
        </div>

        <IconButton
          icon={isEditing ? SolidPencilSquareIcon : PencilSquareIcon}
          className={clsx({
            "ml-0.5": true,
            "text-gray-500": !isEditing,
          })}
          tooltipText={isEditing ? "Done Editing" : "Edit"}
          onClick={() => {
            setIsEditing((prev) => !prev);
          }}
        />
      </div>
      <div className="h-4"></div>
      <div
        className={clsx({
          "rounded-sm shadow-sm": true,
          "bg-white/30": !newGuide,
          "bg-blue-50": !!newGuide,
        })}
      >
        {isEditing ? (
          <ReactTextareaAutosize
            className="w-full bg-transparent p-4"
            value={goal.guideMarkdown ?? ""}
            onChange={(e) => {
              setGoal((goal) => {
                if (!goal) return goal;
                return {
                  ...goal,
                  guideMarkdown: e.target.value,
                };
              });
            }}
          />
        ) : (
          <div className="p-4">
            <ContextMenu>
              <ContextMenuTrigger className="">
                <ReactMarkdown
                  className={clsx({
                    prose: true,
                    "text-gray-400": !goal.guideMarkdown,
                  })}
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a({ href, children, className, ...props }) {
                      // make target="_blank" for external links
                      const isExternal = href?.startsWith("http");
                      return (
                        <a
                          {...props}
                          href={href}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          className={clsx(className, "hover:text-gray-500")}
                        >
                          {children}
                          {
                            // add external link icon
                            isExternal && (
                              <ArrowTopRightOnSquareIcon className="mb-1 ml-1 inline h-4 w-4" />
                            )
                          }
                        </a>
                      );
                    },
                  }}
                >
                  {newGuide ??
                    (goal.guideMarkdown || "Guide will appear here…")}
                </ReactMarkdown>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-64">
                <ContextMenuLabel className="flex items-center">
                  <span className="shrink-0">{'"'}</span>
                  <span className="w-full truncate">
                    {selection?.toString()}
                  </span>
                  <span className="shrink-0">{'"'}</span>
                </ContextMenuLabel>

                <ContextMenuItem
                  onClick={() => {
                    setQuery(
                      `I'd like to dive deeper into the following:\n\n${
                        selection?.toString() ?? ""
                      }`
                    );
                  }}
                >
                  Dive deeper
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    setQuery(
                      `Can you modify the guide to elaborate on this?\n\n${
                        selection?.toString() ?? ""
                      }`
                    );
                  }}
                >
                  Elaborate
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    setQuery(
                      `${selection?.toString() ?? ""}\n\nRegarding the above,`
                    );
                  }}
                >
                  Quote
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        )}
      </div>
    </div>
  );
}

function ManagePrereqs() {
  const [goal, setGoal] = useAtom(goalAtom);
  const [newPrereq, setNewPrereq] = useAtom(newPrereqAtom);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const utils = api.useContext();

  const { data: links } = api.link.getAllUnderGoal.useQuery({
    parentGoalId: goal?.id ?? "",
  });

  // ADDING NEW TO-DOS
  const [newGoal, setNewGoal] = useState("");
  const { mutateAsync: createPrereqs } = api.link.createChildren.useMutation({
    onSuccess(data) {
      // Invalidate links
      utils.link.getAllUnderGoal
        .invalidate({
          parentGoalId: goal?.id ?? "",
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

      await query.cancel({ parentGoalId: goal?.id ?? "" });

      // Get the data from the queryCache
      const prevData = query.getData({ parentGoalId: goal?.id ?? "" });

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

      query.setData({ parentGoalId: goal?.id ?? "" }, (goal) => {
        if (!goal) return goal;
        return newLinks;
      });

      return { prevData };
    },
    onError(err, newPost, ctx) {
      // If the mutation fails, use the context-value from onMutate
      utils.link.getAllUnderGoal.setData(
        { parentGoalId: goal?.id ?? "" },
        ctx?.prevData
      );
    },
    onSettled() {
      // Sync with server once mutation has settled
      utils.link.getAllUnderGoal
        .invalidate({ parentGoalId: goal?.id ?? "" })
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

  return (
    <div>
      <div className="flex items-center">
        <div className="text-2xl font-bold">To-do</div>
        <IconButton
          icon={isEditMode ? SolidPencilSquareIcon : PencilSquareIcon}
          className={clsx({
            "ml-1": true,
            "text-gray-500": !isEditMode,
          })}
          tooltipText={isEditMode ? "Done Editing" : "Edit To-dos"}
          onClick={() => {
            setIsEditMode((prev) => !prev);
          }}
        />
        <IconButton
          icon={isAdding ? SolidDocumentPlusIcon : DocumentPlusIcon}
          className={clsx({
            "ml-1": true,
            "text-gray-500": !isAdding,
          })}
          tooltipText={isAdding ? "Done Adding" : "Add To-dos"}
          onClick={() => {
            setIsAdding((prev) => !prev);
          }}
        />
      </div>
      <div className="h-4"></div>
      <div className="flex flex-col gap-2">
        {links?.length === 0 && (
          <div className="text-gray-500">
            No items yet. Try asking for to-do items in the chat below!
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
                <Fade key={link.id}>
                  <RenderPrereq
                    linkId={link.id}
                    goalId={link.childId}
                    parentGoalId={link.parentId}
                    isEditMode={isEditMode}
                  />
                </Fade>
              );
            })}
          </SortableContext>
        </DndContext>
        {isAdding && (
          <div className="pl-6">
            <div className="flex w-full flex-1 items-center justify-between rounded-sm bg-white/30 px-3 py-2 text-left font-medium transition-all">
              <ReactTextareaAutosize
                minRows={1}
                className={clsx({
                  "mr-1 w-full resize-none rounded-sm bg-transparent px-1 outline-none":
                    true,
                  "ring-1 ring-gray-300 focus:ring-gray-500": isAdding,
                })}
                placeholder="Add a to-do"
                value={newGoal}
                onChange={(e) => {
                  setNewGoal(e.target.value);
                }}
              />
              <IconButton
                icon={PlusIcon}
                onClick={() => {
                  if (!goal) return;
                  createPrereqs({
                    parentGoalId: goal.id,
                    goalTitles: [newGoal],
                  }).catch(handleError);
                  setNewGoal("");
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const GoalPage: NextPage = () => {
  const goalId = useQueryParam("goalId", "string");
  const utils = api.useContext();

  const { mutateAsync: updateGoal } = api.goal.update.useMutation({
    async onMutate({ id, title, guideMarkdown }) {
      await utils.goal.get.cancel({ id });
      const previousGoal = utils.goal.get.getData({ id });
      utils.goal.get.setData({ id }, (goal) => {
        if (!goal) return goal;
        return {
          ...goal,
          updatedAt: new Date(),
          title: title ?? goal.title,
          guideMarkdown: guideMarkdown ?? goal.guideMarkdown,
        };
      });
      return { previousGoal };
    },
    onError(err, newPost, ctx) {
      utils.goal.get.setData({ id: newPost.id }, ctx?.previousGoal);
    },
    onSettled() {
      utils.goal.get.invalidate({ id: goalId ?? "" }).catch(handleError);
    },
  });
  const [goal, setGoal] = useAtom(goalAtom);
  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);
  const queryOutput = api.goal.get.useQuery(
    { id: goalId ?? "" },
    {
      enabled: !loadingAi,
      refetchOnWindowFocus: false,
    }
  );
  useAutoSave({
    queryOutput: queryOutput,
    saveFunction: updateGoal,
    data: goal,
    setData: setGoal,
    shouldSave: (prev, next) => {
      const keys = ["guideMarkdown", "title"] as const;
      return keys.some((key) => prev?.[key] !== next?.[key]);
    },
  });

  const [nextGuide, setNextGuide] = useAtom(newGuideAtom);
  useEffect(() => {
    // If the goal changes, reset
    setNextGuide(null);
    queryOutput.refetch().catch(handleError);
  }, [goalId, queryOutput, setGoal, setNextGuide]);

  if (!goalId) {
    return <div>No goal id</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-r from-pink-200 to-sky-200">
      <Navbar />
      <div className="flex flex-1 justify-center overflow-hidden">
        <div className="h-full w-1/5 max-w-sm shrink-0 p-8">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-black">Goals Stack</div>
          </div>
          <div className="h-4"></div>

          <GoalStack />
        </div>
        <div className="my-8 w-px bg-black/20"></div>
        <div className="flex h-full w-2/5 flex-col">
          <ScrollArea className="h-full w-full p-8">
            <div className="w-full text-2xl font-bold">
              <ReactTextareaAutosize
                value={goal?.title}
                className={clsx({
                  "mr-2 w-full resize-none rounded-sm border border-transparent bg-transparent outline-none transition":
                    true,
                  "focus:border-gray-400": true,
                })}
                onChange={(e) => {
                  setGoal((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      title: e.target.value,
                    };
                  });
                }}
              />
            </div>

            <div className="h-8"></div>
            <ManageGuide />
            {/* <div className="h-8"></div>
            <ManagePrereqs /> */}
          </ScrollArea>
        </div>
        <div className="my-8 w-px bg-black/20"></div>
        <ScrollArea className="h-full w-2/5 shrink-0 p-8">
          <ManagePrereqs />
          <div className="h-8"></div>
          <ChatBot />
        </ScrollArea>
      </div>
    </div>
  );
};

export default GoalPage;
