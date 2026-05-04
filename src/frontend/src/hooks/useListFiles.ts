import { createActor } from "@/backend";
import type { FileMetadata } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useListFiles() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<FileMetadata[]>({
    queryKey: ["files"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFiles();
    },
    enabled: !!actor && !actorFetching,
  });
}
