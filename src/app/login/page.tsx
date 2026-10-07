import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">SetTimer</h1>
        <p className="mt-1 text-base opacity-70">
          Log a set. The rest timer starts itself.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
