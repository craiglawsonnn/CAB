export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function percentFromClientX(
  clientX: number,
  rect: { left: number; width: number }
): number {
  if (rect.width === 0) return 50;
  const raw = ((clientX - rect.left) / rect.width) * 100;
  return clampPercent(raw);
}
