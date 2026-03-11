import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BuilderAppModel } from "@/lib/builder-store";

type BuilderPhonePreviewProps = {
  app: BuilderAppModel;
  pageName: string;
  preset: {
    id: string;
    width: number;
    height: number;
  };
  previewScale: number;
  previewCanvasHeight: number;
  previewSurfaceStyle: CSSProperties;
  previewHeroStyle: CSSProperties;
  scopedPreviewCss: string;
  children: ReactNode;
};

export function BuilderPhonePreview({
  app,
  pageName,
  preset,
  previewScale,
  previewCanvasHeight,
  previewSurfaceStyle,
  previewHeroStyle,
  scopedPreviewCss,
  children,
}: BuilderPhonePreviewProps) {
  return (
    <motion.div
      key={preset.id}
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div style={{ height: previewCanvasHeight }}>
        <div
          className="mx-auto origin-top rounded-[2.75rem] border-[10px] border-[#111827] bg-[#111827] shadow-[0_28px_72px_-36px_rgba(15,23,42,0.85)]"
          style={{
            width: preset.width + 24,
            height: preset.height + 56,
            transform: `scale(${previewScale})`,
            transformOrigin: "top center",
          }}
        >
          <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-white/35" />
          <ScrollArea style={{ height: preset.height }}>
            <div
              data-builder-preview={app.id}
              className="space-y-3 p-3"
              style={previewSurfaceStyle}
            >
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
                    <div className="truncate text-lg font-black tracking-tight">
                      {app.brand.appName}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-white/70">Current page</span>
                  <span className="font-bold">{pageName}</span>
                </div>
              </div>

              {children}
            </div>
          </ScrollArea>
          {scopedPreviewCss ? <style>{scopedPreviewCss}</style> : null}
        </div>
      </div>
    </motion.div>
  );
}
