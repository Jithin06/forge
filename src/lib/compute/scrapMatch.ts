import type { MaterialCategory } from "../schemas";

export type ScrapItem = {
  id: string;
  space_id: string;
  material_category: string;
  title: string;
  size_note: string | null;
  condition: string;
  restrictions: string[];
  photo_url: string | null;
  posted_at: string;
};

/**
 * Step 5: for each material, up to 2 available scrap items in the same
 * category, the route's own space first, newest first. An item is offered
 * for one material only, so it is never counted twice.
 */
export function matchScrap(
  materials: { category: MaterialCategory }[],
  routeSpaceId: string,
  available: ScrapItem[],
  perMaterial = 2,
): ScrapItem[][] {
  const used = new Set<string>();
  const ranked = [...available].sort(
    (a, b) =>
      Number(b.space_id === routeSpaceId) - Number(a.space_id === routeSpaceId) ||
      b.posted_at.localeCompare(a.posted_at),
  );
  return materials.map((m) => {
    const picks = ranked.filter((s) => s.material_category === m.category && !used.has(s.id)).slice(0, perMaterial);
    picks.forEach((p) => used.add(p.id));
    return picks;
  });
}
