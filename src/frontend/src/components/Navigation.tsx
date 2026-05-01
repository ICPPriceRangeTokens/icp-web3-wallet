import { FolderOpen, Package, Shield, Wallet } from "lucide-react";
import type React from "react";

export type Page = "wallet" | "subscriptions" | "files" | "admin";

export interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isAdmin?: boolean;
}

export default function Navigation({
  currentPage,
  onNavigate,
  isAdmin,
}: NavigationProps) {
  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: "wallet", label: "Wallet", icon: <Wallet className="w-4 h-4" /> },
    {
      id: "subscriptions",
      label: "Plans",
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: "files",
      label: "Files",
      icon: <FolderOpen className="w-4 h-4" />,
    },
    ...(isAdmin
      ? [
          {
            id: "admin" as Page,
            label: "Admin",
            icon: <Shield className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  return (
    <nav
      data-ocid="main.tab"
      className="nav-pill flex gap-1 p-1.5 rounded-2xl w-full"
    >
      {navItems.map((item) => (
        <button
          type="button"
          key={item.id}
          data-ocid={`nav.${item.id}.tab`}
          onClick={() => onNavigate(item.id)}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-bold transition-all duration-200 flex-1 justify-center ${
            currentPage === item.id
              ? "gradient-teal text-primary-foreground shadow-teal-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          {item.icon}
          <span className="hidden sm:inline">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
