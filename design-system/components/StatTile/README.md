# StatTile

StatTile — a metric with its label and delta, inside a Card.

**Consumer provides:** the `overline` label, the formatted value (already localised, `compact` above 10k), the delta with its direction, and optionally a 36px icon well or a sparkline.

- Value is `display-lg` (`ds-stat-value`) in `ink`; the delta is `ds-stat-delta-up` (`success-text`) or `-down` (`danger-text`) and always carries the arrow glyph, not colour alone.
- Four tiles across on desktop, two on tablet. Use the same number format across a row.
- `ds-stat-hero` inside `ds-card-hero` inherits the `on-peach` colour.
