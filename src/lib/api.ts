/** Error body shape from SPEC.md section 7.6. */
export function apiError(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status, headers: NO_STORE });
}

export const NO_STORE = { "Cache-Control": "no-store" };
