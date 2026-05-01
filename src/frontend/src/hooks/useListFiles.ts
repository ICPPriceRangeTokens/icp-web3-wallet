import { useQuery } from "@tanstack/react-query";
import type { FileMetadata } from "../backend";
import { useActor } from "./useActor";

export function useListFiles() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<FileMetadata[]>({
    queryKey: ["files"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFiles();
    },
    enabled: !!actor && !actorFetching,
  });
}
