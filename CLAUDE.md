# CLAUDE.md: APWEN Blog frontend

Handoff notes for any AI assistant or developer picking this up. Read `DESIGN.md` before touching UI.

## What this is

Next.js (App Router) app with two halves:

- **Reader site** (`src/app/(site)`): home, story pages, topics, search, about, RSS, sitemap. Server-rendered with ISR (60s) and on-demand revalidation.
- **Studio** (`src/app/admin`): sign-in, stories dashboard, rich editor, image library, settings and team. Client-rendered, behind the API's session cookie.

The backend is a separate repo, `apwen-blog-backend` (zero-dependency Node API with SQLite). See its CLAUDE.md.

## Run it

```bash
cp .env.example .env.local     # API_URL=http://localhost:4000
npm install
npm run dev                    # http://localhost:3000, studio at /admin
```

The backend must be running (`npm run seed && npm run dev` in the backend repo). Default admin: `admin@apwen.org.ng` / `ChangeMe!2026` (set by the backend's env).

## How requests flow

- Server components call the API directly at `API_URL` (`src/lib/api.ts`, `server-only`).
- The browser calls `/api/*` and `/uploads/*` on this origin; `next.config.ts` rewrites them to the API. This keeps the httpOnly session cookie first-party, so no CORS setup is needed.
- After publishing/updating/trashing, the studio POSTs `/revalidate` (`src/app/revalidate/route.ts`), which checks the session with the API and revalidates cached pages.

## Rich content pipeline (important)

Stories are stored as **Tiptap/ProseMirror JSON**, never HTML. A node or mark type must exist in three places, or it will be dropped:

1. Editor extension: `src/components/admin/editor/extensions.ts` (custom nodes in `blocks.tsx`, `Figure.tsx`).
2. Backend allowlist: `apwen-blog-backend/src/lib/content.js` (`NODE_ATTRS` / `MARK_ATTRS`, plus URL checks).
3. Public renderer: `src/components/content/RichContent.tsx`.

Typography for all three lives in `src/app/content.css` under `.rich`. The editor reuses the same class so it is WYSIWYG.

Supported now: paragraph, heading 2–4, bullet/numbered/task lists, blockquote, pull quote (with attribution), callout (info/tip/warning/success), code block, divider, image (caption, alt, layout normal/wide/full), YouTube (privacy-enhanced embed), tables; marks bold, italic, underline, strike, code, sub/superscript, link, highlight (5 colours), text colour (7), text alignment.

## Map

```
src/app/(site)/           reader pages (layout fetches settings + categories)
src/app/admin/login       sign-in
src/app/admin/(studio)/   dashboard, media, settings (inside AuthGate + StudioShell)
src/app/admin/write/[id]  editor ("new" creates on first save, then swaps URL)
src/app/admin/preview     iframe target for device preview (postMessage)
src/components/site/      header, footer, cards, story view, share
src/components/admin/     AuthGate, StudioShell, editor/*
src/components/ui/        Sheet (bottom sheet / dialog), ActionMenu
src/lib/                  api (server), client-api (browser), types, format
```

## Editor behaviour worth knowing

- `StoryEditor.tsx` owns saving. Drafts: debounced autosave (~1.1s) via PATCH with `expected_updated_at`; a 409 opens a conflict sheet. Published: changes stay local until "Update".
- Unsaved work is mirrored to `localStorage` key `apwen:backup:<id|new>`; offered back on reopen.
- Images upload as raw bytes (`uploadImage` in `client-api.ts`) with progress. A placeholder node uses a `blob:` URL and an `uploadId`, swapped for the real URL when done (`uploadProgress` store in `Figure.tsx`).
- `/` opens the slash menu (`SlashCommand.tsx`, items in `blockItems.ts`). Image and video items dispatch `apwen:pick-image` / `apwen:embed-video` window events that the editor listens for.
- Phone toolbar is positioned with `visualViewport` to sit above the keyboard.

## Status and next steps

- [x] Reader site, studio, editor, media, settings, team written.
- [ ] **Not yet compiled or run.** The build environment this was written in could not reach the npm registry, so `npm install`, `npm run typecheck` and `npm run build` have not run. Expect a handful of type or API-version fixes on first install, most likely in Tiptap v3 imports (`@tiptap/react/menus`, `@tiptap/extensions`, `@tiptap/extension-list`, `@tiptap/extension-table`) and `vaul` props. Fix them, then delete this line.
- [ ] Replace the placeholder truss logo (`components/site/Logo.tsx`, `public/icon.svg`) with the official APWEN logo.
- [ ] Confirm the official Instagram and Facebook URLs in Studio → Settings (defaults are guesses).
- [ ] Optional: image resizing on upload (backend), dark mode, newsletter sign-up.

## Conventions

- TypeScript strict; path alias `@/`.
- Tailwind v4 with tokens in `@theme`. Component classes (`.btn`, `.field`, `.wrap`, `.dimension`) are plain CSS in `@layer components`; Tailwind variants (`md:`) don't apply to them.
- Copy is sentence case, active voice, no ALL-CAPS.
- Commit small and often, with a `Co-Authored-By` trailer when an AI wrote the change.
