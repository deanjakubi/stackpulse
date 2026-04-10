/**
 * search.js — filter PRs by a text query across title, author, and labels
 */

/**
 * Normalise a string for case-insensitive comparison.
 * @param {string} str
 * @returns {string}
 */
function normalise(str) {
  return (str || '').toLowerCase().trim();
}

/**
 * Test whether a single PR matches the given query string.
 * A PR matches if the query appears in its title, author login, or any label name.
 *
 * @param {object} pr  - GitHub PR object
 * @param {string} query - raw search string from the user
 * @returns {boolean}
 */
function prMatchesQuery(pr, query) {
  if (!query || query.trim() === '') return true;

  const q = normalise(query);

  const inTitle = normalise(pr.title).includes(q);
  const inAuthor = normalise(pr.user && pr.user.login).includes(q);
  const inLabels = Array.isArray(pr.labels)
    ? pr.labels.some((l) => normalise(l.name).includes(q))
    : false;

  return inTitle || inAuthor || inLabels;
}

/**
 * Filter an array of PRs by a text query.
 *
 * @param {object[]} prs
 * @param {string}   query
 * @returns {object[]}
 */
function searchPRs(prs, query) {
  if (!Array.isArray(prs)) return [];
  if (!query || query.trim() === '') return prs;
  return prs.filter((pr) => prMatchesQuery(pr, query));
}

module.exports = { normalise, prMatchesQuery, searchPRs };
