/* Praxis für Naturheilkunde · Christine Müller – Interaktionen */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Bild-Slots: fehlende Bilder durch botanische Fläche ersetzen ---------- */
  $$('[data-media] > img').forEach((img) => {
    const media = img.parentElement;
    const fail = () => media.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener('error', fail, { once: true });
  });

  /* ---------- Header: beim Runterscrollen ausblenden, beim Hochscrollen zeigen ---------- */
  const header = $('.site-header');
  let lastY = window.scrollY;
  const onScrollHeader = () => {
    const y = window.scrollY;
    const menuOpen = document.body.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 240);
    lastY = y;
  };

  /* ---------- Mobiles Menü ---------- */
  const toggle = $('.menu-toggle');
  const mobileMenu = $('#mobile-menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('a', mobileMenu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
  });

  /* ---------- Reveal beim Scrollen ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Philosophie-Text: Wort für Wort aufleuchten ---------- */
  const scrub = $('[data-scrub]');
  let words = [];
  if (scrub && !reduceMotion) {
    const walker = document.createTreeWalker(scrub, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.className = 'w';
          span.textContent = part;
          frag.appendChild(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
    words = $$('.w', scrub);
  }
  const updateScrub = () => {
    if (!words.length) return;
    const r = scrub.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.3)));
    const count = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < count));
  };

  /* ---------- Ablauf: Linie wächst mit ---------- */
  const steps = $('[data-steps]');
  const updateSteps = () => {
    if (!steps) return;
    const r = steps.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (vh * 0.6)));
    steps.style.setProperty('--p', p.toFixed(3));
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScrollHeader();
      updateScrub();
      updateSteps();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Therapie-Details im Dialog ---------- */
  const dialog = $('#therapy-dialog');
  const dialogBody = $('[data-dialog-body]', dialog);
  let lastTrigger = null;
  $$('.tcard').forEach((card) => {
    const btn = $('.tcard__btn', card);
    const tpl = $('template.tcard__detail', card);
    if (!btn || !tpl) return;
    btn.addEventListener('click', () => {
      lastTrigger = btn;
      dialogBody.replaceChildren(tpl.content.cloneNode(true));
      const h = $('h3', dialogBody);
      if (h) h.id = 'dialog-title';
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
  });
  const closeDialog = () => {
    if (dialog.open) dialog.close();
  };
  $$('[data-close]', dialog).forEach((el) => el.addEventListener('click', closeDialog));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog(); });
  dialog.addEventListener('close', () => { if (lastTrigger) lastTrigger.focus({ preventScroll: true }); });

  /* ---------- Sprechzeiten: Live-Status (Zeitzone Europe/Berlin) ---------- */
  const HOURS = {
    0: [],
    1: [[9, 12], [15, 19]],
    2: [[9, 12], [15, 19]],
    3: [[9, 12], [15, 19]],
    4: [[9, 12], [15, 19]],
    5: [[9, 12]],
    6: [[11, 14]],
  };
  const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const fmt = (h) => `${String(h).padStart(2, '0')}:00`;

  const berlinNow = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, time: (parseInt(get('hour'), 10) % 24) + parseInt(get('minute'), 10) / 60 };
  };

  const updateStatus = () => {
    const { day, time } = berlinNow();
    const open = HOURS[day].find(([a, b]) => time >= a && time < b);
    let title;
    let text;
    if (open) {
      title = 'Jetzt geöffnet';
      text = `Heute bis ${fmt(open[1])} Uhr`;
    } else {
      title = 'Gerade geschlossen';
      const later = HOURS[day].find(([a]) => time < a);
      if (later) {
        text = `Öffnet heute um ${fmt(later[0])} Uhr`;
      } else {
        for (let i = 1; i <= 7; i++) {
          const d = (day + i) % 7;
          if (HOURS[d].length) {
            text = `Öffnet ${i === 1 ? 'morgen' : DAYS[d]} um ${fmt(HOURS[d][0][0])} Uhr`;
            break;
          }
        }
      }
    }
    $$('[data-status]').forEach((el) => {
      el.classList.toggle('is-closed', !open);
      const t = $('[data-status-title]', el);
      const s = $('[data-status-text]', el);
      if (t) t.textContent = title;
      if (s) s.textContent = t ? text : `${title} · ${text}`;
    });
    $$('.hours tr[data-day]').forEach((tr) => tr.classList.toggle('today', Number(tr.dataset.day) === day));
  };
  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- Anamnesebogen: mehrstufiges Formular ---------- */
  const form = $('#anamnese-form');
  if (form) {
    const steps = $$('fieldset.fstep', form);
    const success = $('[data-step="done"]', form);
    const progress = $$('.progress li', form);
    const prev = $('[data-prev]', form);
    const next = $('[data-next]', form);
    const submit = $('[data-submit]', form);
    let current = 0;

    const show = (i) => {
      current = i;
      steps.forEach((s, idx) => s.classList.toggle('active', idx === i));
      progress.forEach((p, idx) => {
        p.classList.toggle('active', idx === i);
        p.classList.toggle('done', idx < i);
      });
      prev.hidden = i === 0;
      next.hidden = i === steps.length - 1;
      submit.hidden = i !== steps.length - 1;
      const first = $('input, select, textarea', steps[i]);
      form.closest('.form-card').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 350);
    };

    const valid = (step) => {
      const fields = $$('input, select, textarea', step);
      for (const f of fields) {
        if (!f.checkValidity()) {
          f.reportValidity();
          return false;
        }
      }
      return true;
    };

    next.addEventListener('click', () => { if (valid(steps[current])) show(current + 1); });
    prev.addEventListener('click', () => show(current - 1));

    const finish = (message) => {
      steps.forEach((s) => s.classList.remove('active'));
      success.classList.add('active');
      if (message) $('[data-success-text]', success).textContent = message;
      progress.forEach((p) => { p.classList.remove('active'); p.classList.add('done'); });
      $('.form-nav', form).hidden = true;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!valid(steps[current])) return;
      const data = new FormData(form);
      const endpoint = form.dataset.endpoint;

      if (endpoint) {
        // Versand über ein (verschlüsseltes) Formular-Backend
        submit.disabled = true;
        try {
          const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(res.statusText);
          finish();
        } catch (err) {
          submit.disabled = false;
          alert('Leider konnte der Bogen nicht gesendet werden. Bitte rufen Sie mich an: 07222 407 95 58');
        }
        return;
      }

      // Fallback ohne Backend: vorausgefüllte E-Mail im eigenen Mailprogramm öffnen
      const lines = [];
      const seen = new Set();
      for (const [key] of data.entries()) {
        if (seen.has(key) || key === 'Einwilligung') continue;
        seen.add(key);
        const val = data.getAll(key).filter(Boolean).join(', ');
        if (val) lines.push(`${key}: ${val}`);
      }
      const name = `${data.get('Vorname') || ''} ${data.get('Nachname') || ''}`.trim();
      const subject = `Anamnesebogen – ${name}`;
      const body = `Anamnesebogen zur ganzheitlichen Behandlung\n\n${lines.join('\n\n')}`;
      window.location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      finish('Ihr E-Mail-Programm wurde mit Ihren Angaben geöffnet. Bitte senden Sie die E-Mail dort ab – ich melde mich dann zeitnah bei Ihnen.');
    });
  }

  /* ---------- Jahr im Footer ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
