import { BrandMark } from "@/components/brand-mark";
import { useBranding } from "@/lib/branding";
import { getContrastTextColor, mixHex } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

export function SplashScreen({
  message,
  fullScreen = true,
  className,
}: {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}) {
  const { brand } = useBranding();
  const surface = brand.splashBackgroundColor;
  const textColor = getContrastTextColor(surface);
  const secondaryText = mixHex(textColor, surface, 0.5);
  const panelBackground =
    textColor === "#0f172a" ? "rgba(255,255,255,0.82)" : "rgba(15,23,42,0.5)";

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center overflow-hidden px-4 py-8",
        fullScreen ? "min-h-screen" : "min-h-[320px]",
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(circle at top left, ${brand.accent}55, transparent 36%), linear-gradient(150deg, ${surface}, ${mixHex(brand.secondary, "#020617", 0.35)})`,
      }}
    >
      <div
        className="w-full max-w-md rounded-[2rem] border px-8 py-10 text-center shadow-2xl backdrop-blur-xl"
        style={{
          borderColor: mixHex(surface, textColor, 0.35),
          backgroundColor: panelBackground,
          color: textColor,
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <BrandMark
            image={brand.logoImage}
            text={brand.logo}
            label={`${brand.name} logo`}
            primary={brand.primary}
            accent={brand.accent}
            className="h-16 w-16 shadow-lg"
            imageClassName="object-contain bg-white p-2"
          />
          <div className="text-2xl font-black tracking-tight">
            {brand.splashTitle || `${brand.name} Workspace`}
          </div>
          <p className="text-sm" style={{ color: secondaryText }}>
            {message || brand.splashSubtitle}
          </p>
          <WhitelabelSpinner />
        </div>
      </div>
    </div>
  );
}

function WhitelabelSpinner() {
  const { brand } = useBranding();
  const baseColor = brand.splashSpinnerColor;
  const accentColor = brand.splashSpinnerAccent;

  if (brand.splashSpinnerStyle === "dots") {
    return (
      <div className="mt-1 flex items-center gap-1.5" aria-label="Loading">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-2.5 w-2.5 animate-bounce rounded-full"
            style={{
              backgroundColor: dot === 1 ? accentColor : baseColor,
              animationDelay: `${dot * 120}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  if (brand.splashSpinnerStyle === "pulse") {
    return (
      <div className="relative mt-1 h-11 w-11" aria-label="Loading">
        <span
          className="absolute inset-0 animate-ping rounded-full opacity-65"
          style={{ backgroundColor: baseColor }}
        />
        <span
          className="absolute inset-2 animate-ping rounded-full opacity-85"
          style={{ backgroundColor: accentColor, animationDelay: "160ms" }}
        />
      </div>
    );
  }

  if (brand.splashSpinnerStyle === "bars") {
    return (
      <div className="mt-1 flex h-10 items-end gap-1" aria-label="Loading">
        {[0, 1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className="w-1.5 animate-pulse rounded-sm"
            style={{
              height: `${12 + bar * 4}px`,
              backgroundColor: bar % 2 === 0 ? baseColor : accentColor,
              animationDelay: `${bar * 110}ms`,
              animationDuration: "900ms",
            }}
          />
        ))}
      </div>
    );
  }

  if (brand.splashSpinnerStyle === "dual-ring") {
    return (
      <div className="relative mt-1 h-11 w-11" aria-label="Loading">
        <span
          className="absolute inset-0 animate-spin rounded-full border-2"
          style={{
            borderColor: mixHex(baseColor, "#ffffff", 0.6),
            borderTopColor: baseColor,
          }}
        />
        <span
          className="absolute inset-[6px] animate-spin rounded-full border-2"
          style={{
            borderColor: mixHex(accentColor, "#ffffff", 0.6),
            borderTopColor: accentColor,
            animationDirection: "reverse",
            animationDuration: "1.3s",
          }}
        />
      </div>
    );
  }

  if (brand.splashSpinnerStyle === "orbit") {
    return (
      <div className="relative mt-1 h-11 w-11" aria-label="Loading">
        <span
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: mixHex(baseColor, "#ffffff", 0.65) }}
        />
        <span
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: "1.1s" }}
        >
          <span
            className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
        </span>
        <span
          className="absolute inset-[10px] animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.6s" }}
        >
          <span
            className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: baseColor }}
          />
        </span>
      </div>
    );
  }

  return (
    <div
      className="mt-1 h-11 w-11 animate-spin rounded-full border-4"
      style={{
        borderColor: mixHex(baseColor, "#ffffff", 0.45),
        borderTopColor: accentColor,
      }}
      aria-label="Loading"
    />
  );
}
