import { Toaster } from "@/components/ui/sonner";
import { Heart } from "lucide-react";
import React, { useState } from "react";
import AdminRoute from "./components/AdminRoute";
import Header from "./components/Header";
import LoginCard from "./components/LoginCard";
import Navigation from "./components/Navigation";
import type { Page } from "./components/Navigation";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { SendICPCard } from "./components/SendICPCard";
import SubscriptionStatus from "./components/SubscriptionStatus";
import { WalletCard } from "./components/WalletCard";
import { useGetCallerUserProfile } from "./hooks/useGetCallerUserProfile";
import { useGetICPBalance } from "./hooks/useGetICPBalance";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin } from "./hooks/useIsAdmin";
import AdminPanel from "./pages/AdminPanel";
import FileManager from "./pages/FileManager";
import SubscriptionPlans from "./pages/SubscriptionPlans";

function WalletDashboard() {
  const { identity, clear } = useInternetIdentity();
  const {
    data: balance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useGetICPBalance();

  if (!identity) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-5">
        <WalletCard
          identity={identity}
          balance={balance}
          isBalanceLoading={isBalanceLoading}
          isBalanceError={isBalanceError}
          onLogout={clear}
        />
        <SubscriptionStatus />
      </div>
      <SendICPCard balance={balance} />
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [currentPage, setCurrentPage] = useState<Page>("wallet");

  const { data: isAdmin } = useIsAdmin();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl gradient-teal opacity-20 blur-2xl scale-150 pointer-events-none" />
            <div className="relative w-16 h-16 rounded-2xl gradient-teal flex items-center justify-center teal-glow">
              <div className="w-7 h-7 rounded-full border-2 border-primary-foreground/80 border-t-transparent animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-foreground font-display font-bold text-lg">
              Cloud Storage
            </p>
            <p className="text-muted-foreground text-sm mt-0.5">
              Initializing...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "wallet":
        return <WalletDashboard />;
      case "subscriptions":
        return <SubscriptionPlans />;
      case "files":
        return (
          <FileManager
            onNavigateToPlans={() => setCurrentPage("subscriptions")}
          />
        );
      case "admin":
        return (
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full px-4 py-8 max-w-5xl">
        {!isAuthenticated ? (
          <LoginCard />
        ) : (
          <>
            <Navigation
              currentPage={currentPage}
              onNavigate={setCurrentPage}
              isAdmin={!!isAdmin}
            />
            {showProfileSetup && <ProfileSetupModal />}
            <div className="mt-7">{renderPage()}</div>
          </>
        )}
      </main>
      <footer className="py-6 text-center border-t border-border/30">
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Cloud Storage — Built with</span>
          <Heart size={12} className="text-destructive fill-current" />
          <span>using</span>
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="gradient-teal-text font-semibold hover:opacity-80 transition-opacity"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
      <Toaster />
    </div>
  );
}
