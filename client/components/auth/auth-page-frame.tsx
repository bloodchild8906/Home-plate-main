import type { LoginBuilderBlockId, LoginBuilderConfig } from "@shared/api";
import { cn } from "@/lib/utils";
import type { SiteBrand } from "@/lib/branding";
import type { ReactNode } from "react";

type AuthPageFrameProps = {
  brand: SiteBrand;
  builder: LoginBuilderConfig;
  renderBlock: (blockId: LoginBuilderBlockId) => ReactNode;
};

export function AuthPageFrame({ brand, builder, renderBlock }: AuthPageFrameProps) {
  const isSplit = builder.layout === "split";

  return (
    <div
      className="min-h-screen px-4 py-10 text-white"
      style={{
        backgroundImage: `radial-gradient(circle at top left, hsl(var(--accent) / 0.22), transparent 28%), radial-gradient(circle at bottom right, hsl(var(--primary) / 0.24), transparent 32%), linear-gradient(145deg, ${brand.secondary}, ${brand.secondary} 52%, ${brand.primary})`,
      }}
    >
      <div
        className={cn(
          "mx-auto min-h-[calc(100vh-5rem)] max-w-7xl",
          isSplit ? "lg:grid lg:gap-8" : "grid max-w-5xl gap-6",
        )}
        style={
          isSplit
            ? { gridTemplateColumns: `${builder.heroWidth}% minmax(0, 1fr)` }
            : undefined
        }
      >
        <section
          className={cn(
            "border border-white/10 p-8 shadow-2xl backdrop-blur-xl sm:p-10",
            isSplit ? "flex flex-col justify-between" : "order-2",
          )}
          style={{
            borderRadius: `${builder.cardRadius}px`,
            backgroundColor: `rgb(255 255 255 / ${builder.heroPanelOpacity}%)`,
          }}
        >
          <div className="space-y-6">{builder.leftBlocks.map((blockId) => (
            <div key={`auth-left-${blockId}`}>{renderBlock(blockId)}</div>
          ))}</div>
        </section>

        <section className={cn("flex items-center", isSplit ? "" : "order-1")}>
          <div
            className="w-full overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl"
            style={{
              borderRadius: `${builder.cardRadius}px`,
              backgroundColor: `rgb(2 6 23 / ${builder.authPanelOpacity}%)`,
            }}
          >
            <div className="space-y-6 p-6 sm:p-8">{builder.rightBlocks.map((blockId) => (
              <div key={`auth-right-${blockId}`}>{renderBlock(blockId)}</div>
            ))}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
