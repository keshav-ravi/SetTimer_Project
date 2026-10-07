"use server";

import { redirect } from "next/navigation";
import {
  usernameToEmail,
  validatePassword,
  validateUsername,
} from "@/lib/auth/username";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  // Set after a successful sign-up so the browser can record the sign_up event.
  signedUpUserId?: string;
};

// One action for both tabs; the hidden "mode" field says which one was used.
export async function authenticate(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = formData.get("mode") === "signUp" ? "signUp" : "signIn";
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  // Same rules on the server as in the form; never trust the browser alone.
  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };
  if (mode === "signUp") {
    const passwordError = validatePassword(password);
    if (passwordError) return { error: passwordError };
  }

  const supabase = await createClient();
  const email = usernameToEmail(username);

  if (mode === "signUp") {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return {
        error: /already registered/i.test(error.message)
          ? "That username is taken."
          : "Could not create the account. Please try again.",
      };
    }
    return { signedUpUserId: data.user?.id };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Wrong username or password." };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
