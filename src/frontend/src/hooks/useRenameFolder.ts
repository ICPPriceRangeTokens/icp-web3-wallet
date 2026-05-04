import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useRenameFolder() {
  const { actor } = useActor(createActor);
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
