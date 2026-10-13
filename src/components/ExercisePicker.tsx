"use client";

// The exercise picker (Req 13, Req 8). A button shows the current exercise;
// tapping it opens a full-screen panel with a search box and the list. From
// the panel the user can add their own exercise and rename the ones they
// added. Used on the logging screen and inside the Edit set panel.
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createExercise, renameExercise } from "@/app/exercises/actions";
import ExerciseForm from "@/components/ExerciseForm";
import { track } from "@/lib/analytics";
import { cleanExerciseName, findDuplicate } from "@/lib/sets/exerciseName";
import { splitExercises } from "@/lib/sets/exerciseGroups";
import { filterExercises } from "@/lib/sets/exerciseSearch";
import type { ExerciseOption } from "@/lib/sets/queries";
import { useDialog } from "@/lib/useDialog";

const NETWORK_ERROR = "No connection. Check your signal and try again.";

// What the panel is showing: the list, the "add" form, or a "rename" form.
type View =
  | { kind: "list" }
  | { kind: "add"; name: string }
  | { kind: "rename"; exercise: ExerciseOption };

function ExerciseRow({
  exercise,
  selected,
  onChoose,
  onRename,
}: {
  exercise: ExerciseOption;
  selected: boolean;
  onChoose: () => void;
  onRename: () => void;
}) {
  return (
    <li className="flex items-center gap-1">
      <button
        type="button"
        onClick={onChoose}
        aria-current={selected ? "true" : undefined}
        className={`flex min-h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-3 text-left text-lg ${
          selected ? "bg-black/5 font-semibold dark:bg-white/10" : ""
        }`}
      >
        <span className="truncate">{exercise.name}</span>
        {selected && <span aria-label="selected">✓</span>}
      </button>
      {exercise.isCustom && (
        <button
          type="button"
          onClick={onRename}
          aria-label={`Rename ${exercise.name}`}
          className="min-h-12 shrink-0 rounded-lg px-3 text-sm font-medium underline"
        >
          Rename
        </button>
      )}
    </li>
  );
}

function ExercisePickerPanel({
  exercises,
  selectedId,
  onSelect,
  onExercisesChange,
  onClose,
}: {
  exercises: ExerciseOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onExercisesChange: (next: ExerciseOption[]) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  // Focus moves into the panel once; Escape closes it (only if it is the top
  // panel, which matters when it opens over the Edit set panel).
  const dialogRef = useDialog<HTMLDivElement>(onClose);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>({ kind: "list" });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Put the cursor in the search box once when the panel opens, so the
  // keyboard appears and the user can type straight away. (This runs after
  // useDialog's focus, so the search box ends up focused. It has no
  // dependencies, so it never runs again and never steals focus back.)
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const searching = cleanExerciseName(search) !== "";
  const results = filterExercises(exercises, search);
  const { mine, presets } = splitExercises(exercises);
  // Offer "Add <what was typed>" unless an exercise with that name exists.
  const canOfferAdd = searching && findDuplicate(search, exercises) === null;

  function choose(id: string) {
    onSelect(id);
    onClose();
  }

  function openAdd(name: string) {
    setFormError(null);
    setView({ kind: "add", name });
  }

  // Pressing Enter/Go on the keyboard picks the best match, or, when nothing
  // matches, offers to add what was typed.
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (results[0]) choose(results[0].id);
    else if (searching) openAdd(cleanExerciseName(search));
  }

  async function handleAdd(name: string) {
    setBusy(true);
    setFormError(null);
    try {
      const result = await createExercise(name);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      onExercisesChange(result.exercises);
      // Analytics: only the event, never the name the user typed.
      if (!result.existed) track("exercise_created");
      choose(result.exercise.id);
    } catch {
      setFormError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(exercise: ExerciseOption, name: string) {
    setBusy(true);
    setFormError(null);
    try {
      const result = await renameExercise({ exerciseId: exercise.id, name });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      onExercisesChange(result.exercises);
      setView({ kind: "list" });
    } catch {
      setFormError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  const rowFor = (exercise: ExerciseOption) => (
    <ExerciseRow
      key={exercise.id}
      exercise={exercise}
      selected={exercise.id === selectedId}
      onChoose={() => choose(exercise.id)}
      onRename={() => {
        setFormError(null);
        setView({ kind: "rename", exercise });
      }}
    />
  );

  const addRowClass =
    "flex min-h-12 w-full items-center gap-2 rounded-lg px-3 text-left text-lg font-semibold";

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

      {view.kind === "list" ? (
        <>
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
            {searching && results.length === 0
              ? `No exercise matches "${search.trim()}".`
              : `${results.length} ${results.length === 1 ? "exercise" : "exercises"}`}
          </p>

          <div className="flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {/* Add your own: always one tap away, and pre-filled from the search */}
            {canOfferAdd ? (
              <button
                type="button"
                onClick={() => openAdd(cleanExerciseName(search))}
                className={addRowClass}
              >
                <span aria-hidden="true">+</span>
                <span className="truncate">
                  Add &ldquo;{cleanExerciseName(search)}&rdquo;
                </span>
              </button>
            ) : (
              !searching && (
                <button
                  type="button"
                  onClick={() => openAdd("")}
                  className={addRowClass}
                >
                  <span aria-hidden="true">+</span>
                  <span>Add new exercise</span>
                </button>
              )
            )}

            {searching ? (
              // While searching: one list, best matches first.
              <ul>{results.map(rowFor)}</ul>
            ) : (
              <>
                {mine.length > 0 && (
                  <section aria-label="My exercises">
                    <h3 className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide opacity-60">
                      My exercises
                    </h3>
                    <ul>{mine.map(rowFor)}</ul>
                  </section>
                )}
                <section aria-label="Exercises">
                  {mine.length > 0 && (
                    <h3 className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide opacity-60">
                      Exercises
                    </h3>
                  )}
                  <ul>{presets.map(rowFor)}</ul>
                </section>
              </>
            )}
          </div>
        </>
      ) : view.kind === "add" ? (
        <ExerciseForm
          title="New exercise"
          initialName={view.name}
          submitLabel="Add exercise"
          busyLabel="Adding..."
          busy={busy}
          error={formError}
          onSubmit={handleAdd}
          onCancel={() => setView({ kind: "list" })}
        />
      ) : (
        <ExerciseForm
          title="Rename exercise"
          initialName={view.exercise.name}
          submitLabel="Save name"
          busyLabel="Saving..."
          busy={busy}
          error={formError}
          onSubmit={(name) => handleRename(view.exercise, name)}
          onCancel={() => setView({ kind: "list" })}
        />
      )}
    </div>
  );
}

export default function ExercisePicker({
  exercises,
  selectedId,
  onSelect,
  onExercisesChange,
  disabled = false,
}: {
  exercises: ExerciseOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  // Called with the fresh list after an exercise is added or renamed.
  onExercisesChange: (next: ExerciseOption[]) => void;
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
          onExercisesChange={onExercisesChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
