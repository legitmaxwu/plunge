// Next.js page

import { type NextPage } from "next";
import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type RefObject,
} from "react";

import { useQueryParam } from "../../../../hooks/useQueryParam";
import { api } from "../../../../utils/api";
import {
  ArrowTopRightOnSquareIcon,
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { PencilSquareIcon as SolidPencilSquareIcon } from "@heroicons/react/24/solid";
import IconButton from "../../../../components/IconButton";
import { handleError } from "../../../../utils/handleError";
import clsx from "clsx";
import ReactTextareaAutosize from "react-textarea-autosize";
import { Navbar } from "../../../../components/Navbar";
import { ScrollArea } from "../../../../components/base/ScrollArea";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAtom } from "jotai";
import { useAutoSave } from "../../../../hooks/useAutosave";
import { Textarea } from "../../../../components/base/Textarea";
import { useChatCompletion } from "../../../../hooks/useChatCompletion";
import { useTextSelection } from "@mantine/hooks";
import { Button } from "../../../../components/base/Button";
import {
  goalAtom,
  newGuideAtom,
  loadingAiAtom,
  newPrereqAtom,
} from "../../../../utils/jotai";
import { parseDiff, Diff, Hunk } from "react-diff-view";
import { applyPatch as diffApplyPatch } from "diff";
import { Sparkles } from "../../../../components/Sparkles";
import { GoalExplorer } from "../../../../components/GoalExplorer";
import { Portal } from "@radix-ui/react-portal";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "../../../../components/base/Popover";
import { usePrevious } from "../../../../hooks/usePrevious";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

type ChatBotSubmitEvent = CustomEvent<{ query: string }>;

type CallbackType = (selectedText: string, x: number, y: number) => void;

function useSelection(
  callback: CallbackType,
  targetRef: RefObject<HTMLDivElement>
) {
  useEffect(() => {
    let clickTimeout: NodeJS.Timeout;

    const handleSelection = (e: MouseEvent) => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }

      clickTimeout = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString();

        if (selectedText) {
          const { clientX: x, clientY: y } = e;
          callback(selectedText, x, y);
        }
      }, 250);
    };

    const targetElement = targetRef.current;

    if (targetElement) {
      targetElement.addEventListener("mouseup", handleSelection);
    }

    return () => {
      if (targetElement) {
        targetElement.removeEventListener("mouseup", handleSelection);
      }
    };
  }, [callback, targetRef]);
}

interface TextSelectionMenuProps {
  parentRef: React.RefObject<HTMLDivElement>;
}
const TextSelectionMenu = (props: TextSelectionMenuProps) => {
  const { parentRef } = props;

  const [selectedText, setSelectedText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });

  useSelection((selectedText, left, top) => {
    if (!selectedText.trim()) return;
    setMenuPosition({ left, top });
    setIsOpen(true);
    setSelectedText(selectedText.trim());
  }, parentRef);

  return (
    <Portal>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverAnchor
          style={{
            position: "absolute",
            left: menuPosition.left,
            top: menuPosition.top,
            width: 0,
            height: 0,
            // border: "1px solid red",
            zIndex: 1,
          }}
        />
        {selectedText && (
          <PopoverContent
            className="flex w-64 flex-col py-1"
            side="bottom"
            align="start"
          >
            <div className="flex items-center px-3 py-1 text-xs font-medium">
              <span className="shrink-0">{'"'}</span>
              <span className="max-w-full truncate">{selectedText}</span>
              <span className="shrink-0">{'"'}</span>
            </div>
            <div className="my-1 h-px bg-gray-400/10"></div>
            <button
              className="px-3 py-1 text-left text-xs hover:bg-gray-100"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("chatbotSubmit", {
                    detail: {
                      query: `I don't understand this:\n\n${selectedText}`,
                    },
                  })
                );
                setIsOpen(false);
              }}
            >
              {"I don't understand this"}
            </button>
            <button
              className="px-3 py-1 text-left text-xs hover:bg-gray-100"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("chatbotSubmit", {
                    detail: {
                      query: `I want to study this further:\n\n${selectedText}`,
                    },
                  })
                );
                setIsOpen(false);
              }}
            >
              {"Study this further"}
            </button>
            <button
              className="px-3 py-1 text-left text-xs hover:bg-gray-100"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("chatbotSubmit", {
                    detail: {
                      query: `Can you modify the guide to expand on the area roughly surrounding this text?\n\n${selectedText}`,
                    },
                  })
                );
                setIsOpen(false);
              }}
            >
              Expand Section
            </button>
            <button
              className="px-3 py-1 text-left text-xs hover:bg-gray-100"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("chatbotSubmit", {
                    detail: {
                      query: `> ${selectedText}\n\n`,
                      submit: false,
                    },
                  })
                );
                setIsOpen(false);
              }}
            >
              Quote
            </button>
          </PopoverContent>
        )}
      </Popover>
    </Portal>
  );
};

interface HoverMenuProps {
  children: React.ReactNode;
  innerClassName?: string;
}

function HoverMenu(props: HoverMenuProps) {
  const { children, innerClassName } = props;

  const [hovering, setHovering] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {children}
      <div className="absolute right-full top-0">
        {hovering && (
          <div className={clsx("p-1.5", innerClassName)}>
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function applyPatch(before: string, patchText: string): string {
  return diffApplyPatch(before, patchText, { fuzzFactor: 2 });
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

  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const handleMouseEnter = useCallback(() => {
    if (loadingAi || !newGeneratedGuide) return;

    setNewGuide(newGeneratedGuide);
  }, [loadingAi, newGeneratedGuide, setNewGuide]);

  const handleMouseLeave = useCallback(() => {
    if (loadingAi) return;
    setNewGuide(null);
  }, [loadingAi, setNewGuide]);

  const handleClick = useCallback(() => {
    if (loadingAi) return;

    if (!newGeneratedGuide) return;
    if (alreadyApplied) return;

    // Set goal guide to new guide
    setGoal((goal) => {
      if (!goal) return goal;
      return {
        ...goal,
        guideMarkdown: newGeneratedGuide,
      };
    });
    setAlreadyApplied(true);
    setNewGuide(null);
  }, [alreadyApplied, loadingAi, newGeneratedGuide, setGoal, setNewGuide]);

  const file = files?.[0];

  if (!file) return <div>...</div>;

  // Get the first file from the parsed diff

  const disabled = loadingAi || !newGeneratedGuide || alreadyApplied;

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

function ChatBot() {
  const journeyId = useQueryParam("journeyId", "string");
  const [goal, setGoal] = useAtom(goalAtom);

  const [newPrereq, setNewPrereq] = useAtom(newPrereqAtom);

  const [query, setQuery] = useState<string>("");

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

  const handleSubmit = useCallback(
    (q: string) => {
      setResponse("");
      initiateChatCompletion({
        goal: goal?.title ?? "",
        article: goal?.guideMarkdown ?? "",
        query: q,
      });
    },
    [goal?.guideMarkdown, goal?.title, initiateChatCompletion]
  );

  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleChatbotSubmit = (e: any) => {
      const ev = e as CustomEvent<{ query: string; submit?: boolean }>;
      const query = ev.detail.query;
      const submit = ev.detail.submit ?? true;
      setQuery(query);

      ref.current?.focus();

      if (submit) {
        handleSubmit(query);
      }
    };
    window.addEventListener("chatbotSubmit", handleChatbotSubmit);
    return () => {
      window.removeEventListener("chatbotSubmit", handleChatbotSubmit);
    };
  }, [handleSubmit, setQuery]);

  const util = api.useContext();
  const { mutateAsync: createPrereqs, isLoading } =
    api.link.createChildren.useMutation({
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
      <div className="border border-transparent text-2xl font-bold text-black">
        Ask for help
      </div>
      <div className="h-2"></div>
      <div className="flex flex-wrap items-center gap-2">
        {/* <Button
          size="small"
          onClick={() => {
            setQuery(
              "I don't know where to start. Please help me pick a first step!"
            );
            window.dispatchEvent(
              new CustomEvent("chatbotSubmit", {
                detail: {
                  query:
                    "I don't know where to start. Please help me pick a first step!",
                },
              })
            );
          }}
        >
          {"Don't know where to start"}
        </Button> */}
        <Button
          size="small"
          onClick={() => {
            setQuery(
              "I cannot comprehend the guide. What can I do to obtain the necessary context or knowledge?"
            );
            window.dispatchEvent(
              new CustomEvent("chatbotSubmit", {
                detail: {
                  query:
                    "I cannot comprehend the guide. What can I do to obtain the necessary context or knowledge?",
                },
              })
            );
          }}
        >
          {"I don't understand what the guide is saying"}
        </Button>
      </div>
      <div className="h-2"></div>
      <Textarea
        ref={ref}
        className="w-full text-sm"
        placeholder="Type here…"
        value={query}
        onValueChange={setQuery}
        minRows={3}
      />
      <div className="h-1"></div>
      <Button
        className="w-full"
        disabled={loadingAi}
        onClick={() => {
          handleSubmit(query);
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
                    disabled={isLoading}
                    onClick={() => {
                      createPrereqs({
                        parentGoalId: goal.id,
                        goalTitles: [stripped],
                      })
                        .then((res) => {
                          const link = res[0];
                          if (!link || !journeyId) return;

                          router
                            .push(`/journey/${journeyId}/goal/${link.childId}`)
                            .catch(handleError);
                        })
                        .catch(handleError);
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

  const [newGuide] = useAtom(newGuideAtom);

  /// Text selection menu
  const mdRef = useRef<HTMLDivElement>(null);

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
            className="w-full bg-transparent p-4 font-mono"
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
          <div className="p-4" ref={mdRef}>
            <ReactMarkdown
              className={clsx({
                prose: true,
                "text-gray-400": !goal.guideMarkdown,
              })}
              remarkPlugins={[remarkGfm]}
              components={{
                // li: ({ children, ...props }) => {
                //   return (
                //     <HoverMenu innerClassName="mr-4">
                //       <li {...props}>{children}</li>
                //     </HoverMenu>
                //   );
                // },
                a({ href, children, className, node, ...props }) {
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
              {newGuide ?? (goal.guideMarkdown || "Guide will appear here…")}
            </ReactMarkdown>
          </div>
        )}
      </div>
      <TextSelectionMenu parentRef={mdRef} />
    </div>
  );
}

const GoalPage: NextPage = () => {
  const goalId = useQueryParam("goalId", "string");
  const utils = api.useContext();

  const { mutateAsync: updateGoal } = api.goal.update.useMutation({
    onSuccess: (goal) => {
      toast.success("Saved!");
    },
  });
  const [goal, setGoal] = useAtom(goalAtom);
  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);
  const queryOutput = api.goal.get.useQuery(
    { id: goalId ?? "" },
    {
      // enabled: !loadingAi,
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
  }, [goalId, setNextGuide]);

  if (!goalId) {
    return <div>No goal id</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-r from-pink-200 to-sky-200">
      <Navbar />
      <div className="flex flex-1 justify-center overflow-hidden">
        <div className="h-full w-1/5 max-w-sm shrink-0 p-8">
          <div className="flex items-center">
            <div className="border border-transparent text-2xl font-bold text-black">
              Explorer
            </div>
          </div>
          <div className="h-4"></div>

          <GoalExplorer />
        </div>
        <div className="my-8 w-px bg-black/20"></div>
        <div className="flex h-full w-2/5 flex-col">
          <ScrollArea className="h-full w-full p-8">
            <div className="w-full text-2xl font-bold">
              <ReactTextareaAutosize
                value={goal?.title}
                className={clsx({
                  "mr-2 w-full resize-none rounded-sm border border-transparent bg-transparent outline-none transition hover:border-gray-400":
                    true,
                  "focus:border-black": true,
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
          {/* <ManagePrereqs />
          <div className="h-8"></div> */}
          <ChatBot />
        </ScrollArea>
      </div>
    </div>
  );
};

export default GoalPage;
