"use strict";

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function colorize(text, color) {
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}

function formatPRStatus(pr) {
  if (pr.draft) return colorize("DRAFT", "gray");
  if (pr.mergeable_state === "behind") return colorize("BEHIND", "yellow");
  if (pr.mergeable_state === "blocked") return colorize("BLOCKED", "red");
  return colorize("OPEN", "green");
}

/**
 * Formats the age of a PR based on its creation date.
 * Returns a colorized string: green for today, yellow for recent,
 * red for older than 7 days.
 */
function formatAge(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return colorize("today", "green");
  if (diffDays === 1) return colorize("1 day ago", "yellow");
  if (diffDays > 7) return colorize(`${diffDays} days ago`, "red");
  return colorize(`${diffDays} days ago`, "yellow");
}

function truncateTitle(title, maxLength = 50) {
  return title.length > maxLength ? title.slice(0, maxLength - 3) + "..." : title;
}

function renderPRRow(pr, repo) {
  const status = formatPRStatus(pr);
  const age = formatAge(pr.created_at);
  const title = truncateTitle(pr.title);
  const author = colorize(`@${pr.user.login}`, "cyan");
  const repoLabel = colorize(`[${repo}]`, "bold");
  const prNumber = colorize(`#${pr.number}`, "gray");
  return `  ${repoLabel} ${prNumber} ${title} — ${author} ${age} [${status}]`;
}

function renderSummary(results) {
  const lines = [];
  let totalPRs = 0;

  lines.push(colorize("\n=== StackPulse PR Summary ===", "bold"));

  for (const { repo, prs, error } of results) {
    if (error) {
      lines.push(`\n${colorize(`[${repo}]`, "bold")} ${colorize(`Error: ${error}`, "red")}`);
      continue;
    }
    lines.push(`\n${colorize(`[${repo}]`, "bold")} — ${prs.length} open PR(s)`);
    if (prs.length === 0) {
      lines.push(colorize("  No open PRs.", "gray"));
    } else {
      for (const pr of prs) {
        lines.push(renderPRRow(pr, repo));
        totalPRs++;
      }
    }
  }

  lines.push(colorize(`\nTotal: ${totalPRs} open PR(s) across ${results.length} repo(s)\n`, "bold"));
  return lines.join("\n");
}

module.exports = { renderSummary, renderPRRow, formatAge, formatPRStatus, colorize, truncateTitle };
