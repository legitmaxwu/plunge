// useAutoSave.ts
import {
  type SetStateAction,
  useEffect,
  useMemo,
  type Dispatch,
  useCallback,
  useState,
} from "react";
import { useAtom, type PrimitiveAtom } from "jotai";
import debounce from "lodash/debounce";
import { handleError } from "../utils/handleError";
import { api } from "../utils/api";
import { usePrevious } from "./usePrevious";
import { loadingAiAtom } from "../utils/jotai";
import { type UseTRPCMutationResult } from "@trpc/react-query/shared";
import equal from "fast-deep-equal";

type UseAutoSaveInput<TData> = {
  atom: PrimitiveAtom<TData>;
  saveFunction: (data: TData) => Promise<any>;
};

// useAutoSave.ts (continued)
export const useAutoSaveAtom = <TData extends object>({
  atom,
  saveFunction,
}: UseAutoSaveInput<TData>) => {
  const [data, _setData] = useAtom(atom);

  // Debounce the save function
  const debouncedSave = useMemo(
    () =>
      debounce((data: TData | undefined) => {
        if (!data) return;
        saveFunction(data).catch(handleError);
      }, 1000),
    [saveFunction]
  );

  const setData = useCallback(
    (data: SetStateAction<TData>) => {
      if (typeof data === "function") {
        _setData((prev) => {
          const next = data(prev);
          if (next) {
            debouncedSave(next);
          }
          return next;
        });
      } else {
        _setData(data);
        debouncedSave(data);
      }
    },
    [_setData, debouncedSave]
  );

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (debouncing) return;
  //     if (!doesNotNeedSaving) {
  //       debouncedSave.flush();
  //     }
  //   }, 10000);

  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [debouncedSave, debouncing, doesNotNeedSaving]);

  return useMemo(() => {
    return [data, setData] as const;
  }, [data, setData]);
};
