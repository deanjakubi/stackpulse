const https = require('https');

const GITHUB_API_BASE = 'api.github.com';

/**
 * Makes an authenticated request to the GitHub API.
 * @param {string} path - API path (e.g. /repos/owner/repo/pulls)
 * @param {string} token - GitHub personal access token
 * @returns {Promise<any>} Parsed JSON response
 */
function githubRequest(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: GITHUB_API_BASE,
      path,
      method: 'GET',
      headers: {
        'User-Agent': 'stackpulse-cli',
        'Accept': 'application/vnd.github.v3+json',
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`GitHub API error ${res.statusCode}: ${data}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Failed to parse GitHub response: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Fetches open pull requests for a given repo.
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} token - GitHub personal access token
 * @returns {Promise<Array>} List of open PR objects
 */
async function fetchOpenPRs(owner, repo, token) {
  const path = `/repos/${owner}/${repo}/pulls?state=open&per_page=50`;
  const prs = await githubRequest(path, token);
  return prs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    author: pr.user && pr.user.login,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    url: pr.html_url,
    draft: pr.draft || false,
    repo: `${owner}/${repo}`,
  }));
}

module.exports = { githubRequest, fetchOpenPRs };
