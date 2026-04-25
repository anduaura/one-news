# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

One News is a static site that shows **one top story per category per day**, sized to fit the viewport so the reader never has to scroll. Categories are presented as a tab bar; the reader sees a single article at a time. Live at <https://anduaura.github.io/one-news/>.

There is no build step, no package manager, and no runtime dependencies. The page is plain HTML/CSS/JS; data lives in two JSON files at the repo root.

## Commands

```sh
# Serve locally — fetch() against news.json needs a real http origin
python3 -m http.server 8000

# Run the daily fetcher manually (writes today's UTC entry per category)
python3 scripts/update-news.py

# Validate the data files
python3 -c "import json; json.load(open('news.json')); json.load(open('categories.json'))"
```

There are no tests, linters, or formatters configured; do not invent commands for them.

## Architecture

Four pieces, loosely coupled by the two JSON files:

1. **Static page** (`index.html`, `styles.css`, `script.js`) — `script.js` loads `categories.json` and `news.json` in parallel, renders the tab bar, and picks the story for the active category for the visitor's **local** `YYYY-MM-DD`. If that day×category cell is empty, it falls back to the most recent past entry **for that category** (not just the most recent date overall — important when a feed misses a day). The active category persists in `localStorage` under `one-news.category`. The viewport is locked (`100dvh`, `overflow: hidden`); the tabs row scrolls horizontally but the body never scrolls — preserve that constraint.

2. **Categories config** (`categories.json`) — array of `{slug, label, feed, source}`. The page uses `slug`/`label`; the fetcher uses `feed`/`source`. Single source of truth — adding a category here is enough to make a tab appear and start populating data on the next workflow run.

3. **Daily fetcher** (`scripts/update-news.py`) — stdlib-only Python. Iterates `categories.json`; for each, pulls the first `<item>` from the feed, strips HTML, trims to `MAX_SUMMARY_CHARS`, and writes it under `news.json[today][slug]` using today's **UTC** date. Per-category failures are logged and skipped without aborting the run; `manual: true` on a per-category entry pins it. Note the timezone mismatch with the page (page = local, fetcher = UTC) is intentional and load-bearing — the page's past-entry fallback covers the window where today's UTC entry doesn't exist yet for users west of UTC.

4. **GitHub Actions workflows**:
   - `.github/workflows/daily-news.yml` — runs the fetcher at 06:05 UTC daily plus on `workflow_dispatch`, commits to `main` only when `news.json` changes.
   - `.github/workflows/pages.yml` — deploys the repo root to GitHub Pages on every push to `main` (Pages source must be set to **GitHub Actions** in repo settings).

### `news.json` contract

```jsonc
{
  "2026-04-25": {              // ISO date key, UTC for bot writes
    "top":    { "headline": "...", "summary": "...", "source": "BBC News", "url": "..." },
    "soccer": { ... },
    "us":     { ... }
    // ... one entry per category slug present that day
  }
}
```

Each story object: `headline`, `summary`, `source`, `url` (all strings; `url`/`source` may be empty). Optional `manual: true` flag tells the fetcher to leave that exact day×category entry alone — preserve this behavior in `update-news.py::main` if you refactor. Entries are written sorted by date descending; keep that ordering when editing programmatically.

The `category` display label comes from `categories.json[].label`, **not** from the story object — do not reintroduce a per-story `category` field.

## Conventions

- **Default branch is `main`.** Commit there directly; the workflows push to and deploy from `main`.
- **No build artifacts in the repo.** Pages serves files as-is from the repo root; any new tooling must not require a build step to view the site.
- **Stdlib-only for the fetcher.** Do not add `requests`, `feedparser`, etc.; the workflow installs nothing.
- **One feed per category, one item per day.** The site's promise is exactly one story per category per day — don't introduce lists, carousels, or "more stories" affordances.
- **Keep the body unscrollable.** New UI goes inside `#app`'s flex column with sensible flex sizing; only `.tabs` may scroll (horizontally).
