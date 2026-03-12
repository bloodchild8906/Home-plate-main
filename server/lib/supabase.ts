function getSupabaseConfig() {
  const pickFirstNonEmpty = (...values: Array<string | undefined>) =>
    values.find((value) => typeof value === "string" && value.trim().length > 0) ?? "";

  const url = pickFirstNonEmpty(
    process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_URL,
  )
    .trim()
    .replace(/\/+$/, "");

  const apiKey = pickFirstNonEmpty(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  ).trim();

  return { url, apiKey };
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    if ("message" in payload && typeof payload.message === "string") {
      return payload.message;
    }

    if ("error" in payload && typeof payload.error === "string") {
      return payload.error;
    }
  }

  return fallback;
}

export function assertSupabaseConfigured() {
  const { url, apiKey } = getSupabaseConfig();
  if (!url || !apiKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY).",
    );
  }
}

export async function supabaseRequest<T>(
  path: string,
  init: RequestInit & {
    prefer?: string[];
    allowEmpty?: boolean;
  } = {},
) {
  assertSupabaseConfigured();
  const { url, apiKey } = getSupabaseConfig();

  const headers = new Headers(init.headers);
  headers.set("apikey", apiKey);
  headers.set("Authorization", `Bearer ${apiKey}`);

  if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (init.prefer?.length) {
    headers.set("Prefer", init.prefer.join(","));
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T | { message?: string; error?: string }) : null;

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(
        payload,
        `Supabase request failed with status ${response.status}`,
      ),
    );
  }

  if (!text) {
    return init.allowEmpty ? (null as T) : ([] as T);
  }

  return payload as T;
}
