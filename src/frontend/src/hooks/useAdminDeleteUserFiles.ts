import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { Principal } from "@dfinity/principal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminDeleteUserFiles() {
  const { actor } = useActor(createActor);
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
