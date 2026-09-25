# Dashboard layout

The reference board is a grid of dark panels with one or two bright focal points per screen. The layout rules below reproduce that rhythm.

## Shell

```
┌──────────┬───────────────────────────────────────────────┐
│ sidebar  │ topbar (64px, bg-100, line-soft bottom)       │
│ 248px    ├───────────────────────────────────────────────┤
│ bg-100   │ content: padding space-8, max content-max     │
│ line     │   page header (display-md + actions)          │
│ right    │   12-col grid, gutter space-4                 │
│          │                                               │
└──────────┴───────────────────────────────────────────────┘
```

- Sidebar (`ds-sidebar`): brand at top, then nav groups with an `overline` label each, then a pinned footer (user, settings). Collapses to 64px icon rail below 1024px or on toggle; labels become tooltips.
- Topbar (`ds-topbar`): breadcrumb or page context on the left, search in the middle (`ds-input` with a search icon and `⌘K` kbd), notifications and avatar on the right. It is `position: sticky` at `z-sticky`.
- Content: page header (`display-md` title, `body` `ink-muted` description, primary action right-aligned), then the grid.

## Grid recipes

| Region | Columns | Component |
| --- | --- | --- |
| KPI row | 4 × 3 | `StatTile` |
| Main chart | 8 | `ChartCard` |
| Side metric | 4 | `ProgressRing` inside a `Card` |
| Activity | 6 | `Card` with a list |
| Table | 12 | `Table` inside a `Card` |
| Feature / promo | 4 | `Card` variant `hero` (gradient) or `cream` |

At most one `hero` or `cream` card per screen; they are the focal point the board uses in every panel.

## Breakpoints

- `≥1440` content centred at `content-max`.
- `1024–1439` sidebar expanded, four KPI tiles.
- `768–1023` sidebar collapsed to the rail, KPI tiles two-up, chart full width.
- `<768` sidebar becomes a drawer (`ds-modal` mechanics from the left), topbar keeps only the menu button, title and avatar; every card full width; page padding `space-4`.

## Page header patterns

- Title + description + one primary `ds-btn ds-btn-primary`. Secondary actions go in a `ds-menu` behind an icon button, not a row of buttons.
- Filters live in a `ds-segmented` (2–4 options) or a `ds-select`; never both for the same dimension.
- Time range is always the last control on the right.

## Density and scanning

- Cards hold one idea. A card with a chart and a table is two cards.
- Titles are `heading-md`, left-aligned, with the card's own action (icon button or "View all" quiet button) right-aligned on the same line.
- Every list row has exactly one primary text (`body-strong` `ink`) and one meta line (`caption` `ink-muted`). Extra data goes to a table.
- Reserve `display-*` for numbers; a card with no number has no display text.
