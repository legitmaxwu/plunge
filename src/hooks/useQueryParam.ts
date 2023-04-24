import { useRouter } from "next/router";

type QueryParamTypeName = "string" | "number";

type QueryParamType<T extends QueryParamTypeName> = T extends "string"
  ? string | null
  : T extends "number"
  ? number | null
  : never;

function parseQueryParamAsString(
  param: string | string[] | undefined
): string | null {
  if (!param) {
    return null;
  } else if (typeof param === "string") {
    return param;
  } else if (param.length) {
    return param.join(",");
  }
  return null;
}

function parseQueryParamAsNumber(
  param: string | string[] | undefined
): number | null {
  if (typeof param === "undefined") {
    return null;
  } else if (typeof param === "string") {
    return parseInt(param);
  } else if (param.length) {
    return null;
  }
  return null;
}

export function useQueryParam<T extends QueryParamTypeName>(
  param: string,
  type: T
): QueryParamType<T> {
  const router = useRouter();
  const queryParam = router.query[param];

  switch (type) {
    case "number":
      return parseQueryParamAsNumber(queryParam) as QueryParamType<T>;
    default:
    case "string":
      return parseQueryParamAsString(queryParam) as QueryParamType<T>;
  }
}
