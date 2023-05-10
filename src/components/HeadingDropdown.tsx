import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./base/HoverCard";

interface HeadingDropdownProps {
  sectionName: string;
  iconClassName?: string;
}
function HeadingDropdown(props: HeadingDropdownProps) {
  const { sectionName, iconClassName } = props;
  const styles = clsx(
    {
      "mb-0.5 ml-2 inline h-5 w-5 cursor-pointer text-gray-500 hover:text-gray-400":
        true,
    },
    iconClassName
  );

  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger asChild>
        <QuestionMarkCircleIcon className={styles} />
      </HoverCardTrigger>
      <HoverCardContent className="flex flex-col py-1" align="start">
        <button
          className="px-3 py-1 text-left text-sm font-normal hover:bg-gray-100"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("chatbotSubmit", {
                detail: {
                  query: `I want to study this further:\n\n${sectionName}`,
                },
              })
            );
          }}
        >
          Study further
        </button>
        <button
          className="px-3 py-1 text-left text-sm font-normal hover:bg-gray-100"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("chatbotSubmit", {
                detail: {
                  query: `Can you modify the article to expand on the "${sectionName}" section?`,
                },
              })
            );
          }}
        >
          Expand section
        </button>
      </HoverCardContent>
    </HoverCard>
  );
}
