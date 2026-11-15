import type { Metadata } from "next";
import { ScrapBin } from "@/components/scrap/scrap-bin";

export const metadata: Metadata = { title: "Free scrap" };

export default function ScrapPage() {
  return <ScrapBin />;
}
