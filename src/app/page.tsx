import { Suspense } from "react";
import { AskFlow } from "@/components/ask/ask-flow";
import { ImpactCounter } from "@/components/impact-counter";

export default function AskPage() {
  return (
    <div className="space-y-8">
      <AskFlow />
      <Suspense fallback={null}>
        <ImpactCounter />
      </Suspense>
    </div>
  );
}
