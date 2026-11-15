import { createHash } from "node:crypto";

/** Split a data URL into what the model needs, plus a hash for fixtures. */
export function parseImage(dataUrl: string | undefined) {
  if (!dataUrl) return null;
  const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  return {
    mediaType: m[1],
    base64: m[2],
    sha256: createHash("sha256").update(m[2]).digest("hex"),
  };
}
