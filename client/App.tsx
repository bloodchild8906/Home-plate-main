import "./global.css";

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { BrandingProvider } from "@/lib/branding";
import { installStaticRuntime, STATIC_RUNTIME } from "@/lib/static-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MenuManagement = lazy(() => import("./pages/MenuManagement"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Whitelabeling = lazy(() => import("./pages/Whitelabeling"));
const Members = lazy(() => import("./pages/Members"));
const AccessControl = lazy(() => import("./pages/AccessControl"));
const Analytics = lazy(() => import("./pages/Analytics"));
const MobileAppBuilder = lazy(() => import("./pages/MobileAppBuilder"));
const MobileAppDesigner = lazy(() => import("./pages/MobileAppDesigner"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const Login = lazy(() => import("./pages/Login"));
const BuilderWorkspaceRoute = lazy(() => import("./routes/BuilderWorkspaceRoute"));

const queryClient = new QueryClient();

installStaticRuntime();

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,hsl(var(--accent)/0.16),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.45))]">
      <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-border/70 bg-card/85 px-8 py-10 shadow-2xl backdrop-blur-xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <div className="text-sm font-semibold text-muted-foreground">
          Loading workspace...
        </div>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrandingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {STATIC_RUNTIME ? (
            <HashRouter>
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    }
                  />
                  <Route element={<BuilderWorkspaceRoute />}>
                    <Route path="/builder" element={<MobileAppBuilder />} />
                    <Route path="/builder/:appId" element={<MobileAppDesigner />} />
                  </Route>
                  <Route
                    path="/menu-management"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "operator"]}>
                        <MenuManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/rewards"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "operator"]}>
                        <Rewards />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/whitelabeling"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "designer"]}>
                        <Whitelabeling />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/members"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "operator"]}>
                        <Members />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/access-control"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AccessControl />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manage-users"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <ManageUsers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "analyst"]}>
                        <Analytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </HashRouter>
          ) : (
            <BrowserRouter>
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    }
                  />
                  <Route element={<BuilderWorkspaceRoute />}>
                    <Route path="/builder" element={<MobileAppBuilder />} />
                    <Route path="/builder/:appId" element={<MobileAppDesigner />} />
                  </Route>
                  <Route
                    path="/menu-management"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "operator"]}>
                        <MenuManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/rewards"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "operator"]}>
                        <Rewards />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/whitelabeling"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "designer"]}>
                        <Whitelabeling />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/members"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "operator"]}>
                        <Members />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/access-control"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AccessControl />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manage-users"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <ManageUsers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "analyst"]}>
                        <Analytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          )}
        </TooltipProvider>
      </BrandingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
