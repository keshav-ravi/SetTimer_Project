import { describe, expect, it } from "vitest";
import { sanitizeEvent, stripUrlDetails } from "./analyticsSanitize";

describe("stripUrlDetails", () => {
  it("removes the query and the fragment", () => {
    expect(stripUrlDetails("https://app.example.com/?date=2026-10-10")).toBe(
      "https://app.example.com/",
    );
    expect(stripUrlDetails("https://app.example.com/history?x=1#top")).toBe(
      "https://app.example.com/history",
    );
    expect(stripUrlDetails("/account#delete")).toBe("/account");
  });

  it("leaves addresses without a query alone", () => {
    expect(stripUrlDetails("https://app.example.com/history")).toBe(
      "https://app.example.com/history",
    );
    expect(stripUrlDetails("$direct")).toBe("$direct");
  });
});

describe("sanitizeEvent", () => {
  it("cleans url and referrer properties, including in $set and $set_once", () => {
    const event = {
      event: "$pageview",
      properties: {
        $current_url: "https://app.example.com/?date=2026-10-10",
        $referrer: "https://app.example.com/history?page=2",
        $pathname: "/",
        distinct_id: "abc",
      },
      $set: { $current_url: "https://app.example.com/?date=2026-10-09" },
      $set_once: {
        $initial_referrer: "https://x.test/?q=secret",
        $initial_current_url: "https://app.example.com/?date=1",
      },
    };
    const cleaned = sanitizeEvent(event)!;
    expect(cleaned.properties).toEqual({
      $current_url: "https://app.example.com/",
      $referrer: "https://app.example.com/history",
      $pathname: "/",
      distinct_id: "abc",
    });
    expect(cleaned.$set).toEqual({ $current_url: "https://app.example.com/" });
    expect(cleaned.$set_once).toEqual({
      $initial_referrer: "https://x.test/",
      $initial_current_url: "https://app.example.com/",
    });
  });

  it("does not touch other values, even ones that look like queries", () => {
    const event = { properties: { note: "a?b#c", count: 3 } };
    expect(sanitizeEvent(event)!.properties).toEqual({
      note: "a?b#c",
      count: 3,
    });
  });

  it("returns a copy and leaves the original unchanged", () => {
    const event = { properties: { $current_url: "https://a.test/?date=1" } };
    sanitizeEvent(event);
    expect(event.properties.$current_url).toBe("https://a.test/?date=1");
  });

  it("passes null and events without properties through", () => {
    expect(sanitizeEvent(null)).toBeNull();
    expect(sanitizeEvent({})).toEqual({});
  });
});
