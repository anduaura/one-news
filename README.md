# One News

A site that shows exactly one top story per category per day. The page fits
the viewport, so there is nothing to scroll — pick a category and read.

**Live:** <https://anduaura.github.io/one-news/>

## How it works

- `index.html` / `styles.css` / `script.js` — a static, dependency-free page.
- `categories.json` — list of categories, each with a `slug`, `label`, RSS
  `feed`, and `source` name.
- `news.json` — a date-keyed map. Each day holds one entry per category slug.
  The page picks the visitor's local date; if today has no entry for the
  selected category, the most recent past entry for that category is shown.
- The selected category is remembered in `localStorage`.

## Run locally

Serve the directory with any static file server (the `fetch` for `news.json`
won't work over `file://`):

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Automation

`scripts/update-news.py` iterates over `categories.json`, fetches the top
item from each RSS feed, and writes it into `news.json` keyed by today's UTC
date and the category slug. It uses only the Python standard library, and
per-category failures don't abort the run.

`.github/workflows/daily-news.yml` runs the script every day at 06:05 UTC
and commits the change back to `main`. It can also be triggered manually
from the Actions tab. The workflow needs `contents: write` permission
(set in the workflow itself; if your org restricts the default `GITHUB_TOKEN`,
enable "Read and write" under Settings → Actions → General).

`.github/workflows/pages.yml` deploys the site to GitHub Pages on every push
to `main`. With Pages source set to **GitHub Actions**, the daily news commit
also redeploys automatically.

## Adding or changing categories

Edit `categories.json`:

```json
{
  "slug": "soccer",
  "label": "Soccer",
  "feed": "https://feeds.bbci.co.uk/sport/football/rss.xml",
  "source": "BBC Sport"
}
```

Any standard RSS 2.0 feed with `channel/item/{title,description,link}` works.
Add the entry, run the workflow once via "Run workflow" to seed today, and
the new tab appears on the page.

## Manual override

To pin a specific story for one category on one day, add `"manual": true`
to its entry and the daily script will leave it alone:

```json
"2026-05-01": {
  "soccer": {
    "headline": "Your headline here.",
    "summary": "One short paragraph.",
    "source": "Where it came from",
    "url": "https://example.com/article",
    "manual": true
  }
}
```

`url` and `source` are optional — leave them as empty strings to hide them.

## Deploy

Any static host works (GitHub Pages, Netlify, Vercel, S3, …). There is no
build step.
