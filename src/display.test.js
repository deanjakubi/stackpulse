"use strict";

const { renderSummary, renderPRRow, formatAge, colorize } = require("./display");

function makePR(overrides = {}) {
  return {
    number: 42,
    title: "Fix bug in authentication module",
    user: { login: "alice" },
    created_at: new Date().toISOString(),
    draft: false,
    mergeable_state: "clean",
    ...overrides,
  };
}

describe("colorize", () => {
  it("wraps text with ANSI color codes", () => {
    const result = colorize("hello", "green");
    expect(result).toContain("hello");
    expect(result).toContain("\x1b[");
  });

  it("resets color after text", () => {
    const result = colorize("test", "red");
    expect(result).toContain("\x1b[0m");
  });
});

describe("formatAge", () => {
  it("returns 'today' for PRs created today", () => {
    const result = formatAge(new Date().toISOString());
    expect(result).toContain("today");
  });

  it("returns days ago for older PRs", () => {
    const old = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatAge(old);
    expect(result).toContain("3 days ago");
  });
});

describe("renderPRRow", () => {
  it("includes PR number and title", () => {
    const pr = makePR();
    const row = renderPRRow(pr, "org/repo");
    expect(row).toContain("#42");
    expect(row).toContain("Fix bug in authentication module");
  });

  it("truncates long titles", () => {
    const pr = makePR({ title: "A".repeat(60) });
    const row = renderPRRow(pr, "org/repo");
    expect(row).toContain("...");
  });

  it("includes author login", () => {
    const pr = makePR();
    const row = renderPRRow(pr, "org/repo");
    expect(row).toContain("@alice");
  });
});

describe("renderSummary", () => {
  it("renders header and total line", () => {
    const results = [{ repo: "org/repo", prs: [makePR()] }];
    const output = renderSummary(results);
    expect(output).toContain("StackPulse PR Summary");
    expect(output).toContain("Total:");
  });

  it("shows error message for failed repos", () => {
    const results = [{ repo: "org/broken", prs: [], error: "Not found" }];
    const output = renderSummary(results);
    expect(output).toContain("Error: Not found");
  });

  it("shows no open PRs message when list is empty", () => {
    const results = [{ repo: "org/quiet", prs: [] }];
    const output = renderSummary(results);
    expect(output).toContain("No open PRs.");
  });
});
