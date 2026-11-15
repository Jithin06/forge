import type { Metadata } from "next";
import { StaffPortal } from "@/components/staff/staff-portal";

export const metadata: Metadata = { title: "Staff portal" };

export default function StaffPage() {
  return <StaffPortal />;
}
