import { Cloud, HardDrive, Lock, ShieldCheck, Zap } from "lucide-react";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginCard() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[82vh] px-4 overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.12]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.195 188), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.07]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.64 0.22 208), transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full opacity-[0.06]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.185 155), transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Hero mark */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative mb-7">
            <div className="absolute inset-0 rounded-3xl gradient-teal opacity-25 blur-3xl scale-[2.5] pointer-events-none" />
            <div className="relative w-24 h-24 rounded-3xl gradient-teal flex items-center justify-center teal-glow">
              <Cloud className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display font-black text-5xl tracking-tight text-center gradient-teal-text teal-text-glow mb-3">
            Cloud Storage
          </h1>
          <p className="text-lg text-muted-foreground text-center leading-relaxed max-w-xs">
            Decentralized, private file storage
            <br />
            powered by the Internet Computer
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { icon: <Lock className="w-5 h-5" />, label: "End-to-End Private" },
            { icon: <Zap className="w-5 h-5" />, label: "Instant Uploads" },
            {
              icon: <HardDrive className="w-5 h-5" />,
              label: "On-Chain Blobs",
            },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2.5 glass-card rounded-2xl p-4 text-center"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-primary border border-primary/28"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.22), oklch(0.62 0.22 208 / 0.14))",
                }}
              >
                {icon}
              </div>
              <span className="text-xs font-semibold text-foreground/75 leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Login CTA */}
        <button
          type="button"
          data-ocid="login.primary_button"
          onClick={login}
          disabled={isLoggingIn}
          className="btn-teal w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-base font-bold"
        >
          {isLoggingIn ? (
            <>
              <svg
                className="animate-spin w-5 h-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 shrink-0" />
              Sign In with Internet Identity
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground mt-5 leading-relaxed">
          No passwords, no email — your identity is secured
          <br />
          cryptographically via Internet Identity
        </p>
      </div>
    </div>
  );
}
