import "server-only";
import { createHash } from "node:crypto";
import { appendFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
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
    public code: "TIMEOUT" | "PROVIDER" | "INVALID_OUTPUT" | "NOT_CONFIGURED" | "BUSY" | "BUDGET",
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
  if (p !== "fixture" && process.env.RECORD_FIXTURES === "1") await recordFixture(req.call, req.fixtureKey, parsed.data, raw.model);
  return { input: parsed.data, usage: raw.usage, provider: p, fixture: p === "fixture" };
}

/** The JSON schema handed to the model as the tool's input schema. */
export function toolInputSchema(schema: z.ZodType): Record<string, unknown> {
  const json = { ...(z.toJSONSchema(schema) as Record<string, unknown>) };
  delete json.$schema;
  return json;
}

type Raw = { input: unknown; usage: { input_tokens: number; output_tokens: number }; model?: string };

async function rawCall<T>(p: Provider, req: ToolCall<T>): Promise<Raw> {
  switch (p) {
    case "fixture":
      return { input: await fixtureFor(req.call, req.fixtureKey), usage: { input_tokens: 0, output_tokens: 0 } };
    case "gemini":
      return geminiCall(req);
    case "replit":
    case "anthropic":
      throw new AIError("NOT_CONFIGURED", `AI_PROVIDER=${p} is not built. Use gemini or fixture.`);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AIError("TIMEOUT", "The model took too long to answer.")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// -------------------------------------------------------------- gemini
// Google's Interactions API (aistudio.google.com/docs/interactions), read
// 2026-11-14. Both models take image input and support structured output.

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

export function geminiModels(): [string, string] {
  return [
    process.env.GEMINI_MODEL_PRIMARY?.trim() || "gemini-3.5-flash-lite",
    process.env.GEMINI_MODEL_FALLBACK?.trim() || "gemini-3.1-flash-lite",
  ];
}

/** Keep only the JSON Schema keywords Google documents as supported. */
const KEEP = new Set([
  "type", "description", "properties", "required", "additionalProperties",
  "enum", "items", "minItems", "maxItems", "minimum", "maximum", "anyOf",
]);
export function geminiSchema(node: unknown, isPropertyMap = false): unknown {
  if (Array.isArray(node)) return node.map((n) => geminiSchema(n));
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (isPropertyMap) out[k] = geminiSchema(v);
    else if (KEEP.has(k)) out[k] = k === "properties" ? geminiSchema(v, true) : k === "enum" || k === "required" ? v : geminiSchema(v);
  }
  return out;
}

async function geminiCall<T>(req: ToolCall<T>): Promise<Raw> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AIError("NOT_CONFIGURED", "GEMINI_API_KEY is not set");
  const text = req.messages.map((m) => m.content).join("\n\n");
  const body = {
    input: [
      { type: "text", text },
      ...(req.image ? [{ type: "image", data: req.image.base64, mime_type: req.image.mediaType }] : []),
    ],
    system_instruction: req.system,
    response_format: { type: "text", mime_type: "application/json", schema: geminiSchema(toolInputSchema(req.schema)) },
    generation_config: { thinking_level: "low", max_output_tokens: 4096 },
    store: false, // idea text and photos are not kept by the provider
  };

  for (const model of geminiModels()) {
    await spendOneCall(); // throws when tonight's budget is used up
    let res: Response;
    try {
      res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({ model, ...body }),
        signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      });
    } catch (e) {
      await logCall({ call: req.call, model, status: "network_error" });
      if ((e as Error).name === "TimeoutError") throw new AIError("TIMEOUT", "The model took too long to answer.");
      throw new AIError("PROVIDER", `Could not reach Gemini: ${(e as Error).message}`);
    }
    if (res.status === 429) {
      await logCall({ call: req.call, model, status: 429 });
      continue; // rate limited: try the fallback model, which has its own quota
    }
    const json = (await res.json().catch(() => null)) as GeminiResponse | null;
    const usage = {
      input_tokens: json?.usage?.total_input_tokens ?? 0,
      output_tokens: (json?.usage?.total_output_tokens ?? 0) + (json?.usage?.total_thought_tokens ?? 0),
    };
    await logCall({ call: req.call, model, status: res.status, ...usage });
    if (!res.ok || !json) {
      throw new AIError("PROVIDER", `Gemini returned ${res.status}: ${json?.error?.message ?? "no body"}`);
    }
    const out = json.steps
      ?.filter((s) => s.type === "model_output")
      .flatMap((s) => s.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("");
    if (json.status !== "completed" || !out) {
      throw new AIError("PROVIDER", `Gemini finished with status "${json.status}" and no usable output`);
    }
    try {
      return { input: JSON.parse(out), usage, model };
    } catch {
      throw new AIError("INVALID_OUTPUT", "The model's answer was not valid JSON.", ["the answer must be one JSON object matching the schema"]);
    }
  }
  throw new AIError("BUSY", "Both Gemini models are rate limited.");
}

type GeminiResponse = {
  status?: string;
  steps?: { type: string; content?: { type: string; text?: string }[] }[];
  usage?: { total_input_tokens?: number; total_output_tokens?: number; total_thought_tokens?: number };
  error?: { message?: string };
};

// ------------------------------------------------- live call log and budget
// One line per request sent to a live model, with a running count. The file
// is the count: it survives restarts. On a read-only host (Vercel) writing
// fails quietly and the count is per server instance, in the console only.

const callLogPath = () => process.env.AI_CALL_LOG || path.join(process.cwd(), "logs", "ai-calls.jsonl");
let memoryCount = 0; // used only where the log file cannot be written
let fileBroken = false;

export async function liveCallCount(): Promise<number> {
  if (fileBroken) return memoryCount;
  try {
    return (await readFile(callLogPath(), "utf8")).split("\n").filter(Boolean).length;
  } catch {
    return 0; // no log yet
  }
}

async function spendOneCall() {
  const budget = Number(process.env.AI_CALL_BUDGET);
  if (!Number.isFinite(budget) || budget <= 0) return;
  const used = await liveCallCount();
  if (used >= budget) throw new AIError("BUDGET", `Live AI call budget reached (${used} of ${budget}).`);
}

async function logCall(entry: Record<string, unknown>) {
  const n = (await liveCallCount()) + 1;
  const line = { n, at: new Date().toISOString(), ...entry };
  console.log(`live AI call #${n}${process.env.AI_CALL_BUDGET ? ` of ${process.env.AI_CALL_BUDGET}` : ""}: ${JSON.stringify(entry)}`);
  try {
    await mkdir(path.dirname(callLogPath()), { recursive: true });
    await appendFile(callLogPath(), JSON.stringify(line) + "\n");
  } catch {
    fileBroken = true; // read-only file system: count in memory, log to console
    memoryCount = n;
  }
}

async function recordFixture(call: CallName, key: unknown, output: unknown, model?: string) {
  try {
    const dir = path.join(FIXTURE_DIR, call);
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `live-${fixtureHash(call, key).slice(0, 12)}.json`);
    await writeFile(file, JSON.stringify({ call, recorded: { model, at: new Date().toISOString() }, key, output }, null, 2) + "\n");
    fixtureIndex = null; // pick the new recording up on the next fixture read
  } catch (e) {
    console.error("Could not record fixture:", (e as Error).message);
  }
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
