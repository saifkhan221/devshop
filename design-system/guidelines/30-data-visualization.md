# Data visualisation

Charts on the board are quiet: thin lines, soft dots at data points, no chart junk, one colour per meaning.

## Colour order

Series take `data-1` → `data-6` in order, never skipping. A single-series chart is always `data-1` (peach). A comparison of "this period vs last" is `data-1` for now and `data-6` (slate) for the baseline, dashed. Status charts (pass/fail) use `success` and `danger`, and always label them.

Fills under a line: the series colour at 12% alpha to transparent, top to bottom. Nothing else fades.

## Marks

- **Line**: 2px, `stroke-linejoin: round`, `stroke-linecap: round`, monotone curve. Data points are 4px discs in the series colour with a 2px `bg-100` ring, shown on hover or at the last point only.
- **Bar**: `radius-xs` on the top corners, gap ≥ 40% of bar width, `chart-track` behind bars when showing a quota.
- **Progress bar** (`ds-progress`): 8px tall, `radius-full`, `chart-track` track, `peach` fill. Second colour only for a segmented "used / reserved" bar (`violet`).
- **Ring** (`ds-ring`): 8px stroke, `chart-track` track, series colour stroke, round caps, value in `display-lg` centred, label in `caption` `ink-muted` under it.
- **Sparkline**: 1.5px line, no axes, no points, `data-1`; delta beside it in `success-text` / `danger-text`.

## Axes and grid

- Gridlines `chart-grid`, 1px, horizontal only. No vertical gridlines; no chart border.
- Axis labels `caption` in `ink-muted`; at most 6 on the x-axis, 4 on the y-axis. Y-axis labels sit above their gridline, left-aligned, so no space is spent on a gutter.
- No axis lines. The bottom gridline doubles as the baseline.

## Tooltips and legend

- Tooltip is `ds-tooltip`: `ink` background, `ink-inverse` text, `caption` size, the value in `numeric`. One tooltip for all series at the hovered x.
- Legend only when there are two or more series; inline, top-right of the card, 8px swatch discs, `caption` labels. Clicking a legend item toggles the series.

## Numbers

- Format with `Intl.NumberFormat('en-IN')` for counts, `compact` notation above 10,000 (`12.4k`), one decimal max.
- Percentages have no space before `%`; durations use `ms`, `s`, `min`.
- A metric's delta is always relative to the previous equal period and says so in its tooltip.

## Do / don't

- Do give every chart a `heading-md` title and, when the metric is not obvious, a `caption` unit line.
- Don't use a pie chart for more than three slices; use a horizontal bar list.
- Don't colour by hue alone: `data-1`, `data-2`, `data-3` are also ordered by lightness so they separate in greyscale.
- Don't animate a chart on every data tick; animate on mount only.
