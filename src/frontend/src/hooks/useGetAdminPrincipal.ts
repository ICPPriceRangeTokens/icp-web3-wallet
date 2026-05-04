import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@dfinity/principal";
import { useQuery } from "@tanstack/react-query";

export function useGetAdminPrincipal() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<Principal | null>({
    queryKey: ["adminPrincipal"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAdminPrincipal();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 60, // 1 hour - admin principal rarely changes
  });
}
