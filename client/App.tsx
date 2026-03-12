import "./global.css";

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SplashScreen } from "@/components/splash-screen";
import { AuthProvider } from "@/lib/auth";
import { BrandingProvider } from "@/lib/branding";
import { installStaticRuntime, STATIC_RUNTIME } from "@/lib/static-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@shared/access-control";

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
const BlockBuilder = lazy(() => import("./pages/BlockBuilder"));
const FunctionBuilder = lazy(() => import("./pages/FunctionBuilder"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const BuilderWorkspaceRoute = lazy(() => import("./routes/BuilderWorkspaceRoute"));

const queryClient = new QueryClient();

installStaticRuntime();

function RouteLoader() {
  return <SplashScreen message="Loading workspace..." />;
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
                  <Route path="/register" element={<Register />} />
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
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.menusManage]}>
                        <MenuManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/block-builder"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.builderManage]}>
                        <BlockBuilder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/function-builder"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.builderManage]}>
                        <FunctionBuilder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/rewards"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.rewardsManage]}>
                        <Rewards />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/whitelabeling"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.brandingManage]}>
                        <Whitelabeling />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/members"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.membersManage]}>
                        <Members />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/access-control"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.accessManage]}>
                        <AccessControl />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manage-users"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.usersManage]}>
                        <ManageUsers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.analyticsView]}>
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
                  <Route path="/register" element={<Register />} />
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
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.menusManage]}>
                        <MenuManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/block-builder"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.builderManage]}>
                        <BlockBuilder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/function-builder"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.builderManage]}>
                        <FunctionBuilder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/rewards"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.rewardsManage]}>
                        <Rewards />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/whitelabeling"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.brandingManage]}>
                        <Whitelabeling />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/members"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.membersManage]}>
                        <Members />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/access-control"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.accessManage]}>
                        <AccessControl />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manage-users"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.usersManage]}>
                        <ManageUsers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute requiredPermissions={[PERMISSIONS.analyticsView]}>
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
