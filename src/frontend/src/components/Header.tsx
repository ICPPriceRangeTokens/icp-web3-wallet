import { Cloud } from "lucide-react";
import React from "react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/18 bg-background/85 backdrop-blur-3xl shadow-[0_1px_0_oklch(0.78_0.195_188/0.14)]">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl gradient-teal opacity-30 blur-xl scale-150 pointer-events-none" />
            <div className="relative w-9 h-9 rounded-2xl gradient-teal flex items-center justify-center teal-glow">
              <Cloud className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <span className="font-display font-black text-lg tracking-tight gradient-teal-text">
            Cloud Storage
          </span>
        </div>

        {/* Mainnet badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full text-xs font-semibold text-foreground/70">
            <span className="status-dot" />
            <span>Mainnet</span>
          </div>
        </div>
      </div>
    </header>
  );
}
