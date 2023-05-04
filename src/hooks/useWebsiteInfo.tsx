import { useMemo } from "react";
import { api } from "../utils/api";

export function useWebsiteInfo(url: string) {
  const { data: faviconAndTitleData, isFetching: fetchingFaviconAndTitle } =
    api.public.fetchFaviconAndTitle.useQuery(
      { url },
      {
        enabled: !!url,
        refetchOnWindowFocus: false,
      }
    );

  const { data: markdownData, isFetching: fetchingMarkdown } =
    api.public.fetchMarkdown.useQuery(
      { url },
      { enabled: !!url, refetchOnWindowFocus: false }
    );

  return useMemo(
    () => ({
      faviconUrl: faviconAndTitleData?.faviconUrl,
      title: faviconAndTitleData?.title,
      markdown: markdownData ?? "",
      fetchingMarkdown,
      fetchingFaviconAndTitle,
    }),
    [
      faviconAndTitleData?.faviconUrl,
      faviconAndTitleData?.title,
      fetchingFaviconAndTitle,
      fetchingMarkdown,
      markdownData,
    ]
  );
}
