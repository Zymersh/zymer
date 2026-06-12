// Firmenprofil pluszehn — die Grundlage für jede personalisierte Akquise-Mail.
// Alles hier ist exakt auf den Lösungskatalog (Juni 2026) und die Region Bühl abgestimmt.

export const company = {
  name: "pluszehn",
  owner: "Zymer Shala",
  city: "Bühl",
  phone: "+49 160 7125370",
  email: "info@plus-zehn.de",
  website: "https://plus-zehn.de",
  tagline: "Nicht größer denken als nötig. Aber weiter denken als bisher.",
  claim: "KI mit Kontrolle statt Autopilot.",
  pitch:
    "pluszehn baut KI- und Automatisierungs-Workflows für kleine und mittlere Betriebe " +
    "in der Region Baden. Der Einstieg ist immer ein kostenloser KI-Check: ein Ablauf, " +
    "eine ehrliche Einschätzung, kein Verkaufsdruck.",
};

// Die Region, in der pluszehn akquiriert (Standard-Städte für die Suche).
export const regionCities = [
  "Bühl",
  "Baden-Baden",
  "Achern",
  "Rastatt",
  "Bühlertal",
  "Ottersweier",
  "Sinzheim",
  "Kappelrodeck",
  "Gaggenau",
  "Karlsruhe",
];

// Die drei produktisierten Lösungen aus dem Katalog.
// Jede Lösung hat Trigger-Wörter: tauchen sie in den Google-Bewertungen eines
// Betriebs auf, ist das ein Hinweis auf genau diesen Schmerzpunkt.
export const solutions = [
  {
    id: "telefon",
    nr: "01",
    name: "Immer erreichbar",
    short: "KI-Telefonassistent — kein Anruf geht mehr verloren",
    problem:
      "Anrufe landen auf der Mailbox, Rückrufe passieren zu spät, Anliegen gehen im " +
      "Tagesgeschäft unter.",
    promise:
      "Jeder Anruf wird angenommen — auch nach Feierabend. Anliegen, Termin und nächster " +
      "Schritt liegen fertig sortiert bereit.",
    value: "≈ 14.000 € weniger Verlust und Aufwand pro Jahr",
    setup: "ab 990 € einmalige Einrichtung",
    forWho: ["Handwerk", "Praxen", "Studios", "Dienstleister"],
    // Hinweise in Bewertungen, die auf dieses Problem deuten:
    painSignals: [
      "nicht erreichbar", "niemand ging ran", "keiner ans telefon", "ständig besetzt",
      "nie erreicht", "kein rückruf", "rief nicht zurück", "telefonisch schwer",
      "lange in der warteschleife", "mailbox", "anruf", "erreichbarkeit", "termin bekommen",
    ],
  },
  {
    id: "termine",
    nr: "02",
    name: "Nie wieder mitschreiben",
    short: "Termin-Assistent — die Nacharbeit erledigt sich selbst",
    problem:
      "Nach dem Termin: Notizen abtippen, Aufgaben verteilen, Angebot vorbereiten, Nachfass " +
      "nicht vergessen. Angebote verzögern sich, Anfragen bleiben liegen.",
    promise:
      "Das Gespräch wird erfasst, die Zusammenfassung mit Aufgaben und Angebotsgrundlage liegt " +
      "direkt nach dem Termin bereit. Kein Nachfass geht mehr verloren.",
    value: "≈ 10.000 € weniger Nacharbeit pro Jahr",
    setup: "ab 990 € einmalige Einrichtung",
    forWho: ["Handwerk", "Beratung", "Vertrieb", "Planung"],
    painSignals: [
      "kein angebot", "nie ein angebot", "lange auf das angebot", "wochen auf das angebot",
      "kein kostenvoranschlag", "meldet sich nicht", "keine rückmeldung", "nichts mehr gehört",
      "nicht zurückgemeldet", "vergessen", "kümmert sich nicht", "nachfassen", "warte seit",
      "unzuverlässig", "termin nicht eingehalten", "nicht gekommen",
    ],
  },
  {
    id: "rechnungen",
    nr: "03",
    name: "Rechnungen ohne Papierkram",
    short: "Belegautomatisierung — Rechnungen erledigen sich selbst",
    problem:
      "Belege liegen verstreut, Beträge werden von Hand abgetippt, Freigaben laufen per Zuruf, " +
      "Zahlungen verspäten sich, am Monatsende fehlen Belege.",
    promise:
      "Alle Belege landen zentral, werden ausgelesen, freigegeben und sauber an Buchhaltung oder " +
      "Steuerberater übergeben. Nebenbei fit für die E-Rechnung.",
    value: "≈ 9.000 € weniger Bearbeitungsaufwand pro Jahr",
    setup: "ab 990 € einmalige Einrichtung",
    forWho: ["alle Betriebe mit regelmäßigem Belegstapel"],
    painSignals: [
      "rechnung falsch", "falsche rechnung", "rechnung nie bekommen", "doppelt berechnet",
      "buchhaltung", "beleg", "mahnung", "zahlung", "abrechnung chaotisch", "rechnungsstellung",
    ],
  },
];

// Standard-Zielbranchen für die Region — abgestimmt auf pluszehns Wunschkunden (KMU).
export const targetBranchen = [
  { label: "Sanitär & Heizung", query: "Sanitär Heizung Installateur" },
  { label: "Elektriker", query: "Elektriker Elektroinstallation" },
  { label: "Maler & Lackierer", query: "Maler Lackierer" },
  { label: "Dachdecker", query: "Dachdecker" },
  { label: "Schreiner / Tischler", query: "Schreiner Tischlerei" },
  { label: "Garten- & Landschaftsbau", query: "Garten Landschaftsbau" },
  { label: "Zahnarztpraxis", query: "Zahnarzt Zahnarztpraxis" },
  { label: "Physiotherapie", query: "Physiotherapie Praxis" },
  { label: "Hausarztpraxis", query: "Hausarzt Allgemeinmedizin" },
  { label: "Fitnessstudio", query: "Fitnessstudio" },
  { label: "Kosmetikstudio", query: "Kosmetikstudio" },
  { label: "Friseur", query: "Friseur Friseursalon" },
  { label: "Steuerberater", query: "Steuerberater Kanzlei" },
  { label: "Immobilienmakler", query: "Immobilienmakler" },
  { label: "Autohaus / Kfz-Werkstatt", query: "Kfz Werkstatt Autohaus" },
  { label: "Restaurant / Gastronomie", query: "Restaurant" },
];

// Welche Lösung passt am besten zu einer erkannten Schmerz-Kategorie?
// (Reihenfolge ist die Fallback-Priorität, wenn nichts Konkretes erkannt wurde.)
export const defaultSolutionOrder = ["telefon", "termine", "rechnungen"];
