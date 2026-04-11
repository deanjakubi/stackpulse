import { execSync } from 'child_process';

const PLATFORMS = {
  darwin: 'osascript -e \'display notification "{message}" with title "StackPulse"\' ',
  linux: 'notify-send "StackPulse" "{message}"',
  win32: 'powershell -Command "[System.Windows.Forms.MessageBox]::Show(\'{message}\', \'StackPulse\')"\''
};

/**
 * Sanitise a message string for safe shell interpolation by stripping
 * characters that could break out of the surrounding quotes.
 * @param {string} message
 * @returns {string}
 */
function sanitiseMessage(message) {
  // Remove single quotes (used as delimiters on darwin/win32) and
  // backticks / dollar signs that could trigger command substitution.
  return message.replace(/['`$]/g, '');
}

/**
 * Send a desktop notification if the platform supports it.
 * @param {string} message
 * @returns {boolean} whether notification was sent
 */
export function sendNotification(message) {
  const platform = process.platform;
  const template = PLATFORMS[platform];
  if (!template) return false;

  const cmd = template.replace('{message}', sanitiseMessage(message));
  try {
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Build a notification message summarising new or updated PRs.
 * @param {Array} newPRs   - PRs that appeared since last run
 * @param {Array} updatedPRs - PRs whose updatedAt changed since last run
 * @returns {string|null}
 */
export function buildNotificationMessage(newPRs, updatedPRs) {
  const parts = [];
  if (newPRs.length > 0) {
    parts.push(`${newPRs.length} new PR${newPRs.length > 1 ? 's' : ''}`);
  }
  if (updatedPRs.length > 0) {
    parts.push(`${updatedPRs.length} updated PR${updatedPRs.length > 1 ? 's' : ''}`);
  }
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Compare a fresh list of PRs against a previous snapshot and emit a
 * desktop notification if anything changed.
 * @param {Array} previousPRs
 * @param {Array} currentPRs
 * @returns {{ newPRs: Array, updatedPRs: Array, notified: boolean }}
 */
export function notifyOnChanges(previousPRs, currentPRs) {
  const prevMap = new Map(previousPRs.map(pr => [pr.id, pr]));

  const newPRs = currentPRs.filter(pr => !prevMap.has(pr.id));
  const updatedPRs = currentPRs.filter(pr => {
    const prev = prevMap.get(pr.id);
    return prev && prev.updatedAt !== pr.updatedAt;
  });

  const message = buildNotificationMessage(newPRs, updatedPRs);
  const notified = message ? sendNotification(message) : false;

  return { newPRs, updatedPRs, notified };
}
