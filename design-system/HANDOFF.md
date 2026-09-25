# DevShop design system — handoff for Claude Code

This folder is the source of truth for DevShop's look. Read in this order:

1. `README.md` — the brand book: the three rules, colour, type, spacing, radius, states, icons.
2. `guidelines/10-tailwind-and-vue.md` — how tokens.css + bundle.css plug into Vite/Tailwind, and the full `tailwind.config.js` to use.
3. `guidelines/40-migrating-from-indigo.md` — the ordered migration off the current indigo/violet theme. Follow it step by step, one PR per step.
4. `guidelines/20-dashboard-layout.md` and `guidelines/30-data-visualization.md` when touching layout or charts.
5. `components/<Name>/README.md` before using or building any component; `components/<Name>/preview.html` shows the exact markup.

Files to copy into the app:

- `tokens.css`      → `src/styles/tokens.css`   (generated from tokens.json; never hand-edit)
- `components/bundle.css` → `src/styles/ds-bundle.css`
- `components/bundle.js`  → `src/lib/devshop.js` (optional helpers: setTheme/initTheme, setRing, syncSlider, bindTabs)

Hard rules when writing UI:

- Never a raw hex or a Tailwind default colour (`gray-*`, `violet-*`). Only the token names.
- One `ds-btn-primary` per view. Violet is never a button.
- Text on a coloured fill uses its `on-*` token, never `text-white`.
- Every interactive element keeps the `:focus-visible` ring from bundle.css; never `outline-none` without replacing it.
- Use the `ds-` class for a component's skeleton and Tailwind utilities only for layout around it. A missing variant is added to bundle.css and to the component's README, not patched with utilities.
