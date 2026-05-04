import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useIsAdmin() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}
