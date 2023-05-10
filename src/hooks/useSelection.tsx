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

    let touchTimeout: NodeJS.Timeout;
    const handleTouchSelection = () => {
      if (touchTimeout) {
        clearTimeout(touchTimeout);
      }

      touchTimeout = setTimeout(() => {
        const selection = window.getSelection();
        const rect = selection?.getRangeAt(0).getBoundingClientRect();

        const selectedText = selection?.toString();

        if (selectedText && rect) {
          const { x, y } = rect;
          callback(selectedText, x, y);
        }
      }, 250);
    };

    const targetElement = targetRef.current;

    if (targetElement) {
      targetElement.addEventListener("mouseup", handleSelection);
      // mobile
      targetElement.addEventListener("touchend", handleTouchSelection);
    }

    return () => {
      if (targetElement) {
        targetElement.removeEventListener("mouseup", handleSelection);
        targetElement.removeEventListener("touchend", handleTouchSelection);
      }
    };
  }, [callback, targetRef]);
}
