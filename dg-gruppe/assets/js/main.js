/* dg | gruppe – Interaktionen & Animationen (ohne Abhängigkeiten) */
(() => {
  "use strict";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isDesktop = () => window.innerWidth > 760;

  /* ---------- Jahr im Footer ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Mobile Menü ---------- */
  const burger = $(".nav-burger");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    burger && burger.setAttribute("aria-expanded", String(open));
    const menu = $(".mobile-menu");
    if (menu) menu.toggleAttribute("inert", !open);
  };
  if (burger) {
    setMenu(false);
    burger.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
    $$(".mobile-menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
  }

  /* ---------- Reveal on Scroll ---------- */
  const revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }),
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Zähler ---------- */
  const counters = $$("[data-count]");
  const runCounter = (el) => {
    const to = parseFloat(el.dataset.count);
    const from = parseFloat(el.dataset.from || "0");
    const suffix = el.dataset.suffix || "";
    if (reduced) { el.textContent = to + suffix; return; }
    const dur = 1800;
    const t0 = performance.now();
    const tick = (t) => {
      const p = clamp((t - t0) / dur);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(from + (to - from) * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
      }),
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- Karten: Spotlight + 3D-Tilt ---------- */
  if (finePointer && !reduced) {
    $$(".card, .benefit").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty("--mx", x + "px");
        card.style.setProperty("--my", y + "px");
        if (card.classList.contains("card")) {
          const rx = ((y / r.height) - 0.5) * -4;
          const ry = ((x / r.width) - 0.5) * 4;
          card.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
        }
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* Umzugskarton: Breite der Bahn an Karte koppeln */
  const setMoveWidth = () => $$(".v-move").forEach((m) => m.style.setProperty("--w", m.clientWidth + "px"));
  setMoveWidth();

  /* ---------- Statement: Wort-für-Wort ---------- */
  const statement = $(".statement");
  let words = [];
  if (statement) {
    const p = $("p", statement);
    const hl = (p.dataset.hl || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const text = p.textContent.trim().replace(/\s+/g, " ");
    p.innerHTML = `<span class="sr-only">${text}</span>` + text.split(" ").map((w) => {
      const clean = w.replace(/[.,:;—–!?]/g, "").toLowerCase();
      return `<span class="w${hl.includes(clean) ? " hl" : ""}" aria-hidden="true">${w}</span>`;
    }).join(" ");
    words = $$(".w", p);
  }

  /* ---------- Prozess: horizontales Scrollen ---------- */
  const process = $(".process");
  const track = process && $(".process-track", process);
  const processBar = process && $(".process-bar i", process);
  const sizeProcess = () => {
    if (!process) return;
    if (reduced || !isDesktop()) { process.style.height = ""; track.style.transform = ""; return; }
    const dist = track.scrollWidth - window.innerWidth;
    process.style.height = (dist + window.innerHeight * 1.15) + "px";
  };

  /* ---------- Karriereleiter ---------- */
  const ladder = $(".ladder-steps");
  const ladderLine = ladder && $(".ladder-line i", ladder);
  const ladderSteps = ladder ? $$(".ladder-step", ladder) : [];

  /* ---------- Navigation / Fortschritt / Mobile CTA ---------- */
  const nav = $(".nav");
  const progress = $(".progress");
  const mobileCta = $(".mobile-cta");
  const darkSections = $$("[data-nav='dark']");
  let lastY = window.scrollY;

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const docH = document.documentElement.scrollHeight - vh;

    if (progress) progress.style.transform = `scaleX(${docH > 0 ? y / docH : 0})`;

    if (nav) {
      const goingDown = y > lastY;
      nav.classList.toggle("is-hidden", goingDown && y > vh * 0.9 && !document.body.classList.contains("menu-open"));
      const probe = 40;
      const overDark = darkSections.some((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= probe && r.bottom >= probe;
      });
      nav.classList.toggle("is-dark", overDark);
    }
    lastY = y;

    if (mobileCta) {
      const nearContact = $$("#kontakt, #bewerben").some((el) => el.getBoundingClientRect().top < vh * 0.9);
      mobileCta.classList.toggle("is-visible", y > vh * 0.75 && !nearContact);
    }

    if (words.length && !reduced) {
      const r = statement.getBoundingClientRect();
      const p = clamp(-r.top / (statement.offsetHeight - vh));
      const on = Math.floor(p * 1.12 * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < on));
    }

    if (process && !reduced && isDesktop()) {
      const r = process.getBoundingClientRect();
      const p = clamp(-r.top / (process.offsetHeight - vh));
      const dist = track.scrollWidth - window.innerWidth;
      track.style.transform = `translate3d(${-p * dist}px,0,0)`;
      if (processBar) processBar.style.transform = `scaleX(${p})`;
    }

    if (ladder) {
      const r = ladder.getBoundingClientRect();
      const p = reduced ? 1 : clamp((vh * 0.75 - r.top) / (r.height + vh * 0.2));
      if (ladderLine) ladderLine.style.transform = isDesktop() ? `scaleX(${p})` : `scaleY(${p})`;
      ladderSteps.forEach((s, i) => s.classList.toggle("on", p >= i / ladderSteps.length));
    }
  };

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });

  let lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    sizeProcess(); setMoveWidth(); onScroll();
    if (window.innerWidth !== lastW) { lastW = window.innerWidth; fog && fog.reset(); }
  });
  window.addEventListener("load", () => { sizeProcess(); onScroll(); });
  sizeProcess();
  onScroll();

  /* ---------- Hero: beschlagene Glasscheibe zum Freiwischen ---------- */
  const fog = (() => {
    const canvas = $("#fog");
    if (!canvas || reduced) return null;
    const hero = canvas.closest(".hero");
    const hint = $(".wipe-hint");
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1, brush = 60, userWiped = false, autoDone = false;

    const rand = (a, b) => a + Math.random() * (b - a);

    const paint = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      brush = clamp(w * 0.055, 42, 86);

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(240,246,252,0.94)");
      g.addColorStop(0.5, "rgba(228,238,248,0.9)");
      g.addColorStop(1, "rgba(236,244,250,0.93)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // feine Körnung
      const grains = Math.round((w * h) / 700);
      for (let i = 0; i < grains; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.55)" : "rgba(150,170,195,0.12)";
        ctx.fillRect(rand(0, w), rand(0, h), rand(0.6, 1.8), rand(0.6, 1.8));
      }
      // Kondenstropfen
      const drops = Math.round((w * h) / 5200);
      for (let i = 0; i < drops; i++) {
        const x = rand(0, w), y = rand(0, h), r = Math.pow(Math.random(), 2.4) * 6 + 0.8;
        const dg = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r);
        dg.addColorStop(0, "rgba(255,255,255,0.95)");
        dg.addColorStop(0.55, "rgba(205,222,240,0.5)");
        dg.addColorStop(1, "rgba(120,145,175,0.28)");
        ctx.fillStyle = dg;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    };

    const dab = (x, y, r) => {
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, "rgba(0,0,0,1)");
      grd.addColorStop(0.55, "rgba(0,0,0,0.95)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    };
    const wipe = (x0, y0, x1, y1, r = brush) => {
      ctx.globalCompositeOperation = "destination-out";
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.ceil(dist / (r * 0.22)));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        dab(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r);
      }
      // Wasserperlen am Rand der Wischspur
      ctx.globalCompositeOperation = "source-over";
      if (dist > 4 && Math.random() < 0.5) {
        const ang = Math.atan2(y1 - y0, x1 - x0) + (Math.random() > 0.5 ? 1 : -1) * Math.PI / 2;
        const px = x1 + Math.cos(ang) * r * 0.92, py = y1 + Math.sin(ang) * r * 0.92;
        const rr = rand(1.2, 3.2);
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI * 2); ctx.fill();
      }
    };

    // automatischer „Abzieher“-Wisch beim Laden
    const autoWipe = () => {
      const pts = [];
      const rows = 3;
      for (let r = 0; r < rows; r++) {
        const yy = h * (0.42 + r * 0.17);
        const ltr = r % 2 === 0;
        for (let i = 0; i <= 24; i++) {
          const t = i / 24;
          pts.push([ (ltr ? t : 1 - t) * (w * 1.1) - w * 0.05, yy + Math.sin(t * Math.PI * 2) * h * 0.025 ]);
        }
      }
      const dur = 2000, t0 = performance.now();
      let idx = 0;
      const r = brush * 1.35;
      const step = (t) => {
        if (userWiped && idx > pts.length * 0.5) { autoDone = true; return; }
        const target = Math.floor(clamp((t - t0) / dur) * (pts.length - 1));
        while (idx < target) { wipe(pts[idx][0], pts[idx][1], pts[idx + 1][0], pts[idx + 1][1], r); idx++; }
        if (idx < pts.length - 1) requestAnimationFrame(step); else autoDone = true;
      };
      requestAnimationFrame(step);
    };

    let last = null;
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    hero.addEventListener("pointermove", (e) => {
      const p = pos(e);
      if (last) {
        wipe(last[0], last[1], p[0], p[1]);
        if (!userWiped) { userWiped = true; hint && hint.classList.add("is-gone"); }
      }
      last = p;
    }, { passive: true });
    hero.addEventListener("pointerleave", () => (last = null));
    hero.addEventListener("pointerup", () => { if (!finePointer) last = null; });
    hero.addEventListener("pointercancel", () => (last = null));

    paint();
    setTimeout(autoWipe, 650);

    return { reset: () => { paint(); if (autoDone) autoWipe(); } };
  })();

  /* ---------- Kontaktformular (Mailto-Fallback) ---------- */
  $$("form[data-mailto]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const lines = [];
      const grouped = {};
      for (const [k, v] of data.entries()) {
        if (k === "datenschutz" || !String(v).trim()) continue;
        (grouped[k] = grouped[k] || []).push(v);
      }
      Object.entries(grouped).forEach(([k, v]) => lines.push(`${k}: ${v.join(", ")}`));
      const subject = form.dataset.subject || "Anfrage über die Website";
      window.location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
      form.classList.add("is-sent");
    });
  });

  /* ---------- Schnellbewerbung (Karriere) ---------- */
  const quick = $("[data-quick]");
  if (quick) {
    const steps = $$(".q-step", quick);
    const bars = $$(".q-progress i", quick);
    let current = 0;
    const show = (i) => {
      current = i;
      steps.forEach((s, j) => s.classList.toggle("is-active", j === i));
      bars.forEach((b, j) => b.classList.toggle("on", j <= i));
      const focusable = steps[i].querySelector("input, button");
      if (focusable && i > 0) focusable.focus({ preventScroll: true });
    };
    const valid = (i) => {
      const fields = $$("input, select, textarea", steps[i]);
      return fields.every((f) => f.reportValidity());
    };
    $$("[data-next]", quick).forEach((b) => b.addEventListener("click", () => { if (valid(current)) show(current + 1); }));
    $$("[data-prev]", quick).forEach((b) => b.addEventListener("click", () => show(Math.max(0, current - 1))));
    // Auswahl-Chips springen automatisch weiter
    $$(".q-step[data-auto] input[type=radio]", quick).forEach((r) =>
      r.addEventListener("change", () => setTimeout(() => show(current + 1), 280))
    );
    quick.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!valid(current)) return;
      const d = new FormData(quick);
      const body = [
        `Stelle: ${d.get("stelle")}`,
        `Standort: ${d.get("standort")}`,
        `Umfang: ${d.get("umfang")}`,
        `Name: ${d.get("name")}`,
        `Telefon: ${d.get("telefon")}`,
        `E-Mail: ${d.get("email") || "-"}`,
        `Erreichbar: ${d.get("erreichbar") || "-"}`,
      ].join("\n");
      window.location.href = `mailto:${quick.dataset.mailto}?subject=${encodeURIComponent("Schnellbewerbung: " + d.get("stelle"))}&body=${encodeURIComponent(body)}`;
      show(steps.length - 1);
    });
    // „Bewerben“-Buttons an Stellenanzeigen wählen die Stelle direkt vor
    $$("[data-job]").forEach((b) => b.addEventListener("click", () => {
      const radio = $$("input[name=stelle]", quick).find((r) => r.value === b.dataset.job);
      if (radio) { radio.checked = true; show(1); }
    }));
    show(0);
  }
})();
