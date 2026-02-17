import { PROJECTS } from "./data/projects.js";

const el = (sel) => document.querySelector(sel);

const view = el("#view");
const splash = el("#splash");
const toast = el("#toast");

const EMAIL = "example@mail.com";
const PHONE_TEL = "+46700000000";
const PHONE_TEXT = "+46 70 000 00 00";

/* ============== Utils ============== */
const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("is-show");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => toast.classList.remove("is-show"), 1300);
}

function animateViewSwap(renderFn) {
  if (!view) return renderFn();

  if (prefersReducedMotion()) {
    renderFn();
    return;
  }

  view.classList.add("is-leaving");

  window.setTimeout(() => {
    renderFn();

    view.classList.remove("is-leaving");
    view.classList.add("is-entering");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        view.classList.remove("is-entering");
      });
    });
  }, 160);
}

function smoothScrollTop() {
  if (prefersReducedMotion()) {
    window.scrollTo(0, 0);
    return;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ============== Splash ============== */
function hideSplash() {
  splash?.classList.add("splash--hide");
}

function initSplash() {
  if (!splash) return;

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
  const emailValue = el("#emailValue");
  const phoneValue = el("#phoneValue");
  const phoneLink = el("#phoneLink");
  const emailBtn = el("#emailBtn");
  const contactBtn = el("#contactBtn");
  const contactWrap = el(".sidebar__contact");

  if (emailValue) emailValue.textContent = EMAIL;
  if (phoneValue) phoneValue.textContent = PHONE_TEXT;
  if (phoneLink) phoneLink.setAttribute("href", `tel:${PHONE_TEL}`);

  // Toggle panel (modern feel)
  if (contactWrap) contactWrap.hidden = true;

  emailBtn?.addEventListener("click", async () => {
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

  contactBtn?.addEventListener("click", () => {
    if (!contactWrap) return;
    contactWrap.hidden = !contactWrap.hidden;
    if (!contactWrap.hidden) {
      emailBtn?.focus();
      showToast("Contact details");
    }
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
function homeHtml() {
  setActiveNav(null);
  return `
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

function categoryHtml(categoryId) {
  setActiveNav(categoryId);

  const list = PROJECTS.filter((p) => p.category === categoryId);

  if (list.length === 0) {
    return `
      <div class="category">
        <div class="block-text">
          <h3>Inga projekt ännu</h3>
          <p>Lägg till projekt i <code>data/projects.js</code>.</p>
        </div>
      </div>
    `;
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

  return `
    <div class="category">
      <div class="grid">
        ${cards}
      </div>
    </div>
  `;
}

function projectHtml(projectId) {
  const p = PROJECTS.find((x) => x.id === projectId);

  if (!p) {
    setActiveNav(null);
    return `
      <div class="project">
        <div class="block-text">
          <h3>Projektet hittades inte</h3>
          <p>Gå tillbaka till <a href="#/category/projects">Projects</a>.</p>
        </div>
      </div>
    `;
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

  return `
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

/* ============== Render ============== */
let lastRouteKey = "";

function routeKey(route) {
  if (!route) return "";
  if (route.name === "home") return "home";
  if (route.name === "category") return `category:${route.categoryId}`;
  if (route.name === "project") return `project:${route.projectId}`;
  return "home";
}

function render() {
  const route = parseRoute();
  const key = routeKey(route);

  const doRender = () => {
    if (route.name === "home") {
      view.innerHTML = homeHtml();
      return;
    }
    if (route.name === "category") {
      view.innerHTML = categoryHtml(route.categoryId);
      return;
    }
    if (route.name === "project") {
      view.innerHTML = projectHtml(route.projectId);
      return;
    }
    view.innerHTML = homeHtml();
  };

  const changed = key !== lastRouteKey;
  lastRouteKey = key;

  if (changed) smoothScrollTop();

  animateViewSwap(doRender);
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
