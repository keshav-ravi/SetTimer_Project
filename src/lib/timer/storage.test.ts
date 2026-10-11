import { describe, expect, it } from "vitest";
import { parseStoredTimer } from "./storage";

const idle = { timer: { status: "idle" }, pushMessageId: null };

describe("parseStoredTimer", () => {
  it("restores a running timer and its push id", () => {
    const raw = JSON.stringify({
      timer: { status: "running", endTime: 1234567890 },
      pushMessageId: "msg_abc-123",
    });
    expect(parseStoredTimer(raw)).toEqual({
      timer: { status: "running", endTime: 1234567890 },
      pushMessageId: "msg_abc-123",
    });
  });

  it("keeps a running timer even when there is no push id", () => {
    const raw = JSON.stringify({ timer: { status: "running", endTime: 5 } });
    expect(parseStoredTimer(raw)).toEqual({
      timer: { status: "running", endTime: 5 },
      pushMessageId: null,
    });
  });

  it("returns idle for nothing stored, an idle timer, or corrupt data", () => {
    expect(parseStoredTimer(null)).toEqual(idle);
    expect(parseStoredTimer("")).toEqual(idle);
    expect(parseStoredTimer("{not json")).toEqual(idle);
    expect(parseStoredTimer("42")).toEqual(idle);
    expect(parseStoredTimer(JSON.stringify({ timer: { status: "idle" } }))).toEqual(idle);
  });

  it("returns idle when the end time is missing or not a number", () => {
    expect(parseStoredTimer(JSON.stringify({ timer: { status: "running" } }))).toEqual(idle);
    expect(
      parseStoredTimer(JSON.stringify({ timer: { status: "running", endTime: "soon" } })),
    ).toEqual(idle);
  });

  it("drops a push id with unsafe characters", () => {
    const raw = JSON.stringify({
      timer: { status: "running", endTime: 5 },
      pushMessageId: "../../x",
    });
    expect(parseStoredTimer(raw).pushMessageId).toBeNull();
  });
});
