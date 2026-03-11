import { cn } from "@/lib/utils";
import { getContrastTextColor, mixHex, normalizeHex } from "@/lib/color-utils";

type BrandMarkProps = {
  image?: string;
  text: string;
  label: string;
  primary: string;
  accent?: string;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
};

export function BrandMark({
  image,
  text,
  label,
  primary,
  accent,
  className,
  imageClassName,
  textClassName,
}: BrandMarkProps) {
  const base = normalizeHex(primary);
  const highlight = normalizeHex(accent ?? mixHex(base, "#ffffff", 0.18));
  const fallbackTextColor = getContrastTextColor(highlight);

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-2xl shadow-lg",
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${base}, ${highlight})` }}
    >
      {image ? (
        <img
          src={image}
          alt={label}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      ) : (
        <span
          className={cn("text-sm font-black uppercase tracking-[0.18em]", textClassName)}
          style={{ color: fallbackTextColor }}
        >
          {text}
        </span>
      )}
    </div>
  );
}
