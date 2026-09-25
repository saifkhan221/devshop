# Using the tokens in Vue + Tailwind

The system ships `tokens.css` (generated from `tokens.json`) with every colour, spacing, radius and shadow as a CSS custom property, plus a class per type style. Tailwind is pointed at those variables so utilities and `ds-` classes agree.

## 1. Load the CSS

```
src/
  styles/
    tokens.css        ← copy of project/tokens.css (regenerate on every token change)
    ds-bundle.css     ← copy of project/components/bundle.css
    app.scss          ← your existing entry; import both first
```

```scss
// app.scss
@import './tokens.css';
@import './ds-bundle.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Set the theme on the root element: `<html data-theme="dark">`. Switch to `light` by changing the attribute (`DevShop.setTheme('light')` in `bundle.js` does exactly that and stores the choice in `localStorage`).

## 2. tailwind.config.js

Map Tailwind names to the variables. Colours use `var()` directly, so Tailwind's `/50` opacity modifiers do not apply — use the `-soft` tokens for tints instead.

```js
// tailwind.config.js
const v = (name) => `var(--${name})`;

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: { 0: v('bg-000'), 100: v('bg-100'), 200: v('bg-200'), 300: v('bg-300'), cream: v('bg-cream') },
      line: { DEFAULT: v('line'), soft: v('line-soft'), strong: v('line-strong') },
      ink: { DEFAULT: v('ink'), muted: v('ink-muted'), faint: v('ink-faint'), inverse: v('ink-inverse') },
      peach: { DEFAULT: v('peach'), strong: v('peach-strong'), soft: v('peach-soft'), text: v('peach-text') },
      violet: { DEFAULT: v('violet'), strong: v('violet-strong'), soft: v('violet-soft'), text: v('violet-text') },
      on: { peach: v('on-peach'), violet: v('on-violet'), danger: v('on-danger'), cream: v('on-cream') },
      success: { DEFAULT: v('success'), soft: v('success-soft'), text: v('success-text') },
      warning: { DEFAULT: v('warning'), soft: v('warning-soft'), text: v('warning-text') },
      danger:  { DEFAULT: v('danger'),  soft: v('danger-soft'),  text: v('danger-text') },
      info:    { DEFAULT: v('info'),    soft: v('info-soft'),    text: v('info-text') },
      data: { 1: v('data-1'), 2: v('data-2'), 3: v('data-3'), 4: v('data-4'), 5: v('data-5'), 6: v('data-6') },
      chart: { grid: v('chart-grid'), track: v('chart-track') },
      focus: v('focus-ring'),
      overlay: v('overlay'),
    },
    spacing: {
      0: '0', px: '1px',
      1: v('space-1'), 2: v('space-2'), 3: v('space-3'), 4: v('space-4'), 5: v('space-5'),
      6: v('space-6'), 8: v('space-8'), 10: v('space-10'), 12: v('space-12'), 16: v('space-16'),
      sidebar: v('sidebar-w'),
    },
    borderRadius: {
      none: '0', xs: v('radius-xs'), sm: v('radius-sm'), DEFAULT: v('radius-sm'),
      md: v('radius-md'), lg: v('radius-lg'), xl: v('radius-xl'), full: v('radius-full'),
    },
    boxShadow: {
      none: 'none', card: v('shadow-card'), raised: v('shadow-raised'),
      overlay: v('shadow-overlay'), glow: v('shadow-glow-peach'),
    },
    fontFamily: { sans: 'var(--font-sans)', mono: 'var(--font-mono)' },
    fontSize: {
      // name: [size, { lineHeight, fontWeight, letterSpacing }] — mirrors tokens.json type styles
      'display-xl': ['56px', { lineHeight: '60px', fontWeight: '800', letterSpacing: '-0.03em' }],
      'display-lg': ['40px', { lineHeight: '44px', fontWeight: '800', letterSpacing: '-0.025em' }],
      'display-md': ['28px', { lineHeight: '34px', fontWeight: '700', letterSpacing: '-0.02em' }],
      'heading-lg': ['20px', { lineHeight: '28px', fontWeight: '700', letterSpacing: '-0.01em' }],
      'heading-md': ['16px', { lineHeight: '24px', fontWeight: '700' }],
      'heading-sm': ['14px', { lineHeight: '20px', fontWeight: '700' }],
      'body-lg':    ['16px', { lineHeight: '26px' }],
      body:         ['14px', { lineHeight: '22px' }],
      caption:      ['12px', { lineHeight: '18px', fontWeight: '500' }],
      overline:     ['11px', { lineHeight: '16px', fontWeight: '700', letterSpacing: '0.08em' }],
      code:         ['13px', { lineHeight: '20px' }],
      'code-sm':    ['12px', { lineHeight: '18px', fontWeight: '500' }],
    },
    extend: {
      maxWidth: { content: v('content-max') },
      zIndex: { sticky: v('z-sticky'), dropdown: v('z-dropdown'), overlay: v('z-overlay'), toast: v('z-toast') },
      transitionTimingFunction: { enter: 'cubic-bezier(.2,.8,.2,1)' },
      transitionDuration: { 120: '120ms', 200: '200ms', 280: '280ms' },
    },
  },
  plugins: [],
};
```

Replacing `theme.colors` (not extending) is deliberate: the old indigo palette and Tailwind's defaults stop autocompleting, so nothing new gets built on them.

## 3. Writing a component

Use the `ds-` class for the component's skeleton and Tailwind for layout around it. Do not restyle a `ds-` class with utilities; if a variant is missing, add it to `bundle.css` and to that component's README.

```vue
<template>
  <article class="ds-card p-5">
    <p class="ds-overline text-ink-muted">This week</p>
    <div class="flex items-end gap-2 mt-1">
      <span class="ds-display-lg text-ink">{{ value }}</span>
      <span class="ds-caption text-success-text">▲ {{ delta }}%</span>
    </div>
  </article>
</template>
```

Type styles exist as both a generated class (`.display-lg`, from `tokens.css`) and a Tailwind size (`text-display-lg`). Pick one per project and stay with it; the `ds-` previews use the generated classes.

## 4. Keep it in sync

- Tokens change only in `tokens.json` here; then copy the regenerated `tokens.css` into `src/styles/`. Never hand-edit `tokens.css`.
- Add a component: write it in `bundle.css` under `ds-<name>`, add `components/<Name>/README.md` and `preview.html`, then copy `bundle.css` over.
- Commit the two CSS files with the change that needed them so a diff shows the design change beside the code change.
