import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { Principal } from "@dfinity/principal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAdminDeleteUserSubscription() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminDeleteUserSubscription(Principal.fromText(principal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["subscribedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminSubscriptions"] });
    },
  });
}
