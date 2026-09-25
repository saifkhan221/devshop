DevShop is a developer productivity workspace: a dark, dense, calm dashboard where the accent colour only shows up where something matters. The look is warm charcoal surfaces, one peach primary, violet as a second voice for data and categories, and generous rounded corners on everything that is not a circle.

Three rules govern every screen:

1. **Dark first, calm by default.** Surfaces are stacked greys (`bg-000` → `bg-300`), separated by `line` borders, not shadows. Colour is reserved for the one action, the one state, the one number that matters.
2. **Peach acts, violet describes.** `peach` is the primary action and the "you are here" signal. `violet` is for categories, second chart series and feature panels. Never two peach buttons in one view; never a violet primary button.
3. **Numbers are the hero.** Metrics set in `display-lg` / `display-xl` with `ink`, their label in `overline` `ink-muted`, their delta in a status colour. Everything else steps back.

## Content fundamentals

- Sentence case everywhere: buttons, headings, nav, table headers. Only `overline` labels are uppercase (the style does it; type them in sentence case).
- Buttons start with a verb: "Create project", "Copy JSON", "Run regex". Never "OK" / "Submit".
- Speak to one developer as "you"; DevShop is "we" only in release notes. No exclamation marks in UI copy.
- Numbers use `numeric` (tabular figures). Thousands get a comma; units get a space: `1,024 ms`, `3.2 MB`. Deltas carry a sign and an arrow glyph: `▲ 12%`, `▼ 3%`.
- Timestamps are relative under 24 h ("4 min ago"), absolute after ("24 Sep, 14:05").
- Empty states say what the space is for and give one `peach` action: "No snippets yet. Save your first one from any tool."
- No emoji in product UI. Emoji are fine in toasts triggered by the user's own celebration actions (none exist today).
- Errors name the fix, not the fault: "Regex has an unclosed group at position 12", not "Invalid input".

## Colour

Tokens are semantic, not literal; a component never references a hex value. Dark is the first (default) theme; `light` is a faithful mirror for docs and screenshots and the theme toggle.

**Surfaces.** The page is `bg-000`. Every card, the sidebar and the topbar are `bg-100` with a 1px `line` border and `shadow-card`. Inside a card, inputs and table headers use `bg-200`; the selected or pressed thing uses `bg-300`. Never stack more than three levels (`bg-100` card → `bg-200` input → `bg-300` selected). One inverted panel per view may use `bg-cream` with `on-cream` text, for a featured project or a callout.

**Text.** `ink` for content, `ink-muted` for labels and meta, `ink-faint` for placeholders and disabled text. All three meet 4.5:1 on every `bg-*` in both themes. Text on a coloured fill always uses that fill's `on-*` token: `on-peach`, `on-violet`, `on-danger`, `on-cream` — never literal white or black.

**Peach (primary).** `peach` fills the primary button, the active toggle track, progress fills, the selected day, the ring stroke and the "active" dot in the sidebar. `peach-strong` is its hover. As text or an icon on a surface, use `peach-text` (a lighter peach in dark, a burnt orange in light — never the fill colour, which fails as text in light). `peach-soft` is the tint for a peach chip or a highlighted row, with `peach-text` on it.

**Violet (secondary).** Same trio: `violet` / `violet-strong` / `violet-soft` / `violet-text` / `on-violet`. Use it for category tags, the second series in every chart, and at most one feature card per view. Violet never sits on the same control as peach.

**Status.** `success`, `warning`, `danger`, `info`, each with `-soft` (ground) and `-text` (text/icon) partners. Every status also carries a word or an icon: a green dot alone is not a state. `danger` is a pink-red so it is never confused with peach; `success` is a mint that differs from it in lightness, not only hue.

**Gradients.** The signature "sunset" gradient is `linear-gradient(135deg, gradient-peach-start, gradient-peach-end)`. It appears on hero tiles, the cover and the cover of a feature card — never behind text smaller than 24px, and never on a button. The violet gradient is the same shape and the same rule. No blue-to-purple gradients; no gradient text.

**Data colours.** `data-1` … `data-6` in that order, always. `chart-grid` for gridlines, `chart-track` for the unfilled part of bars and rings. See the Data visualisation section.

**Focus.** Every interactive element shows `focus-ring`: `outline: 2px solid var(--focus-ring); outline-offset: 2px`. The ring sits on the surface, never on the fill, so it is 3:1 everywhere. Never `outline: none` without `:focus-visible` replacing it.

## Typography

One UI family, one mono family, both from Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

- **Manrope** (`font-sans`) for all UI. Weights: 400 body, 500 captions, 600 emphasis and button labels, 700 headings, 800 display numbers.
- **JetBrains Mono** (`font-mono`) for code, IDs, hashes, colour values, kbd keys and tabular numbers.
- Display styles carry negative tracking (`-0.02em` to `-0.03em`); never add tracking to body text. `overline` is the only tracked-out style.
- Page structure: one `display-md` page title, `heading-lg` per section, `heading-md` per card. Never skip from `display-md` to `heading-sm`.
- Metric tiles: `overline` label above, `display-lg` value, `caption` delta beside it.
- Line length in docs and empty states: 60–72 characters (`max-width: 60ch`).

## Spacing and layout

A 4px grid. Component internals use `space-1` – `space-6`; layout uses `space-8` – `space-16`.

- **Shell**: sidebar `sidebar-w` (248px) expanded, `space-16` (64px) collapsed; topbar `space-16` tall; content padded `space-8` with `content-max` (1440px) centred beyond it.
- **Cards** are padded `space-5`; large feature cards and modals `space-6`; compact list cards `space-3`.
- **Grid**: 12 columns, `space-4` gutter. Stat tiles are 3 columns each (four across); charts 6 or 8; tables 12.
- **Rows**: list and table rows are 44px min height with `space-4` horizontal padding; hairline `line-soft` between rows.
- **Density**: a "compact" body class reduces row height to 36px and card padding to `space-4`. Nothing else changes.

## Radius, borders, elevation

- Corners: `radius-sm` (8px) on inputs, buttons, tags, menu items; `radius-md` (12px) on cards and dropdowns; `radius-lg` (16px) on modals, feature cards and the sidebar; `radius-xl` (24px) on gradient hero tiles. `radius-full` only on things that are actually round: avatars, dots, toggles, pill badges, progress bars.
- A child's radius is the parent's minus the padding, never larger than the parent's.
- Borders separate, shadows lift. Cards: `line` + `shadow-card`. Dropdowns and toasts: `shadow-raised`. Modals: `shadow-overlay`. Nothing else casts a shadow.
- Hover on a card that is a link: border to `line-strong`, shadow to `shadow-raised`, no transform.

## Iconography

Line icons, 1.5px stroke, 20px in controls and 16px inline with text, drawn with `currentColor` so they take the text token of their context (`ink-muted` by default, `peach-text` when active). The board's icons are unbranded line glyphs; **Lucide** (lucide-vue-next) is the substituted set — its geometry matches the reference and it ships as Vue components. No filled icon style, no two-tone, no emoji as icons. Icon-only buttons need `aria-label`.

## Motion

- Durations: 120ms for hover and toggle, 200ms for dropdowns and tabs, 280ms for modals and drawers. Easing `cubic-bezier(.2,.8,.2,1)` for entering, `ease-in` 160ms for leaving.
- Progress rings and bars animate their fill over 600ms on first paint, then instantly on update.
- Respect `prefers-reduced-motion: reduce`: drop transforms, keep opacity fades at 80ms.
- No bounce, no parallax, no animated gradients.

## States

Every control has: default, hover, active/pressed, focus-visible, disabled, and for inputs invalid. Hover = one step up the surface stack or the `-strong` fill; pressed = `bg-300`; disabled = `opacity-disabled` with `cursor: not-allowed` and no hover; invalid = `danger-text` border and a `caption` message in `danger-text` below.

## Components

CSS-only classes in `components/bundle.css` under the `ds-` prefix, designed to be dropped into Vue single-file components alongside Tailwind utilities. Each component's README says what the consumer supplies. `components/bundle.js` exposes `window.DevShop` with three small helpers (ring progress, tabs, theme toggle) and has no framework dependency.
