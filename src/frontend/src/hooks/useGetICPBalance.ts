import { useQuery } from "@tanstack/react-query";
import { e8sToIcp } from "../utils/icp";
import { createLedgerActor } from "../utils/ledger";
import { useInternetIdentity } from "./useInternetIdentity";

export const ICP_BALANCE_QUERY_KEY = "balance";

export function useGetICPBalance() {
  const { identity } = useInternetIdentity();

  return useQuery<string>({
    queryKey: [ICP_BALANCE_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!identity) return "0.0000";
      const ledger = await createLedgerActor(identity);
      const principal = identity.getPrincipal();
      const balanceE8s: bigint = await ledger.icrc1_balance_of({
        owner: principal,
        subaccount: [],
      });
      // Convert BigInt e8s to ICP string immediately to avoid serialization issues
      return e8sToIcp(balanceE8s);
    },
    enabled: !!identity,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
