import { useEffect, type RefObject } from "react";

type CallbackType = (selectedText: string, x: number, y: number) => void;

export function useSelection(
  callback: CallbackType,
  targetRef: RefObject<HTMLDivElement>
) {
  useEffect(() => {
    let clickTimeout: NodeJS.Timeout;

    const handleSelection = (e: MouseEvent) => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }

      clickTimeout = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString();

        if (selectedText) {
          const { clientX: x, clientY: y } = e;
          callback(selectedText, x, y);
        }
      }, 250);
    };

    const targetElement = targetRef.current;

    if (targetElement) {
      targetElement.addEventListener("mouseup", handleSelection);
    }

    return () => {
      if (targetElement) {
        targetElement.removeEventListener("mouseup", handleSelection);
      }
    };
  }, [callback, targetRef]);
}
