import React, { ReactNode } from "react";
import { cn } from "../utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./base/Tooltip";

type Icon = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
    title?: string;
    titleId?: string;
  } & React.RefAttributes<SVGSVGElement>
>;

type SmallIconButtonProps = {
  icon: Icon;
  tooltipText?: string;
} & React.ComponentPropsWithoutRef<"button">;

export function SmallIconButton(props: SmallIconButtonProps) {
  const { icon, tooltipText, className, ...rest } = props;

  const styles = cn(
    { "h-5 w-5 bg-white p-0.5 shadow-sm hover:bg-gray-100": true },
    className
  );

  const Icon = icon;

  if (tooltipText) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>
            <button {...rest} className={styles}>
              <Icon className="h-full w-full" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else {
    return (
      <button {...rest} className={styles}>
        <Icon className="h-full w-full" />
      </button>
    );
  }
}
