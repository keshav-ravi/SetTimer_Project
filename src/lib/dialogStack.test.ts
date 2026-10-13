import { describe, expect, it } from "vitest";
import { createDialogStack } from "./dialogStack";

describe("createDialogStack", () => {
  it("a lone open panel is the top one", () => {
    const stack = createDialogStack();
    const a = Symbol("a");
    stack.open(a);
    expect(stack.isTop(a)).toBe(true);
  });

  it("only the most recently opened panel is on top", () => {
    const stack = createDialogStack();
    const editor = Symbol("editor");
    const picker = Symbol("picker");
    stack.open(editor);
    stack.open(picker);
    expect(stack.isTop(picker)).toBe(true);
    expect(stack.isTop(editor)).toBe(false);
  });

  it("closing the top panel makes the one underneath the top again", () => {
    const stack = createDialogStack();
    const editor = Symbol("editor");
    const picker = Symbol("picker");
    stack.open(editor);
    stack.open(picker);
    stack.close(picker);
    expect(stack.isTop(editor)).toBe(true);
    expect(stack.isTop(picker)).toBe(false);
  });

  it("closing a panel that is not on top leaves the top one alone", () => {
    const stack = createDialogStack();
    const a = Symbol("a");
    const b = Symbol("b");
    stack.open(a);
    stack.open(b);
    stack.close(a);
    expect(stack.isTop(b)).toBe(true);
  });

  it("nothing is on top when nothing is open", () => {
    const stack = createDialogStack();
    const a = Symbol("a");
    expect(stack.isTop(a)).toBe(false);
    stack.open(a);
    stack.close(a);
    expect(stack.isTop(a)).toBe(false);
  });

  it("opening the same panel twice does not duplicate it", () => {
    const stack = createDialogStack();
    const a = Symbol("a");
    const b = Symbol("b");
    stack.open(a);
    stack.open(b);
    stack.open(a);
    expect(stack.isTop(a)).toBe(true);
    stack.close(a);
    expect(stack.isTop(b)).toBe(true);
  });
});
