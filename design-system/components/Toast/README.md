# Toast

Toast — a transient confirmation, bottom-right, `z-toast`.

**Consumer provides:** a status icon, `ds-toast-title` (what happened), optional `ds-toast-body` (what next), and a close icon button. Auto-dismiss after 5 s, longer on hover.

- Status is carried by the icon colour and the title — no coloured left border, no coloured background.
- Max three stacked; the oldest leaves first. Errors that need action are a banner in the page, not a toast.
