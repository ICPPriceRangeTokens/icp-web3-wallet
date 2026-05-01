import { Principal } from "@dfinity/principal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useAdminDeleteUserFiles() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipal: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.adminDeleteUserFiles(Principal.fromText(userPrincipal));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["subscribedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}
