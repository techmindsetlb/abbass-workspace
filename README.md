# 🚀 Abbass Workspace

The personal task manager built for **Abbass Mokashar** — Web Developer (WordPress · Shopify · Framer · Custom Development · Beirut, Lebanon).

Designed to match [abbassmokashar.github.io/website](https://abbassmokashar.github.io/website) — dark developer aesthetic with the signature mint-to-teal gradient, **Syne + Space Grotesk** typography.

## 📋 Pre-loaded Boards

- 💼 **Client Projects** — WordPress, Shopify, Framer & custom builds
- 🚀 **SaaS Products** — Cafe/POS, clinic management & ready-made software
- 🛠️ **Maintenance** — Monthly care, updates, security, uptime
- 📈 **Leads & Pitches** — Inquiries, proposals, discovery calls
- 💡 **Ideas & Learning** — Experiments, side projects, courses
- 🏠 **Personal** — Life admin & errands

## ✨ Features

- **📝 Kanban Boards** — Separate board per project/client
- **↔️ Cross-Board Drag & Drop** — Drag a task and drop it on another board in the sidebar to move it
- **🏷️ Smart Tags** — Dev, Client, Design, Content, Meeting, Urgent, Idea, Personal
- **🔴 Priority Levels** — High / Medium / Low with color indicators
- **📅 Calendar View** — See all due tasks on one calendar
- **🔑 Licenses** — Track SaaS licenses per client: license key + hardware ID (click to copy), start/expiry dates, and a red badge + banner that warns when a license is **expired or expiring within 14 days** (no browser permission needed)
- **🚀 Rocket Focus Timer** — A rocket fuels up as you focus, then launches with confetti
- **📎 Attachments** — Files saved in IndexedDB (images auto-compressed)
- **✅ Checklists** — Subtasks with progress on each card
- **📝 Rich Notes** — Bold, italic, lists, headings per task
- **🔒 PIN Lock** — Keep your workspace private (default PIN: `2002`, changeable anytime in Customize settings)
- **🎨 Themes** — Midnight (default), Terminal, Deep Ocean, Light Slate
- **💾 Auto-Save** — Everything persists in localStorage
- **☁️ Cloud Sync** — Tasks & attachments sync across all your devices via Cloudflare Workers (D1 + KV)
- **⌨️ Shortcuts** — `Ctrl+K` new task · `Ctrl+Shift+N` new board · `Esc` close modal
- **📱 Fully Responsive** — Phone, tablet & desktop

## 🛠️ How to Use

1. Open `index.html` in any browser — or better, host it on GitHub Pages / serve it locally (some browsers block IndexedDB file attachments when opened directly via `file://`, so a local server is recommended for full attachment support)
2. Enter the PIN to unlock (`2002`)
3. Optional: enable **Cloud sync** in Customize settings to keep tasks in sync across devices
3. Click a board, then **Add Task**
4. Drag & drop to reorder, check off to complete
5. Use the **palette** icon in the sidebar to switch theme / quote
6. Everything auto-saves — no login needed

## 💻 Tech Stack

- Pure HTML, CSS & JavaScript — no frameworks
- localStorage + IndexedDB for local persistence & cache
- **Cloudflare Workers + D1** for cloud state sync (optional)
- **Cloudflare Workers KV** for synced file attachments (optional — no payment method needed)
- Google Fonts: Syne + Space Grotesk
- Font Awesome Icons

## ☁️ Cloud Sync (Cloudflare Workers)

The app is **local-first**: it always works offline, and syncs to the cloud in the background when enabled. Your PIN is hashed (SHA-256) into a sync key — **enter the same PIN on every device to link them**, and sync turns on automatically the first time you unlock on a new device. Change the PIN and devices need the new PIN to stay linked.

### One-time deployment (you need a Cloudflare account)

```bash
cd worker
npx wrangler login
npx wrangler d1 create abbass-workspace          # copy the returned database_id
# paste database_id into wrangler.toml
npx wrangler d1 execute abbass-workspace --remote --file schema.sql
npx wrangler deploy
```

> ✅ **Status (Aug 2026):** deployed at
> `https://abbass-workspace-sync.techmindset-leb.workers.dev` with **D1 state sync**
> and **Workers KV attachment sync** both live. KV was chosen over R2 so no
> payment method is needed on the Cloudflare account.

Then just open the app on each device and **enter your PIN** — sync enables
**automatically** on unlock (the PIN is your sync identity; the Worker URL is
already prefilled). You only need to touch the toggle in Customize settings if
you want to turn sync **off** for a device, or point it at a different Worker.

> 💡 **KV consistency note:** Workers KV is eventually consistent — a file you
> attach on one device can take up to ~60 seconds to appear on another. That's
> the trade-off for zero-cost storage; state/tasks sync instantly via D1.

**Security note:** the sync key is derived from your 4-digit PIN — anyone who knows your PIN could read your synced data. It's a convenient personal setup, not strong security. For stricter protection, put Cloudflare Access in front of the worker or switch to a random token.

### API (worker/index.js)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/state?key=` | Fetch your workspace JSON |
| `PUT /api/state` | Push workspace (last-write-wins) |
| `PUT /api/files?key=&id=` | Upload an attachment (KV) |
| `GET /api/files?key=&id=` | Download an attachment |
| `DELETE /api/files?key=&id=` | Delete an attachment |

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#060609` |
| Surface | `rgba(255,255,255,0.03)` |
| Text | `#f4f4f2` |
| Accent | `#25c19b` |
| Accent 2 | `#8ef5d4` |
| Gradient | `120deg #25c19b → #8ef5d4` |

Made for Abbass by Abbass 🚀
