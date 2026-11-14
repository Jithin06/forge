import { Hammer, MapPin, Recycle, type LucideIcon } from "lucide-react";

export type NavTab = { href: string; label: string; icon: LucideIcon };

export const NAV_TABS: NavTab[] = [
  { href: "/", label: "Build", icon: Hammer },
  { href: "/spaces", label: "Spaces", icon: MapPin },
  { href: "/scrap", label: "Scrap", icon: Recycle },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/plan");
  return pathname === href || pathname.startsWith(`${href}/`);
}
