# ProgressRing

ProgressRing — a circular gauge with the value in the centre.

**Consumer provides:** the 120px SVG (two circles, r=46), the value 0–1 via `--ds-ring-pct` or `DevShop.setRing(el, pct, label)`, and a `ds-ring-label` under the value.

- Stroke is `peach` on a `chart-track`; `-violet` or `-success` when the ring is a second metric on the same card or a completion state.
- `ds-ring-sm` (56px) in table cells, with the value only.
- One ring per card; several rings become a bar list.
