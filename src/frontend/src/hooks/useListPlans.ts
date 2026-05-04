import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export type SerializedPlan = {
  planId: string;
  storageLimitBytes: string;
  durationSeconds: string;
  priceE8s: string;
  active: boolean;
};

export function useListPlans() {
  const { actor, isFetching } = useActor(createActor);

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
