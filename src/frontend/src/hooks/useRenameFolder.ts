import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useRenameFolder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      folderId,
      newName,
    }: { folderId: string; newName: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.renameFolder(BigInt(folderId), newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}
