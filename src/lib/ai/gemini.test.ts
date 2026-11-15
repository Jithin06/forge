import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AIError, callTool, geminiSchema, toolInputSchema } from "./client";
import { planOutputSchema } from "./schemas";

const schema = z.object({ answer: z.string() });
const req = {
  call: "ask" as const,
  system: "sys",
  messages: [{ role: "user" as const, content: "hello" }],
  tool: { name: "t", description: "d" },
  schema,
  fixtureKey: {},
};
const ok = (obj: unknown) =>
  new Response(
    JSON.stringify({
      status: "completed",
      steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify(obj) }] }],
      usage: { total_input_tokens: 120, total_output_tokens: 30, total_thought_tokens: 5 },
    }),
    { status: 200 },
  );
const busy = () => new Response(JSON.stringify({ error: { code: 429, status: "RESOURCE_EXHAUSTED" } }), { status: 429 });

let log: string;
const lines = () => readFileSync(log, "utf8").trim().split("\n").map((l) => JSON.parse(l));

beforeEach(() => {
  log = path.join(mkdtempSync(path.join(tmpdir(), "forge-ai-")), "calls.jsonl");
  vi.stubEnv("AI_PROVIDER", "gemini");
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  vi.stubEnv("GEMINI_MODEL_PRIMARY", "primary-model");
  vi.stubEnv("GEMINI_MODEL_FALLBACK", "fallback-model");
  vi.stubEnv("AI_CALL_LOG", log);
  vi.stubEnv("AI_CALL_BUDGET", "");
  vi.stubEnv("RECORD_FIXTURES", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("gemini adapter", () => {
  it("sends system prompt, text, image and schema to the primary model, and reads the JSON answer", async () => {
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => ok({ answer: "hi" }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await callTool({ ...req, image: { mediaType: "image/jpeg", base64: "QUJD" } });
    expect(r.input).toEqual({ answer: "hi" });
    expect(r.usage).toEqual({ input_tokens: 120, output_tokens: 35 });
    expect(r.fixture).toBe(false);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/interactions");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("primary-model");
    expect(body.system_instruction).toBe("sys");
    expect(body.store).toBe(false);
    expect(body.input).toEqual([
      { type: "text", text: "hello" },
      { type: "image", data: "QUJD", mime_type: "image/jpeg" },
    ]);
    expect(body.response_format.mime_type).toBe("application/json");
    expect(body.response_format.schema.properties.answer.type).toBe("string");
  });

  it("falls back to the second model on a 429, and logs both calls with a running count", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(busy()).mockResolvedValueOnce(ok({ answer: "from fallback" }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await callTool(req);
    expect(r.input).toEqual({ answer: "from fallback" });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).model).toBe("fallback-model");
    expect(lines().map((l) => [l.n, l.model, l.status])).toEqual([
      [1, "primary-model", 429],
      [2, "fallback-model", 200],
    ]);
  });

  it("reports BUSY when both models are rate limited", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => busy()));
    const err = await callTool(req).catch((e) => e);
    expect(err).toBeInstanceOf(AIError);
    expect(err.code).toBe("BUSY");
  });

  it("stops before sending once the call budget is used up", async () => {
    vi.stubEnv("AI_CALL_BUDGET", "2");
    const fetchMock = vi.fn(async () => ok({ answer: "x" }));
    vi.stubGlobal("fetch", fetchMock);
    await callTool(req);
    await callTool(req);
    const err = await callTool(req).catch((e) => e);
    expect(err.code).toBe("BUDGET");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(lines()).toHaveLength(2);
  });

  it("rejects an answer that does not match the schema", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ok({ wrong: 1 })));
    const err = await callTool(req).catch((e) => e);
    expect(err.code).toBe("INVALID_OUTPUT");
  });

  it("sends only schema keywords Google supports", () => {
    const sent = JSON.stringify(geminiSchema(toolInputSchema(planOutputSchema)));
    expect(sent).not.toMatch(/exclusiveMinimum|minLength|maxLength|\$schema/);
    expect(sent).toMatch(/"maxItems":3/);
    expect(sent).toMatch(/"enum":\["fdm_3d_printing"/);
    // a property that happens to be called "description" or "type" must survive
    const s = geminiSchema({ type: "object", properties: { type: { type: "string", minLength: 2 }, title: { type: "string" } } });
    expect(s).toEqual({ type: "object", properties: { type: { type: "string" }, title: { type: "string" } } });
  });
});
