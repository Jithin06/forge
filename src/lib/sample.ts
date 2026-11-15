/** The sentence that ends the description of every demo sample item in the scrap bin. */
export const SAMPLE_LINE = "Sample item. Generated photo, not real Maker Space stock.";

/** True for a scrap item posted as a demo sample, told by its description. */
export function isSample(description: string | null | undefined): boolean {
  return (description ?? "").trim().endsWith(SAMPLE_LINE);
}
