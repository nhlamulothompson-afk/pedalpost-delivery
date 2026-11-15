import { cn } from "@/lib/utils";
import { AVATARS } from "@/utils/avatars";

interface AvatarPickerProps {
  selectedAvatarId: string;
  onSelect: (avatarId: string) => void;
}

export default function AvatarPicker({
  selectedAvatarId,
  onSelect,
}: AvatarPickerProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Choose Your Avatar</div>
      <div className="grid grid-cols-4 gap-3">
        {AVATARS.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar.id)}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
              selectedAvatarId === avatar.id
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/50",
            )}
            title={avatar.name}
          >
            <img
              src={avatar.path}
              alt={avatar.name}
              className="w-full h-full object-cover"
            />
            {selectedAvatarId === avatar.id && (
              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg
                    aria-label="Selected"
                    className="w-4 h-4 text-primary-foreground"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    role="img"
                  >
                    <title>Selected</title>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
