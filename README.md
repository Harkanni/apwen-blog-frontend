# APWEN Blog: frontend

The reading site and the content studio for the Association of Professional Women Engineers of Nigeria.

- **Readers** get a fast, mobile-first blog in APWEN purple: lead story, topics, search, share to WhatsApp/Facebook, RSS.
- **Editors** get a studio that works like a writing app: rich text, images anywhere in the story with captions and layouts, pull quotes, note/tip/warning boxes, tables, YouTube, true phone/desktop preview, autosave, scheduling, version history, and a trash with undo.

Backend: [`apwen-blog-backend`](../apwen-blog-backend).

## Quick start

```bash
# 1. backend (separate repo)
cd apwen-blog-backend && cp .env.example .env && npm run seed && npm run dev

# 2. this app
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000 for the blog and http://localhost:3000/admin for the studio.

## Deploy

Any Node host works (Vercel, Render, Railway, a VPS).

| Variable | Example | Purpose |
|---|---|---|
| `API_URL` | `https://api.blog.apwen.org.ng` | Backend address (server-side and rewrites) |
| `NEXT_PUBLIC_SITE_URL` | `https://blog.apwen.org.ng` | Canonical links, sitemap, RSS, social cards |

Run `npm run build && npm start`. See `CLAUDE.md` for architecture and `DESIGN.md` for the design system.
