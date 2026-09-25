/**
 * DevShop design system — the components are CSS classes in bundle.css (prefix `ds-`),
 * meant for Vue templates with Tailwind utilities around them.
 * bundle.js exposes these framework-free helpers on window.DevShop.
 */
export type Theme = 'dark' | 'light';

export interface DevShopHelpers {
  /** Apply a theme to <html data-theme> and persist it. */
  setTheme(theme: Theme): void;
  /** Apply the stored theme (default 'dark'); returns it. Call once at boot. */
  initTheme(): Theme;
  /** Set a .ds-ring element's value (0–1); optional label replaces the "NN%" centre text. */
  setRing(el: HTMLElement, pct: number, label?: string): void;
  /** Keep a .ds-slider's filled track in sync with its value (call on 'input'). */
  syncSlider(input: HTMLInputElement): void;
  /** Make a .ds-tabs or .ds-segmented container switch its active child on click. */
  bindTabs(container: HTMLElement, onChange?: (value: string, button: HTMLElement) => void): void;
}

/** Class-name contracts, for editor autocomplete and docs. */
export type ButtonClass = 'ds-btn' | 'ds-btn-primary' | 'ds-btn-inverse' | 'ds-btn-ghost' | 'ds-btn-danger' | 'ds-btn-sm' | 'ds-btn-lg';
export type BadgeClass = 'ds-badge' | 'ds-badge-peach' | 'ds-badge-violet' | 'ds-badge-success' | 'ds-badge-warning' | 'ds-badge-danger' | 'ds-badge-info' | 'ds-badge-solid' | 'ds-badge-square';
export type CardClass = 'ds-card' | 'ds-card-compact' | 'ds-card-lg' | 'ds-card-link' | 'ds-card-cream' | 'ds-card-hero' | 'ds-card-violet';

declare global { interface Window { DevShop: DevShopHelpers } }
