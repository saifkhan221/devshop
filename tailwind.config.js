// Design-system tokens resolve through CSS custom properties (see src/styles/tokens.css).
// Extended (not replaced) during the indigo->peach migration so un-migrated pages keep
// Tailwind's defaults; step 5 will replace theme.colors to drop the old palette.
const v = (name) => `var(--${name})`

export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        brand: {
          950: '#0d0720',
          900: '#160d30',
          800: '#1f1245',
          700: '#2d1a62',
          600: '#4c2c99',
          500: '#7c3aed',
          400: '#a78bfa',
          300: '#c4b5fd',
          200: '#ddd6fe',
        },
        // DS semantic tokens
        bg:     { 0: v('bg-000'), 100: v('bg-100'), 200: v('bg-200'), 300: v('bg-300'), cream: v('bg-cream') },
        line:   { DEFAULT: v('line'), soft: v('line-soft'), strong: v('line-strong') },
        ink:    { DEFAULT: v('ink'), muted: v('ink-muted'), faint: v('ink-faint'), inverse: v('ink-inverse') },
        peach:  { DEFAULT: v('peach'), strong: v('peach-strong'), soft: v('peach-soft'), text: v('peach-text') },
        violet: { DEFAULT: v('violet'), strong: v('violet-strong'), soft: v('violet-soft'), text: v('violet-text') },
        on:     { peach: v('on-peach'), violet: v('on-violet'), danger: v('on-danger'), cream: v('on-cream') },
        success: { DEFAULT: v('success'), soft: v('success-soft'), text: v('success-text') },
        warning: { DEFAULT: v('warning'), soft: v('warning-soft'), text: v('warning-text') },
        danger:  { DEFAULT: v('danger'),  soft: v('danger-soft'),  text: v('danger-text') },
        info:    { DEFAULT: v('info'),    soft: v('info-soft'),    text: v('info-text') },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] }
    }
  },
  plugins: []
}

