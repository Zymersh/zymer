# pluszehn Lead-Engine

Ein Akquise- und Lead-Gen-Tool, abgestimmt auf **pluszehn** (Zymer Shala, Bühl) und die
Region Baden — nachgebaut nach dem Cold-Outreach-Konzept aus dem Tweet, aber zugeschnitten
auf dein Portfolio (die drei Lösungen aus dem Lösungskatalog) und deine Umgebung.

## Was es macht

1. **Branche + Stadt eingeben** → Betriebe von **Google Maps** ziehen (Name, Adresse, Telefon,
   Website, Bewertung, bis zu 5 Reviews, GPS).
2. **Website-Anreicherung** → E-Mail, Telefon und Social-Media-Profile live aus der echten
   Website / dem Impressum.
3. **Bewertungen lesen** → echte **Schmerzpunkte** erkennen (z. B. „telefonisch nicht
   erreichbar", „wochenlang kein Angebot", „Rechnung doppelt berechnet").
4. **Abgleich mit deinem Angebot** → jeder Betrieb bekommt automatisch die passende
   pluszehn-Lösung zugeordnet:
   - schlechte Erreichbarkeit → **Lösung 01: Immer erreichbar** (KI-Telefon)
   - liegengebliebene Angebote / Nachfass → **Lösung 02: Nie wieder mitschreiben**
   - Beleg-/Rechnungschaos → **Lösung 03: Rechnungen ohne Papierkram**
5. **Personalisierte Akquise-Mail** → pro Betrieb eine eigene Mail (von **Claude** geschrieben),
   die sich konkret auf den Schmerzpunkt bezieht und über den **kostenlosen KI-Check** einsteigt.
6. **GPS-CRM** → alle Leads auf der Karte, mit Pipeline (Neu → Kontaktiert → Antwort → KI-Check
   → Kunde), Notizen und Mail-Entwürfen. Versand **einzeln** (Primary-Inbox-Logik), nicht als
   Massenmail.

## Sofort starten (Demo-Modus, ohne Schlüssel)

Voraussetzung: **Node.js ≥ 18** (empfohlen 20/22).

```bash
cd lead-engine
node server.js
```

Dann **http://localhost:4010** öffnen. Es laufen Region-Bühl-Beispieldaten und Vorlagen-Mails —
du siehst sofort, wie alles funktioniert (z. B. Branche „Zahnarztpraxis", Stadt „Baden-Baden").

## Echt-Modus (mit Google Maps + Claude)

1. `.env.example` zu `.env` kopieren und Schlüssel eintragen:
   - `GOOGLE_MAPS_API_KEY` — in der Google Cloud Console die **„Places API (New)"** aktivieren
     und einen API-Key erstellen.
   - `ANTHROPIC_API_KEY` — von <https://console.anthropic.com>.
2. Starten mit geladener `.env` (Node ≥ 20.6):

```bash
node --env-file=.env server.js
```

Sobald die Schlüssel da sind, zeigen die Badges oben rechts **„Google Maps live"** und
**„Claude-Mails live"**. Ohne Schlüssel bleibt der jeweilige Teil im Demo-/Vorlagen-Modus —
das Tool funktioniert immer.

## ⚠️ Wichtiger rechtlicher Hinweis (bitte lesen)

Kalte Werbe-E-Mails an Unternehmen sind in Deutschland **ohne vorherige Einwilligung nach
§ 7 UWG grundsätzlich unzulässig** (Abmahnrisiko), und es gilt die DSGVO. Das Tool unterstützt
dich bei **recherchierter, einzeln versandter, persönlicher** Ansprache — aber:

- Prüfe vor dem Versand eine zulässige Rechtsgrundlage (z. B. bestehender Geschäftskontakt).
- Im Zweifel auf **Anruf, Brief oder LinkedIn/Xing** ausweichen statt Cold-Mail.
- Versende einzeln und mit echtem Bezug, nicht als Massenmail.

Dieses Tool ist eine Akquise-Hilfe und **ersetzt keine Rechtsberatung**.

## Auf dein Portfolio/Region anpassen

Alles Inhaltliche steckt in **`config/pluszehn.js`**:
- `solutions` — deine drei Lösungen inkl. `painSignals` (welche Bewertungs-Wörter auf welches
  Problem hindeuten).
- `regionCities` — deine Region (Bühl, Baden-Baden, Achern, Rastatt, Karlsruhe …).
- `targetBranchen` — deine Wunsch-Branchen für die Suche.
- `company` — Kontaktdaten, Motto, Pitch (gehen in jede Mail ein).

Die Demo-Betriebe liegen in `data/demo-leads.json`.

## Aufbau

```
lead-engine/
  server.js            # Node-HTTP-Server + API (keine Dependencies)
  config/pluszehn.js   # Firmenprofil, 3 Lösungen, Region, Branchen
  lib/places.js        # Google Places (New) + Demo-Fallback
  lib/enrich.js        # Website-Scraping: E-Mail/Telefon/Socials
  lib/analyze.js       # Schmerzpunkt-Erkennung + Mail-Generierung (Claude/Vorlage)
  lib/store.js         # CRM-Speicher (JSON)
  data/demo-leads.json # Region-Bühl-Beispieldaten
  public/              # Oberfläche (HTML/CSS/JS + Leaflet-Karte)
```

Keine npm-Installation nötig — reines Node + `fetch`. Der Workflow gehört dir und läuft auch
ohne uns weiter.
