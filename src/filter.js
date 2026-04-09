/**
 * Filter and sort PR results based on user-defined criteria.
 */

/**
 * Filter PRs by label.
 * @param {Array} prs
 * @param {string|null} label
 * @returns {Array}
 */
function filterByLabel(prs, label) {
  if (!label) return prs;
  return prs.filter(
    (pr) =>
      Array.isArray(pr.labels) &&
      pr.labels.some((l) => l.name.toLowerCase() === label.toLowerCase())
  );
}

/**
 * Filter PRs by author login.
 * @param {Array} prs
 * @param {string|null} author
 * @returns {Array}
 */
function filterByAuthor(prs, author) {
  if (!author) return prs;
  return prs.filter(
    (pr) =>
      pr.user &&
      pr.user.login.toLowerCase() === author.toLowerCase()
  );
}

/**
 * Filter PRs by draft status.
 * @param {Array} prs
 * @param {boolean|null} includeDrafts
 * @returns {Array}
 */
function filterDrafts(prs, includeDrafts) {
  if (includeDrafts === true || includeDrafts === null || includeDrafts === undefined) {
    return prs;
  }
  return prs.filter((pr) => !pr.draft);
}

/**
 * Sort PRs by a given field.
 * @param {Array} prs
 * @param {'created'|'updated'|'title'} sortBy
 * @returns {Array}
 */
function sortPRs(prs, sortBy) {
  const copy = [...prs];
  if (sortBy === 'title') {
    return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
  if (sortBy === 'updated') {
    return copy.sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );
  }
  // default: created
  return copy.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

/**
 * Apply all filters and sorting in one pass.
 * @param {Array} prs
 * @param {{ label?: string, author?: string, includeDrafts?: boolean, sortBy?: string }} opts
 * @returns {Array}
 */
function applyFilters(prs, opts = {}) {
  let result = prs;
  result = filterByLabel(result, opts.label || null);
  result = filterByAuthor(result, opts.author || null);
  result = filterDrafts(result, opts.includeDrafts);
  result = sortPRs(result, opts.sortBy || 'created');
  return result;
}

module.exports = { filterByLabel, filterByAuthor, filterDrafts, sortPRs, applyFilters };
