import { useEffect, useState, useCallback, useRef } from "react";
import { useQueryParam } from "../../hooks/useQueryParam";
import { api } from "../../utils/api";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAtom } from "jotai";
import { Textarea } from "../base/Textarea";
import { useChatCompletion } from "../../hooks/useChatCompletion";
import { Button } from "../base/Button";
import {
  goalAtom,
  loadingAiAtom,
  newSubgoalAtom,
  turboModeAtom,
} from "../../utils/jotai";
import { useRouter } from "next/router";
import { type ReactMarkdownOptions } from "react-markdown/lib/react-markdown";
import { DiffComponent } from "./DiffComponent";
import { NewSubgoalButton } from "../NewSubgoalButton";

const chatBotMarkdownOptions: ReactMarkdownOptions["components"] = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const language = match?.[1];
    if (language === "patchfile") {
      // remove "patchfile" from start of string
      const patchString = children
        .join("")
        .trim()
        .replace(/^patchfile/, "")
        .trim();

      try {
        return <DiffComponent key={props.key} patchString={patchString} />;
      } catch {}
    }
    return (
      <code {...props} className={className}>
        {children}
      </code>
    );
  },
  pre({ className, children, ...props }) {
    return (
      <pre {...props} className={className}>
        {children}
      </pre>
    );
  },

  li({ className, children, ...props }) {
    // Get text from props.children
    const text = children?.join("") ?? "";
    const isPrereqBlock = text.startsWith("҂");

    if (isPrereqBlock) {
      // Strip out all instances of the string "҂"
      const stripped = text.replace(/҂/g, "");

      return <NewSubgoalButton subgoal={stripped}></NewSubgoalButton>;
    }
    return (
      <li {...props} className={className}>
        {children}
      </li>
    );
  },
};

export function ChatBot() {
  const [goal, setGoal] = useAtom(goalAtom);

  const [query, setQuery] = useState<string>("");

  const [response, setResponse] = useState<string>("");

  const handleNewToken = useCallback((token: string) => {
    setResponse((prev) => `${prev}${token}`);
  }, []);

  const [loadingAi] = useAtom(loadingAiAtom);
  const { initiateChatCompletion } = useChatCompletion({
    apiEndpoint: "/api/ai/goal-chat",
    handleNewToken,
  });

  useEffect(() => {
    // If the goal changes, reset the chatbot
    setResponse("");
    setQuery("");
  }, [goal?.id, setQuery]);

  const [turboMode] = useAtom(turboModeAtom);
  const handleSubmit = useCallback(
    (q: string) => {
      setResponse("");
      initiateChatCompletion({
        goal: goal?.title ?? "",
        article: goal?.guideMarkdown ?? "",
        query: q,
        turboMode,
      });
    },
    [goal?.guideMarkdown, goal?.title, initiateChatCompletion, turboMode]
  );

  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleChatbotSubmit = (e: any) => {
      const ev = e as CustomEvent<{ query: string; submit?: boolean }>;
      const query = ev.detail.query;
      const submit = ev.detail.submit ?? true;
      setQuery(query);

      if (submit) {
        handleSubmit(query);
      } else {
        ref.current?.focus();
      }
    };
    window.addEventListener("chatbotSubmit", handleChatbotSubmit);
    return () => {
      window.removeEventListener("chatbotSubmit", handleChatbotSubmit);
    };
  }, [handleSubmit, setQuery]);

  const util = api.useContext();

  return (
    <div className="h-full w-full">
      <div className="border border-transparent text-2xl font-bold text-black">
        Inquire
      </div>
      <div className="h-4"></div>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          size="small"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("chatbotSubmit", {
                detail: {
                  query:
                    "I cannot comprehend the article. What are some questions I can ask to obtain the necessary context or knowledge?",
                },
              })
            );
          }}
        >
          {"I can't comprehend the article"}
        </Button>
        <Button
          size="small"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("chatbotSubmit", {
                detail: {
                  query:
                    "What are some interesting questions stemming from this article?",
                },
              })
            );
          }}
        >
          {"Inspire me"}
        </Button>
      </div>
      <div className="h-1"></div>
      <Textarea
        ref={ref}
        className="w-full"
        placeholder="Type here…"
        value={query}
        onValueChange={setQuery}
        minRows={3}
      />

      <div className="h-2"></div>
      <Button
        className="w-full"
        loading={loadingAi}
        onClick={() => {
          handleSubmit(query);
        }}
      >
        Submit
      </Button>

      <div className="h-8"></div>

      <div className="rounded-sm bg-white/30 px-3 py-2">
        <ReactMarkdown
          className={clsx({
            prose: true,
            "text-gray-400": !response,
          })}
          remarkPlugins={[remarkGfm]}
          components={chatBotMarkdownOptions}
        >
          {response || "Response will appear here…"}
        </ReactMarkdown>
      </div>
    </div>
  );
}
