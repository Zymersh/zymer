/* Praxis für Naturheilkunde · Christine Müller – Interaktionen */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* privat/blockiert */ } },
  };
  const PRAXIS_MAIL = 'praxis@cm-naturheilkunde.de';
  const PRAXIS_TEL = '07222 407 95 58';

  /* ---------- Bild-Slots: fehlende Bilder ausblenden ---------- */
  $$('[data-media] > img').forEach((img) => {
    const media = img.parentElement;
    const fail = () => media.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener('error', fail, { once: true });
  });

  /* ---------- Header: beim Runterscrollen ausblenden ---------- */
  const header = $('.site-header');
  let lastY = window.scrollY;
  const onScrollHeader = () => {
    const y = window.scrollY;
    const menuOpen = document.body.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 240);
    lastY = y;
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScrollHeader(); ticking = false; });
  }, { passive: true });

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
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Reiter (Behandlung) – per Hash verlinkbar ---------- */
  const tabsRoot = $('[data-tabs]');
  if (tabsRoot) {
    const tabs = $$('[role="tab"]', tabsRoot);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const select = (i, { focus = false, scroll = false, push = true } = {}) => {
      tabs.forEach((t, idx) => {
        const on = idx === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[idx].classList.toggle('is-active', on);
        panels[idx].hidden = !on;
      });
      $$('.reveal', panels[i]).forEach((el) => el.classList.add('is-visible'));
      tabs[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      if (focus) tabs[i].focus();
      if (push) history.replaceState(null, '', `#${panels[i].id}`);
      if (scroll) {
        const top = tabsRoot.getBoundingClientRect().top + window.scrollY - 110;
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (e.key in map) {
          e.preventDefault();
          select((map[e.key] + tabs.length) % tabs.length, { focus: true });
        }
      });
    });
    const fromHash = (scroll) => {
      const id = decodeURIComponent(location.hash.slice(1));
      const i = panels.findIndex((p) => p.id === id);
      if (i >= 0) select(i, { scroll, push: false });
      return i >= 0;
    };
    // Links innerhalb der Seite (z. B. „Mehr zur Chelat-Therapie“)
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const i = panels.findIndex((p) => `#${p.id}` === a.getAttribute('href'));
      if (i >= 0) { e.preventDefault(); select(i, { scroll: true }); }
    });
    window.addEventListener('hashchange', () => fromHash(true));
    if (!fromHash(true)) select(0, { push: false });
  }

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
  if ($('[data-status]')) {
    updateStatus();
    setInterval(updateStatus, 60 * 1000);
  }

  /* ---------- jameda-Terminkalender: erst nach Klick laden ---------- */
  const jameda = $('[data-jameda]');
  if (jameda) {
    const KEY = 'cm-jameda-consent';
    const load = () => {
      const widget = $('[data-jameda-widget]', jameda);
      $('[data-jameda-placeholder]', jameda).hidden = true;
      widget.hidden = false;
      jameda.classList.add('is-loaded');
      // Original-Einbindungscode von jameda
      widget.innerHTML = '<a id="zl-url" class="zl-url" href="https://www.jameda.de/christine-mueller-10/heilpraktiker/steinmauern" rel="nofollow" data-zlw-doctor="christine-mueller-10" data-zlw-type="big_with_calendar" data-zlw-opinion="false" data-zlw-hide-branding="true" data-zlw-saas-only="false">Christine Müller - jameda.de</a>';
      if (!document.getElementById('zl-widget-s')) {
        const js = document.createElement('script');
        js.id = 'zl-widget-s';
        js.src = 'https://platform.docplanner.com/js/widget.js';
        document.body.appendChild(js);
      }
    };
    $('[data-jameda-load]', jameda).addEventListener('click', () => {
      if ($('[data-jameda-remember]', jameda).checked) store.set(KEY, 'yes');
      load();
    });
    if (store.get(KEY) === 'yes') load();
  }

  /* ---------- Formulare: Zusammenfassung, Versand, Fallbacks ---------- */
  // Liest ein Formular gegliedert nach Schritten/Gruppen aus (für E-Mail, Druck und mailto)
  const collect = (form) => {
    const sections = [];
    const seen = new Set();
    const blocks = $$('.fgroup', form);
    blocks.forEach((g) => {
      const step = g.closest('.fstep');
      const stepTitle = step ? ($('h3', step) || {}).textContent : '';
      const heading = ($('h4', g) || {}).textContent || stepTitle || '';
      const rows = [];
      $$('input, select, textarea', g).forEach((el) => {
        if (!el.name || el.name === 'website' || el.name === 'Einwilligung' || seen.has(el.name) || el.closest('[hidden]')) return;
        if ((el.type === 'checkbox' || el.type === 'radio')) {
          seen.add(el.name);
          const vals = $$(`[name="${CSS.escape(el.name)}"]:checked`, form).map((x) => x.value);
          const suffix = el.closest('.scale') ? ' von 10' : '';
          if (vals.length) rows.push([el.name, vals.join(', ') + suffix]);
        } else if (el.value.trim()) {
          seen.add(el.name);
          const v = el.type === 'date' ? el.value.split('-').reverse().join('.') : el.value.trim();
          rows.push([el.name, v]);
        }
      });
      if (rows.length) sections.push({ title: heading.replace(/^\d+ · /, ''), rows });
    });
    return sections;
  };
  const toText = (title, sections) => {
    const lines = [title, '='.repeat(title.length), ''];
    sections.forEach((s) => {
      lines.push(`— ${s.title} —`);
      s.rows.forEach(([k, v]) => lines.push(`${k}: ${v}`));
      lines.push('');
    });
    return lines.join('\n');
  };

  const printSummary = (title, sections) => {
    let sec = $('main > .print-summary');
    if (!sec) {
      sec = document.createElement('section');
      sec.className = 'print-summary';
      $('main').appendChild(sec);
    }
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    sec.innerHTML = `<h1>${esc(title)}</h1><p>Praxis für Naturheilkunde · Christine Müller · Plittersdorfer Straße 2a · 76479 Steinmauern · Ausgefüllt am ${new Date().toLocaleDateString('de-DE')}</p>${
      sections.map((s) => `<h2>${esc(s.title)}</h2><dl>${s.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`).join('')}`;
    document.body.classList.add('print-only-summary');
    window.print();
    setTimeout(() => document.body.classList.remove('print-only-summary'), 500);
  };

  const validate = (scope) => {
    const fields = $$('input, select, textarea', scope).filter((f) => !f.closest('[hidden]'));
    for (const f of fields) {
      if (!f.checkValidity()) {
        f.reportValidity();
        return false;
      }
    }
    return true;
  };

  const initForm = (form) => {
    const steps = $$('fieldset.fstep', form);
    const success = $('[data-step="done"]', form);
    const progress = $$('.progress li', form);
    const prev = $('[data-prev]', form);
    const next = $('[data-next]', form);
    const submit = $('[data-submit]', form);
    const errorBox = $('[data-error]', form);
    const nav = $('.form-nav', form);
    const title = form.dataset.title || 'Anfrage über die Website';
    let current = 0;

    const show = (i) => {
      current = i;
      steps.forEach((s, idx) => s.classList.toggle('active', idx === i));
      progress.forEach((p, idx) => {
        p.classList.toggle('active', idx === i);
        p.classList.toggle('done', idx < i);
      });
      if (prev) prev.hidden = i === 0;
      if (next) next.hidden = i === steps.length - 1;
      submit.hidden = i !== steps.length - 1;
      form.closest('.form-card').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      const first = $('input:not([type=hidden]), select, textarea', steps[i]);
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 400);
    };
    if (steps.length && next) {
      next.addEventListener('click', () => { if (validate(steps[current])) show(current + 1); });
      prev.addEventListener('click', () => show(current - 1));
    }

    const finish = (message) => {
      steps.forEach((s) => s.classList.remove('active'));
      $$('.fgroup', form).forEach((g) => { if (!g.closest('.fstep')) g.hidden = true; });
      success.hidden = false;
      success.classList.add('active');
      if (message) $('[data-success-text]', success).textContent = message;
      progress.forEach((p) => { p.classList.remove('active'); p.classList.add('done'); });
      nav.hidden = true;
      errorBox.hidden = true;
      success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    };

    const showFallback = (sections) => {
      const text = toText(title, sections);
      const nameField = form.elements.Name;
      const subject = `${title} – ${nameField ? nameField.value : ''}`.trim();
      const mailto = `mailto:${PRAXIS_MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      errorBox.innerHTML = `Der direkte Versand ist gerade nicht möglich. Ihre Angaben gehen nicht verloren – Sie können sie
        <a href="${mailto}" style="text-decoration:underline;font-weight:600">per E-Mail senden</a>${steps.length ? ' oder <button type="button" data-print style="text-decoration:underline;font-weight:600">drucken bzw. als PDF speichern</button> und zum Termin mitbringen' : ''}.
        Telefonisch erreichen Sie mich unter ${PRAXIS_TEL}.`;
      errorBox.hidden = false;
    };

    form.addEventListener('click', (e) => {
      if (e.target.closest('[data-print]')) printSummary(title, collect(form));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate(steps.length ? steps[current] : form)) return;
      const sections = collect(form);
      const data = new FormData();
      data.append('form', form.dataset.form);
      data.append('summary', toText(title, sections));
      ['Name', 'E-Mail', 'website'].forEach((k) => { if (form.elements[k]) data.append(k, form.elements[k].value); });
      data.append('Einwilligung', form.elements.Einwilligung && form.elements.Einwilligung.checked ? 'ja' : '');

      submit.disabled = true;
      try {
        const res = await fetch(form.getAttribute('action'), { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json || !json.ok) throw new Error((json && json.error) || res.statusText);
        finish();
      } catch (err) {
        showFallback(sections);
      } finally {
        submit.disabled = false;
      }
    });
  };

  /* ---------- Gutschein: Live-Vorschau ---------- */
  const initVoucher = (form) => {
    const voucher = $('[data-voucher]');
    const vFor = $('[data-v-for]', voucher);
    const vValue = $('[data-v-value]', voucher);
    const vKind = $('[data-v-kind]', voucher);
    const showIf = (sel, on) => $$(sel, form).forEach((el) => {
      el.hidden = !on;
      $$('input, select', el).forEach((i) => { if (i.id === 'g-wunsch' || i.id === 'g-adresse') i.required = on; });
    });
    const update = () => {
      const kind = $('[name="Art"]:checked', form).dataset.kind;
      const amount = $('[name="Betrag"]:checked', form);
      const custom = amount && amount.value === 'Wunschbetrag';
      showIf('[data-show="value"]', kind === 'value');
      showIf('[data-show="treatment"]', kind === 'treatment');
      showIf('[data-show="custom"]', kind === 'value' && custom);
      showIf('[data-show="address"]', !!$('[name="Zustellung"]:checked[data-needs-address]', form));
      if (kind === 'value') {
        const wish = form.elements.Wunschbetrag.value;
        vKind.textContent = 'Wert';
        vValue.textContent = custom ? (wish ? `${wish} €` : '… €') : amount.value;
      } else {
        vKind.textContent = 'Behandlung';
        vValue.textContent = form.elements.Behandlung.value.split(' – ')[0];
      }
      vFor.textContent = form.elements['Beschenkte Person'].value.trim() || 'einen lieben Menschen';
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    update();
    if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
      voucher.addEventListener('pointermove', (e) => {
        const r = voucher.getBoundingClientRect();
        voucher.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 10}deg`);
        voucher.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 10}deg`);
      });
      voucher.addEventListener('pointerleave', () => { voucher.style.setProperty('--rx', '0deg'); voucher.style.setProperty('--ry', '0deg'); });
    }
  };

  // Formulare erst nach allen Skripten initialisieren (der Anamnesebogen wird per JS erzeugt)
  document.addEventListener('DOMContentLoaded', () => {
    $$('form[data-form]').forEach(initForm);
    const g = $('#gutschein-form');
    if (g) initVoucher(g);
    // Neue Reveal-Elemente sichtbar machen
    $$('#anamnese-form .reveal').forEach((el) => el.classList.add('is-visible'));
  });

  /* ---------- Jahr im Footer ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
