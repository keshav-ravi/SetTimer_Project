"use client";

// The "Edit set" panel (Req 9): change a logged set's exercise, weight or
// reps, or delete it. It sits on top of the app like the other panels: close
// it with Cancel or Escape. Save is only offered when something really
// changed, and Delete asks "are you sure?" inside the panel.
import { useState } from "react";
import ExercisePicker from "@/components/ExercisePicker";
import Stepper from "@/components/Stepper";
import {
  canSave,
  draftFromSet,
  validateEdit,
  type SetDraft,
} from "@/lib/sets/edit";
import { formatSet, type SetRow } from "@/lib/sets/group";
import type { ExerciseOption } from "@/lib/sets/queries";
import { REPS_STEP, WEIGHT_STEP } from "@/lib/sets/steppers";
import {
  REPS_MAX,
  REPS_MIN,
  WEIGHT_MAX,
  WEIGHT_MIN,
} from "@/lib/sets/validation";
import { useDialog } from "@/lib/useDialog";

export default function SetEditor({
  set,
  setNumber,
  exercises,
  onExercisesChange,
  busy,
  error,
  onSave,
  onDelete,
  onClose,
}: {
  set: SetRow;
  setNumber: number; // "Set 2" within its exercise
  exercises: ExerciseOption[];
  onExercisesChange: (next: ExerciseOption[]) => void;
  busy: boolean;
  error: string | null;
  onSave: (draft: SetDraft) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SetDraft>(() => draftFromSet(set));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Focus moves into the panel once when it opens; Escape closes it, but not
  // while a save or delete is in progress.
  const dialogRef = useDialog<HTMLDivElement>(onClose, busy);

  const changed = canSave(set, draft);
  // Shown only once the user has typed something that isn't allowed.
  const problem = validateEdit(draft);
  const problemText = problem.ok ? null : problem.error;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-set-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-background p-6 outline-none pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-sm flex-col gap-5">
        <div>
          <h2 id="edit-set-title" className="text-2xl font-bold">
            Edit set
          </h2>
          <p className="mt-1 text-base opacity-80">
            {set.exerciseName}, set {setNumber}: {formatSet(set)}
          </p>
        </div>

        <ExercisePicker
          exercises={exercises}
          selectedId={draft.exerciseId}
          onSelect={(exerciseId) => setDraft({ ...draft, exerciseId })}
          onExercisesChange={onExercisesChange}
          disabled={busy}
        />

        <Stepper
          label="Weight"
          unit="lb"
          value={draft.weight}
          onChange={(weight) => setDraft({ ...draft, weight })}
          step={WEIGHT_STEP}
          min={WEIGHT_MIN}
          max={WEIGHT_MAX}
          inputMode="decimal"
        />
        <Stepper
          label="Reps"
          value={draft.reps}
          onChange={(reps) => setDraft({ ...draft, reps })}
          step={REPS_STEP}
          min={REPS_MIN}
          max={REPS_MAX}
          inputMode="numeric"
        />

        <p
          role="alert"
          aria-live="polite"
          className="min-h-5 text-sm font-medium text-red-600"
        >
          {error ?? problemText}
        </p>

        {!confirmingDelete ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onSave(draft)}
              disabled={!changed || busy}
              className="h-14 rounded-xl bg-foreground text-lg font-bold text-background disabled:opacity-40"
            >
              {busy ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-14 rounded-xl bg-black/5 text-lg font-semibold disabled:opacity-60 dark:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
              className="h-12 rounded-xl text-base font-semibold text-red-600 disabled:opacity-50"
            >
              Delete set
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-red-600/60 bg-red-600/5 p-3">
            <p className="text-sm font-medium">
              Delete this set? This can&apos;t be undone.
            </p>
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="h-14 rounded-xl bg-red-600 text-lg font-bold text-white disabled:opacity-60"
            >
              {busy ? "Deleting..." : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={busy}
              className="h-12 rounded-xl bg-black/5 text-base font-semibold disabled:opacity-60 dark:bg-white/10"
            >
              Keep
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
