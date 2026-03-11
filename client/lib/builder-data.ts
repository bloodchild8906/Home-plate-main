function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizePath(path: string) {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function getValueAtPath(source: unknown, path: string) {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "." || trimmed === "this") {
    return source;
  }

  return normalizePath(trimmed).reduce<unknown>((current, segment) => {
    if (current === undefined || current === null) {
      return undefined;
    }

    if (Array.isArray(current) && /^\d+$/.test(segment)) {
      return current[Number(segment)];
    }

    if (isRecord(current)) {
      return current[segment];
    }

    return undefined;
  }, source);
}

function stringifyTemplateValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.every(
      (entry) =>
        entry === null ||
        entry === undefined ||
        ["string", "number", "boolean"].includes(typeof entry),
    )
      ? value.join(", ")
      : JSON.stringify(value);
  }

  if (isRecord(value)) {
    return JSON.stringify(value);
  }

  return String(value);
}

export function createTemplateContext(
  value: unknown,
  response: unknown,
  alias: string,
  index?: number,
) {
  const key = alias.trim() || "item";
  const record = isRecord(value) ? value : {};

  return {
    ...record,
    item: value,
    [key]: value,
    value,
    index,
    response,
  } satisfies Record<string, unknown>;
}

export function interpolateTemplate(
  template: string,
  context: Record<string, unknown>,
) {
  if (!template) {
    return "";
  }

  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, expression: string) => {
    return stringifyTemplateValue(getValueAtPath(context, expression));
  });
}

export function interpolateTemplateList(
  values: string[] | undefined,
  context: Record<string, unknown>,
) {
  return (values ?? []).map((value) => interpolateTemplate(value, context));
}
