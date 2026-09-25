# ProgressBar

ProgressBar — a linear fill on a `chart-track`.

**Consumer provides:** the percentage as an inline `width`, a `ds-progress-meta` row with the label and the value, and a `role="progressbar"` with `aria-valuenow` on the track.

- Fill is `peach` by default; `-violet` for a second segment ("reserved"), status colours only when the bar itself is a status (quota nearly full = `-warning`).
- `ds-progress-sm` (4px) inside table cells and list rows.
