"use client";

// Shared behavior for the panels that sit on top of the app (Edit set, Rest
// length, Install guide): focus moves into the panel ONCE when it opens, and
// Escape closes it.
//
// Why this is its own hook: the screen behind these panels redraws many times
// a second (the rest-timer clock), and callers pass a fresh `onClose` function
// on every redraw. If the "move focus" code depended on `onClose`, it would run
// again on every redraw and keep stealing focus, which on a phone closes the
// exercise dropdown and the keyboard as soon as they open. So the effect below
// runs only once, and reads the latest `onClose` through a ref.
import { useEffect, useRef } from "react";
import { createDialogStack } from "./dialogStack";

// Shared by every panel: Escape only closes the one on top.
const dialogStack = createDialogStack();

export function useDialog<T extends HTMLElement>(
  onClose: () => void,
  closeDisabled = false,
) {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);

  // Keep the refs pointing at the latest values (this changes no focus).
  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  });

  // Runs once, when the panel opens.
  useEffect(() => {
    // Focus the panel itself (not a button), so screen readers announce its
    // title and no button looks "selected". Tapping inside moves focus freely.
    dialogRef.current?.focus();
    const id = Symbol("dialog");
    dialogStack.open(id);
    const onKey = (event: KeyboardEvent) => {
      // Only the top panel reacts, so Escape never closes two at once.
      if (
        event.key === "Escape" &&
        dialogStack.isTop(id) &&
        !closeDisabledRef.current
      ) {
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      dialogStack.close(id);
    };
  }, []);

  return dialogRef;
}
