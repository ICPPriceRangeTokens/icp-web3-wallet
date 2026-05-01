import {
  AlertTriangle,
  Calendar,
  HardDrive,
  ShieldOff,
  Zap,
} from "lucide-react";
import React from "react";
import { useGetSubscription } from "../hooks/useGetSubscription";
import { formatStorageSize, nanosecondsToDate } from "../utils/storage";

interface SubscriptionStatusProps {
  onNavigateToPlans?: () => void;
}

export default function SubscriptionStatus({
  onNavigateToPlans,
}: SubscriptionStatusProps) {
  const { data: subscription, isLoading } = useGetSubscription();

  if (isLoading) {
    return (
      <div className="premium-card rounded-3xl p-5 space-y-3">
        <div className="h-4 shimmer rounded-lg w-1/3" />
        <div className="h-2 shimmer rounded-full" />
        <div className="h-4 shimmer rounded-lg w-1/2" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div
        data-ocid="subscription.empty_state"
        className="premium-card rounded-3xl p-6 flex flex-col items-center text-center gap-4 animate-slide-up relative overflow-hidden"
        style={{ animationDelay: "0.16s" }}
      >
        {/* Decorative background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 100%, oklch(0.78 0.195 188 / 0.07), transparent)",
          }}
        />

        {/* Icon with layered glow */}
        <div className="relative mt-1">
          <div
            className="absolute inset-0 rounded-2xl scale-[1.8] blur-xl pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.195 188 / 0.18), transparent 70%)",
            }}
          />
          <div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center border border-primary/25"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.20), oklch(0.62 0.22 208 / 0.12))",
            }}
          >
            <HardDrive className="w-7 h-7 text-primary" />
          </div>
        </div>

        <div>
          <p className="font-display font-bold text-base text-foreground">
            No Active Subscription
          </p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Subscribe to a plan to start uploading files to the Internet
            Computer.
          </p>
        </div>

        {onNavigateToPlans && (
          <button
            type="button"
            data-ocid="subscription.view_plans.button"
            onClick={onNavigateToPlans}
            className="btn-teal flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs mt-1"
          >
            <Zap className="w-3.5 h-3.5" />
            View Plans
          </button>
        )}

        {/* Bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, oklch(0.78 0.195 188 / 0.04), transparent)",
          }}
        />
      </div>
    );
  }

  const storageLimitBytes = BigInt(subscription.storageLimitBytes);
  const usedStorageBytes = BigInt(subscription.usedStorageBytes);
  const isActive = subscription.status === "active";
  const isRevoked = subscription.status === "revoked";

  const usagePercent =
    storageLimitBytes > BigInt(0)
      ? Math.min(
          100,
          Number((usedStorageBytes * BigInt(100)) / storageLimitBytes),
        )
      : 0;

  const isNearFull = usagePercent >= 80;
  const isFull = usagePercent >= 100;

  const expiryDate = nanosecondsToDate(subscription.endTime);

  // Progress bar gradient color
  const progressGradient = isFull
    ? "linear-gradient(to right, oklch(0.6 0.24 25), oklch(0.55 0.22 25))"
    : isNearFull
      ? "linear-gradient(to right, oklch(0.78 0.18 72), oklch(0.72 0.16 72))"
      : "linear-gradient(to right, oklch(0.78 0.195 188), oklch(0.62 0.22 208))";

  return (
    <div
      data-ocid="subscription.card"
      className={`premium-card rounded-3xl p-5 animate-slide-up space-y-4 ${
        isRevoked ? "border-warning/30" : ""
      }`}
      style={{ animationDelay: "0.16s" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center border border-primary/25"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.20), oklch(0.62 0.22 208 / 0.12))",
            }}
          >
            <HardDrive className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="section-label">Storage Plan</p>
            <span className="text-sm font-display font-bold text-foreground">
              Cloud Storage
            </span>
          </div>
        </div>

        {isRevoked ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-warning bg-warning/10 border border-warning/25 px-2.5 py-1 rounded-full">
            <ShieldOff className="w-3 h-3" />
            Revoked
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-bold text-success bg-success/10 border border-success/25 px-2.5 py-1 rounded-full">
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            Active
          </span>
        )}
      </div>

      {/* Storage bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-foreground font-semibold">
            {formatStorageSize(usedStorageBytes)} used
          </span>
          <span className="text-muted-foreground">
            {formatStorageSize(storageLimitBytes)} total
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "oklch(0.20 0.025 258)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${usagePercent}%`, background: progressGradient }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {usagePercent}% used
        </p>
      </div>

      {/* Expiry */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="w-3.5 h-3.5 text-primary/60" />
        <span>
          Expires:{" "}
          <span className="text-foreground font-semibold">{expiryDate}</span>
        </span>
      </div>

      {/* Warnings */}
      {isFull && isActive && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Storage full. Delete files or upgrade your plan to upload more.
          </span>
        </div>
      )}
      {isNearFull && !isFull && isActive && (
        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-xl text-xs text-warning">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Storage almost full ({usagePercent}%). Consider upgrading your plan.
          </span>
        </div>
      )}
      {isRevoked && (
        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-xl text-xs text-warning">
          <ShieldOff className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Subscription revoked. Uploads suspended — you can still download and
            delete files. Extend to restore access.
          </span>
        </div>
      )}

      {/* CTA */}
      {onNavigateToPlans && (
        <button
          type="button"
          data-ocid="subscription.extend.button"
          onClick={onNavigateToPlans}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            isRevoked ? "btn-teal" : "btn-ghost-teal"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          {isRevoked
            ? "Extend to Restore Access"
            : isActive
              ? "Extend / Switch Plan"
              : "Re-subscribe"}
        </button>
      )}
    </div>
  );
}
