# Dev Kit

A Vue 3 frontend workspace app where developers organize tools by project. Firebase backend for auth, data, and hosting on Vercel.

## Tech Stack

- **Frontend:** Vue 3 (Composition API), Vuex 4, Vue Router 4
- **Build:** Vite 8, SCSS, Tailwind CSS 3.4
- **Backend:** Firebase Auth, Firestore, App Check (reCAPTCHA v3)
- **Icons:** @lucide/vue
- **Drag & Drop:** vue-draggable-plus
- **Sanitization:** DOMPurify
- **Deploy:** Vercel (auto-deploy on push to master)
- **Node:** 20.19.0 (see .nvmrc)

## Project Structure

```
src/
  components/
    tools/        # Tool components (TaskList, KanbanBoard, ProjectNotes, etc.)
    ui/           # Reusable UI (AppModal, AppToast, AppButton, ThemeSelector, etc.)
    layout/       # AppNavbar, AppSidebar
  views/          # AuthView, DashboardView, ProjectBoardView, ToolSelectorView, FeedbackView, LibraryView, AdminView
  services/       # firebase.js, auth.js, db.js
  store/modules/  # auth.js, projects.js, ui.js
  composables/    # useToolStorage.js, useUserPrefs.js
  utils/          # security.js, requestThrottler.js, theme.js
  config/         # tools.js (tool registry)
  styles/         # _variables.scss, _themes.scss, _mixins.scss, _components.scss, main.scss
  router/         # index.js
```

## Dual-Mode Architecture

The app runs in two modes controlled by `VITE_AUTH_MODE` in `.env`:

- **`dummy`** — localStorage only, hardcoded test user (`saif@gmail.com` / `saif@123`), seeded demo projects. No Firebase calls.
- **`firebase`** — Real Firebase Auth + Firestore. All services and composables check this flag.

## How to Create a New Tool

1. **Create the component** in `src/components/tools/YourTool.vue`:
   - Accept `projectId` as a prop
   - Call `useToolStorage(projectId, 'your-tool-id', defaultValue)` for persistence
   - Returns `{ data, loading, save }` — `data` is reactive, call `save()` or watch deeply to auto-persist

2. **Register it** in `src/config/tools.js`:
   ```js
   { id: 'your-tool-id', name: 'Your Tool', icon: '🔧', category: 'Productivity', desc: 'What it does', component: 'YourTool' }
   ```

3. **Add lazy import** in `src/views/ProjectBoardView.vue`:
   ```js
   YourTool: defineAsyncComponent(() => import('@/components/tools/YourTool.vue'))
   ```

That's it. The tool will appear in the tool selector and persist data per-user per-project.

### Tool categories: `CSS & Layout`, `Productivity`, `Design`, `Testing`, `Code`

### Existing tools (18 registered, 5 active):
Active: PxToRem, TaskList, ProjectNotes (Callouts), SvgViewer, KanbanBoard
Disabled (coming soon): ColorPalette, BoxShadow, GradientMaker, ContrastChecker, FlexboxPlayground, JsonFormatter, CodeSnippets, BreakpointTester, TypographyScale, SpacingCalc, CssAnimator, GridGenerator, TestingChecklist

## Data Persistence — Stale-While-Revalidate

All data uses a two-layer cache:
- **L1:** localStorage (instant reads/writes)
- **L2:** Firestore (source of truth, background sync)

**Load:** Return localStorage cache immediately (no loading spinner), then background-fetch from Firestore and silently update if different.

**Save:** Write localStorage immediately, debounce Firestore write by 800ms.

This pattern is used in `useToolStorage`, `useUserPrefs`, and `dbService.getProjects()`.

## Firestore Collections

| Collection | Doc ID | Purpose |
|---|---|---|
| `projects` | Auto-generated | User projects (name, description, tools, toolOrder, tags, color, emoji) |
| `toolData` | `{userId}_{projectId}_{toolId}` | Per-tool data (tasks, kanban columns, notes, etc.) |
| `feedback` | Auto-generated | User feedback (title, description, tags, images as base64) |
| `library` | Auto-generated | Shared team library entries (title, type, tags, body markdown, authorId, authorName) |
| `devlog` | Auto-generated | Admin dev log entries (feature, tokens, model, commit) |
| `userPrefs` | `{userId}` | Theme preferences, clock format |

Security rules are in `firestore.rules`. Most collections enforce `userId == auth.uid` ownership. Admin email (`saif@radix.email`) has read/delete access to `feedback` and full access to `devlog`.

**`library` is the exception — it is a shared, collaborative collection:** every signed-in user can read all entries; anyone can create their own; authors edit/delete their own entries (admin can moderate any). Cache is global (`devshop_library`), not per-user. Data access lives in `dbService.getLibraryEntries/createLibraryEntry/updateLibraryEntry/deleteLibraryEntry` (`services/db.js`); the page is `views/LibraryView.vue` at `/library`, reachable from the navbar icon and a Dashboard header button. Markdown is rendered with `marked` + sanitized with DOMPurify.

## Vuex Store Modules

- **`auth`** — User session. Getters: `isLoggedIn`, `currentUser`, `userInitials`. Logout clears all `devshop_*` localStorage keys.
- **`projects`** — Project CRUD. `fetchProjects` passes an `onRefresh` callback so background Firestore refreshes update the UI silently. `updateProject` passes `userId` to keep localStorage cache in sync.
- **`ui`** — Toasts and modal state. `toast({ message, type })` auto-dismisses after 3s.

## Theme System

8 preset themes (aurora, slate, ocean, volt, jade, cosmic, azure, lavender) + custom themes. Applied via `data-theme` attribute on `<html>`. CSS variables defined in `_themes.scss`, referenced as SCSS vars in `_variables.scss`. Custom themes derive all CSS vars from just accent + background hex using color math in `utils/theme.js`.

## Routes

| Path | View | Access |
|---|---|---|
| `/` | AuthView | Guest only |
| `/dashboard` | DashboardView | Auth required |
| `/feedback` | FeedbackView | Auth required |
| `/library` | LibraryView | Auth required (shared team library) |
| `/admin` | AdminView | Auth required (admin-only in component) |
| `/project/:id/setup` | ToolSelectorView | Auth required |
| `/project/:id` | ProjectBoardView | Auth required |

## Admin

Admin is `saif@radix.email`. Admin-specific features:
- **Feedback page:** Sees all users' feedback, can delete any feedback
- **Dev Log page:** `/admin` — tracks development sessions (feature, tokens used, Claude model, commit message)
- **Navbar:** Pencil icon (yellow) links to admin page, only visible to admin

## Key Conventions

- All localStorage keys are prefixed with `devshop_`
- Firestore operations are throttled via token-bucket (30 tokens/sec per action key)
- Firebase modules are dynamically imported and cached (no upfront bundle cost)
- Production builds strip console.log/warn/info/debug via @rollup/plugin-strip
- Boot sequence: initTheme() -> auth/initAuth -> mount app (prevents theme flash and auth redirect)
- Client-side rate limiting: 5 failed login attempts per 15-minute window

## Deployment

- **Vercel:** Auto-deploys on push to master. SPA rewrite sends all routes to `/index.html`.
- **CSP headers:** Configured in `vercel.json` — allows Google (reCAPTCHA), Firebase, fonts, and specific APIs.
- **Install override:** Uses `npm install --legacy-peer-deps` due to vite 8 / plugin-vue peer dep mismatch.
- **Firestore rules:** Must be deployed manually via Firebase Console (Firestore Database -> Rules -> Publish) after changes to `firestore.rules`.

## Environment Variables

See `.env.example`. Key vars:
- `VITE_AUTH_MODE` — `dummy` or `firebase`
- `VITE_FIREBASE_*` — Firebase config
- `VITE_RECAPTCHA_SITE_KEY` — reCAPTCHA v3 site key for App Check
