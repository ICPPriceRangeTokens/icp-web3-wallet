import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useGetPaymentDestination() {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ["paymentDestination"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPaymentDestination();
    },
    enabled: !!actor && !isFetching,
  });
}
