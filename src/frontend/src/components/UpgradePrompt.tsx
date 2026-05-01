import { Lock, Zap } from "lucide-react";
import React from "react";

interface UpgradePromptProps {
  onNavigateToPlans: () => void;
}

export default function UpgradePrompt({
  onNavigateToPlans,
}: UpgradePromptProps) {
  return (
    <div className="glass-card rounded-2xl p-10 flex flex-col items-center text-center gap-5">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary/70" />
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full gradient-teal flex items-center justify-center shadow-sm">
          <Zap className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      </div>

      <div>
        <h2 className="font-display font-bold text-xl text-foreground tracking-tight">
          Subscription Required
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm">
          File management is a premium feature. Subscribe to a plan to upload,
          download, and manage your files on the Internet Computer.
        </p>
      </div>

      <button
        type="button"
        data-ocid="upgrade.view_plans.button"
        onClick={onNavigateToPlans}
        className="btn-teal flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
      >
        <Zap className="w-4 h-4" />
        View Subscription Plans
      </button>
    </div>
  );
}
