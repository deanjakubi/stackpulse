const { githubRequest } = require('./github');

/**
 * Fetch open pull requests for a given repo.
 * @param {string} owner - Repository owner or org
 * @param {string} repo - Repository name
 * @param {string} token - GitHub personal access token
 * @returns {Promise<Array>} List of simplified PR objects
 */
async function fetchOpenPRs(owner, repo, token) {
  const path = `/repos/${owner}/${repo}/pulls?state=open&per_page=50`;
  const data = await githubRequest(path, token);

  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    author: pr.user && pr.user.login,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    draft: pr.draft || false,
    reviewers: (pr.requested_reviewers || []).map((r) => r.login),
    labels: (pr.labels || []).map((l) => l.name),
    url: pr.html_url,
    repo: `${owner}/${repo}`,
  }));
}

/**
 * Fetch open PRs for multiple repos and merge into a single list.
 * @param {Array<{owner: string, repo: string}>} repos
 * @param {string} token
 * @returns {Promise<Array>}
 */
async function fetchAllPRs(repos, token) {
  const results = await Promise.allSettled(
    repos.map(({ owner, repo }) => fetchOpenPRs(owner, repo, token))
  );

  const prs = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      prs.push(...result.value);
    } else {
      console.error('[stackpulse] Failed to fetch PRs:', result.reason.message);
    }
  }

  // Sort by most recently updated
  prs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return prs;
}

module.exports = { fetchOpenPRs, fetchAllPRs };
