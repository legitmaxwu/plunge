import { useMemo } from "react";
import { api } from "../utils/api";

export function useWebsiteInfo(url: string) {
  const { data: faviconAndTitleData } =
    api.public.fetchFaviconAndTitle.useQuery(
      { url },
      {
        enabled: !!url,
        refetchOnWindowFocus: false,
      }
    );

  const { data: markdownData } = api.public.fetchMarkdown.useQuery(
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
