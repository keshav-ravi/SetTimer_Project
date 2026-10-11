"use client";

// Today's sets, grouped by exercise, with the "delete last set" button (Req 9a).
import { formatSet, groupSetsByExercise, latestSet, type SetRow } from "@/lib/sets/group";

export default function TodaySets({
  sets,
  onDeleteLast,
  busy,
}: {
  sets: SetRow[];
  onDeleteLast: () => void;
  busy: boolean;
}) {
  const groups = groupSetsByExercise(sets);
  const last = latestSet(sets);

  return (
    <section aria-labelledby="today-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="today-heading" className="text-lg font-semibold">
          Today
        </h2>
        {last && (
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

      {groups.length === 0 ? (
        <p className="text-sm opacity-70">No sets logged yet today.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((group) => (
            <li key={group.exerciseId} className="rounded-lg bg-black/5 p-3 dark:bg-white/10">
              <p className="font-medium">{group.exerciseName}</p>
              <ol className="mt-1 text-sm">
                {group.sets.map((set, index) => (
                  <li key={set.id}>
                    Set {index + 1}: {formatSet(set)}
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
