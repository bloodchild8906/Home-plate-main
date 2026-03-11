import type { BuilderServerApiEndpoint } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/mobile-builder/designer-primitives";
import {
  type BuilderApiFunction,
  type BuilderBlock,
  type BuilderBlockDataBinding,
} from "@/lib/builder-store";

type BindingStatus = "idle" | "loading" | "success" | "error";

type BindingSuggestion = {
  label: string;
  path: string;
};

type BlockDataBindingFieldsProps = {
  block: BuilderBlock;
  apiFunctions: BuilderApiFunction[];
  serverApiEndpoints: BuilderServerApiEndpoint[];
  status?: BindingStatus;
  statusMessage?: string;
  onChange: (updater: (binding: BuilderBlockDataBinding) => BuilderBlockDataBinding) => void;
};

function getBindingSuggestions(
  endpoint: BuilderServerApiEndpoint | null,
): BindingSuggestion[] {
  if (!endpoint) {
    return [{ label: "Response data", path: "data" }];
  }

  const suggestions: BindingSuggestion[] = [{ label: "Response data", path: "data" }];

  if (endpoint.id === "members-list") {
    suggestions.push({ label: "Paged rows", path: "data.data" });
  }

  if (endpoint.category === "Menus" && endpoint.id.endsWith("list")) {
    suggestions.push({ label: "Menus", path: "data" });
  }

  if (endpoint.category === "Menus" && endpoint.id.endsWith("get")) {
    suggestions.push({ label: "Menu items", path: "data.items" });
  }

  if (endpoint.category === "Rewards" && endpoint.id.endsWith("list")) {
    suggestions.push({ label: "Programs", path: "data" });
  }

  if (endpoint.category === "Rewards" && endpoint.id.endsWith("get")) {
    suggestions.push({ label: "Tiers", path: "data.tiers" });
    suggestions.push({ label: "Redemptions", path: "data.redemptions" });
  }

  return suggestions;
}

export function BlockDataBindingFields({
  block,
  apiFunctions,
  serverApiEndpoints,
  status = "idle",
  statusMessage = "",
  onChange,
}: BlockDataBindingFieldsProps) {
  const availableDataFunctions = apiFunctions.filter((item) => item.method === "GET");
  const selectedFunction = apiFunctions.find(
    (item) => item.id === block.dataBinding.functionId,
  ) ?? null;
  const selectedEndpoint = selectedFunction
    ? serverApiEndpoints.find((item) => item.id === selectedFunction.endpointId) ?? null
    : null;
  const suggestions = getBindingSuggestions(selectedEndpoint);
  const isListBinding =
    block.dataBinding.mode === "repeat" ||
    ["quicklinks", "rewardcatalog", "wallet", "profile"].includes(block.type);

  return (
    <div className="rounded-3xl border border-border/60 bg-muted/15 p-4">
      <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
        Data source
      </div>
      <div className="space-y-4">
        <Field label="Source">
          <select
            value={block.dataBinding.sourceType}
            onChange={(event) =>
              onChange((binding) => ({
                ...binding,
                sourceType: event.target.value === "api" ? "api" : "none",
                functionId:
                  event.target.value === "api"
                    ? binding.functionId || availableDataFunctions[0]?.id || ""
                    : "",
              }))
            }
            className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
          >
            <option value="none">Static block content</option>
            <option value="api">API response</option>
          </select>
        </Field>

        {block.dataBinding.sourceType === "api" ? (
          <>
            <Field label="API function">
              <select
                value={block.dataBinding.functionId}
                onChange={(event) =>
                  onChange((binding) => ({
                    ...binding,
                    functionId: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
              >
                <option value="">Select a function</option>
                {availableDataFunctions.map((fn) => (
                  <option key={fn.id} value={fn.id}>
                    {fn.name} ({fn.method} {fn.endpoint})
                  </option>
                ))}
              </select>
            </Field>
            {availableDataFunctions.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-background/80 p-3 text-xs leading-5 text-muted-foreground">
                Add a `GET` API function in the API tab first. Only safe read endpoints can be used
                as block data sources.
              </div>
            ) : null}

            <Field label="Response path">
              <Input
                value={block.dataBinding.responsePath}
                onChange={(event) =>
                  onChange((binding) => ({
                    ...binding,
                    responsePath: event.target.value,
                  }))
                }
                placeholder="data"
              />
            </Field>

            <div className="rounded-2xl border border-border/60 bg-background/80 p-3">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Quick paths
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={`${suggestion.label}-${suggestion.path}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() =>
                      onChange((binding) => ({
                        ...binding,
                        responsePath: suggestion.path,
                      }))
                    }
                  >
                    {suggestion.label}: {suggestion.path}
                  </Button>
                ))}
              </div>
              {selectedEndpoint ? (
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {selectedEndpoint.method} {selectedEndpoint.path} from {selectedEndpoint.category}.
                  Use `data` for standard API responses, or drill into nested arrays like `data.items`
                  and `data.data`.
                </p>
              ) : null}
            </div>

            <Field label="Binding mode">
              <select
                value={block.dataBinding.mode}
                onChange={(event) =>
                  onChange((binding) => ({
                    ...binding,
                    mode: event.target.value === "repeat" ? "repeat" : "single",
                  }))
                }
                className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
              >
                <option value="single">Bind one block</option>
                <option value="repeat">Repeat block for each row</option>
              </select>
            </Field>

            <Field label="Item alias">
              <Input
                value={block.dataBinding.itemAlias}
                onChange={(event) =>
                  onChange((binding) => ({
                    ...binding,
                    itemAlias: event.target.value,
                  }))
                }
                placeholder="item"
              />
            </Field>

            {isListBinding ? (
              <Field label="List item template">
                <Textarea
                  className="min-h-[88px]"
                  value={block.dataBinding.itemTemplate}
                  onChange={(event) =>
                    onChange((binding) => ({
                      ...binding,
                      itemTemplate: event.target.value,
                    }))
                  }
                  placeholder="{{item.name}}"
                />
              </Field>
            ) : null}

            <Field label="Empty state">
              <Input
                value={block.dataBinding.emptyState}
                onChange={(event) =>
                  onChange((binding) => ({
                    ...binding,
                    emptyState: event.target.value,
                  }))
                }
                placeholder="No items available."
              />
            </Field>

            <div className="rounded-2xl border border-border/60 bg-background/80 p-3 text-xs leading-5 text-muted-foreground">
              Use <code>{"{{name}}"}</code>, <code>{"{{price}}"}</code>, <code>{"{{item.name}}"}</code>,
              {" "}or <code>{"{{response.success}}"}</code> in text, helper copy, HTML content,
              attributes, and list templates. Repeat mode clones the whole block once per row in
              the selected response array.
            </div>

            {statusMessage ? (
              <div
                className={`rounded-2xl border px-3 py-2 text-xs ${
                  status === "error"
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : status === "success"
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : "border-border/60 bg-background/80 text-muted-foreground"
                }`}
              >
                {statusMessage}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">
            Leave the block static, or switch to an API source to bind it to menus, rewards,
            members, and any other server endpoint defined in the builder catalog.
          </p>
        )}
      </div>
    </div>
  );
}
