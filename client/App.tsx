import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { BuilderStoreProvider } from "@/lib/builder-store";
import { BrandingProvider } from "@/lib/branding";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MenuManagement from "./pages/MenuManagement";
import Rewards from "./pages/Rewards";
import Whitelabeling from "./pages/Whitelabeling";
import Members from "./pages/Members";
import AccessControl from "./pages/AccessControl";
import Analytics from "./pages/Analytics";
import MobileAppBuilder from "./pages/MobileAppBuilder";
import MobileAppDesigner from "./pages/MobileAppDesigner";
import ManageUsers from "./pages/ManageUsers";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrandingProvider>
        <BuilderStoreProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
              <Route
                path="/builder"
                element={
                  <ProtectedRoute allowedRoles={["admin", "designer"]}>
                    <MobileAppBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/builder/:appId"
                element={
                  <ProtectedRoute allowedRoles={["admin", "designer"]}>
                    <MobileAppDesigner />
                  </ProtectedRoute>
                }
              />
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
            </BrowserRouter>
          </TooltipProvider>
        </BuilderStoreProvider>
      </BrandingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
