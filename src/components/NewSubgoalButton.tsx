import { useCallback, type MouseEvent } from "react";
import { useQueryParam } from "../hooks/useQueryParam";
import { api } from "../utils/api";
import { handleError } from "../utils/handleError";
import clsx from "clsx";
import { useAtom } from "jotai";
import { Spinner } from "./base/Button";
import { loadingAiAtom, newSubgoalAtom } from "../utils/jotai";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

export type NewSubgoalButtonProps = {
  subgoal: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
};

export function NewSubgoalButton(props: NewSubgoalButtonProps) {
  const { subgoal, onClick } = props;

  const router = useRouter();
  const goalId = useQueryParam("questionId", "string") ?? "";
  const [newSubgoal, setNewSubgoal] = useAtom(newSubgoalAtom);
  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);

  const util = api.useContext();
  const { mutateAsync: createPrereqs, isLoading } =
    api.link.createChildren.useMutation({});

  const disabled = isLoading || loadingAi;

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      toast
        .promise(
          createPrereqs({
            parentQuestionId: goalId,
            questionTitles: [subgoal],
          }).then(async (res) => {
            setNewSubgoal(null);
            await util.link.getAllUnderQuestion.invalidate({
              parentQuestionId: goalId,
            });
          }),
          {
            loading: "Creating question...",
            success: "Question created!",
            error: "Error creating question",
          }
        )
        .catch(handleError);
    },
    [subgoal, goalId, setNewSubgoal, util, createPrereqs]
  );
  return (
    <div className="-ml-6 mb-2">
      <button
        disabled={disabled}
        onClick={handleClick}
        className={clsx({
          "block rounded-sm bg-white/40 px-3 py-1.5 text-left": true,
          "hover:bg-white/70": !disabled,
          "cursor-not-allowed": disabled,
        })}
      >
        {isLoading && <Spinner />}
        {subgoal}
      </button>
    </div>
  );
}
