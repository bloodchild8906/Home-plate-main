import { Outlet } from "react-router-dom";
import { PERMISSIONS } from "@shared/access-control";
import { ProtectedRoute } from "@/components/protected-route";
import { BuilderStoreProvider } from "@/lib/builder-store";

export default function BuilderWorkspaceRoute() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.builderManage]}>
      <BuilderStoreProvider>
        <Outlet />
      </BuilderStoreProvider>
    </ProtectedRoute>
  );
}
