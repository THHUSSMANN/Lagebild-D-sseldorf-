# Wöchentlicher Gesamtcheck (Lagebild)

1. Seite lokal starten: `python3 -m http.server 8088` im Repo-Ordner (Hintergrund).
2. Layout: `rm -rf /tmp/qa-prof && node tools/qa/layout-check.mjs http://localhost:8088/ /tmp/qa iphone,ipad,mac`
   → `/tmp/qa/res.json` (Breite, Überstand, kleine Knöpfe < 30 px, Schrift < 11 px, JS-Fehler) + Screenshots `/tmp/qa/<gerät>-<ansicht>.jpg`.
3. U78-Ansicht: `rm -rf /tmp/qa-prof && SEP="§" VIEWS="$(cat tools/qa/u78-schritte.txt)" node tools/qa/layout-check.mjs http://localhost:8088/ /tmp/qa-u78 iphone`
   → `res.json["iphone/u78"].text` muss mit der nächsten Abfahrt beginnen (nicht +1 h), U78-Zeilen gelb, U79/U80 mit Ziel.
4. Verbindungen: `node tools/qa/verbindungen-check.mjs` (alle VRR-Haltestellen, Busfahrten, U78, DB-IRIS über vrr-proxy.thomas-hussmann.workers.dev).
Hinweise: Der Service-Worker cached – vor jedem Lauf `/tmp/qa-prof` löschen. Wetter/Events/Spielpläne sind aus der Sandbox meist gesperrt („nicht verfügbar“ ist dort kein Fehler). Dortmund Stadion hat nur an Spieltagen Abfahrten. Einzelne HTTP 403 vom VRR sind kurzzeitige Ablehnungen (Vermittler und App versuchen es selbst erneut). TomTom (Staus/Fahrzeiten/Karte) lehnt localhost ab, weil der Schlüssel nur für die GitHub-Pages-Adresse freigegeben ist – „HTTP 403“ dort ist im lokalen Test kein Fehler.
