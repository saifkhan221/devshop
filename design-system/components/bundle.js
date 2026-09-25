/* @ds-bundle: {"format":4,"namespace":"DevShop","components":[]} */
/* DevShop helpers — no framework. Components are CSS classes in bundle.css;
   these three functions cover the bits CSS cannot do on its own. */
(function () {
  var DevShop = window.DevShop || {};

  /** Set the theme: 'dark' | 'light'. Persists to localStorage when available. */
  DevShop.setTheme = function (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('ds-theme', theme); } catch (e) {}
  };
  /** Read the stored theme (falls back to 'dark') and apply it. Call once at boot. */
  DevShop.initTheme = function () {
    var t = 'dark';
    try { t = localStorage.getItem('ds-theme') || t; } catch (e) {}
    DevShop.setTheme(t);
    return t;
  };

  /** ProgressRing: set a 0–1 value on a .ds-ring element (updates the stroke and the centre text). */
  DevShop.setRing = function (el, pct, label) {
    pct = Math.max(0, Math.min(1, pct));
    el.style.setProperty('--ds-ring-pct', pct);
    var v = el.querySelector('.ds-ring-value');
    if (v) v.textContent = label != null ? label : Math.round(pct * 100) + '%';
  };

  /** Slider: keep the WebKit track fill in sync with the value. Call on 'input'. */
  DevShop.syncSlider = function (input) {
    var min = +input.min || 0, max = +input.max || 100, val = +input.value;
    input.style.setProperty('--ds-slider-pct', ((val - min) / (max - min)) * 100 + '%');
  };

  /** Tabs / SegmentedControl: wire a container so clicking a child with role=tab or aria-pressed switches the active one. */
  DevShop.bindTabs = function (container, onChange) {
    container.addEventListener('click', function (e) {
      var btn = e.target.closest('[role="tab"], [aria-pressed]');
      if (!btn || !container.contains(btn)) return;
      var attr = btn.hasAttribute('role') ? 'aria-selected' : 'aria-pressed';
      container.querySelectorAll('[' + attr + ']').forEach(function (b) { b.setAttribute(attr, 'false'); });
      btn.setAttribute(attr, 'true');
      if (onChange) onChange(btn.dataset.value || btn.textContent.trim(), btn);
    });
  };

  window.DevShop = DevShop;
})();
