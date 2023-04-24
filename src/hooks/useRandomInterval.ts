import { useCallback, useEffect, useRef } from "react";

// Utility helper for random number generation
const random = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min)) + min;

export const useRandomInterval = (
  callback: () => void,
  minDelay: number | null,
  maxDelay: number | null
): (() => void) => {
  const timeoutId = useRef<number | null>(null);
  const savedCallback = useRef<() => void>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const isEnabled =
      typeof minDelay === "number" && typeof maxDelay === "number";
    if (isEnabled) {
      const handleTick = () => {
        const nextTickAt = random(minDelay, maxDelay);
        timeoutId.current = window.setTimeout(() => {
          savedCallback.current();
          handleTick();
        }, nextTickAt);
      };
      handleTick();
    }
    return () => {
      if (timeoutId.current !== null) {
        window.clearTimeout(timeoutId.current);
      }
    };
  }, [minDelay, maxDelay]);

  const cancel = useCallback(() => {
    if (timeoutId.current !== null) {
      window.clearTimeout(timeoutId.current);
    }
  }, []);

  return cancel;
};
