import { useState, useCallback, useMemo } from "react";
import clsx from "clsx";
import { useAtom } from "jotai";
import { goalAtom, newGuideAtom, loadingAiAtom } from "../../utils/jotai";
import { parseDiff, Diff, Hunk } from "react-diff-view";
import { applyPatch as diffApplyPatch } from "diff";

export function applyPatch(before: string, patchText: string): string {
  return diffApplyPatch(before, patchText, { fuzzFactor: 1 });
}

export interface DiffComponentProps {
  patchString: string;
}
export function DiffComponent({ patchString }: DiffComponentProps) {
  // Parse the diff string
  const files = useMemo(() => {
    try {
      return parseDiff(patchString);
    } catch {
      return null;
    }
  }, [patchString]);

  const [goal, setGoal] = useAtom(goalAtom);
  const [newGuide, setNewGuide] = useAtom(newGuideAtom);

  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);

  const newGeneratedGuide = useMemo(() => {
    if (loadingAi) return null;
    try {
      return applyPatch(goal?.guideMarkdown || "", patchString);
    } catch {
      return null;
    }
  }, [goal?.guideMarkdown, loadingAi, patchString]);

  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const handleMouseEnter = useCallback(() => {
    if (loadingAi || !newGeneratedGuide) return;

    setNewGuide(newGeneratedGuide);
  }, [loadingAi, newGeneratedGuide, setNewGuide]);

  const handleMouseLeave = useCallback(() => {
    if (loadingAi) return;
    setNewGuide(null);
  }, [loadingAi, setNewGuide]);

  const handleClick = useCallback(() => {
    if (loadingAi) return;

    if (!newGeneratedGuide) return;
    if (alreadyApplied) return;

    // Set goal guide to new guide
    setGoal((goal) => {
      if (!goal) return goal;
      return {
        ...goal,
        guideMarkdown: newGeneratedGuide,
      };
    });
    setAlreadyApplied(true);
    setNewGuide(null);
  }, [alreadyApplied, loadingAi, newGeneratedGuide, setGoal, setNewGuide]);

  const file = files?.[0];

  if (!file) return <div>...</div>;

  // Get the first file from the parsed diff
  const disabled = loadingAi || !newGeneratedGuide || alreadyApplied;

  return (
    <button
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={clsx({
        transition: true,
        "hover:shadow-md hover:brightness-110": !disabled,
        "cursor-not-allowed": disabled,
      })}
    >
      <Diff viewType="unified" diffType={file.type} hunks={file.hunks}>
        {(hunks) =>
          hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
        }
      </Diff>
    </button>
  );
}
