import { useAuth } from "@clerk/nextjs";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { loadingAiAtom } from "../utils/jotai";
import { usePrevious } from "./usePrevious";

type UseChatCompletionHook = (
  apiEndpoint: string,
  handleNewToken: (token: string) => void,
  onComplete?: () => void
) => {
  initiateChatCompletion: (body: any) => void;
};

export const useChatCompletion: UseChatCompletionHook = (
  apiEndpoint,
  handleNewToken,
  onComplete
) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);

  const _generateMd = useCallback(
    async (body: any) => {
      const response = await fetch(apiEndpoint, {
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
          onComplete?.();
          break;
        }

        handleNewToken(decoder.decode(value));
      }
    },
    [apiEndpoint, getToken, handleNewToken, onComplete]
  );

  const prevLoading = usePrevious(loading);
  useEffect(() => {
    if (prevLoading && !loading) {
      setLoadingAi(false);
    }
  }, [loading, prevLoading, setLoadingAi]);

  const initiateChatCompletion = useCallback(
    (body: any) => {
      setLoading(true);
      setLoadingAi(true);
      _generateMd(body)
        .catch((error) => console.error(error))
        .finally(() => {
          setLoading(false);
        });
    },
    [_generateMd, setLoadingAi]
  );

  return useMemo(() => ({ initiateChatCompletion }), [initiateChatCompletion]);
};
