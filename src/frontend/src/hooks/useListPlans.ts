import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

export type SerializedPlan = {
  planId: string;
  storageLimitBytes: string;
  durationSeconds: string;
  priceE8s: string;
  active: boolean;
};

export function useListPlans() {
  const { actor, isFetching } = useActor();

  return useQuery<SerializedPlan[]>({
    queryKey: ["plans"],
    queryFn: async () => {
      if (!actor) return [];
      const plans = await actor.listPlans();
      return plans.map((plan) => ({
        planId: plan.planId.toString(),
        storageLimitBytes: plan.storageLimitBytes.toString(),
        durationSeconds: plan.durationSeconds.toString(),
        priceE8s: plan.priceE8s.toString(),
        active: plan.active,
      }));
    },
    enabled: !!actor && !isFetching,
  });
}
