import { useState } from "react";
import { Portal } from "@radix-ui/react-portal";
import { Popover, PopoverAnchor, PopoverContent } from "./base/Popover";
import { useSelection } from "../hooks/useSelection";

interface TextSelectionMenuProps {
  parentRef: React.RefObject<HTMLDivElement>;
}

export function TextSelectionMenu(props: TextSelectionMenuProps) {
  const { parentRef } = props;

  const [selectedText, setSelectedText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });

  useSelection((selectedText, left, top) => {
    if (!selectedText.trim()) return;
    setMenuPosition({ left, top });
    setIsOpen(true);
    setSelectedText(selectedText.trim());
  }, parentRef);

  return (
    <Portal>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverAnchor
          style={{
            position: "absolute",
            left: menuPosition.left,
            top: menuPosition.top,
            width: 0,
            height: 0,
            // border: "1px solid red",
            zIndex: 1,
          }}
        />
        {selectedText && (
          <PopoverContent
            onOpenAutoFocus={(e) => {
              e.preventDefault();
            }}
            className="flex w-64 flex-col py-1"
            side="bottom"
            align="start"
          >
            <div className="flex items-center px-3 py-1 text-xs font-medium">
              <span className="shrink-0">{'"'}</span>
              <span className="max-w-full truncate">{selectedText}</span>
              <span className="shrink-0">{'"'}</span>
            </div>
            <div className="my-1 h-px bg-gray-400/10"></div>
            <button
              className="px-3 py-1 text-left text-sm hover:bg-gray-100"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("chatbotSubmit", {
                    detail: {
                      query: `> ${selectedText}\n\nI don't understand this.`,
                    },
                  })
                );
                setIsOpen(false);
              }}
            >
              {"I don't understand this"}
            </button>
            <button
              className="px-3 py-1 text-left text-sm hover:bg-gray-100"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("chatbotSubmit", {
                    detail: {
                      query: `I want to study this further:\n\n${selectedText}`,
                    },
                  })
                );
                setIsOpen(false);
              }}
            >
              {"Study this further"}
            </button>
            <button
              className="px-3 py-1 text-left text-sm hover:bg-gray-100"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("chatbotSubmit", {
                    detail: {
                      query: `> ${selectedText}\n\n`,
                      submit: false,
                    },
                  })
                );
                setIsOpen(false);
              }}
            >
              Quote (custom inquiry)
            </button>
          </PopoverContent>
        )}
      </Popover>
    </Portal>
  );
}
