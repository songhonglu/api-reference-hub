const dialog = document.querySelector("[data-search-dialog]");
const input = document.querySelector("#site-search");
const results = document.querySelector("[data-search-results]");
const moduleNavToggle = document.querySelector("[data-toggle-module-nav]");
let index = [];
let indexUnavailable = false;

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
            `<a href="${location.pathname.includes("/api/") ? "../" : ""}${item.url}"><small>${item.category} · ${item.endpointCount} 接口</small><strong>${item.title}</strong><span>${item.excerpt}</span></a>`,
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
moduleNavToggle?.addEventListener("click", () => {
  const expanded = document.body.classList.toggle("module-nav-open");
  moduleNavToggle.setAttribute("aria-expanded", String(expanded));
});
input?.addEventListener("input", () => renderResults(input.value));
document.addEventListener("keydown", (event) => {
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
