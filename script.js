const todayKey = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDate = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const pickStory = (entries, key) => {
  if (entries[key]) return entries[key];
  const past = Object.keys(entries)
    .filter((k) => k <= key)
    .sort();
  return past.length ? entries[past[past.length - 1]] : null;
};

const render = (story, key) => {
  document.getElementById("date").textContent = formatDate(key);
  const article = document.querySelector(".story");
  const empty = document.getElementById("empty");

  if (!story) {
    article.hidden = true;
    empty.hidden = false;
    return;
  }

  document.getElementById("category").textContent = story.category || "Today";
  document.getElementById("headline").textContent = story.headline || "";
  document.getElementById("summary").textContent = story.summary || "";
  document.getElementById("source").textContent = story.source
    ? `Source: ${story.source}`
    : "";

  const link = document.getElementById("link");
  if (story.url) {
    link.href = story.url;
    link.hidden = false;
  } else {
    link.hidden = true;
  }
  article.hidden = false;
};

(async () => {
  const key = todayKey();
  try {
    const res = await fetch(`news.json?_=${key}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    render(pickStory(data, key), key);
  } catch (err) {
    console.error("Failed to load news", err);
    render(null, key);
  }
})();
