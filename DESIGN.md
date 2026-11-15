# Design Brief

## Direction

PedalPost — Eco-friendly, two-sided delivery marketplace celebrating bicycle and electric vehicle delivery for small parcels worldwide, now with viral engagement features: referrals, ratings, leaderboards, photo proof, and analytics.

## Tone

Premium modern tech with a grounded sustainability focus — confident and trustworthy without corporate coldness, inspired by Stripe's clarity and Uber Eats's delivery flow but uniquely eco-conscious. Achievement-driven (leaderboard badges) without gamification excess.

## Differentiation

Bicycle and electric vehicle delivery prominently featured in UI (animated rider icons, vehicle type badges), green accent gradients on CTAs, marketplace cards celebrating eco-impact. Leaderboard badges (gold/silver/bronze) highlight top performers. Photo proof cards with image overlays build trust. Referral social sharing integrates eco-messaging. Operator analytics dashboard provides full visibility into referral funnel, commission trends, and top performers.

## Color Palette

| Token      | OKLCH           | Role                              |
| ---------- | --------------- | --------------------------------- |
| background | 0.98 0.008 160  | Light cool off-white (light)      |
| foreground | 0.16 0.018 160  | Deep forest text (light)          |
| card       | 1.0 0.004 160   | Pure white card surfaces          |
| primary    | 0.46 0.16 160   | Forest green — trust, eco         |
| accent     | 0.68 0.12 170   | Mint-teal — highlights, CTAs      |
| muted      | 0.92 0.01 160   | Light grey — disabled, meta       |
| destructive| 0.55 0.22 25    | Red — cancellations, alerts       |
| success    | 0.62 0.16 140   | Teal-green — referral completed   |
| gold-badge | 0.70 0.23 90    | Gold — rank 1 leaderboard         |
| silver-badge | 0.70 0.10 250 | Silver — rank 2–3 leaderboard    |
| bronze-badge | 0.62 0.18 45  | Bronze — rank 4–10 leaderboard   |

## Typography

- Display: Space Grotesk — bold, modern, tech-forward. Hero, section headings, leaderboard rank numbers.
- Body: DM Sans — clean, readable, UI-focused. Paragraphs, labels, UI text, analytics labels.
- Mono: DM Sans mono — referral codes, promo codes, transaction IDs.
- Scale: Hero `text-5xl md:text-7xl font-bold tracking-tight`, h2 `text-3xl md:text-5xl font-bold`, stats value `text-2xl font-bold tracking-tight`, label `text-sm font-semibold tracking-widest uppercase`.

## Elevation & Depth

Cards elevated with subtle shadows (`shadow-sm`) and medium rounded corners (8–12px). Structural zones use background color shifts and 1px borders for depth. Photo proof cards use image overlays with badge indicators. Leaderboard rank badges sit in top-left of rider cards with animated pulse effect for top 3.

## Structural Zones

| Zone         | Background        | Border         | Notes                                                  |
| ------------ | ----------------- | -------------- | ------------------------------------------------------ |
| Header       | card (white)      | border/bottom  | Navigation, PedalPost logo, user menu                  |
| Content      | background (light) | —              | Delivery cards, referral UI, leaderboard, forms        |
| Analytics    | card (white)      | border         | Dashboard charts, stats cards, top performers sections |
| Photo Proof  | card (white)      | border         | Image overlay with delivered badge, timestamp, photo   |
| Footer       | muted/40 (light)  | border/top     | Trust badges, company links, eco-impact stats          |

## Component Patterns

- Buttons: Filled primary (green bg, white text) for primary actions; outline accent for secondary; filled success for referral rewards. Rounded-lg (8px), no shadows except on hover (subtle lift).
- Badges: Inline pill-shaped (rounded-full) for vehicle type, delivery status, achievement tiers (gold/silver/bronze with matching colors).
- Cards: White bg, rounded-lg, shadow-sm, 1px border-border. Leaderboard cards show rank indicator (top-left, 32px diameter) with animated pulse for rank 1–3. Photo proof cards display delivery image with checkmark overlay.
- Referral Display: Monospace referral code in light muted background, copy button with success state feedback.
- Analytics Stats: Large display font value (`analytics-stat-value`) over compact label (`analytics-stat-label`), organized in responsive grid.

## Motion

- Entrance: Subtle fade-in-up (300ms) for cards on page load, staggered by 50ms per card.
- Achievement: Animated pulse (2s loop) on top 3 leaderboard badges, activates on hover.
- Hover: Primary buttons scale 1.02 with shadow lift. Referral code card lifts on hover (subtle translateY). Social share prompt scales 1.01.
- Success Feedback: Referral code copy button briefly shows green checkmark (300ms transition).

## Constraints

- No gradients except subtle overlay on photo proof cards (image to badge transition) and share prompt background (primary/5 to accent/5).
- Only OKLCH colors via CSS variables — no hex, RGB, or arbitrary colors.
- Bicycle/e-bike icons always visible in rider profiles and order type indicators.
- Leaderboard rank badges display within cards, sized 32px diameter, only animate pulse for top 3 ranks.
- Photo proof card image always displays at 128px height, contained within card bounds.
- Analytics dashboard uses chart token colors (chart-1 through chart-5) for multi-series charts.
- Footer must include trust signals: insurance badge, verified riders, eco-impact stats, referral invite link.

## Signature Detail

Leaderboard rank badges (gold/silver/bronze) with animated pulse effect on top performers — distinctive achievement system that gamifies eco-delivery while maintaining premium feel. Photo proof delivery cards with checkmark overlays provide visual proof of eco-friendly completion. Referral code display with one-click social share integrates viral growth into core UX.

## Accessibility

- Badge animations pulse at 2s interval, well below seizure threshold (3 Hz).
- Photo proof cards include alt text for images, timestamp for accessibility.
- Referral code uses monospace display for copy accessibility.
- All interactive elements maintain 4.5:1 contrast ratio between text and background (OKLCH L difference ≥0.45).


