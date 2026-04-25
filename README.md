# One News

A site that shows exactly one top story per day. The page fits the viewport,
so there is nothing to scroll.

**Live:** <https://anduaura.github.io/one-news/>

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

## Automation

`scripts/update-news.py` fetches the top item from the BBC News RSS feed
(`https://feeds.bbci.co.uk/news/rss.xml`) and writes it into `news.json`
keyed by today's UTC date. It uses only the Python standard library.

`.github/workflows/daily-news.yml` runs the script every day at 06:05 UTC
and commits the change back to the branch. It can also be triggered
manually from the Actions tab. The workflow needs `contents: write`
permission on the repository (set in the workflow itself; if your org
restricts default `GITHUB_TOKEN` permissions, enable "Read and write"
under Settings → Actions → General).

To swap sources, edit `FEED_URL` and `SOURCE_NAME` at the top of
`scripts/update-news.py`. Any standard RSS 2.0 feed works (NPR, Guardian,
Al Jazeera, etc.).

## Manual override

You can still pin a specific story for a given day. Add `"manual": true`
to the entry and the daily script will leave it alone:

```json
"2026-05-01": {
  "category": "Top Story",
  "headline": "Your headline here.",
  "summary": "One short paragraph. Keep it readable in a single screen.",
  "source": "Where it came from",
  "url": "https://example.com/article",
  "manual": true
}
```

`url` and `source` are optional — leave them as empty strings to hide them.

## Deploy

Any static host works (GitHub Pages, Netlify, Vercel, S3, …). There is no
build step. For GitHub Pages, point Pages at the same branch the workflow
commits to so the daily update goes live automatically.
