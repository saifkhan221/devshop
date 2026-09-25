# IconButton

IconButton — a 36px square for one icon action.

**Consumer provides:** the icon (20px, `ds-icon`) and an `aria-label`; never an icon-only button without one.

- Default is borderless on transparent; `ds-icon-btn-outline` when it sits on `bg-000` and needs an edge; `ds-icon-btn-round` for topbar actions beside the avatar; `ds-icon-btn-active` when it toggles a state that is on.
- `ds-icon-btn-sm` (28px) in table rows and card headers.
- Always a tooltip on hover (`Tooltip`) naming the action.
