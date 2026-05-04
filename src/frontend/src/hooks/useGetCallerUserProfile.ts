import { createActor } from "@/backend";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export interface UserProfile {
  name: string;
  email: string;
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}
