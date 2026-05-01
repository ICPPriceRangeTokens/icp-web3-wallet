import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useSetPaymentDestination() {
  const { actor } = useActor();
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
