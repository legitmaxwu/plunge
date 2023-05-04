import { useAuth } from "@clerk/nextjs";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadingAiAtom } from "../utils/jotai";
import { useRouter } from "next/router";
import { usePrevious } from "./usePrevious";

type UseChatCompletionHook = (props: {
  apiEndpoint: string;
  handleNewToken: (token: string) => void;
  onComplete?: () => void;
}) => {
  initiateChatCompletion: (body: any) => void;
  cancel: () => void;
};

export const useChatCompletion: UseChatCompletionHook = ({
  apiEndpoint,
  handleNewToken,
  onComplete,
}) => {
  const { getToken } = useAuth();
  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);

  const router = useRouter();

  const abortControllerRef = useRef(new AbortController());

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    setLoadingAi(false);
  }, [setLoadingAi]);

  const prevPath = usePrevious(router.asPath);
  useEffect(() => {
    console.log(router.asPath, prevPath);
    if (router.asPath !== prevPath) {
      cancel();
    }
  }, [cancel, prevPath, router.asPath, setLoadingAi]);

  const _generateMd = useCallback(
    async (body: any) => {
      const response = await fetch(apiEndpoint, {
        signal: abortControllerRef.current?.signal,
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
    (body: any) => {
      setLoadingAi(true);
      _generateMd(body).catch((error) => console.error(error));
    },
    [_generateMd, setLoadingAi]
  );

  return useMemo(
    () => ({
      initiateChatCompletion,
      cancel,
    }),
    [cancel, initiateChatCompletion]
  );
};
