import "server-only";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

/**
 * The only file that talks to an AI provider (SPEC.md section 4.1).
 * AI_PROVIDER selects the adapter; everything after the call (validation,
 * grounding, compute) is identical in every mode.
 */

export type CallName = "ask" | "plan" | "scrap";
export type Provider = "fixture" | "replit" | "anthropic" | "gemini";

export type ToolCall<T> = {
  call: CallName;
  system: string;
  /** User-turn text. On a retry, earlier failures are appended here. */
  messages: { role: "user" | "assistant"; content: string }[];
  image?: { mediaType: string; base64: string };
  tool: { name: string; description: string };
  schema: z.ZodType<T>;
  /** Stable description of the input, hashed to choose a fixture. */
  fixtureKey: unknown;
};

export type ToolResult<T> = {
  input: T;
  usage: { input_tokens: number; output_tokens: number };
  provider: Provider;
  fixture: boolean;
};

export class AIError extends Error {
  constructor(
    public code: "TIMEOUT" | "PROVIDER" | "INVALID_OUTPUT" | "NOT_CONFIGURED",
    message: string,
    public details: string[] = [],
  ) {
    super(message);
  }
}

export const AI_TIMEOUT_MS = 30_000;

export function provider(): Provider {
  const p = (process.env.AI_PROVIDER ?? "fixture").trim();
  if (p === "fixture" || p === "replit" || p === "anthropic" || p === "gemini") return p;
  throw new AIError("NOT_CONFIGURED", `Unknown AI_PROVIDER "${p}"`);
}

/** Call the model with a forced tool call and return the zod-validated tool input. */
export async function callTool<T>(req: ToolCall<T>): Promise<ToolResult<T>> {
  const p = provider();
  const raw = await withTimeout(rawCall(p, req), AI_TIMEOUT_MS);
  const parsed = req.schema.safeParse(raw.input);
  if (!parsed.success) {
    throw new AIError(
      "INVALID_OUTPUT",
      "The model's answer did not match the expected shape.",
      parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
    );
  }
  return { input: parsed.data, usage: raw.usage, provider: p, fixture: p === "fixture" };
}

/** The JSON schema handed to the model as the tool's input schema. */
export function toolInputSchema(schema: z.ZodType): Record<string, unknown> {
  const json = { ...(z.toJSONSchema(schema) as Record<string, unknown>) };
  delete json.$schema;
  return json;
}

type Raw = { input: unknown; usage: { input_tokens: number; output_tokens: number } };

async function rawCall<T>(p: Provider, req: ToolCall<T>): Promise<Raw> {
  switch (p) {
    case "fixture":
      return { input: await fixtureFor(req.call, req.fixtureKey), usage: { input_tokens: 0, output_tokens: 0 } };
    case "replit":
    case "anthropic":
    case "gemini":
      // Live adapters arrive in milestone M2b, once credentials exist.
      throw new AIError("NOT_CONFIGURED", `AI_PROVIDER=${p} is not built yet. Use fixture.`);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AIError("TIMEOUT", "The model took too long to answer.")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ------------------------------------------------------------ fixtures

const FIXTURE_DIR = path.join(process.cwd(), "data", "fixtures");

/** JSON with sorted keys, so the same input always hashes the same. */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as object)
      .sort()
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

export function fixtureHash(call: CallName, key: unknown): string {
  return createHash("sha256").update(`${call}\n${stableStringify(key)}`).digest("hex");
}

type FixtureFile = { call: CallName; key: unknown; output: unknown };
let fixtureIndex: Map<string, unknown> | null = null;
let defaults: Map<CallName, unknown> | null = null;

async function loadFixtures() {
  if (fixtureIndex && defaults) return;
  const index = new Map<string, unknown>();
  const defs = new Map<CallName, unknown>();
  for (const call of ["ask", "plan", "scrap"] as const) {
    let files: string[] = [];
    try {
      files = (await readdir(path.join(FIXTURE_DIR, call))).filter((f) => f.endsWith(".json"));
    } catch {
      continue;
    }
    for (const f of files) {
      const data = JSON.parse(await readFile(path.join(FIXTURE_DIR, call, f), "utf8")) as FixtureFile;
      if (f === "default.json") defs.set(call, data.output);
      else index.set(fixtureHash(call, data.key), data.output);
    }
  }
  fixtureIndex = index;
  defaults = defs;
}

/** The recorded response for this exact input, or the call's default sample. */
async function fixtureFor(call: CallName, key: unknown): Promise<unknown> {
  await loadFixtures();
  const hit = fixtureIndex!.get(fixtureHash(call, key));
  if (hit !== undefined) return structuredClone(hit);
  const def = defaults!.get(call);
  if (def === undefined) throw new AIError("NOT_CONFIGURED", `No fixture for "${call}"`);
  return structuredClone(def);
}
