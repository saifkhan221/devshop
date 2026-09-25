# Menu

Menu — a dropdown of actions.

**Consumer provides:** the trigger (usually an `IconButton`), items as `ds-menu-item` buttons with a 16px icon and optional `Kbd` shortcut, `ds-menu-sep` between groups, `ds-menu-heading` for a labelled group; positioning via your popover of choice.

- Destructive items are `ds-menu-item-danger` and always last, after a separator.
- Max ~8 items; beyond that it is a `Select` or a search.
