// Remembers which panels are open, in the order they opened, so that
// pressing Escape closes ONLY the top one. (A panel can open on top of
// another: the exercise picker opens over the Edit set panel.)
// Pure, so it can be unit tested without a browser.

export type DialogStack = {
  open: (id: symbol) => void;
  close: (id: symbol) => void;
  isTop: (id: symbol) => boolean;
};

export function createDialogStack(): DialogStack {
  let ids: symbol[] = [];
  return {
    open: (id) => {
      ids = [...ids.filter((x) => x !== id), id];
    },
    close: (id) => {
      ids = ids.filter((x) => x !== id);
    },
    isTop: (id) => ids.length > 0 && ids[ids.length - 1] === id,
  };
}
