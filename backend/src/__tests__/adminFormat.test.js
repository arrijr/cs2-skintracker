import { describe, it, expect } from '@jest/globals';
import { formatDuration, toUiStatus, jobHealth } from '../utils/adminFormat.js';

describe('formatDuration', () => {
  it('formats sub-minute as seconds', () => {
    expect(formatDuration(45_000)).toBe('45s');
  });
  it('formats minutes + seconds', () => {
    expect(formatDuration(15 * 60_000 + 32_000)).toBe('15m 32s');
  });
  it('returns "—" for null', () => {
    expect(formatDuration(null)).toBe('—');
  });
});

describe('toUiStatus', () => {
  it('maps completed/done → success', () => {
    expect(toUiStatus('completed')).toBe('success');
    expect(toUiStatus('done')).toBe('success');
  });
  it('maps failed → error', () => {
    expect(toUiStatus('failed')).toBe('error');
  });
  it('passes through running/queued', () => {
    expect(toUiStatus('running')).toBe('running');
    expect(toUiStatus('queued')).toBe('queued');
  });
});

describe('jobHealth (staleness thresholds)', () => {
  const now = new Date('2026-06-01T12:00:00Z');
  it('healthy when fresh', () => {
    expect(jobHealth('updateSkinPrices', new Date('2026-06-01T11:00:00Z'), now)).toBe('healthy');
  });
  it('warning when stale past warn threshold', () => {
    expect(jobHealth('updateSkinPrices', new Date('2026-05-31T09:00:00Z'), now)).toBe('warning');
  });
  it('error when stale past error threshold', () => {
    expect(jobHealth('updateSkinPrices', new Date('2026-05-29T09:00:00Z'), now)).toBe('error');
  });
  it('error when never run (null)', () => {
    expect(jobHealth('updateSkinPrices', null, now)).toBe('error');
  });
});
