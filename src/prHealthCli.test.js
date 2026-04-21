'use strict';

const { printHealthRow } = require('./prHealthCli');

function makePR(overrides = {}) {
  return {
    number: 42,
    title: 'Fix critical bug in auth flow',
    healthScore: 100,
    healthBand: 'healthy',
    ...overrides,
  };
}

describe('printHealthRow', () => {
  let output;

  beforeEach(() => {
    output = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => output.push(args.join(' ')));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('prints healthy PR with correct icon and score', () => {
    printHealthRow(makePR());
    expect(output[0]).toContain('✅');
    expect(output[0]).toContain('100/100');
    expect(output[0]).toContain('#42');
    expect(output[0]).toContain('[healthy]');
  });

  test('prints critical PR with correct icon', () => {
    printHealthRow(makePR({ healthScore: 0, healthBand: 'critical' }));
    expect(output[0]).toContain('🔴');
    expect(output[0]).toContain('[critical]');
  });

  test('prints at-risk PR with correct icon', () => {
    printHealthRow(makePR({ healthScore: 40, healthBand: 'at-risk' }));
    expect(output[0]).toContain('🟠');
    expect(output[0]).toContain('[at-risk]');
  });

  test('prints fair PR with correct icon', () => {
    printHealthRow(makePR({ healthScore: 60, healthBand: 'fair' }));
    expect(output[0]).toContain('🟡');
    expect(output[0]).toContain('[fair]');
  });

  test('truncates long titles to 55 characters', () => {
    const longTitle = 'A'.repeat(80);
    printHealthRow(makePR({ title: longTitle }));
    // The row should not contain more than 55 A chars in the title section
    const row = output[0];
    const aRun = row.match(/A+/);
    expect(aRun[0].length).toBeLessThanOrEqual(55);
  });

  test('uses fallback icon for unknown band', () => {
    printHealthRow(makePR({ healthBand: 'unknown' }));
    expect(output[0]).toContain('❓');
  });
});
