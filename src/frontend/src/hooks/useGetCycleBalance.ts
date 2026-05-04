import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { Principal } from "@dfinity/principal";
import { useMutation } from "@tanstack/react-query";
import envJson from "../../env.json";

export type CanisterInfo = {
  label: string;
  canisterId: string;
  cycles: bigint | null;
  error?: string;
};

/**
 * Queries cycle balances for backend and frontend canisters.
 * Calls actor.getBackendCycleBalance() on the backend canister.
 * Frontend canister ID is derived from project_id in env.json.
 */
export function useGetCycleBalance() {
  const { actor } = useActor(createActor);

  return useMutation({
    mutationFn: async (
      frontendCanisterId?: string,
    ): Promise<CanisterInfo[]> => {
      const backendCanisterId: string =
        (envJson as Record<string, string>).backend_canister_id ?? "unknown";

      // Query backend cycle balance
      let backendCycles: bigint | null = null;
      let backendError: string | undefined;
      if (actor) {
        try {
          const result = await (
            actor as unknown as {
              getBackendCycleBalance: () => Promise<bigint>;
            }
          ).getBackendCycleBalance();
          backendCycles = result;
        } catch (e) {
          backendError =
            e instanceof Error
              ? e.message.includes("has no update method") ||
                e.message.includes("has no query method")
                ? "getBackendCycleBalance() not yet available on backend"
                : e.message
              : "Failed to query cycle balance";
        }
      } else {
        backendError = "Not authenticated";
      }

      const results: CanisterInfo[] = [
        {
          label: "Backend Canister",
          canisterId: backendCanisterId,
          cycles: backendCycles,
          error: backendError,
        },
      ];

      // If a frontend canister ID was provided, query it via the backend
      if (frontendCanisterId?.trim()) {
        let frontendCycles: bigint | null = null;
        let frontendError: string | undefined;
        if (actor) {
          try {
            const principal = Principal.fromText(frontendCanisterId.trim());
            const result = await (
              actor as unknown as {
                getFrontendCycleBalance: (
                  canisterId: Principal,
                ) => Promise<bigint>;
              }
            ).getFrontendCycleBalance(principal);
            frontendCycles = result;
          } catch (e) {
            frontendError =
              e instanceof Error
                ? e.message.includes("has no update method") ||
                  e.message.includes("has no query method")
                  ? "getFrontendCycleBalance() not yet available on backend"
                  : e.message
                : "Failed to query frontend canister cycles";
          }
        } else {
          frontendError = "Not authenticated";
        }

        results.push({
          label: "Frontend Canister",
          canisterId: frontendCanisterId.trim(),
          cycles: frontendCycles,
          error: frontendError,
        });
      }

      return results;
    },
  });
}

export function formatTrillionCycles(cycles: bigint): string {
  const t = Number(cycles) / 1_000_000_000_000;
  if (t >= 1) return `${t.toFixed(3)} T`;
  const b = Number(cycles) / 1_000_000_000;
  if (b >= 1) return `${b.toFixed(2)} B`;
  return cycles.toLocaleString();
}
