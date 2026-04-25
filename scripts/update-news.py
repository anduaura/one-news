#!/usr/bin/env python3
"""Fetch the top news story from a public RSS feed and update news.json.

Runs daily via .github/workflows/daily-news.yml. Stdlib-only so no install
step is needed in CI.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

FEED_URL = "https://feeds.bbci.co.uk/news/rss.xml"
SOURCE_NAME = "BBC News"
NEWS_FILE = Path(__file__).resolve().parent.parent / "news.json"
TIMEOUT_SECONDS = 30
MAX_SUMMARY_CHARS = 320


def fetch_top_story() -> dict:
    req = urllib.request.Request(FEED_URL, headers={"User-Agent": "one-news/1.0"})
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
        "category": "Top Story",
        "headline": title,
        "summary": description,
        "source": SOURCE_NAME,
        "url": link,
    }


def load_entries() -> dict:
    if not NEWS_FILE.exists():
        return {}
    return json.loads(NEWS_FILE.read_text())


def save_entries(entries: dict) -> None:
    ordered = {key: entries[key] for key in sorted(entries.keys(), reverse=True)}
    NEWS_FILE.write_text(json.dumps(ordered, indent=2) + "\n")


def main() -> int:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    entries = load_entries()

    existing = entries.get(today)
    if isinstance(existing, dict) and existing.get("manual"):
        print(f"Keeping manual entry for {today}")
        return 0

    story = fetch_top_story()
    if existing == story:
        print(f"No change for {today}: {story['headline']}")
        return 0

    entries[today] = story
    save_entries(entries)
    print(f"Updated {today}: {story['headline']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
