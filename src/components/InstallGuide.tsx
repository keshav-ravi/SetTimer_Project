"use client";

// Full-screen "add to Home Screen" instructions for iPhone. Shown once after
// sign-in (see SetupFlow) and reopened from the setup card. It is a modal
// dialog: it sits on top of the app, can be closed with a button or Escape.
import { useDialog } from "@/lib/useDialog";

// Simple inline icons so the steps are easy to recognise on the phone.
function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
      <path d="M6 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function Step({
  number,
  icon,
  children,
}: {
  number: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl bg-black/5 p-4 dark:bg-white/10">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">
        {number}
      </span>
      <div className="flex-1 text-base">{children}</div>
      <span className="shrink-0 opacity-70">{icon}</span>
    </li>
  );
}

export default function InstallGuide({ onClose }: { onClose: () => void }) {
  // Focus moves into the dialog once when it opens; Escape closes it.
  const dialogRef = useDialog<HTMLDivElement>(onClose);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-background p-6 outline-none pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-sm flex-col gap-5">
        <div>
          <h2 id="install-title" className="text-2xl font-bold">
            Install Rep Rest
          </h2>
          <p className="mt-2 text-base opacity-80">
            On iPhone, rest alerts only reach you with your phone locked when
            Rep Rest is on your Home Screen. It takes about 20 seconds.
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          <Step number={1} icon={<ShareIcon />}>
            Tap the <strong>Share</strong> button at the bottom of Safari.
          </Step>
          <Step number={2} icon={<AddIcon />}>
            Scroll down and tap <strong>Add to Home Screen</strong>, then{" "}
            <strong>Add</strong>.
          </Step>
          <Step number={3} icon={null}>
            Open <strong>Rep Rest</strong> from your Home Screen. You will sign
            in once more there, because the app keeps its own login.
          </Step>
        </ol>

        <p className="text-sm opacity-70">Needs iOS 16.4 or later.</p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-14 rounded-xl bg-accent text-lg font-bold text-on-accent"
          >
            Got it
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 text-base font-medium underline"
          >
            I&apos;ll do it later
          </button>
        </div>
      </div>
    </div>
  );
}
