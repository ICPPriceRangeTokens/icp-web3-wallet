import type { Identity } from "@icp-sdk/core/agent";
import { Check, Copy, LogOut, RefreshCw, Wallet } from "lucide-react";
import React, { useState } from "react";

interface WalletCardProps {
  identity: Identity;
  balance: string | undefined;
  isBalanceLoading: boolean;
  isBalanceError: boolean;
  onLogout: () => void;
}

export function WalletCard({
  identity,
  balance,
  isBalanceLoading,
  isBalanceError,
  onLogout,
}: WalletCardProps) {
  const [copied, setCopied] = useState(false);
  const principalId = identity.getPrincipal().toString();

  const handleCopyPrincipal = async () => {
    try {
      await navigator.clipboard.writeText(principalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = principalId;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortPrincipal = `${principalId.slice(0, 14)}...${principalId.slice(-8)}`;

  return (
    <div
      data-ocid="wallet.card"
      className="premium-card rounded-3xl p-6 animate-slide-up space-y-5"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-teal flex items-center justify-center teal-glow">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="section-label">My Wallet</p>
            <p className="text-sm font-bold text-foreground font-display leading-tight">
              ICP Account
            </p>
          </div>
        </div>

        <button
          type="button"
          data-ocid="wallet.logout.button"
          onClick={onLogout}
          className="btn-ghost-teal flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
          title="Logout"
        >
          <LogOut size={12} />
          <span>Logout</span>
        </button>
      </div>

      {/* Balance block — dramatic */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 border border-primary/30"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.18) 0%, oklch(0.62 0.22 208 / 0.10) 100%)",
          boxShadow:
            "inset 0 1px 0 oklch(0.78 0.195 188 / 0.20), 0 4px 24px oklch(0.78 0.195 188 / 0.08)",
        }}
      >
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.195 188 / 0.20), transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.64 0.22 205 / 0.14), transparent 70%)",
          }}
        />
        <p className="section-label mb-3">ICP Balance</p>
        {isBalanceLoading && !balance ? (
          <div className="flex items-end gap-2">
            <div className="h-14 w-44 shimmer rounded-xl" />
            <div className="h-6 w-12 shimmer rounded-lg mb-1" />
          </div>
        ) : isBalanceError ? (
          <p className="text-sm text-destructive font-medium">
            Failed to load balance
          </p>
        ) : (
          <div className="flex items-end gap-3">
            <span className="balance-number text-6xl text-foreground teal-text-glow leading-none">
              {balance ?? "—"}
            </span>
            <span className="text-2xl font-bold text-primary mb-1">ICP</span>
            {isBalanceLoading && (
              <RefreshCw
                size={14}
                className="text-muted-foreground mb-2 animate-spin"
              />
            )}
          </div>
        )}
      </div>

      {/* Principal ID */}
      <div>
        <p className="section-label mb-2">Principal ID</p>
        <button
          type="button"
          data-ocid="wallet.principal.button"
          onClick={handleCopyPrincipal}
          className="w-full flex items-center justify-between gap-3 glass-card px-4 py-3 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
          title="Click to copy Principal ID"
        >
          <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
            <span className="hidden sm:inline">{principalId}</span>
            <span className="sm:hidden">{shortPrincipal}</span>
          </span>
          <div className="flex-shrink-0 flex items-center gap-1.5">
            {copied ? (
              <>
                <Check size={13} className="text-success" />
                <span className="text-xs font-semibold text-success">
                  Copied!
                </span>
              </>
            ) : (
              <>
                <Copy
                  size={13}
                  className="text-muted-foreground group-hover:text-primary transition-colors"
                />
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  Copy
                </span>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
