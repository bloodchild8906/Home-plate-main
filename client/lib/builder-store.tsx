import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type BuilderBlockType =
  | "heading"
  | "text"
  | "button"
  | "quicklinks"
  | "receiptscan"
  | "qrcode"
  | "rewardcatalog"
  | "wallet"
  | "profile"
  | "auth";

export type BuilderBlock = {
  id: string;
  type: BuilderBlockType;
  name: string;
  text?: string;
  helper?: string;
  items?: string[];
  points?: number;
};

export type BuilderPage = {
  id: string;
  name: string;
  blocks: BuilderBlock[];
};

export type BuilderBrand = {
  appName: string;
  logo: string;
  primary: string;
  accent: string;
  surface: string;
  domain: string;
};

export type BuilderAppModel = {
  id: string;
  name: string;
  published: boolean;
  live: boolean;
  updatedAt: string;
  brand: BuilderBrand;
  pages: BuilderPage[];
};

type BuilderStoreValue = {
  apps: BuilderAppModel[];
  createApp: (mode: "blank" | "template") => string;
  deleteApp: (appId: string) => void;
  duplicateApp: (appId: string) => string | null;
  updateApp: (appId: string, updater: (app: BuilderAppModel) => BuilderAppModel) => void;
};

const STORAGE_KEY = "homeplate_builder_apps";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlock(type: BuilderBlockType): BuilderBlock {
  const blocks: Record<BuilderBlockType, BuilderBlock> = {
    heading: { id: uid("b"), type, name: "Heading", text: "New section" },
    text: { id: uid("b"), type, name: "Text", text: "Supporting copy for this screen." },
    button: { id: uid("b"), type, name: "Button", text: "Primary action" },
    quicklinks: { id: uid("b"), type, name: "Quick Links", items: ["Menu", "Earn", "Redeem", "Profile"] },
    receiptscan: { id: uid("b"), type, name: "Receipt Scan", text: "Scan receipt to earn points", helper: "OCR your printed receipt and add points instantly.", points: 180 },
    qrcode: { id: uid("b"), type, name: "QR Scan", text: "Scan venue QR", helper: "Check in, earn, or redeem with a table QR code.", points: 75 },
    rewardcatalog: { id: uid("b"), type, name: "Redeem Catalog", text: "Spend points on rewards", items: ["250 pts Coffee", "500 pts 10% Off", "800 pts VIP Access"] },
    wallet: { id: uid("b"), type, name: "Payments", text: "Saved payment methods", items: ["Visa •••• 4242", "Apple Pay", "Corporate Card"] },
    profile: { id: uid("b"), type, name: "Profile", text: "Member profile", items: ["Gold tier", "2,450 points", "3 cards on file"] },
    auth: { id: uid("b"), type, name: "Auth Screen", text: "Welcome back", helper: "Sign in to sync payments, points, and rewards." },
  };
  return blocks[type];
}

export function createDefaultPages(): BuilderPage[] {
  return [
    { id: uid("p"), name: "Earn", blocks: [createBlock("heading"), createBlock("quicklinks"), createBlock("receiptscan"), createBlock("qrcode")] },
    { id: uid("p"), name: "Redeem", blocks: [createBlock("heading"), createBlock("rewardcatalog"), createBlock("button")] },
    { id: uid("p"), name: "Payments", blocks: [createBlock("heading"), createBlock("wallet")] },
    { id: uid("p"), name: "Profile", blocks: [createBlock("profile"), createBlock("button")] },
    { id: uid("p"), name: "Auth", blocks: [createBlock("auth")] },
  ];
}

function createDefaultApps(): BuilderAppModel[] {
  return [
    {
      id: uid("a"),
      name: "HomePlate Rewards",
      published: true,
      live: true,
      updatedAt: new Date().toISOString(),
      brand: { appName: "HomePlate Rewards", logo: "HP", primary: "#ea580c", accent: "#f59e0b", surface: "#fff7ed", domain: "rewards.homeplate.app" },
      pages: createDefaultPages(),
    },
    {
      id: uid("a"),
      name: "Bistro Circle",
      published: false,
      live: false,
      updatedAt: new Date().toISOString(),
      brand: { appName: "Bistro Circle", logo: "BC", primary: "#0f766e", accent: "#38bdf8", surface: "#f0fdfa", domain: "circle.bistro.app" },
      pages: createDefaultPages(),
    },
  ];
}

function createBlankPages(): BuilderPage[] {
  return [
    {
      id: uid("p"),
      name: "Home",
      blocks: [createBlock("heading"), createBlock("text"), createBlock("button")],
    },
  ];
}

const BuilderStoreContext = createContext<BuilderStoreValue | undefined>(undefined);

export function BuilderStoreProvider({ children }: PropsWithChildren) {
  const [apps, setApps] = useState<BuilderAppModel[]>(createDefaultApps);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setApps(JSON.parse(raw) as BuilderAppModel[]);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  }, [apps]);

  const value = useMemo<BuilderStoreValue>(
    () => ({
      apps,
      createApp: (mode) => {
        const pages = mode === "template" ? createDefaultPages() : createBlankPages();
        const next: BuilderAppModel = {
          id: uid("a"),
          name: `New App ${apps.length + 1}`,
          published: false,
          live: false,
          updatedAt: new Date().toISOString(),
          brand: {
            appName: `New App ${apps.length + 1}`,
            logo: `A${apps.length + 1}`,
            primary: "#7c3aed",
            accent: "#f97316",
            surface: "#faf5ff",
            domain: `app${apps.length + 1}.brand.app`,
          },
          pages,
        };
        setApps((current) => [...current, next]);
        return next.id;
      },
      deleteApp: (appId) => {
        setApps((current) => current.filter((app) => app.id !== appId));
      },
      duplicateApp: (appId) => {
        const source = apps.find((app) => app.id === appId);
        if (!source) return null;
        const copy: BuilderAppModel = {
          ...source,
          id: uid("a"),
          name: `${source.name} Copy`,
          published: false,
          live: false,
          updatedAt: new Date().toISOString(),
          pages: source.pages.map((page) => ({
            ...page,
            id: uid("p"),
            blocks: page.blocks.map((block) => ({ ...block, id: uid("b") })),
          })),
        };
        setApps((current) => [...current, copy]);
        return copy.id;
      },
      updateApp: (appId, updater) => {
        setApps((current) =>
          current.map((app) =>
            app.id === appId
              ? { ...updater(app), updatedAt: new Date().toISOString() }
              : app,
          ),
        );
      },
    }),
    [apps],
  );

  return <BuilderStoreContext.Provider value={value}>{children}</BuilderStoreContext.Provider>;
}

export function useBuilderStore() {
  const context = useContext(BuilderStoreContext);
  if (!context) {
    throw new Error("useBuilderStore must be used within BuilderStoreProvider");
  }
  return context;
}
