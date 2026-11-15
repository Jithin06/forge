import type { MaterialCategory } from "@/lib/schemas";
import { cn } from "@/lib/utils";

/** Which drawn texture stands for each material. Categories not listed get a plain gray tile. */
const TEXTURE: Partial<Record<MaterialCategory, string>> = {
  pla_filament: "sw-filament",
  other_filament: "sw-filament",
  resin: "sw-resin",
  plywood: "sw-wood",
  solid_wood: "sw-wood",
  mdf: "sw-mdf",
  acrylic: "sw-acrylic",
  other_plastic_sheet: "sw-acrylic",
  aluminum: "sw-metal",
  steel: "sw-metal",
  other_metal: "sw-metal",
  cardboard_paper: "sw-card",
  foam: "sw-foam",
  fabric: "sw-fabric",
  electronic_components: "sw-parts",
};

/** A small drawn picture of a material. Decorative: the name is always written next to it. */
export function Swatch({ category, className }: { category: string; className?: string }) {
  return <span aria-hidden className={cn("sw", TEXTURE[category as MaterialCategory], className)} />;
}
