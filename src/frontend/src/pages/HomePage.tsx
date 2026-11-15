import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  Bike,
  CheckCircle,
  ChevronRight,
  Clock,
  Globe,
  Leaf,
  Package,
  Shield,
  Star,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "Zero Emissions",
    desc: "Bicycles and e-vehicles only — every delivery is carbon-neutral.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Urban deliveries in under 45 minutes. No traffic jams for us.",
  },
  {
    icon: Shield,
    title: "Safe & Insured",
    desc: "All riders are verified and parcels are insured end-to-end.",
  },
  {
    icon: Globe,
    title: "Worldwide Coverage",
    desc: "Operating in 50+ cities across 6 continents and growing.",
  },
];

const stats = [
  { value: "2.4M+", label: "Deliveries Completed" },
  { value: "50+", label: "Cities Worldwide" },
  { value: "98%", label: "On-Time Rate" },
  { value: "4.9★", label: "Average Rating" },
];

const testimonials = [
  {
    name: "Sarah K.",
    city: "London",
    text: "My parcels always arrive on time and I love knowing zero emissions were created.",
    stars: 5,
  },
  {
    name: "Miguel R.",
    city: "São Paulo",
    text: "As a rider, the earnings are excellent and the app makes it so easy to accept jobs.",
    stars: 5,
  },
  {
    name: "Aiko T.",
    city: "Tokyo",
    text: "Finally a delivery service that aligns with my values. Highly recommend PedalPost!",
    stars: 5,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { identity, login, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const handleGetStarted = async () => {
    if (!isAuthenticated) {
      try {
        await login();
      } catch {
        /* ignore */
      }
    } else {
      navigate({ to: "/setup-profile" });
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section
        className="relative bg-gradient-to-br from-primary/5 via-background to-accent/10 overflow-hidden"
        data-ocid="home.hero_section"
      >
        <div className="container mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 max-w-xl">
            <Badge variant="secondary" className="mb-4 gap-1.5 text-primary">
              <Leaf className="h-3 w-3" /> 100% Eco-Friendly Delivery
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
              Fast, Green <span className="text-primary">Deliveries</span>{" "}
              Worldwide
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Send your parcels across the city with zero carbon footprint.
              PedalPost connects you with verified bicycle and e-vehicle riders
              for planet-friendly, lightning-fast delivery.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="font-display font-semibold gap-2"
                onClick={handleGetStarted}
                disabled={loginStatus === "logging-in"}
                data-ocid="home.send_parcel_button"
              >
                <Package className="h-5 w-5" />
                {loginStatus === "logging-in"
                  ? "Signing in..."
                  : "Send a Parcel"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="font-display font-semibold gap-2"
                onClick={() => navigate({ to: "/rider" })}
                data-ocid="home.become_rider_button"
              >
                <Bike className="h-5 w-5" />
                Become a Rider
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              No subscription needed · Pay per delivery
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <img
              src="/assets/generated/pedalpost-hero.dim_1200x600.png"
              alt="PedalPost eco-friendly bicycle delivery"
              className="w-full max-w-lg rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-12" data-ocid="home.stats_section">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl font-bold text-primary-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-primary-foreground/70 text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        className="bg-background py-20"
        data-ocid="home.features_section"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 text-primary gap-1">
              <Leaf className="h-3 w-3" /> Why PedalPost
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Delivery that cares about tomorrow
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We're building the world's most sustainable delivery network — one
              bicycle at a time.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card
                  key={f.title}
                  className="border-border hover:shadow-md transition-shadow"
                  data-ocid={`home.feature.${f.title.toLowerCase().replace(/\s+/g, "_")}_card`}
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-2">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        className="bg-muted/40 py-20"
        data-ocid="home.how_it_works_section"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">
              How it works
            </h2>
            <p className="text-muted-foreground">Simple, fast, green.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                step: "01",
                title: "Place your order",
                desc: "Enter pickup and delivery addresses, describe your parcel, and confirm.",
              },
              {
                step: "02",
                title: "A rider picks it up",
                desc: "A verified eco-rider near you accepts the job and collects your parcel.",
              },
              {
                step: "03",
                title: "Track & receive",
                desc: "Watch your delivery in real-time and receive it within the hour.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center text-center"
                data-ocid={`home.step_${item.step}_card`}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        className="bg-background py-20"
        data-ocid="home.testimonials_section"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">
              Loved by customers & riders
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card
                key={t.name}
                className="border-border"
                data-ocid={`home.testimonial.item.${i + 1}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <Star
                        key={`star-${t.name}-${si}`}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-foreground mb-4 leading-relaxed">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {t.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.city}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16" data-ocid="home.cta_section">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to go green?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of customers and riders making every delivery a small
            act for the planet.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="font-display font-semibold gap-2"
              onClick={handleGetStarted}
              disabled={loginStatus === "logging-in"}
              data-ocid="home.cta_send_button"
            >
              <Package className="h-5 w-5" />
              Send a Parcel
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-display font-semibold gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate({ to: "/rider" })}
              data-ocid="home.cta_rider_button"
            >
              <Bike className="h-5 w-5" />
              Earn as a Rider
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
