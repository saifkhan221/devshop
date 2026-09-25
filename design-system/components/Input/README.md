# Input

Input — text entry on a `bg-200` well with a `line-strong` border.

**Consumer provides:** a `ds-label` (always; visually hidden only in the topbar search), placeholder that shows the format not the label, optional leading icon and trailing `Kbd`, help or error text under it.

- Focus turns the border `peach` with a `peach-soft` halo. Invalid: `aria-invalid="true"` (or `ds-input-invalid`) turns it `danger-text` and the help text becomes `ds-help-error`, naming the fix.
- `ds-textarea` for multi-line; min height 88px, vertical resize only.
- Width comes from the parent; inputs never set their own width beyond the `ds-field` minimum.
