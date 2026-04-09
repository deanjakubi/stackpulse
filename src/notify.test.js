import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as childProcess from 'child_process';
import {
  buildNotificationMessage,
  notifyOnChanges,
  sendNotification
} from './notify.js';

vi.mock('child_process', () => ({ execSync: vi.fn() }));

const makePR = (id, updatedAt = '2024-01-01T00:00:00Z') => ({
  id,
  title: `PR ${id}`,
  updatedAt
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildNotificationMessage', () => {
  it('returns null when no changes', () => {
    expect(buildNotificationMessage([], [])).toBeNull();
  });

  it('reports new PRs', () => {
    const msg = buildNotificationMessage([makePR(1), makePR(2)], []);
    expect(msg).toBe('2 new PRs');
  });

  it('reports updated PRs', () => {
    const msg = buildNotificationMessage([], [makePR(1)]);
    expect(msg).toBe('1 updated PR');
  });

  it('reports both new and updated PRs', () => {
    const msg = buildNotificationMessage([makePR(1)], [makePR(2)]);
    expect(msg).toBe('1 new PR, 1 updated PR');
  });
});

describe('sendNotification', () => {
  it('returns false for unsupported platforms', () => {
    const original = process.platform;
    Object.defineProperty(process, 'platform', { value: 'freebsd', configurable: true });
    expect(sendNotification('hello')).toBe(false);
    Object.defineProperty(process, 'platform', { value: original, configurable: true });
  });

  it('returns true when execSync succeeds on darwin', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    childProcess.execSync.mockImplementation(() => {});
    expect(sendNotification('hello')).toBe(true);
  });

  it('returns false when execSync throws', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    childProcess.execSync.mockImplementation(() => { throw new Error('fail'); });
    expect(sendNotification('hello')).toBe(false);
  });
});

describe('notifyOnChanges', () => {
  it('detects new PRs', () => {
    childProcess.execSync.mockImplementation(() => {});
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    const prev = [makePR(1)];
    const curr = [makePR(1), makePR(2)];
    const { newPRs, updatedPRs } = notifyOnChanges(prev, curr);
    expect(newPRs).toHaveLength(1);
    expect(newPRs[0].id).toBe(2);
    expect(updatedPRs).toHaveLength(0);
  });

  it('detects updated PRs', () => {
    childProcess.execSync.mockImplementation(() => {});
    const prev = [makePR(1, '2024-01-01T00:00:00Z')];
    const curr = [makePR(1, '2024-06-01T00:00:00Z')];
    const { updatedPRs } = notifyOnChanges(prev, curr);
    expect(updatedPRs).toHaveLength(1);
  });

  it('returns notified false when nothing changed', () => {
    const pr = makePR(1);
    const { notified } = notifyOnChanges([pr], [pr]);
    expect(notified).toBe(false);
  });
});
