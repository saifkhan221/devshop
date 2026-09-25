# Migrating the current DevShop theme

The live app uses a dark indigo ground (`#0d0720`) with a violet accent (`#7c3aed`). This system moves the ground to neutral charcoal and the primary action to peach; violet stays as the secondary. Do it in this order so the app never half-changes.

## Step 1 — Ground and text (one PR)

Find-and-replace in `.vue` and `.scss`:

| Old | New |
| --- | --- |
| `#0d0720`, `bg-[#0d0720]`, `bg-gray-950` | `bg-bg-0` (`--bg-000`) |
| card backgrounds (`#150c2e`, `bg-gray-900`, `bg-white/5`) | `bg-bg-100 border border-line shadow-card` |
| input backgrounds (`bg-gray-800`, `bg-white/10`) | `bg-bg-200 border border-line-strong` |
| `text-white` | `text-ink` |
| `text-gray-400`, `text-gray-300`, `text-white/60` | `text-ink-muted` |
| `text-gray-500`, `placeholder-gray-500` | `text-ink-faint` |
| `border-gray-800`, `border-white/10` | `border-line` |
| `divide-gray-800` | `divide-line-soft` |

Ship it. The app will look grey with violet accents; that is the intended intermediate state.

## Step 2 — Primary action to peach (one PR)

| Old | New |
| --- | --- |
| `bg-[#7c3aed]`, `bg-violet-600` on **buttons** | `ds-btn ds-btn-primary` |
| `text-violet-400` on **links and active nav** | `text-peach-text` |
| `bg-violet-600` on **toggles, progress, active tab underline** | `bg-peach` |
| `ring-violet-500`, `focus:ring-*` | delete; `bundle.css` provides `:focus-visible` |
| `hover:bg-violet-500` | delete; the `ds-btn` handles hover |

Rule of thumb: if the violet meant "do this" or "you are here", it becomes peach. If it meant "this is a category / this is a chart series", it stays violet — via `bg-violet`, `text-violet-text`, `bg-violet-soft`, never the old hex.

## Step 3 — Components

Replace hand-rolled markup one component at a time, most-used first: Button → Input → Card → Sidebar → Badge → Table → Modal. Each swap is a small PR that deletes the old SCSS for that component. Keep Vuex state and props unchanged; only the template's classes change.

## Step 4 — Typography

Add the Google Fonts link to `index.html`, set `font-sans` on `<body>`, and replace `font-bold text-2xl` style stacks with the named styles (`ds-display-md`, `text-display-md`). Remove any `tracking-*` utility that is not on an overline.

## Step 5 — Remove the old palette

Delete the old colours from `tailwind.config.js` (replacing `theme.colors` as in the Tailwind section makes leftovers fail the build) and grep for `#7c3aed`, `#0d0720`, `violet-`, `gray-`, `indigo-`. Zero hits means done.

## What not to change

- Firebase auth screens keep their flow; only classes change.
- The dummy-auth banner (env-var mode) becomes a `ds-badge ds-badge-warning` in the topbar.
- Tool pages (SVG viewer, JSON formatter, regex tester…) keep their layout; their output panes become `ds-code`.
