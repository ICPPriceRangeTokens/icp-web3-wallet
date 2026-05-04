import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSetPaymentDestination() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (destination: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setPaymentDestination(destination);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentDestination"] });
    },
  });
}
