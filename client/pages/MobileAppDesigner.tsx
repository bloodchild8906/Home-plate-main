import {
  createElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  faArrowsToCircle,
  faBars,
  faBold,
  faBook,
  faChartSimple,
  faCircleChevronDown,
  faCircleInfo,
  faClock,
  faCode,
  faCodeBranch,
  faColumns,
  faComment,
  faDatabase,
  faDeleteLeft,
  faFileCode,
  faGripLines,
  faHeading,
  faHighlighter,
  faImage,
  faImages,
  faKeyboard,
  faLayerGroup,
  faLink,
  faListCheck,
  faListUl,
  faLocationDot,
  faMap,
  faMusic,
  faNewspaper,
  faPaintbrush,
  faParagraph,
  faPenToSquare,
  faPercent,
  faQuoteLeft,
  faQuoteRight,
  faRectangleList,
  faSearch,
  faSection,
  faShareNodes,
  faSquare,
  faSquareCaretDown,
  faSquareCaretUp,
  faSquareH,
  faSquarePollHorizontal,
  faSuperscript,
  faTable,
  faTableCells,
  faTableCellsColumnLock,
  faTableCellsLarge,
  faTableColumns,
  faTableList,
  faTerminal,
  faTextHeight,
  faTurnDown,
  faUnderline,
  faUpRightAndDownLeftFromCenter,
  faVideo,
  faWindowMaximize,
  faWindowRestore,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Download,
  Copy,
  CreditCard,
  Eye,
  Gift,
  Grid2x2,
  ImagePlus,
  KeyRound,
  MoveVertical,
  Plus,
  QrCode,
  Receipt,
  ScanLine,
  Trash2,
  Type,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AssetField,
  ColorField,
  Field,
  ImageAssetPreview,
  Panel,
  SpacingGroup,
} from "@/components/mobile-builder/designer-primitives";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  BuilderMauiExportResponse,
  type ApiResponse,
  type BuilderApiParameterLocation,
  type BuilderServerApiEndpoint,
} from "@shared/api";
import { BrandMark } from "@/components/brand-mark";
import {
  applyServerEndpointToFunction,
  buildApiFunctionRequest,
  findAuthBlock,
  findServerApiEndpoint,
  listAuthBlocks,
} from "@/lib/builder-api";
import { getInitials, readImageFileAsDataUrl, readTextFile } from "@/lib/asset-utils";
import { getContrastTextColor, mixHex } from "@/lib/color-utils";
import {
  buildUploadedFontFamily,
  deriveFontName,
  inferFontFormat,
  readFontFileAsDataUrl,
  syncFontAssets,
} from "@/lib/font-utils";
import { STATIC_RUNTIME } from "@/lib/static-runtime";
import {
  APP_THEME_PRESETS,
  DEFAULT_FONT_PRESET_ID,
  findAppThemePreset,
  findFontOption,
  FONT_OPTIONS,
  UPLOADED_FONT_PRESET_ID,
} from "@/lib/theme-presets";
import { cn } from "@/lib/utils";
import {
  createApiFunction,
  createApiFunctionPropertyBinding,
  createBlock,
  type BuilderAppModel,
  type BuilderApiFunction,
  type BuilderApiFunctionPropertyBinding,
  type BuilderApiFunctionSourceField,
  type BuilderBrand,
  type BuilderBlock,
  type BuilderBlockActionKind,
  type BuilderLayoutAlign,
  type BuilderLayoutDirection,
  type BuilderLayoutDisplay,
  type BuilderLayoutJustify,
  type BuilderBlockLayout,
  type BuilderBlockType,
  useBuilderStore,
} from "@/lib/builder-store";

const PHONE_PRESETS = [
  { id: "compact", label: "Compact", width: 320, height: 680 },
  { id: "standard", label: "Standard", width: 375, height: 760 },
  { id: "plus", label: "Plus", width: 430, height: 860 },
  { id: "tablet-small", label: "Tablet S", width: 768, height: 1024 },
  { id: "tablet-large", label: "Tablet L", width: 834, height: 1194 },
] as const;

const CORE_LIBRARY: { type: BuilderBlockType; label: string; icon: ReactNode }[] = [
  { type: "heading", label: "Heading", icon: <Type className="h-4 w-4" /> },
  { type: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
  { type: "button", label: "Button", icon: <Plus className="h-4 w-4" /> },
  { type: "quicklinks", label: "Quick Links", icon: <Grid2x2 className="h-4 w-4" /> },
  { type: "receiptscan", label: "Receipt", icon: <Receipt className="h-4 w-4" /> },
  { type: "qrcode", label: "QR Scan", icon: <QrCode className="h-4 w-4" /> },
  { type: "rewardcatalog", label: "Redeem", icon: <Gift className="h-4 w-4" /> },
  { type: "wallet", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { type: "profile", label: "Profile", icon: <UserRound className="h-4 w-4" /> },
  { type: "auth", label: "Auth", icon: <KeyRound className="h-4 w-4" /> },
];

const API_SOURCE_FIELD_OPTIONS: { value: BuilderApiFunctionSourceField; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "helper", label: "Helper" },
  { value: "points", label: "Points" },
  { value: "items", label: "Items" },
  { value: "htmlTag", label: "HTML tag" },
];
const API_PARAMETER_LOCATION_LABELS: Record<BuilderApiParameterLocation, string> = {
  path: "Path",
  query: "Query",
  body: "Body",
};
const LAYOUT_DISPLAY_OPTIONS: { value: BuilderLayoutDisplay; label: string }[] = [
  { value: "block", label: "Block" },
  { value: "flex", label: "Flex" },
  { value: "grid", label: "Grid" },
];
const LAYOUT_DIRECTION_OPTIONS: { value: BuilderLayoutDirection; label: string }[] = [
  { value: "column", label: "Column" },
  { value: "row", label: "Row" },
];
const LAYOUT_JUSTIFY_OPTIONS: { value: BuilderLayoutJustify; label: string }[] = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "space-between", label: "Space Between" },
  { value: "space-around", label: "Space Around" },
  { value: "space-evenly", label: "Space Evenly" },
];
const LAYOUT_ALIGN_OPTIONS: { value: BuilderLayoutAlign; label: string }[] = [
  { value: "stretch", label: "Stretch" },
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
];
type HtmlElementDefinition = {
  tag: string;
  name: string;
  description: string;
  icon: IconDefinition;
};

const HTML_TAG_OPTIONS = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "bdi",
  "bdo",
  "blockquote",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "main",
  "map",
  "mark",
  "menu",
  "meter",
  "nav",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "search",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
] as const;

function getHtmlTagName(tag: string) {
  switch (tag) {
    case "a":
      return "Anchor";
    case "abbr":
      return "Abbreviation";
    case "br":
      return "Line Break";
    case "dd":
      return "Description Details";
    case "dfn":
      return "Definition Term";
    case "dl":
      return "Description List";
    case "dt":
      return "Description Term";
    case "em":
      return "Emphasis";
    case "hr":
      return "Horizontal Rule";
    case "iframe":
      return "Inline Frame";
    case "img":
      return "Image";
    case "kbd":
      return "Keyboard Input";
    case "ol":
      return "Ordered List";
    case "optgroup":
      return "Option Group";
    case "p":
      return "Paragraph";
    case "pre":
      return "Preformatted Text";
    case "q":
      return "Inline Quote";
    case "rp":
      return "Ruby Fallback";
    case "rt":
      return "Ruby Text";
    case "s":
      return "Strikethrough";
    case "samp":
      return "Sample Output";
    case "search":
      return "Search Region";
    case "select":
      return "Select Menu";
    case "small":
      return "Small Print";
    case "source":
      return "Media Source";
    case "sub":
      return "Subscript";
    case "sup":
      return "Superscript";
    case "tbody":
      return "Table Body";
    case "td":
      return "Table Cell";
    case "tfoot":
      return "Table Footer";
    case "th":
      return "Table Header Cell";
    case "thead":
      return "Table Head";
    case "time":
      return "Time";
    case "tr":
      return "Table Row";
    case "ul":
      return "Unordered List";
    case "var":
      return "Variable";
    case "wbr":
      return "Word Break Opportunity";
    default:
      if (/^h[1-6]$/.test(tag)) {
        return `Heading ${tag[1]}`;
      }

      return tag
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

function getHtmlTagDescription(tag: string) {
  if (/^h[1-6]$/.test(tag)) {
    return "Use this for semantic headings and document hierarchy.";
  }

  switch (tag) {
    case "a":
      return "Creates a clickable hyperlink to another page, route, or resource.";
    case "abbr":
      return "Marks an abbreviation or acronym and can expose its full meaning in a tooltip.";
    case "address":
      return "Identifies contact or author information for a page or section.";
    case "area":
      return "Defines a clickable hotspot inside an image map.";
    case "article":
      return "Wraps a self-contained piece of content such as a post or card.";
    case "aside":
      return "Holds secondary content like side notes, promos, or supporting context.";
    case "audio":
      return "Embeds playable audio media.";
    case "b":
    case "strong":
      return "Emphasizes text visually, typically for stronger importance.";
    case "bdi":
    case "bdo":
      return "Controls bidirectional text handling for mixed writing directions.";
    case "blockquote":
    case "q":
      return "Represents quoted content.";
    case "br":
    case "wbr":
      return "Controls where text can break onto a new line.";
    case "button":
      return "Triggers an action such as submit, navigate, or custom app logic.";
    case "canvas":
      return "Provides a drawable surface for graphics or charts.";
    case "caption":
      return "Adds a title or explanation to a table.";
    case "cite":
      return "References the title of a work or source.";
    case "code":
    case "pre":
    case "kbd":
    case "samp":
    case "var":
      return "Displays code, keyboard input, sample output, or technical text.";
    case "col":
    case "colgroup":
      return "Defines column structure and styling for tables.";
    case "data":
      return "Associates readable content with a machine-friendly value.";
    case "datalist":
      return "Provides autocomplete options for an input.";
    case "dd":
    case "dl":
    case "dt":
      return "Builds a description list of terms and definitions.";
    case "del":
    case "s":
      return "Shows content that was removed or is no longer accurate.";
    case "details":
    case "summary":
      return "Creates expandable disclosure content.";
    case "dfn":
      return "Identifies the term being defined.";
    case "dialog":
      return "Represents modal or floating dialog content.";
    case "div":
    case "section":
    case "main":
    case "header":
    case "footer":
    case "hgroup":
      return "Provides structural layout or semantic grouping for content.";
    case "em":
    case "i":
    case "mark":
    case "small":
    case "sub":
    case "sup":
    case "u":
      return "Applies inline text emphasis or annotation.";
    case "embed":
    case "object":
    case "iframe":
      return "Embeds external or rich media content inside the page.";
    case "fieldset":
    case "legend":
      return "Groups related form controls with a shared label.";
    case "figcaption":
    case "figure":
      return "Pairs media or illustrations with a caption.";
    case "form":
      return "Wraps inputs and controls that submit user data.";
    case "hr":
      return "Separates content sections with a thematic break.";
    case "img":
    case "picture":
      return "Displays image content.";
    case "input":
    case "textarea":
    case "label":
    case "select":
    case "option":
    case "optgroup":
    case "output":
      return "Builds interactive form fields and form responses.";
    case "ins":
      return "Marks newly inserted content.";
    case "li":
    case "menu":
    case "ol":
    case "ul":
      return "Creates list-based navigation, menus, or grouped items.";
    case "map":
      return "Defines an image map region for clickable areas.";
    case "meter":
    case "progress":
      return "Visualizes a numeric measurement or progress state.";
    case "nav":
    case "search":
      return "Groups navigation or search-related UI.";
    case "p":
      return "Displays a paragraph of body copy.";
    case "rp":
    case "rt":
    case "ruby":
      return "Supports ruby annotations for pronunciation or translation hints.";
    case "source":
    case "track":
    case "video":
      return "Supplies media files, tracks, or playable video content.";
    case "span":
      return "Applies inline styling or semantics without creating a new section.";
    case "table":
    case "tbody":
    case "td":
    case "tfoot":
    case "th":
    case "thead":
    case "tr":
      return "Builds tabular data with rows, columns, and headers.";
    case "time":
      return "Represents a date or time value with machine-readable meaning.";
    default:
      return "Adds a semantic HTML element to the app layout.";
  }
}

function getHtmlTagIcon(tag: string): IconDefinition {
  if (/^h[1-6]$/.test(tag)) {
    return faHeading;
  }

  switch (tag) {
    case "a":
      return faLink;
    case "abbr":
      return faCircleInfo;
    case "address":
      return faLocationDot;
    case "area":
      return faArrowsToCircle;
    case "article":
      return faNewspaper;
    case "aside":
      return faColumns;
    case "audio":
      return faMusic;
    case "b":
    case "strong":
      return faBold;
    case "bdi":
    case "bdo":
    case "ruby":
    case "rp":
    case "rt":
      return faShareNodes;
    case "blockquote":
      return faQuoteLeft;
    case "q":
      return faQuoteRight;
    case "br":
    case "wbr":
      return faTurnDown;
    case "button":
      return faSquare;
    case "canvas":
      return faPaintbrush;
    case "caption":
    case "legend":
    case "summary":
      return faRectangleList;
    case "cite":
    case "dfn":
      return faBook;
    case "code":
    case "pre":
      return faCode;
    case "kbd":
    case "samp":
    case "var":
      return faTerminal;
    case "col":
    case "colgroup":
      return faTableColumns;
    case "data":
    case "datalist":
    case "output":
      return faDatabase;
    case "dd":
    case "dl":
    case "dt":
      return faListCheck;
    case "del":
    case "s":
      return faDeleteLeft;
    case "details":
      return faCircleChevronDown;
    case "dialog":
      return faWindowMaximize;
    case "div":
    case "main":
      return faLayerGroup;
    case "em":
    case "i":
    case "small":
    case "sub":
      return faTextHeight;
    case "embed":
    case "object":
    case "iframe":
      return faWindowRestore;
    case "fieldset":
      return faSquareH;
    case "figcaption":
      return faComment;
    case "figure":
    case "picture":
      return faImages;
    case "footer":
    case "header":
    case "section":
      return faSection;
    case "form":
      return faPenToSquare;
    case "hgroup":
      return faHeading;
    case "hr":
      return faGripLines;
    case "img":
      return faImage;
    case "input":
    case "textarea":
      return faKeyboard;
    case "ins":
      return faPenToSquare;
    case "label":
      return faHighlighter;
    case "li":
    case "menu":
    case "ol":
    case "ul":
      return faListUl;
    case "map":
      return faMap;
    case "mark":
      return faHighlighter;
    case "meter":
      return faPercent;
    case "nav":
      return faBars;
    case "optgroup":
      return faSquareCaretUp;
    case "option":
    case "select":
      return faSquareCaretDown;
    case "p":
      return faParagraph;
    case "progress":
      return faSquarePollHorizontal;
    case "search":
      return faSearch;
    case "source":
    case "track":
      return faFileCode;
    case "span":
      return faTextHeight;
    case "sup":
      return faSuperscript;
    case "table":
      return faTable;
    case "tbody":
      return faTableCellsLarge;
    case "td":
      return faTableCells;
    case "tfoot":
      return faTableList;
    case "th":
      return faTableCellsColumnLock;
    case "thead":
      return faTableColumns;
    case "time":
      return faClock;
    case "tr":
      return faTableList;
    case "u":
      return faUnderline;
    case "video":
      return faVideo;
    default:
      return faLayerGroup;
  }
}

const HTML_ELEMENT_DEFINITIONS: HtmlElementDefinition[] = HTML_TAG_OPTIONS.map((tag) => ({
  tag,
  name: getHtmlTagName(tag),
  description: getHtmlTagDescription(tag),
  icon: getHtmlTagIcon(tag),
}));

const VOID_HTML_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

function isInteractiveBlock(block: BuilderBlock) {
  return block.events.tap.kind !== "none";
}

function parseRequestHeaders(value: string) {
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

function usesHtmlItems(tag: string) {
  return ["ul", "ol", "menu", "select", "datalist", "optgroup", "dl"].includes(tag);
}

function sanitizeHtmlTag(value?: string) {
  const next = (value ?? "").trim().toLowerCase();
  return /^[a-z][a-z0-9-]*$/.test(next) ? next : "div";
}

function parseHtmlAttributes(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return {} as Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function normalizeHtmlElementProps(value: Record<string, unknown>) {
  return Object.entries(value).reduce<Record<string, unknown>>((props, [key, propValue]) => {
    if (!key || key.startsWith("on")) {
      return props;
    }

    if (key === "class") {
      props.className = propValue;
      return props;
    }

    if (key === "for") {
      props.htmlFor = propValue;
      return props;
    }

    if (key === "style") {
      if (typeof propValue === "string") {
        props.style = parseInlineStyle(propValue);
      } else if (propValue && typeof propValue === "object" && !Array.isArray(propValue)) {
        props.style = propValue as CSSProperties;
      }
      return props;
    }

    props[key] = propValue;
    return props;
  }, {});
}

function scopeCssRule(rule: CSSRule, scope: string): string {
  if (rule.type === CSSRule.STYLE_RULE) {
    const styleRule = rule as CSSStyleRule;
    const selectors = styleRule.selectorText
      .split(",")
      .map((selector) => `${scope} ${selector.trim()}`)
      .join(", ");
    return `${selectors} { ${styleRule.style.cssText} }`;
  }

  if (rule.type === CSSRule.MEDIA_RULE) {
    const mediaRule = rule as CSSMediaRule;
    return `@media ${mediaRule.conditionText} { ${Array.from(mediaRule.cssRules).map((entry) => scopeCssRule(entry, scope)).join(" ")} }`;
  }

  if (rule.type === CSSRule.SUPPORTS_RULE) {
    const supportsRule = rule as CSSSupportsRule;
    return `@supports ${supportsRule.conditionText} { ${Array.from(supportsRule.cssRules).map((entry) => scopeCssRule(entry, scope)).join(" ")} }`;
  }

  return rule.cssText;
}

function scopeCustomCss(css: string, scope: string) {
  const trimmed = css.trim();
  if (!trimmed || typeof CSSStyleSheet === "undefined") {
    return trimmed;
  }

  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(trimmed);
    return Array.from(sheet.cssRules).map((rule) => scopeCssRule(rule, scope)).join("\n");
  } catch {
    return trimmed;
  }
}

function createHtmlToolboxBlock(tag: string) {
  const safeTag = sanitizeHtmlTag(tag);
  const baseAttributes: Record<string, unknown> = {};
  let text = `${safeTag} content`;
  let helper = "";
  let items: string[] | undefined;

  switch (safeTag) {
    case "a":
      text = "Link label";
      baseAttributes.href = "#";
      break;
    case "abbr":
      text = "HTML";
      baseAttributes.title = "HyperText Markup Language";
      break;
    case "area":
      text = "";
      baseAttributes.alt = "Interactive area";
      baseAttributes.href = "#";
      baseAttributes.shape = "rect";
      baseAttributes.coords = "0,0,120,80";
      break;
    case "audio":
    case "video":
      text = "";
      baseAttributes.controls = true;
      break;
    case "br":
    case "hr":
    case "wbr":
      text = "";
      break;
    case "button":
      text = "Button label";
      baseAttributes.type = "button";
      break;
    case "details":
      text = "Details summary";
      helper = "Expandable detail content";
      break;
    case "iframe":
      text = "";
      baseAttributes.src = "about:blank";
      baseAttributes.title = "Embedded frame";
      break;
    case "img":
      text = "";
      baseAttributes.alt = "Image element";
      break;
    case "input":
      text = "";
      baseAttributes.type = "text";
      baseAttributes.placeholder = "Type here";
      break;
    case "meter":
      text = "65%";
      baseAttributes.min = 0;
      baseAttributes.max = 100;
      baseAttributes.value = 65;
      break;
    case "menu":
      text = "Menu item";
      items = ["First action", "Second action", "Third action"];
      break;
    case "ol":
    case "ul":
      text = "List item";
      items = ["First item", "Second item", "Third item"];
      break;
    case "dl":
      text = "Term";
      items = ["Definition one", "Definition two"];
      break;
    case "option":
      text = "Option";
      baseAttributes.value = "option";
      break;
    case "optgroup":
      text = "Option group";
      baseAttributes.label = "Group";
      items = ["First option", "Second option"];
      break;
    case "progress":
      text = "";
      baseAttributes.max = 100;
      baseAttributes.value = 48;
      break;
    case "select":
    case "datalist":
      text = "Option";
      items = ["Option A", "Option B", "Option C"];
      break;
    case "source":
      text = "";
      baseAttributes.src = "";
      break;
    case "textarea":
      text = "Textarea content";
      baseAttributes.rows = 4;
      baseAttributes.placeholder = "Write here";
      break;
    case "time":
      text = "March 11, 2026";
      baseAttributes.dateTime = "2026-03-11";
      break;
    default:
      break;
  }

  const htmlAttributes = Object.keys(baseAttributes).length > 0
    ? JSON.stringify(baseAttributes, null, 2)
    : "";

  return createBlock("html", {
    name: `<${safeTag}>`,
    text,
    helper,
    items,
    htmlTag: safeTag,
    htmlAttributes,
  });
}

export default function MobileAppDesigner() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { apps, updateApp } = useBuilderStore();
  const app = apps.find((item) => item.id === appId);
  const [selectedPageId, setSelectedPageId] = useState(app?.pages[0]?.id ?? "");
  const [selectedBlockId, setSelectedBlockId] = useState(app?.pages[0]?.blocks[0]?.id ?? "");
  const [preview, setPreview] = useState(false);
  const [screenSize, setScreenSize] = useState<(typeof PHONE_PRESETS)[number]["id"]>("standard");
  const [dragBlockId, setDragBlockId] = useState<string | null>(null);
  const [dragPageId, setDragPageId] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [selectedApiFunctionId, setSelectedApiFunctionId] = useState(app?.apiFunctions[0]?.id ?? "");
  const [serverApiEndpoints, setServerApiEndpoints] = useState<BuilderServerApiEndpoint[]>([]);
  const [isLoadingServerApiEndpoints, setIsLoadingServerApiEndpoints] = useState(true);
  const [serverApiEndpointsError, setServerApiEndpointsError] = useState("");
  const [toolboxQuery, setToolboxQuery] = useState("");
  const [previewWidth, setPreviewWidth] = useState(0);
  const previewViewportRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = previewViewportRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setPreviewWidth(entry.contentRect.width);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadServerApiEndpoints = async () => {
      setIsLoadingServerApiEndpoints(true);
      setServerApiEndpointsError("");

      try {
        const response = await fetch("/api/builder/api-endpoints");
        if (!response.ok) {
          throw new Error("Failed to load server API endpoints");
        }

        const payload =
          (await response.json()) as ApiResponse<BuilderServerApiEndpoint[]>;

        if (!cancelled) {
          setServerApiEndpoints(
            payload.success && Array.isArray(payload.data) ? payload.data : [],
          );
        }
      } catch (error) {
        if (!cancelled) {
          setServerApiEndpoints([]);
          setServerApiEndpointsError(
            error instanceof Error
              ? error.message
              : "Failed to load server API endpoints",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingServerApiEndpoints(false);
        }
      }
    };

    void loadServerApiEndpoints();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!app?.pages.length) return;
    if (!app.pages.some((item) => item.id === selectedPageId)) {
      setSelectedPageId(app.pages[0].id);
    }
  }, [app?.pages, selectedPageId]);

  useEffect(() => {
    if (!app?.pages.length) return;
    const currentPage = app.pages.find((item) => item.id === selectedPageId) ?? app.pages[0];
    if (!currentPage?.blocks.length) return;
    if (!currentPage.blocks.some((item) => item.id === selectedBlockId)) {
      setSelectedBlockId(currentPage.blocks[0].id);
    }
  }, [app?.pages, selectedBlockId, selectedPageId]);

  useEffect(() => {
    if (!app) return;
    if (app.apiFunctions.length === 0) {
      if (selectedApiFunctionId) {
        setSelectedApiFunctionId("");
      }
      return;
    }

    if (!app.apiFunctions.some((item) => item.id === selectedApiFunctionId)) {
      setSelectedApiFunctionId(app.apiFunctions[0].id);
    }
  }, [app, selectedApiFunctionId]);

  useEffect(() => {
    if (!app) {
      return;
    }

    syncFontAssets(`builder-app-${app.id}`, app.brand);
  }, [
    app,
    app?.brand.customFontFormat,
    app?.brand.customFontName,
    app?.brand.customFontSource,
    app?.brand.fontPresetId,
  ]);

  if (!app) {
    return <Navigate to="/builder" replace />;
  }

  const page = app.pages.find((item) => item.id === selectedPageId) ?? app.pages[0];
  const block = page?.blocks.find((item) => item.id === selectedBlockId) ?? page?.blocks[0];
  const preset = PHONE_PRESETS.find((item) => item.id === screenSize) ?? PHONE_PRESETS[1];
  const deviceWidth = preset.width + 24;
  const deviceHeight = preset.height + 56;
  const previewScale =
    previewWidth > 0 ? Math.min(1, Math.max(0.15, (previewWidth - 24) / deviceWidth)) : 1;
  const previewCanvasHeight = deviceHeight * previewScale;
  const previewSurfaceStyle = createPreviewSurfaceStyle(app.brand);
  const previewHeroStyle = createPreviewHeroStyle(app.brand);
  const scopedPreviewCss = useMemo(
    () => scopeCustomCss(app.brand.customCss, `[data-builder-preview="${app.id}"]`),
    [app.brand.customCss, app.id],
  );
  const selectedThemePreset = findAppThemePreset(app.brand.themePresetId);
  const selectedFontValue = app.brand.customFontSource
    ? UPLOADED_FONT_PRESET_ID
    : app.brand.fontPresetId;
  const selectedFontPreset = findFontOption(
    selectedFontValue === UPLOADED_FONT_PRESET_ID
      ? DEFAULT_FONT_PRESET_ID
      : app.brand.fontPresetId,
  );
  const selectedApiFunction = app.apiFunctions.find((item) => item.id === selectedApiFunctionId) ?? null;
  const authBlocks = useMemo(() => listAuthBlocks(app), [app]);
  const selectedServerApiEndpoint = useMemo(
    () =>
      selectedApiFunction
        ? findServerApiEndpoint(selectedApiFunction, serverApiEndpoints)
        : null,
    [selectedApiFunction, serverApiEndpoints],
  );
  const selectedApiAuthBlock = useMemo(
    () =>
      selectedApiFunction
        ? findAuthBlock(app, selectedApiFunction.authBlockId)
        : null,
    [app, selectedApiFunction],
  );
  const filteredHtmlTags = useMemo(() => {
    const query = toolboxQuery.trim().toLowerCase();
    if (!query) {
      return HTML_ELEMENT_DEFINITIONS;
    }

    return HTML_ELEMENT_DEFINITIONS.filter(
      (entry) =>
        entry.tag.includes(query) ||
        `<${entry.tag}>`.includes(query) ||
        entry.name.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query),
    );
  }, [toolboxQuery]);
  const availablePropertyOptions = useMemo(
    () =>
      app.pages.flatMap((pageData) =>
        pageData.blocks.flatMap((pageBlock) =>
          API_SOURCE_FIELD_OPTIONS.map((field) => ({
            blockId: pageBlock.id,
            field: field.value,
            label: `${pageData.name} / ${pageBlock.attributes.elementId || pageBlock.name} -> ${field.label}`,
          })),
        ),
      ),
    [app.pages],
  );

  const updateCurrentApp = (updater: (current: BuilderAppModel) => BuilderAppModel) => {
    updateApp(app.id, updater);
  };

  const updateCurrentPage = (updater: (pageData: BuilderAppModel["pages"][number]) => BuilderAppModel["pages"][number]) => {
    const currentPageId = page?.id ?? selectedPageId;
    if (!currentPageId) return;
    updateCurrentApp((current) => ({
      ...current,
      pages: current.pages.map((item) => (item.id === currentPageId ? updater(item) : item)),
    }));
  };

  const updateSelectedBlock = (updater: (item: BuilderBlock) => BuilderBlock) => {
    if (!block) return;
    updateCurrentPage((current) => ({
      ...current,
      blocks: current.blocks.map((item) => (item.id === block.id ? updater(item) : item)),
    }));
  };

  const uploadBrandAsset = async (
    event: ChangeEvent<HTMLInputElement>,
    field: "logoImage" | "backgroundImage" | "heroImage",
    successMessage: string,
    maxDimension = 512,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const image = await readImageFileAsDataUrl(file, maxDimension);
      updateCurrentApp((current) => ({
        ...current,
        brand: { ...current.brand, [field]: image },
      }));
      toast.success(successMessage);
    } catch {
      toast.error("Unable to read that image");
    } finally {
      event.target.value = "";
    }
  };

  const uploadLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    await uploadBrandAsset(event, "logoImage", "App logo uploaded", 512);
  };

  const uploadThemeImage = async (
    event: ChangeEvent<HTMLInputElement>,
    field: "backgroundImage" | "heroImage",
    successMessage: string,
  ) => {
    await uploadBrandAsset(event, field, successMessage, 1600);
  };

  const uploadCssFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const css = await readTextFile(file);
      updateCurrentApp((current) => ({
        ...current,
        brand: {
          ...current.brand,
          customCss: css,
          customCssFileName: file.name,
        },
      }));
      toast.success("CSS file uploaded");
    } catch {
      toast.error("Unable to read that CSS file");
    } finally {
      event.target.value = "";
    }
  };

  const applyThemePreset = (presetId: string) => {
    const theme = findAppThemePreset(presetId);
    updateCurrentApp((current) => ({
      ...current,
      brand: {
        ...current.brand,
        themePresetId: theme.id,
        primary: theme.theme.primary,
        secondary: theme.theme.secondary,
        accent: theme.theme.accent,
        surface: theme.theme.surface,
        textColor: theme.theme.textColor,
        cardBackground: theme.theme.cardBackground,
      },
    }));
    toast.success(`${theme.label} applied`);
  };

  const applyFontPreset = (fontId: string) => {
    if (fontId === UPLOADED_FONT_PRESET_ID) {
      return;
    }

    const font = findFontOption(fontId);
    updateCurrentApp((current) => ({
      ...current,
      brand: {
        ...current.brand,
        fontPresetId: font.id,
        fontFamily: font.family,
        customFontName: "",
        customFontSource: "",
        customFontFormat: "",
      },
    }));
  };

  const uploadFont = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fontName = deriveFontName(file.name);
      const fontSource = await readFontFileAsDataUrl(file);
      updateCurrentApp((current) => ({
        ...current,
        brand: {
          ...current.brand,
          fontPresetId: UPLOADED_FONT_PRESET_ID,
          fontFamily: buildUploadedFontFamily(fontName),
          customFontName: fontName,
          customFontSource: fontSource,
          customFontFormat: inferFontFormat(file),
        },
      }));
      toast.success("App font uploaded");
    } catch {
      toast.error("Unable to read that font file");
    } finally {
      event.target.value = "";
    }
  };

  const clearUploadedFont = () => {
    updateCurrentApp((current) => ({
      ...current,
      brand: {
        ...current.brand,
        fontPresetId: selectedFontPreset.id || DEFAULT_FONT_PRESET_ID,
        fontFamily: selectedFontPreset.family,
        customFontName: "",
        customFontSource: "",
        customFontFormat: "",
      },
    }));
  };

  const updateSelectedApiFunction = (updater: (item: BuilderApiFunction) => BuilderApiFunction) => {
    if (!selectedApiFunction) return;
    updateCurrentApp((current) => ({
      ...current,
      apiFunctions: current.apiFunctions.map((item) =>
        item.id === selectedApiFunction.id ? updater(item) : item,
      ),
    }));
  };

  const applyEndpointToSelectedFunction = (endpointId: string) => {
    if (!selectedApiFunction) {
      return;
    }

    const endpoint = serverApiEndpoints.find((entry) => entry.id === endpointId);
    if (!endpoint) {
      return;
    }

    let addedAuthBlock = false;
    updateCurrentApp((current) => {
      const result = applyServerEndpointToFunction(
        current,
        selectedApiFunction.id,
        endpoint,
      );
      addedAuthBlock = result.addedAuthBlock;
      return result.app;
    });

    if (addedAuthBlock) {
      toast.success("Auth block added for the protected API endpoint");
    }
  };

  const addApiFunction = () => {
    const next = createApiFunction(app.apiFunctions.length);
    updateCurrentApp((current) => {
      const initialApp = {
        ...current,
        apiFunctions: [...current.apiFunctions, next],
      };
      const defaultEndpoint = serverApiEndpoints[0];

      if (!defaultEndpoint) {
        return initialApp;
      }

      return applyServerEndpointToFunction(
        initialApp,
        next.id,
        defaultEndpoint,
      ).app;
    });
    setSelectedApiFunctionId(next.id);
  };

  const removeApiFunction = (functionId: string) => {
    updateCurrentApp((current) => ({
      ...current,
      apiFunctions: current.apiFunctions.filter((item) => item.id !== functionId),
      pages: current.pages.map((pageData) => ({
        ...pageData,
        blocks: pageData.blocks.map((pageBlock) =>
          pageBlock.events.tap.functionId === functionId
            ? {
                ...pageBlock,
                events: {
                  tap: {
                    ...pageBlock.events.tap,
                    functionId: "",
                  },
                },
              }
            : pageBlock,
        ),
      })),
    }));

    if (selectedApiFunctionId === functionId) {
      const fallback = app.apiFunctions.find((item) => item.id !== functionId);
      setSelectedApiFunctionId(fallback?.id ?? "");
    }
  };

  const triggerBlockEvent = async (item: BuilderBlock) => {
    const action = item.events.tap;

    if (action.kind === "none") {
      return;
    }

    if (action.kind === "navigate") {
      const targetPage = app.pages.find((entry) => entry.id === action.targetPageId);
      if (!targetPage) {
        toast.error("Pick a target page for this block event");
        return;
      }

      setSelectedPageId(targetPage.id);
      setSelectedBlockId(targetPage.blocks[0]?.id ?? "");
      toast.success(action.successMessage.trim() || `Navigated to ${targetPage.name}`);
      return;
    }

    const apiFunction = app.apiFunctions.find((entry) => entry.id === action.functionId);
    if (!apiFunction) {
      toast.error("Choose an API function for this block event");
      return;
    }
    if (!apiFunction.endpoint.trim()) {
      toast.error("Set an endpoint on the selected API function");
      return;
    }

    setPendingActionId(item.id);

    try {
      const endpointMeta = findServerApiEndpoint(apiFunction, serverApiEndpoints);
      const effectiveRequiresAuth =
        endpointMeta?.requiresAuth ?? apiFunction.requiresAuth;
      const authBlock = effectiveRequiresAuth
        ? findAuthBlock(app, apiFunction.authBlockId)
        : null;

      if (effectiveRequiresAuth && !authBlock) {
        throw new Error(
          "Add an Auth block before calling this protected API endpoint",
        );
      }

      const headers = parseRequestHeaders(apiFunction.headers);
      const requestData = buildApiFunctionRequest(app, apiFunction, endpointMeta);
      if (requestData.missingRequired.length > 0) {
        throw new Error(
          `Set values for required API params: ${requestData.missingRequired.join(", ")}`,
        );
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
      if (!response.ok) {
        throw new Error(responseText || `Request failed with status ${response.status}`);
      }

      const detail = responseText.slice(0, 140);
      toast.success(
        action.successMessage.trim()
          || apiFunction.successMessage.trim()
          || `${apiFunction.method} ${requestData.endpoint} completed`,
        detail ? { description: detail } : undefined,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to run this API action");
    } finally {
      setPendingActionId(null);
    }
  };

  const reorderById = <T extends { id: string }>(items: T[], fromId: string, toId: string) => {
    const next = [...items];
    const from = next.findIndex((item) => item.id === fromId);
    const to = next.findIndex((item) => item.id === toId);
    if (from === -1 || to === -1) return items;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  const addBlockToCurrentPage = (next: BuilderBlock) => {
    updateCurrentPage((current) => ({ ...current, blocks: [...current.blocks, next] }));
    setSelectedBlockId(next.id);
  };

  const renderPreview = useMemo(() => (item: BuilderBlock, selected: boolean) => renderBlock(item, app, selected), [app]);

  return (
    <AppShell
      title={`${app.name} Designer`}
      description="Design the selected app on a dedicated page. Resize the preview, manage app-specific branding, reorder blocks, and adjust spacing in the inspector."
      fluid
      actions={
        <>
          <Button variant="outline" onClick={() => navigate("/builder")}>Back to apps</Button>
          <Button
            disabled={STATIC_RUNTIME}
            onClick={async () => {
              const response = await fetch("/api/builder/export-maui", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ app }),
              });
              const data = (await response.json()) as ApiResponse<BuilderMauiExportResponse>;
              if (!response.ok || !data.success || !data.data) {
                toast.error(data.error ?? "Failed to build MAUI project");
                return;
              }
              toast.success(`MAUI project created at ${data.data.outputPath}`);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            {STATIC_RUNTIME ? "MAUI export requires server mode" : "Build MAUI app"}
          </Button>
          <Button variant="outline" onClick={() => setPreview((current) => !current)}>
            <Eye className="mr-2 h-4 w-4" />
            {preview ? "Edit mode" : "Preview mode"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        {!preview ? (
          <div className="space-y-5">
            <Panel eyebrow="Explorer" title="Project">
              <Tabs defaultValue="pages">
                <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-muted/40 p-1">
                  <TabsTrigger value="pages">Pages</TabsTrigger>
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                  <TabsTrigger value="styles">Styles</TabsTrigger>
                  <TabsTrigger value="api">API</TabsTrigger>
                </TabsList>
                <TabsContent value="pages" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">Add, reorder, or remove app pages here.</p>
                    <Button size="sm" onClick={() => {
                      const nextPage = { id: uid("p"), name: `Page ${app.pages.length + 1}`, blocks: [createBlock("heading"), createBlock("text")] };
                      updateCurrentApp((current) => ({ ...current, pages: [...current.pages, nextPage] }));
                      setSelectedPageId(nextPage.id);
                      setSelectedBlockId(nextPage.blocks[0].id);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      New page
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {app.pages.map((item) => (
                      <ContextMenu key={item.id}>
                        <ContextMenuTrigger>
                          <button
                            draggable
                            onDragStart={() => setDragPageId(item.id)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => {
                              if (!dragPageId) return;
                              updateCurrentApp((current) => ({ ...current, pages: reorderById(current.pages, dragPageId, item.id) }));
                              setDragPageId(null);
                            }}
                            onClick={() => {
                              setSelectedPageId(item.id);
                              setSelectedBlockId(item.blocks[0]?.id ?? "");
                            }}
                            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${item.id === page.id ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/70"}`}
                          >
                            <div>
                              <div className="font-bold">{item.name}</div>
                              <div className="text-xs text-muted-foreground">{item.blocks.length} blocks</div>
                            </div>
                            <MoveVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuLabel>Page Actions</ContextMenuLabel>
                          <ContextMenuItem onClick={() => {
                            const copy = {
                              ...item,
                              id: uid("p"),
                              name: `${item.name} Copy`,
                              blocks: item.blocks.map((entry) => ({
                                ...entry,
                                id: uid("b"),
                                layout: { ...entry.layout },
                                attributes: { ...entry.attributes },
                                events: { tap: { ...entry.events.tap } },
                              })),
                            };
                            updateCurrentApp((current) => ({ ...current, pages: [...current.pages, copy] }));
                          }}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate page
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                            if (app.pages.length === 1) return;
                            updateCurrentApp((current) => ({ ...current, pages: current.pages.filter((entry) => entry.id !== item.id) }));
                            if (page.id === item.id) {
                              const fallback = app.pages.find((entry) => entry.id !== item.id);
                              setSelectedPageId(fallback?.id ?? "");
                              setSelectedBlockId(fallback?.blocks[0]?.id ?? "");
                            }
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove page
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="branding" className="mt-4 space-y-4">
                  <div
                    className="rounded-3xl border border-border/60 bg-muted/15 p-4"
                    style={{ fontFamily: app.brand.fontFamily }}
                  >
                    <div className="flex items-center gap-3">
                      <BrandMark
                        image={app.brand.logoImage}
                        text={app.brand.logo}
                        label={`${app.brand.appName} logo`}
                        primary={app.brand.primary}
                        accent={app.brand.accent}
                        className="h-14 w-14"
                        imageClassName="object-contain bg-white p-2"
                      />
                      <div className="min-w-0">
                        <div className="font-black">{app.brand.appName}</div>
                        <div className="text-sm text-muted-foreground">{app.brand.domain}</div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[2rem] border border-border/60 bg-background/80 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-black">App themes</div>
                        <p className="text-sm text-muted-foreground">
                          Pick a starting palette, then adjust colors, fonts, and images and save the modified app theme.
                        </p>
                      </div>
                      <Badge className="rounded-full px-3 py-1">{selectedThemePreset.label}</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {APP_THEME_PRESETS.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          className={cn(
                            "rounded-3xl border border-border/60 bg-background/90 p-4 text-left transition hover:border-primary/60 hover:shadow-lg",
                            app.brand.themePresetId === theme.id &&
                              "border-primary bg-primary/5 shadow-[0_18px_48px_-28px_hsl(var(--primary)/0.55)]",
                          )}
                          onClick={() => applyThemePreset(theme.id)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-black">{theme.label}</div>
                            <div className="flex gap-1.5">
                              {theme.swatches.map((swatch) => (
                                <span
                                  key={`${theme.id}-${swatch}`}
                                  className="h-4 w-4 rounded-full border border-white/60 shadow-sm"
                                  style={{ backgroundColor: swatch }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            {theme.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="App name">
                    <Input value={app.brand.appName} onChange={(event) => updateCurrentApp((current) => ({ ...current, name: event.target.value, brand: { ...current.brand, appName: event.target.value } }))} />
                  </Field>
                  <Field label="Logo text">
                    <Input value={app.brand.logo} onChange={(event) => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, logo: event.target.value.toUpperCase().slice(0, 3) || getInitials(current.name) } }))} />
                  </Field>
                  <AssetField
                    label="Logo image"
                    preview={
                      <BrandMark
                        image={app.brand.logoImage}
                        text={app.brand.logo}
                        label={`${app.brand.appName} logo`}
                        primary={app.brand.primary}
                        accent={app.brand.accent}
                        className="h-14 w-14"
                        imageClassName="object-contain bg-white p-2"
                      />
                    }
                    actionLabel={app.brand.logoImage ? "Replace logo" : "Upload logo"}
                    onChange={(event) => void uploadLogo(event)}
                    onClear={app.brand.logoImage ? () => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, logoImage: "" } })) : undefined}
                  />
                  <Field label="Domain">
                    <Input value={app.brand.domain} onChange={(event) => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, domain: event.target.value } }))} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <ColorField label="Primary" value={app.brand.primary} onChange={(value) => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, primary: value } }))} />
                    <ColorField label="Secondary" value={app.brand.secondary} onChange={(value) => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, secondary: value } }))} />
                    <ColorField label="Accent" value={app.brand.accent} onChange={(value) => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, accent: value } }))} />
                    <ColorField label="Surface" value={app.brand.surface} onChange={(value) => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, surface: value } }))} />
                    <ColorField label="Text" value={app.brand.textColor} onChange={(value) => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, textColor: value } }))} />
                    <ColorField label="Cards" value={app.brand.cardBackground} onChange={(value) => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, cardBackground: value } }))} />
                  </div>
                  <div className="rounded-[2rem] border border-border/60 bg-background/80 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-black">App fonts</div>
                        <p className="text-sm text-muted-foreground">
                          Use a preset, upload a custom font file, or override the stack manually.
                        </p>
                      </div>
                      <Badge className="rounded-full px-3 py-1">
                        {selectedFontValue === UPLOADED_FONT_PRESET_ID
                          ? app.brand.customFontName || "Uploaded font"
                          : selectedFontPreset.label}
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      <Field label="Preset font">
                        <Select value={selectedFontValue} onValueChange={applyFontPreset}>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Choose a font" />
                          </SelectTrigger>
                          <SelectContent>
                            {app.brand.customFontSource ? (
                              <SelectItem value={UPLOADED_FONT_PRESET_ID}>
                                Uploaded: {app.brand.customFontName || "Custom font"}
                              </SelectItem>
                            ) : null}
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font.id} value={font.id}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <div
                        className="rounded-3xl border border-border/60 bg-background/90 p-5"
                        style={{ fontFamily: app.brand.fontFamily }}
                      >
                        <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                          App font preview
                        </div>
                        <div className="mt-3 text-2xl font-black tracking-tight">
                          {app.brand.appName}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Headers, preview cards, buttons, and generated app styles use this saved font stack.
                        </p>
                      </div>
                      <Field label="Font stack">
                        <Input
                          value={app.brand.fontFamily}
                          onChange={(event) => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, fontFamily: event.target.value } }))}
                          placeholder={selectedFontPreset.family}
                        />
                      </Field>
                      <div className="rounded-3xl border border-border/60 bg-muted/10 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold">Uploaded font</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {app.brand.customFontName || "No uploaded font saved for this app"}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm font-semibold text-foreground">
                              <Type className="h-4 w-4" />
                              Upload font
                              <input
                                type="file"
                                accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf"
                                className="sr-only"
                                onChange={(event) => void uploadFont(event)}
                              />
                            </Label>
                            {app.brand.customFontSource ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-2xl"
                                onClick={clearUploadedFont}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <AssetField
                    label="App background image"
                    preview={<ImageAssetPreview source={app.brand.backgroundImage} label="Background" fallback="BG" />}
                    actionLabel={app.brand.backgroundImage ? "Replace background" : "Upload background"}
                    onChange={(event) => void uploadThemeImage(event, "backgroundImage", "App background uploaded")}
                    onClear={app.brand.backgroundImage ? () => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, backgroundImage: "" } })) : undefined}
                  />
                  <AssetField
                    label="Header image"
                    preview={<ImageAssetPreview source={app.brand.heroImage} label="Header" fallback="Hero" />}
                    actionLabel={app.brand.heroImage ? "Replace header image" : "Upload header image"}
                    onChange={(event) => void uploadThemeImage(event, "heroImage", "Header image uploaded")}
                    onClear={app.brand.heroImage ? () => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, heroImage: "" } })) : undefined}
                  />
                  <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Theme scope</div>
                    <p className="text-sm text-muted-foreground">
                      App colors, fonts, and images stay local to this mobile app. Workspace white-label settings do not override them.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="styles" className="mt-4 space-y-4">
                  <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Custom CSS</div>
                    <p className="text-sm text-muted-foreground">
                      Upload a `.css` file or write CSS directly. The preview scopes it to this app, and the exported app includes the raw stylesheet.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-muted/15 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold">CSS file</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {app.brand.customCssFileName || "No CSS file uploaded"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm font-semibold text-foreground">
                          <ImagePlus className="h-4 w-4" />
                          Upload CSS
                          <input type="file" accept=".css,text/css" className="sr-only" onChange={(event) => void uploadCssFile(event)} />
                        </Label>
                        {(app.brand.customCss || app.brand.customCssFileName) ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-2xl"
                            onClick={() => updateCurrentApp((current) => ({
                              ...current,
                              brand: {
                                ...current.brand,
                                customCss: "",
                                customCssFileName: "",
                              },
                            }))}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <Field label="CSS editor">
                    <Textarea
                      className="min-h-[260px] font-mono text-xs"
                      value={app.brand.customCss}
                      onChange={(event) => updateCurrentApp((current) => ({
                        ...current,
                        brand: {
                          ...current.brand,
                          customCss: event.target.value,
                        },
                      }))}
                      placeholder={".promo-card {\n  border: 1px solid rgba(15, 23, 42, 0.12);\n}\n\n#hero-cta {\n  text-transform: uppercase;\n}"}
                    />
                  </Field>
                </TabsContent>
                <TabsContent value="api" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">Define named API functions from server endpoints and map their params from other blocks in the app.</p>
                    <Button size="sm" onClick={addApiFunction}>
                      <Plus className="mr-2 h-4 w-4" />
                      New function
                    </Button>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Server endpoint catalog</div>
                    <p className="text-sm text-muted-foreground">
                      API functions now come from live server endpoint definitions. Required params, auth rules, and route shapes are pulled from the server automatically.
                    </p>
                    {isLoadingServerApiEndpoints ? (
                      <div className="mt-3 text-xs text-muted-foreground">Loading endpoint list...</div>
                    ) : null}
                    {!isLoadingServerApiEndpoints && serverApiEndpointsError ? (
                      <div className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        {serverApiEndpointsError}
                      </div>
                    ) : null}
                    {!isLoadingServerApiEndpoints && !serverApiEndpointsError ? (
                      <div className="mt-3 text-xs text-muted-foreground">
                        {serverApiEndpoints.length} server endpoints available
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {app.apiFunctions.map((fn) => (
                      <div key={fn.id} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${fn.id === selectedApiFunctionId ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/70"}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedApiFunctionId(fn.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="truncate font-bold">{fn.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{fn.method} {fn.endpoint}</div>
                        </button>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-2xl" onClick={() => removeApiFunction(fn.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {app.apiFunctions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                        No API functions defined yet.
                      </div>
                    ) : null}
                  </div>
                  {selectedApiFunction ? (
                    <div className="space-y-4 rounded-3xl border border-border/60 bg-muted/15 p-4">
                      <Field label="Function name">
                        <Input
                          value={selectedApiFunction.name}
                          onChange={(event) => updateSelectedApiFunction((item) => ({ ...item, name: event.target.value }))}
                        />
                      </Field>
                      <Field label="Server endpoint">
                        <select
                          value={selectedServerApiEndpoint?.id ?? ""}
                          onChange={(event) => applyEndpointToSelectedFunction(event.target.value)}
                          className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
                        >
                          <option value="">Select a server endpoint</option>
                          {Array.from(new Set(serverApiEndpoints.map((entry) => entry.category))).map((category) => (
                            <optgroup key={category} label={category}>
                              {serverApiEndpoints
                                .filter((entry) => entry.category === category)
                                .map((endpoint) => (
                                  <option key={endpoint.id} value={endpoint.id}>
                                    {endpoint.method} {endpoint.path} - {endpoint.name}
                                  </option>
                                ))}
                            </optgroup>
                          ))}
                        </select>
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Method">
                          <Input value={selectedApiFunction.method} readOnly />
                        </Field>
                        <Field label="Resolved path">
                          <Input value={selectedApiFunction.endpoint} readOnly />
                        </Field>
                      </div>
                      {selectedServerApiEndpoint ? (
                        <div className="rounded-2xl border border-border/60 bg-background/80 p-4 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                              {selectedServerApiEndpoint.category}
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                              {selectedServerApiEndpoint.method}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="rounded-full px-3 py-1"
                            >
                              {selectedServerApiEndpoint.requiresAuth
                                ? "Protected endpoint"
                                : "Public endpoint"}
                            </Badge>
                          </div>
                          <div className="mt-3 font-semibold text-foreground">
                            {selectedServerApiEndpoint.name}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {selectedServerApiEndpoint.description}
                          </div>
                          {selectedServerApiEndpoint.allowedRoles.length > 0 ? (
                            <div className="mt-3 text-xs text-muted-foreground">
                              Allowed roles: {selectedServerApiEndpoint.allowedRoles.join(", ")}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {(selectedServerApiEndpoint?.requiresAuth || selectedApiFunction.requiresAuth) ? (
                        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                          <div className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Protected API auth</div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            This endpoint uses the app auth block automatically and includes credentials on the request. If no auth block exists, one is added when you pick the endpoint.
                          </p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                            <div className="rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-sm">
                              {selectedApiAuthBlock
                                ? `${selectedApiAuthBlock.pageName} / ${selectedApiAuthBlock.block.name}`
                                : "No auth block connected"}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-2xl"
                              onClick={() => {
                                const endpoint = selectedServerApiEndpoint;
                                if (!endpoint) {
                                  return;
                                }
                                applyEndpointToSelectedFunction(endpoint.id);
                              }}
                            >
                              Sync auth block
                            </Button>
                          </div>
                          {authBlocks.length > 1 ? (
                            <Field label="Auth block">
                              <select
                                value={selectedApiAuthBlock?.block.id ?? ""}
                                onChange={(event) =>
                                  updateSelectedApiFunction((item) => ({
                                    ...item,
                                    authBlockId: event.target.value,
                                  }))
                                }
                                className="mt-3 h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
                              >
                                <option value="">Select auth block</option>
                                {authBlocks.map((entry) => (
                                  <option key={entry.block.id} value={entry.block.id}>
                                    {entry.pageName} / {entry.block.name}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          ) : null}
                        </div>
                      ) : null}
                      <Field label="Headers">
                        <Textarea
                          className="min-h-[90px]"
                          value={selectedApiFunction.headers}
                          onChange={(event) => updateSelectedApiFunction((item) => ({ ...item, headers: event.target.value }))}
                          placeholder={"{\n  \"X-App-Context\": \"mobile-builder\"\n}"}
                        />
                      </Field>
                      <Field label="Default success message">
                        <Input
                          value={selectedApiFunction.successMessage}
                          onChange={(event) => updateSelectedApiFunction((item) => ({ ...item, successMessage: event.target.value }))}
                          placeholder="Function completed successfully"
                        />
                      </Field>
                      <div className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Function params</div>
                            <div className="text-xs text-muted-foreground">Retrieved params are mapped from server endpoint metadata. Map each one to a block property or a static value.</div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-2xl"
                            onClick={() => updateSelectedApiFunction((item) => ({
                              ...item,
                              properties: [...item.properties, createApiFunctionPropertyBinding({ key: `value${item.properties.length + 1}`, location: item.method === "GET" || item.method === "DELETE" ? "query" : "body" })],
                            }))}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add custom param
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {selectedApiFunction.properties.map((property) => (
                            <div key={property.id} className="space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-3">
                              {(() => {
                                const serverParam =
                                  selectedServerApiEndpoint?.params.find(
                                    (param) =>
                                      param.name === property.key &&
                                      param.location === property.location,
                                  ) ??
                                  selectedServerApiEndpoint?.params.find(
                                    (param) => param.name === property.key,
                                  ) ??
                                  null;
                                const isServerParam = Boolean(serverParam);

                                return (
                                  <>
                              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_120px_auto]">
                                <Field label={isServerParam ? "Param" : "Key"}>
                                  <Input
                                    value={property.key}
                                    readOnly={isServerParam}
                                    onChange={(event) => updateSelectedApiFunction((item) => ({
                                      ...item,
                                      properties: item.properties.map((entry) =>
                                        entry.id === property.id ? { ...entry, key: event.target.value } : entry,
                                      ),
                                    }))}
                                  />
                                </Field>
                                <Field label="Location">
                                  {isServerParam ? (
                                    <Input
                                      value={API_PARAMETER_LOCATION_LABELS[serverParam.location]}
                                      readOnly
                                    />
                                  ) : (
                                    <select
                                      value={property.location}
                                      onChange={(event) => updateSelectedApiFunction((item) => ({
                                        ...item,
                                        properties: item.properties.map((entry) =>
                                          entry.id === property.id
                                            ? {
                                                ...entry,
                                                location: event.target.value as BuilderApiParameterLocation,
                                              }
                                            : entry,
                                        ),
                                      }))}
                                      className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
                                    >
                                      <option value="path">Path</option>
                                      <option value="query">Query</option>
                                      <option value="body">Body</option>
                                    </select>
                                  )}
                                </Field>
                                <Field label="Source">
                                  <select
                                    value={property.sourceType}
                                    onChange={(event) => updateSelectedApiFunction((item) => ({
                                      ...item,
                                      properties: item.properties.map((entry) =>
                                        entry.id === property.id
                                          ? { ...entry, sourceType: event.target.value as BuilderApiFunctionPropertyBinding["sourceType"] }
                                          : entry,
                                      ),
                                    }))}
                                    className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
                                  >
                                    <option value="block">Block property</option>
                                    <option value="static">Static value</option>
                                  </select>
                                </Field>
                                <div className="flex items-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-2xl"
                                    disabled={isServerParam}
                                    onClick={() => updateSelectedApiFunction((item) => ({
                                      ...item,
                                      properties: item.properties.filter((entry) => entry.id !== property.id),
                                    }))}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {serverParam ? (
                                <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
                                  {serverParam.required ? "Required" : "Optional"} {API_PARAMETER_LOCATION_LABELS[serverParam.location].toLowerCase()} param. {serverParam.description}
                                </div>
                              ) : null}
                              {property.sourceType === "block" ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <Field label="Source block">
                                    <select
                                      value={property.sourceBlockId ? `${property.sourceBlockId}:${property.sourceField}` : ""}
                                      onChange={(event) => {
                                        const [sourceBlockId, sourceField] = event.target.value.split(":");
                                        updateSelectedApiFunction((item) => ({
                                          ...item,
                                          properties: item.properties.map((entry) =>
                                            entry.id === property.id
                                              ? {
                                                  ...entry,
                                                  sourceBlockId,
                                                  sourceField: (sourceField || "text") as BuilderApiFunctionSourceField,
                                                }
                                              : entry,
                                          ),
                                        }));
                                      }}
                                      className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
                                    >
                                      <option value="">Select a block property</option>
                                      {availablePropertyOptions.map((option) => (
                                        <option key={`${option.blockId}:${option.field}`} value={`${option.blockId}:${option.field}`}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </Field>
                                  <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-3 text-xs leading-5 text-muted-foreground">
                                    {serverParam
                                      ? "This server param always uses the latest value from the referenced block when the event runs."
                                      : "Custom params also use the latest value from the referenced block when the event runs."}
                                  </div>
                                </div>
                              ) : (
                                <Field label="Static value">
                                  <Input
                                    value={property.staticValue}
                                    onChange={(event) => updateSelectedApiFunction((item) => ({
                                      ...item,
                                      properties: item.properties.map((entry) =>
                                        entry.id === property.id ? { ...entry, staticValue: event.target.value } : entry,
                                      ),
                                    }))}
                                  />
                                </Field>
                              )}
                                  </>
                                );
                              })()}
                            </div>
                          ))}
                          {selectedApiFunction.properties.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                              {selectedServerApiEndpoint
                                ? "This endpoint has no params. Add a custom param only if the handler accepts extra request data."
                                : "Select a server endpoint to retrieve its params."}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </TabsContent>
              </Tabs>
            </Panel>

            <Panel eyebrow="Toolbar" title="Add Blocks">
              <div className="space-y-5">
                <div>
                  <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">App blocks</div>
                  <div className="flex flex-wrap gap-3">
                    {CORE_LIBRARY.map((item) => (
                      <Tooltip key={item.type}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => addBlockToCurrentPage(createBlock(item.type))}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/75 text-primary transition-all hover:border-primary/40 hover:bg-primary/5"
                          >
                            <span className="scale-110">{item.icon}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[220px] rounded-2xl p-3">
                          <div className="font-bold">{item.label}</div>
                          <div className="mt-1 text-xs text-muted-foreground">Add this block to the selected page.</div>
                          <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-2 text-[10px] text-muted-foreground">Preview: {item.label} block</div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">HTML elements</div>
                      <div className="text-xs text-muted-foreground">{filteredHtmlTags.length} available in toolbox</div>
                    </div>
                    <Input
                      value={toolboxQuery}
                      onChange={(event) => setToolboxQuery(event.target.value)}
                      placeholder="Search tags"
                      className="h-9 max-w-[160px] rounded-2xl"
                    />
                  </div>
                  <ScrollArea className="h-[320px] rounded-2xl border border-border/60 bg-background/75">
                    <div className="grid grid-cols-2 gap-2 p-3">
                      {filteredHtmlTags.map((entry) => (
                        <Tooltip key={entry.tag}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => addBlockToCurrentPage(createHtmlToolboxBlock(entry.tag))}
                              className="flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background px-3 py-3 text-center text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
                              aria-label={`Add ${entry.name} element`}
                            >
                              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <FontAwesomeIcon icon={entry.icon} className="text-base" />
                              </span>
                              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                {`<${entry.tag}>`}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px] rounded-2xl p-3">
                            <div className="font-bold">{entry.name}</div>
                            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                              {`<${entry.tag}>`}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">{entry.description}</div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {filteredHtmlTags.length === 0 ? (
                        <div className="col-span-2 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-3 py-4 text-sm text-muted-foreground">
                          No matching HTML tags.
                        </div>
                      ) : null}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </Panel>
          </div>
        ) : null}

        <section
          ref={previewViewportRef}
          className="rounded-[2rem] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--muted)/0.45),hsl(var(--background)))] p-4 shadow-xl sm:p-6"
        >
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Preview</div>
              <h2 className="mt-2 text-xl font-black tracking-tight">{page.name}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {Math.round(previewScale * 100)}% scale
              </Badge>
              <select
                value={screenSize}
                onChange={(event) => setScreenSize(event.target.value as (typeof PHONE_PRESETS)[number]["id"])}
                className="h-10 rounded-2xl border border-border/60 bg-background px-3 text-sm"
              >
                {PHONE_PRESETS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} ({item.width}px)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden">
            <div className="flex justify-center" style={{ minHeight: previewCanvasHeight }}>
              <div
                style={{
                  width: deviceWidth,
                  height: deviceHeight,
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top center",
                }}
              >
                <div className="rounded-[3.2rem] bg-slate-950 p-3 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.72)]">
                  <div className="overflow-hidden rounded-[2.5rem] bg-white transition-all" style={{ width: preset.width, fontFamily: app.brand.fontFamily }}>
                    {scopedPreviewCss ? <style>{scopedPreviewCss}</style> : null}
                    <div className="flex h-8 items-center justify-center bg-slate-950">
                      <div className="h-1.5 w-24 rounded-full bg-slate-700" />
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={page.id}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -18 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      >
                        <ScrollArea style={{ height: preset.height }}>
                          <div data-builder-preview={app.id} className="space-y-3 p-3" style={previewSurfaceStyle}>
                            <div
                              className="rounded-[1.6rem] p-4 text-white"
                              style={previewHeroStyle}
                            >
                              <div className="flex items-center gap-3">
                                <BrandMark
                                  image={app.brand.logoImage}
                                  text={app.brand.logo}
                                  label={`${app.brand.appName} logo`}
                                  primary={app.brand.primary}
                                  accent={app.brand.accent}
                                  className="h-11 w-11 rounded-2xl"
                                  imageClassName="object-contain bg-white p-1.5"
                                  textClassName="text-xs"
                                />
                                <div className="min-w-0">
                                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                                    {app.brand.domain}
                                  </div>
                                  <div className="truncate text-lg font-black tracking-tight">{app.brand.appName}</div>
                                </div>
                              </div>
                              <div className="mt-4 flex items-center justify-between text-xs">
                                <span className="text-white/70">Current page</span>
                                <span className="font-bold">{page.name}</span>
                              </div>
                            </div>

                            {page.blocks.map((item) => (
                              <ContextMenu key={item.id}>
                                <ContextMenuTrigger>
                                  <div
                                    className={cn(
                                      isInteractiveBlock(item) && preview && "cursor-pointer",
                                      pendingActionId === item.id && "opacity-70",
                                    )}
                                    draggable={!preview}
                                    onDragStart={() => setDragBlockId(item.id)}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={() => {
                                      if (!dragBlockId) return;
                                      updateCurrentPage((current) => ({ ...current, blocks: reorderById(current.blocks, dragBlockId, item.id) }));
                                      setDragBlockId(null);
                                    }}
                                    onClick={() => {
                                      if (!preview) {
                                        setSelectedBlockId(item.id);
                                        return;
                                      }

                                      void triggerBlockEvent(item);
                                    }}
                                  >
                                    {renderPreview(item, !preview && item.id === block?.id)}
                                  </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuLabel>Block Actions</ContextMenuLabel>
                                  <ContextMenuItem onClick={() => {
                                    const copy = {
                                      ...item,
                                      id: uid("b"),
                                      layout: { ...item.layout },
                                      attributes: { ...item.attributes },
                                      events: { tap: { ...item.events.tap } },
                                    };
                                    updateCurrentPage((current) => ({ ...current, blocks: [...current.blocks, copy] }));
                                  }}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate block
                                  </ContextMenuItem>
                                  <ContextMenuSeparator />
                                  <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                                    const remaining = page.blocks.filter((entry) => entry.id !== item.id);
                                    updateCurrentPage((current) => ({ ...current, blocks: current.blocks.filter((entry) => entry.id !== item.id) }));
                                    if (selectedBlockId === item.id) {
                                      setSelectedBlockId(remaining[0]?.id ?? "");
                                    }
                                  }}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove block
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            ))}
                          </div>
                        </ScrollArea>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {!preview && block ? (
          <div className="space-y-5">
            <Panel eyebrow="Inspector" title="Selected Block">
              <div className="space-y-4">
                <Field label={block.type === "html" ? "Content" : "Text"}>
                  <Input value={block.text ?? ""} onChange={(event) => updateSelectedBlock((item) => ({ ...item, text: event.target.value }))} />
                </Field>
                {block.type === "html" ? (
                  <>
                    <Field label="HTML tag">
                      <div className="space-y-2">
                        <Input
                          list={`html-tag-options-${block.id}`}
                          value={block.htmlTag ?? "div"}
                          onChange={(event) => updateSelectedBlock((item) => ({ ...item, htmlTag: event.target.value }))}
                          placeholder="section"
                        />
                        <datalist id={`html-tag-options-${block.id}`}>
                          {HTML_ELEMENT_DEFINITIONS.map((entry) => (
                            <option key={entry.tag} value={entry.tag} label={entry.name} />
                          ))}
                        </datalist>
                      </div>
                    </Field>
                    <Field label="HTML attributes JSON">
                      <Textarea
                        className="min-h-[140px]"
                        value={block.htmlAttributes ?? ""}
                        onChange={(event) => updateSelectedBlock((item) => ({ ...item, htmlAttributes: event.target.value }))}
                        placeholder={"{\n  \"href\": \"#\",\n  \"target\": \"_blank\",\n  \"title\": \"Custom element\"\n}"}
                      />
                    </Field>
                  </>
                ) : null}
                {["quicklinks", "rewardcatalog", "wallet", "profile"].includes(block.type) ? (
                  <Field label="Items">
                    <Textarea className="min-h-[100px]" value={(block.items ?? []).join("\n")} onChange={(event) => updateSelectedBlock((item) => ({ ...item, items: event.target.value.split("\n").map((entry) => entry.trim()).filter(Boolean) }))} />
                  </Field>
                ) : null}
                {block.type === "html" && usesHtmlItems(sanitizeHtmlTag(block.htmlTag)) ? (
                  <Field label="Child items">
                    <Textarea
                      className="min-h-[100px]"
                      value={(block.items ?? []).join("\n")}
                      onChange={(event) => updateSelectedBlock((item) => ({ ...item, items: event.target.value.split("\n").map((entry) => entry.trim()).filter(Boolean) }))}
                      placeholder={sanitizeHtmlTag(block.htmlTag) === "select" ? "Option A\nOption B\nOption C" : "First item\nSecond item\nThird item"}
                    />
                  </Field>
                ) : null}
                {["receiptscan", "qrcode", "auth"].includes(block.type) ? (
                  <Field label="Helper">
                    <Textarea className="min-h-[80px]" value={block.helper ?? ""} onChange={(event) => updateSelectedBlock((item) => ({ ...item, helper: event.target.value }))} />
                  </Field>
                ) : null}
                {["receiptscan", "qrcode"].includes(block.type) ? (
                  <Field label="Points">
                    <Input type="number" min="1" value={block.points ?? 0} onChange={(event) => updateSelectedBlock((item) => ({ ...item, points: Number(event.target.value) }))} />
                  </Field>
                ) : null}
                <div className="rounded-3xl border border-border/60 bg-muted/15 p-4">
                  <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Interactions</div>
                  <div className="space-y-4">
                    <Field label="On tap">
                      <select
                        value={block.events.tap.kind}
                        onChange={(event) => updateSelectedBlock((item) => {
                          const nextKind = event.target.value as BuilderBlockActionKind;
                          return {
                            ...item,
                            events: {
                              tap: {
                                ...item.events.tap,
                                kind: nextKind,
                                functionId:
                                  nextKind === "api"
                                    ? item.events.tap.functionId || app.apiFunctions[0]?.id || ""
                                    : item.events.tap.functionId,
                              },
                            },
                          };
                        })}
                        className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
                      >
                        <option value="none">No action</option>
                        <option value="navigate">Navigate to page</option>
                        <option value="api">Call API</option>
                      </select>
                    </Field>
                    {block.events.tap.kind === "navigate" ? (
                      <>
                        <Field label="Target page">
                          <select
                            value={block.events.tap.targetPageId}
                            onChange={(event) => updateSelectedBlock((item) => ({
                              ...item,
                              events: {
                                tap: {
                                  ...item.events.tap,
                                  targetPageId: event.target.value,
                                },
                              },
                            }))}
                            className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
                          >
                            <option value="">Select a page</option>
                            {app.pages.map((entry) => (
                              <option key={entry.id} value={entry.id}>
                                {entry.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Success message">
                          <Input
                            value={block.events.tap.successMessage}
                            onChange={(event) => updateSelectedBlock((item) => ({
                              ...item,
                              events: {
                                tap: {
                                  ...item.events.tap,
                                  successMessage: event.target.value,
                                },
                              },
                            }))}
                            placeholder="Opened rewards page"
                          />
                        </Field>
                      </>
                    ) : null}
                    {block.events.tap.kind === "api" ? (
                      <>
                        <Field label="API function">
                          <select
                            value={block.events.tap.functionId}
                            onChange={(event) => updateSelectedBlock((item) => ({
                              ...item,
                              events: {
                                tap: {
                                  ...item.events.tap,
                                  functionId: event.target.value,
                                },
                              },
                            }))}
                            className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
                          >
                            <option value="">Select a function</option>
                            {app.apiFunctions.map((fn) => (
                              <option key={fn.id} value={fn.id}>
                                {fn.name} ({fn.method} {fn.endpoint})
                              </option>
                            ))}
                          </select>
                        </Field>
                        {block.events.tap.functionId ? (
                          <div className="rounded-2xl border border-border/60 bg-background/80 p-3 text-xs leading-5 text-muted-foreground">
                            {(app.apiFunctions.find((fn) => fn.id === block.events.tap.functionId)?.properties.length ?? 0)} mapped properties will be resolved from the app when this event runs.
                          </div>
                        ) : null}
                        <Field label="Success message">
                          <Input
                            value={block.events.tap.successMessage}
                            onChange={(event) => updateSelectedBlock((item) => ({
                              ...item,
                              events: {
                                tap: {
                                  ...item.events.tap,
                                  successMessage: event.target.value,
                                },
                              },
                            }))}
                            placeholder="Points synced successfully"
                          />
                        </Field>
                      </>
                    ) : null}
                    <p className="text-xs leading-5 text-muted-foreground">
                      Switch to preview mode and tap the block to test the event binding. Navigation moves between app pages. API calls run the selected app function with properties resolved from other elements in the app.
                    </p>
                  </div>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
                  <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">HTML and style</div>
                  <div className="space-y-4">
                    <Field label="Element ID">
                      <Input
                        value={block.attributes.elementId}
                        onChange={(event) => updateSelectedBlock((item) => ({ ...item, attributes: { ...item.attributes, elementId: event.target.value } }))}
                        placeholder="hero-cta"
                      />
                    </Field>
                    <Field label="CSS classes">
                      <Input
                        value={block.attributes.className}
                        onChange={(event) => updateSelectedBlock((item) => ({ ...item, attributes: { ...item.attributes, className: event.target.value } }))}
                        placeholder="promo-card shadow-lg"
                      />
                    </Field>
                    <Field label="Inline style">
                      <Textarea
                        className="min-h-[120px]"
                        value={block.attributes.style}
                        onChange={(event) => updateSelectedBlock((item) => ({ ...item, attributes: { ...item.attributes, style: event.target.value } }))}
                        placeholder={"background: linear-gradient(135deg, #0f172a, #ea580c);\nmin-height: 140px;\nborder: 1px solid rgba(15, 23, 42, 0.08);"}
                      />
                    </Field>
                  </div>
                </div>
                <div className="rounded-3xl border border-border/60 bg-muted/15 p-4">
                  <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Layout and spacing</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Display">
                      <select
                        value={block.layout.display}
                        onChange={(event) => updateSelectedBlock((item) => ({ ...item, layout: { ...item.layout, display: event.target.value as BuilderLayoutDisplay } }))}
                        className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
                      >
                        {LAYOUT_DISPLAY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Gap">
                      <Input type="number" min="0" value={block.layout.gap} onChange={(event) => updateSelectedBlock((item) => ({ ...item, layout: { ...item.layout, gap: Number(event.target.value) } }))} />
                    </Field>
                    <Field label="Direction">
                      <select
                        value={block.layout.direction}
                        onChange={(event) => updateSelectedBlock((item) => ({ ...item, layout: { ...item.layout, direction: event.target.value as BuilderLayoutDirection } }))}
                        className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
                      >
                        {LAYOUT_DIRECTION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Columns">
                      <Input type="number" min="1" value={block.layout.columns} onChange={(event) => updateSelectedBlock((item) => ({ ...item, layout: { ...item.layout, columns: Number(event.target.value) } }))} />
                    </Field>
                    <Field label="Justify">
                      <select
                        value={block.layout.justify}
                        onChange={(event) => updateSelectedBlock((item) => ({ ...item, layout: { ...item.layout, justify: event.target.value as BuilderLayoutJustify } }))}
                        className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
                      >
                        {LAYOUT_JUSTIFY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Align">
                      <select
                        value={block.layout.align}
                        onChange={(event) => updateSelectedBlock((item) => ({ ...item, layout: { ...item.layout, align: event.target.value as BuilderLayoutAlign } }))}
                        className="h-10 w-full rounded-2xl border border-border/60 bg-background px-3 text-sm"
                      >
                        {LAYOUT_ALIGN_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="mt-4 rounded-2xl border border-border/60 bg-background/80 p-3 text-xs leading-5 text-muted-foreground">
                    Block keeps the default component layout. Flex and Grid let you reflow the block content, repeated items, and shell alignment directly in the preview.
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <SpacingGroup
                      label="Margin"
                      layout={block.layout}
                      fields={[
                        { key: "marginTop", label: "Top" },
                        { key: "marginRight", label: "Right" },
                        { key: "marginBottom", label: "Bottom" },
                        { key: "marginLeft", label: "Left" },
                      ]}
                      onChange={(key, value) => updateSelectedBlock((item) => ({ ...item, layout: { ...item.layout, [key]: value } }))}
                    />
                    <SpacingGroup
                      label="Padding"
                      layout={block.layout}
                      fields={[
                        { key: "paddingTop", label: "Top" },
                        { key: "paddingRight", label: "Right" },
                        { key: "paddingBottom", label: "Bottom" },
                        { key: "paddingLeft", label: "Left" },
                      ]}
                      onChange={(key, value) => updateSelectedBlock((item) => ({ ...item, layout: { ...item.layout, [key]: value } }))}
                    />
                  </div>
                  <div className="mt-4">
                    <Field label="Corner radius">
                      <Input type="number" min="0" value={block.layout.radius} onChange={(event) => updateSelectedBlock((item) => ({ ...item, layout: { ...item.layout, radius: Number(event.target.value) } }))} />
                    </Field>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function createPreviewSurfaceStyle(brand: BuilderBrand): CSSProperties {
  const highlight = mixHex(brand.surface, "#ffffff", 0.16);
  return {
    backgroundColor: brand.surface,
    backgroundImage: brand.backgroundImage
      ? `linear-gradient(180deg, ${brand.surface}f2, ${highlight}e4), url(${brand.backgroundImage})`
      : undefined,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    color: brand.textColor,
    fontFamily: brand.fontFamily,
  };
}

function createPreviewHeroStyle(brand: BuilderBrand): CSSProperties {
  return {
    backgroundColor: brand.secondary,
    backgroundImage: brand.heroImage
      ? `linear-gradient(145deg, ${brand.secondary}de, ${brand.primary}c8), url(${brand.heroImage})`
      : `linear-gradient(145deg, ${brand.secondary}, ${brand.primary})`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    boxShadow: `0 20px 48px -30px ${brand.secondary}`,
  };
}

function parseInlineStyle(value: string): CSSProperties {
  if (typeof document === "undefined") {
    return {};
  }

  const probe = document.createElement("div");
  probe.style.cssText = value;

  return Array.from(probe.style).reduce<Record<string, string>>((styleMap, property) => {
    const cssValue = probe.style.getPropertyValue(property).trim();
    if (!cssValue) {
      return styleMap;
    }

    const reactProperty = property.startsWith("--")
      ? property
      : property.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());

    styleMap[reactProperty] = cssValue;
    return styleMap;
  }, {}) as CSSProperties;
}

function createFlowLayoutStyle(layout: BuilderBlockLayout, fallback: CSSProperties = {}) {
  if (layout.display === "block") {
    return fallback;
  }

  const next: CSSProperties = {
    ...fallback,
    display: layout.display,
    gap: `${layout.gap}px`,
    alignItems: layout.align,
    justifyContent: layout.justify,
  };

  if (layout.display === "flex") {
    next.flexDirection = layout.direction;
  }

  if (layout.display === "grid") {
    next.gridTemplateColumns = `repeat(${Math.max(1, layout.columns)}, minmax(0, 1fr))`;
  }

  return next;
}

function renderHtmlBlock(block: BuilderBlock, shellProps: { id?: string; className?: string; style: CSSProperties }, app: BuilderAppModel) {
  const tag = sanitizeHtmlTag(block.htmlTag);
  const parsedProps = normalizeHtmlElementProps(parseHtmlAttributes(block.htmlAttributes));
  const elementProps: Record<string, unknown> = {
    ...parsedProps,
    className: cn("max-w-full", typeof parsedProps.className === "string" ? parsedProps.className : undefined),
  };

  if (tag === "img" && !elementProps.src) {
    elementProps.src = app.brand.logoImage || `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${app.brand.surface}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${app.brand.secondary}" font-family="Arial, sans-serif" font-size="28">Image element</text></svg>`)}`;
    elementProps.alt = typeof elementProps.alt === "string" ? elementProps.alt : `${app.brand.appName} asset`;
  }

  if ((tag === "video" || tag === "audio") && elementProps.controls === undefined) {
    elementProps.controls = true;
  }

  if (tag === "input" && !elementProps.type) {
    elementProps.type = "text";
  }

  const items = (block.items ?? []).filter(Boolean);
  let children: ReactNode = block.text;

  if (tag === "ul" || tag === "ol") {
    children = items.length > 0
      ? items.map((item) => createElement("li", { key: item }, item))
      : createElement("li", { key: "default-item" }, block.text || "List item");
  } else if (tag === "menu") {
    children = (items.length > 0 ? items : [block.text || "Menu item"]).map((item) =>
      createElement("li", { key: item }, item),
    );
  } else if (tag === "dl") {
    const definitions = items.length > 0 ? items : [block.text || "Definition"];
    children = definitions.flatMap((item, index) => ([
      createElement("dt", { key: `term-${index}`, className: "font-semibold" }, index === 0 ? block.text || "Term" : `Term ${index + 1}`),
      createElement("dd", { key: `definition-${index}`, className: "mb-2" }, item),
    ]));
  } else if (tag === "select" || tag === "datalist") {
    const options = items.length > 0 ? items : [block.text || "Option"];
    children = options.map((item) => createElement("option", { key: item, value: item }, item));
  } else if (tag === "optgroup") {
    const options = items.length > 0 ? items : [block.text || "Option"];
    children = options.map((item) => createElement("option", { key: item, value: item }, item));
  } else if (tag === "details") {
    children = [
      createElement("summary", { key: "summary" }, block.text || "Details"),
      createElement("div", { key: "content" }, block.helper || "Expandable content"),
    ];
  } else if (VOID_HTML_TAGS.has(tag)) {
    children = undefined;
  }

  if (!elementProps.style && (tag === "img" || tag === "video" || tag === "iframe" || tag === "canvas")) {
    elementProps.style = { width: "100%", maxWidth: "100%" };
  }

  return <div {...shellProps}>{createElement(tag, elementProps, children)}</div>;
}

function renderBlock(block: BuilderBlock, app: BuilderAppModel, selected: boolean) {
  const shellStyle = createBlockShellStyle(block, app, selected);
  const shellProps = {
    id: block.attributes.elementId || undefined,
    className: cn("transition-all", block.attributes.className),
    style: shellStyle,
  };
  const secondaryText = mixHex(app.brand.textColor, app.brand.cardBackground, 0.45);
  const lightPanel = mixHex(app.brand.secondary, app.brand.cardBackground, 0.88);
  const borderTone = mixHex(app.brand.secondary, app.brand.cardBackground, 0.78);
  const primaryForeground = getContrastTextColor(app.brand.primary, app.brand.textColor, "#ffffff");
  const accentForeground = getContrastTextColor(app.brand.accent, app.brand.textColor, "#ffffff");
  const chipLayoutStyle = createFlowLayoutStyle(block.layout, {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "8px",
  });
  const stackLayoutStyle = createFlowLayoutStyle(block.layout, {
    display: "grid",
    gap: "8px",
  });
  const cardContentLayoutStyle = createFlowLayoutStyle(block.layout, {
    display: "grid",
    gap: "12px",
  });
  switch (block.type) {
    case "heading":
      return <div {...shellProps}><h1 className="text-xl font-black tracking-tight">{block.text}</h1></div>;
    case "text":
      return <div {...shellProps}><p className="text-xs leading-5" style={{ color: secondaryText }}>{block.text}</p></div>;
    case "button":
      return <div {...shellProps}><button className="w-full rounded-2xl px-3 py-2 text-sm font-bold" style={{ backgroundColor: app.brand.primary, color: primaryForeground }}>{block.text}</button></div>;
    case "html":
      return renderHtmlBlock(block, shellProps, app);
    case "quicklinks":
      return <div {...shellProps}><div style={chipLayoutStyle}>{(block.items ?? []).map((item) => <div key={item} className="rounded-2xl border p-3 text-xs font-bold" style={{ borderColor: borderTone, backgroundColor: mixHex(app.brand.cardBackground, "#ffffff", 0.1) }}>{item}</div>)}</div></div>;
    case "receiptscan":
      return <div {...shellProps}><div style={cardContentLayoutStyle}><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-black">{block.text}</div><div className="mt-1 text-[11px]" style={{ color: secondaryText }}>{block.helper}</div></div><ScanLine className="h-5 w-5" style={{ color: app.brand.primary }} /></div><div className="text-xs font-bold">+{block.points} pts</div></div></div>;
    case "qrcode":
      return <div {...shellProps}><div style={cardContentLayoutStyle}><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-black">{block.text}</div><div className="mt-1 text-[11px]" style={{ color: secondaryText }}>{block.helper}</div></div><QrCode className="h-5 w-5" style={{ color: app.brand.primary }} /></div></div></div>;
    case "rewardcatalog":
      return <div {...shellProps}><div className="mb-2 text-sm font-black">{block.text}</div><div style={stackLayoutStyle}>{(block.items ?? []).map((item) => <div key={item} className="rounded-xl px-3 py-2 text-xs font-semibold" style={{ backgroundColor: lightPanel }}>{item}</div>)}</div></div>;
    case "wallet":
      return <div {...shellProps}><div className="mb-2 text-sm font-black">{block.text}</div><div style={stackLayoutStyle}>{(block.items ?? []).map((item) => <div key={item} className="rounded-xl px-3 py-2 text-xs font-semibold" style={{ backgroundColor: app.brand.primary, color: primaryForeground }}>{item}</div>)}</div></div>;
    case "profile":
      return <div {...shellProps}><div className="mb-2 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: app.brand.accent, color: accentForeground }}><UserRound className="h-5 w-5" /></div><div className="text-sm font-black">{block.text}</div></div><div style={stackLayoutStyle}>{(block.items ?? []).map((item) => <div key={item} className="rounded-xl px-3 py-2 text-xs font-semibold" style={{ backgroundColor: lightPanel }}>{item}</div>)}</div></div>;
    case "auth":
      return <div {...shellProps}><div className="rounded-2xl p-4 text-white" style={{ ...cardContentLayoutStyle, background: `linear-gradient(145deg, ${app.brand.primary}, ${app.brand.secondary})` }}><div className="text-lg font-black">{block.text}</div><div className="text-[11px] text-white/75">{block.helper}</div></div></div>;
    default:
      return null;
  }
}

function createBlockShellStyle(block: BuilderBlock, app: BuilderAppModel, selected: boolean) {
  const parsedStyle = parseInlineStyle(block.attributes.style);
  return {
    backgroundColor: app.brand.cardBackground,
    color: getContrastTextColor(app.brand.cardBackground, app.brand.textColor, "#ffffff"),
    marginTop: `${block.layout.marginTop}px`,
    marginRight: `${block.layout.marginRight}px`,
    marginBottom: `${block.layout.marginBottom}px`,
    marginLeft: `${block.layout.marginLeft}px`,
    paddingTop: `${block.layout.paddingTop}px`,
    paddingRight: `${block.layout.paddingRight}px`,
    paddingBottom: `${block.layout.paddingBottom}px`,
    paddingLeft: `${block.layout.paddingLeft}px`,
    borderRadius: `${block.layout.radius}px`,
    ...createFlowLayoutStyle(block.layout),
    boxShadow: selected
      ? `0 0 0 2px ${app.brand.primary}, 0 18px 38px -28px ${app.brand.secondary}`
      : `0 12px 30px -28px ${app.brand.secondary}`,
    ...parsedStyle,
  } satisfies CSSProperties;
}
