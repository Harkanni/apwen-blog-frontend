# DESIGN.md: APWEN Blog

The design system for the reader site and the studio. Read this before changing any UI. Tokens live in `src/app/globals.css` (`@theme`), article typography in `src/app/content.css`.

## The brief, in one paragraph

APWEN (Association of Professional Women Engineers of Nigeria) needs a blog that feels as precise as the profession and as warm as the community. Readers are members, girls considering STEM, partners and press, mostly on phones over mobile data. The editor is a content moderator who is not technical: the studio must feel like writing in a good notes app, never like operating a CMS. The association's colour is purple.

## Principles

1. **One loud thing per screen.** The home page's loud thing is the lead story headline. The story page's is the pull quote (if any). Everything else stays quiet.
2. **No borders on mobile.** Separation comes from space, tinted surfaces (`mist`) and type weight. Hairlines (`--color-line`) are allowed only inside tables. Images on phones go edge to edge with no frame or radius.
3. **Engineering, not decoration.** The signature motif is the **dimension line** (`.dimension`): the `|<— label —>|` annotation from engineering drawings. It carries real data (date, byline, reading time). The brand mark is an "A" drawn as a truss with a gold hard-hat apex. Don't add other ornaments.
4. **Motion answers touches.** Spring presses (`active:scale-[.97]`), sheets that slide, tabs whose pill glides (`layoutId`). The only unprompted motion is the lead story's one-time rise on load. Respect `prefers-reduced-motion` (globally handled in `globals.css`).
5. **Plain words.** Sentence case everywhere. Buttons say exactly what happens ("Publish now", "Move to trash", "Restore"). The toast after an action uses the action's word ("Published", "Moved to trash"). Errors say what happened and what to do. No ALL-CAPS labels, no eyebrow text.

## Colour

| Token | Hex | Use |
|---|---|---|
| `ink` | `#1E0F2E` | Body text, headings, dark surfaces. Purple-tinted, never pure black. |
| `ink-soft` | `#4B3D5C` | Secondary text, subtitles. |
| `ink-faint` | `#7D7090` | Meta, captions, placeholders. |
| `iris` | `#6B2FA3` | APWEN purple. Links, primary buttons, active states, focus rings. |
| `iris-deep` | `#4E1C80` | Hover/pressed iris, pull quotes, tag text. |
| `mist` | `#F5F0FB` | Tinted surfaces: fields, chips, footer, callouts. Replaces borders. |
| `mist-deep` | `#ECE3F7` | Hover on mist, placeholder covers. |
| `gold` | `#E9A23B` | "Hard-hat gold". Tiny accents only: logo apex, nav dot, pull-quote mark, highlight swatch. Never for large areas or text. |
| `danger` / `success` | `#C2334D` / `#23855B` | With their `-soft` backgrounds for state pills and callouts. |

Contrast: `ink` and `ink-soft` on white pass AA for body text; `ink-faint` is for ≥ 13px meta only. White on `iris` passes AA.

## Type

- **Bricolage Grotesque Variable** (`font-sans`): UI and all headings. Characterful at display sizes (tight tracking `-0.04em`, weight 680–720), calm at UI sizes.
- **Literata Variable** (`font-serif`): article body and subtitles. Designed for long-form screen reading.
- Self-hosted through `@fontsource-variable/*`; no runtime call to Google Fonts.

Scale (mobile → desktop):

| Role | Size | Weight / tracking |
|---|---|---|
| Lead headline | 2.15rem → 3.6rem | 700, -0.04em, `text-balance` |
| Story title | 2.1rem → 3.9rem | 720, -0.04em |
| Section heading | 1.6rem → 2rem | 680, -0.03em |
| Card title | 1.08rem → 1.35rem | 650, -0.02em |
| Article body | 18px → 19px / 1.75 | Literata 400, measure 680px (~68ch) |
| Meta | 0.8–0.85rem | `ink-faint`, tabular numbers |

## Layout

- `.wrap`: max 1200px, 20px gutters on phones, 32px from 768px.
- Reading column 680px; `wide` figures 960px; `full` figures 100vw.
- Home (phone): edge-to-edge lead image → headline → dimension line → "Latest stories" with compact rows (104px square thumbs). Desktop: lead splits 7/5 columns; latest is a 3-column grid.
- Story: centred header on desktop (left-aligned on phones), cover, body, tags, share actions, "Keep reading" on a mist band.
- Studio (phone): bottom tab bar with a raised "write" button in the middle. Desktop: left rail on `mist` with a white pill marking the active item.

## Radii and depth

`sm 10` fields, `md 16` panels and figures, `lg 24` dialogs, `xl 32` hero blocks and covers, full pills for buttons and chips. Two shadows only: `--shadow-lift` (resting raised elements like active pills) and `--shadow-float` (popovers, sheets, floating toolbars). Never stack a border and a shadow.

## Components (where to find them)

| Component | File | Notes |
|---|---|---|
| Buttons `.btn` + `.btn-primary/soft/ghost/danger`, `.btn-sm`, `.btn-icon` | `globals.css` | 44px touch height (36px for `-sm`). |
| Fields `.field`, `.label` | `globals.css` | 16px text so iOS doesn't zoom. Focus = iris ring, no border. |
| `Sheet` | `components/ui/Sheet.tsx` | Phones: draggable bottom sheet (vaul). Desktop: centred dialog or side panel. Use it for every overlay. |
| `Confirm`, `Switch`, `StatePill` | `components/ui/Sheet.tsx` | |
| `ActionMenu` | `components/ui/ActionMenu.tsx` | Dropdown on desktop, big-row sheet on phones. |
| `RichContent` | `components/content/RichContent.tsx` | Renders stored JSON. |
| `StoryView` | `components/site/StoryView.tsx` | Shared by the public page and the studio preview. |

## Studio UX rules

- Writing surface = reading surface. The editor's ProseMirror element has the `.rich` class, so typography, figure layouts, callouts and pull quotes look the same while typing as on the blog.
- Drafts autosave about a second after typing stops. Published stories do **not** change on the blog until "Update" is pressed; edits are kept on the device meanwhile and a gold notice says so.
- Every unsaved change is mirrored to `localStorage`; on reopening, the editor offers to restore it.
- Images can be added five ways: toolbar button, `/` menu, Insert menu, drag-and-drop, paste. Each shows upload progress in place. Selecting an image shows layout (text width / wide / full), description, replace and remove.
- Destructive actions are reversible first: "Move to trash" (with Undo toast) → "Delete for good" (confirmation) only from the Trash tab.
- Phones: formatting toolbar pins above the keyboard (`visualViewport`), selection bubble is disabled so native selection handles stay usable.

## Don'ts

- Don't add borders to cards, inputs or list rows on mobile.
- Don't introduce a third typeface or a monospace label style.
- Don't use gold for text or large fills.
- Don't put fade-up animations on every section.
- Don't render stored HTML with `dangerouslySetInnerHTML`; extend the JSON renderer instead.
