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
      <legend className="text-[18px] font-semibold">{legend}</legend>
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
              className={cn(
                "relative inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[16px]",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-black",
                checked
                  ? "border-cardinal bg-cardinal font-semibold text-white"
                  : "border-gray-text bg-white text-black hover:border-cardinal",
              )}
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
