import React, {
  type HTMLProps,
  useLayoutEffect,
  useState,
  ForwardedRef,
} from "react";
import TextareaAutosize, {
  type TextareaAutosizeProps,
} from "react-textarea-autosize";
import clsx from "clsx";

export type TextAreaProps = TextareaAutosizeProps &
  Omit<HTMLProps<HTMLTextAreaElement>, "style"> & {
    onValueChange?: (value: string) => void;
  };

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (props, ref) => {
    const { onValueChange, onChange, className = "", ...rest } = props;

    // Hack to make minrows work
    // https://github.com/Andarist/react-textarea-autosize/issues/337#issuecomment-1024980737
    const [, setIsRerendered] = useState(false);
    useLayoutEffect(() => setIsRerendered(true), []);

    const styles = clsx(
      {
        "border border-black/10 bg-white/30 rounded-md px-3 py-2 resize-none transition":
          true,
        "focus:bg-white/70 focus:outline-none": true,
      },
      className
    );
    return (
      <TextareaAutosize
        minRows={2}
        {...rest}
        className={styles}
        ref={ref}
        onChange={(event) => {
          onValueChange?.(event.target.value);
          if (onChange) {
            onChange?.(event);
          }
        }}
      />
    );
  }
);

Textarea.displayName = "Textarea";
