import { installStaticDemoApi } from "@/lib/static-demo-api";

export const STATIC_RUNTIME = import.meta.env.VITE_STATIC_MODE === "true";

let installed = false;

export function installStaticRuntime() {
  if (!STATIC_RUNTIME || installed || typeof window === "undefined") {
    return;
  }

  installed = true;
  installStaticDemoApi();
}
