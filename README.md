# Lagebild Düsseldorf

Persönliches Dashboard für Düsseldorf (Mitte und alle zehn Stadtbezirke) sowie frei wählbare Orte (Favoriten: Datteln, Alpen-Menzelen, Salzhausen) aus offenen Schnittstellen.
Läuft komplett im Browser, ohne Server und ohne Anmeldung. © Thomas Hußmann

## Inhalte und Schnittstellen

| Bereich | Quelle |
|---|---|
| Wetter, Vorhersage, Sonnenzeiten | Open-Meteo (u. a. DWD ICON) |
| Messwerte DWD-Station, Unwetterwarnungen | Bright Sky (DWD Open Data) |
| Bevölkerungswarnungen | BBK – NINA |
| Luftqualität (Modell) | Open-Meteo / Copernicus CAMS |
| Luftmessstationen | Umweltbundesamt |
| Pollenflug | DWD-Gefahrenindex |
| Rheinpegel | WSV – PEGELONLINE |
| Stadtverkehr live (Verkehrsfluss, Sperrungen, Baustellen, Veranstaltungen), Parkhausbelegung | Verkehrszentrale Düsseldorf (vtmanager) |
| P+R, Behindertenparkplätze, Defibrillatoren, Toiletten, Radstationen, Verkehrsüberwachung | Open Data Düsseldorf |
| Polizei & Feuerwehr (Düsseldorf, Feuerwehr Datteln, regional) | Presseportal Blaulicht |
| Öffentliche Webcams (optional, eigener Schlüssel) | Windy Webcams API |
| Staus mit Karte, Autobahn-Meldungen, Sperrungen, Baustellen, Webcams, E-Laden | Autobahn GmbH des Bundes |
| Spritpreise (eigener kostenloser Schlüssel) | Tankerkönig |
| Abfahrten Nahverkehr | VRR – EFA |
| Abfahrten Bahn Hbf | db.transport.rest |
| Leihräder | nextbike |
| Feiertage, Schulferien NRW | Nager.Date, OpenHolidays API |
| Strompreis, Ökostrom-Ampel | Energy-Charts (Fraunhofer ISE) |
| Nachrichten NRW | tagesschau |

## Direktaufruf

`?ort=duesseldorf`, `?ort=dus-3` (Bezirk 3), `?ort=heerdt`, `?ort=datteln`, `?ort=alpen`, `?ort=salzhausen`

## Auf iPhone und iPad

Adresse in Safari öffnen → Teilen → „Zum Home-Bildschirm“.

## Veröffentlichung

GitHub Pages: Settings → Pages → Source „Deploy from a branch“ → Branch `main`, Ordner `/ (root)`.

## Datensammler

`tools/collect.mjs` läuft alle 10 Minuten als GitHub Action (`.github/workflows/lagebild.yml`) und holt Quellen ohne Browser-Freigabe (NINA, Presseportal, UBA, DWD-Pollen, Energy-Charts, VRR, Bahn, Open Data) nach `data/*.json`. Voraussetzung: Settings → Pages → Source „GitHub Actions“.
