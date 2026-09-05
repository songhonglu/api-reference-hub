const dialog = document.querySelector("[data-search-dialog]");
const input = document.querySelector("#site-search");
const results = document.querySelector("[data-search-results]");
const moduleNavToggle = document.querySelector("[data-toggle-module-nav]");
const headingNavToggle = document.querySelector("[data-toggle-heading-nav]");
const moduleNavigation = document.querySelector("#module-navigation");
const headingNavigation = document.querySelector("#heading-navigation");
let index = [];
let indexUnavailable = false;

function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}

async function loadIndex() {
  if (index.length > 0) return index;
  const prefix = location.pathname.includes("/api/") ? "../" : "";
  try {
    const response = await fetch(`${prefix}search-index.json`);
    if (!response.ok) throw new Error("Search index is unavailable");
    index = await response.json();
  } catch {
    indexUnavailable = true;
  }
  return index;
}

function renderResults(query) {
  if (indexUnavailable) {
    results.innerHTML =
      '<p class="search-empty">检索索引暂不可用，请通过文档目录浏览。</p>';
    return;
  }
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) {
    results.innerHTML =
      '<p class="search-empty">输入关键词以检索全部模块。</p>';
    return;
  }
  const matches = index
    .filter((item) =>
      `${item.title} ${item.category} ${item.excerpt}`
        .toLocaleLowerCase()
        .includes(normalized),
    )
    .slice(0, 12);
  results.innerHTML = matches.length
    ? matches
        .map(
          (item) =>
            `<a href="${location.pathname.includes("/api/") ? "../" : ""}${item.url}"><small>${escapeHtml(item.category)} · ${item.endpointCount} 接口</small><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.excerpt)}</span></a>`,
        )
        .join("")
    : '<p class="search-empty">没有匹配项。请尝试模块名称、业务名称或接口关键词。</p>';
}

async function openSearch() {
  dialog.showModal();
  await loadIndex();
  renderResults(input.value);
  input.focus();
}

document
  .querySelectorAll("[data-open-search]")
  .forEach((button) => button.addEventListener("click", openSearch));
function closeDrawer(openClass, toggle) {
  document.body.classList.remove(openClass);
  toggle?.setAttribute("aria-expanded", "false");
}

function toggleDrawer(openClass, toggle, panel, otherOpenClass, otherToggle) {
  const expanded = !document.body.classList.contains(openClass);
  document.body.classList.toggle(openClass, expanded);
  toggle.setAttribute("aria-expanded", String(expanded));
  if (!expanded) return;
  closeDrawer(otherOpenClass, otherToggle);
  panel?.querySelector("a")?.focus();
}

moduleNavToggle?.addEventListener("click", () =>
  toggleDrawer(
    "module-nav-open",
    moduleNavToggle,
    moduleNavigation,
    "heading-nav-open",
    headingNavToggle,
  ),
);
headingNavToggle?.addEventListener("click", () =>
  toggleDrawer(
    "heading-nav-open",
    headingNavToggle,
    headingNavigation,
    "module-nav-open",
    moduleNavToggle,
  ),
);
document.querySelectorAll(".module-nav a").forEach((link) =>
  link.addEventListener("click", () => {
    closeDrawer("module-nav-open", moduleNavToggle);
  }),
);
document.querySelectorAll(".heading-nav a").forEach((link) =>
  link.addEventListener("click", () => {
    closeDrawer("heading-nav-open", headingNavToggle);
  }),
);
const headingLinks = [...document.querySelectorAll("[data-heading-link]")];
const headings = headingLinks
  .map((link) => document.getElementById(link.hash.slice(1)))
  .filter(Boolean);
const markHeading = (currentId) => {
  headingLinks.forEach((link) =>
    link.classList.toggle("is-current-heading", link.hash === `#${currentId}`),
  );
};
if (headings.length > 0) {
  markHeading(headings[0].id);
  const headingObserver = new IntersectionObserver(
    (entries) => {
      const current = entries.find((entry) => entry.isIntersecting)?.target.id;
      if (current) markHeading(current);
    },
    { root: document.querySelector(".article"), rootMargin: "-15% 0px -70%" },
  );
  headings.forEach((heading) => headingObserver.observe(heading));
}
input?.addEventListener("input", () => renderResults(input.value));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDrawer("module-nav-open", moduleNavToggle);
    closeDrawer("heading-nav-open", headingNavToggle);
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  }
});
document.querySelectorAll("[data-copy-code]").forEach((button) =>
  button.addEventListener("click", async () => {
    const code = button.parentElement.querySelector("code").innerText;
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = "已复制";
    } catch {
      button.textContent = "复制失败";
    }
    setTimeout(() => {
      button.textContent = "复制";
    }, 1400);
  }),
);
