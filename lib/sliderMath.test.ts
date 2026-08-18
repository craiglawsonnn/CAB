import { describe, it, expect } from 'vitest';
import { clampPercent, percentFromClientX } from '@/lib/sliderMath';

describe('clampPercent', () => {
  it('clamps values below 0 to 0', () => {
    expect(clampPercent(-10)).toBe(0);
  });

  it('clamps values above 100 to 100', () => {
    expect(clampPercent(150)).toBe(100);
  });

  it('passes through in-range values', () => {
    expect(clampPercent(42)).toBe(42);
  });
});

describe('percentFromClientX', () => {
  it('returns 0 at the left edge', () => {
    expect(percentFromClientX(0, { left: 0, width: 200 })).toBe(0);
  });

  it('returns 100 at the right edge', () => {
    expect(percentFromClientX(200, { left: 0, width: 200 })).toBe(100);
  });

  it('returns 50 at the midpoint', () => {
    expect(percentFromClientX(100, { left: 0, width: 200 })).toBe(50);
  });

  it('accounts for container offset', () => {
    expect(percentFromClientX(150, { left: 100, width: 200 })).toBe(25);
  });

  it('returns 50 when width is 0 to avoid divide-by-zero', () => {
    expect(percentFromClientX(50, { left: 0, width: 0 })).toBe(50);
  });
});
