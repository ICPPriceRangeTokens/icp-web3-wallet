import { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SubscriptionStatus } from "../backend";
import { useActor } from "./useActor";

export interface SerializedSubscription {
  principal: string;
  planId: string;
  storageLimitBytes: string;
  usedStorageBytes: string;
  startTime: string;
  endTime: string;
  status: "active" | "revoked";
}

export function useAdminListUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<SerializedSubscription[]>({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      if (!actor) return [];
      const users = await actor.adminListUsers();
      return users.map((u) => ({
        principal: u.principal.toString(),
        planId: u.planId.toString(),
        storageLimitBytes: u.storageLimitBytes.toString(),
        usedStorageBytes: u.usedStorageBytes.toString(),
        startTime: u.startTime.toString(),
        endTime: u.endTime.toString(),
        status: u.status === SubscriptionStatus.revoked ? "revoked" : "active",
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminUpdateSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      principal,
      planId,
      startTime,
      endTime,
      status,
    }: {
      principal: string;
      planId: string;
      startTime: string;
      endTime: string;
      status: "active" | "revoked";
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminSetSubscription(
        Principal.fromText(principal),
        BigInt(planId),
        BigInt(startTime),
        BigInt(endTime),
        status === "revoked"
          ? SubscriptionStatus.revoked
          : SubscriptionStatus.active,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["subscribedUsers"] });
    },
  });
}

export function useRevokeSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminRevokeSubscription(Principal.fromText(principal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["subscribedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminSubscriptions"] });
    },
  });
}
