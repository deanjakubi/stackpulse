import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadSnapshot, saveSnapshot, normalisePR, normaliseAll } from './snapshot.js';
import * as cache from './cache.js';

vi.mock('./cache.js', () => ({
  readCache: vi.fn(),
  writeCache: vi.fn()
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('normalisePR', () => {
  it('maps raw GitHub fields to normalised shape', () => {
    const raw = {
      id: 42,
      number: 7,
      title: 'Fix bug',
      state: 'open',
      draft: false,
      updated_at: '2024-03-01T12:00:00Z',
      repo: 'owner/repo'
    };
    expect(normalisePR(raw)).toEqual({
      id: 42,
      number: 7,
      title: 'Fix bug',
      state: 'open',
      draft: false,
      updatedAt: '2024-03-01T12:00:00Z',
      repo: 'owner/repo'
    });
  });

  it('falls back to updatedAt when updated_at is absent', () => {
    const raw = { id: 1, number: 1, title: 'T', state: 'open', updatedAt: '2024-01-01T00:00:00Z' };
    expect(normalisePR(raw).updatedAt).toBe('2024-01-01T00:00:00Z');
  });

  it('defaults draft to false when missing', () => {
    const raw = { id: 1, number: 1, title: 'T', state: 'open' };
    expect(normalisePR(raw).draft).toBe(false);
  });
});

describe('normaliseAll', () => {
  it('maps every item in the array', () => {
    const raws = [
      { id: 1, number: 1, title: 'A', state: 'open' },
      { id: 2, number: 2, title: 'B', state: 'closed' }
    ];
    const result = normaliseAll(raws);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });
});

describe('loadSnapshot', () => {
  it('returns array from cache when available', async () => {
    cache.readCache.mockResolvedValue([{ id: 1 }]);
    const result = await loadSnapshot('/tmp/cache');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('returns empty array when cache is empty or invalid', async () => {
    cache.readCache.mockResolvedValue(null);
    expect(await loadSnapshot('/tmp/cache')).toEqual([]);
  });

  it('returns empty array when readCache throws', async () => {
    cache.readCache.mockRejectedValue(new Error('no file'));
    expect(await loadSnapshot('/tmp/cache')).toEqual([]);
  });
});

describe('saveSnapshot', () => {
  it('calls writeCache with the correct key and data', async () => {
    cache.writeCache.mockResolvedValue();
    const prs = [{ id: 1 }];
    await saveSnapshot('/tmp/cache', prs);
    expect(cache.writeCache).toHaveBeenCalledWith('/tmp/cache', 'pr_snapshot', prs);
  });
});
