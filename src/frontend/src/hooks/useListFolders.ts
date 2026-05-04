import { createActor } from "@/backend";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export interface SerializedFolder {
  folderId: string;
  ownerPrincipal: string;
  folderName: string;
  createTime: string;
}

export function useListFolders() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<SerializedFolder[]>({
    queryKey: ["folders"],
    queryFn: async () => {
      if (!actor) return [];
      const folders = await actor.listUserFolders();
      return folders.map((f) => ({
        folderId: f.folderId.toString(),
        ownerPrincipal: f.ownerPrincipal.toString(),
        folderName: f.folderName,
        createTime: f.createTime.toString(),
      }));
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}
