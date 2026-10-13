"use client";

// A small form for typing an exercise name. It is used inside the picker
// panel, both for adding a new exercise and for renaming one of your own.
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  MAX_EXERCISE_NAME_LENGTH,
  cleanExerciseName,
  validateExerciseName,
} from "@/lib/sets/exerciseName";

export default function ExerciseForm({
  title,
  initialName,
  submitLabel,
  busyLabel,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  title: string;
  initialName: string;
  submitLabel: string; // "Add exercise" / "Save name"
  busyLabel: string; // "Adding..." / "Saving..."
  busy: boolean;
  error: string | null; // a problem reported by the server
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Put the cursor in the box once when the form appears, so the keyboard
  // opens and the user can type straight away. (No dependencies, so it never
  // runs again and never steals focus back.)
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Only complain once something has been typed.
  const typed = cleanExerciseName(name) !== "";
  const localProblem = typed ? validateExerciseName(name) : null;
  const canSubmit = typed && localProblem === null && !busy;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (canSubmit) onSubmit(cleanExerciseName(name));
  }

  // Escape goes back to the list instead of closing the whole picker.
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && !busy) {
      // Mark it handled so the panel's own Escape handling skips it.
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-4 p-4"
    >
      <h3 className="text-xl font-bold">{title}</h3>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Exercise name
        <input
          ref={inputRef}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={busy}
          autoCapitalize="words"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          className="h-14 rounded-lg border border-black/20 bg-transparent px-3 text-lg font-normal dark:border-white/30"
        />
      </label>
      <p className="-mt-2 text-sm opacity-70">
        Up to {MAX_EXERCISE_NAME_LENGTH} characters. Other users can&apos;t see
        it.
      </p>

      <p
        role="alert"
        aria-live="polite"
        className="min-h-5 text-sm font-medium text-red-600"
      >
        {error ?? localProblem}
      </p>

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="h-14 rounded-xl bg-accent text-lg font-bold text-on-accent disabled:opacity-40"
        >
          {busy ? busyLabel : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="h-14 rounded-xl bg-black/5 text-lg font-semibold disabled:opacity-60 dark:bg-white/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
