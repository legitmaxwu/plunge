// useAutoSave.ts
import { type SetStateAction, useEffect, useMemo, type Dispatch } from "react";
import { useAtom, type PrimitiveAtom } from "jotai";
import debounce from "lodash/debounce";
import { handleError } from "../utils/handleError";
import { api } from "../utils/api";
import { usePrevious } from "./usePrevious";
import { loadingAiAtom } from "../utils/jotai";
import { type UseTRPCMutationResult } from "@trpc/react-query/shared";
import equal from "fast-deep-equal";

type UseAutoSaveInput<TData> = {
  remoteData: TData | undefined;
  saveFunction: (data: TData) => Promise<any>;
  data: TData | undefined;
  setData: Dispatch<SetStateAction<TData | undefined>>;
  saveDebounce?: number;
  shouldSave?: (prev: TData, next: TData) => boolean;
};

// useAutoSave.ts (continued)
export const useAutoSave = <TData extends { id: string }>({
  remoteData,
  saveFunction,
  data,
  setData,
  saveDebounce = 2000,
  shouldSave = function (prev, next) {
    return true;
  },
}: UseAutoSaveInput<TData>) => {
  useEffect(() => {
    if (remoteData) {
      if (remoteData.id === data?.id) {
        // Only update the local data if the remote data a different id
        // After first load, the local data serves as the source of truth.
        return;
      }
      setData(remoteData);
    }
  }, [data?.id, remoteData, setData]);

  // Debounce the save function
  const debouncedSave = useMemo(
    () =>
      debounce((data: TData | undefined) => {
        if (!data) return;
        saveFunction(data).catch(handleError);
      }, saveDebounce),
    [saveDebounce, saveFunction]
  );

  const prevData = usePrevious(data);

  useEffect(() => {
    if (equal(data, prevData)) return;

    if (data && remoteData && shouldSave(remoteData, data)) {
      debouncedSave(data);
    }
  }, [data, debouncedSave, prevData, remoteData, shouldSave]);
};
