import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useDeleteFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      const success = await actor.deleteFile(fileId);
      if (!success) throw new Error("Delete failed");
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["filesInFolder"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}
