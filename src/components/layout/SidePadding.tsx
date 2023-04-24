import clsx from "clsx";
import { type ReactNode } from "react";

export interface SidePaddingProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  as?: keyof JSX.IntrinsicElements;
}
export function SidePadding({
  children,
  className,
  innerClassName,
  as = "div",
}: SidePaddingProps) {
  const styles = clsx(
    {
      "w-full px-6 flex flex-col items-center": true,
    },
    className
  );

  const innerStyles = clsx(
    {
      "max-w-6xl w-full": true,
    },
    innerClassName
  );

  const HtmlTag = as;

  return (
    <HtmlTag className={styles}>
      <div className={innerStyles}>{children}</div>
    </HtmlTag>
  );
}
