import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { icpToE8s } from "../utils/icp";
import { createLedgerActor, formatTransferError } from "../utils/ledger";
import { ICP_BALANCE_QUERY_KEY } from "./useGetICPBalance";
import { useInternetIdentity } from "./useInternetIdentity";

interface SendICPParams {
  recipientPrincipal: string;
  amountIcp: string;
}

export function useSendICP() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation<bigint, Error, SendICPParams>({
    mutationFn: async ({ recipientPrincipal, amountIcp }) => {
      if (!identity) throw new Error("Not authenticated. Please log in first.");

      const ledger = await createLedgerActor(identity);
      const recipient = Principal.fromText(recipientPrincipal.trim());
      const amountE8s = icpToE8s(amountIcp);

      const result = await ledger.icrc1_transfer({
        to: {
          owner: recipient,
          subaccount: [],
        },
        amount: amountE8s,
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
      });

      if ("Err" in result) {
        throw new Error(formatTransferError(result.Err));
      }

      return result.Ok;
    },
    onSuccess: () => {
      // Invalidate and refetch balance after successful transfer
      void queryClient.invalidateQueries({ queryKey: [ICP_BALANCE_QUERY_KEY] });
    },
  });
}
