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

type IconButtonProps = {
  icon: Icon;
  onClick?: () => void;
  tooltipText?: string;
} & React.ComponentPropsWithoutRef<"button">;

function IconButton(props: IconButtonProps) {
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <button {...rest} className={styles} onClick={onClick}>
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
      <button {...rest} className={styles} onClick={onClick}>
        <Icon className="h-full w-full" />
      </button>
    );
  }
}

export default IconButton;
