import Link from "next/link";

// Plain-language privacy note. It can be read without signing in. Keep it in
// step with what the app really does (see the PRD, Section 13).
export default function PrivacyPage() {
  const heading = "text-lg font-semibold";
  const list = "list-disc space-y-1 pl-5 text-base";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-5 p-4 pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Privacy</h1>
        <Link
          href="/"
          className="flex min-h-11 items-center font-medium underline"
        >
          Back
        </Link>
      </header>

      <p className="text-base">
        SetTimer keeps only what it needs to log your sets and time your rests.
        Here is exactly what that is.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className={heading}>What we keep</h2>
        <ul className={list}>
          <li>Your username.</li>
          <li>
            Your password, as a scrambled (hashed) value. We never store or see
            the password itself.
          </li>
          <li>
            The workouts and sets you log: the date, exercise, reps and weight.
          </li>
          <li>Your rest-length setting.</li>
          <li>
            To send the rest alert to a locked phone, an address from your
            phone&apos;s browser. It stays on your phone and inside a short
            scheduled message that lasts about as long as your rest.
          </li>
          <li>
            Simple usage events (for example, that a set was logged or a timer
            finished). They are tagged with a random ID, never your username or
            your workout details.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={heading}>What we do not collect</h2>
        <ul className={list}>
          <li>No email address, phone number or location.</li>
          <li>No payment details, contacts or photos.</li>
          <li>We do not show ads or sell your data.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={heading}>Who helps run it</h2>
        <ul className={list}>
          <li>Supabase stores your account and workouts.</li>
          <li>Vercel hosts the app.</li>
          <li>Upstash holds the rest alert until your rest ends.</li>
          <li>PostHog records the usage events.</li>
          <li>Apple and Google deliver notifications to your phone.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={heading}>Forgotten passwords</h2>
        <p className="text-base">
          Because we do not collect an email address, we cannot reset a
          forgotten password. Keep it somewhere safe.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={heading}>Deleting your data</h2>
        <p className="text-base">
          We keep your data until you delete your account. To delete it, open{" "}
          <strong>Account</strong>, then <strong>Delete account</strong>. Your
          username, password, settings and every workout and set are removed
          right away, and any pending rest alert is cancelled.
        </p>
        <p className="text-base">
          The usage events described above may stay in our analytics tool. They
          carry only a random ID, with no name, email or workout details.
        </p>
      </section>

      <p className="text-sm opacity-70">Last updated: October 11, 2026</p>
    </main>
  );
}
