# Praxis für Naturheilkunde · Christine Müller – Relaunch

Statische Website (HTML/CSS/JS, ohne Build-Schritt). Einfach den Ordner auf den Webspace laden.

## Vor dem Livegang

1. **Bilder der bisherigen Website** in `assets/img/` ablegen (fehlt ein Bild, zeigt die Seite automatisch eine botanische Grafik):
   | Datei | Einsatz | Format |
   |---|---|---|
   | `hero.jpg` | Startbereich (Bogenform) | Hochformat ca. 900 × 1170 px |
   | `christine-mueller.jpg` | Portrait „Über mich“ | Hochformat ca. 800 × 1000 px |
   | `infusion.jpg` | Kachel Infusionstherapie | Querformat ca. 1400 × 600 px |
   | `pflanzen.jpg` | Kachel Phytotherapie | ca. 800 × 600 px |
2. **Farben** anpassen: alle Farben stehen als Variablen oben in `assets/css/styles.css` (`:root`).
3. **Sprechzeiten prüfen** (stammen aus dem Branchenverzeichnis): `index.html` (Tabelle + JSON-LD) und `HOURS` in `assets/js/main.js`.
4. **Impressum/Datenschutz**: gelb markierte Stellen aus den bestehenden Texten übernehmen.
5. **Anamnesebogen**: Ohne Backend öffnet das Formular eine vorausgefüllte E-Mail. Für einen direkten, verschlüsselten Versand eine Formular-URL in `data-endpoint` am `<form id="anamnese-form">` eintragen.

Schriften (Fraunces, Manrope) sind lokal eingebunden – keine Verbindung zu Google (DSGVO).
