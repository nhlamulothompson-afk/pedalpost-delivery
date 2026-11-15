import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRateRider } from "../../hooks/useQueries";

interface RiderRatingWidgetProps {
  orderId: string;
  onRated: () => void;
}

export function RiderRatingWidget({
  orderId,
  onRated,
}: RiderRatingWidgetProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [comment, setComment] = useState("");
  const { mutateAsync: rateRider, isPending } = useRateRider();

  const handleSubmit = async () => {
    if (selectedStar === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    try {
      await rateRider({
        orderId,
        rating: BigInt(selectedStar),
        comment: comment.trim() || undefined,
      });
      toast.success("Thanks for your feedback! ⭐");
      onRated();
    } catch {
      toast.error("Could not submit rating. Try again.");
    }
  };

  const activeStar = hoveredStar || selectedStar;

  return (
    <div
      className="flex flex-col gap-4 animate-fade-in-up"
      data-ocid="rider_rating.section"
    >
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">
          Rate your rider
        </p>
        <p className="text-xs text-muted-foreground">
          How was your delivery experience?
        </p>
      </div>

      {/* Star selector */}
      <fieldset
        className="flex items-center gap-1 border-0 p-0 m-0"
        aria-label="Star rating"
        data-ocid="rider_rating.stars"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className="p-1 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setSelectedStar(star)}
            data-ocid={`rider_rating.star.${star}`}
          >
            <Star
              className={`h-7 w-7 transition-colors duration-150 ${
                star <= activeStar
                  ? "fill-[oklch(var(--gold-badge))] text-[oklch(var(--gold-badge))]"
                  : "fill-muted text-muted-foreground"
              }`}
            />
          </button>
        ))}

        {selectedStar > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][selectedStar]}
          </span>
        )}
      </fieldset>

      {/* Optional comment */}
      <Textarea
        placeholder="Leave a comment (optional)…"
        className="text-sm resize-none h-20 bg-muted/30 border-input"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={300}
        data-ocid="rider_rating.comment_textarea"
      />

      <Button
        className="w-full gap-2"
        onClick={handleSubmit}
        disabled={isPending || selectedStar === 0}
        data-ocid="rider_rating.submit_button"
      >
        {isPending ? "Submitting…" : "Submit Rating"}
      </Button>
    </div>
  );
}
