import { Principal } from "@icp-sdk/core/principal";

/**
 * Validates whether a string is a valid ICP Principal ID.
 */
export function isValidPrincipal(principalText: string): boolean {
  if (!principalText || principalText.trim() === "") return false;
  try {
    Principal.fromText(principalText.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a transfer amount string.
 * Returns an error message or null if valid.
 */
export function validateTransferAmount(
  amountStr: string,
  balanceIcp: string | null,
): string | null {
  const trimmed = amountStr.trim();

  if (!trimmed) return "Amount is required";

  const amount = Number(trimmed);
  if (Number.isNaN(amount)) return "Amount must be a valid number";
  if (amount <= 0) return "Amount must be greater than 0";

  // Check for too many decimal places (max 8)
  const parts = trimmed.split(".");
  if (parts[1] && parts[1].length > 8) {
    return "Amount cannot have more than 8 decimal places";
  }

  if (balanceIcp !== null) {
    const balance = Number(balanceIcp);
    // ICP transfer fee is 0.0001 ICP (10_000 e8s)
    const FEE = 0.0001;
    if (amount + FEE > balance) {
      return `Insufficient balance (including ${FEE} ICP fee)`;
    }
  }

  return null;
}
