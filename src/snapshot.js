import { readCache, writeCache } from './cache.js';

const SNAPSHOT_KEY = 'pr_snapshot';

/**
 * Load the previously saved PR snapshot from cache.
 * @param {string} cacheDir
 * @returns {Promise<Array>}
 */
export async function loadSnapshot(cacheDir) {
  try {
    const data = await readCache(cacheDir, SNAPSHOT_KEY);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Persist the current PR list as the new snapshot.
 * @param {string} cacheDir
 * @param {Array} prs
 * @returns {Promise<void>}
 */
export async function saveSnapshot(cacheDir, prs) {
  await writeCache(cacheDir, SNAPSHOT_KEY, prs);
}

/**
 * Normalise a raw PR object down to only the fields needed for change
 * detection, keeping the snapshot small.
 * @param {object} pr
 * @returns {object}
 */
export function normalisePR(pr) {
  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    state: pr.state,
    draft: pr.draft ?? false,
    updatedAt: pr.updated_at ?? pr.updatedAt,
    repo: pr.repo ?? null
  };
}

/**
 * Normalise an array of raw PRs ready for snapshotting.
 * @param {Array} prs
 * @returns {Array}
 */
export function normaliseAll(prs) {
  return prs.map(normalisePR);
}
