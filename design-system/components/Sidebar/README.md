# Sidebar

Sidebar — the app's left rail.

**Consumer provides:** the brand row, nav groups (`ds-nav-group` label + `ds-nav-item` links with a 20px icon and text), an optional count badge, and the footer with the user avatar.

- The active route gets `aria-current="page"`: `bg-300` fill, `ink` text, `peach-text` icon. Only the icon turns peach — the fill stays neutral so the sidebar never competes with the page's primary button.
- `ds-sidebar-collapsed` (64px) hides labels; items become icon buttons with tooltips.
- Groups: Workspace (Dashboard, Tools, Board), Library (Snippets, Projects), then Settings at the bottom.
