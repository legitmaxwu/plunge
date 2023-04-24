import { useMachine } from "@xstate/react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { assign, createMachine } from "xstate";
import { Button } from "./base/Button";
import { Textarea } from "./base/Textarea";
import yaml from "js-yaml";
import { api } from "../utils/api";
import { handleError } from "../utils/handleError";
import { RenderAIOptions } from "./RenderAIOptions";
import { useQueryParam } from "../hooks/useQueryParam";
import { useStackStore } from "../utils/zustand/stackStore";
import { useAuth } from "@clerk/nextjs";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 200 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 200 }}
      transition={{ duration: 0.3 }}
      className="flex w-full max-w-lg flex-col items-center rounded-md border border-gray-400 bg-white/20 p-12 shadow-md"
    >
      {children}
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

  const parentGoalId = useQueryParam("parentGoalId", "string");
  const { data } = api.goal.get.useQuery(
    { id: parentGoalId ?? "" },
    { enabled: !!parentGoalId }
  );
  return (
    <StepCard>
      <div className="text-xl">Describe your goal.</div>
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
        placeholder="I would like to learn about X."
        value={goal}
        onValueChange={setGoal}
      />
      <div className="h-8"></div>
      <Button
        disabled={!goal}
        onClick={() => {
          onComplete(goal);
        }}
      >
        Continue
      </Button>
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
  const { data } = api.goal.get.useQuery(
    { id: parentGoalId ?? "" },
    { enabled: !!parentGoalId }
  );

  const { getToken } = useAuth();

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let processedGoal = currentGoal;
    if (data) {
      processedGoal += `\n\nThis goal is a subgoal of: ${data.title}`;
    }

    const abortController = new AbortController();
    const getSuggestions = async () => {
      setRefineOptions([]);
      const response = await fetch("/api/ai/refine-goal", {
        signal: abortController.signal,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await getToken()) ?? ""}`,
        },
        body: JSON.stringify({
          goal: processedGoal,
        }),
      });

      const reader = response.body?.getReader();

      if (!reader) {
        return;
      }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        setRefineOptions((prev) => {
          const newToken = decoder.decode(value);
          return prev.join("\n").concat(newToken).split("\n");
        });
      }
    };

    setLoading(true);
    getSuggestions()
      .catch((err: any) => {
        // Ignore abort errors
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (err?.name !== "AbortError") {
          handleError(err);
        }

        console.log("Aborted");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      abortController.abort();
    };
  }, [currentGoal, data, getToken]);

  return (
    <StepCard>
      <div className="text-xl">Refine your learning goal.</div>
      <div className="h-8"></div>
      <RenderAIOptions
        options={[currentGoal, ...refineOptions]}
        disabled={loading}
        onOptionSelected={(value) => {
          onComplete(value);
        }}
      />
    </StepCard>
  );
}

interface FinalizeGoalProps {
  currentGoal: string;
  onRefineMore: () => void;
  onComplete: () => void;
}

function FinalizeGoal(props: FinalizeGoalProps) {
  const { currentGoal, onRefineMore, onComplete } = props;
  return (
    <StepCard>
      <div className="text-xl">{currentGoal}</div>
      <div className="h-8"></div>
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" onClick={onRefineMore}>
          Refine More
        </Button>
        <Button onClick={onComplete}>Continue</Button>
      </div>
    </StepCard>
  );
}

export function CreateGoal() {
  const router = useRouter();
  const [state, send] = useMachine(createGoalMachine);
  const { mutateAsync } = api.goal.create.useMutation();

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
          onComplete={() => {
            mutateAsync({
              title: state.context.goal,
              parentGoalId: parentGoalId ?? undefined,
            })
              .then((res) => {
                if (parentGoalId) {
                  addChild(parentGoalId, res.id);
                } else {
                  init(res.id);
                }
                router.push(`/goal/${res.id}`).catch((err) => {
                  handleError(err);
                });
              })
              .catch((err) => {
                handleError(err);
              });
          }}
        />
      );

    default:
      return null;
  }
}
