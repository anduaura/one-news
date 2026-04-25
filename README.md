# One News

A site that shows exactly one top story per day. The page fits the viewport,
so there is nothing to scroll.

## How it works

- `index.html` / `styles.css` / `script.js` — a static, dependency-free page.
- `news.json` — a date-keyed map of stories. The page picks the entry whose
  key matches the visitor's local date. If today has no entry, the most recent
  past entry is shown; if there are none, an empty-state message appears.

## Run locally

Serve the directory with any static file server (the `fetch` for `news.json`
won't work over `file://`):

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Add a story

Edit `news.json` and add a new entry keyed by an ISO date (`YYYY-MM-DD`):

```json
"2026-05-01": {
  "category": "Top Story",
  "headline": "Your headline here.",
  "summary": "One short paragraph. Keep it readable in a single screen.",
  "source": "Where it came from",
  "url": "https://example.com/article"
}
```

`url` and `source` are optional — leave them as empty strings to hide them.

## Deploy

Any static host works (GitHub Pages, Netlify, Vercel, S3, …). There is no
build step.
