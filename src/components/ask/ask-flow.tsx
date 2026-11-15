"use client";

import { Camera, CircleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AudiencePicker, ExperiencePicker } from "@/components/about-you";
import { useAudience, useExperience } from "@/components/profile-store";
import { SampleBanner } from "@/components/sample-banner";
import type { Question, QuestionId } from "@/lib/ai/questions";
import { cn } from "@/lib/utils";
import { resizeToJpeg } from "./resize-image";

const EXAMPLES = [
  { chip: "A phone stand", text: "I want to make a phone stand for my desk out of wood. It should hold my phone at a slight angle, fit in my hand, and I only need one." },
  { chip: "A night light", text: "A small night light for my dorm desk with a warm LED inside and a 3D printed cover. Just one, about the size of my palm." },
  { chip: "A club sign", text: "An engraved acrylic sign with my club's name for our tabling booth, about 12 inches wide. We need one." },
  { chip: "Not sure yet", text: "something cool for my room" },
];

const ASK_STATUS = ["Reading your idea", "Checking which details matter"];
const PLAN_STATUS = [
  "Checking which spaces have what you need",
  "Working out the trainings",
  "Adding up material costs",
  "Looking for free scrap",
];

type Answers = Partial<Record<QuestionId, string[]>>;
type Step =
  | { name: "form" }
  | { name: "asking" }
  | { name: "questions"; summary: string; questions: Question[]; fixture: boolean }
  | { name: "blocked"; reason: string }
  | { name: "planning"; summary?: string };

const DRAFT_KEY = "forge.draft";

export function AskFlow() {
  const router = useRouter();
  const [audience] = useAudience();
  const [experience] = useExperience();
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState<Step>({ name: "form" });
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ text?: string; about?: string; photo?: string }>({});
  const textId = useId();
  const errId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const loaded = useRef(false);
  const leaving = useRef(false);
  const restored = useRef(false);

  // Next keeps this page alive, hidden, after moving to the plan. When that
  // happens, go back to the form so Back does not land on "Working on it".
  useEffect(
    () => () => {
      if (!leaving.current) return;
      leaving.current = false;
      setStep({ name: "form" });
    },
    [],
  );

  // Restore what the student typed: from a plan ("Change my answers") or this tab's draft.
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const from = new URLSearchParams(window.location.search).get("from");
    if (from) {
      fetch(`/api/plan/${encodeURIComponent(from)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => {
          if (!p) return;
          setText(p.idea_text ?? "");
          setAnswers(p.answers ?? {});
        })
        .catch(() => {})
        .finally(() => {
          restored.current = true;
        });
      return;
    }
    // Read after hydration, so the server-rendered empty box and the browser agree.
    Promise.resolve()
      .then(() => JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) ?? "null"))
      .then((d) => {
        if (d?.text) setText((current) => current || d.text);
      })
      .catch(() => {})
      .finally(() => {
        restored.current = true;
      });
  }, []);

  useEffect(() => {
    if (!restored.current) return; // do not overwrite the saved draft before it is read
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ text }));
    } catch {
      /* storage blocked */
    }
  }, [text]);

  // Move focus to the new step's heading so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (step.name === "questions" || step.name === "blocked") headingRef.current?.focus();
  }, [step.name]);

  async function post(path: string, body: unknown) {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error?.message ?? "Something went wrong. Please try again.");
    return data;
  }

  async function makePlan(finalAnswers: Answers, summary?: string) {
    setError(null);
    setStep({ name: "planning", summary });
    try {
      const data = await post("/api/plan", { text, answers: finalAnswers, audience, experience, ...(image ? { image } : {}) });
      leaving.current = true;
      router.push(`/plan/${data.id}`);
    } catch (e) {
      setError((e as Error).message);
      setStep({ name: "form" });
    }
  }

  async function submitIdea(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof fieldError = {};
    if (text.trim().length < 10) errs.text = "Tell us a bit more. One sentence is enough.";
    if (!audience || !experience) errs.about = "Pick one option in each group below so we can check which spaces you can use.";
    setFieldError(errs);
    if (errs.text || errs.about) return;

    setError(null);
    setStep({ name: "asking" });
    try {
      const data = await post("/api/ask", { text, experience, ...(image ? { image } : {}) });
      if (data.blocked_reason) return setStep({ name: "blocked", reason: data.blocked_reason });
      const merged: Answers = { ...data.prefilled };
      setAnswers(merged);
      if (data.questions.length === 0) return makePlan(merged, data.summary);
      setStep({ name: "questions", summary: data.summary, questions: data.questions, fixture: data.fixture });
    } catch (e) {
      setError((e as Error).message);
      setStep({ name: "form" });
    }
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImage(await resizeToJpeg(file));
      setFieldError((f) => ({ ...f, photo: undefined }));
    } catch {
      setFieldError((f) => ({ ...f, photo: "We could not read that photo. Try a JPEG or PNG." }));
    }
  }

  if (step.name === "asking" || step.name === "planning") {
    return (
      <Waiting
        lines={step.name === "asking" ? ASK_STATUS : PLAN_STATUS}
        summary={step.name === "planning" ? step.summary : undefined}
        idea={text}
        onCancel={() => setStep({ name: "form" })}
      />
    );
  }

  if (step.name === "blocked") {
    return (
      <section className="space-y-4">
        <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-bold outline-none">
          We cannot help with this one
        </h1>
        <p role="alert" className="border-l-4 border-cardinal pl-4">{step.reason}</p>
        <button type="button" onClick={() => { setText(""); setStep({ name: "form" }); }} className={primaryBtn}>
          Describe something else
        </button>
      </section>
    );
  }

  if (step.name === "questions") {
    const finish = () => {
      const filled: Answers = { ...answers };
      for (const q of step.questions) if (!filled[q.id]?.length) filled[q.id] = ["not_sure"];
      makePlan(filled, step.summary);
    };
    return (
      <section className="space-y-6">
        {step.fixture && <SampleBanner />}
        <div className="space-y-2">
          <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-bold outline-none">
            A few quick questions
          </h1>
          <p aria-live="polite" className="text-[18px]">{step.summary}</p>
        </div>
        {step.questions.map((q) => (
          <QuestionChips
            key={q.id}
            q={q}
            value={answers[q.id] ?? []}
            onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
          />
        ))}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={finish} className={primaryBtn}>Show my plan</button>
          <button type="button" onClick={() => setStep({ name: "form" })} className={secondaryBtn}>Change my description</button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submitIdea} noValidate className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-[40px] font-bold leading-[1.15] md:text-[56px]">What do you want to make?</h1>
        <label htmlFor={textId} className="block text-[18px]">Describe it in your own words</label>
        <textarea
          id={textId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={1500}
          aria-invalid={!!fieldError.text}
          aria-describedby={fieldError.text ? errId : undefined}
          placeholder="For example: a small shelf for my plants that hangs on the wall"
          className="w-full rounded-xl border border-gray-text bg-white p-3 text-[16px] placeholder:text-gray-text"
        />
        {fieldError.text && <FieldError id={errId}>{fieldError.text}</FieldError>}

        <div className="space-y-2">
          <p className="text-[15px] text-gray-text">Or start from an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.chip}
                type="button"
                onClick={() => { setText(ex.text); setFieldError((f) => ({ ...f, text: undefined })); }}
                className="min-h-11 rounded-full border border-gray-text bg-white px-4 hover:border-cardinal"
              >
                {ex.chip}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} hidden />
          <button type="button" onClick={() => fileRef.current?.click()} className={cn(secondaryBtn, "gap-2")}>
            <Camera aria-hidden className="size-5" />
            {image ? "Change the photo" : "Add a photo or sketch"}
          </button>
          {image && (
            <span className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Your photo or sketch" className="size-12 rounded-lg border border-gray-line object-cover" />
              <button type="button" onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = ""; }} className="flex min-h-11 items-center gap-1 text-cardinal underline underline-offset-4">
                <X aria-hidden className="size-4" />
                Remove photo
              </button>
            </span>
          )}
        </div>
        {fieldError.photo && <FieldError>{fieldError.photo}</FieldError>}
      </div>

      <section aria-label="About you" className="space-y-5">
        {fieldError.about && (!audience || !experience) && <FieldError>{fieldError.about}</FieldError>}
        <AudiencePicker />
        <ExperiencePicker />
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-2 border-l-4 border-cardinal pl-4">
          <CircleAlert aria-hidden className="mt-1 size-5 shrink-0" />
          <p>{error} Your description is still here.</p>
        </div>
      )}

      <button type="submit" className={cn(primaryBtn, "w-full sm:w-auto")}>
        {error ? "Try again" : "Find how to build it"}
      </button>
    </form>
  );
}

const primaryBtn =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-cardinal px-6 text-[16px] font-semibold text-white hover:bg-cardinal-pressed";
const secondaryBtn =
  "inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-cardinal bg-white px-5 text-[16px] font-semibold text-cardinal hover:bg-gold-soft";

function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-2 border-l-4 border-cardinal pl-3">
      <CircleAlert aria-hidden className="mt-1 size-4 shrink-0" />
      {children}
    </p>
  );
}

function QuestionChips({ q, value, onChange }: { q: Question; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (id: string) => {
    if (!q.multi) return onChange([id]);
    if (id === "not_sure") return onChange(value.includes(id) ? [] : [id]);
    const rest = value.filter((v) => v !== "not_sure");
    onChange(rest.includes(id) ? rest.filter((v) => v !== id) : [...rest, id]);
  };
  return (
    <fieldset className="space-y-2">
      <legend className="text-[18px] font-semibold">{q.text}</legend>
      <div className="flex flex-wrap gap-2">
        {q.options.map((o) => {
          const checked = value.includes(o.id);
          return (
            <label
              key={o.id}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-black",
                checked ? "border-cardinal bg-cardinal font-semibold text-white" : "border-gray-text bg-white hover:border-cardinal",
              )}
            >
              <input
                type={q.multi ? "checkbox" : "radio"}
                name={`q-${q.id}`}
                checked={checked}
                onChange={() => toggle(o.id)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Waiting({ lines, summary, idea, onCancel }: { lines: string[]; summary?: string; idea: string; onCancel: () => void }) {
  const [i, setI] = useState(0);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const tick = setInterval(() => setI((n) => (n + 1) % lines.length), 2000);
    const late = setTimeout(() => setSlow(true), 20000);
    return () => { clearInterval(tick); clearTimeout(late); };
  }, [lines.length]);
  return (
    <section aria-busy="true" className="space-y-5">
      <h1 className="text-[28px] font-bold">Working on it</h1>
      <p className="text-[18px]">{summary ?? idea}</p>
      <p role="status" className="font-semibold">{lines[i]}...</p>
      <div aria-hidden className="space-y-3">
        <div className="h-8 w-1/2 animate-pulse rounded-lg bg-gold-soft" />
        <div className="h-36 animate-pulse rounded-xl border border-gray-line" />
        <div className="h-36 animate-pulse rounded-xl border border-gray-line" />
      </div>
      {slow && (
        <div className="space-y-3">
          <p>This is taking longer than usual. You can keep waiting or start again.</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setSlow(false)} className={secondaryBtn}>Keep waiting</button>
            <button type="button" onClick={onCancel} className={secondaryBtn}>Try again</button>
          </div>
        </div>
      )}
    </section>
  );
}
