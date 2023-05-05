import { useAtom } from "jotai";
import { goalAtom } from "../utils/jotai";
import { type RouterOutputs, api } from "../utils/api";
import { useAutoSave } from "../hooks/useAutosave";
import { useQueryParam } from "../hooks/useQueryParam";
import { CheckIcon } from "@heroicons/react/24/outline";
import router from "next/router";
import { useEffect } from "react";

export function Save() {
  const goalId = useQueryParam("goalId", "string");
  const [goal, setGoal] = useAtom(goalAtom);

  const queryOutput = api.goal.get.useQuery(
    { id: goalId ?? "" },
    {
      enabled: !!goalId,
      refetchOnWindowFocus: false,
    }
  );
  const { mutateAsync: updateGoal, isLoading: saving } =
    api.goal.update.useMutation({});
  const { saved, save } = useAutoSave<RouterOutputs["goal"]["get"]>({
    remoteData: queryOutput.data,
    saveFunction: updateGoal,
    data: goal,
    setData: setGoal,
    shouldSave: (prev, next) => {
      const keys = ["guideMarkdown", "title"] as const;
      return keys.some((key) => prev?.[key] !== next?.[key]);
    },
  });

  useEffect(() => {
    // https://github.com/vercel/next.js/issues/2476#issuecomment-604679740

    const routeChangeStart = (url: string) => {
      if (router.asPath !== url && saved === false) {
        router.events.emit("routeChangeError");

        if (
          !window.confirm(
            "You have unsaved changes. Are you sure you want to leave?"
          )
        ) {
          router.events.emit("routeChangeComplete", url);

          // Following is a hack-ish solution to abort a Next.js route change
          // as there's currently no official API to do so
          // See https://github.com/zeit/next.js/issues/2476#issuecomment-573460710
          // eslint-disable-next-line no-throw-literal
          throw "Abort route change. Please ignore this error.";
        } else {
        }
      }
    };

    /**
     * Returning a string in this function causes there to be a popup when
     * the user tries to unload the page. We only want the popup to show
     * when there are unsaved changes.
     */
    window.onbeforeunload = () => {
      if (!saved) return "Some string";
    };

    router.events.on("routeChangeStart", routeChangeStart);

    return () => {
      router.events.off("routeChangeStart", routeChangeStart);
    };
  }, [saved]);

  return (
    <div className="text-gray-500">
      {saving ? (
        <div>Saving...</div>
      ) : saved ? (
        <div className="flex items-center gap-1">
          Saved <CheckIcon className="h-5 w-5" />
        </div>
      ) : (
        <div>Editing...</div>
      )}
    </div>
  );
}
