# BFS Home Cosmetics – Website-Relaunch

Neuer Webauftritt für **BFS Home Cosmetics** (mybfs.de), Stuckateur- & Malerbetrieb aus Schwäbisch Gmünd-Straßdorf.

## Dateien

| Datei | Zweck |
| --- | --- |
| `index.html` | One-Pager (Hero mit Farbstudio, Leistungen, WDVS-Schichtaufbau, Ablauf, Werte, Region, FAQ, Kontakt) |
| `impressum.html`, `datenschutz.html` | Rechtstexte – gelb markierte Stellen vor dem Livegang ergänzen |
| `fonts/` | Selbst gehostete Schriften (Bricolage Grotesque, Inter Tight, Instrument Serif – SIL OFL) |
| `favicon.svg`, `og-image.png` | Icon und Vorschaubild für Social Media / Messenger |
| `robots.txt`, `sitemap.xml` | Suchmaschinen |

Reines HTML/CSS/JS ohne Build-Schritt und ohne externe Abhängigkeiten – der Ordner kann direkt auf jeden Webspace hochgeladen werden.

## Vor dem Livegang

- [ ] Impressum: USt-IdNr., Berufsbezeichnung, zuständige Handwerkskammer ergänzen/prüfen
- [ ] Datenschutz: Hosting-Anbieter eintragen, Text rechtlich prüfen lassen
- [ ] Einsatzgebiet (Orte im Abschnitt „Region“) mit dem Kunden abstimmen
- [ ] Optional: Original-Logo und echte Projektfotos einsetzen
- [ ] Optional: Kontaktformular an einen Server-Mailer anbinden (aktuell `mailto:`)
- [ ] Nach dem Livegang: Sitemap in der Google Search Console einreichen, Google-Unternehmensprofil mit Website verknüpfen

## SEO

- Title/Description auf „Maler / Stuckateur / Fassade Schwäbisch Gmünd“ optimiert
- Strukturierte Daten (JSON-LD): `HomeAndConstructionBusiness`, `WebSite`, `FAQPage`
- Semantische Überschriften-Hierarchie (ein H1), Open-Graph-Tags, Canonical, Sitemap
- DSGVO-freundlich: keine Cookies, kein Tracking, keine Google Fonts, keine eingebettete Karte
