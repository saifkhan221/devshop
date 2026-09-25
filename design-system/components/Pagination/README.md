# Pagination

Pagination — page controls under a Table.

**Consumer provides:** the "x–y of N" `ds-page-info` text, previous/next icon buttons, and page numbers with `aria-current="page"` on the current one (ellipsis for gaps).

- Current page is a `peach` fill with `on-peach`. Right-aligned under the table, `space-3` above.
- For infinite lists use a quiet "Load more" `ds-btn` instead.
