import { useQuery } from "@tanstack/react-query";
import { SubscriptionStatus } from "../backend";
import { useActor } from "./useActor";

export interface SerializedSubscribedUser {
  principal: string;
  planId: string;
  storageLimitBytes: string;
  startTime: string;
  endTime: string;
  status: "active" | "revoked";
}

export function useGetSubscribedUsers(isAdmin = false) {
  const { actor, isFetching } = useActor();

  return useQuery<SerializedSubscribedUser[]>({
    queryKey: ["subscribedUsers"],
    queryFn: async () => {
      if (!actor) return [];
      const users = await actor.getSubscribedUsers();
      return users.map((u) => ({
        principal: u.principal.toString(),
        planId: u.planId.toString(),
        storageLimitBytes: u.storageLimitBytes.toString(),
        startTime: u.startTime.toString(),
        endTime: u.endTime.toString(),
        status: u.status === SubscriptionStatus.revoked ? "revoked" : "active",
      }));
    },
    enabled: !!actor && !isFetching && isAdmin,
  });
}
