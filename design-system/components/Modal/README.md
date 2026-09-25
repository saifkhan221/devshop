# Modal

Modal — a focused decision on top of the page.

**Consumer provides:** `ds-scrim` (the `overlay` backdrop, `z-overlay`) containing `ds-modal` with a `ds-modal-title`, `ds-modal-body`, and `ds-modal-actions` (quiet Cancel on the left of one primary or danger button). Focus trap and Escape handling are the consumer's.

- Max width 480px; forms up to 640px. `radius-lg`, `space-6` padding, `shadow-overlay`.
- One modal at a time. Confirmations use a danger button and name the object: "Delete 'Regex tester'?"
- On mobile the same markup becomes a bottom sheet (full width, top radius only).
