/**
 * Format bytes (as bigint or number) into a human-readable string (KB, MB, GB).
 */
export function formatStorageSize(bytes: bigint | number): string {
  const n = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (n >= 1_073_741_824) {
    return `${(n / 1_073_741_824).toFixed(2)} GB`;
  }
  if (n >= 1_048_576) {
    return `${(n / 1_048_576).toFixed(2)} MB`;
  }
  if (n >= 1024) {
    return `${(n / 1024).toFixed(2)} KB`;
  }
  return `${n} B`;
}

/**
 * Format a nanosecond timestamp (bigint or string) into a human-readable date string.
 */
export function formatTimestamp(nanos: bigint | string): string {
  const n = typeof nanos === "string" ? BigInt(nanos) : nanos;
  const ms = Number(n / 1_000_000n);
  return new Date(ms).toLocaleString();
}

/**
 * Convert nanosecond timestamp (bigint or string) to a locale date string.
 */
export function nanosecondsToDate(nanos: bigint | string): string {
  const n = typeof nanos === "string" ? BigInt(nanos) : nanos;
  const ms = Number(n / 1_000_000n);
  return new Date(ms).toLocaleDateString();
}

/**
 * Format duration in seconds to human-readable string.
 */
export function formatDuration(seconds: bigint | number): string {
  const s = typeof seconds === "bigint" ? Number(seconds) : seconds;
  if (s >= 86400 * 30) {
    return `${Math.round(s / (86400 * 30))} month(s)`;
  }
  if (s >= 86400) {
    return `${Math.round(s / 86400)} day(s)`;
  }
  if (s >= 3600) {
    return `${Math.round(s / 3600)} hour(s)`;
  }
  return `${s} second(s)`;
}
