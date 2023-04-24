import clsx from "clsx";
import { type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  onValueChange?: (value: string) => void;
};

export const Input = ({
  onValueChange,
  onChange,
  className = "",
  ...props
}: InputProps) => {
  const styles = clsx(
    {
      "border border-black/10 bg-white/30 rounded-md px-3 py-2 resize-none":
        true,
      "focus:bg-white/40 focus:outline-none": true,
    },
    className
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.value);
    onChange?.(e);
  };

  return <input {...props} className={styles} onChange={handleChange} />;
};
