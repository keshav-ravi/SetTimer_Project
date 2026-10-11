import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage(props: PageProps<"/login">) {
  // After deleting an account the user is sent here as /login?deleted=1.
  const { deleted } = await props.searchParams;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">SetTimer</h1>
        <p className="mt-1 text-base opacity-70">
          Log a set. The rest timer starts itself.
        </p>
      </div>

      {deleted === "1" && (
        <p
          role="status"
          className="rounded-lg border border-green-600/50 bg-green-600/10 p-3 text-sm font-medium"
        >
          Your account and data were deleted.
        </p>
      )}

      <LoginForm />

      <Link
        href="/privacy"
        className="flex min-h-11 items-center justify-center text-sm font-medium underline"
      >
        Privacy
      </Link>
    </main>
  );
}
