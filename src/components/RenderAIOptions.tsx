import { useState, useEffect } from "react";
import { Button } from "./base/Button";
import { Textarea } from "./base/Textarea";

interface RenderAIOptionsProps {
  options: string[];
  disabled: boolean;
  onOptionSelected: (value: string) => void;
}

export function RenderAIOptions(props: RenderAIOptionsProps) {
  // Allow users to select from a list of options. Each option is represented by an input and a button on the right.
  // The user can modify any of the inputs, and then click the associated option to proceed.
  const { options, disabled, onOptionSelected } = props;

  const [optionsText, setOptionsText] = useState(options);

  useEffect(() => {
    setOptionsText(options);
  }, [options]);

  return (
    <div className="flex w-full flex-col gap-2">
      {optionsText.map((option, index) => (
        <div className="flex flex-row items-center" key={index}>
          <Textarea
            minRows={1}
            className="w-full"
            value={option}
            onValueChange={(value) => {
              const newOptions = [...optionsText];
              newOptions[index] = value;
              setOptionsText(newOptions);
            }}
          />
          <div className="w-4"></div>
          <Button
            disabled={disabled}
            onClick={() => {
              onOptionSelected(option);
            }}
          >
            →
          </Button>
        </div>
      ))}
    </div>
  );
}
