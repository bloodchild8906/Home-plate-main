import type { PropsWithChildren, ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, type UserRole } from "@/lib/auth";

function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-xl border-border/60 bg-card/90 shadow-2xl">
        <CardHeader>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <CardTitle>Access denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your current role does not have permission to open this module.
          </p>
          <Button asChild>
            <Link to="/">Return to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProtectedRoute({
  children,
  allowedRoles,
  fallback,
}: PropsWithChildren<{
  allowedRoles?: UserRole[];
  fallback?: ReactNode;
}>) {
  const { isAuthenticated, isReady, hasAccess } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasAccess(allowedRoles)) {
    return <>{fallback ?? <AccessDenied />}</>;
  }

  return <>{children}</>;
}
