import { Card, CardContent } from "@/components/ui/card";
import { Lock, Shield } from "lucide-react";
import { useIsAdmin } from "../hooks/useIsAdmin";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="pt-6 flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Admin access required to view this page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
