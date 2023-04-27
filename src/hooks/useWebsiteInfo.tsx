import { useMemo } from "react";
import { functionsApi } from "../utils/functionsApi";

export function useWebsiteInfo(url: string) {
  const { data: faviconAndTitleData } =
    functionsApi.public.fetchFaviconAndTitle.useQuery(
      { url },
      {
        enabled: !!url,
        refetchOnWindowFocus: false,
      }
    );

  const { data: markdownData } = functionsApi.public.fetchMarkdown.useQuery(
    { url },
    { enabled: !!url, refetchOnWindowFocus: false }
  );

  return useMemo(
    () => ({
      faviconUrl: faviconAndTitleData?.faviconUrl,
      title: faviconAndTitleData?.title,
      markdown: markdownData ?? "",
    }),
    [faviconAndTitleData, markdownData]
  );
}
