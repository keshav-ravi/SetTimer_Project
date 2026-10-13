"use client";

// The exercise picker (Req 13). A button shows the current exercise; tapping
// it opens a full-screen panel with a search box and the list. Used on the
// logging screen and inside the Edit set panel.
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { filterExercises } from "@/lib/sets/exerciseSearch";
import type { ExerciseOption } from "@/lib/sets/queries";
import { useDialog } from "@/lib/useDialog";

function ExercisePickerPanel({
  exercises,
  selectedId,
  onSelect,
  onClose,
}: {
  exercises: ExerciseOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  // Focus moves into the panel once; Escape closes it (only if it is the top
  // panel, which matters when it opens over the Edit set panel).
  const dialogRef = useDialog<HTMLDivElement>(onClose);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Put the cursor in the search box once when the panel opens, so the
  // keyboard appears and the user can type straight away. (This runs after
  // useDialog's focus, so the search box ends up focused. It has no
  // dependencies, so it never runs again and never steals focus back.)
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const results = filterExercises(exercises, search);

  function choose(id: string) {
    onSelect(id);
    onClose();
  }

  // Pressing Enter/Go on the keyboard picks the best match.
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (results[0]) choose(results[0].id);
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[60] flex flex-col bg-background outline-none"
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <h2 id={titleId} className="text-2xl font-bold">
          Choose exercise
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-lg px-3 text-base font-semibold underline"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 pb-2" role="search">
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search exercises"
          placeholder="Search"
          inputMode="search"
          enterKeyHint="go"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          className="h-14 w-full rounded-lg border border-black/20 bg-transparent px-3 text-lg dark:border-white/30"
        />
      </form>

      <p aria-live="polite" className="px-4 pb-2 text-sm opacity-70">
        {results.length === 0
          ? `No exercise matches "${search.trim()}".`
          : `${results.length} ${results.length === 1 ? "exercise" : "exercises"}`}
      </p>

      <ul className="flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {results.map((exercise) => {
          const selected = exercise.id === selectedId;
          return (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => choose(exercise.id)}
                aria-current={selected ? "true" : undefined}
                className={`flex min-h-12 w-full items-center justify-between rounded-lg px-3 text-left text-lg ${
                  selected ? "bg-black/5 font-semibold dark:bg-white/10" : ""
                }`}
              >
                <span>{exercise.name}</span>
                {selected && <span aria-label="selected">✓</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ExercisePicker({
  exercises,
  selectedId,
  onSelect,
  disabled = false,
}: {
  exercises: ExerciseOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const labelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const selected = exercises.find((exercise) => exercise.id === selectedId);

  // When the panel closes, put focus back on the button that opened it.
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <div className="flex flex-col gap-1 text-sm font-medium">
      <span id={labelId}>Exercise</span>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-labelledby={labelId}
        className="flex h-14 items-center justify-between gap-2 rounded-lg border border-black/20 bg-transparent px-3 text-left text-lg font-normal disabled:opacity-60 dark:border-white/30"
      >
        <span className="truncate">
          {selected?.name ?? "Choose an exercise"}
        </span>
        <span aria-hidden="true" className="opacity-60">
          ▾
        </span>
      </button>

      {open && (
        <ExercisePickerPanel
          exercises={exercises}
          selectedId={selectedId}
          onSelect={onSelect}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
