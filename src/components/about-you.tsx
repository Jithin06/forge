"use client";

import { AUDIENCE_LABELS, EXPERIENCE_LABELS } from "@/lib/labels";
import { AUDIENCES, EXPERIENCES } from "@/lib/schemas";
import { ChoiceChips } from "./choice-chips";
import { useAudience, useExperience } from "./profile-store";

export function AudiencePicker({ hint }: { hint?: string }) {
  const [audience, setAudience] = useAudience();
  return (
    <ChoiceChips
      name="audience"
      legend="I am a..."
      hint={hint}
      options={AUDIENCES}
      labels={AUDIENCE_LABELS}
      value={audience}
      onChange={setAudience}
    />
  );
}

export function ExperiencePicker() {
  const [experience, setExperience] = useExperience();
  return (
    <ChoiceChips
      name="experience"
      legend="I have..."
      options={EXPERIENCES}
      labels={EXPERIENCE_LABELS}
      value={experience}
      onChange={setExperience}
    />
  );
}
