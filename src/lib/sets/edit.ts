// Pure rules for editing a logged set (Req 9). No React, no network.
// (Relative imports, not "@/...", so the unit tests can load this file.)

import type { SetRow } from "./group";
import { parseSetInput } from "./validation";

// What the edit panel holds while the user is typing: text, like the form.
export type SetDraft = {
  exerciseId: string;
  reps: string;
  weight: string;
};

export type ValidEdit = { exerciseId: string; reps: number; weightLb: number };

export type EditValidation =
  { ok: true; value: ValidEdit } | { ok: false; error: string };

// Database ids are UUIDs ("123e4567-e89b-12d3-a456-426614174000").
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

// The panel opens filled in with the set's current values.
export function draftFromSet(set: SetRow): SetDraft {
  return {
    exerciseId: set.exerciseId,
    reps: String(set.reps),
    weight: String(set.weightLb),
  };
}

// Checks a draft with the same rules as logging a new set.
export function validateEdit(draft: SetDraft): EditValidation {
  if (!isUuid(draft.exerciseId)) {
    return { ok: false, error: "Choose an exercise." };
  }
  const parsed = parseSetInput(draft.reps, draft.weight);
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    value: {
      exerciseId: draft.exerciseId,
      reps: parsed.value.reps,
      weightLb: parsed.value.weightLb,
    },
  };
}

// Save is only offered when the draft is valid AND differs from the set as it
// is now. (Typing "135.0" over "135" counts as no change.)
export function canSave(
  original: Pick<SetRow, "exerciseId" | "reps" | "weightLb">,
  draft: SetDraft,
): boolean {
  const checked = validateEdit(draft);
  if (!checked.ok) return false;
  return (
    checked.value.exerciseId !== original.exerciseId ||
    checked.value.reps !== original.reps ||
    checked.value.weightLb !== original.weightLb
  );
}
