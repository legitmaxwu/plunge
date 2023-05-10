import clsx from "clsx";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./base/HoverCard";
import nlp from "compromise";
import { type ReactNode } from "react";
import isMobile from "is-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./base/Dropdown";

export function getVerbForm(noun: string) {
  const doc = nlp(noun);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const isPlural = doc.nouns().isPlural().out("array").length > 0;

  if (isPlural) {
    return "are";
  } else {
    return "is";
  }
}

const mobile = isMobile();
export interface RenderLinkProps {
  href?: string;
  children: ReactNode & ReactNode[];
  className?: string;
  questionId: string;
}

export function RenderLink(props: RenderLinkProps) {
  const { href, children, className, questionId } = props;
  const subject = children.join("");

  const processedHref = href?.replaceAll("_", " ");

  const isRawQuestion = !href || subject === processedHref;

  const whatQuestion = `What ${getVerbForm(subject)} ${subject}?`;

  const plungeEventId = `plunge-${questionId}`;

  if (isRawQuestion) {
    return (
      <span
        className={clsx(
          className,
          "inline cursor-pointer font-semibold text-cyan-800 underline hover:text-cyan-600"
        )}
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent(plungeEventId, {
              detail: {
                newQuestion: subject,
              },
            })
          );
        }}
      >
        {subject}
      </span>
    );
  } else {
    return (
      <div className="inline">
        {mobile ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span
                  className={clsx(
                    className,
                    "inline cursor-pointer font-semibold text-cyan-800 underline "
                  )}
                >
                  {children}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="flex flex-col py-1" align="start">
                <DropdownMenuItem
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent(plungeEventId, {
                        detail: {
                          newQuestion: whatQuestion,
                        },
                      })
                    );
                  }}
                >
                  {whatQuestion}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent(plungeEventId, {
                        detail: {
                          newQuestion: processedHref,
                        },
                      })
                    );
                  }}
                >
                  {processedHref}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <HoverCard openDelay={0}>
              <HoverCardTrigger>
                <span
                  // {...props}
                  // href={href}
                  // target={isExternal ? "_blank" : undefined}
                  // rel={isExternal ? "noopener noreferrer" : undefined}
                  className={clsx(
                    className,
                    "inline cursor-pointer font-semibold text-cyan-800 underline "
                  )}
                >
                  {children}
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="flex flex-col py-1" align="start">
                <button
                  className="px-3 py-1 text-left text-sm hover:bg-gray-100"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent(plungeEventId, {
                        detail: {
                          newQuestion: whatQuestion,
                        },
                      })
                    );
                  }}
                >
                  {whatQuestion}
                </button>
                <button
                  className="px-3 py-1 text-left text-sm hover:bg-gray-100"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent(plungeEventId, {
                        detail: {
                          newQuestion: processedHref,
                        },
                      })
                    );
                  }}
                >
                  {processedHref}
                </button>
              </HoverCardContent>
            </HoverCard>
          </>
        )}
      </div>
    );
  }
}
