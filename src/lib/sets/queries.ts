// Server-side database reads/writes for exercises and sets. Every function
// takes the signed-in user's Supabase client, so Row Level Security applies:
// even a bug here cannot reveal or change another user's rows.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SetRow } from "./group";
import { summarizeDay, type HistoryDay } from "./history";

export type ExerciseOption = { id: string; name: string };

// Shape of a row as the database returns it (snake_case, nested exercise).
type DbSet = {
  id: string;
  exercise_id: string;
  reps: number;
  weight_lb: number | string; // numeric columns can arrive as numbers or strings
  created_at: string;
  exercises: { name: string } | null;
};

function toSetRow(row: DbSet): SetRow {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercises?.name ?? "Unknown exercise",
    reps: row.reps,
    weightLb: Number(row.weight_lb),
    createdAt: row.created_at,
  };
}

export async function getExercises(
  supabase: SupabaseClient,
): Promise<ExerciseOption[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name")
    .order("name");
  if (error) throw new Error("Could not load exercises.");
  return (data ?? []) as ExerciseOption[];
}

// The id of today's workout for this user, or null if none exists yet.
export async function getWorkoutId(
  supabase: SupabaseClient,
  localDate: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id")
    .eq("workout_date", localDate)
    .maybeSingle();
  if (error) throw new Error("Could not load today's workout.");
  return (data as { id: string } | null)?.id ?? null;
}

export async function getSetsForWorkout(
  supabase: SupabaseClient,
  workoutId: string | null,
): Promise<SetRow[]> {
  if (!workoutId) return [];
  const { data, error } = await supabase
    .from("sets")
    .select("id, exercise_id, reps, weight_lb, created_at, exercises(name)")
    .eq("workout_id", workoutId)
    .order("created_at");
  if (error) throw new Error("Could not load today's sets.");
  return ((data ?? []) as unknown as DbSet[]).map(toSetRow);
}

// The exercise of the most recent set ever logged, used to preselect the
// dropdown. null for a brand-new user.
export async function getLastUsedExerciseId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("sets")
    .select("exercise_id")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error("Could not load your last exercise.");
  const rows = (data ?? []) as { exercise_id: string }[];
  return rows[0]?.exercise_id ?? null;
}

// Shape of a workout row with its sets and exercise names nested inside.
type DbHistoryWorkout = {
  workout_date: string;
  sets: { created_at: string; exercises: { name: string } | null }[];
};

export const HISTORY_PAGE_SIZE = 30;

// The user's workouts, newest first, one page at a time. `beforeDate` is the
// oldest date already shown, so the next page continues from there. Workouts
// with no sets (there shouldn't be any) are skipped.
export async function getHistory(
  supabase: SupabaseClient,
  beforeDate?: string,
): Promise<{ days: HistoryDay[]; hasMore: boolean }> {
  let query = supabase
    .from("workouts")
    .select("workout_date, sets(created_at, exercises(name))")
    .order("workout_date", { ascending: false })
    // One extra row tells us whether another page exists.
    .limit(HISTORY_PAGE_SIZE + 1);
  if (beforeDate) query = query.lt("workout_date", beforeDate);

  const { data, error } = await query;
  if (error) throw new Error("Could not load your history.");

  const rows = (data ?? []) as unknown as DbHistoryWorkout[];
  const hasMore = rows.length > HISTORY_PAGE_SIZE;
  const days = rows
    .slice(0, HISTORY_PAGE_SIZE)
    .map((row) =>
      summarizeDay(
        row.workout_date,
        row.sets.map((s) => ({
          exerciseName: s.exercises?.name ?? "Unknown exercise",
          createdAt: s.created_at,
        })),
      ),
    )
    .filter((day) => day.setCount > 0);
  return { days, hasMore };
}
