# Table

Table — dense rows inside a bordered, rounded wrapper.

**Consumer provides:** `<table class="ds-table">` inside `ds-table-wrap`, header cells, rows; numeric columns get `ds-num` on both `th` and `td`; the primary cell gets `ds-cell-primary` and its meta line `ds-cell-meta`.

- Header is `bg-200` with a `line-strong` underline and stays sticky. Rows hover to `bg-200`; `is-selected` rows tint `peach-soft`.
- Status columns use `Badge` with a dot; actions column is right-aligned `ds-icon-btn-sm`s.
- `ds-table-compact` for logs and long lists.
