import { useAuth } from "@clerk/nextjs";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadingAiAtom } from "../utils/jotai";

interface ChatCompletionOptions {
  abortController?: AbortController;
}

type UseChatCompletionHook = (
  apiEndpoint: string,
  handleNewToken: (token: string) => void,
  onComplete?: () => void
) => {
  initiateChatCompletion: (body: any, options?: ChatCompletionOptions) => void;
};

export const useChatCompletion: UseChatCompletionHook = (
  apiEndpoint,
  handleNewToken,
  onComplete
) => {
  const { getToken } = useAuth();
  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);

  const _generateMd = useCallback(
    async (
      body: any,
      { abortController = new AbortController() }: ChatCompletionOptions
    ) => {
      const response = await fetch(apiEndpoint, {
        signal: abortController.signal,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await getToken()) ?? ""}`,
        },
        body: JSON.stringify(body),
      });

      const reader = response.body?.getReader();

      if (!reader) {
        return;
      }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setLoadingAi(false);
          onComplete?.();
          break;
        }

        handleNewToken(decoder.decode(value));
      }
    },
    [apiEndpoint, getToken, handleNewToken, onComplete, setLoadingAi]
  );

  const initiateChatCompletion = useCallback(
    (body: any, options?: ChatCompletionOptions) => {
      setLoadingAi(true);
      _generateMd(body, options ?? {}).catch((error) => console.error(error));
    },
    [_generateMd, setLoadingAi]
  );

  return useMemo(
    () => ({
      initiateChatCompletion,
    }),
    [initiateChatCompletion]
  );
};
