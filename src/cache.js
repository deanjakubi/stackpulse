import fs from 'fs';
import path from 'path';
import os from 'os';

const CACHE_DIR = path.join(os.homedir(), '.stackpulse');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function readCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return {};
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeCache(data) {
  ensureCacheDir();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function getCached(key, ttlMs = DEFAULT_TTL_MS) {
  const cache = readCache();
  const entry = cache[key];
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  if (age > ttlMs) return null;
  return entry.value;
}

export function setCached(key, value) {
  const cache = readCache();
  cache[key] = { value, timestamp: Date.now() };
  writeCache(cache);
}

export function clearCache() {
  if (fs.existsSync(CACHE_FILE)) {
    fs.unlinkSync(CACHE_FILE);
  }
}

export function pruneExpiredEntries(ttlMs = DEFAULT_TTL_MS) {
  const cache = readCache();
  const now = Date.now();
  let pruned = 0;
  for (const key of Object.keys(cache)) {
    if (now - cache[key].timestamp > ttlMs) {
      delete cache[key];
      pruned++;
    }
  }
  writeCache(cache);
  return pruned;
}
