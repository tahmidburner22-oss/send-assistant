export const AUTO_FROM_CLASS_TIMEOUT_MS = 60_000;

export class GenerationTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`The request did not finish within ${Math.ceil(timeoutMs / 1000)} seconds.`);
    this.name = "GenerationTimeoutError";
  }
}

/**
 * Gives a teacher-facing generation request a visible upper bound. This does
 * not abort a provider call that cannot accept an AbortSignal; callers must
 * still ignore stale completions after a user cancels or starts another run.
 */
export async function withGenerationTimeout<T>(
  operation: Promise<T>,
  timeoutMs = AUTO_FROM_CLASS_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new GenerationTimeoutError(timeoutMs)), timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
