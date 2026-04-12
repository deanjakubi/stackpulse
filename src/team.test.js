const {
  buildAuthorTeamMap,
  resolveTeam,
  groupByTeam,
  buildTeamSummary,
  formatTeamSummary,
} = require('./team');

function makePR(login, state = 'open', draft = false) {
  return { user: { login }, state, draft };
}

describe('buildAuthorTeamMap', () => {
  it('maps each member to their team', () => {
    const map = buildAuthorTeamMap({ frontend: ['Alice', 'Bob'], backend: ['Carol'] });
    expect(map.get('alice')).toBe('frontend');
    expect(map.get('bob')).toBe('frontend');
    expect(map.get('carol')).toBe('backend');
  });

  it('returns empty map for empty config', () => {
    expect(buildAuthorTeamMap({}).size).toBe(0);
  });
});

describe('resolveTeam', () => {
  const map = new Map([['alice', 'frontend'], ['carol', 'backend']]);

  it('returns correct team for known author', () => {
    expect(resolveTeam('Alice', map)).toBe('frontend');
  });

  it('returns unknown for unrecognised author', () => {
    expect(resolveTeam('dave', map)).toBe('unknown');
  });

  it('handles undefined author', () => {
    expect(resolveTeam(undefined, map)).toBe('unknown');
  });
});

describe('groupByTeam', () => {
  const map = new Map([['alice', 'frontend'], ['carol', 'backend']]);

  it('groups PRs correctly', () => {
    const prs = [makePR('alice'), makePR('carol'), makePR('alice')];
    const groups = groupByTeam(prs, map);
    expect(groups.frontend).toHaveLength(2);
    expect(groups.backend).toHaveLength(1);
  });

  it('places unknown authors in unknown group', () => {
    const prs = [makePR('dave')];
    const groups = groupByTeam(prs, map);
    expect(groups.unknown).toHaveLength(1);
  });
});

describe('buildTeamSummary', () => {
  it('counts open and draft PRs per team', () => {
    const grouped = {
      frontend: [makePR('alice', 'open', false), makePR('alice', 'open', true)],
      backend: [makePR('carol', 'open', false)],
    };
    const summary = buildTeamSummary(grouped);
    const fe = summary.find(s => s.team === 'frontend');
    expect(fe.total).toBe(2);
    expect(fe.open).toBe(1);
    expect(fe.draft).toBe(1);
  });

  it('sorts by total descending', () => {
    const grouped = {
      a: [makePR('x')],
      b: [makePR('y'), makePR('z')],
    };
    const summary = buildTeamSummary(grouped);
    expect(summary[0].team).toBe('b');
  });
});

describe('formatTeamSummary', () => {
  it('returns fallback for empty summary', () => {
    expect(formatTeamSummary([])).toBe('No team data available.');
  });

  it('includes team names and counts', () => {
    const summary = [{ team: 'frontend', total: 3, open: 2, draft: 1 }];
    const output = formatTeamSummary(summary);
    expect(output).toContain('frontend');
    expect(output).toContain('total: 3');
    expect(output).toContain('open: 2');
    expect(output).toContain('draft: 1');
  });
});
