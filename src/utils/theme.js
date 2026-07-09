/**
 * Theme System
 *
 * Preset themes are applied via data-theme on <html>.
 * Custom theme is applied by directly setting CSS custom properties on :root.
 *
 * Usage:
 *   import { applyTheme, applyCustomTheme, THEMES } from '@/utils/theme'
 *   applyTheme('ocean')
 *   applyCustomTheme({ accent: '#ff6b6b', bg: '#0a0a0a' })
 */

const STORAGE_KEY      = 'devshop_theme'
const CUSTOM_KEY       = 'devshop_custom_theme'
const DEFAULT_THEME    = 'aurora'

async function syncToFirebase(patch) {
  try {
    const { savePrefs } = await import('@/composables/useUserPrefs')
    savePrefs(patch)
  } catch { /* non-critical */ }
}

// ─── Preset themes ────────────────────────────────────────────────────────
export const THEMES = [
  { id: 'aurora', name: 'Aurora', desc: 'Deep purple cosmos',    accent: '#7c3aed', bg: '#0d0720' },
  { id: 'slate',  name: 'Slate',  desc: 'Cool grey & indigo',    accent: '#6366f1', bg: '#0f1117' },
  { id: 'ocean',  name: 'Ocean',  desc: 'Deep sea vibes',        accent: '#06b6d4', bg: '#071520' },
  { id: 'volt',   name: 'Volt',   desc: 'Neon lime on black',    accent: '#c8f53b', bg: '#090909' },
  { id: 'jade',   name: 'Jade',   desc: 'Emerald carbon dark',   accent: '#00d4a0', bg: '#0c1110' },
  { id: 'cosmic',   name: 'Cosmic',   desc: 'Deep plum & violet',      accent: '#a855f7', bg: '#12082d' },
  { id: 'azure',    name: 'Azure',    desc: 'Electric blue depths',    accent: '#3b9ef5', bg: '#080e1a' },
  { id: 'lavender', name: 'Lavender', desc: 'Light purple corporate',  accent: '#5b5ea6', bg: '#f0f0fb' },
]

// ─── Apply a preset theme ──────────────────────────────────────────────────
export function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0]
  // Remove any custom CSS properties first
  clearCustomProperties()
  document.documentElement.setAttribute('data-theme', theme.id)
  localStorage.setItem(STORAGE_KEY, theme.id)
  localStorage.removeItem(CUSTOM_KEY)
  syncToFirebase({ theme: theme.id, customTheme: null })
}

// ─── Apply a custom theme ──────────────────────────────────────────────────
// Derives a full theme from just an accent + background colour
export function applyCustomTheme({ accent, bg }) {
  document.documentElement.setAttribute('data-theme', 'custom')

  const vars = deriveThemeVars(accent, bg)
  const root = document.documentElement

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  localStorage.setItem(STORAGE_KEY, 'custom')
  localStorage.setItem(CUSTOM_KEY, JSON.stringify({ accent, bg }))
  syncToFirebase({ theme: 'custom', customTheme: { accent, bg } })
}

// ─── Boot: restore saved theme ────────────────────────────────────────────
export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME

  if (saved === 'custom') {
    const raw = localStorage.getItem(CUSTOM_KEY)
    if (raw) {
      try { applyCustomTheme(JSON.parse(raw)) } catch { applyTheme(DEFAULT_THEME) }
    } else {
      applyTheme(DEFAULT_THEME)
    }
  } else {
    applyTheme(saved)
  }

  // Background sync from Firestore — re-apply if remote differs
  import('@/composables/useUserPrefs').then(({ syncPrefsFromFirestore }) => {
    syncPrefsFromFirestore().then(remote => {
      if (!remote) return
      if (remote.theme === 'custom' && remote.customTheme) {
        applyCustomTheme(remote.customTheme)
      } else if (remote.theme && remote.theme !== saved) {
        applyTheme(remote.theme)
      }
    })
  })
}

export function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME
}

export function getSavedCustomColors() {
  const raw = localStorage.getItem(CUSTOM_KEY)
  if (!raw) return { accent: '#7c3aed', bg: '#0d0720' }
  try { return JSON.parse(raw) } catch { return { accent: '#7c3aed', bg: '#0d0720' } }
}

// ─── Colour math ──────────────────────────────────────────────────────────

function clearCustomProperties() {
  const props = [
    '--bg-primary','--bg-surface','--bg-elevated',
    '--border-subtle','--border-strong',
    '--text-primary','--text-secondary','--text-muted','--text-heading',
    '--accent','--accent-glow','--accent-subtle',
    '--brand-950','--brand-900','--brand-800','--brand-700',
    '--brand-600','--brand-500','--brand-400','--brand-300','--brand-200',
    '--shadow-card','--shadow-modal','--shadow-accent',
  ]
  props.forEach((p) => document.documentElement.style.removeProperty(p))
}

// Parse #rrggbb → [r, g, b]
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

// [r, g, b] → #rrggbb
function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
}

// Mix colour toward black (darken) or white (lighten). factor: -1 (black) to 1 (white)
function shiftColor([r, g, b], factor) {
  if (factor < 0) {
    // Darken toward black
    const f = 1 + factor
    return [r * f, g * f, b * f]
  } else {
    // Lighten toward white
    return [r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor]
  }
}

// Build the full CSS variable map from two hex colours
function deriveThemeVars(accent, bg) {
  const accentRgb = hexToRgb(accent)
  const bgRgb     = hexToRgb(bg)

  const [ar, ag, ab] = accentRgb
  const [br, bg2, bb] = bgRgb

  return {
    // Backgrounds — derived from bg colour
    '--bg-primary':    bg,
    '--bg-surface':    rgbToHex(shiftColor(bgRgb,  0.06)),
    '--bg-elevated':   rgbToHex(shiftColor(bgRgb,  0.12)),

    // Borders — accent at low opacity
    '--border-subtle': `rgba(${ar}, ${ag}, ${ab}, 0.25)`,
    '--border-strong': `rgba(${ar}, ${ag}, ${ab}, 0.5)`,

    // Text — detect light bg (luminance > 0.5) to use dark headings
    '--text-primary':   '#ffffff',
    '--text-secondary': rgbToHex(shiftColor(accentRgb, 0.45)),
    '--text-muted':     rgbToHex(shiftColor(accentRgb, 0.25)),
    '--text-heading':   (0.299 * br + 0.587 * bg2 + 0.114 * bb) > 128 ? '#1e1b4b' : '#ffffff',

    // Accent
    '--accent':         accent,
    '--accent-glow':    `rgba(${ar}, ${ag}, ${ab}, 0.35)`,
    '--accent-subtle':  `rgba(${ar}, ${ag}, ${ab}, 0.08)`,

    // Brand scale (950=darkest bg, 200=lightest tint of accent)
    '--brand-950': bg,
    '--brand-900': rgbToHex(shiftColor(bgRgb,   0.05)),
    '--brand-800': rgbToHex(shiftColor(bgRgb,   0.10)),
    '--brand-700': rgbToHex(shiftColor(accentRgb, -0.5)),
    '--brand-600': rgbToHex(shiftColor(accentRgb, -0.2)),
    '--brand-500': accent,
    '--brand-400': rgbToHex(shiftColor(accentRgb,  0.2)),
    '--brand-300': rgbToHex(shiftColor(accentRgb,  0.4)),
    '--brand-200': rgbToHex(shiftColor(accentRgb,  0.6)),

    // Shadows
    '--shadow-card':   '0 4px 20px rgba(0, 0, 0, 0.4)',
    '--shadow-modal':  '0 40px 80px rgba(0, 0, 0, 0.65)',
    '--shadow-accent': `0 4px 16px rgba(${ar}, ${ag}, ${ab}, 0.35)`,
  }
}
