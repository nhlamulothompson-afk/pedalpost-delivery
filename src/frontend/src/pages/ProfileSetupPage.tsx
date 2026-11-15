import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  Bike,
  CheckCircle,
  ChevronRight,
  Mail,
  Package,
  User,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateUserProfile } from "../hooks/useQueries";
import type { UserRole, VehicleType } from "../types";

const VEHICLE_OPTIONS: {
  id: VehicleType;
  label: string;
  icon: string;
  desc: string;
  badge: string;
}[] = [
  {
    id: "bicycle",
    label: "Bicycle",
    icon: "🚲",
    desc: "Classic pedal power, zero emissions",
    badge: "bg-primary/15 text-primary",
  },
  {
    id: "eBike",
    label: "E-Bike",
    icon: "⚡🚲",
    desc: "Electrically assisted bicycle",
    badge: "bg-accent/15 text-accent-foreground",
  },
  {
    id: "electricWheel",
    label: "Electric Wheel",
    icon: "🛴",
    desc: "Electric scooter / unicycle",
    badge: "bg-secondary text-secondary-foreground",
  },
];

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole>("customer");
  const [displayName, setDisplayName] = useState("");
  const [vehicle, setVehicle] = useState<VehicleType>("bicycle");
  const [email, setEmail] = useState("");

  const { mutateAsync: createProfile, isPending } = useCreateUserProfile();

  if (!identity) {
    return (
      <div
        className="container mx-auto px-4 py-16 max-w-md text-center"
        data-ocid="profile_setup.auth_required"
      >
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-2">
          Sign in required
        </h2>
        <p className="text-muted-foreground text-sm">
          Please sign in to set up your profile.
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Please enter your display name");
      return;
    }
    try {
      await createProfile({
        displayName: displayName.trim(),
        role,
        vehicleType: role === "rider" ? vehicle : undefined,
        email: email.trim() || undefined,
      });
      toast.success("Profile saved! Welcome to PedalPost 🌿");
      navigate({ to: role === "customer" ? "/customer" : "/rider" });
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-primary/5 to-background flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg" data-ocid="profile_setup.page">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${s <= step ? "w-16 bg-primary" : "w-8 bg-border"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <Card data-ocid="profile_setup.role_card">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Bike className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">
                Welcome to PedalPost 🌿
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                How would you like to use PedalPost?
              </p>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  data-ocid="profile_setup.customer_role_button"
                  className={`rounded-xl border-2 p-6 flex flex-col items-center gap-3 transition-all cursor-pointer ${
                    role === "customer"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === "customer" ? "bg-primary/15" : "bg-muted"}`}
                  >
                    <Package
                      className={`h-6 w-6 ${role === "customer" ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-display font-semibold text-foreground text-sm">
                      Customer
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Send parcels worldwide
                    </div>
                  </div>
                  {role === "customer" && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRole("rider")}
                  data-ocid="profile_setup.rider_role_button"
                  className={`rounded-xl border-2 p-6 flex flex-col items-center gap-3 transition-all cursor-pointer ${
                    role === "rider"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === "rider" ? "bg-primary/15" : "bg-muted"}`}
                  >
                    <Bike
                      className={`h-6 w-6 ${role === "rider" ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-display font-semibold text-foreground text-sm">
                      Rider
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Deliver &amp; earn money
                    </div>
                  </div>
                  {role === "rider" && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </button>
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => setStep(2)}
                data-ocid="profile_setup.role_next_button"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card data-ocid="profile_setup.details_card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-primary">
                  {role === "customer" ? "Customer" : "Rider"}
                </Badge>
              </div>
              <CardTitle className="font-display text-2xl">
                Your profile
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Tell us a bit about yourself.
              </p>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  placeholder="e.g. Alex Green"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  data-ocid="profile_setup.display_name_input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="email-address"
                  className="flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email address{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="email-address"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-ocid="profile_setup.email_input"
                />
                <p className="text-xs text-muted-foreground">
                  Receive order status notifications directly to your inbox.
                </p>
              </div>

              {role === "rider" && (
                <div className="flex flex-col gap-3">
                  <Label>Your eco-vehicle</Label>
                  <RadioGroup
                    value={vehicle}
                    onValueChange={(v) => setVehicle(v as VehicleType)}
                    data-ocid="profile_setup.vehicle_type_radio"
                  >
                    {VEHICLE_OPTIONS.map((v) => (
                      <div
                        key={v.id}
                        className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                          vehicle === v.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                        onClick={() => setVehicle(v.id)}
                        onKeyDown={(e) => e.key === "Enter" && setVehicle(v.id)}
                      >
                        <RadioGroupItem value={v.id} id={`vehicle-${v.id}`} />
                        <span className="text-lg">{v.icon}</span>
                        <div className="flex-1">
                          <Label
                            htmlFor={`vehicle-${v.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {v.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {v.desc}
                          </p>
                        </div>
                        {vehicle === v.id && (
                          <Zap className="h-4 w-4 text-primary ml-auto" />
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  data-ocid="profile_setup.back_button"
                >
                  Back
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleSave}
                  disabled={isPending || !displayName.trim()}
                  data-ocid="profile_setup.save_button"
                >
                  {isPending ? "Saving..." : "Create Profile"}
                  {!isPending && <CheckCircle className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
