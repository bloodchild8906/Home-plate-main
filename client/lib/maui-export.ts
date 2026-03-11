import {
  type BuilderExportApp,
  type BuilderMauiExportResponse,
  type ApiResponse,
} from "@shared/api";

export async function exportMauiHybridProject(app: BuilderExportApp) {
  const response = await fetch("/api/builder/export-maui", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app }),
  });

  const payload = (await response.json()) as ApiResponse<BuilderMauiExportResponse>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error ?? "Failed to build .NET MAUI Blazor Hybrid project");
  }

  return payload.data;
}
