/**
 * Convert e8s (BigInt) to ICP string with 4 decimal places.
 */
export function e8sToIcp(e8s: bigint): string {
  const whole = e8s / 100_000_000n;
  const frac = e8s % 100_000_000n;
  const fracStr = frac.toString().padStart(8, "0").slice(0, 4);
  return `${whole}.${fracStr}`;
}

/**
 * Convert ICP string to e8s BigInt without precision loss.
 */
export function icpToE8s(icp: string): bigint {
  const [wholePart, fracPart = ""] = icp.split(".");
  const fracPadded = fracPart.padEnd(8, "0").slice(0, 8);
  return BigInt(wholePart) * 100_000_000n + BigInt(fracPadded);
}
