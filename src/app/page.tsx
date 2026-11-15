import { AudiencePicker, ExperiencePicker } from "@/components/about-you";

export default function AskPage() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="ask-title" className="space-y-3">
        <h1 id="ask-title" className="text-[40px] font-bold leading-[1.15] md:text-[56px]">
          What do you want to make?
        </h1>
        <p className="text-[18px]">
          Describe it in your own words. Forge will show where at USC you can build it, what it
          takes to get in, and what it will cost.
        </p>
      </section>
      <section aria-label="About you" className="space-y-6">
        <AudiencePicker />
        <ExperiencePicker />
      </section>
    </div>
  );
}
