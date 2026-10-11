"use client";

// The chosen day's sets, grouped by exercise. Each row can be tapped to edit
// or delete that set (Req 9), and "Delete last set" is the one-tap undo
// (Req 9a).
import {
  formatSet,
  groupSetsByExercise,
  latestSet,
  type SetRow,
} from "@/lib/sets/group";

export default function DaySets({
  title,
  sets,
  loading,
  onDeleteLast,
  onEdit,
  busy,
}: {
  title: string; // "Today", "Yesterday", "Sun, Oct 11"...
  sets: SetRow[];
  loading: boolean;
  onDeleteLast: () => void;
  onEdit: (set: SetRow, setNumber: number) => void;
  busy: boolean;
}) {
  const groups = groupSetsByExercise(sets);
  const last = latestSet(sets);

  return (
    <section aria-labelledby="day-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="day-heading" className="text-lg font-semibold">
          {title}
        </h2>
        {last && !loading && (
          <button
            type="button"
            onClick={onDeleteLast}
            disabled={busy}
            className="min-h-11 rounded-lg px-3 text-sm font-medium text-red-600 disabled:opacity-50"
          >
            Delete last set
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm opacity-70">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm opacity-70">No sets logged for this day.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((group) => (
            <li
              key={group.exerciseId}
              className="rounded-lg bg-black/5 p-3 dark:bg-white/10"
            >
              <p className="font-medium">{group.exerciseName}</p>
              <ol className="mt-1 text-sm">
                {group.sets.map((set, index) => (
                  <li key={set.id}>
                    <button
                      type="button"
                      onClick={() => onEdit(set, index + 1)}
                      disabled={busy}
                      aria-label={`Edit ${group.exerciseName} set ${index + 1}: ${formatSet(set)}`}
                      className="flex min-h-11 w-full items-center justify-between rounded-md px-1 text-left disabled:opacity-60"
                    >
                      <span>
                        Set {index + 1}: {formatSet(set)}
                      </span>
                      <span aria-hidden="true" className="pl-2 opacity-50">
                        ›
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
