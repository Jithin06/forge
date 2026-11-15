import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

const TITLE = {
  /** The home question. */
  hero: "text-[46px] leading-none tracking-[-0.025em] md:text-[72px]",
  /** Short page names. */
  lg: "text-[44px] leading-[1.02] tracking-[-0.02em] md:text-[60px]",
  /** Sentences and long names. */
  md: "text-[30px] leading-[1.1] tracking-[-0.015em] md:text-[40px]",
} as const;

type BandProps = {
  title: ReactNode;
  size?: keyof typeof TITLE;
  /** Leaves room for the first card of the body to sit over the band's lower edge. */
  overlap?: boolean;
  /** Given when the heading takes focus after a step change. */
  headingRef?: Ref<HTMLHeadingElement>;
  /** Shown above the heading, e.g. a back link. */
  above?: ReactNode;
  children?: ReactNode;
};

/** The cardinal pegboard band that opens every screen. It continues the header. */
export function Band({ title, size = "lg", overlap = false, headingRef, above, children }: BandProps) {
  return (
    <div className="peg on-dark">
      <div className={cn("mx-auto w-full max-w-[680px] space-y-2 px-5 pt-5", overlap ? "pb-[88px]" : "pb-6")}>
        {above}
        <h1
          ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}
          className={cn("font-bold text-white outline-none", TITLE[size])}
        >
          {title}
        </h1>
        {children && <div className="max-w-[34ch] text-[18px] leading-[1.35] text-white md:max-w-[52ch]">{children}</div>}
      </div>
    </div>
  );
}

/** The page column under the band. With `overlap`, its first child sits over the band. */
export function Body({ children, overlap = false, className }: { children: ReactNode; overlap?: boolean; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-[680px] space-y-7 px-4 pb-8", overlap ? "-mt-16" : "pt-6", className)}>
      {children}
    </div>
  );
}

export const primaryBtn = "btn btn-cardinal";
export const goldBtn = "btn btn-gold";
export const secondaryBtn = "btn btn-plain";
