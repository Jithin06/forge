import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Band, Body } from "@/components/page";
import { SpacesDirectory } from "@/components/spaces/spaces-directory";
import { getSpaces } from "@/lib/spaces";

export const metadata: Metadata = { title: "Spaces" };

export default function SpacesPage() {
  return (
    <>
      <Band title="Spaces">
        <p>Places at USC where you can build things, and whether each one is open to you.</p>
      </Band>
      <Body>
        <Suspense fallback={<DirectorySkeleton />}>
          <SpacesData />
        </Suspense>
      </Body>
    </>
  );
}

async function SpacesData() {
  await connection(); // staff edits must show up, so read at request time
  const spaces = await getSpaces();
  return <SpacesDirectory spaces={spaces} />;
}

function DirectorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading spaces" className="space-y-5">
      <p className="text-gray-text">Loading the spaces...</p>
      {[0, 1].map((i) => (
        <div key={i} className="card space-y-3 p-4">
          <div className="skeleton h-6 w-1/2" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
