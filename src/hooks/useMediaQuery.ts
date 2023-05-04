"use client";

import { useState, useEffect, useRef } from "react";

import tailwindConfig from "../../tailwind.config";

const theme = tailwindConfig.theme;

export interface UseMediaQueryOptions {
  getInitialValueInEffect: boolean;
}

type MediaQueryCallback = (event: { matches: boolean; media: string }) => void;

/**
 * Older versions of Safari (shipped withCatalina and before) do not support addEventListener on matchMedia
 * https://stackoverflow.com/questions/56466261/matchmedia-addlistener-marked-as-deprecated-addeventlistener-equivalent
 * */
function attachMediaListener(
  query: MediaQueryList,
  callback: MediaQueryCallback
) {
  try {
    query.addEventListener("change", callback);
    return () => query.removeEventListener("change", callback);
  } catch (e) {
    query.addListener(callback);
    return () => query.removeListener(callback);
  }
}

function getInitialValue(query: string, initialValue?: boolean) {
  if (typeof initialValue === "boolean") {
    return initialValue;
  }

  if (typeof window !== "undefined" && "matchMedia" in window) {
    return window.matchMedia(query).matches;
  }

  return false;
}

type BreakpointSize = "sm" | "md" | "lg" | "xl" | "2xl";

function getScreenSize(size: BreakpointSize) {
  return theme.screens[size];
}

interface MediaQueryProps {
  showIfBiggerThan?: BreakpointSize;
  showIfSmallerThan?: BreakpointSize;
}

function generateQueryString(props: MediaQueryProps) {
  const queries: string[] = [];
  if (props.showIfBiggerThan) {
    queries.push(`(min-width: ${getScreenSize(props.showIfBiggerThan)})`);
  }
  if (props.showIfSmallerThan) {
    queries.push(`(max-width: ${getScreenSize(props.showIfSmallerThan)})`);
  }
  return queries.join(" and ");
}

export function useMediaQuery(
  props: MediaQueryProps,
  initialValue?: boolean,
  { getInitialValueInEffect }: UseMediaQueryOptions = {
    getInitialValueInEffect: true,
  }
) {
  const query = generateQueryString(props);

  const [matches, setMatches] = useState(
    getInitialValueInEffect ? getInitialValue(query, initialValue) : false
  );
  const queryRef = useRef<MediaQueryList>();

  useEffect(() => {
    if ("matchMedia" in window) {
      queryRef.current = window.matchMedia(query);
      setMatches(queryRef.current.matches);
      return attachMediaListener(queryRef.current, (event) =>
        setMatches(event.matches)
      );
    }
  }, [query]);

  return matches;
}
