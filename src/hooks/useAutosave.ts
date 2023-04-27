// useAutoSave.ts
import { type SetStateAction, useEffect, useMemo, type Dispatch } from "react";
import { useAtom, type PrimitiveAtom } from "jotai";
import debounce from "lodash/debounce";
import { handleError } from "../utils/handleError";
import { api } from "../utils/api";
import { usePrevious } from "./usePrevious";
import { loadingAiAtom } from "../utils/jotai";
import {
  type UseTRPCMutationResult,
  type UseTRPCQueryResult,
} from "@trpc/react-query/shared";
import equal from "fast-deep-equal";

type UseAutoSaveInput<TData> = {
  queryOutput: UseTRPCQueryResult<TData, any>;
  saveFunction: UseTRPCMutationResult<TData, any, any, any>["mutateAsync"];
  data: TData;
  setData: Dispatch<SetStateAction<TData>>;
  saveDebounce?: number;
  shouldSave?: (prev: TData, next: TData) => boolean;
};

// useAutoSave.ts (continued)
export const useAutoSave = <
  TData extends { updatedAt: Date; id: string } | null
>({
  queryOutput,
  saveFunction,
  data,
  setData,
  saveDebounce = 2000,
  shouldSave = function (prev, next) {
    const dataPruned: unknown = prev ? { ...prev, updatedAt: null } : null;
    const remoteDataPruned: unknown = next
      ? { ...next, updatedAt: null }
      : null;

    const dataString = JSON.stringify(dataPruned);
    const remoteDataString = JSON.stringify(remoteDataPruned);
    return dataString !== remoteDataString;
  },
}: UseAutoSaveInput<TData>) => {
  const { data: remoteData, refetch } = queryOutput;

  useEffect(() => {
    if (remoteData) {
      if (
        remoteData.id === data?.id
        // remoteData.updatedAt.getTime() < (data?.updatedAt.getTime() ?? 0)
      ) {
        // Only update the local data if the remote data a different id
        // After first load, the local data serves as the source of truth.
        return;
      }
      setData(remoteData);
    }
  }, [data?.id, data?.updatedAt, remoteData, setData]);

  // Debounce the save function
  const debouncedSave = useMemo(
    () =>
      debounce((data: Partial<TData>) => {
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
