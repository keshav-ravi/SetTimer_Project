"use client";

// One form with two tabs: Sign in and Create account.
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate, type AuthState } from "@/app/login/actions";
import { identifyUser, track } from "@/lib/analytics";
import { PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from "@/lib/auth/username";

const initialState: AuthState = {};

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [state, formAction, pending] = useActionState(authenticate, initialState);

  // After a successful sign-up: record the event (user id only), then go home.
  useEffect(() => {
    if (state.signedUpUserId) {
      identifyUser(state.signedUpUserId);
      track("sign_up");
      router.replace("/");
      router.refresh();
    }
  }, [state.signedUpUserId, router]);

  const tab = (value: "signIn" | "signUp", label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={`min-h-12 flex-1 rounded-lg text-base font-medium ${
        mode === value
          ? "bg-foreground text-background"
          : "bg-black/5 dark:bg-white/10"
      }`}
    >
      {label}
    </button>
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex gap-2">
        {tab("signIn", "Sign in")}
        {tab("signUp", "Create account")}
      </div>

      <input type="hidden" name="mode" value={mode} />

      <label className="flex flex-col gap-1 text-sm font-medium">
        Username
        <input
          name="username"
          type="text"
          required
          minLength={USERNAME_MIN}
          maxLength={USERNAME_MAX}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          className="min-h-12 rounded-lg border border-black/20 bg-transparent px-3 text-base dark:border-white/30"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={mode === "signUp" ? PASSWORD_MIN : undefined}
          autoComplete={mode === "signUp" ? "new-password" : "current-password"}
          className="min-h-12 rounded-lg border border-black/20 bg-transparent px-3 text-base dark:border-white/30"
        />
      </label>

      {mode === "signUp" && (
        <p className="text-sm opacity-70">
          Pick a username ({USERNAME_MIN}-{USERNAME_MAX} letters, numbers or
          underscores) and a password of at least {PASSWORD_MIN} characters.
          There is no password reset, so keep it somewhere safe.
        </p>
      )}

      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-lg bg-foreground text-base font-semibold text-background disabled:opacity-60"
      >
        {pending ? "Please wait..." : mode === "signUp" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
