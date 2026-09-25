# ChartCard

ChartCard — a Card whose body is a chart drawn with the `ds-chart` classes.

**Consumer provides:** the SVG (any charting lib that lets you set classes: the built-in `ds-chart .s1/.line/.grid/.axis` classes cover lines, areas, bars, points and labels), a `ds-card-title`, a unit caption, and a `ds-legend` when there is more than one series.

- Series order is `data-1` → `data-6`, always. Gridlines horizontal only, `chart-grid`. Y labels sit above their line, no axis strokes.
- Points appear on hover or on the last value only. Area fill under a line is the series colour at 12%.
- Never a legend for one series; never more than three series on a line chart.
