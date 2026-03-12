import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { RequestHandler } from "express";
import {
  ApiResponse,
  BuilderExportApp,
  BuilderMauiExportRequest,
  BuilderMauiExportResponse,
} from "@shared/api";

const execFileAsync = promisify(execFile);
const GENERATED_ROOT = path.resolve(process.cwd(), "generated-maui");
const MAUI_HYBRID_TEMPLATE = "maui-blazor";

export const exportMauiProject: RequestHandler = async (req, res) => {
  try {
    const body = req.body as BuilderMauiExportRequest;
    const app = body?.app;

    if (!app?.name || !app?.brand || !Array.isArray(app.pages)) {
      return res.status(400).json({
        success: false,
        error: "Invalid builder export payload",
      } satisfies ApiResponse<never>);
    }

    const projectName = sanitizeProjectName(app.name);
    const outputPath = path.join(GENERATED_ROOT, projectName);

    await fs.mkdir(GENERATED_ROOT, { recursive: true });
    await fs.rm(outputPath, { recursive: true, force: true });

    await execFileAsync("dotnet", [
      "new",
      MAUI_HYBRID_TEMPLATE,
      "-n",
      projectName,
      "-o",
      outputPath,
    ]);

    await writeProjectFiles(outputPath, projectName, app);

    const response: ApiResponse<BuilderMauiExportResponse> = {
      success: true,
      data: {
        projectName,
        outputPath,
        template: MAUI_HYBRID_TEMPLATE,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export MAUI project";
    return res.status(500).json({
      success: false,
      error: message,
    } satisfies ApiResponse<never>);
  }
};

async function writeProjectFiles(outputPath: string, projectName: string, app: BuilderExportApp) {
  const csprojPath = path.join(outputPath, `${projectName}.csproj`);
  const indexHtmlPath = path.join(outputPath, "wwwroot", "index.html");
  const mainLayoutPath = path.join(outputPath, "Components", "Layout", "MainLayout.razor");
  const mainLayoutCssPath = path.join(outputPath, "Components", "Layout", "MainLayout.razor.css");
  const pagesPath = path.join(outputPath, "Components", "Pages");
  const homePath = path.join(outputPath, "Components", "Pages", "Home.razor");
  const preparedApp = await prepareAppAssets(outputPath, app);

  const csproj = await fs.readFile(csprojPath, "utf8");
  const nextCsproj = csproj
    .replace(
      /<ApplicationTitle>.*?<\/ApplicationTitle>/,
      `<ApplicationTitle>${escapeXml(preparedApp.name)}</ApplicationTitle>`,
    )
    .replace(
      /<RootNamespace>.*?<\/RootNamespace>/,
      `<RootNamespace>${projectName}</RootNamespace>`,
    )
    .replace(
      /<ApplicationId>.*?<\/ApplicationId>/,
      `<ApplicationId>com.homeplate.${projectName.toLowerCase()}</ApplicationId>`,
    );

  await fs.writeFile(csprojPath, nextCsproj, "utf8");
  await fs.writeFile(mainLayoutPath, generateMainLayout(preparedApp), "utf8");
  await fs.writeFile(mainLayoutCssPath, generateMainLayoutCss(preparedApp), "utf8");
  await fs.writeFile(homePath, generateHomeRazor(preparedApp), "utf8");
  await injectExportedAssets(indexHtmlPath);

  await fs.mkdir(pagesPath, { recursive: true });
  const existingPages = await fs.readdir(pagesPath);
  for (const file of existingPages) {
    if (file.endsWith(".razor") && file !== "Home.razor") {
      await fs.rm(path.join(pagesPath, file), { force: true });
    }
  }

  const routeSlugs = createUniqueRouteSlugs(preparedApp.pages.map((page) => page.name));
  await Promise.all(
    preparedApp.pages.map((page, index) => {
      const pageFileName = `${index + 1}-${sanitizeProjectName(page.name)}Page.razor`;
      const pageRoute = `/app-${routeSlugs[index]}`;
      return fs.writeFile(
        path.join(pagesPath, pageFileName),
        generatePageEntryRazor(pageRoute, page.id),
        "utf8",
      );
    }),
  );
}

function sanitizeProjectName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  const pascal = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");

  return pascal || "HomePlateExport";
}

function slugifyRouteSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "page";
}

function createUniqueRouteSlugs(pageNames: string[]) {
  const used = new Map<string, number>();

  return pageNames.map((name, index) => {
    const base = slugifyRouteSegment(name || `page-${index + 1}`);
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  });
}

function generatePageEntryRazor(route: string, pageId: string) {
  return `@page "${route}"

<Home InitialPageId="${escapeXml(pageId)}" />
`;
}

async function injectExportedAssets(indexHtmlPath: string) {
  const indexHtml = await fs.readFile(indexHtmlPath, "utf8");
  const withCss = indexHtml.includes("exported-assets/app.custom.css")
    ? indexHtml
    : indexHtml.replace(
      "</head>",
      `  <link rel="stylesheet" href="exported-assets/app.custom.css" />\n</head>`,
    );
  const withScript = withCss.includes("exported-assets/app.custom.js")
    ? withCss
    : withCss.replace(
      "</body>",
      `  <script src="exported-assets/app.custom.js"></script>\n</body>`,
    );
  await fs.writeFile(indexHtmlPath, withScript, "utf8");
}

async function prepareAppAssets(outputPath: string, app: BuilderExportApp): Promise<BuilderExportApp> {
  const assetsDir = path.join(outputPath, "wwwroot", "exported-assets");
  const exportedAssetDir = path.join(assetsDir, "assets");
  await fs.mkdir(exportedAssetDir, { recursive: true });

  const assetSources = collectAssetSources(app);
  const sourceToTarget = new Map<string, string>();
  let assetIndex = 1;

  for (const source of assetSources) {
    const materialized = await materializeAsset(source, exportedAssetDir, assetIndex);
    if (!materialized) {
      continue;
    }

    sourceToTarget.set(source, `/exported-assets/assets/${materialized.fileName}`);
    assetIndex += 1;
  }

  const nextApp = replaceAssetReferences(app, sourceToTarget);
  const customCss = nextApp.brand.customCss?.trim() || "/* No custom CSS provided */";
  const customJs = `window.__HOMEPLATE_EXPORT__ = ${JSON.stringify(
    {
      appName: nextApp.name,
      pageCount: nextApp.pages.length,
      pages: nextApp.pages.map((page) => ({
        id: page.id,
        name: page.name,
        blockCount: page.blocks.length,
      })),
    },
    null,
    2,
  )};`;

  await fs.writeFile(path.join(assetsDir, "app.custom.css"), `${customCss}\n`, "utf8");
  await fs.writeFile(path.join(assetsDir, "app.custom.js"), `${customJs}\n`, "utf8");
  await fs.writeFile(
    path.join(assetsDir, "asset-manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        assets: Array.from(sourceToTarget.entries()).map(([source, target]) => ({
          source,
          target,
        })),
      },
      null,
      2,
    ),
    "utf8",
  );

  return nextApp;
}

function collectAssetSources(app: BuilderExportApp) {
  const sources = new Set<string>();

  const collect = (value: unknown) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }

      if (trimmed.startsWith("data:") || isRemoteAssetUrl(trimmed)) {
        sources.add(trimmed);
      }

      for (const match of trimmed.matchAll(/url\((['"]?)(.*?)\1\)/g)) {
        const candidate = match[2]?.trim();
        if (candidate && (candidate.startsWith("data:") || isRemoteAssetUrl(candidate))) {
          sources.add(candidate);
        }
      }

      return;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        collect(entry);
      }
      return;
    }

    if (value && typeof value === "object") {
      for (const entry of Object.values(value as Record<string, unknown>)) {
        collect(entry);
      }
    }
  };

  collect(app);
  return Array.from(sources);
}

function replaceAssetReferences(app: BuilderExportApp, sourceToTarget: Map<string, string>): BuilderExportApp {
  if (sourceToTarget.size === 0) {
    return app;
  }

  const replaceString = (value: string) => {
    let nextValue = value;
    for (const [source, target] of sourceToTarget.entries()) {
      if (nextValue.includes(source)) {
        nextValue = nextValue.split(source).join(target);
      }
    }
    return nextValue;
  };

  const visit = (value: unknown): unknown => {
    if (typeof value === "string") {
      return replaceString(value);
    }

    if (Array.isArray(value)) {
      return value.map((entry) => visit(entry));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, visit(entry)]),
      );
    }

    return value;
  };

  return visit(app) as BuilderExportApp;
}

function isRemoteAssetUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function inferAssetExtensionFromMime(mimeType: string) {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes("png")) return "png";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("gif")) return "gif";
  if (normalized.includes("svg")) return "svg";
  if (normalized.includes("css")) return "css";
  if (normalized.includes("javascript")) return "js";
  if (normalized.includes("woff2")) return "woff2";
  if (normalized.includes("woff")) return "woff";
  if (normalized.includes("ttf")) return "ttf";
  if (normalized.includes("otf")) return "otf";
  if (normalized.includes("json")) return "json";
  return "bin";
}

function inferAssetExtensionFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const extension = path.extname(parsed.pathname).replace(".", "").toLowerCase();
    if (extension) {
      return extension;
    }
  } catch {
    return "bin";
  }

  return "bin";
}

function parseDataUri(dataUri: string) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUri);
  if (!match) {
    return null;
  }

  const mimeType = match[1] || "application/octet-stream";
  const encoded = match[3] ?? "";
  const isBase64 = Boolean(match[2]);
  const buffer = isBase64
    ? Buffer.from(encoded, "base64")
    : Buffer.from(decodeURIComponent(encoded), "utf8");

  return {
    buffer,
    extension: inferAssetExtensionFromMime(mimeType),
  };
}

async function materializeAsset(source: string, outputDir: string, index: number) {
  if (source.startsWith("data:")) {
    const parsed = parseDataUri(source);
    if (!parsed) {
      return null;
    }

    const fileName = `asset-${String(index).padStart(3, "0")}.${parsed.extension}`;
    await fs.writeFile(path.join(outputDir, fileName), parsed.buffer);
    return { fileName };
  }

  if (!isRemoteAssetUrl(source)) {
    return null;
  }

  try {
    const response = await fetch(source);
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const extension = inferAssetExtensionFromMime(response.headers.get("content-type") ?? "") || inferAssetExtensionFromUrl(source);
    const fileName = `asset-${String(index).padStart(3, "0")}.${extension}`;
    await fs.writeFile(path.join(outputDir, fileName), Buffer.from(arrayBuffer));
    return { fileName };
  } catch {
    return null;
  }
}

function escapeCSharp(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/"/g, '\\"');
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeCss(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function createCustomFontFace(brand: BuilderExportApp["brand"]) {
  if (!brand.customFontSource || !brand.customFontName) {
    return "";
  }

  return `@font-face {
  font-family: "${escapeCss(brand.customFontName)}";
  src: url("${escapeCss(brand.customFontSource)}")${
    brand.customFontFormat ? ` format("${escapeCss(brand.customFontFormat)}")` : ""
  };
  font-display: swap;
}
`;
}

function generateMainLayout(app: BuilderExportApp) {
  return `@inherits LayoutComponentBase

<main class="maui-app-shell">
    @Body
</main>
`;
}

function createAppBackground(brand: BuilderExportApp["brand"]) {
  return brand.backgroundImage
    ? `linear-gradient(180deg, ${brand.surface}f2, #ffffffe6), url(${brand.backgroundImage})`
    : `linear-gradient(180deg, ${brand.surface}, #ffffff)`;
}

function createHeroBackground(brand: BuilderExportApp["brand"]) {
  return brand.heroImage
    ? `linear-gradient(145deg, ${brand.secondary}de, ${brand.primary}c8), url(${brand.heroImage})`
    : `linear-gradient(145deg, ${brand.secondary}, ${brand.primary})`;
}

function createBlockInlineStyle(block: BuilderExportApp["pages"][number]["blocks"][number]) {
  const layout = block.layout ?? {
    marginTop: 0,
    marginRight: 0,
    marginBottom: 12,
    marginLeft: 0,
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    radius: 20,
    display: "block",
    direction: "column",
    justify: "flex-start",
    align: "stretch",
    gap: 12,
    columns: 2,
  };

  const parts = [
    `margin-top:${layout.marginTop}px`,
    `margin-right:${layout.marginRight}px`,
    `margin-bottom:${layout.marginBottom}px`,
    `margin-left:${layout.marginLeft}px`,
    `padding-top:${layout.paddingTop}px`,
    `padding-right:${layout.paddingRight}px`,
    `padding-bottom:${layout.paddingBottom}px`,
    `padding-left:${layout.paddingLeft}px`,
    `border-radius:${layout.radius}px`,
  ];

  if (layout.display === "flex" || layout.display === "grid") {
    parts.push(`display:${layout.display}`);
    parts.push(`gap:${layout.gap}px`);
    parts.push(`justify-content:${layout.justify}`);
    parts.push(`align-items:${layout.align}`);

    if (layout.display === "flex") {
      parts.push(`flex-direction:${layout.direction}`);
    }

    if (layout.display === "grid") {
      parts.push(`grid-template-columns:repeat(${Math.max(1, layout.columns)}, minmax(0, 1fr))`);
    }
  }

  if (block.attributes?.style?.trim()) {
    parts.push(block.attributes.style.trim());
  }

  return `${parts.join("; ")};`;
}

function generateMainLayoutCss(app: BuilderExportApp) {
  return `${createCustomFontFace(app.brand)}.maui-app-shell {
  min-height: 100vh;
  background: ${createAppBackground(app.brand)};
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  color: ${app.brand.textColor};
  font-family: ${app.brand.fontFamily};
}
${app.brand.customCss?.trim() ? `\n/* Custom app CSS */\n${app.brand.customCss.trim()}\n` : ""}
`;
}

function generateHomeRazor(app: BuilderExportApp) {
  const brandLogo = app.brand.logoImage
    ? `<div class="brand-logo brand-logo-image"><img src="${escapeXml(app.brand.logoImage)}" alt="${escapeXml(`${app.brand.appName} logo`)}" /></div>`
    : `<div class="brand-logo">${escapeXml(app.brand.logo)}</div>`;
  const routeSlugs = createUniqueRouteSlugs(app.pages.map((page) => page.name));
  const routeEntries = app.pages
    .map(
      (page, index) =>
        `        { "${escapeCSharp(page.name)}", "/app-${routeSlugs[index]}" },`,
    )
    .join("\n");
  const keywordRouteMap = new Map<string, string>();
  const registerKeyword = (keyword: string, matcher: (value: string) => boolean) => {
    const index = app.pages.findIndex((page) => matcher(page.name.toLowerCase()));
    if (index >= 0) {
      keywordRouteMap.set(keyword, `/app-${routeSlugs[index]}`);
    }
  };
  registerKeyword("menu", (name) => name.includes("menu"));
  registerKeyword("loyalty", (name) => name.includes("loyalty") || name.includes("reward") || name.includes("earn"));
  registerKeyword("rewards", (name) => name.includes("reward") || name.includes("redeem"));
  registerKeyword("authentication", (name) => name.includes("auth") || name.includes("login"));
  registerKeyword("auth", (name) => name.includes("auth") || name.includes("login"));
  registerKeyword("register", (name) => name.includes("register") || name.includes("auth") || name.includes("signup"));
  const keywordEntries = Array.from(keywordRouteMap.entries())
    .map(
      ([keyword, route]) =>
        `        { "${escapeCSharp(keyword)}", "${escapeCSharp(route)}" },`,
    )
    .join("\n");
  const pagesCode = app.pages
    .map(
      (page) => `new PageModel
        {
            Id = "${escapeCSharp(page.id)}",
            Name = "${escapeCSharp(page.name)}",
            Blocks = new()
            {
${page.blocks
  .map(
    (block) => `                new BlockModel
                {
                    Id = "${escapeCSharp(block.id)}",
                    Type = "${escapeCSharp(block.type)}",
                    Name = "${escapeCSharp(block.name)}",
                    Text = "${escapeCSharp(block.text ?? "")}",
                    Helper = "${escapeCSharp(block.helper ?? "")}",
                    Points = ${block.points ?? 0},
                    Items = new() { ${(block.items ?? []).map((item) => `"${escapeCSharp(item)}"`).join(", ")} },
                    HtmlTag = "${escapeCSharp(block.htmlTag ?? "")}",
                    HtmlAttributes = "${escapeCSharp(block.htmlAttributes ?? "")}",
                    ElementId = "${escapeCSharp(block.attributes?.elementId ?? "")}",
                    ClassName = "${escapeCSharp(block.attributes?.className ?? "")}",
                    Style = "${escapeCSharp(createBlockInlineStyle(block))}"
                },`,
  )
  .join("\n")}
            }
        }`,
    )
    .join(",\n");

  return `@page "/"
@using Microsoft.AspNetCore.Components
@using Microsoft.AspNetCore.Components.Rendering

<div class="phone-shell">
    <div class="phone-status"></div>
    <div class="app-chrome">
        <div class="brand-header">
            ${brandLogo}
            <div>
                <div class="eyebrow">${escapeXml(app.brand.domain)}</div>
                <div class="brand-title">${escapeXml(app.brand.appName)}</div>
            </div>
        </div>

        <div class="page-tabs">
            @foreach (var pageItem in Pages)
            {
                <button class="@(CurrentPage.Id == pageItem.Id ? "tab active" : "tab")" @onclick="@(() => CurrentPage = pageItem)">
                    @pageItem.Name
                </button>
            }
        </div>

        <div class="page-body">
            @foreach (var block in CurrentPage.Blocks)
            {
                @RenderBlock(block)
            }
        </div>
    </div>
</div>

@code {
    [Parameter]
    public string? InitialPageId { get; set; }

    private Dictionary<string, string> RouteMap = new(StringComparer.OrdinalIgnoreCase)
    {
${routeEntries}
${keywordEntries}
    };

    private List<PageModel> Pages = new()
    {
${pagesCode}
    };

    private PageModel CurrentPage = default!;

    protected override void OnInitialized()
    {
        if (Pages.Count == 0)
        {
            CurrentPage = new PageModel();
            return;
        }

        CurrentPage = Pages.Find((page) => page.Id == InitialPageId) ?? Pages[0];
    }

    private string ResolveRoute(string label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return "#";
        }

        if (RouteMap.TryGetValue(label.Trim(), out var route))
        {
            return route;
        }

        return "#";
    }

    private static void ApplyBlockAttributes(RenderTreeBuilder builder, ref int seq, BlockModel block, string baseClass)
    {
        var className = string.IsNullOrWhiteSpace(block.ClassName)
            ? baseClass
            : $"{baseClass} {block.ClassName}";

        builder.AddAttribute(seq++, "class", className);

        if (!string.IsNullOrWhiteSpace(block.ElementId))
        {
            builder.AddAttribute(seq++, "id", block.ElementId);
        }

        if (!string.IsNullOrWhiteSpace(block.Style))
        {
            builder.AddAttribute(seq++, "style", block.Style);
        }
    }

    private RenderFragment RenderBlock(BlockModel block) => builder =>
    {
        var seq = 0;

        switch (block.Type)
        {
            case "heading":
                builder.OpenElement(seq++, "div");
                ApplyBlockAttributes(builder, ref seq, block, "block card heading");
                builder.AddContent(seq++, block.Text);
                builder.CloseElement();
                break;
            case "text":
                builder.OpenElement(seq++, "div");
                ApplyBlockAttributes(builder, ref seq, block, "block card text");
                builder.AddContent(seq++, block.Text);
                builder.CloseElement();
                break;
            case "button":
                builder.OpenElement(seq++, "div");
                ApplyBlockAttributes(builder, ref seq, block, "block");
                builder.OpenElement(seq++, "button");
                builder.AddAttribute(seq++, "class", "primary-button");
                builder.AddContent(seq++, block.Text);
                builder.CloseElement();
                builder.CloseElement();
                break;
            case "html":
                builder.OpenElement(seq++, "div");
                ApplyBlockAttributes(builder, ref seq, block, "block card text");
                builder.OpenElement(seq++, string.IsNullOrWhiteSpace(block.HtmlTag) ? "div" : block.HtmlTag);
                builder.AddAttribute(seq++, "class", "html-element");
                builder.AddContent(seq++, block.Text);
                builder.CloseElement();
                builder.CloseElement();
                break;
            case "quicklinks":
                builder.OpenElement(seq++, "div");
                ApplyBlockAttributes(builder, ref seq, block, "block links-grid");
                foreach (var item in block.Items)
                {
                    builder.OpenElement(seq++, "a");
                    builder.AddAttribute(seq++, "class", "link-chip");
                    builder.AddAttribute(seq++, "href", ResolveRoute(item));
                    builder.AddContent(seq++, item);
                    builder.CloseElement();
                }
                builder.CloseElement();
                break;
            case "receiptscan":
            case "qrcode":
                builder.OpenElement(seq++, "div");
                ApplyBlockAttributes(builder, ref seq, block, "block scan-card");
                builder.OpenElement(seq++, "div");
                builder.AddAttribute(seq++, "class", "scan-title");
                builder.AddContent(seq++, block.Text);
                builder.CloseElement();
                builder.OpenElement(seq++, "div");
                builder.AddAttribute(seq++, "class", "scan-helper");
                builder.AddContent(seq++, block.Helper);
                builder.CloseElement();
                builder.OpenElement(seq++, "div");
                builder.AddAttribute(seq++, "class", "scan-points");
                builder.AddContent(seq++, $"+{block.Points} pts");
                builder.CloseElement();
                builder.CloseElement();
                break;
            case "rewardcatalog":
            case "wallet":
            case "profile":
                builder.OpenElement(seq++, "div");
                ApplyBlockAttributes(builder, ref seq, block, "block stack-card");
                builder.OpenElement(seq++, "div");
                builder.AddAttribute(seq++, "class", "stack-title");
                builder.AddContent(seq++, block.Text);
                builder.CloseElement();
                foreach (var item in block.Items)
                {
                    builder.OpenElement(seq++, "div");
                    builder.AddAttribute(seq++, "class", "stack-row");
                    builder.AddContent(seq++, item);
                    builder.CloseElement();
                }
                builder.CloseElement();
                break;
            case "auth":
                builder.OpenElement(seq++, "div");
                ApplyBlockAttributes(builder, ref seq, block, "block auth-card");
                builder.OpenElement(seq++, "div");
                builder.AddAttribute(seq++, "class", "auth-title");
                builder.AddContent(seq++, block.Text);
                builder.CloseElement();
                builder.OpenElement(seq++, "div");
                builder.AddAttribute(seq++, "class", "auth-helper");
                builder.AddContent(seq++, block.Helper);
                builder.CloseElement();
                builder.OpenElement(seq++, "div");
                builder.AddAttribute(seq++, "class", "input-mock");
                builder.AddContent(seq++, "Email");
                builder.CloseElement();
                builder.OpenElement(seq++, "div");
                builder.AddAttribute(seq++, "class", "input-mock");
                builder.AddContent(seq++, "Password");
                builder.CloseElement();
                builder.OpenElement(seq++, "button");
                builder.AddAttribute(seq++, "class", "primary-button");
                builder.AddContent(seq++, "Sign in");
                builder.CloseElement();
                builder.OpenElement(seq++, "button");
                builder.AddAttribute(seq++, "class", "primary-button secondary");
                builder.AddContent(seq++, "Register");
                builder.CloseElement();
                builder.CloseElement();
                break;
        }
    };

    private sealed class PageModel
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public List<BlockModel> Blocks { get; set; } = new();
    }

    private sealed class BlockModel
    {
        public string Id { get; set; } = "";
        public string Type { get; set; } = "";
        public string Name { get; set; } = "";
        public string Text { get; set; } = "";
        public string Helper { get; set; } = "";
        public int Points { get; set; }
        public List<string> Items { get; set; } = new();
        public string HtmlTag { get; set; } = "";
        public string HtmlAttributes { get; set; } = "";
        public string ElementId { get; set; } = "";
        public string ClassName { get; set; } = "";
        public string Style { get; set; } = "";
    }
}

<style>
    ${createCustomFontFace(app.brand)}
    .phone-shell {
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 24px;
        background: ${createAppBackground(app.brand)};
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        color: ${app.brand.textColor};
        font-family: ${app.brand.fontFamily};
    }
    .phone-status {
        display: none;
    }
    .app-chrome {
        width: min(100%, 430px);
        background: ${app.brand.secondary};
        border-radius: 40px;
        padding: 12px;
        box-shadow: 0 40px 120px -40px rgba(15, 23, 42, 0.72);
    }
    .page-tabs, .page-body {
        background: ${app.brand.cardBackground};
    }
    .brand-header {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 16px;
        border-radius: 28px 28px 18px 18px;
        color: white;
        background: ${createHeroBackground(app.brand)};
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
    }
    .brand-logo {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${app.brand.primary};
        color: white;
        font-weight: 800;
        flex-shrink: 0;
    }
    .brand-logo-image {
        overflow: hidden;
        background: white;
        padding: 8px;
    }
    .brand-logo-image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
    .eyebrow {
        font-size: 11px;
        color: rgba(255,255,255,0.72);
        text-transform: uppercase;
    }
    .brand-title {
        font-size: 20px;
        font-weight: 800;
    }
    .page-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 0 16px 16px;
    }
    .tab {
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 700;
    }
    .tab.active {
        background: ${app.brand.primary};
        color: white;
        border-color: ${app.brand.primary};
    }
    .page-body {
        padding: 0 16px 16px;
        border-radius: 0 0 28px 28px;
        display: grid;
        gap: 12px;
        min-height: 70vh;
    }
    .block {
        border-radius: 22px;
        padding: 16px;
        background: ${app.brand.cardBackground};
        color: ${app.brand.textColor};
        box-shadow: 0 10px 30px -18px rgba(15, 23, 42, 0.3);
    }
    .heading {
        font-size: 24px;
        font-weight: 900;
    }
    .text {
        font-size: 14px;
        line-height: 1.5;
        color: ${app.brand.textColor};
    }
    .primary-button {
        border: 0;
        width: 100%;
        border-radius: 18px;
        padding: 12px 16px;
        font-weight: 800;
        background: ${app.brand.primary};
        color: white;
    }
    .primary-button.secondary {
        margin-top: 8px;
        background: transparent;
        border: 1px solid ${app.brand.primary};
        color: ${app.brand.primary};
    }
    .links-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
    }
    .link-chip, .stack-row, .input-mock {
        border-radius: 18px;
        padding: 12px;
        background: ${app.brand.surface};
        font-size: 13px;
        font-weight: 700;
    }
    .link-chip {
        display: block;
        text-decoration: none;
        color: inherit;
    }
    .scan-card {
        background: linear-gradient(135deg, ${app.brand.primary}, ${app.brand.accent});
        color: white;
    }
    .scan-title, .stack-title, .auth-title {
        font-size: 18px;
        font-weight: 900;
    }
    .scan-helper, .auth-helper {
        margin-top: 6px;
        font-size: 12px;
    }
    .scan-helper {
        color: rgba(255,255,255,0.82);
    }
    .auth-helper {
        color: ${app.brand.textColor};
        opacity: 0.72;
    }
    .scan-points {
        margin-top: 12px;
        display: inline-flex;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(255,255,255,0.15);
        font-size: 12px;
        font-weight: 800;
    }
    .stack-card {
        display: grid;
        gap: 10px;
    }
    .auth-card {
        display: grid;
        gap: 10px;
    }
</style>
`;
}
