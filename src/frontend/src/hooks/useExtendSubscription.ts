import { Principal } from "@dfinity/principal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLedgerActor } from "../utils/ledger";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

const TRANSFER_FEE = 10_000n;

function getTransferErrorMessage(err: any): string {
  if (!err || typeof err !== "object") return "Transfer failed";
  const keys = Object.keys(err);
  if (keys.length === 0) return "Transfer failed";
  const variant = keys[0];
  switch (variant) {
    case "InsufficientFunds":
      return "Insufficient funds — subscription not extended";
    case "BadFee":
      return "Transfer fee mismatch — subscription not extended";
    case "TooOld":
      return "Transfer request too old — subscription not extended";
    case "CreatedInFuture":
      return "Transfer timestamp in the future — subscription not extended";
    case "Duplicate":
      return "Duplicate transfer detected — subscription not extended";
    case "TemporarilyUnavailable":
      return "Ledger temporarily unavailable — please try again later";
    case "GenericError":
      return `Transfer error: ${err[variant]?.message || "Unknown error"} — subscription not extended`;
    default:
      return `Transfer failed (${variant}) — subscription not extended`;
  }
}

export interface ExtendResult {
  extended: boolean;
  /** Payment succeeded, subscription is being processed — poll for activation */
  activationPending: boolean;
  blockIndex: string;
  priceIcp: string;
}

export interface ExtendParams {
  planId: bigint;
  /** When true, routes through activateSubscription (plan switch) instead of confirmExtendSubscription (same-plan extend) */
  isSwitching?: boolean;
}

export function useExtendSubscription() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation<ExtendResult, Error, ExtendParams>({
    mutationFn: async ({
      planId,
      isSwitching = false,
    }: ExtendParams): Promise<ExtendResult> => {
      if (!actor) throw new Error("Actor not available");
      if (!identity) throw new Error("Not authenticated");

      // Step 1: Get payment details — use getPurchaseDetails for switches (no planId restriction),
      // getExtensionDetails for same-plan extends
      const [destination, priceE8s] = isSwitching
        ? await actor.getPurchaseDetails(planId)
        : await actor.getExtensionDetails(planId);

      // Step 2: Create ledger actor
      const ledger = await createLedgerActor(identity);

      // Step 3: Check balance — user must have at least priceE8s + fee
      const principal = identity.getPrincipal();
      const balanceE8s: bigint = await ledger.icrc1_balance_of({
        owner: principal,
        subaccount: [],
      });

      const totalRequired = BigInt(priceE8s) + TRANSFER_FEE;
      if (balanceE8s < totalRequired) {
        const balanceIcp = (Number(balanceE8s) / 1e8).toFixed(4);
        const requiredIcp = (Number(totalRequired) / 1e8).toFixed(4);
        throw new Error(
          `Insufficient funds: your balance is ${balanceIcp} ICP but ${requiredIcp} ICP is required (including fee)`,
        );
      }

      // Step 4: Perform ICRC-1 transfer
      const transferResult = await ledger.icrc1_transfer({
        to: {
          owner: Principal.fromText(destination),
          subaccount: [],
        },
        amount: BigInt(priceE8s),
        fee: [TRANSFER_FEE],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
      });

      // Step 5: Check transfer result — only extend if Ok
      if ("Err" in transferResult) {
        throw new Error(getTransferErrorMessage(transferResult.Err));
      }

      // Step 6: Transfer succeeded — attempt backend confirmation
      const blockIndex = transferResult.Ok as bigint;
      const priceIcp = (Number(BigInt(priceE8s)) / 1e8).toFixed(4);

      try {
        // Plan switch: use activateSubscription (overwrites existing subscription with new planId)
        // Same-plan extend: use confirmExtendSubscription (extends end time on the same plan)
        if (isSwitching) {
          await actor.activateSubscription(planId, blockIndex);
        } else {
          await actor.confirmExtendSubscription(planId, blockIndex);
        }
        return {
          extended: true,
          activationPending: false,
          blockIndex: blockIndex.toString(),
          priceIcp,
        };
      } catch {
        // Backend confirmation failed — payment went through, poll for activation
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        queryClient.invalidateQueries({ queryKey: ["icpBalance"] });
        queryClient.invalidateQueries({ queryKey: ["balance"] });
        return {
          extended: false,
          activationPending: true,
          blockIndex: blockIndex.toString(),
          priceIcp,
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["icpBalance"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}
