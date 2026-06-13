// pluszehn Lead-Engine — Frontend (Vanilla JS, keine Build-Tools).

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let CONFIG = null;
let lastResults = [];
let map = null;
let markers = [];
let crmFilter = "alle";

// --- Init -------------------------------------------------------------------
async function init() {
  CONFIG = await fetch("/api/config").then((r) => r.json());
  $("#tagline").textContent = CONFIG.company.tagline;
  $("#footContact").innerHTML =
    `pluszehn · ${esc(CONFIG.company.owner)} · ${esc(CONFIG.company.phone)} · ` +
    `<a href="mailto:${CONFIG.company.email}" style="color:var(--accent)">${esc(CONFIG.company.email)}</a>`;

  // Modus-Badges
  const m = $("#modes");
  m.append(badge(CONFIG.modes.google, "Google Maps live", "Demo-Daten"));
  m.append(badge(CONFIG.modes.claude, "Claude-Mails live", "Vorlagen-Mails"));

  // Branchen
  const b = $("#branche");
  b.append(new Option("— Branche wählen —", ""));
  CONFIG.branchen.forEach((x) => b.append(new Option(x.label, x.query)));
  // Städte
  const dl = $("#cityList");
  CONFIG.cities.forEach((c) => dl.append(new Option(c)));
  $("#city").value = "Bühl";

  initMap();
  bindEvents();
  refreshCrmCount();
}

function badge(live, onText, offText) {
  const e = el("span", "mode-badge " + (live ? "live" : "demo"));
  e.textContent = (live ? "● " : "○ ") + (live ? onText : offText);
  return e;
}

function bindEvents() {
  $("#searchBtn").addEventListener("click", runSearch);
  $("#city").addEventListener("keydown", (e) => e.key === "Enter" && runSearch());
  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => switchTab(t.dataset.tab))
  );
  $("#mailClose").addEventListener("click", () => $("#mailModal").classList.add("hidden"));
  $("#mailCopy").addEventListener("click", copyMail);
  $("#mailMailto").addEventListener("click", openMailto);
}

function switchTab(tab) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  $("#view-" + tab).classList.add("active");
  if (tab === "crm") loadCrm();
  if (tab === "suche") setTimeout(() => map && map.invalidateSize(), 50);
}

// --- Suche ------------------------------------------------------------------
async function runSearch() {
  const branche = $("#branche").value || $("#branche").selectedOptions[0]?.text || "";
  const brancheLabel = $("#branche").selectedOptions[0]?.text || branche;
  const city = $("#city").value.trim();
  const filter = $("#filter").value;
  const btn = $("#searchBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Suche läuft …';
  $("#results").innerHTML = "";
  try {
    const data = await fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ branche: brancheLabel === "— Branche wählen —" ? "" : brancheLabel, city, filter }),
    }).then((r) => r.json());
    window.__lastTotal = data.total;
    lastResults = data.leads || [];
    renderResults();
  } catch (e) {
    $("#results").innerHTML = `<div class="empty">Fehler bei der Suche: ${esc(e.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Betriebe finden";
  }
}

function renderResults() {
  const wrap = $("#results");
  wrap.innerHTML = "";
  if (!lastResults.length) {
    wrap.innerHTML = `<div class="empty">Keine passenden Betriebe. Tipp: Filter auf „Alle anzeigen" stellen oder andere Branche/Stadt probieren.</div>`;
    setMarkers([]);
    return;
  }
  $("#searchHint").style.display = "none";
  const total = window.__lastTotal;
  if (total && total > lastResults.length) {
    wrap.append(
      el("div", "result-info",
        `${lastResults.length} relevante Betriebe (schlechteste zuerst) · ` +
        `${total - lastResults.length} Top-Betriebe ausgeblendet`)
    );
  }
  lastResults.forEach((lead, i) => wrap.append(leadCard(lead, i)));
  setMarkers(lastResults);
}

function leadCard(lead, idx) {
  const c = el("div", "card");
  const pain = lead.pain;
  const socials = Object.entries(lead.socials || {})
    .map(([k, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(k)}</a>`)
    .join("");

  const neg = pain?.negativeReviews || [];
  const negBlock = neg.length
    ? `<div class="pain">
         <div class="pain-head">
           <span class="neg-badge">⚠ ${neg.length} schlechte Bewertung${neg.length > 1 ? "en" : ""}</span>
           <span class="conf">Ansatzpunkt: ${esc(pain?.bestSolution?.name || "Automatisierung")}</span>
         </div>
         <ul class="evidence">${neg.map((r) => `<li><span class="stars">${"★".repeat(r.rating || 1)}</span> „${esc(r.text)}"</li>`).join("")}</ul>
       </div>`
    : `<div class="pain muted-pain">Keine negativen Bewertungstexte sichtbar — Ansatz: allgemeiner KI-Check (${esc(pain?.bestSolution?.name || "Automatisierung")}).</div>`;

  const ratingClass = lead.rating != null && lead.rating <= 3.5 ? "bad" : lead.rating != null && lead.rating <= 4.2 ? "mid" : "";

  c.innerHTML = `
    <div class="card-top">
      <div>
        <h3>${esc(lead.name)}</h3>
        <div class="sub">${esc(lead.branche || lead.type)} · ${esc(lead.city)} · ${esc(lead.address || "")}</div>
      </div>
      <div class="rating ${ratingClass}">${lead.rating ? "★ " + lead.rating : "–"} <span class="count">(${lead.reviewCount || 0})</span></div>
    </div>
    <div class="contact">
      ${lead.phone ? `<a href="tel:${esc(lead.phone)}">📞 ${esc(lead.phone)}</a>` : ""}
      ${lead.email ? `<a href="mailto:${esc(lead.email)}">✉ ${esc(lead.email)}</a>` : `<span style="color:var(--muted)">✉ keine E-Mail gefunden</span>`}
      ${lead.website ? `<a href="${esc(lead.website)}" target="_blank" rel="noopener">🌐 Website</a>` : ""}
      ${lead.mapsUrl ? `<a href="${esc(lead.mapsUrl)}" target="_blank" rel="noopener">📍 Maps</a>` : ""}
      ${socials ? `<span class="socials">${socials}</span>` : ""}
    </div>
    ${negBlock}
    <div class="card-actions">
      <button class="primary act-mail">Mail erzeugen</button>
      <button class="ghost act-save">${lead.inCrm ? "✓ im CRM" : "Im CRM speichern"}</button>
    </div>`;

  c.querySelector(".act-mail").addEventListener("click", (ev) => generateForLead(lead, ev.target));
  const saveBtn = c.querySelector(".act-save");
  saveBtn.addEventListener("click", async () => {
    await saveLead(lead);
    lead.inCrm = true;
    saveBtn.textContent = "✓ im CRM";
    refreshCrmCount();
  });
  return c;
}

// --- Mail erzeugen ----------------------------------------------------------
async function generateForLead(lead, btn) {
  const old = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Claude schreibt …';
  try {
    const data = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lead }),
    }).then((r) => r.json());
    lead.generatedMail = data.email;
    openMailModal(lead, data.email);
    // direkt mit ablegen, falls schon im CRM
    if (lead.inCrm) saveLead({ ...lead, generatedMail: data.email });
  } catch (e) {
    alert("Konnte keine Mail erzeugen: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
}

let modalCtx = null;
function openMailModal(lead, email) {
  modalCtx = { lead, email };
  $("#mailMeta").innerHTML =
    `${esc(lead.name)} · ${esc(lead.email || "keine E-Mail")} · ` +
    `Quelle: ${email.model === "vorlage" ? "Vorlage" : "Claude (" + esc(email.model) + ")"}` +
    (email.warning ? ` · <span style="color:var(--warn)">${esc(email.warning)}</span>` : "");
  $("#mailSubject").value = email.subject || "";
  $("#mailBody").value = email.body || "";
  $("#mailModal").classList.remove("hidden");
}

function copyMail() {
  const txt = `Betreff: ${$("#mailSubject").value}\n\n${$("#mailBody").value}`;
  navigator.clipboard.writeText(txt).then(() => {
    const b = $("#mailCopy");
    b.textContent = "✓ kopiert";
    setTimeout(() => (b.textContent = "Text kopieren"), 1500);
  });
}

function openMailto() {
  const to = modalCtx?.lead?.email || "";
  const url =
    `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent($("#mailSubject").value)}` +
    `&body=${encodeURIComponent($("#mailBody").value)}`;
  window.location.href = url;
}

// --- CRM --------------------------------------------------------------------
async function saveLead(lead) {
  const payload = { ...lead };
  delete payload.inCrm;
  await fetch("/api/lead", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lead: payload }),
  });
}

async function refreshCrmCount() {
  const data = await fetch("/api/crm").then((r) => r.json());
  $("#crmCount").textContent = data.leads.length;
}

async function loadCrm() {
  const data = await fetch("/api/crm").then((r) => r.json());
  renderStageFilter(data.stages, data.leads);
  renderCrm(data.leads, data.stages);
  $("#crmCount").textContent = data.leads.length;
}

function renderStageFilter(stages, leads) {
  const wrap = $("#stageFilter");
  wrap.innerHTML = "";
  const counts = { alle: leads.length };
  stages.forEach((s) => (counts[s] = leads.filter((l) => l.stage === s).length));
  ["alle", ...stages].forEach((s) => {
    const chip = el("button", "chip" + (crmFilter === s ? " active" : ""), `${stageLabel(s)} (${counts[s] || 0})`);
    chip.addEventListener("click", () => {
      crmFilter = s;
      loadCrm();
    });
    wrap.append(chip);
  });
}

function stageLabel(s) {
  return {
    alle: "Alle", neu: "Neu", kontaktiert: "Kontaktiert", antwort: "Antwort",
    "ki-check": "KI-Check", kunde: "Kunde", "kein-interesse": "Kein Interesse",
  }[s] || s;
}

function renderCrm(leads, stages) {
  const wrap = $("#crmList");
  wrap.innerHTML = "";
  const filtered = crmFilter === "alle" ? leads : leads.filter((l) => l.stage === crmFilter);
  if (!filtered.length) {
    wrap.innerHTML = `<div class="empty">Noch keine Leads in dieser Stufe. In der Akquise-Suche Betriebe speichern.</div>`;
    return;
  }
  filtered.forEach((lead) => wrap.append(crmRow(lead, stages)));
}

function crmRow(lead, stages) {
  const row = el("div", "crm-row");
  const mail = lead.generatedMail;
  row.innerHTML = `
    <div class="crm-main">
      <h4>${esc(lead.name)}</h4>
      <div class="sub">${esc(lead.branche || lead.type)} · ${esc(lead.city)} ·
        ${lead.email ? `<a href="mailto:${esc(lead.email)}" style="color:var(--accent)">${esc(lead.email)}</a>` : "keine E-Mail"}
        ${lead.phone ? " · " + esc(lead.phone) : ""}
      </div>
      <div class="sub" style="margin-top:4px">→ ${esc(lead.pain?.bestSolution?.name || "")}</div>
      <textarea class="note" placeholder="Notiz (Gesprächsverlauf, nächster Schritt …)">${esc(lead.note || "")}</textarea>
      ${mail ? `<div class="crm-mail"><strong>Mail-Entwurf:</strong> ${esc(mail.subject)}<br>${esc((mail.body || "").slice(0, 140))}…</div>` : ""}
    </div>
    <div class="crm-side">
      <select class="stage-select">${stages.map((s) => `<option value="${s}" ${s === lead.stage ? "selected" : ""}>${stageLabel(s)}</option>`).join("")}</select>
      <button class="ghost act-mail2">${mail ? "Mail ansehen" : "Mail erzeugen"}</button>
      <button class="ghost del">Löschen</button>
    </div>`;

  row.querySelector(".stage-select").addEventListener("change", (e) =>
    patchLead(lead.id, { stage: e.target.value })
  );
  let timer;
  row.querySelector(".note").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => patchLead(lead.id, { note: e.target.value }), 600);
  });
  row.querySelector(".act-mail2").addEventListener("click", async (ev) => {
    if (mail) return openMailModal(lead, mail);
    ev.target.disabled = true;
    ev.target.innerHTML = '<span class="spinner"></span> …';
    const data = await fetch(`/api/lead/${lead.id}/email`, { method: "POST" }).then((r) => r.json());
    openMailModal(lead, data.email);
    loadCrm();
  });
  row.querySelector(".del").addEventListener("click", async () => {
    if (!confirm(`„${lead.name}" aus dem CRM löschen?`)) return;
    await fetch(`/api/lead/${lead.id}`, { method: "DELETE" });
    loadCrm();
  });
  return row;
}

async function patchLead(id, patch) {
  await fetch(`/api/lead/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
}

// --- Karte ------------------------------------------------------------------
function initMap() {
  map = L.map("map", { scrollWheelZoom: false }).setView([48.696, 8.135], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap", maxZoom: 19,
  }).addTo(map);
}

function setMarkers(leads) {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];
  const pts = [];
  leads.forEach((l) => {
    if (l.lat == null || l.lng == null) return;
    const mk = L.marker([l.lat, l.lng]).addTo(map);
    mk.bindPopup(
      `<strong>${esc(l.name)}</strong><br>${esc(l.branche || l.type)}<br>` +
      `★ ${l.rating || "–"} · → ${esc(l.pain?.bestSolution?.name || "")}`
    );
    markers.push(mk);
    pts.push([l.lat, l.lng]);
  });
  if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
}

init();
