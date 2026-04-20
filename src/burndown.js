// burndown.js — tracks PR open/close rates over a rolling window

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(a, b) {
  return Math.max(0, Math.floor((new Date(b) - new Date(a)) / DAY_MS));
}

function buildDailyBuckets(windowDays) {
  const now = new Date();
  const buckets = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(now - i * DAY_MS);
    buckets.push({
      date: d.toISOString().slice(0, 10),
      opened: 0,
      closed: 0,
    });
  }
  return buckets;
}

function fillBuckets(prs, buckets) {
  const index = Object.fromEntries(buckets.map((b) => [b.date, b]));
  for (const pr of prs) {
    const openDate = pr.created_at && pr.created_at.slice(0, 10);
    if (openDate && index[openDate]) index[openDate].opened += 1;

    const closeDate =
      (pr.merged_at || pr.closed_at) &&
      (pr.merged_at || pr.closed_at).slice(0, 10);
    if (closeDate && index[closeDate]) index[closeDate].closed += 1;
  }
  return buckets;
}

function computeBurndown(prs, windowDays = 14) {
  const buckets = buildDailyBuckets(windowDays);
  fillBuckets(prs, buckets);

  let running = 0;
  const rows = buckets.map((b) => {
    running += b.opened - b.closed;
    return { ...b, net: b.opened - b.closed, cumulative: running };
  });

  const totalOpened = rows.reduce((s, r) => s + r.opened, 0);
  const totalClosed = rows.reduce((s, r) => s + r.closed, 0);
  return { rows, totalOpened, totalClosed, windowDays };
}

function formatBurndownSummary(summary) {
  const { rows, totalOpened, totalClosed, windowDays } = summary;
  const lines = [
    `PR Burndown — last ${windowDays} days`,
    `  Opened : ${totalOpened}`,
    `  Closed : ${totalClosed}`,
    `  Net    : ${totalOpened - totalClosed}`,
    '',
    '  Date        Opened  Closed  Net  Cumulative',
    '  ----------  ------  ------  ---  ----------',
  ];
  for (const r of rows) {
    const net = r.net >= 0 ? `+${r.net}` : `${r.net}`;
    lines.push(
      `  ${r.date}  ${String(r.opened).padStart(6)}  ${String(r.closed).padStart(6)}  ${net.padStart(3)}  ${String(r.cumulative).padStart(10)}`
    );
  }
  return lines.join('\n');
}

module.exports = {
  daysBetween,
  buildDailyBuckets,
  fillBuckets,
  computeBurndown,
  formatBurndownSummary,
};
