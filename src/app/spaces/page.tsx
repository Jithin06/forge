import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { SpacesDirectory } from "@/components/spaces/spaces-directory";
import { getSpaces } from "@/lib/spaces";

export const metadata: Metadata = { title: "Spaces" };

export default function SpacesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-[28px] font-bold">Spaces</h1>
        <p>Places at USC where you can build things, and whether each one is open to you.</p>
      </header>
      <Suspense fallback={<DirectorySkeleton />}>
        <SpacesData />
      </Suspense>
    </div>
  );
}

async function SpacesData() {
  await connection(); // staff edits must show up, so read at request time
  const spaces = await getSpaces();
  return <SpacesDirectory spaces={spaces} />;
}

function DirectorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading spaces" className="space-y-4">
      <p className="text-gray-text">Loading the spaces...</p>
      {[0, 1].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-xl border border-gray-line bg-white" />
      ))}
    </div>
  );
}
