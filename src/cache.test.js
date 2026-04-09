import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

vi.mock('fs');

import {
  readCache,
  writeCache,
  getCached,
  setCached,
  clearCache,
  pruneExpiredEntries,
} from './cache.js';

const CACHE_FILE = path.join(os.homedir(), '.stackpulse', 'cache.json');

beforeEach(() => {
  vi.resetAllMocks();
});

describe('readCache', () => {
  it('returns empty object if file does not exist', () => {
    fs.existsSync.mockReturnValue(false);
    expect(readCache()).toEqual({});
  });

  it('parses and returns cache file contents', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ key: { value: 42, timestamp: 1000 } }));
    expect(readCache()).toEqual({ key: { value: 42, timestamp: 1000 } });
  });

  it('returns empty object on parse error', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('not json');
    expect(readCache()).toEqual({});
  });
});

describe('getCached', () => {
  it('returns null if key not present', () => {
    fs.existsSync.mockReturnValue(false);
    expect(getCached('missing')).toBeNull();
  });

  it('returns null if entry is expired', () => {
    const old = Date.now() - 10 * 60 * 1000;
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ k: { value: 'v', timestamp: old } }));
    expect(getCached('k')).toBeNull();
  });

  it('returns value if entry is fresh', () => {
    const recent = Date.now() - 1000;
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ k: { value: 'hello', timestamp: recent } }));
    expect(getCached('k')).toBe('hello');
  });
});

describe('clearCache', () => {
  it('removes the cache file if it exists', () => {
    fs.existsSync.mockReturnValue(true);
    clearCache();
    expect(fs.unlinkSync).toHaveBeenCalledWith(CACHE_FILE);
  });

  it('does nothing if cache file does not exist', () => {
    fs.existsSync.mockReturnValue(false);
    clearCache();
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
});

describe('pruneExpiredEntries', () => {
  it('removes expired entries and returns count', () => {
    const now = Date.now();
    const data = {
      fresh: { value: 1, timestamp: now - 1000 },
      stale: { value: 2, timestamp: now - 10 * 60 * 1000 },
    };
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(data));
    const pruned = pruneExpiredEntries();
    expect(pruned).toBe(1);
    const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(written).toHaveProperty('fresh');
    expect(written).not.toHaveProperty('stale');
  });
});
