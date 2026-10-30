# Praxis für Naturheilkunde · Christine Müller – Relaunch

Statische Website (HTML/CSS/JS) mit kleinem PHP-Skript für den Formularversand.
Den Ordner einfach auf den Webspace laden (ohne `_src/` ist es auch in Ordnung).

## Seiten

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite – Begrüßung, Portrait, Buttons Termin / Telefon / Kontakt |
| `ueber-mich.html` | Neuer Über-mich-Text, Schwerpunkte, Fachfortbildungen |
| `diagnostik.html` | Stuhldiagnostik, Blutuntersuchungen, Hormonuntersuchungen |
| `behandlung.html` | Alle Therapieverfahren als Reiter (verlinkbar, z. B. `behandlung.html#ihht`) |
| `anamnesebogen.html` | PDF-Download + Online-Formular (8 Schritte, entspricht dem Papierbogen) |
| `gutscheine.html` | Wert- und Behandlungsgutscheine mit Live-Vorschau und Bestellformular |
| `kontakt.html` | jameda-Terminkalender (Zwei-Klick-Lösung), Kontakt, Sprechzeiten |
| `impressum.html`, `datenschutz.html` | Rechtstexte (gelb markierte Stellen ergänzen) |

## Inhalte ändern

Header, Footer und Icons stehen nur einmal in `_src/layout.html`, die Seiteninhalte in `_src/pages/*.html`.
Nach einer Änderung im Ordner `christine-mueller-naturheilkunde` ausführen:

```
python3 _src/build.py
```

Die fertigen Seiten im Hauptordner werden dabei überschrieben – also immer in `_src/` ändern.

## Formulare (Anamnesebogen, Gutscheine)

- Versand über `api/send.php` per PHP-`mail()` an `praxis@cm-naturheilkunde.de` (Empfänger oben im Skript).
- Funktioniert auf üblichem PHP-Webspace (IONOS, Strato, all-inkl …). Mit Spam-Falle und Drosselung.
- Ohne PHP (z. B. Netlify) bietet das Formular automatisch „per E-Mail senden“ bzw. „drucken / als PDF speichern“ an.

## Marke

- Farben aus Visitenkarte/Briefbogen: Blush `#f6dcd3`, Taupe `#95776a`, Linie `#daa899` – als Variablen oben in `assets/css/styles.css`.
- Logo, Blatt-Ornament und „Ganzheitlich & natürlich“ wurden verlustfrei aus der Visitenkarten-PDF gerendert (`assets/img/`).
- Schriften lokal eingebunden (Akrobat aus den Praxisunterlagen, Fraunces, Manrope) – keine Verbindung zu Google.

## Vor dem Livegang prüfen

1. **Portrait**: `assets/img/christine-mueller.jpg` stammt aus einem Screenshot – Originalfoto in hoher Auflösung einsetzen.
2. **Sprechzeiten** bestätigen (Tabelle in `_src/pages/kontakt.html`, Footer in `_src/layout.html`, `HOURS` in `assets/js/main.js`, `_src/jsonld.html`).
3. **Texte ohne Vorlage** (von mir formuliert): Chelat-Therapie, Aderlass (mit 250–400 ml), Blutegeltherapie – bitte von der Kundin prüfen lassen bzw. alte Texte einsetzen.
4. **Gutscheine**: Gültigkeit (3 Jahre) und angebotene Behandlungen bestätigen.
5. **Impressum/Datenschutz**: gelb markierte Stellen ergänzen.
6. `.htaccess` leitet alte Adressen (`/ueber-mich`, `/kontakt`, `/anamnesebogen-ausfuellen`, …) auf die neuen Seiten weiter (Apache).
