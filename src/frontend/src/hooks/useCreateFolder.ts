import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useCreateFolder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderName: string) => {
      if (!actor) throw new Error("Actor not available");
      const folderId = await actor.createFolder(folderName);
      return folderId.toString();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}
