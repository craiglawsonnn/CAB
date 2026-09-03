interface Attempt {
  count: number;
  windowStart: number;
}

const attempts = new Map<string, Attempt>();

export function checkAndRecordAttempt(
  key: string,
  options: { maxAttempts: number; windowMs: number },
  now: number = Date.now()
): boolean {
  const existing = attempts.get(key);

  if (!existing || now - existing.windowStart >= options.windowMs) {
    attempts.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (existing.count >= options.maxAttempts) {
    return false;
  }

  existing.count += 1;
  return true;
}

export function resetRateLimiter(): void {
  attempts.clear();
}
