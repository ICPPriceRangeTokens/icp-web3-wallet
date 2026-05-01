import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Plan } from "../backend";
import { useActor } from "./useActor";

export interface SerializedPlan {
  planId: string;
  storageLimitBytes: string;
  durationSeconds: string;
  priceE8s: string;
  active: boolean;
}

function serializePlan(p: Plan): SerializedPlan {
  return {
    planId: p.planId.toString(),
    storageLimitBytes: p.storageLimitBytes.toString(),
    durationSeconds: p.durationSeconds.toString(),
    priceE8s: p.priceE8s.toString(),
    active: p.active,
  };
}

export function useListAllPlans() {
  const { actor, isFetching } = useActor();

  return useQuery<SerializedPlan[]>({
    queryKey: ["plans"],
    queryFn: async () => {
      if (!actor) return [];
      const plans: Plan[] = await actor.listPlans();
      return plans.map(serializePlan);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: SerializedPlan) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createPlan({
        planId: BigInt(plan.planId),
        storageLimitBytes: BigInt(plan.storageLimitBytes),
        durationSeconds: BigInt(plan.durationSeconds),
        priceE8s: BigInt(plan.priceE8s),
        active: plan.active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useUpdatePlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: SerializedPlan) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePlan({
        planId: BigInt(plan.planId),
        storageLimitBytes: BigInt(plan.storageLimitBytes),
        durationSeconds: BigInt(plan.durationSeconds),
        priceE8s: BigInt(plan.priceE8s),
        active: plan.active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useDeletePlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePlan(BigInt(planId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}
