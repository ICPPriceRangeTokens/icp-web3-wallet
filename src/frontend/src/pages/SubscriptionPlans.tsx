import {
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
  Loader2,
  ShieldOff,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExtendResult } from "../hooks/useExtendSubscription";
import { useExtendSubscription } from "../hooks/useExtendSubscription";
import { useGetICPBalance } from "../hooks/useGetICPBalance";
import { useGetSubscription } from "../hooks/useGetSubscription";
import { useListPlans } from "../hooks/useListPlans";
import type { PurchaseResult } from "../hooks/usePurchaseSubscription";
import { usePurchaseSubscription } from "../hooks/usePurchaseSubscription";
import { formatStorageSize, nanosecondsToDate } from "../utils/storage";

type SerializedPlan = {
  planId: string;
  storageLimitBytes: string;
  durationSeconds: string;
  priceE8s: string;
  active: boolean;
};

type SerializedSubscription = {
  planId: string;
  storageLimitBytes: string;
  usedStorageBytes: string;
  startTime: string;
  endTime: string;
  status: "active" | "revoked";
  active: boolean;
};

function e8sToIcp(e8s: string): string {
  return (Number(BigInt(e8s)) / 1e8).toFixed(4);
}

function secondsToDays(seconds: string): number {
  return Math.round(Number(BigInt(seconds)) / 86400);
}

/** How long (ms) to poll for subscription to appear after payment */
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function SubscriptionPlans() {
  const { data: subscription, refetch: refetchSubscription } =
    useGetSubscription();
  const { data: plans = [], isLoading: plansLoading } = useListPlans();
  const { data: balance } = useGetICPBalance();
  const purchaseSubscription = usePurchaseSubscription();
  const extendSubscription = useExtendSubscription();

  // Track which plan is currently being polled after payment
  const [pollingPlanId, setPollingPlanId] = useState<string | null>(null);
  const [pollingStarted, setPollingStarted] = useState<number | null>(null);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [purchaseError, setPurchaseError] = useState<Record<string, string>>(
    {},
  );
  const [purchaseSuccess, setPurchaseSuccess] = useState<
    Record<string, PurchaseResult | boolean>
  >({});
  const [extendError, setExtendError] = useState<Record<string, string>>({});
  const [extendSuccess, setExtendSuccess] = useState<
    Record<string, ExtendResult | boolean>
  >({});

  const sub = subscription as SerializedSubscription | null | undefined;
  const activePlans = (plans as SerializedPlan[]).filter((p) => p.active);

  const isRevoked = sub?.status === "revoked";
  const hasSubscription = !!sub;

  // Start polling when activationPending is true
  const startPolling = (planId: string) => {
    setPollingPlanId(planId);
    setPollingStarted(Date.now());
    setPollingTimedOut(false);

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      const result = await refetchSubscription();
      const sub = result.data as SerializedSubscription | null | undefined;

      if (sub?.status === "active") {
        // Subscription appeared — clear polling state
        stopPolling();
        setPollingPlanId(null);
        setPollingTimedOut(false);
        // Clear any success state to show the active banner
        setPurchaseSuccess({});
        setExtendSuccess({});
      } else if (
        pollingStarted !== null &&
        Date.now() - pollingStarted > POLL_TIMEOUT_MS
      ) {
        stopPolling();
        setPollingTimedOut(true);
      }
    }, 3000);
  };

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Clear polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // When subscription becomes active, clear polling
  useEffect(() => {
    if (sub?.status === "active" && pollingPlanId) {
      stopPolling();
      setPollingPlanId(null);
      setPollingTimedOut(false);
      setPurchaseSuccess({});
      setExtendSuccess({});
    }
  }, [sub?.status, pollingPlanId, stopPolling]);

  const handlePurchase = async (plan: SerializedPlan) => {
    setPurchaseError((prev) => ({ ...prev, [plan.planId]: "" }));
    setPurchaseSuccess((prev) => ({ ...prev, [plan.planId]: false }));
    setPollingTimedOut(false);
    try {
      const result = await purchaseSubscription.mutateAsync(
        BigInt(plan.planId),
      );
      setPurchaseSuccess((prev) => ({ ...prev, [plan.planId]: result }));
      if (result.activationPending) {
        startPolling(plan.planId);
      }
    } catch (err: any) {
      setPurchaseError((prev) => ({
        ...prev,
        [plan.planId]: err?.message || "Purchase failed",
      }));
    }
  };

  const handleExtend = async (plan: SerializedPlan) => {
    setExtendError((prev) => ({ ...prev, [plan.planId]: "" }));
    setExtendSuccess((prev) => ({ ...prev, [plan.planId]: false }));
    setPollingTimedOut(false);
    try {
      const switching = isSwitching(plan);
      const result = await extendSubscription.mutateAsync({
        planId: BigInt(plan.planId),
        isSwitching: switching,
      });
      setExtendSuccess((prev) => ({ ...prev, [plan.planId]: result }));
      if (result.activationPending) {
        startPolling(plan.planId);
      }
    } catch (err: any) {
      setExtendError((prev) => ({
        ...prev,
        [plan.planId]: err?.message || "Extension failed",
      }));
    }
  };

  const isCurrentPlan = (plan: SerializedPlan) => sub?.planId === plan.planId;
  // Any plan can be used to extend/switch when user already has a subscription
  const canExtend = (_plan: SerializedPlan) => hasSubscription;
  const isSwitching = (plan: SerializedPlan) =>
    hasSubscription && !isCurrentPlan(plan);

  const realUsedBytes = sub ? Number(BigInt(sub.usedStorageBytes)) : 0;

  const storageUsedPct = sub
    ? Math.min(
        100,
        (realUsedBytes / Number(BigInt(sub.storageLimitBytes))) * 100,
      )
    : 0;

  const isPlanPolling = (planId: string) => pollingPlanId === planId;

  return (
    <div className="space-y-7 animate-slide-up">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl gradient-teal flex items-center justify-center teal-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-foreground tracking-tight">
              Subscription Plans
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose a plan to unlock file storage on the Internet Computer
            </p>
          </div>
        </div>
        {balance !== undefined && (
          <div className="glass-card flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl shrink-0">
            <span className="text-foreground font-mono balance-number text-sm">
              {balance}
            </span>
            <span className="text-muted-foreground">ICP available</span>
          </div>
        )}
      </div>

      {/* Active subscription banner */}
      {sub && sub.status === "active" && (
        <div
          data-ocid="subscription.active.card"
          className="premium-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 border-success/25"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-success/15 border border-success/25 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-foreground">
                Active Subscription
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatStorageSize(realUsedBytes)} /{" "}
                {formatStorageSize(Number(BigInt(sub.storageLimitBytes)))} used
                {" · "}Expires {nanosecondsToDate(sub.endTime)}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-36 space-y-1.5">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "oklch(0.20 0.025 258)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${storageUsedPct}%`,
                  background:
                    "linear-gradient(to right, oklch(0.72 0.185 155), oklch(0.62 0.18 160))",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {storageUsedPct.toFixed(0)}% used
            </p>
          </div>
        </div>
      )}

      {/* Revoked banner */}
      {sub && isRevoked && (
        <div className="premium-card rounded-2xl p-4 flex items-start gap-3 border-warning/30">
          <div className="w-9 h-9 rounded-xl bg-warning/12 border border-warning/25 flex items-center justify-center shrink-0">
            <ShieldOff className="w-4 h-4 text-warning" />
          </div>
          <div>
            <p className="text-sm font-display font-bold text-warning">
              Subscription Revoked
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your subscription was revoked by an admin. Uploads suspended — you
              can still download and delete existing files. Extend below to
              restore access.
            </p>
          </div>
        </div>
      )}

      {/* Polling timed out banner */}
      {pollingTimedOut && (
        <div
          data-ocid="subscription.timeout.card"
          className="premium-card rounded-2xl p-4 flex items-start gap-3 border-warning/30"
        >
          <div className="w-9 h-9 rounded-xl bg-warning/12 border border-warning/25 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-warning">
              Subscription Activation Delayed
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your payment was received but activation is taking longer than
              expected. Please refresh the page in a few minutes — your
              subscription will appear automatically once processed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPollingTimedOut(false)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Plans grid */}
      {plansLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-3xl p-6 space-y-4">
              <div className="h-8 shimmer rounded-xl w-2/3" />
              <div className="h-4 shimmer rounded-md w-1/2" />
              <div className="h-px bg-border/30" />
              <div className="h-12 shimmer rounded-xl mt-2" />
            </div>
          ))}
        </div>
      ) : activePlans.length === 0 ? (
        <div
          data-ocid="plans.empty_state"
          className="premium-card rounded-2xl p-12 text-center"
        >
          <p className="text-sm text-muted-foreground">
            No plans available at this time. Check back later.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activePlans.map((plan: SerializedPlan, idx) => {
            const isCurrent = isCurrentPlan(plan);
            const canExt = canExtend(plan);
            const isSwitch = isSwitching(plan);
            const isPurchasing = purchaseSubscription.isPending;
            const isExtending = extendSubscription.isPending;
            const pErr = purchaseError[plan.planId];
            const eErr = extendError[plan.planId];
            const pSuccessRaw = purchaseSuccess[plan.planId];
            const eSuccessRaw = extendSuccess[plan.planId];
            const isPolling = isPlanPolling(plan.planId);

            // Clean activation (no pending)
            const pSuccess =
              typeof pSuccessRaw === "object" &&
              pSuccessRaw !== null &&
              "activated" in pSuccessRaw &&
              pSuccessRaw.activated;
            const eSuccess =
              typeof eSuccessRaw === "object" &&
              eSuccessRaw !== null &&
              "extended" in eSuccessRaw &&
              eSuccessRaw.extended;

            return (
              <div
                key={plan.planId}
                data-ocid={`plan.card.${idx + 1}`}
                className={`premium-card glass-card-hover rounded-3xl p-6 flex flex-col gap-5 ${
                  isCurrent && isRevoked
                    ? "border-warning/40"
                    : isCurrent
                      ? "border-primary/40"
                      : ""
                }`}
              >
                {/* Plan price header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="section-label mb-1.5">Plan Price</p>
                    <p className="font-display font-black text-4xl tracking-tight gradient-teal-text teal-text-glow">
                      {e8sToIcp(plan.priceE8s)}
                      <span className="text-xl font-bold text-primary ml-1.5">
                        ICP
                      </span>
                    </p>
                  </div>
                  {isCurrent && (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        isRevoked
                          ? "text-warning bg-warning/10 border-warning/30"
                          : "text-primary bg-primary/10 border-primary/25"
                      }`}
                    >
                      {isRevoked ? "Revoked" : "Current"}
                    </span>
                  )}
                </div>

                <div className="h-px bg-border/30" />

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-primary/28"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.22), oklch(0.62 0.22 208 / 0.14))",
                      }}
                    >
                      <HardDrive className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Storage</p>
                      <p className="text-sm font-bold text-foreground">
                        {formatStorageSize(
                          Number(BigInt(plan.storageLimitBytes)),
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-primary/28"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.22), oklch(0.62 0.22 208 / 0.14))",
                      }}
                    >
                      <Clock className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Access</p>
                      <p className="text-sm font-bold text-foreground">
                        {secondsToDays(plan.durationSeconds)} days
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error messages */}
                {(pErr || eErr) && (
                  <div
                    data-ocid={`plan.error_state.${idx + 1}`}
                    className="flex items-start gap-2 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 animate-fade-in"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive flex-1">
                      {pErr || eErr}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (pErr)
                          setPurchaseError((prev) => ({
                            ...prev,
                            [plan.planId]: "",
                          }));
                        if (eErr)
                          setExtendError((prev) => ({
                            ...prev,
                            [plan.planId]: "",
                          }));
                      }}
                      className="text-destructive/60 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Processing / polling state */}
                {isPolling && (
                  <div
                    data-ocid={`plan.loading_state.${idx + 1}`}
                    className="flex items-center gap-3 p-3 rounded-xl animate-fade-in"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.18 0.040 200 / 0.35), oklch(0.14 0.030 210 / 0.25))",
                      border: "1px solid oklch(0.72 0.185 195 / 0.30)",
                    }}
                  >
                    <Loader2
                      className="w-4 h-4 animate-spin shrink-0"
                      style={{ color: "oklch(0.78 0.185 188)" }}
                    />
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "oklch(0.88 0.14 195)" }}
                      >
                        Activating your subscription...
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Payment confirmed. Setting up your account.
                      </p>
                    </div>
                  </div>
                )}

                {/* Clean success */}
                {pSuccess && !isPolling && (
                  <div
                    data-ocid={`plan.success_state.${idx + 1}`}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-success/10 border border-success/20 animate-fade-in"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                    <p className="text-xs text-success font-semibold">
                      Subscription activated!
                    </p>
                  </div>
                )}
                {eSuccess && !isPolling && (
                  <div
                    data-ocid={`plan.success_state.${idx + 1}`}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-success/10 border border-success/20 animate-fade-in"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                    <p className="text-xs text-success font-semibold">
                      {isSwitch
                        ? "Plan switched! Your files are preserved."
                        : "Subscription extended! Full access restored."}
                    </p>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-auto">
                  {canExt ? (
                    <button
                      type="button"
                      data-ocid={`plan.extend_button.${idx + 1}`}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                        isRevoked || isSwitch ? "btn-teal" : "btn-ghost-teal"
                      }`}
                      onClick={() => handleExtend(plan)}
                      disabled={isExtending || isPolling}
                    >
                      {isExtending || isPolling ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />{" "}
                          Processing...
                        </>
                      ) : isRevoked ? (
                        "Restore Access"
                      ) : isSwitch ? (
                        <>
                          <Zap className="w-4 h-4" />
                          Switch to This Plan
                        </>
                      ) : (
                        "Extend Subscription"
                      )}
                    </button>
                  ) : !hasSubscription ? (
                    <button
                      type="button"
                      data-ocid={`plan.subscribe_button.${idx + 1}`}
                      className="btn-teal w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm"
                      onClick={() => handlePurchase(plan)}
                      disabled={isPurchasing || isPolling}
                    >
                      {isPurchasing || isPolling ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />{" "}
                          {isPolling ? "Activating..." : "Processing..."}
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Subscribe Now
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
