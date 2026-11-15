"use client";

import { Camera, CircleAlert, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChoiceChips } from "@/components/choice-chips";
import { saveProfile, useProfile } from "@/components/profile-store";
import { AUDIENCE_LABELS, EXPERIENCE_LABELS } from "@/lib/labels";
import { AUDIENCES, EXPERIENCES, type Audience, type Experience } from "@/lib/schemas";
import { Band, Body, primaryBtn, secondaryBtn } from "@/components/page";
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

/** `below` is shown under the form only, not while asking questions or waiting. */
export function AskFlow({ below }: { below?: React.ReactNode }) {
  const router = useRouter();
  const profile = useProfile();
  const { audience, experience } = profile;
  const [justWelcomed, setJustWelcomed] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState<Step>({ name: "form" });
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ text?: string; photo?: string }>({});
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
    if (step.name === "questions" || step.name === "blocked" || justWelcomed) headingRef.current?.focus();
  }, [step.name, justWelcomed]);

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
    setFieldError(errs);
    if (errs.text || !audience || !experience) return;

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
      <section>
        <Band title="We cannot help with this one" size="md" headingRef={headingRef} />
        <Body>
          <p role="alert" className="alert">
            <CircleAlert aria-hidden className="size-5" />
            <span>{step.reason}</span>
          </p>
          <button type="button" onClick={() => { setText(""); setStep({ name: "form" }); }} className={primaryBtn}>
            Describe something else
          </button>
        </Body>
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
      <section>
        <Band title="A few quick questions" size="md" headingRef={headingRef} overlap>
          <p aria-live="polite">{step.summary}</p>
        </Band>
        <Body overlap>
          <div className="card space-y-6 p-4">
            {step.questions.map((q) => (
              <QuestionChips
                key={q.id}
                q={q}
                value={answers[q.id] ?? []}
                onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
              />
            ))}
            <button type="button" onClick={finish} className={cn(primaryBtn, "w-full")}>Show my plan</button>
          </div>
          <button type="button" onClick={() => setStep({ name: "form" })} className={cn(secondaryBtn, "w-full sm:w-auto")}>Change my description</button>
          {step.fixture && <SampleBanner />}
        </Body>
      </section>
    );
  }

  // Until we know whether a profile exists (this browser, or the account), show neither the welcome nor the form.
  if (!profile.ready) {
    return (
      <div aria-busy="true">
        <Band title="What do you want to make?" size="hero" overlap />
        <Body overlap>
          <div className="card space-y-3 p-4">
            <p role="status" className="sr-only">Loading</p>
            <div aria-hidden className="skeleton h-24 w-full" />
            <div aria-hidden className="skeleton h-12 w-full" />
          </div>
        </Body>
      </div>
    );
  }

  // Asked once: the first time someone uses the app. Afterwards the answers
  // are remembered (in the browser, or on the account) and edited in My stuff.
  if (!audience || !experience) {
    return <Welcome audience={audience} experience={experience} onDone={() => setJustWelcomed(true)} />;
  }

  return (
    <>
      <Band title="What do you want to make?" size="hero" overlap headingRef={headingRef}>
        <p>Tell us in your own words. We find where at USC to build it, and what you can get for free.</p>
      </Band>
      <Body overlap>
        <form onSubmit={submitIdea} noValidate className="card space-y-5 p-4">
          <div className="space-y-3">
            <label htmlFor={textId} className="label">Describe it in your own words</label>
            <textarea
              id={textId}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={1500}
              aria-invalid={!!fieldError.text}
              aria-describedby={fieldError.text ? errId : undefined}
              placeholder="For example: a small shelf for my plants that hangs on the wall"
              className="field min-h-[96px]"
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
                    className="chip"
                  >
                    {ex.chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} hidden />
              <button type="button" onClick={() => fileRef.current?.click()} className="chip">
                <Camera aria-hidden className="size-5" />
                {image ? "Change the photo" : "Add a photo or sketch"}
              </button>
              {image && (
                <span className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Your photo or sketch" className="size-12 rounded-lg border-[1.5px] border-black object-cover" />
                  <button type="button" onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = ""; }} className="link flex min-h-11 items-center gap-1">
                    <X aria-hidden className="size-4" />
                    Remove photo
                  </button>
                </span>
              )}
            </div>
            {fieldError.photo && <FieldError>{fieldError.photo}</FieldError>}
          </div>

          <p className="flex flex-wrap items-center gap-x-2 border-t-2 border-dashed border-black pt-3">
            <UserRound aria-hidden className="size-5 shrink-0" />
            <span>
              <span className="sr-only">Your profile: </span>
              {AUDIENCE_LABELS[audience]}, {lowerFirst(EXPERIENCE_LABELS[experience])}
            </span>
            <Link href="/me#profile" className="link inline-flex min-h-11 items-center">
              Change<span className="sr-only"> your profile</span>
            </Link>
          </p>

          {error && (
            <div role="alert" className="alert">
              <CircleAlert aria-hidden className="size-5" />
              <p>{error} Your description is still here.</p>
            </div>
          )}

          <button type="submit" className={cn(primaryBtn, "w-full")}>
            {error ? "Try again" : "Find how to build it"}
          </button>
        </form>
      </Body>
      {below}
    </>
  );
}

const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/** The one-time welcome step: who you are and what you have done before. */
function Welcome({ audience, experience, onDone }: { audience: Audience | null; experience: Experience | null; onDone: () => void }) {
  const [a, setA] = useState<Audience | null>(audience);
  const [x, setX] = useState<Experience | null>(experience);
  const [missing, setMissing] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!a || !x) return setMissing(true);
    onDone();
    void saveProfile({ audience: a, experience: x });
  };
  return (
    <section>
      <Band title="Welcome to Forge" size="hero" overlap>
        <p>Tell us what you want to make and we show where at USC to build it. First, two quick things about you.</p>
      </Band>
      <Body overlap>
        <form onSubmit={submit} noValidate className="card space-y-5 p-4">
          <ChoiceChips name="welcome-audience" legend="I am a..." hint="So we can check which spaces you can use." options={AUDIENCES} labels={AUDIENCE_LABELS} value={a} onChange={setA} />
          <ChoiceChips name="welcome-experience" legend="I have..." hint="So the plan starts at your level." options={EXPERIENCES} labels={EXPERIENCE_LABELS} value={x} onChange={setX} />
          {missing && (!a || !x) && <FieldError>Pick one option in each group to continue.</FieldError>}
          <button type="submit" className={cn(primaryBtn, "w-full")}>Continue to my idea</button>
          <p className="text-[15px] text-gray-text">We ask this once. You can change it any time in My stuff.</p>
        </form>
      </Body>
    </section>
  );
}

function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="alert">
      <CircleAlert aria-hidden className="size-4" />
      <span>{children}</span>
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
      <legend className="text-[17px] font-bold">{q.text}</legend>
      <div className="flex flex-wrap gap-2">
        {q.options.map((o) => {
          const checked = value.includes(o.id);
          return (
            <label
              key={o.id}
              className={cn("chip", checked && "chip-on")}
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
    <section aria-busy="true">
      <Band title="Working on it" size="lg">
        <p>{summary ?? idea}</p>
      </Band>
      <Body>
        <p role="status" className="notice font-bold">{lines[i]}...</p>
        {/* Shaped like the plan that is coming: two build tickets. */}
        <div aria-hidden className="space-y-6">
          {[0, 1].map((k) => (
            <div key={k} className="card">
              <div className="ruler" />
              <div className="space-y-3 p-4">
                <div className="skeleton h-6 w-2/3" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-5/6" />
              </div>
              <div className="stub p-4">
                <div className="skeleton h-9 w-1/3" />
              </div>
            </div>
          ))}
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
      </Body>
    </section>
  );
}
