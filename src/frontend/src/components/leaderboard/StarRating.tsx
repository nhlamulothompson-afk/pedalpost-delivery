import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StarRating({
  value,
  max = 5,
  size = "sm",
  showValue = true,
  className = "",
}: StarRatingProps) {
  const rounded = Math.round(value * 2) / 2; // round to nearest 0.5

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: max }, (_, i) => {
        const pos = i + 1;
        const filled = pos <= rounded;
        const half = !filled && i + 0.5 === rounded;
        return (
          <Star
            key={`star-pos-${pos}`}
            className={`${SIZE_MAP[size]} flex-shrink-0 ${
              filled
                ? "text-amber-400 fill-amber-400"
                : half
                  ? "text-amber-400 fill-amber-200"
                  : "text-muted-foreground/30"
            }`}
          />
        );
      })}
      {showValue && (
        <span className="ml-1 text-xs text-muted-foreground tabular-nums">
          {value > 0 ? value.toFixed(1) : "—"}
        </span>
      )}
    </div>
  );
}
