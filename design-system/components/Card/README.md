# Card

Card — the unit of the dashboard: one idea per card.

**Consumer provides:** a `ds-card-header` with a `ds-card-title` (heading-md) and at most one action on the right, then the body.

- Default: `bg-100`, `line` border, `shadow-card`, `radius-md`, `space-5` padding. `ds-card-compact` (space-3) for list cards; `ds-card-lg` (space-6, radius-lg) for feature and modal-like cards.
- `ds-card-link` when the whole card navigates: hover lifts the border to `line-strong` and the shadow to `shadow-raised`.
- Accent variants, at most ONE per screen: `ds-card-cream` (inverted, `on-cream` text), `ds-card-hero` (peach gradient, `on-peach` text, no text under 24px except the label), `ds-card-violet` (violet gradient; dark theme only for text).
- Never nest a card in a card; use a hairline `line-soft` divider instead.
