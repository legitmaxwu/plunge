import React, { ReactNode } from "react";
import { cn } from "../utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./base/Tooltip";
import clsx from "clsx";

type Icon = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
    title?: string;
    titleId?: string;
  } & React.RefAttributes<SVGSVGElement>
>;

type IconButtonProps = {
  icon: Icon;
  tooltipText?: string;
} & React.ComponentPropsWithoutRef<"button">;

export function IconButton(props: IconButtonProps) {
  const { icon, onClick, tooltipText, className, ...rest } = props;

  const styles = cn(
    {
      "h-7 w-7 p-1 text-black hover:bg-white/20 transition rounded-sm cursor-pointer":
        true,
      "bg-gray-400/20 hover:bg-gray-400/20 cursor-not-allowed": props.disabled,
    },
    className
  );

  const Icon = icon;

  if (tooltipText) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>
            <button {...rest} className={styles} onClick={onClick}>
              <Icon className="h-full w-full" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p
              className={clsx({
                "text-gray-400": props.disabled,
              })}
            >
              {tooltipText}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else {
    return (
      <button {...rest} className={styles} onClick={onClick}>
        <Icon className="h-full w-full" />
      </button>
    );
  }
}
