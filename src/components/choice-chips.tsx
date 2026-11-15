"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Props<T extends string> = {
  legend: string;
  hint?: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T | null;
  onChange: (v: T) => void;
  name: string;
};

/** A radio group drawn as large tap chips. Arrow keys move between options. */
export function ChoiceChips<T extends string>({ legend, hint, options, labels, value, onChange, name }: Props<T>) {
  const hintId = useId();
  return (
    <fieldset className="space-y-2" aria-describedby={hint ? hintId : undefined}>
      <legend className="text-[17px] font-bold">{legend}</legend>
      {hint && (
        <p id={hintId} className="text-[15px] text-gray-text">
          {hint}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const checked = value === opt;
          return (
            <label
              key={opt}
              className={cn("chip relative", checked && "chip-on")}
            >
              <input
                type="radio"
                name={name}
                value={opt}
                checked={checked}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              {labels[opt]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
