import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useGetPaymentDestination() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<string | null>({
    queryKey: ["paymentDestination"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPaymentDestination();
    },
    enabled: !!actor && !isFetching,
  });
}
