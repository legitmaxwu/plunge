/* eslint-disable @next/next/no-img-element */

import { type NextPage } from "next";
import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  Fragment,
} from "react";

import { useQueryParam } from "../../../../hooks/useQueryParam";
import { type RouterOutputs, api } from "../../../../utils/api";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { PencilSquareIcon as SolidPencilSquareIcon } from "@heroicons/react/24/solid";
import { IconButton } from "../../../../components/IconButton";
import clsx from "clsx";
import ReactTextareaAutosize from "react-textarea-autosize";
import { Navbar } from "../../../../components/Navbar";
import { ScrollArea } from "../../../../components/base/ScrollArea";

import ReactMarkdown, {
  type Options as ReactMarkdownOptions,
} from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAtom, type PrimitiveAtom } from "jotai";
import { useChatCompletion } from "../../../../hooks/useChatCompletion";
import {
  newGuideAtom,
  loadingAiAtom,
  allQuestionsAtom,
} from "../../../../utils/jotai";
import { Sparkles } from "../../../../components/Sparkles";
import { TextSelectionMenu } from "../../../../components/TextSelectionMenu";
import { Fade } from "../../../../components/animate/Fade";
import Head from "next/head";
import { LocalStorageKey } from "../../../../utils/localstorage";
import { LocalStorage } from "../../../../utils/localstorage";
// import { isSingular } from "pluralize";
import { splitAtom } from "jotai/utils";
import { useAutoSaveAtom } from "../../../../hooks/useAutosaveAtom";
import { RenderLink } from "../../../../components/RenderLink";
import { cn } from "../../../../utils";
import { handleError } from "../../../../utils/handleError";
import { Spinner } from "../../../../components/base/Button";
import { usePrevious } from "../../../../hooks/usePrevious";
import { useClickOutside } from "@mantine/hooks";

interface RenderQuestionProps {
  questionAtom: PrimitiveAtom<RouterOutputs["question"]["get"]>;
  isFirst: boolean;
  isLast: boolean;
}

function RenderQuestion(props: RenderQuestionProps) {
  const { questionAtom, isFirst, isLast } = props;

  const { mutateAsync, isLoading } = api.question.update.useMutation({});
  const [question, setQuestion] = useAutoSaveAtom<
    RouterOutputs["question"]["get"]
  >(
    useMemo(
      () => ({
        atom: questionAtom,
        saveFunction: async (data) => {
          return mutateAsync({
            id: data.id,
            title: data.title ?? undefined,
            guideMarkdown: data.guideMarkdown ?? undefined,
          });
        },
      }),
      [mutateAsync, questionAtom]
    )
  );

  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);
  const handleNewToken = useCallback(
    (token: string) => {
      setQuestion((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          guideMarkdown: `${prev.guideMarkdown ?? ""}${token}`,
        };
      });
    },
    [setQuestion]
  );
  const { initiateChatCompletion } = useChatCompletion({
    apiEndpoint: "/api/ai/get-goal-guide",
    handleNewToken,
  });

  const [isEditing, setIsEditing] = useState(false);

  const [newGuide] = useAtom(newGuideAtom);

  const reactMdOptions: ReactMarkdownOptions["components"] = useMemo(
    () => ({
      a({
        href,
        children,
        className,
        key,
        node,
        sourcePosition,
        index,
        ...props
      }) {
        if (!question.id) return null;
        return (
          <RenderLink
            key={key}
            href={href}
            className={className}
            questionId={question.id}
          >
            {children}
          </RenderLink>
        );
      },
    }),
    [question.id]
  );

  /// Text selection menu
  const mdRef = useRef<HTMLDivElement>(null);

  const generateButtonDisabled =
    !!question.guideMarkdown || loadingAi || !question;

  const notEmpty = isLoading || !!question?.guideMarkdown;
  if (!question) return null;

  return (
    <Fade
      className={cn({
        "h-full w-full": true,
      })}
    >
      <div className="w-full font-bold">
        <ReactTextareaAutosize
          value={question.title ?? ""}
          placeholder="Type question here..."
          className={clsx({
            "-mt-1 w-full resize-none rounded-sm border border-transparent bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 bg-clip-text text-transparent caret-black outline-none transition hover:border-gray-400":
              true,
            "focus:border-black": true,
            "text-2xl": true,
          })}
          onChange={(e) => {
            setQuestion((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                title: e.target.value,
              };
            });
          }}
        />
      </div>

      <div className="">
        <div className="flex items-center">
          <div className="text-lg font-bold text-black/40 saturate-50">
            Answer
          </div>
          <div className="ml-2 flex items-center">
            <Sparkles enabled={!generateButtonDisabled}>
              <IconButton
                icon={notEmpty ? ArrowPathIcon : SparklesIcon}
                onClick={() => {
                  setQuestion((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      guideMarkdown: "",
                    };
                  });
                  initiateChatCompletion({
                    goal: question.title,
                    turboMode: false,
                  });
                }}
                tooltipText={notEmpty ? "Refresh answer" : "Generate answer"}
              />
            </Sparkles>
          </div>

          <IconButton
            icon={isEditing ? SolidPencilSquareIcon : PencilSquareIcon}
            className={clsx({
              "ml-1": true,
              "text-gray-500": !isEditing,
            })}
            tooltipText={isEditing ? "Done Editing" : "Edit Answer"}
            onClick={() => {
              setIsEditing((prev) => !prev);
            }}
          />

          {question.guideMarkdown &&
            LocalStorage.get(LocalStorageKey.HidePromptSelectText) !== true && (
              <Fade className="ml-4 text-sm font-light text-gray-400">
                Try selecting some text!
              </Fade>
            )}
        </div>
        <div className="h-1"></div>
        <div
          className={clsx({
            "rounded-sm shadow-sm": true,
            "bg-white/30": !newGuide,
            "bg-blue-50": !!newGuide,
          })}
        >
          {isEditing ? (
            <ReactTextareaAutosize
              placeholder="Type here..."
              className="w-full resize-none rounded-sm border border-transparent bg-transparent p-4 font-mono transition focus:border-gray-700 focus:outline-none"
              value={question.guideMarkdown ?? ""}
              onChange={(e) => {
                setQuestion((question) => {
                  if (!question) return question;
                  return {
                    ...question,
                    guideMarkdown: e.target.value,
                  };
                });
              }}
            />
          ) : (
            <div className="px-4 py-3" ref={mdRef}>
              <ReactMarkdown
                className={clsx({
                  prose: true,
                  "select-none text-gray-400": !question.guideMarkdown,
                })}
                remarkPlugins={[remarkGfm]}
                components={reactMdOptions}
              >
                {newGuide ??
                  (question.guideMarkdown ||
                    "Click the sparkle icon to generate an article!")}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <TextSelectionMenu parentRef={mdRef} />
      </div>
    </Fade>
  );
}

interface AddQuestionProps {
  parentQuestionAtom: PrimitiveAtom<RouterOutputs["question"]["get"]>;
  index: number;
}
function AddQuestion(props: AddQuestionProps) {
  const { parentQuestionAtom, index } = props;

  const [activated, setActivated] = useState(false);

  const ref = useClickOutside(() => {
    setActivated(false);
  });
  const [parentQuestion] = useAtom(parentQuestionAtom);

  const [allQuestions, setAllQuestions] = useAtom(allQuestionsAtom);

  const nextQuestionId = allQuestions[index + 1]?.id;

  const utils = api.useContext();

  const { mutateAsync: createQuestion, isLoading: loadingCreateQuestion } =
    api.link.createChildren.useMutation({
      onSuccess(res) {
        const nextQuestion = res[0];
        if (!nextQuestion) return;
        setAllQuestions((prev) => {
          if (!prev) return [nextQuestion];
          const modified = prev.map((q) => {
            if (q.id === parentQuestion.id) {
              return q;
            }
            return q;
          });
          return [...modified, nextQuestion];
        });
      },
    });

  const { data: linkChildren } = api.link.getAllUnderQuestion.useQuery(
    { parentQuestionId: parentQuestion?.id ?? "" },
    { enabled: !!parentQuestion.id && activated }
  );

  const [loadingGetChildren, setLoadingGetChildren] = useState(false);

  const handleNewQuestion = useCallback(
    (newQTitle: string) => {
      setActivated(false);

      // Remove all questions after parent question
      setAllQuestions((prev) => {
        if (!prev) return prev;
        return prev.slice(0, index + 1);
      });
      createQuestion({
        parentQuestionId: parentQuestion.id,
        questionTitles: [newQTitle],
      }).catch(handleError);
    },
    [createQuestion, index, parentQuestion.id, setAllQuestions]
  );

  const handlePlunge = useCallback(
    (e: any) => {
      const ev = e as CustomEvent<{ newQuestion: string }>;
      handleNewQuestion(ev.detail.newQuestion);
    },
    [handleNewQuestion]
  );

  const handleSwitchChild = useCallback(
    (newChildId: string) => {
      setActivated(false);

      // Remove all questions after parent question
      setAllQuestions((prev) => {
        if (!prev) return prev;
        return prev.slice(0, index + 1);
      });

      setLoadingGetChildren(true);
      utils.question.getQuestionPath
        .fetch({
          topQuestionId: newChildId,
        })
        .then((res) => {
          setAllQuestions((prev) => {
            if (!prev) return prev;
            return [...prev, ...res];
          });
        })
        .catch(handleError)
        .finally(() => {
          setLoadingGetChildren(false);
        });
    },
    [index, setAllQuestions, utils.question.getQuestionPath]
  );

  const eventId = `plunge-${parentQuestion.id}`;

  useEffect(() => {
    console.log(allQuestions);
  }, [allQuestions]);

  useEffect(() => {
    window.addEventListener(eventId, handlePlunge);
    return () => {
      window.removeEventListener(eventId, handlePlunge);
    };
  }, [eventId, handlePlunge]);

  const isLoading = loadingCreateQuestion || loadingGetChildren;

  return (
    <div className="mt-4 flex flex-col items-center" ref={ref}>
      <div className="flex w-full flex-col items-center">
        {isLoading ? (
          <div className="flex min-h-screen w-full flex-col items-center text-gray-400">
            <div className="flex items-center gap-2">
              <Spinner />
              <div>Loading...</div>
            </div>
          </div>
        ) : !activated ? (
          <IconButton
            icon={PlusIcon}
            className="p-1.5"
            onClick={() => {
              // handleNewQuestion("");
              setActivated(true);
            }}
          />
        ) : (
          <Fade className="flex w-full flex-col gap-2">
            <button
              className={cn(
                "flex w-full items-center justify-between gap-2 bg-white/20 px-4 py-1.5 font-bold text-sky-700 transition hover:bg-white/30"
              )}
              onClick={() => {
                handleNewQuestion("");
              }}
            >
              <div className="flex-1 text-left">Add new question</div>
              <PlusIcon className="h-4 w-4 shrink-0 stroke-2"></PlusIcon>
            </button>
            {linkChildren?.map(({ questions: childQuestion }) => {
              if (childQuestion.id === nextQuestionId) return null;
              return (
                <button
                  key={childQuestion.id}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 bg-white/20 px-4 py-1.5 text-black transition hover:bg-white/30",
                    {
                      "text-gray-500": !childQuestion.title,
                    }
                  )}
                  onClick={() => {
                    if (!childQuestion.id) return;
                    handleSwitchChild(childQuestion.id);
                  }}
                >
                  <div className="flex-1 text-left">
                    {childQuestion.title || "Untitled question"}
                  </div>
                  <ArrowRightIcon className="h-4 w-4 shrink-0 "></ArrowRightIcon>
                </button>
              );
            })}
          </Fade>
        )}
      </div>
    </div>
  );
}

const GoalPage: NextPage = () => {
  const questionId = useQueryParam("questionId", "string");
  const plungeId = useQueryParam("plungeId", "string");

  const [, setAllQuestions] = useAtom(allQuestionsAtom);
  api.question.getQuestionPath.useQuery(
    { topQuestionId: questionId ?? "" },
    {
      enabled: !!questionId,
      refetchOnWindowFocus: false,
      onSuccess(res) {
        setAllQuestions(res);
      },
    }
  );

  const questionAtomsAtom = useMemo(() => {
    return splitAtom(allQuestionsAtom);
  }, []);

  const [questionAtoms, dispatch] = useAtom(questionAtomsAtom);

  const { data: plunge } = api.plunge.get.useQuery(
    { id: plungeId ?? "" },
    { enabled: !!plungeId }
  );

  const bottomDivRef = useRef<HTMLDivElement>(null);
  const handleScrollBottomEvent = useCallback(() => {
    bottomDivRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const questionAtomsLength = questionAtoms?.length ?? 0;
  const previousQuestionAtomsLength = usePrevious(questionAtomsLength);
  useEffect(() => {
    if (
      previousQuestionAtomsLength === undefined ||
      previousQuestionAtomsLength === 0
    )
      return;

    if (questionAtomsLength > previousQuestionAtomsLength) {
      handleScrollBottomEvent();
    }
  }, [
    handleScrollBottomEvent,
    previousQuestionAtomsLength,
    questionAtoms,
    questionAtomsLength,
  ]);
  // useEffect(() => {
  //   window.addEventListener("scroll-bottom", handleScrollBottomEvent);
  //   return () => {
  //     window.removeEventListener("scroll-bottom", handleScrollBottomEvent);
  //   };
  // }, [handleScrollBottomEvent]);

  if (!questionId) {
    return <div>No goal id</div>;
  }

  return (
    <>
      <Head>
        <title>Plunge - {plunge?.question.title}</title>
      </Head>

      <div className="flex h-screen flex-col items-center bg-gradient-to-r from-sky-200 to-blue-200">
        <Navbar />

        <ScrollArea className="flex h-full w-full flex-1 flex-col items-center">
          <div className="mx-auto flex w-full max-w-xl flex-col items-center px-2 md:px-8">
            <div className="flex flex-col">
              {questionAtoms?.map((questionAtom, idx) => {
                const isLast = idx === questionAtoms.length - 1;
                return (
                  <div
                    className={cn({
                      "flex flex-col gap-2": true,
                      "pb-24": isLast,
                    })}
                    key={idx}
                    style={{
                      minHeight: isLast ? "calc(100vh - 3.5rem)" : undefined,
                    }}
                  >
                    <div
                      className="h-4"
                      ref={isLast ? bottomDivRef : null}
                    ></div>
                    <RenderQuestion
                      isFirst={idx === 0}
                      isLast={isLast}
                      questionAtom={questionAtom}
                    />
                    <AddQuestion
                      parentQuestionAtom={questionAtom}
                      index={idx}
                    />
                  </div>
                );
              })}
              {/* {lastAtom && (
              <div
                style={{
                  minHeight: "calc(100vh - 3.5rem - 2rem)",
                }}
                className="flex shrink-0 flex-col gap-8 pb-24"
              >
                <RenderQuestion
                  isFirst={questionAtoms.length === 1}
                  isLast={true}
                  questionAtom={lastAtom}
                />
                <AddQuestion
                  parentQuestionAtom={lastAtom}
                  index={questionAtoms.length - 1}
                />
              </div>
            )} */}
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default GoalPage;
