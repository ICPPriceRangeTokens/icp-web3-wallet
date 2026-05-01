import { useQuery } from "@tanstack/react-query";
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
  /** @deprecated use status === 'active' instead */
  active: boolean;
}

export function useGetSubscription() {
  const { actor, isFetching } = useActor();

  return useQuery<SerializedSubscription | null>({
    queryKey: ["subscription"],
    queryFn: async () => {
      if (!actor) return null;
      const sub = await actor.getSubscription();
      if (!sub) return null;
      const isActive = sub.status !== SubscriptionStatus.revoked;

      return {
        principal: sub.principal.toString(),
        planId: sub.planId.toString(),
        storageLimitBytes: sub.storageLimitBytes.toString(),
        usedStorageBytes: sub.usedStorageBytes.toString(),
        startTime: sub.startTime.toString(),
        endTime: sub.endTime.toString(),
        status: isActive ? "active" : "revoked",
        active: isActive,
      };
    },
    enabled: !!actor && !isFetching,
  });
}
