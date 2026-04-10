/**
 * Export PR data to JSON or CSV formats.
 */

/**
 * Convert an array of PR objects to a CSV string.
 * @param {object[]} prs
 * @returns {string}
 */
function toCSV(prs) {
  if (!prs || prs.length === 0) return '';

  const headers = ['repo', 'number', 'title', 'author', 'state', 'draft', 'labels', 'createdAt', 'updatedAt', 'url'];
  const escape = (val) => {
    const str = val == null ? '' : String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const rows = prs.map((pr) => [
    pr.repo ?? '',
    pr.number ?? '',
    pr.title ?? '',
    pr.user?.login ?? '',
    pr.state ?? '',
    pr.draft ? 'true' : 'false',
    (pr.labels ?? []).map((l) => l.name).join(';'),
    pr.created_at ?? '',
    pr.updated_at ?? '',
    pr.html_url ?? '',
  ].map(escape).join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Convert an array of PR objects to a JSON string.
 * @param {object[]} prs
 * @returns {string}
 */
function toJSON(prs) {
  return JSON.stringify(prs, null, 2);
}

/**
 * Export PR data in the requested format.
 * @param {object[]} prs
 * @param {'json'|'csv'} format
 * @returns {string}
 */
function exportPRs(prs, format = 'json') {
  switch (format.toLowerCase()) {
    case 'csv':
      return toCSV(prs);
    case 'json':
      return toJSON(prs);
    default:
      throw new Error(`Unsupported export format: "${format}". Use "json" or "csv".`);
  }
}

module.exports = { toCSV, toJSON, exportPRs };
