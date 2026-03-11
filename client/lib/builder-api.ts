import type {
  BuilderApiParameterLocation,
  BuilderServerApiEndpoint,
} from "@shared/api";
import {
  createApiFunctionPropertyBinding,
  createBlock,
  type BuilderAppModel,
  type BuilderApiFunction,
  type BuilderApiFunctionPropertyBinding,
  type BuilderApiFunctionSourceField,
  type BuilderBlock,
  type BuilderBlockApiMethod,
} from "@/lib/builder-store";

export interface BuilderAuthBlockRef {
  pageId: string;
  pageName: string;
  block: BuilderBlock;
}

export interface ResolvedApiFunctionPropertyBinding {
  property: BuilderApiFunctionPropertyBinding;
  value: unknown;
  location: BuilderApiParameterLocation;
  required: boolean;
}

function acceptsRequestBody(method: BuilderBlockApiMethod) {
  return method !== "GET" && method !== "DELETE";
}

function getBlockFieldValue(
  block: BuilderBlock,
  field: BuilderApiFunctionSourceField,
) {
  switch (field) {
    case "helper":
      return block.helper ?? "";
    case "points":
      return block.points ?? 0;
    case "items":
      return block.items ?? [];
    case "htmlTag":
      return block.htmlTag ?? "";
    case "text":
    default:
      return block.text ?? "";
  }
}

function hasValue(value: unknown) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function getPropertyMeta(
  property: BuilderApiFunctionPropertyBinding,
  endpoint?: BuilderServerApiEndpoint | null,
) {
  const endpointParam =
    endpoint?.params.find(
      (param) =>
        param.name === property.key.trim() && param.location === property.location,
    ) ??
    endpoint?.params.find((param) => param.name === property.key.trim()) ??
    null;

  return {
    location:
      endpointParam?.location ??
      (property.location === "path" ||
      property.location === "query" ||
      property.location === "body"
        ? property.location
        : "body"),
    required: endpointParam?.required ?? property.required,
  };
}

function appendPayloadToEndpoint(
  endpoint: string,
  payload: Record<string, unknown>,
) {
  const searchParams = new URLSearchParams();

  Object.entries(payload).forEach(([key, value]) => {
    if (!hasValue(value)) {
      return;
    }

    if (Array.isArray(value)) {
      searchParams.set(key, value.join(","));
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  if (!query) {
    return endpoint;
  }

  return `${endpoint}${endpoint.includes("?") ? "&" : "?"}${query}`;
}

function interpolateEndpointPath(
  endpoint: string,
  pathPayload: Record<string, unknown>,
) {
  return endpoint.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = pathPayload[key];
    return hasValue(value) ? encodeURIComponent(String(value)) : `:${key}`;
  });
}

export function parseRequestHeaders(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return {} as Record<string, string>;
  }

  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    return Object.entries(parsed).reduce<Record<string, string>>((headers, [key, headerValue]) => {
      if (typeof headerValue === "string" && key.trim()) {
        headers[key.trim()] = headerValue;
      }
      return headers;
    }, {});
  }

  return trimmed.split("\n").reduce<Record<string, string>>((headers, line) => {
    const separator = line.indexOf(":");
    if (separator === -1) {
      return headers;
    }

    const key = line.slice(0, separator).trim();
    const headerValue = line.slice(separator + 1).trim();
    if (key && headerValue) {
      headers[key] = headerValue;
    }
    return headers;
  }, {});
}

export function findServerApiEndpoint(
  apiFunction: Pick<BuilderApiFunction, "endpointId" | "endpoint" | "method">,
  endpoints: BuilderServerApiEndpoint[],
) {
  return (
    endpoints.find((endpoint) => endpoint.id === apiFunction.endpointId) ??
    endpoints.find(
      (endpoint) =>
        endpoint.path === apiFunction.endpoint && endpoint.method === apiFunction.method,
    ) ??
    null
  );
}

export function listAuthBlocks(app: BuilderAppModel): BuilderAuthBlockRef[] {
  return app.pages.flatMap((page) =>
    page.blocks
      .filter((block) => block.type === "auth")
      .map((block) => ({
        pageId: page.id,
        pageName: page.name,
        block,
      })),
  );
}

export function findAuthBlock(
  app: BuilderAppModel,
  preferredAuthBlockId = "",
) {
  const authBlocks = listAuthBlocks(app);

  if (preferredAuthBlockId) {
    const preferred = authBlocks.find(
      (entry) => entry.block.id === preferredAuthBlockId,
    );
    if (preferred) {
      return preferred;
    }
  }

  return authBlocks[0] ?? null;
}

export function ensureAuthBlockForApp(app: BuilderAppModel) {
  const existing = findAuthBlock(app);
  if (existing) {
    return {
      app,
      authBlockId: existing.block.id,
      added: false,
    };
  }

  const authPageIndex = app.pages.findIndex(
    (page) => page.name.trim().toLowerCase() === "auth",
  );
  const authBlock = createBlock("auth", {
    text: "Sign in to continue",
    helper: "Protected API requests use the app auth flow automatically.",
  });

  if (authPageIndex >= 0) {
    const pages = app.pages.map((page, index) =>
      index === authPageIndex
        ? { ...page, blocks: [...page.blocks, authBlock] }
        : page,
    );

    return {
      app: { ...app, pages },
      authBlockId: authBlock.id,
      added: true,
    };
  }

  const authPage = {
    id: `p-${Math.random().toString(36).slice(2, 8)}`,
    name: "Auth",
    blocks: [authBlock],
  };

  return {
    app: { ...app, pages: [...app.pages, authPage] },
    authBlockId: authBlock.id,
    added: true,
  };
}

export function applyServerEndpointToFunction(
  app: BuilderAppModel,
  functionId: string,
  endpoint: BuilderServerApiEndpoint,
) {
  const authResult = endpoint.requiresAuth
    ? ensureAuthBlockForApp(app)
    : { app, authBlockId: "", added: false };
  const nextApp = authResult.app;

  return {
    app: {
      ...nextApp,
      apiFunctions: nextApp.apiFunctions.map((apiFunction) => {
        if (apiFunction.id !== functionId) {
          return apiFunction;
        }

        const endpointProperties = endpoint.params.map((param) => {
          const existing =
            apiFunction.properties.find(
              (property) =>
                property.key.trim() === param.name &&
                property.location === param.location,
            ) ??
            apiFunction.properties.find(
              (property) => property.key.trim() === param.name,
            );

          return createApiFunctionPropertyBinding({
            ...existing,
            key: param.name,
            location: param.location,
            required: param.required,
          });
        });

        const customProperties = apiFunction.properties.filter(
          (property) =>
            !endpoint.params.some(
              (param) =>
                param.name === property.key.trim() &&
                param.location === property.location,
            ),
        );

        return {
          ...apiFunction,
          endpointId: endpoint.id,
          endpoint: endpoint.path,
          method: endpoint.method,
          requiresAuth: endpoint.requiresAuth,
          authBlockId: endpoint.requiresAuth ? authResult.authBlockId : "",
          successMessage:
            apiFunction.successMessage.trim() || endpoint.successMessage || "",
          properties: [...endpointProperties, ...customProperties],
        };
      }),
    },
    addedAuthBlock: authResult.added,
    authBlockId: endpoint.requiresAuth ? authResult.authBlockId : "",
  };
}

export function resolveApiFunctionBindings(
  app: BuilderAppModel,
  apiFunction: BuilderApiFunction,
  endpoint?: BuilderServerApiEndpoint | null,
): ResolvedApiFunctionPropertyBinding[] {
  const blockMap = new Map(
    app.pages.flatMap((page) => page.blocks.map((block) => [block.id, block] as const)),
  );

  return apiFunction.properties.map((property) => {
    const meta = getPropertyMeta(property, endpoint);

    if (property.sourceType === "static") {
      return {
        property,
        value: property.staticValue,
        location:
          meta.location === "body" && !acceptsRequestBody(apiFunction.method)
            ? "query"
            : meta.location,
        required: meta.required,
      };
    }

    const sourceBlock = blockMap.get(property.sourceBlockId);

    return {
      property,
      value: sourceBlock
        ? getBlockFieldValue(sourceBlock, property.sourceField)
        : "",
      location:
        meta.location === "body" && !acceptsRequestBody(apiFunction.method)
          ? "query"
          : meta.location,
      required: meta.required,
    };
  });
}

export function buildApiFunctionRequest(
  app: BuilderAppModel,
  apiFunction: BuilderApiFunction,
  endpoint?: BuilderServerApiEndpoint | null,
) {
  const resolved = resolveApiFunctionBindings(app, apiFunction, endpoint);
  const pathPayload: Record<string, unknown> = {};
  const queryPayload: Record<string, unknown> = {};
  const bodyPayload: Record<string, unknown> = {};
  const missingRequired = new Set<string>();

  resolved.forEach(({ property, value, location, required }) => {
    const key = property.key.trim();
    if (!key) {
      return;
    }

    if (required && !hasValue(value)) {
      missingRequired.add(key);
      return;
    }

    if (!hasValue(value)) {
      return;
    }

    if (location === "path") {
      pathPayload[key] = value;
      return;
    }

    if (location === "query") {
      queryPayload[key] = value;
      return;
    }

    bodyPayload[key] = value;
  });

  let endpointPath = interpolateEndpointPath(apiFunction.endpoint, pathPayload);
  const unresolvedPathMatches = endpointPath.match(/:([A-Za-z0-9_]+)/g) ?? [];
  unresolvedPathMatches.forEach((match) => missingRequired.add(match.slice(1)));

  if (!acceptsRequestBody(apiFunction.method)) {
    Object.assign(queryPayload, bodyPayload);
  }

  endpointPath = appendPayloadToEndpoint(endpointPath, queryPayload);

  return {
    endpoint: endpointPath,
    bodyPayload,
    missingRequired: [...missingRequired],
  };
}

export async function executeApiFunction(
  app: BuilderAppModel,
  apiFunction: BuilderApiFunction,
  endpoints: BuilderServerApiEndpoint[],
) {
  const endpointMeta = findServerApiEndpoint(apiFunction, endpoints);
  const effectiveRequiresAuth = endpointMeta?.requiresAuth ?? apiFunction.requiresAuth;
  const authBlock = effectiveRequiresAuth
    ? findAuthBlock(app, apiFunction.authBlockId)
    : null;

  if (effectiveRequiresAuth && !authBlock) {
    throw new Error("Add an Auth block before calling this protected API endpoint");
  }

  const headers = parseRequestHeaders(apiFunction.headers);
  const requestData = buildApiFunctionRequest(app, apiFunction, endpointMeta);
  if (requestData.missingRequired.length > 0) {
    throw new Error(`Set values for required API params: ${requestData.missingRequired.join(", ")}`);
  }

  const request: RequestInit = {
    method: apiFunction.method,
    headers,
    credentials: effectiveRequiresAuth ? "include" : "same-origin",
  };

  if (
    apiFunction.method !== "GET" &&
    apiFunction.method !== "DELETE" &&
    Object.keys(requestData.bodyPayload).length > 0
  ) {
    request.body = JSON.stringify(requestData.bodyPayload);
    if (!Object.keys(headers).some((key) => key.toLowerCase() === "content-type")) {
      headers["Content-Type"] = "application/json";
    }
  }

  const response = await fetch(requestData.endpoint, request);
  const responseText = (await response.text()).trim();
  let payload: unknown = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      payload = responseText;
    }
  }

  if (!response.ok) {
    throw new Error(
      typeof payload === "string" && payload
        ? payload
        : responseText || `Request failed with status ${response.status}`,
    );
  }

  return {
    endpoint: requestData.endpoint,
    endpointMeta,
    data: payload,
    text: responseText,
  };
}
