import bfms from "../../data/spaces/bfms.json";
import bme from "../../data/spaces/bme-innovation.json";

/** Raw seed documents, for tests only. */
export const SEED_DOCS: unknown[] = [bfms, bme];

/** Deep copy so a test can break one field without touching others. */
export function clone<T>(v: T): T {
  return structuredClone(v);
}
