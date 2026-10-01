# dg | gruppe – die Gebäudedienstleister · Website-Relaunch

Statische, handgeschriebene Website (HTML/CSS/JS ohne Framework, ohne Build-Step) als Ersatz für die bisherige WordPress-Seite von **dg-gebaeudedienstleister.de**.

## Struktur

```
dg-gruppe/                 ← Web-Root (dieser Ordner wird hochgeladen)
├── index.html             Startseite (One-Pager mit allen Leistungen)
├── karriere.html          Karriereseite mit 60-Sekunden-Schnellbewerbung
├── impressum.html         Vorlage – Pflichtangaben ergänzen!
├── datenschutz.html       Vorlage – rechtlich prüfen!
├── 404.html
├── robots.txt / sitemap.xml / site.webmanifest
├── .htaccess              HTTPS, 301-Redirects alter WP-URLs, Caching, Security-Header
└── assets/
    ├── css/style.css      Design-System (Farben als Tokens ganz oben)
    ├── js/main.js         Alle Animationen & Interaktionen (~15 KB, keine Libraries)
    ├── fonts/             Inter + Inter Tight, lokal gehostet (OFL-Lizenz)
    └── img/               Favicon, Apple-Touch-Icon, OG-Bild
```

Lokal ansehen: `npx http-server dg-gruppe` (Pfade sind root-relativ, daher über einen Server öffnen, nicht per Doppelklick).

## Highlights

- **Hero „beschlagene Scheibe“** – der Besucher wischt mit Maus/Finger die Glasscheibe frei; beim Laden zieht automatisch ein Abzieher durch.
- **Apple-Style-Scrollytelling** – Wort-für-Wort-Statement, gepinnter horizontaler Prozess, Karriereleiter, die sich beim Scrollen füllt.
- **Bento-Grid** für Leistungen mit Mini-Animationen, Spotlight und 3D-Tilt.
- **Liquid-Glass-Navigation**, die sich automatisch über dunklen Abschnitten einfärbt.
- **Karriere-Funnel**: Bewerbung in 4 Klicks, ohne Lebenslauf.
- `prefers-reduced-motion` wird respektiert, alles ist per Tastatur bedienbar.

## SEO

- Saubere Überschriften-Hierarchie, sprechende Titles/Descriptions, Canonicals, Open Graph.
- Strukturierte Daten (JSON-LD): Organization, ProfessionalService (lokales Unternehmen), WebSite, FAQPage, BreadcrumbList.
- Keine Cookies, kein Tracking, keine Google Fonts → DSGVO-freundlich und schnell.
- `sitemap.xml` + `robots.txt`.

## Vor dem Go-Live – To-dos

1. **CI-Farben & Logo**: Die alte Seite war aus der Entwicklungsumgebung nicht erreichbar. Farben sind deshalb ein Vorschlag (Klarblau `#1590f0` + Aqua `#2fd8c0`). Die echten Hex-Werte in `assets/css/style.css` unter `:root` (`--brand`, `--brand-2`, `--brand-ink`) eintragen; das Logo ist aktuell als Text-Wortmarke umgesetzt und kann durch die SVG-Datei ersetzt werden.
2. **Inhalte prüfen** (aus öffentlichen Quellen zusammengetragen): Zahlen (seit 2014, 140+ Mitarbeitende, 300+ Kunden, 5 Standorte), Benefits auf der Karriereseite, Adressen/Telefonnummern der Standorte außer Heilbronn.
3. **Impressum & Datenschutz**: gelb markierte Platzhalter ergänzen (Rechtsform, Register, USt-ID, Hoster).
4. **Formulare**: Aktuell öffnen Kontakt- und Bewerbungsformular das E-Mail-Programm (funktioniert ohne Server). Für echten Versand einen Endpunkt anbinden (z. B. eigenes PHP-Skript beim Hoster oder einen DSGVO-konformen Formulardienst) und in `main.js` den `mailto`-Teil ersetzen.
5. **Echte Fotos** vom Team/Objekten erhöhen die Bewerberquote deutlich – Platz dafür ist in Karriere- und Leistungsbereich vorgesehen.
6. **Lokale Landingpages**: Die alte Seite hat Unterseiten wie `/gebaeudereinigung-heilbronn/`, `/bueroreinigung-heilbronn/`, `/sonderreinigung-bruchsal/`. Die leiten per `.htaccess` vorerst auf die Startseite um. Für die lokalen Rankings sollten sie als eigene Seiten im neuen Design nachgebaut werden (gleiche URL → kein Redirect nötig). Vor Go-Live die komplette alte Sitemap mit den Redirects abgleichen.
7. Nach dem Go-Live: Sitemap in der Google Search Console einreichen, Google-Unternehmensprofil auf die neue Seite verlinken.
