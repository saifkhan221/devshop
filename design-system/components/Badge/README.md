# Badge

Badge — one or two words of status or category.

**Consumer provides:** the text and, for statuses, a `ds-dot` before it so the meaning survives without colour.

- Neutral (`bg-300`) by default. `ds-badge-peach` = brand highlight ("New", "Pro"); `ds-badge-violet` = category; `-success` / `-warning` / `-danger` / `-info` = states; `ds-badge-solid` (peach fill) only for a count on a nav item.
- Pill by default; `ds-badge-square` beside monospace text in tables.
- A standalone `ds-dot-*` with a `caption` label is the smallest status indicator (online, syncing).
