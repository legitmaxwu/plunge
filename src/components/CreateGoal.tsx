import { useMachine } from "@xstate/react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
import { assign, createMachine } from "xstate";
import { Button } from "./base/Button";
import { Textarea } from "./base/Textarea";
import { api } from "../utils/api";
import { handleError } from "../utils/handleError";
import { RenderAIOptions } from "./RenderAIOptions";
import { useQueryParam } from "../hooks/useQueryParam";
import { useStackStore } from "../utils/zustand/stackStore";
import { useAuth } from "@clerk/nextjs";
import { Fade } from "./animate/Fade";
import { useChatCompletion } from "../hooks/useChatCompletion";
import { useAtom } from "jotai";
import { loadingAiAtom } from "../utils/jotai";
import { QUESTIONS } from "../utils/questions";

interface TypingAnimationProps {
  text: string;
  typingSpeed: number;
}

const useTypingAnimation = (props: TypingAnimationProps) => {
  const { text, typingSpeed } = props;

  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prevText) => prevText + text.charAt(index));
        setIndex((prevIndex) => prevIndex + 1);
      }, typingSpeed);

      // Cleanup the timer when the component unmounts
      return () => clearTimeout(timer);
    }
  }, [text, typingSpeed, index]);

  return displayedText;
};

type StepCardProps = {
  children: React.ReactNode;
};

function StepCard(props: StepCardProps) {
  const { children } = props;
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 200 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 200 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-lg"
    >
      {/* <button
        className="mb-0.5 flex w-full items-center gap-0.5 text-black/40 transition hover:text-black/20"
        onClick={() => {
          router.push("/").catch(handleError);
        }}
      >
        <ArrowLeftIcon className="h-3 w-3 cursor-pointer " />
        Home
      </button> */}
      <div className="flex h-full w-full flex-col items-center rounded-md border border-gray-400 bg-white/20 p-12 shadow-md">
        {children}
      </div>
    </motion.div>
  );
}

enum GoalType {
  Document = "document",
  Custom = "custom",
}

type CreateGoalEvent =
  | { type: "SET_GOAL"; value: string }
  | { type: "CHOOSE_DOCUMENT_TYPE" }
  | { type: "CHOOSE_CUSTOM_TYPE" }
  | { type: "REFINE_MORE" };

type CreateGoalContext = {
  goal: string;
  objectives: string[];
};
const createGoalMachine = createMachine<CreateGoalContext, CreateGoalEvent>(
  {
    id: "createGoal",
    initial: "initGoal",
    context: {
      goal: "",
      objectives: [],
    },
    states: {
      initGoal: {
        on: {
          SET_GOAL: {
            target: "refineGoal",
            actions: assign({
              goal: (_, event) => event.value,
            }),
          },
        },
      },
      refineGoal: {
        on: {
          SET_GOAL: {
            target: "finalizeGoal",
            actions: assign({
              goal: (_, event) => event.value,
            }),
          },
        },
      },
      finalizeGoal: {
        on: {
          REFINE_MORE: {
            target: "refineGoal",
          },
        },
      },
    },
  },
  {
    actions: {},
    guards: {},
  }
);

interface InitGoalProps {
  onComplete: (value: string) => void;
}

function InitGoal(props: InitGoalProps) {
  const { onComplete } = props;
  const [goal, setGoal] = useState("");
  const router = useRouter();

  const parentGoalId = useQueryParam("parentGoalId", "string");
  const { data } = api.question.get.useQuery(
    { id: parentGoalId ?? "" },
    { enabled: !!parentGoalId }
  );
  return (
    <StepCard>
      <div className="text-xl">Every plunge starts with a question.</div>
      {parentGoalId && (
        <>
          <div className="h-4"></div>
          <div className="text-sm text-gray-400">
            This goal is a subgoal of:{" "}
            <span className="text-gray-700">{data?.title}</span>
          </div>
        </>
      )}
      <div className="h-8"></div>
      <Textarea
        minRows={1}
        className="w-full"
        placeholder="how do fish breathe underwater?"
        value={goal}
        onValueChange={setGoal}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const processedGoal = goal.trim();
            if (processedGoal) {
              onComplete(processedGoal);
            }
          }
        }}
      />
      <div className="h-8"></div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            // Pick a random question
            const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
            const randomQuestion = QUESTIONS[randomIndex];
            if (!randomQuestion) {
              return;
            }
            if (randomQuestion === goal) {
              const nextRandomIndex = (randomIndex + 1) % QUESTIONS.length;
              const nextRandomQuestion = QUESTIONS[nextRandomIndex];
              if (!nextRandomQuestion) {
                return;
              }
              setGoal(nextRandomQuestion);
            } else {
              setGoal(randomQuestion);
            }
          }}
        >
          {"I'm Feeling Lucky"}
        </Button>
        <Button
          disabled={!goal}
          onClick={() => {
            onComplete(goal);
          }}
        >
          Continue
        </Button>
      </div>
    </StepCard>
  );
}

interface RefineGoalProps {
  currentGoal: string;
  onComplete: (value: string) => void;
}

function RefineGoal(props: RefineGoalProps) {
  const { currentGoal, onComplete } = props;

  const [refineOptions, setRefineOptions] = useState<string[]>([]);

  const parentGoalId = useQueryParam("parentGoalId", "string");

  const { getToken } = useAuth();

  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);
  const [disliked, setDisliked] = useState(false);
  const [comment, setComment] = useState("");

  const handleNewToken = useCallback((newToken: string) => {
    setRefineOptions((prev) => {
      return prev.join("\n").concat(newToken).split("\n");
    });
  }, []);

  const { initiateChatCompletion, cancel } = useChatCompletion({
    apiEndpoint: "/api/ai/refine-goal",
    handleNewToken,
  });

  const getSuggestions = useCallback(
    (goal: string, comments?: string, currentOptions?: string[]) => {
      setRefineOptions([]);
      setDisliked(false);
      setComment("");

      initiateChatCompletion({
        goal,
        comments,
        currentOptions,
      });
    },
    [initiateChatCompletion]
  );
  useEffect(() => {
    getSuggestions(currentGoal);
  }, [currentGoal, getSuggestions]);

  return (
    <StepCard>
      <div className="text-xl">Improve your question.</div>
      <div className="h-8"></div>
      <RenderAIOptions
        options={[currentGoal, ...refineOptions]}
        disabled={loadingAi}
        onOptionSelected={(value) => {
          onComplete(value);
        }}
      />
      {!loadingAi && refineOptions.length !== 0 && (
        <Fade className="flex w-full flex-col items-center">
          <div className="h-6"></div>
          <Button
            variant="ghost"
            onClick={() => {
              setDisliked(true);
            }}
          >
            {"I don't like any of these options."}
          </Button>
          {disliked && (
            <Fade className="flex w-full flex-col items-center">
              <div className="h-4"></div>
              <Textarea
                className="w-full"
                value={comment}
                onValueChange={setComment}
                minRows={2}
                placeholder="Explain why you don't like these options."
              />
              <div className="h-2"></div>
              <Button
                onClick={() => {
                  getSuggestions(currentGoal, comment, refineOptions);
                }}
              >
                Generate new options
              </Button>
            </Fade>
          )}
        </Fade>
      )}
    </StepCard>
  );
}

interface FinalizeGoalProps {
  currentGoal: string;
  onRefineMore: () => void;
  onComplete: () => Promise<any>;
}

function FinalizeGoal(props: FinalizeGoalProps) {
  const { currentGoal, onRefineMore, onComplete } = props;
  const [loading, setLoading] = useState(false);
  return (
    <StepCard>
      <div className="text-xl">{currentGoal}</div>
      <div className="h-8"></div>
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" onClick={onRefineMore}>
          Refine More
        </Button>
        <Button
          loading={loading}
          onClick={() => {
            setLoading(true);
            onComplete().finally(() => {
              setLoading(false);
            });
          }}
        >
          {"Let's Begin!"}
        </Button>
      </div>
    </StepCard>
  );
}

export function CreateGoal() {
  const router = useRouter();
  const [state, send] = useMachine(createGoalMachine);
  const { mutateAsync } = api.plunge.create.useMutation();

  const parentGoalId = useQueryParam("parentGoalId", "string");
  const addChild = useStackStore((state) => state.addChild);
  const init = useStackStore((state) => state.init);

  switch (state.value) {
    case "initGoal":
      return (
        <InitGoal
          onComplete={(value) => {
            send({ type: "SET_GOAL", value });
          }}
        />
      );
    case "refineGoal":
      return (
        <RefineGoal
          currentGoal={state.context.goal}
          onComplete={(newGoal) => {
            send({ type: "SET_GOAL", value: newGoal });
          }}
        />
      );
    case "finalizeGoal":
      return (
        <FinalizeGoal
          currentGoal={state.context.goal}
          onRefineMore={() => {
            send({ type: "REFINE_MORE" });
          }}
          onComplete={async () => {
            return mutateAsync({
              goalTitle: state.context.goal,
            })
              .then((res) => {
                if (parentGoalId) {
                  addChild(parentGoalId, res.id);
                } else {
                  init(res.id);
                }
                router
                  .push(`/plunge/${res.id}/question/${res.goalId}`)
                  .catch(handleError);
              })
              .catch(handleError);
          }}
        />
      );

    default:
      return null;
  }
}
