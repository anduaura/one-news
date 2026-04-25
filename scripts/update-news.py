#!/usr/bin/env python3
"""Fetch the top story for each category in categories.json and update news.json.

Runs daily via .github/workflows/daily-news.yml. Stdlib-only so no install
step is needed in CI. Per-category failures are logged but do not abort
the run; entries already present remain in place.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NEWS_FILE = ROOT / "news.json"
CATEGORIES_FILE = ROOT / "categories.json"
TIMEOUT_SECONDS = 30
MAX_SUMMARY_CHARS = 320
USER_AGENT = "one-news/1.0 (+https://github.com/anduaura/one-news)"


def fetch_top_story(feed_url: str, source: str) -> dict:
    req = urllib.request.Request(feed_url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
        body = resp.read()
    root = ET.fromstring(body)
    item = root.find("./channel/item")
    if item is None:
        raise RuntimeError("RSS feed contained no <item> elements")

    title = (item.findtext("title") or "").strip()
    description = (item.findtext("description") or "").strip()
    link = (item.findtext("link") or "").strip()

    description = re.sub(r"<[^>]+>", "", description).strip()
    if len(description) > MAX_SUMMARY_CHARS:
        description = description[: MAX_SUMMARY_CHARS - 1].rstrip() + "…"

    if not title:
        raise RuntimeError("Top item missing a title")

    return {
        "headline": title,
        "summary": description,
        "source": source,
        "url": link,
    }


def load_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text())


def save_entries(entries: dict) -> None:
    ordered = {key: entries[key] for key in sorted(entries.keys(), reverse=True)}
    NEWS_FILE.write_text(json.dumps(ordered, indent=2) + "\n")


def main() -> int:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    categories = load_json(CATEGORIES_FILE, [])
    entries = load_json(NEWS_FILE, {})
    day = entries.setdefault(today, {})

    changed = False
    failures: list[str] = []

    for cat in categories:
        slug = cat["slug"]
        existing = day.get(slug)
        if isinstance(existing, dict) and existing.get("manual"):
            print(f"[{slug}] keeping manual entry")
            continue
        try:
            story = fetch_top_story(cat["feed"], cat["source"])
        except Exception as err:
            failures.append(f"{slug}: {err}")
            print(f"[{slug}] fetch failed: {err}", file=sys.stderr)
            continue
        if existing == story:
            print(f"[{slug}] no change: {story['headline']}")
            continue
        day[slug] = story
        changed = True
        print(f"[{slug}] updated: {story['headline']}")

    if changed:
        save_entries(entries)
    else:
        print("No changes to write.")

    return 1 if failures and not changed else 0


if __name__ == "__main__":
    sys.exit(main())
