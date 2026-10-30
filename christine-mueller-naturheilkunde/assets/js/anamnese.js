/* Anamnesebogen – Inhalt des 6-seitigen Papierbogens als Online-Formular.
   Aufbau: Schritte → Gruppen → Felder. Das Formular wird beim Laden erzeugt;
   Navigation und Versand übernimmt main.js (data-stepper). */
(() => {
  'use strict';

  // Feldtypen: text, email, tel, date, number, textarea, select, checks, radio, scale
  const T = (n, l, o = {}) => ({ t: 'text', n, l, ...o });
  const A = (n, l, o = {}) => ({ t: 'textarea', n, l, full: true, ...o });
  const C = (n, l, opts, o = {}) => ({ t: 'checks', n, l, opts, full: true, ...o });
  const R = (n, l, opts, o = {}) => ({ t: 'radio', n, l, opts, full: true, ...o });
  const other = (n) => T(n, 'Anderes', { full: true });

  const STEPS = [
    {
      label: 'Person', title: 'Allgemeine Daten', hint: 'Schritt 1 von 8 – Angaben zur Person (Patientin / Patient)',
      groups: [
        { fields: [
          T('Name', 'Vor- und Nachname', { req: true, ac: 'name' }),
          { t: 'date', n: 'Geburtsdatum', l: 'Geburtsdatum', req: true, ac: 'bday' },
          T('Adresse', 'Adresse', { full: true, ac: 'street-address', ph: 'Straße, PLZ, Ort' }),
          { t: 'tel', n: 'Telefon', l: 'Telefon (privat / mobil)', req: true, ac: 'tel' },
          { t: 'email', n: 'E-Mail', l: 'E-Mail', req: true, ac: 'email' },
          T('Beruf', 'Beruf'),
          T('Familienstand', 'Familienstand'),
          T('Kinder', 'Kinder'),
          T('Krankenkasse', 'Krankenkasse'),
          T('Zusatzversicherung', 'Zusatzversicherung'),
        ] },
        { title: 'Körperdaten', fields: [
          { t: 'select', n: 'Blutgruppe', l: 'Blutgruppe', opts: ['', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', '0+', '0−', 'unbekannt'] },
          { t: 'number', n: 'Körpergröße (cm)', l: 'Körpergröße (cm)', min: 40, max: 230 },
          { t: 'number', n: 'Gewicht (kg)', l: 'Aktuelles Gewicht (kg)', min: 2, max: 300 },
        ] },
      ],
    },
    {
      label: 'Beschwerden', title: 'Beschwerden & Vorgeschichte', hint: 'Schritt 2 von 8 – nehmen Sie sich ruhig Zeit',
      groups: [
        { fields: [
          A('Derzeitige Beschwerden', 'Ihre derzeitigen Beschwerden, welche Sie zu mir führen (bitte nach Wichtigkeit ordnen)', { req: true }),
          A('Medikamente / Nahrungsergänzung', 'Welche Medikamente und Nahrungsergänzungsmittel nehmen Sie derzeit ein?'),
          A('Krankheiten in der Familie', 'Erwähnenswerte Krankheiten in der Familie?'),
          A('Antibiotika / Cortison', 'Haben Sie jemals Antibiotika (inklusive Kindheit) und/oder Cortison genommen? Wann, warum und wie lange?'),
          A('Allergien', 'Sind Allergien bekannt? Wenn ja: seit wann und wogegen? Wurde ein Allergiepass ausgestellt?'),
          A('Ernährung / Flüssigkeit', 'Leben Sie nach bestimmten Ernährungsrichtlinien? Wie viel Flüssigkeit nehmen Sie pro Tag zu sich und woraus setzt sich diese zusammen?'),
        ] },
      ],
    },
    {
      label: 'Kopf & Zähne', title: 'Kopf & Zähne', hint: 'Schritt 3 von 8 – bitte alles Zutreffende auswählen',
      groups: [
        { title: 'Augen', fields: [C('Augen', 'Zutreffendes', ['Ich trage eine Brille', 'Ich trage Kontaktlinsen']), other('Augen – Anderes')] },
        { title: 'Mandeln', fields: [
          C('Mandeln', 'Zutreffendes', ['Gehäufte Entzündungen (Angina)', 'mit Antibiotika behandelt', 'ohne Antibiotika behandelt', 'Operative Entfernung', 'Fremdkörpergefühl / Kloßgefühl im Hals', 'Mundgeruch']),
          T('Mandeln – Entfernung mit Lebensjahren', 'Operative Entfernung mit … Lebensjahren'),
          T('Mandeln – Anderes', 'Anderes'),
        ] },
        { title: 'Nase / Nebenhöhlen', fields: [
          C('Nase / Nebenhöhlen', 'Zutreffendes', ['Chronischer Schnupfen – rechts', 'Chronischer Schnupfen – links', 'Chronischer Schnupfen – beidseits', 'Nasennebenhöhlenentzündung mit Antibiotika behandelt', 'Nasennebenhöhlenentzündung ohne Antibiotika behandelt', 'Heuschnupfen', 'Nasenpolypen', 'Nasenscheidewandverbiegung']),
          T('Nase – Operationen', 'Operationen'),
          T('Nase – Anderes', 'Anderes'),
        ] },
        { title: 'Ohren', fields: [
          C('Ohren', 'Zutreffendes', ['Mittelohrentzündung mit Antibiotika behandelt', 'Mittelohrentzündung ohne Antibiotika behandelt', 'Ohrensausen (Tinnitus) – rechts', 'Ohrensausen (Tinnitus) – links', 'Tinnitus ständig', 'Tinnitus wechselnd']),
          other('Ohren – Anderes'),
        ] },
        { title: 'Zähne', fields: [
          C('Zahnfüllungen', 'Meine Füllungen sind aus', ['Amalgam', 'Gold', 'Kunststoff', 'Keramik']),
          { t: 'number', n: 'Amalgamfüllungen jetzt', l: 'Anzahl Amalgamfüllungen – jetzt', min: 0, max: 32 },
          { t: 'number', n: 'Amalgamfüllungen früher', l: 'Anzahl Amalgamfüllungen – früher', min: 0, max: 32 },
          T('Amalgam entfernt', 'Wann entfernt und wie viele ca.?', { full: true }),
          C('Zähne', 'Zutreffendes', ['Nach Amalgamentfernung erfolgte eine Schwermetall-Ausleitung', 'Zahnfleischbluten', 'Zahnfleischschwund', 'Ich war/bin in kieferorthopädischer Behandlung', 'Ich knirsche bzw. kaue im Schlaf mit den Zähnen', 'Ich trage nachts eine Schiene', 'Muskelverspannungen der Kaumuskulatur', 'Kieferknacken', 'Muskelverspannungen im Nacken-Schulter-Bereich']),
          T('Wurzelbehandlungen', 'Wurzelbehandlung(en) bei folgenden Zähnen'),
          T('Wurzelspitzenresektionen', 'Wurzelspitzenresektion(en) bei den Zähnen'),
          C('Weisheitszähne', 'Weisheitszähne', ['noch nicht durchgebrochen', 'querliegend', 'entfernt', 'schmerzhaft', 'weiß nicht']),
          T('Letzter Zahnarztbesuch', 'Mein letzter Zahnarztbesuch war am … bei Dr. …', { full: true }),
        ] },
      ],
    },
    {
      label: 'Verdauung & Haut', title: 'Verdauung, Stoffwechsel & Haut', hint: 'Schritt 4 von 8',
      groups: [
        { title: 'Magen / Darm', fields: [
          C('Magen / Darm', 'Zutreffendes', ['Wechselnde Stuhlqualität zwischen weich und fest', 'Täglicher Stuhlgang – einmal', 'Täglicher Stuhlgang – mehrmals', 'Ständiger Durchfall', 'Ständige Verstopfung', 'Ich nehme Abführmittel', 'Darmkrämpfe – jetzt', 'Darmkrämpfe – früher gehabt', 'Blähungen', 'Heißhunger auf Süßes', 'Magen-/Zwölffingerdarm-Geschwür', 'Darmentzündung', 'Hämorrhoiden – jetzt', 'Hämorrhoiden – früher', 'Hämorrhoiden – vom Arzt bestätigt', 'Analfissuren', 'Afterjucken', 'Magen-Darm-Infekt auf einer Reise', 'Infekt durch Parasiten (inkl. Kindheit)']),
          T('Blinddarm', 'Blinddarmreizung / Operation im Jahr'),
          T('Festgestellte Darmerkrankung', 'Festgestellte Darmerkrankung – welche und seit wann?'),
          T('Nahrungsmittelunverträglichkeit', 'Nahrungsmittelallergie / -unverträglichkeit', { full: true }),
          R('Unverträglichkeit getestet', 'Getestet', ['schulmedizinisch', 'vermutet']),
          T('Reiseinfekt', 'Reiseinfekt: Land und Jahr', { full: true }),
          other('Magen / Darm – Anderes'),
        ] },
        { title: 'Leber / Gallenblase / Bauchspeicheldrüse', fields: [
          C('Leber / Galle / Pankreas', 'Zutreffendes', ['Diabetes mellitus Typ I', 'Diabetes mellitus Typ II', 'Entzündung', 'Steine']),
          other('Leber / Galle – Anderes'),
        ] },
        { title: 'Niere / Blase', fields: [
          R('Niere / Blase – Entzündungen', 'Entzündungen', ['keine', '1 x', 'häufig', 'immer wiederkehrend']),
          C('Niere / Blase', 'Zutreffendes', ['Steine, Sand', 'Ich habe häufig kalte Füße']),
          other('Niere / Blase – Anderes'),
        ] },
        { title: 'Haut', fields: [
          C('Haut', 'Zutreffendes', ['Juckende, schmerzende Stellen', 'Akne', 'Neurodermitis', 'Psoriasis', 'Hautpilz / Nagelpilz']),
          other('Haut – Anderes'),
        ] },
      ],
    },
    {
      label: 'Herz & Psyche', title: 'Herz, Knochen, Narben & Psyche', hint: 'Schritt 5 von 8',
      groups: [
        { title: 'Brust / Herz und Kreislauf', fields: [
          C('Brust / Herz / Kreislauf', 'Zutreffendes', ['Bronchitis', 'Asthma', 'Lungenentzündung', 'Blutdruck-Störungen', 'Herzerkrankung']),
          T('Herzerkrankung – Diagnose', 'Herzerkrankung, Diagnose'),
          T('Herz – Anderes', 'Anderes'),
        ] },
        { title: 'Schilddrüse', fields: [
          C('Schilddrüse', 'Zutreffendes', ['Festgestellte Funktionsstörung', 'Überfunktion', 'Unterfunktion']),
          other('Schilddrüse – Anderes'),
        ] },
        { title: 'Knochen', fields: [
          T('Knochenbrüche', 'Brüche (offen / geschlossen) im Jahr', { full: true }),
          T('Osteoporose', 'Osteoporose seit … bestätigt durch …', { full: true }),
          C('Knochen', 'Zutreffendes', ['Schmerzhafte Steißbeinprellung']),
          other('Knochen – Anderes'),
        ] },
        { title: 'Narben', fields: [
          T('Narben durch Operationen', 'Durch folgende Operationen'),
          T('Narben durch Verletzungen', 'Durch Verletzungen an'),
          C('Narben', 'Zutreffendes', ['Furunkel, Karbunkel, Abszesse, lange dauernde Eiterungen', 'Dammriss/-schnitt bei der Geburt', 'Fremdkörper (Splitter, Implantat, Herzschrittmacher)', 'Das Berühren des Nabels ist mir unangenehm']),
          other('Narben – Anderes'),
        ] },
        { title: 'Psyche & Schlaf', fields: [
          C('Psyche', 'Zutreffendes', ['Ich bin/war in psychotherapeutischer Begleitung', 'Ich nehme Medikamente, die einen speziellen Einfluss auf mein Gemüt haben']),
          T('Medikament (Gemüt)', 'Name des Medikamentes', { full: true }),
          C('Schlaf', 'Ich schlafe', ['gut ein', 'schlecht ein', 'gut durch', 'wache öfters auf', 'mit Schlafmittel', 'ohne Schlafmittel']),
          C('Träume', 'Ich träume', ['schrecklich', 'nachdenklich', 'wiederkehrend', 'gegen Morgen', 'schön']),
        ] },
      ],
    },
    {
      label: 'Infektionen', title: 'Impfungen & Infektionskrankheiten', hint: 'Schritt 6 von 8',
      groups: [
        { title: 'Impfungen', fields: [
          R('Impfreaktion', 'Gab es auf eine Impfung jemals eine Reaktion (Müdigkeit, Fieber, Schwellung an der Einstichstelle …)?', ['nein', 'ja']),
          T('Impfreaktion bei', 'Wenn ja: bei welcher Impfung?', { full: true }),
        ] },
        { title: 'Durchgemachte Infektionskrankheiten', fields: [
          C('Infektionskrankheiten', 'Welche Infektionskrankheiten haben Sie durchgemacht?', ['Masern', 'Mumps', 'Röteln', 'Keuchhusten', 'Windpocken', 'Scharlach', 'Tetanus', 'Malaria', 'Salmonellose', 'Kinderlähmung (Polio)', 'Ruhr', 'Tuberkulose', 'Pfeiffersches Drüsenfieber', 'Gonorrhoe (Tripper)', 'Syphilis', 'Tropenkrankheiten']),
          T('Infektionskrankheiten – Andere', 'Andere', { full: true }),
          R('HIV / Hepatitis', 'Leiden Sie unter Infektionskrankheiten wie HIV, Hepatitis oder ähnlichem?', ['nein', 'ja']),
          T('HIV / Hepatitis – welche', 'Wenn ja: welche?', { full: true }),
        ] },
      ],
    },
    {
      label: 'Lebensstil', title: 'Lebensstil, Schmerzen & Haare', hint: 'Schritt 7 von 8',
      groups: [
        { title: 'Lebensstil', fields: [
          R('Sport', 'Treiben Sie Sport?', ['nein', 'ja']),
          T('Sport – Details', 'Wie oft pro Woche und welche Sportart?', { full: true }),
          R('Rauchen', 'Rauchen Sie?', ['nein', 'ja']),
          T('Rauchen – pro Tag', 'Wenn ja: wie viel pro Tag?'),
          R('Haustiere', 'Haben Sie Haustiere?', ['nein', 'ja']),
          T('Haustiere – welche', 'Wenn ja: welche?'),
          R('Schimmelpilze', 'Gibt es in Ihrem Wohn- oder Arbeitsumfeld Schimmelpilze?', ['nein', 'ja']),
        ] },
        { title: 'Schmerzen', fields: [
          A('Schmerzen – wo', 'Haben Sie Schmerzen? Wenn ja, wo treten sie auf?'),
          C('Schmerzlokalisation', 'Art der Lokalisation', ['kreuzförmiger Schmerz', 'punktförmiger Schmerz', 'unklare Schmerzlokalisation', 'pfeilförmig ausstrahlender Schmerz']),
          { t: 'scale', n: 'Schmerzskala', l: 'Schmerzskala für den Hauptschmerz (1 sehr schwach bis 10 sehr stark)', full: true },
          T('Schmerzen seit', 'Seit wann haben Sie die Schmerzen?'),
          T('Auslösendes Ereignis', 'Gab es ein auslösendes Ereignis?'),
          R('Schmerzhäufigkeit', 'Wie oft haben Sie die Schmerzen?', ['immer', 'mehrmals am Tag', 'alle paar Tage', 'wöchentlich', 'seltener']),
          C('Schmerzempfinden', 'Wie ist das Schmerzempfinden?', ['ziehend', 'brennend', 'stechend', 'klopfend', 'drückend', 'kribbelnd', 'reißend', 'kolikartig', 'krampfend', 'dumpf', 'beengend', 'bohrend']),
          C('Schmerz verschlimmert durch', 'Welche Ereignisse verschlimmern?', ['körperliche Belastung', 'längeres Sitzen', 'längeres Stehen', 'Gehen', 'Stress', 'Kälte', 'Wärme', 'Nahrungsmittel', 'Husten', 'Niesen', 'Tageszeit', 'Wetterlage']),
          T('Verschlimmert – Anderes', 'Anderes', { full: true }),
          C('Schmerz verbessert durch', 'Welche Ereignisse verbessern?', ['Ruhe', 'Schlaf', 'Bewegung', 'Kälte', 'Wärme', 'Sport', 'Urlaub', 'Schmerzmittel']),
          C('Begleitsymptome', 'Andere Symptome zum Schmerz', ['Blässe', 'Hautrötung', 'Schwellung', 'Berührungsempfindlichkeit']),
        ] },
        { title: 'Haare', fields: [
          R('Haarausfall', 'Leiden Sie unter Haarausfall?', ['nein', 'ja']),
          T('Haarausfall seit', 'Wenn ja: seit wann?'),
          C('Haarausfall – Art', 'Art', ['kreisrund', 'vereinzelt']),
          other('Haare – Anderes'),
        ] },
      ],
    },
    {
      label: 'Abschluss', title: 'Gynäkologie & Abschluss', hint: 'Schritt 8 von 8 – fast geschafft',
      groups: [
        { title: 'Gynäkologie (nur für Frauen)', fields: [
          C('Gynäkologie', 'Zutreffendes', ['Scheidenpilz-Infektionen – 1 x', 'Scheidenpilz-Infektionen – öfters', 'Ich habe einen normalen Zyklus', 'Zyklusunregelmäßigkeiten', 'Beschwerden vor Beginn des Zyklus (Krämpfe / Brustspannen)']),
          T('Scheidenpilz zuletzt', 'Scheidenpilz zuletzt'),
          T('Operationen Uro-Genital-Trakt', 'Operationen im Uro-Genital-Trakt wegen'),
          C('Verhütung / Hormone', 'Ich nehme', ['Hormone', 'Spirale', 'Pille', 'Implantat']),
          T('Verhütung seit', 'seit … Jahren'),
          T('Hormonpause', 'Ich habe … Jahre Hormone eingenommen und mache derzeit eine Pause'),
          { t: 'number', n: 'Anzahl Geburten', l: 'Anzahl Geburten', min: 0, max: 20 },
          C('Geburten', 'Die Geburten waren', ['spontan', 'mit Kaiserschnitt']),
          T('Letzter Frauenarztbesuch', 'Mein letzter Besuch beim Frauenarzt war … bei Dr. …', { full: true }),
          R('Abstrich', 'Es wurde ein Abstrich vorgenommen', ['ja', 'nein']),
        ] },
        { title: 'Zum Schluss', fields: [
          A('Anmerkungen', 'Was möchten Sie mir sonst noch mitteilen?'),
        ] },
      ],
      consent: true,
    },
  ];

  const form = document.getElementById('anamnese-form');
  if (!form) return;

  let uid = 0;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const renderField = (f) => {
    const id = `a${++uid}`;
    const cls = `field${f.full ? ' field--full' : ''}`;
    const req = f.req ? ' required' : '';
    const star = f.req ? ' *' : '';
    const ac = f.ac ? ` autocomplete="${f.ac}"` : '';
    const ph = f.ph ? ` placeholder="${esc(f.ph)}"` : '';
    switch (f.t) {
      case 'textarea':
        return `<div class="${cls}"><label for="${id}">${esc(f.l)}${star}</label><textarea id="${id}" name="${esc(f.n)}"${req}${ph}></textarea></div>`;
      case 'select':
        return `<div class="${cls}"><label for="${id}">${esc(f.l)}${star}</label><select id="${id}" name="${esc(f.n)}"${req}>${f.opts.map((o) => `<option value="${esc(o)}">${o ? esc(o) : 'Bitte wählen'}</option>`).join('')}</select></div>`;
      case 'checks':
      case 'radio': {
        const type = f.t === 'checks' ? 'checkbox' : 'radio';
        return `<fieldset class="${cls}"><legend>${esc(f.l)}</legend><div class="chips">${f.opts.map((o) => `<label class="chip"><input type="${type}" name="${esc(f.n)}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`;
      }
      case 'scale':
        return `<fieldset class="${cls}"><legend>${esc(f.l)}</legend><div class="chips scale">${Array.from({ length: 10 }, (_, i) => `<label class="chip"><input type="radio" name="${esc(f.n)}" value="${i + 1}"><span>${i + 1}</span></label>`).join('')}</div></fieldset>`;
      default: {
        const extra = f.t === 'number' ? ` inputmode="numeric" min="${f.min ?? 0}" max="${f.max ?? 999}"` : '';
        return `<div class="${cls}"><label for="${id}">${esc(f.l)}${star}</label><input id="${id}" type="${f.t}" name="${esc(f.n)}"${req}${ac}${ph}${extra}></div>`;
      }
    }
  };

  const html = [];
  html.push(`<ol class="progress" aria-hidden="true">${STEPS.map((s, i) => `<li${i === 0 ? ' class="active"' : ''}>${esc(s.label)}</li>`).join('')}</ol>`);
  STEPS.forEach((s, i) => {
    html.push(`<fieldset class="fstep${i === 0 ? ' active' : ''}" data-step="${i}">`);
    html.push(`<legend class="sr-only">Schritt ${i + 1} von ${STEPS.length}: ${esc(s.title)}</legend>`);
    html.push(`<h3>${esc(s.title)}</h3><p class="hint">${esc(s.hint)}</p>`);
    s.groups.forEach((g) => {
      html.push(`<div class="fgroup" data-group="${esc(g.title || s.title)}">`);
      if (g.title) html.push(`<h4>${esc(g.title)}</h4>`);
      html.push(`<div class="fields">${g.fields.map(renderField).join('')}</div></div>`);
    });
    if (s.consent) {
      html.push(`<div class="fgroup"><label class="consent"><input type="checkbox" name="Einwilligung" value="ja" required> <span>Ich willige ein, dass meine Angaben einschließlich Gesundheitsdaten zur Vorbereitung und Durchführung meiner Behandlung verarbeitet und per E-Mail an die Praxis übermittelt werden. Details in der <a href="datenschutz.html">Datenschutzerklärung</a>. *</span></label></div>`);
    }
    html.push('</fieldset>');
  });
  html.push(`<div class="hp" aria-hidden="true"><label>Bitte leer lassen <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
    <div class="form-error" data-error role="alert" hidden></div>
    <div class="fstep form-success" data-step="done" role="status" hidden>
      <div class="check"><svg width="38" height="38"><use href="#i-check"/></svg></div>
      <h3>Vielen Dank!</h3>
      <p data-success-text>Ihr Anamnesebogen ist bei mir angekommen. Ich melde mich zeitnah bei Ihnen, um einen Termin zu vereinbaren.</p>
      <button type="button" class="btn btn--ghost" data-print>Kopie drucken / als PDF speichern <span class="arrow" aria-hidden="true"><svg width="14" height="14"><use href="#i-print"/></svg></span></button>
    </div>
    <div class="form-nav">
      <button type="button" class="btn btn--ghost" data-prev hidden><span class="arrow" aria-hidden="true" style="transform:rotate(180deg)"><svg width="14" height="14"><use href="#i-arrow"/></svg></span> Zurück</button>
      <span></span>
      <button type="button" class="btn" data-next>Weiter <span class="arrow" aria-hidden="true"><svg width="14" height="14"><use href="#i-arrow"/></svg></span></button>
      <button type="submit" class="btn" data-submit hidden>Bogen absenden <span class="arrow" aria-hidden="true"><svg width="14" height="14"><use href="#i-check"/></svg></span></button>
    </div>`);
  form.innerHTML = html.join('');
  form.dataset.title = 'Anamnesebogen zur ganzheitlichen Behandlung';
  document.dispatchEvent(new CustomEvent('anamnese:ready'));
})();
