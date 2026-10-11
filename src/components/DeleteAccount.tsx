"use client";

// The "Delete account" section of the Account page. Two steps: first a button,
// then a warning with a password box. The password is re-checked on the
// server before anything is deleted.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteAccount } from "@/app/account/actions";
import { cleanupLocalData } from "@/lib/account/cleanupLocal";
import { loadStoredTimer } from "@/lib/timer/storage";

export default function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cancel() {
    setOpen(false);
    setPassword("");
    setError(null);
  }

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      // If a rest timer is running, its scheduled push is cancelled as well.
      const { pushMessageId } = loadStoredTimer();
      const result = await deleteAccount({ password, pushMessageId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await cleanupLocalData();
      router.replace("/login?deleted=1");
      router.refresh();
    } catch {
      setError("No connection. Check your signal and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="delete-heading" className="flex flex-col gap-3">
      <h2 id="delete-heading" className="text-lg font-semibold">
        Delete account
      </h2>

      {!open ? (
        <>
          <p className="text-sm opacity-80">
            Permanently delete your account and everything you have logged.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-12 rounded-lg border border-red-600 text-base font-semibold text-red-600"
          >
            Delete account
          </button>
        </>
      ) : (
        <form
          onSubmit={handleDelete}
          className="flex flex-col gap-3 rounded-lg border border-red-600/60 bg-red-600/5 p-3"
        >
          <p className="text-sm font-medium">
            This permanently deletes your account and all your workouts and
            sets. This can&apos;t be undone. There is no way to get them back.
          </p>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Enter your password to confirm
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="h-12 rounded-lg border border-black/20 bg-transparent px-3 text-base dark:border-white/30"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || password.length === 0}
            className="h-12 rounded-lg bg-red-600 text-base font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Deleting..." : "Delete my account"}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="h-12 rounded-lg bg-black/5 text-base font-semibold disabled:opacity-60 dark:bg-white/10"
          >
            Cancel
          </button>
        </form>
      )}
    </section>
  );
}
