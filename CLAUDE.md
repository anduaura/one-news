# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

One News is a static site that shows exactly **one top story per day**, sized to fit the viewport so the reader never has to scroll. Live at <https://anduaura.github.io/one-news/>.

There is no build step, no package manager, and no runtime dependencies. The page is plain HTML/CSS/JS and the data file is a hand- and bot-edited JSON map.

## Commands

```sh
# Serve locally — fetch() against news.json needs a real http origin
python3 -m http.server 8000

# Run the daily fetcher manually (writes today's UTC entry into news.json)
python3 scripts/update-news.py

# Validate the data file
python3 -c "import json; json.load(open('news.json'))"
```

There are no tests, linters, or formatters configured; do not invent commands for them.

## Architecture

Three pieces, loosely coupled by `news.json`:

1. **Static page** (`index.html`, `styles.css`, `script.js`) — `script.js` fetches `news.json`, picks the entry whose key matches the visitor's **local** `YYYY-MM-DD`, and falls back to the most recent past entry when today has none. The viewport is locked (`100dvh`, `overflow: hidden`) so layout regressions show up as clipped content rather than scroll bars — preserve that constraint.

2. **Daily fetcher** (`scripts/update-news.py`) — stdlib-only Python. Pulls the first `<item>` from the RSS feed at `FEED_URL` (BBC News by default), strips HTML, trims to `MAX_SUMMARY_CHARS`, and writes it into `news.json` keyed by today's **UTC** date. Note the timezone mismatch with the page (page = local, fetcher = UTC); this is intentional and load-bearing — the page's past-entry fallback covers the window where today's UTC entry doesn't exist yet for users west of UTC.

3. **GitHub Actions workflow** (`.github/workflows/daily-news.yml`) — runs the fetcher at 06:05 UTC daily plus on `workflow_dispatch`, and commits to `main` only when `news.json` changes. GitHub Pages then redeploys.

### `news.json` contract

A flat object keyed by `YYYY-MM-DD`. Each entry: `category`, `headline`, `summary`, `source`, `url`. An optional `manual: true` flag tells the fetcher to leave that day's entry alone — preserve this behavior in `update-news.py::main` if you refactor it. Entries are written sorted by date descending; keep that ordering when editing programmatically.

## Conventions

- **Default branch is `main`.** Commit there directly; the workflow also pushes to `main`.
- **No build artifacts in the repo.** If you add tooling, ensure it doesn't require a build step to view the site — Pages serves files as-is from the repo root.
- **Stdlib-only for the fetcher.** Do not add `requests`, `feedparser`, etc.; the workflow installs nothing.
- **Swap RSS sources by editing `FEED_URL` and `SOURCE_NAME`** at the top of `scripts/update-news.py`. Any RSS 2.0 feed with `channel/item/{title,description,link}` works.
