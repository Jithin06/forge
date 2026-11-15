import { Suspense } from "react";
import { AskFlow } from "@/components/ask/ask-flow";
import { FreeNow, HowItWorks } from "@/components/home-extras";
import { ImpactCounter } from "@/components/impact-counter";

export default function AskPage() {
  return (
    <AskFlow
      below={
        <>
          <HowItWorks />
          <Suspense fallback={null}>
            <FreeNow />
          </Suspense>
          <Suspense fallback={null}>
            <ImpactCounter />
          </Suspense>
        </>
      }
    />
  );
}
