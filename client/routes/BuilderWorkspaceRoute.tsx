import { Outlet } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";
import { BuilderStoreProvider } from "@/lib/builder-store";

export default function BuilderWorkspaceRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin", "designer"]}>
      <BuilderStoreProvider>
        <Outlet />
      </BuilderStoreProvider>
    </ProtectedRoute>
  );
}
