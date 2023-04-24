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

type UseAutoSaveInput<TData> = {
  queryOutput: UseTRPCQueryResult<TData, any>;
  saveFunction: UseTRPCMutationResult<TData, any, any, any>["mutateAsync"];
  data: TData;
  setData: Dispatch<SetStateAction<TData>>;
  saveDebounce?: number;
  shouldSave?: (prev: TData, next: TData) => boolean;
};

// useAutoSave.ts (continued)
export const useAutoSave = <TData extends { updatedAt: Date } | null>({
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

  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);
  useEffect(() => {
    if (remoteData) {
      if (!data || remoteData.updatedAt.getTime() > data.updatedAt.getTime()) {
        setData(remoteData);
      }
    }
  }, [data, remoteData, setData]);

  // Debounce the save function
  const debouncedSave = useMemo(
    () =>
      debounce((data: Partial<TData>) => {
        saveFunction(data).catch(handleError);
      }, saveDebounce),
    [saveDebounce, saveFunction]
  );

  const dataJson = useMemo(() => JSON.stringify(data), [data]);
  const prevDataJson = usePrevious(dataJson);

  useEffect(() => {
    if (dataJson === prevDataJson) return;
    // if (loadingAi) return;

    if (data && remoteData && shouldSave(remoteData, data)) {
      debouncedSave(data);
    }
  }, [
    data,
    dataJson,
    debouncedSave,
    loadingAi,
    prevDataJson,
    remoteData,
    shouldSave,
  ]);
};
