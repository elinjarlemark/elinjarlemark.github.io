import { PROJECTS } from "./data/projects.js";

const el = (sel) => document.querySelector(sel);

const view = el("#view");
const splash = el("#splash");
const toast = el("#toast");

const EMAIL = "pippilover@mail.com";
const PHONE_TEL = "+46700000000";
const PHONE_TEXT = "+46 70 000 00 00";

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("is-show");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => toast.classList.remove("is-show"), 1200);
}

/* ============== Splash ============== */
function hideSplash() {
  splash.classList.add("splash--hide");
}
function initSplash() {
  const already = sessionStorage.getItem("seenSplash");
  if (already) {
    hideSplash();
    return;
  }

  const go = () => {
    sessionStorage.setItem("seenSplash", "1");
    hideSplash();
    if (!location.hash || location.hash === "#") location.hash = "#/home";
  };

  const t = window.setTimeout(go, 2500);
  const onAny = () => {
    window.clearTimeout(t);
    go();
  };

  splash.addEventListener("click", onAny, { once: true });
  window.addEventListener("keydown", onAny, { once: true });
}

/* ============== Contact ============== */
function initContact() {
  el("#emailValue").textContent = EMAIL;
  el("#phoneValue").textContent = PHONE_TEXT;
  el("#phoneLink").setAttribute("href", `tel:${PHONE_TEL}`);

  el("#emailBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      showToast("Copied email!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = EMAIL;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      showToast("Copied email!");
    }
  });

  el("#contactBtn").addEventListener("click", () => {
    el("#emailBtn")?.focus();
  });
}

/* ============== Routing ============== */
function parseRoute() {
  const hash = location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);

  if (parts.length === 0) return { name: "home" };

  if (parts[0] === "home") return { name: "home" };
  if (parts[0] === "category") return { name: "category", categoryId: parts[1] || "projects" };
  if (parts[0] === "project") return { name: "project", projectId: parts[1] };

  return { name: "home" };
}

function setActiveNav(categoryId) {
  document.querySelectorAll(".topnav__link").forEach((a) => a.classList.remove("is-active"));
  if (!categoryId) return;

  const a = document.querySelector(`.topnav__link[data-nav="${categoryId}"]`);
  if (a) a.classList.add("is-active");
}

/* ============== Views ============== */
function renderHome() {
  setActiveNav(null);

  view.innerHTML = `
    <div class="home">
      <div class="home__img">
        <img src="./assets/me.jpg" alt="Porträtt" />
      </div>
      <div class="home__text">
        <p>
          Genuin passion för kreativ och strategisk kommunikation som skapar meningsfull påverkan genom tydlig målgruppsförståelse.
          Social, uppmärksam och engagerad. Mångsidig generalist som är trygg i hela processen, från idé till produktion,
          genomförande och analys.
        </p>
      </div>
    </div>
  `;
}

function renderCategory(categoryId) {
  setActiveNav(categoryId);

  const list = PROJECTS.filter((p) => p.category === categoryId);

  if (list.length === 0) {
    view.innerHTML = `
      <div class="category">
        <div class="block-text">
          <h3>Inga projekt ännu</h3>
          <p>Lägg till projekt i <code>data/projects.js</code>.</p>
        </div>
      </div>
    `;
    return;
  }

  const cards = list.map((p) => `
    <article class="card">
      <img class="card__img" src="${p.coverImage}" alt="${escapeHtml(p.teaserAlt || p.title)}" />
      <div class="card__overlay">
        <div class="card__title">${escapeHtml(p.title)}</div>
      </div>
      <a class="card__link" href="#/project/${encodeURIComponent(p.id)}" aria-label="Öppna ${escapeHtml(p.title)}"></a>
    </article>
  `).join("");

  view.innerHTML = `
    <div class="category">
      <div class="grid">
        ${cards}
      </div>
    </div>
  `;
}

function renderProject(projectId) {
  const p = PROJECTS.find((x) => x.id === projectId);

  if (!p) {
    view.innerHTML = `
      <div class="project">
        <div class="block-text">
          <h3>Projektet hittades inte</h3>
          <p>Gå tillbaka till <a href="#/category/projects">Projects</a>.</p>
        </div>
      </div>
    `;
    setActiveNav(null);
    return;
  }

  setActiveNav(p.category);

  const blocksHtml = (p.blocks || []).map((b) => {
    if (b.type === "text") {
      return `
        <section class="block-text">
          ${b.heading ? `<h3>${escapeHtml(b.heading)}</h3>` : ""}
          ${b.text ? `<p>${escapeHtml(b.text)}</p>` : ""}
        </section>
      `;
    }
    if (b.type === "image") {
      return `
        <figure class="block-image">
          <img src="${b.src}" alt="${escapeHtml(b.alt || p.title)}" />
          ${b.caption ? `<figcaption class="block-caption">${escapeHtml(b.caption)}</figcaption>` : ""}
        </figure>
      `;
    }
    return "";
  }).join("");

  view.innerHTML = `
    <article class="project">
      <div class="project__header">
        <h1 class="project__title">${escapeHtml(p.title)}</h1>
        <div class="project__meta">${escapeHtml(p.year || "")}</div>
      </div>

      <div class="blocks">
        ${blocksHtml}
      </div>
    </article>
  `;
}

function render() {
  const route = parseRoute();
  if (route.name === "home") return renderHome();
  if (route.name === "category") return renderCategory(route.categoryId);
  if (route.name === "project") return renderProject(route.projectId);
  renderHome();
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ============== Boot ============== */
function ensureInitialHash() {
  if (!location.hash || location.hash === "#") location.hash = "#/home";
}

window.addEventListener("hashchange", render);

ensureInitialHash();
initSplash();
initContact();
render();
