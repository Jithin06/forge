import type { Metadata } from "next";
import { MyStuff } from "@/components/account/my-stuff";

export const metadata: Metadata = { title: "My stuff" };

export default function MePage() {
  return <MyStuff />;
}
