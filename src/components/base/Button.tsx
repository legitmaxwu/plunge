import clsx from "clsx";
import React, { type ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  size?: "medium" | "small";
};
export const Button = React.forwardRef(
  (
    {
      className,
      size = "medium",
      variant = "primary",
      disabled,
      ...props
    }: ButtonProps,
    _ //ref: creating this so the warning of passing refs with Links disappears
  ) => {
    const styles = clsx(
      {
        ["rounded-sm select-none border"]: true,
        ["bg-white/20 border-black/20 hover:bg-black/10"]:
          variant === "primary" && !disabled,
        ["bg-transparent hover:bg-black/10 border-transparent"]:
          variant === "ghost" && !disabled,
        ["bg-black/5 cursor-not-allowed border-transparent pointer-events-none"]:
          disabled,
        ["py-1.5 px-4"]: size === "medium",
        ["text-xs py-0.5 px-1"]: size === "small",
      },
      className
    );

    return <button className={styles} {...props} />;
  }
);

Button.displayName = "Button";
