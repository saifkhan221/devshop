# Button

Button — one primary per view, quiet everywhere else.

**Consumer provides:** the label (verb first, sentence case), optional leading icon (16px), `type`, `disabled`.

- `ds-btn` alone is the quiet default (`bg-200`, `line` border). Add `ds-btn-primary` for the single peach action a view is for; `ds-btn-inverse` (ink fill) for a secondary emphasis inside a cream or hero card; `ds-btn-ghost` for toolbar actions; `ds-btn-danger` for destructive confirmations only.
- Sizes: `ds-btn-sm` (28px) in table rows and card headers, default 36px, `ds-btn-lg` (44px) only on auth and empty states.
- Never two `ds-btn-primary` side by side. A primary next to a quiet "Cancel" is the modal pattern.
- Loading: swap the icon for a spinner, keep the width (`min-width` on the button), keep the label.
