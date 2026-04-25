const STORAGE_KEY = "one-news.category";
const DEFAULT_SLUG = "top";

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

const pickStory = (entries, dateKey, slug) => {
  const dates = Object.keys(entries)
    .filter((k) => k <= dateKey)
    .sort()
    .reverse();
  for (const d of dates) {
    const day = entries[d];
    if (day && day[slug]) return { story: day[slug], date: d };
  }
  return { story: null, date: null };
};

const renderTabs = (categories, activeSlug, onSelect) => {
  const nav = document.getElementById("tabs");
  nav.innerHTML = "";
  for (const cat of categories) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab";
    btn.textContent = cat.label;
    btn.dataset.slug = cat.slug;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", String(cat.slug === activeSlug));
    btn.addEventListener("click", () => onSelect(cat.slug));
    nav.appendChild(btn);
  }
};

const setActiveTab = (slug) => {
  for (const btn of document.querySelectorAll(".tab")) {
    btn.setAttribute("aria-selected", String(btn.dataset.slug === slug));
  }
};

const renderStory = (category, story, storyDate, todayDateKey) => {
  const article = document.querySelector(".story");
  const empty = document.getElementById("empty");

  if (!story) {
    article.hidden = true;
    empty.hidden = false;
    return;
  }

  document.getElementById("category").textContent = category.label;
  document.getElementById("headline").textContent = story.headline || "";
  document.getElementById("summary").textContent = story.summary || "";

  const sourceParts = [];
  if (story.source) sourceParts.push(story.source);
  if (storyDate && storyDate !== todayDateKey) sourceParts.push(formatDate(storyDate));
  document.getElementById("source").textContent = sourceParts.join(" · ");

  const link = document.getElementById("link");
  if (story.url) {
    link.href = story.url;
    link.hidden = false;
  } else {
    link.hidden = true;
  }
  article.hidden = false;
  empty.hidden = true;
};

const fetchJSON = async (path, cacheBuster) => {
  const res = await fetch(`${path}?_=${cacheBuster}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.json();
};

(async () => {
  const todayDateKey = todayKey();
  document.getElementById("date").textContent = formatDate(todayDateKey);

  let categories, entries;
  try {
    [categories, entries] = await Promise.all([
      fetchJSON("categories.json", todayDateKey),
      fetchJSON("news.json", todayDateKey),
    ]);
  } catch (err) {
    console.error("Failed to load data", err);
    document.getElementById("empty").hidden = false;
    return;
  }

  const slugs = new Set(categories.map((c) => c.slug));
  const stored = localStorage.getItem(STORAGE_KEY);
  let active = stored && slugs.has(stored) ? stored : DEFAULT_SLUG;
  if (!slugs.has(active)) active = categories[0]?.slug;

  const show = (slug) => {
    const category = categories.find((c) => c.slug === slug);
    if (!category) return;
    localStorage.setItem(STORAGE_KEY, slug);
    setActiveTab(slug);
    const { story, date } = pickStory(entries, todayDateKey, slug);
    renderStory(category, story, date, todayDateKey);
  };

  renderTabs(categories, active, show);
  show(active);
})();
