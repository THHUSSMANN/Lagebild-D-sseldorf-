// Lagebild Düsseldorf – Datensammler (© Thomas Hußmann)
// Läuft alle 10 Minuten als GitHub Action und holt Quellen ab, die der Browser
// wegen fehlender CORS-Freigabe nicht direkt abrufen darf. Ergebnis: data/*.json
import fs from "node:fs/promises";
import path from "node:path";

const OUT = process.argv[2] || "data";
const LIVE = "https://thhussmann.github.io/Lagebild-D-sseldorf-/data/";
const UA = { "User-Agent": "Lagebild-Duesseldorf/1.0 (privates Dashboard; github.com/THHUSSMANN)" };

const PLACES = {
  dus: { name: "Düsseldorf", lat: 51.2254, lon: 6.7763, ars: "051110000000", uR: 12,
    feeds: [["Polizei & Feuerwehr Düsseldorf", "https://www.presseportal.de/rss/polizei/r/D%C3%BCsseldorf.rss2"]],
    efa: "Düsseldorf Nikolaus-Knopp-Platz", db: "8000085" },
  datteln: { name: "Datteln", lat: 51.6539, lon: 7.3417, ars: "055620000000", uR: 30,
    feeds: [["Feuerwehr Datteln", "https://www.presseportal.de/rss/dienststelle_130639.rss2"], ["Blaulicht Datteln", "https://www.presseportal.de/rss/polizei/r/Datteln.rss2"]],
    efa: "Datteln Busbahnhof" },
  dortmund: { name: "Dortmund", lat: 51.5136, lon: 7.4653, ars: "059130000000", uR: 15,
    feeds: [["Polizei & Feuerwehr Dortmund", "https://www.presseportal.de/rss/polizei/r/Dortmund.rss2"]],
    efa: "Dortmund Hbf" },
  alpen: { name: "Alpen-Menzelen", lat: 51.6449, lon: 6.5634, ars: "051700000000", uR: 30,
    feeds: [["Alpen", "https://www.presseportal.de/rss/polizei/r/Alpen.rss2"], ["Xanten", "https://www.presseportal.de/rss/polizei/r/Xanten.rss2"], ["Rheinberg", "https://www.presseportal.de/rss/polizei/r/Rheinberg.rss2"]],
    efa: "Alpen Bahnhof" },
  salzhausen: { name: "Salzhausen", lat: 53.2236, lon: 10.1653, ars: "033530000000", uR: 30,
    feeds: [["Blaulicht Salzhausen", "https://www.presseportal.de/rss/polizei/r/Salzhausen.rss2"]] }
};

const results = {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url, { type = "json", ms = 25000, headers = {} } = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { ...UA, ...headers }, signal: ctl.signal });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return type === "text" ? await r.text() : JSON.parse(await r.text());
  } finally { clearTimeout(t); }
}
async function write(name, data) {
  await fs.writeFile(path.join(OUT, name), JSON.stringify({ generated: new Date().toISOString(), data }));
}
// Bei Fehlern den zuletzt veröffentlichten Stand behalten
async function job(name, fn) {
  try { const d = await fn(); await write(name, d); results[name] = "ok"; }
  catch (e) {
    results[name] = "Fehler: " + (e.message || e);
    try { const prev = await get(LIVE + name, { ms: 15000 }); prev.stale = true; await fs.writeFile(path.join(OUT, name), JSON.stringify(prev)); }
    catch { /* nichts vorhanden */ }
  }
}
const distKm = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r;
  const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const decode = s => String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/&amp;/g, "&");
const strip = s => decode(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const round = g => JSON.parse(JSON.stringify(g, (k, v) => typeof v === "number" ? Math.round(v * 1000) / 1000 : v));

// ---------- Presseportal (Polizei & Feuerwehr) ----------
function parseRss(xml, label) {
  return [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g)].map(m => {
    const it = m[1]; const tag = n => (it.match(new RegExp("<" + n + "[^>]*>([\\s\\S]*?)</" + n + ">")) || [])[1] || "";
    const enc = tag("content:encoded"); const src = (decode(enc).match(/<b>([^<]+)<\/b>/) || [])[1] || label;
    return { title: strip(tag("title")), text: strip(tag("description")).slice(0, 400), link: strip(tag("link")), date: (d => isNaN(d) ? new Date().toISOString() : d.toISOString())(new Date(strip(tag("pubDate")) || strip(tag("dc:date")))), source: src };
  });
}
async function blaulicht(key, p) {
  const all = [];
  for (const [label, url] of p.feeds) { try { all.push(...parseRss(await get(url, { type: "text" }), label).map(x => ({ ...x, ort: label }))); } catch (e) { if (p.feeds.length === 1) throw e; } await sleep(300); }
  const seen = new Set();
  return all.filter(x => !seen.has(x.link) && seen.add(x.link)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, p.feeds.length > 2 ? 45 : 25);
}

// ---------- NINA ----------
async function ninaDetail(id) {
  try { const d = await get("https://warnung.bund.de/api31/warnings/" + encodeURIComponent(id) + ".json", { ms: 15000 });
    const info = (d.info || []).find(i => /^de/i.test(i.language || "")) || (d.info || [])[0] || {};
    return { headline: info.headline, text: strip(info.description || "").slice(0, 1200), instr: strip(info.instruction || "").slice(0, 800), event: info.event, area: (info.area || []).map(a => a.areaDesc).join(", ").slice(0, 300) };
  } catch { return {}; }
}
async function ninaDashboard(p) {
  const list = await get("https://warnung.bund.de/api31/dashboard/" + p.ars + ".json");
  const out = [];
  for (const a of list || []) {
    const d = a.payload && a.payload.data || {};
    if (String(d.provider).toUpperCase() === "DWD") continue; // DWD kommt im Browser direkt
    out.push({ id: a.id, provider: d.provider, severity: d.severity, type: d.msgType, sent: a.sent, title: (a.i18nTitle && a.i18nTitle.de) || d.headline, ...(await ninaDetail(a.id)) });
  }
  return out;
}
async function ninaAll() {
  const provs = ["mowas", "katwarn", "biwapp", "lhp", "police"]; const out = [];
  for (const p of provs) {
    let list = []; try { list = await get("https://warnung.bund.de/api31/" + p + "/mapData.json"); } catch { continue; }
    for (const w of (list || []).slice(0, 40)) {
      let geo = null; try { geo = round(await get("https://warnung.bund.de/api31/warnings/" + encodeURIComponent(w.id) + ".geojson", { ms: 15000 })); } catch {}
      out.push({ id: w.id, provider: p.toUpperCase(), severity: w.severity, sent: w.startDate, title: w.i18nTitle && w.i18nTitle.de, geo });
    }
  }
  return out;
}

// ---------- Umweltbundesamt ----------
let UBA_ST = null;
async function ubaStations() {
  if (UBA_ST) return UBA_ST;
  const d = await get("https://luftdaten.umweltbundesamt.de/api/air-data/v3/stations/json?lang=de", { ms: 40000 });
  const ix = d.indices || []; const I = n => ix.indexOf(n);
  const iId = Math.max(0, I("station id")), iCode = I("station code"), iName = I("station name"), iTo = I("station active to"), iLat = I("station latitude"), iLon = I("station longitude");
  UBA_ST = Object.values(d.data || {}).filter(a => Array.isArray(a) && (iTo < 0 || !a[iTo]))
    .map(a => ({ id: a[iId], code: a[iCode], name: a[iName], lat: parseFloat(a[iLat]), lon: parseFloat(a[iLon]) })).filter(s => isFinite(s.lat) && isFinite(s.lon));
  return UBA_ST;
}
async function uba(p) {
  const st = (await ubaStations()).map(s => ({ ...s, km: distKm(p.lat, p.lon, s.lat, s.lon) })).filter(s => s.km <= p.uR).sort((a, b) => a.km - b.km).slice(0, 4);
  const day = d => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
  const rows = [];
  for (const s of st) {
    try {
      const d = await get("https://luftdaten.umweltbundesamt.de/api/air-data/v3/airquality/json?date_from=" + day(new Date(Date.now() - 864e5)) + "&time_from=1&date_to=" + day(new Date()) + "&time_to=24&station=" + s.id + "&lang=de");
      const per = d.data && (d.data[s.id] || Object.values(d.data)[0]); if (!per) continue;
      const k = Object.keys(per).sort().pop(); const v = per[k]; const comps = {};
      v.slice(3).forEach(c => { if (Array.isArray(c)) comps[c[0]] = { val: c[1], idx: c[2] }; });
      rows.push({ name: s.name, code: s.code, km: Math.round(s.km * 10) / 10, time: k, idx: v[1], comps });
    } catch {}
  }
  if (!rows.length) throw new Error("keine Messwerte");
  return rows;
}

// ---------- ÖPNV ----------
async function efa(stop) {
  // Erst die Haltestelle eindeutig bestimmen, dann die Abfahrten zur Haltestellen-ID abrufen
  const sf = await get("https://efa.vrr.de/standard/XML_STOPFINDER_REQUEST?outputFormat=rapidJSON&language=de&type_sf=any&name_sf=" + encodeURIComponent(stop));
  const best = (sf.locations || []).filter(l => l.type === "stop").sort((a, b) => (b.isBest ? 1 : 0) - (a.isBest ? 1 : 0))[0];
  if (!best) throw new Error("Haltestelle nicht gefunden: " + stop);
  const d = await get("https://efa.vrr.de/standard/XML_DM_REQUEST?outputFormat=rapidJSON&language=de&type_dm=stop&name_dm=" + encodeURIComponent(best.id) + "&mode=direct&useRealtime=1&limit=40&itdDateTimeDepArr=dep&useAllStops=1");
  d.locations = d.locations && d.locations.length ? d.locations : [best];
  const loc = d.locations && d.locations[0] && (d.locations[0].disassembledName || d.locations[0].name) || stop;
  return { stop: loc, rows: (d.stopEvents || []).map(e => { const t = e.transportation || {};
    return { planned: e.departureTimePlanned, est: e.departureTimeEstimated, line: t.disassembledName || t.number || t.name || "", dir: t.destination && t.destination.name || "",
      plat: e.location && e.location.properties && (e.location.properties.platform || e.location.properties.platformName) || "", cancelled: (e.realtimeStatus || []).includes("TRIP_CANCELLED") }; }) };
}
async function dbDeps(p) {
  let id = p.db, name = "Düsseldorf Hbf", dist = null;
  if (!id) {
    const near = await get("https://v6.db.transport.rest/locations/nearby?latitude=" + p.lat + "&longitude=" + p.lon + "&results=6&distance=3000&stops=true&poi=false&language=de");
    const s = (near || []).find(x => x.type === "stop" || x.type === "station"); if (!s) throw new Error("keine Haltestelle");
    id = s.id; name = s.name; dist = s.distance;
  }
  const d = await get("https://v6.db.transport.rest/stops/" + encodeURIComponent(id) + "/departures?duration=120&results=30&language=de" + (p.db ? "&bus=false&tram=false&subway=false" : ""));
  return { stop: name, dist, rows: (d.departures || d || []).map(x => ({ planned: x.plannedWhen || x.when, delay: x.delay != null ? Math.round(x.delay / 60) : null, line: x.line && x.line.name, dir: x.direction, plat: x.platform || x.plannedPlatform, cancelled: !!x.cancelled })) };
}

// ---------- Open Data Düsseldorf (Standorte) ----------
// Behindertenparkplätze live über den städtischen WFS; weitere Standortlisten liegen als
// statische Dateien in static/ (opendata.duesseldorf.de ist von GitHub aus nicht erreichbar)
const ODD = {
  bh: "https://maps.duesseldorf.de/services/verkehr/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=verkehr:behindertenparkplatz&outputFormat=application/json&srsName=epsg:4326&count=2000"
};
function places(j) {
  const arr = Array.isArray(j) ? j : (j.features || []);
  return arr.map(f => {
    const p = f.properties || f; let lon, lat;
    const g = f.geometry; if (g && g.type === "Point") [lon, lat] = g.coordinates; else if (g && g.coordinates) { const c = JSON.stringify(g.coordinates).match(/-?\d+\.\d+,-?\d+\.\d+/); if (c) [lon, lat] = c[0].split(",").map(Number); }
    if (lat > 90) return null; // keine WGS84-Koordinaten
    if (lat && lon && lon > lat) [lat, lon] = [lon, lat];
    const pick = re => { const k = Object.keys(p).find(k => re.test(k)); return k ? p[k] : ""; };
    const name = pick(/^(name|bezeichnung|titel|standort|einrichtung|ort_name)$/i) || pick(/name|bezeich|standort/i);
    const addr = [pick(/stra(ss|ß)e|adresse|anschrift|zufahrt/i), pick(/hausn/i)].filter(Boolean).join(" ");
    const info = [pick(/zeit|oeffn|öffn|verf(ü|ue)gbar/i), pick(/anzahl|pl(ae|ä)tze|stellpl/i) ? pick(/anzahl|pl(ae|ä)tze|stellpl/i) + " Plätze" : ""].filter(Boolean).join(" · ");
    return lat && lon ? { name: String(name || ""), addr: String(addr || "").trim(), info: String(info || ""), lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5 } : null;
  }).filter(Boolean);
}

// ---------- Feuerwehreinsätze Kreis Recklinghausen ----------
async function kreisRe() {
  const r = await fetch("https://www.kreis-re.de/inhalte/buergerservice/leben_und_wohnen/feuerwehr-_und_rettungsleitstelle/_einsaetze_der_feuerwehren/index.asp", { headers: UA });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const buf = new Uint8Array(await r.arrayBuffer());
  let html = new TextDecoder("utf-8").decode(buf);
  if (/charset=(iso-8859-1|windows-1252)/i.test(r.headers.get("content-type") || "") || /<meta[^>]+charset=["']?(iso-8859-1|windows-1252)/i.test(html) || html.includes("\uFFFD")) html = new TextDecoder("windows-1252").decode(buf);
  const cell = c => strip(c).replace(/\s+/g, " ").trim();
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(m => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => cell(c[1]))).filter(c => c.length >= 4 && /\d{2}:\d{2}:\d{2}/.test(c[0]))
    .map(c => { const [t, d] = c[0].split(/\s+/); return { time: t, date: d || "", ort: c[1], strasse: c[2], stichwort: c[3], laufend: /^ja/i.test(c[4] || "") }; });
  if (!rows.length) throw new Error("keine Einsätze in der Tabelle gefunden");
  const updated = (strip(html).match(/Letzte Aktualisierung:?\s*([\d.: ]{10,20})/i) || [])[1] || "";
  return { updated: updated.trim(), rows };
}

// ---------- Verbindungen (VRR-Fahrplanauskunft, inkl. DB-Fernverkehr) ----------
const TRIPS = [
  ["dus-re", "Düsseldorf Hbf", "Recklinghausen Hbf"],
  ["re-dus", "Recklinghausen Hbf", "Düsseldorf Hbf"],
  ["dus-do", "Düsseldorf Hbf", "Dortmund Hbf"],
  ["do-dus", "Dortmund Hbf", "Düsseldorf Hbf"],
  ["re-do", "Recklinghausen Hbf", "Dortmund Hbf"],
  ["do-re", "Dortmund Hbf", "Recklinghausen Hbf"],
  // ÖPNV mit Bus & Bahn (alle Verkehrsmittel, auch mit Umstieg)
  ["o-do-dat", "Dortmund Stadion", "Datteln Busbahnhof", true],
  ["o-dat-do", "Datteln Busbahnhof", "Dortmund Hbf", true],
  // Alpen-Menzelen und Salzhausen (Winsen/Luhe) – alle 30 Minuten neu, sonst letzter Stand
  ...[["al", "Alpen Bahnhof"], ["wl", "Winsen(Luhe)"]].flatMap(([c, n]) => [["dus", "Düsseldorf Hbf"], ["re", "Recklinghausen Hbf"], ["do", "Dortmund Hbf"]]
    .flatMap(([c2, n2]) => [[c + "-" + c2, n, n2, false, true], [c2 + "-" + c, n2, n, false, true]])),
  ["al-wl", "Alpen Bahnhof", "Winsen(Luhe)", false, true],
  ["wl-al", "Winsen(Luhe)", "Alpen Bahnhof", false, true]
];
// Haltestellenname ohne Gleis; „Recklinghausen, Recklinghausen Hbf“ → „Recklinghausen Hbf“
function stopName(x) {
  if (!x) return "";
  let p = x; while (p && p.type && p.type !== "stop" && p.parent) p = p.parent;
  const n = (p && p.name) || x.name || "";
  const parts = n.split(", ");
  return parts.length === 2 && parts[1].startsWith(parts[0]) ? parts[1] : n;
}
async function stopId(name) {
  const sf = await get("https://efa.vrr.de/standard/XML_STOPFINDER_REQUEST?outputFormat=rapidJSON&language=de&type_sf=any&name_sf=" + encodeURIComponent(name));
  const l = (sf.locations || []).filter(x => x.type === "stop").sort((a, b) => (b.isBest ? 1 : 0) - (a.isBest ? 1 : 0))[0] || (sf.locations || [])[0];
  if (!l) throw new Error("nicht gefunden: " + name);
  return { id: l.id, name: stopName(l) };
}
async function trips() {
  const out = [];
  let prev = null; try { prev = await get(LIVE + "trips.json", { ms: 15000 }); } catch {}
  for (const [key, from, to, allModes, slow] of TRIPS) {
    if (slow && prev) { const p = (prev.data || []).find(x => x.key === key); if (p && p.at && Date.now() - p.at < 30 * 60e3 && (p.journeys || []).length) { out.push(p); continue; } }
    try {
      const a = await stopId(from), b = await stopId(to);
      // Nur Züge (Fern-, Regionalverkehr, S-Bahn): Busse, U-/Straßenbahn usw. ausgeschlossen.
      // Vier Abfragen (jetzt bis in 3 Stunden), damit alle Züge der nächsten Stunden enthalten sind.
      const excl = allModes ? "" : "&excludedMeans=checkbox" + [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 19].map(n => "&exclMOT_" + n + "=1").join("");
      const at = d => { const p = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d).reduce((o, x) => (o[x.type] = x.value, o), {});
        return "&itdDate=" + p.year + p.month + p.day + "&itdTime=" + p.hour + p.minute; };
      const base = "https://efa.vrr.de/standard/XML_TRIP_REQUEST2?outputFormat=rapidJSON&language=de&type_origin=any&name_origin=" + encodeURIComponent(a.id) + "&type_destination=any&name_destination=" + encodeURIComponent(b.id) + "&itdTripDateTimeDepArr=dep&calcNumberOfTrips=10&useRealtime=1&lineRestriction=400&routeType=LEASTTIME" + excl;
      const raw = [];
      for (const t of [0, 1, 2, 3].map(h => new Date(Date.now() + h * 3600e3))) { try { const d = await get(base + at(t), { ms: 30000 }); raw.push(...(d.journeys || [])); } catch (e) { if (!raw.length) throw e; } }
      const seen = new Set();
      const journeys = raw.map(j => {
        const legs = (j.legs || []).map(l => { const t = l.transportation || {}, pc = t.product && t.product.class;
          return { line: t.disassembledName || t.number || t.name || "", name: t.name || "", walk: pc === 99 || pc === 100 || /fu(ß|ss)weg/i.test(t.name || ""), dir: t.destination && t.destination.name || "",
            from: stopName(l.origin), to: stopName(l.destination),
            dep: l.origin && l.origin.departureTimePlanned, depEst: l.origin && l.origin.departureTimeEstimated, arr: l.destination && l.destination.arrivalTimePlanned, arrEst: l.destination && l.destination.arrivalTimeEstimated,
            plat: l.origin && l.origin.properties && (l.origin.properties.platformName || l.origin.properties.platform) || "", arrPlat: l.destination && l.destination.properties && (l.destination.properties.platformName || l.destination.properties.platform) || "", dir: t.destination && t.destination.name || "", cancelled: (l.realtimeStatus || []).includes("TRIP_CANCELLED") }; });
        const ride = legs.filter(x => !x.walk);
        const rideLegs = ride;
        return { trainsOnly: rideLegs.every(l => /^(ICE|IC|EC|ECE|RE|RB|S|RRX|NX|FLX|NJ|TGV|THA)\s?\d*/i.test(l.line) || /zug|bahn/i.test(l.name)), dep: (ride[0] || legs[0] || {}).dep, depEst: (ride[0] || legs[0] || {}).depEst, arr: (ride[ride.length - 1] || legs[legs.length - 1] || {}).arr, arrEst: (ride[ride.length - 1] || legs[legs.length - 1] || {}).arrEst, changes: Math.max(0, ride.length - 1), legs };
      });
      let fern = [];
      if (!allModes) try { fern = await irisFern(from, to); } catch (e) { console.log("::warning::IRIS " + key + ": " + (e.message || e)); }
      if (!allModes) try { const fc = await fernCombos(from, to); fern.push(...fc); } catch (e) { console.log("::warning::Fern+Umstieg " + key + ": " + (e.message || e)); }
      const dur = j => (new Date(j.arrEst || j.arr) - new Date(j.depEst || j.dep)) / 6e4;
      const best = Math.min(...journeys.filter(j => j.arr && j.dep).map(dur), 999);
      journeys.push(...fern.filter(j => j.arr && j.dep && dur(j) > 0 && dur(j) <= Math.max(best + 30, 120)));
      const list = journeys.filter(j => j.dep && !seen.has(j.dep + "|" + j.legs.map(l => l.line).join(">")) && seen.add(j.dep + "|" + j.legs.map(l => l.line).join(">")))
        .filter(j => allModes || j.trainsOnly).sort((x, y) => new Date(x.dep) - new Date(y.dep));
      out.push({ key, from, to, journeys: list, at: Date.now() });
      console.log("::notice::Verbindung " + key + " (" + a.name + " → " + b.name + "): " + list.length + " Zugverbindungen (" + list.filter(j => j.legs.some(l => /^(ICE|IC|EC|ECE)/i.test(l.line))).length + " mit Fernverkehr) – " + list.map(j => j.dep.slice(11, 16) + " " + j.legs.filter(l => !l.walk).map(l => l.line).join(">")).join(" | "));
    } catch (e) { out.push({ key, from, to, error: String(e.message || e), journeys: [] }); console.log("::warning::Verbindung " + key + ": " + (e.message || e)); }
  }
  return out;
}

// ---------- DB-Fernverkehr direkt aus dem Bahn-Fahrplansystem (IRIS) ----------
// Die VRR-Auskunft plant keine ICE/IC/EC. IRIS liefert alle Züge eines Bahnhofs mit Laufweg;
// daraus nehmen wir die Fernzüge, die ohne Umstieg zum Ziel fahren.
const IRIS = "https://iris.noncd.db.de/iris-tts/timetable/";
async function irisEva(name) {
  const x = await get(IRIS + "station/" + encodeURIComponent(name), { type: "text" });
  const m = x.match(/<station[^>]*name="([^"]+)"[^>]*eva="(\d+)"/) || x.match(/<station[^>]*eva="(\d+)"[^>]*name="([^"]+)"/);
  if (!m) throw new Error("IRIS: Bahnhof nicht gefunden: " + name);
  return /^\d+$/.test(m[2]) ? m[2] : m[1];
}
const irisTime = t => t ? new Date(Date.UTC(2000 + +t.slice(0, 2), +t.slice(2, 4) - 1, +t.slice(4, 6), +t.slice(6, 8), +t.slice(8, 10)) - berlinOffset(t) * 6e4).toISOString() : null;
function berlinOffset(t) { // Minuten Abstand Berlin–UTC zum Zeitpunkt t (yyMMddHHmm)
  const d = new Date(Date.UTC(2000 + +t.slice(0, 2), +t.slice(2, 4) - 1, +t.slice(4, 6), 12));
  const s = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", timeZoneName: "shortOffset" }).formatToParts(d).find(x => x.type === "timeZoneName").value;
  const m = s.match(/GMT([+-]\d+)/); return m ? +m[1] * 60 : 60;
}
function irisStops(xml) {
  const out = {};
  for (const m of xml.matchAll(/<s id="([^"]+)"[^>]*>([\s\S]*?)<\/s>/g)) {
    const id = m[1], body = m[2], trip = id.replace(/-\d+$/, "").replace(/-\d{10}$/, "");
    const tl = (body.match(/<tl ([^>]*)\/?>/) || [])[1] || "";
    const at = (str, k) => (str.match(new RegExp(k + '="([^"]*)"')) || [])[1];
    const dp = (body.match(/<dp ([^>]*)\/?>/) || [])[1] || "", ar = (body.match(/<ar ([^>]*)\/?>/) || [])[1] || "";
    out[id] = { id, trip, cat: at(tl, "c"), num: at(tl, "n"), dpT: at(dp, "pt"), dpCt: at(dp, "ct"), dpPp: at(dp, "pp"), dpPath: at(dp, "ppth"), dpCs: at(dp, "cs"), arT: at(ar, "pt"), arCt: at(ar, "ct"), arCs: at(ar, "cs"), arPp: at(ar, "pp") };
  }
  return out;
}
async function irisHours(eva, hours) {
  const all = {};
  for (const h of hours) {
    const p = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false }).formatToParts(new Date(Date.now() + h * 3600e3)).reduce((o, x) => (o[x.type] = x.value, o), {});
    try { Object.assign(all, irisStops(await get(IRIS + "plan/" + eva + "/" + p.year + p.month + p.day + "/" + p.hour, { type: "text" }))); } catch {}
  }
  try { // Echtzeit-Änderungen
    const ch = irisStops(await get(IRIS + "fchg/" + eva, { type: "text" }));
    for (const [id, c] of Object.entries(ch)) if (all[id]) { const a = all[id]; a.dpCt = c.dpCt || a.dpCt; a.arCt = c.arCt || a.arCt; a.dpCs = c.dpCs || a.dpCs; a.arCs = c.arCs || a.arCs; a.dpPp = c.dpPp || a.dpPp; a.arPp = c.arPp || a.arPp; }
  } catch {}
  return all;
}
async function irisFern(from, to) {
  const [ea, eb] = [await irisEva(from), await irisEva(to)];
  const A = await irisHours(ea, [0, 1, 2, 3]), B = await irisHours(eb, [0, 1, 2, 3, 4, 5]);
  const byTrip = {}; for (const x of Object.values(B)) byTrip[x.trip] = x;
  const toName = to.replace(/ Hbf$/, "");
  return Object.values(A).filter(x => /^(ICE|IC|EC|ECE|NJ|FLX)$/.test(x.cat || "") && x.dpT && (x.dpPath || "").split("|").some(s => s.startsWith(toName)))
    .map(x => { const y = byTrip[x.trip] || {}; const line = x.cat + " " + x.num;
      return { fern: true, trainsOnly: true, dep: irisTime(x.dpT), depEst: irisTime(x.dpCt || x.dpT), arr: irisTime(y.arT), arrEst: irisTime(y.arCt || y.arT), changes: 0,
        legs: [{ line, name: line, walk: false, from, to, dep: irisTime(x.dpT), depEst: irisTime(x.dpCt || x.dpT), arr: irisTime(y.arT), arrEst: irisTime(y.arCt || y.arT), plat: x.dpPp || "", arrPlat: y.arPp || "", dir: (x.dpPath || "").split("|").pop() || "", cancelled: x.dpCs === "c" }] }; });
}

// ---------- Fernzug + Umstieg (z. B. ICE bis Gelsenkirchen, weiter mit RE) ----------
const HUBS = ["Gelsenkirchen Hbf", "Essen Hbf", "Oberhausen Hbf", "Duisburg Hbf", "Dortmund Hbf"];
const isTrain = l => /^(ICE|IC|EC|ECE|RE|RB|S|RRX|NX|FLX|NJ|SEV)\s?\d*/i.test(l.line) || /zug|bahn/i.test(l.name);
const evaCache = {}, planCache = {};
async function evaOf(n) { return evaCache[n] || (evaCache[n] = await irisEva(n)); }
async function planOf(n, hours) { const k = n + hours.join(","); return planCache[k] || (planCache[k] = await irisHours(await evaOf(n), hours)); }
const berlinParam = (d, mode) => { const p = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d).reduce((o, x) => (o[x.type] = x.value, o), {});
  return "&itdDate=" + p.year + p.month + p.day + "&itdTime=" + p.hour + p.minute + "&itdTripDateTimeDepArr=" + mode; };
async function efaLegs(from, to, when, mode) {
  const a = await stopId(from), b = await stopId(to);
  const excl = "&excludedMeans=checkbox" + [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 19].map(n => "&exclMOT_" + n + "=1").join("");
  const d = await get("https://efa.vrr.de/standard/XML_TRIP_REQUEST2?outputFormat=rapidJSON&language=de&type_origin=any&name_origin=" + encodeURIComponent(a.id) + "&type_destination=any&name_destination=" + encodeURIComponent(b.id) + "&calcNumberOfTrips=3&useRealtime=1" + excl + berlinParam(when, mode), { ms: 30000 });
  const js = (d.journeys || []).map(j => (j.legs || []).map(l => { const t = l.transportation || {}, pc = t.product && t.product.class;
    return { line: t.disassembledName || t.number || t.name || "", name: t.name || "", walk: pc === 99 || pc === 100 || /fu(ß|ss)weg/i.test(t.name || ""), from: stopName(l.origin), to: stopName(l.destination),
      dep: l.origin && l.origin.departureTimePlanned, depEst: l.origin && l.origin.departureTimeEstimated, arr: l.destination && l.destination.arrivalTimePlanned, arrEst: l.destination && l.destination.arrivalTimeEstimated,
      plat: l.origin && l.origin.properties && (l.origin.properties.platformName || l.origin.properties.platform) || "", arrPlat: l.destination && l.destination.properties && (l.destination.properties.platformName || l.destination.properties.platform) || "", dir: t.destination && t.destination.name || "", cancelled: (l.realtimeStatus || []).includes("TRIP_CANCELLED") }; }).filter(l => !l.walk));
  return js.filter(x => x.length);
}
async function fernCombos(from, to) {
  const out = [], toBase = to.replace(/ Hbf$/, ""), fromBase = from.replace(/ Hbf$/, "");
  const isFern = x => /^(ICE|IC|EC|ECE)$/.test(x.cat || "");
  const fernLeg = (x, y, a, b) => ({ line: x.cat + " " + x.num, name: x.cat, walk: false, from: a, to: b, dep: irisTime(x.dpT), depEst: irisTime(x.dpCt || x.dpT), arr: irisTime(y.arT), arrEst: irisTime(y.arCt || y.arT), plat: x.dpPp || "", arrPlat: y.arPp || "", dir: (x.dpPath || "").split("|").pop() || "", cancelled: x.dpCs === "c" || y.arCs === "c" });
  // Richtung 1: Fernzug ab Start bis Umstiegsbahnhof, dann Nahverkehr zum Ziel
  const A = await planOf(from, [0, 1, 2, 3]);
  for (const x of Object.values(A).filter(x => isFern(x) && x.dpT)) {
    const path = (x.dpPath || "").split("|"); const hub = HUBS.find(h => path.includes(h)); if (!hub) continue;
    const H = await planOf(hub, [0, 1, 2, 3, 4]); const y = Object.values(H).find(z => z.trip === x.trip && z.arT); if (!y) continue;
    const t = new Date(new Date(irisTime(y.arCt || y.arT)).getTime() + 4 * 6e4);
    let legs = []; try { legs = (await efaLegs(hub, to, t, "dep")).filter(l => l.every(isTrain)); } catch {} if (!legs[0]) continue;
    const rest = legs[0], f = fernLeg(x, y, from, hub);
    out.push({ fern: true, trainsOnly: true, dep: f.dep, depEst: f.depEst, arr: rest[rest.length - 1].arr, arrEst: rest[rest.length - 1].arrEst, changes: rest.length, legs: [f, ...rest] });
    if (out.length >= 8) break;
  }
  // Richtung 2: Nahverkehr bis Umstiegsbahnhof, dann Fernzug zum Ziel
  if (!out.length) for (const hub of HUBS) {
    let H, T; try { H = await planOf(hub, [0, 1, 2, 3]); T = await planOf(to, [0, 1, 2, 3, 4, 5]); } catch { continue; }
    for (const x of Object.values(H).filter(x => isFern(x) && x.dpT && (x.dpPath || "").split("|").some(s => s.startsWith(toBase)))) {
      const y = Object.values(T).find(z => z.trip === x.trip && z.arT); if (!y) continue;
      const by = new Date(new Date(irisTime(x.dpCt || x.dpT)).getTime() - 5 * 6e4); if (by < Date.now()) continue;
      let legs = []; try { legs = (await efaLegs(from, hub, by, "arr")).filter(l => l.every(isTrain)); } catch {} const pre = legs.filter(l => new Date(l[l.length - 1].arrEst || l[l.length - 1].arr) <= by).pop(); if (!pre) continue;
      const f = fernLeg(x, y, hub, to);
      out.push({ fern: true, trainsOnly: true, dep: pre[0].dep, depEst: pre[0].depEst, arr: f.arr, arrEst: f.arrEst, changes: pre.length, legs: [...pre, f] });
      if (out.length >= 8) break;
    }
    if (out.length >= 8) break;
  }
  return out;
}

// ---------- Ablauf ----------
await fs.mkdir(OUT, { recursive: true });
const tasks = [];
for (const [k, p] of Object.entries(PLACES)) {
  tasks.push(job("blaulicht-" + k + ".json", () => blaulicht(k, p)));
  tasks.push(job("nina-" + k + ".json", () => ninaDashboard(p)));
  tasks.push(job("uba-" + k + ".json", () => uba(p)));
  if (p.efa) tasks.push(efaPlace(k, p));
}
// zusätzliche Orte nur für Abfahrten (Reise → ÖPNV)

function efaPlace(k, p) { return (async () => {
    // mehrere Haltestellen je Ort (config/haltestellen.json) + Haltestellenverzeichnis für die Suche
    let list = [p.efa]; try { const cfg = JSON.parse(await fs.readFile(new URL("../config/haltestellen.json", import.meta.url), "utf8")); if (Array.isArray(cfg[k]) && cfg[k].length) list = cfg[k]; } catch {}
    const avail = [];
    for (const [i, name] of list.entries()) {
      const file = i === 0 ? "efa-" + k + ".json" : "efa-" + k + "-" + i + ".json";
      await job(file, async () => { const r = await efa(name); avail.push({ q: name, name: r.stop, file }); return r; });
    }
    await job("stops-" + k + ".json", async () => {
      const centers = k === "dus" ? [[6.7763, 51.2254], [6.7086, 51.2296], [6.84, 51.25], [6.80, 51.18], [6.77, 51.29]] : [[p.lon, p.lat]];
      const locs = [];
      for (const [lo, la] of centers) { try { const d = await get("https://efa.vrr.de/standard/XML_COORD_REQUEST?outputFormat=rapidJSON&language=de&coord=" + lo.toFixed(5) + ":" + la.toFixed(5) + ":WGS84[dd.ddddd]&inclFilter=1&type_1=STOP&radius_1=" + (k === "dus" ? 4000 : 5000) + "&max=1000", { ms: 40000 }); locs.push(...(d.locations || [])); } catch {} }
      const all = [...new Map(locs.map(l => [l.id, { id: l.id, name: stopName(l) || l.name, dist: l.properties && +l.properties.distance || null }])).values()].sort((a, b) => a.name.localeCompare(b.name, "de"));
      console.log("::notice::Haltestellen " + k + ": " + all.length + " im Verzeichnis, abgerufen: " + avail.map(a => a.name).join(", "));
      return { available: avail, all };
    });
  })(); }
tasks.push(job("nina-all.json", ninaAll));
tasks.push(job("einsaetze-kreis-re.json", kreisRe));
tasks.push(job("trips.json", trips));
// BVB-Spielplan aus dem offiziellen Kalender-Abo (iCal über cal.to/Calovo, vom Nutzer bereitgestellt)
tasks.push(job("bvbcal.json", async () => {
  const URLS = ["https://i.cal.to/ical/3/borussiadortmund/bundesliga-spielplan/de/d20dad09.619990dc-68cb5b4d.ics",
                "https://i.cal.to/ical/3/borussiadortmund/bundesliga-spielplan/de/d20dad09.619990dc-15b8d7b8.ics"]; // Bundesliga + Champions League
  const raws = (await Promise.all(URLS.map(u => get(u, { type: "text" }).catch(() => "")))).filter(Boolean);
  if (!raws.length) throw new Error("Kalender nicht erreichbar");
  const raw = raws.join("\n");
  const lines = raw.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "").split(/\r?\n/);
  const ev = []; let cur = null;
  const unesc = s => (s || "").replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\;/g, ";").replace(/\\\\/g, "\\").trim();
  const dt = (v, p) => { const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/.exec(v || ""); if (!m) return null;
    const iso = m[1] + "-" + m[2] + "-" + m[3] + "T" + (m[4] || "00") + ":" + (m[5] || "00") + ":" + (m[6] || "00");
    return m[7] ? iso + "Z" : iso; /* ohne Z = Ortszeit (Europe/Berlin) */ };
  for (const l of lines) {
    if (l === "BEGIN:VEVENT") { cur = {}; continue; }
    if (l === "END:VEVENT") { if (cur && cur.start) ev.push(cur); cur = null; continue; }
    if (!cur) continue;
    const i = l.indexOf(":"); if (i < 0) continue; const key = l.slice(0, i), val = l.slice(i + 1), name = key.split(";")[0];
    if (name === "DTSTART") cur.start = dt(val);
    else if (name === "SUMMARY") cur.summary = unesc(val);
    else if (name === "LOCATION") cur.location = unesc(val);
    else if (name === "DESCRIPTION") cur.desc = unesc(val).slice(0, 300);
    else if (name === "CATEGORIES") cur.cat = unesc(val);
  }
  const now = Date.now() - 3 * 36e5;
  const seen = new Set(); const uniq = ev.filter(e => { const k = e.start + "|" + (e.summary || ""); if (seen.has(k)) return false; seen.add(k); return true; });
  const fut = uniq.filter(e => new Date(e.start).getTime() > now).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 12);
  if (!ev.length) throw new Error("keine Termine im Kalender");
  return { events: fut, total: ev.length };
}));
// Flugzeuge über Düsseldorf (Ersatz, falls der Browser adsb.fi nicht direkt abfragen darf)
tasks.push(job("flights.json", async () => {
  let d; try { d = await get("https://opendata.adsb.fi/api/v2/lat/51.2895/lon/6.7668/dist/16"); }
  catch { d = await get("https://api.airplanes.live/v2/point/51.2895/6.7668/16"); }
  return { ac: (d.ac || d.aircraft || []).map(a => ({ cs: (a.flight || "").trim(), reg: a.r || "", type: a.t || "", alt: a.alt_baro, gs: a.gs, lat: a.lat, lon: a.lon, trk: a.track })) };
}));
tasks.push(job("pollen.json", () => get("https://opendata.dwd.de/climate_environment/health/alerts/s31fg.json")));
// Radio: Stream-Adressen prüfen (bekannte Adressen zuerst, sonst radio-browser.info)
tasks.push(job("radio.json", async () => {
  const ST = [
    ["wdr2", "WDR 2 Rhein und Ruhr", ["https://wdr-wdr2-rheinruhr.icecastssl.wdr.de/wdr/wdr2/rheinruhr/mp3/128/stream.mp3", "https://wdr-wdr2-rheinruhr.icecast.wdr.de/wdr/wdr2/rheinruhr/mp3/128/stream.mp3"], "WDR 2 Rhein und Ruhr"],
    ["wdr4", "WDR 4", ["https://wdr-wdr4-live.icecastssl.wdr.de/wdr/wdr4/live/mp3/128/stream.mp3", "https://wdr-wdr4-live.icecast.wdr.de/wdr/wdr4/live/mp3/128/stream.mp3"], "WDR 4"],
    ["antenne", "Antenne Düsseldorf", ["https://antenneduesseldorf-live.cast.addradio.de/antenneduesseldorf/live/mp3/high", "https://edge.audio.3qsdn.com/antenneduesseldorf", "https://stream.antenneduesseldorf.de/live/mp3-192"], "Antenne Duesseldorf", "https://www.antenneduesseldorf.de/"],
    ["orfstm", "Radio Steiermark", ["https://orf-live.ors-shoutcast.at/stm-q2a", "https://orf-live.ors-shoutcast.at/stm-q1a"], "Radio Steiermark ORF"],
    ["orfnoe", "Radio Niederösterreich", ["https://orf-live.ors-shoutcast.at/noe-q2a", "https://orf-live.ors-shoutcast.at/noe-q1a"], "Radio Niederösterreich ORF"],
    ["kronehit", "KRONEHIT", ["https://secureonair.krone.at/kronehit-hp.mp3", "https://secureonair.krone.at/kronehit.mp3"], "KRONEHIT"],
    ["antstm", "Antenne Steiermark", ["https://live.antenne.at/as", "https://antenne-steiermark.radio.at/live"], "Antenne Steiermark"]
  ];
  const ok = async u => { const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
    try { const r = await fetch(u, { headers: UA, signal: ctl.signal }); const ct = r.headers.get("content-type") || ""; ctl.abort(); return r.ok && /audio|mpeg|aac|ogg|octet/i.test(ct) ? u : null; } catch { return null; } finally { clearTimeout(t); } };
  const out = {};
  for (let [k, name, known, q, home] of ST) {
    let url = null;
    if (home) { try { const h = await get(home, { type: "text" }); const found = [...new Set([...h.matchAll(/https?:\/\/[^"'\s<>]+?(?:\.mp3|\.aac|\/mp3[^"'\s<>]*|streamonkey[^"'\s<>]*|addradio[^"'\s<>]*|\/stream[^"'\s<>]*)/gi)].map(m => m[0].replace(/\\\//g, "/")))].slice(0, 12); known = [...found.filter(x => /^https:/.test(x)), ...known]; } catch (e) { console.log("::notice::Radio " + k + " Webseite: " + e.message); } }
    for (const u of known) if ((url = await ok(u))) break;
    if (!url) { try {
      const l = [...await get("https://de1.api.radio-browser.info/json/stations/search?name=" + encodeURIComponent(q) + "&hidebroken=true&order=votes&reverse=true&limit=15"), ...(k === "antenne" ? await get("https://de1.api.radio-browser.info/json/stations/search?name=" + encodeURIComponent("Antenne Düsseldorf") + "&limit=15") : [])];
      for (const x of l.filter(x => x.lastcheckok === 1 && /^https:/.test(x.url_resolved))) if ((url = await ok(x.url_resolved))) break;
    } catch (e) { console.log("::notice::Radio-Suche " + k + ": " + e.message); } }
    out[k] = { name, url };
    
  }
  console.log("::notice::Radio: " + Object.values(out).map(x => x.name + (x.url ? " ok" : " fehlt")).join(", "));
  return out;
}));
tasks.push(job("boerse.json", async () => {
  const SYMS = [["^GDAXI", "DAX"], ["^MDAXI", "MDAX"], ["^TECDAX", "TecDAX"], ["^STOXX50E", "Euro Stoxx 50"], ["^GSPC", "S&P 500"], ["^IXIC", "Nasdaq"], ["^N225", "Nikkei 225"], ["EURUSD=X", "Euro in US-Dollar"], ["GC=F", "Gold (USD je Unze)"], ["BZ=F", "Öl Brent (USD je Barrel)"], ["BTC-EUR", "Bitcoin (EUR)"]];
  const y = async (sym, q) => { let last; for (const h of ["query1", "query2"]) { try { return await get("https://" + h + ".finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(sym) + "?" + q, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15" } }); } catch (e) { last = e; } } throw last; };
  const quotes = (await Promise.all(SYMS.map(async ([sym, name]) => {
    try {
      const day = (await y(sym, "range=1d&interval=5m")).chart.result[0];
      const m = day.meta; const pts = (day.indicators.quote[0].close || []).filter(v => v != null);
      let m1 = null; try { const mo = (await y(sym, "range=1mo&interval=1d")).chart.result[0]; const c = (mo.indicators.quote[0].close || []).filter(v => v != null); if (c.length) m1 = (m.regularMarketPrice - c[0]) / c[0] * 100; } catch {}
      const step = Math.max(1, Math.floor(pts.length / 60));
      return { sym, name, price: m.regularMarketPrice, prev: m.chartPreviousClose ?? m.previousClose ?? null, time: m.regularMarketTime, cur: m.currency, m1, pts: pts.filter((_, i) => i % step === 0) };
    } catch (e) { console.log("::notice::Börse " + sym + " fehlgeschlagen: " + e.message); return null; }
  }))).filter(Boolean);
  let gold = null;
  try { const g = (await y("GC=F", "range=1y&interval=1d")).chart.result[0]; const fx = (await y("EURUSD=X", "range=1y&interval=1d")).chart.result[0];
    const gc = g.indicators.quote[0].close, gt = g.timestamp, fc = fx.indicators.quote[0].close, ft = fx.timestamp;
    const fxAt = t => { let best = null; for (let i = 0; i < ft.length; i++) { if (ft[i] <= t + 86400 && fc[i] != null) best = fc[i]; } return best; };
    const pts = gt.map((t, i) => gc[i] != null ? { t, usd: gc[i], eur: fxAt(t) ? gc[i] / fxAt(t) : null } : null).filter(Boolean);
    gold = { pts: pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1) };
  } catch (e) { console.log("::notice::Gold-Verlauf: " + e.message); }
  console.log("::notice::Börse: " + quotes.length + " Kurse, DAX " + (quotes[0] && quotes[0].price));
  if (!quotes.length) throw new Error("keine Kurse");
  return { quotes, gold };
}));
for (const [k, url] of Object.entries(ODD)) tasks.push(job("odd-" + k + ".json", async () => places(await get(url, { ms: 40000 }))));
await Promise.all(tasks);
// ---------- Landespegel NRW (Düssel, Anger) – LANUK Hochwasserportal ----------
await job("landespegel.json", async () => {
  const L = await get("https://hochwasserportal.nrw.de/lanuv/data/internet/layers/10/index.json", { ms: 40000 });
  const arr = Array.isArray(L) ? L : (L.features || L.data || Object.values(L));
  const pick = arr.filter(x => /^(Düssel|Anger|Angerbach|Schwarzbach|Itter)$/i.test(String(x.WTO_OBJECT || "")));
  if (pick[0]) console.log("::notice::Landespegel Felder: " + Object.keys(pick[0]).join(","));
  const out = pick.map(x => ({ name: x.station_name, no: x.station_no, site: x.site_no, water: x.WTO_OBJECT, lat: +x.station_latitude, lon: +x.station_longitude,
    value: x.ts_value != null ? +x.ts_value : null, time: x.timestamp || x.ts_timestamp || null, unit: x.ts_unitsymbol || "cm", type: x.WEB_STATYPE,
    mnw: +x.LANUV_MNW || null, mw: +x.LANUV_MW || null, mhw: +x.LANUV_MHW || null, i1: +x.LANUV_Info_1 || null, i2: +x.LANUV_Info_2 || null, i3: +x.LANUV_Info_3 || null, raw: x }));
  console.log("::notice::Landespegel: " + out.map(o => o.water + " " + o.name + " = " + o.value + " (" + o.time + ") MW " + o.mw).join(" | "));
  out.forEach(o => delete o.raw);
  return out;
});
// ---------- Direkte Busfahrten (z. B. Datteln Lohstr. → Busbahnhof) ----------
await job("busfahrten.json", async () => {
  let cfg = {}; try { cfg = JSON.parse(await fs.readFile(new URL("../config/haltestellen.json", import.meta.url), "utf8"))._fahrten || {}; } catch {}
  const out = [];
  for (const [k, pairs] of Object.entries(cfg)) for (const [from, to] of pairs) {
    try {
      const a = await stopId(from), b = await stopId(to);
      const at = t => { const p = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(t).reduce((o, x) => (o[x.type] = x.value, o), {}); return "&itdDate=" + p.year + p.month + p.day + "&itdTime=" + p.hour + p.minute; };
      const js = [];
      for (const h of [0, 1, 2]) { try { const d = await get("https://efa.vrr.de/standard/XML_TRIP_REQUEST2?outputFormat=rapidJSON&language=de&type_origin=any&name_origin=" + encodeURIComponent(a.id) + "&type_destination=any&name_destination=" + encodeURIComponent(b.id) + "&itdTripDateTimeDepArr=dep&calcNumberOfTrips=6&maxChanges=0&useRealtime=1" + at(new Date(Date.now() + h * 3600e3)), { ms: 30000 }); js.push(...(d.journeys || [])); } catch (e) { if (!js.length && h === 2) throw e; } }
      const seen = new Set();
      const rows = js.map(j => j.legs.filter(l => l.transportation && l.transportation.product && l.transportation.product.class !== 100 && l.transportation.product.class !== 99)).filter(l => l.length === 1).map(([l]) => ({
        line: l.transportation.disassembledName || l.transportation.number || "", dir: (l.transportation.destination || {}).name || "",
        dep: l.origin.departureTimePlanned, depEst: l.origin.departureTimeEstimated, arr: l.destination.arrivalTimePlanned, arrEst: l.destination.arrivalTimeEstimated,
        plat: l.origin.properties && (l.origin.properties.platformName || l.origin.properties.platform) || "" })).filter(r => { const k = r.line + r.dep; if (seen.has(k)) return false; seen.add(k); return true; }).sort((x, y) => x.dep.localeCompare(y.dep));
      out.push({ key: k, from: a.name, to: b.name, fromQ: from, rows });
      console.log("::notice::Busfahrten " + a.name + " → " + b.name + ": " + rows.map(r => r.line + " " + (r.dep || "").slice(11, 16)).join(", "));
    } catch (e) { console.log("::notice::Busfahrten " + from + " → " + to + " Fehler: " + e.message); }
  }
  return out;
});
// ---------- Weitere Medien je Ort ----------
await job("medien.json", async () => {
  const WDR = ["https://www1.wdr.de/nachrichten/uebersicht-nachrichten-100.feed", "https://www1.wdr.de/nachrichten/index.feed", "https://www1.wdr.de/uebersicht-100.feed"];
  const F = {
    dus: [["Rheinische Post Düsseldorf", "https://rp-online.de/nrw/staedte/duesseldorf/feed.rss"], ["WDR", WDR], ["Westdeutsche Zeitung", ["https://www.wz.de/nrw/duesseldorf/feed.rss", "https://www.wz.de/feed.rss"]], ["Bild Düsseldorf", ["https://www.bild.de/feed/regional-duesseldorf.xml", "https://www.bild.de/feed/regional/duesseldorf.xml", "https://www.bild.de/rssfeeds/vw-duesseldorf/vw-duesseldorf-16786698,dzbildplus=true,sort=1,teaserbildmobil=false,view=rss2.bild.xml"]]],
    dortmund: [["WDR", WDR], ["Ruhr Nachrichten", ["https://www.ruhrnachrichten.de/feed/", "https://www.ruhrnachrichten.de/rss"]]],
    datteln: [["WDR", WDR], ["Ruhr Nachrichten", ["https://www.ruhrnachrichten.de/feed/", "https://www.ruhrnachrichten.de/rss"]], ["Recklinghäuser Zeitung", ["https://www.recklinghaeuser-zeitung.de/feed/"]], ["Bild Ruhrgebiet", ["https://www.bild.de/feed/regional-ruhrgebiet.xml", "https://www.bild.de/feed/regional/ruhrgebiet.xml", "https://www.bild.de/rssfeeds/vw-ruhrgebiet/vw-ruhrgebiet-16786752,dzbildplus=true,sort=1,teaserbildmobil=false,view=rss2.bild.xml"]]],
    alpen: [["Rheinische Post Kreis Wesel", "https://rp-online.de/nrw/staedte/wesel/feed.rss"], ["RP Xanten", "https://rp-online.de/nrw/staedte/xanten/feed.rss"], ["RP Rheinberg", "https://rp-online.de/nrw/staedte/rheinberg/feed.rss"], ["RP Alpen", "https://rp-online.de/nrw/staedte/alpen/feed.rss"],
      ["NRZ Wesel", ["https://www.nrz.de/lokales/wesel-hamminkeln-schermbeck/feed.rss", "https://www.nrz.de/lokales/wesel-hamminkeln-schermbeck/rss", "https://www.nrz.de/staedte/wesel-hamminkeln-schermbeck/feed.rss", "https://www.nrz.de/rss"]],
      ["Niederrhein Nachrichten", ["https://www.niederrhein-nachrichten.de/feed/", "https://niederrhein-nachrichten.de/feed/", "https://www.nn-online.de/feed/"]],
      ["Radio KW", ["https://www.radiokw.de/nachrichten/lokalnachrichten/index.rss", "https://www.radiokw.de/rss/lokalnachrichten.xml", "https://www.radiokw.de/feed/", "https://www.radiokw.de/rss"]], ["WDR", WDR]],
    salzhausen: [["NDR Lüneburger Heide", ["https://www.ndr.de/nachrichten/niedersachsen/lueneburg_heide_unterelbe/index-rss.xml", "https://www.ndr.de/nachrichten/niedersachsen/lueneburg_heide_unterelbe/index~rss2.xml"]], ["NDR Niedersachsen", ["https://www.ndr.de/nachrichten/niedersachsen/index-rss.xml", "https://www.ndr.de/nachrichten/niedersachsen/index~rss2.xml", "https://www.ndr.de/home/index-rss.xml"]],
      ["Kreiszeitung Wochenblatt", ["https://www.kreiszeitung-wochenblatt.de/feed/", "https://www.kreiszeitung-wochenblatt.de/rss", "https://www.kreiszeitung-wochenblatt.de/winsen/rss"]], ["Winsener Anzeiger", ["https://www.winsener-anzeiger.de/feed/", "https://www.winsener-anzeiger.de/rss"]],
      ["Hamburger Abendblatt Harburg", ["https://www.abendblatt.de/hamburg/harburg/rss", "https://www.abendblatt.de/region/kreis-harburg/rss"]], ["Landeszeitung Lüneburg", ["https://www.landeszeitung.de/feed/", "https://www.landeszeitung.de/rss"]]]
  };
  const cache = {}; const out = {}; const stat = [];
  for (const [k, list] of Object.entries(F)) {
    const items = [];
    for (const [label, url] of list) {
      const urls = Array.isArray(url) ? url : [url]; let got = null, err = "";
      for (const u of urls) { if (cache[u]) { got = cache[u]; break; } try { const r = parseRss(await get(u, { type: "text", ms: 20000 }), label).map(x => ({ ...x, source: label })); if (r.length) { cache[u] = got = r; break; } err = u + " leer"; } catch (e) { err = u + " " + e.message; } }
      if (got) { items.push(...got); stat.push(label + " " + got.length); } else stat.push(label + " Fehler " + err);
    }
    const seen = new Set();
    const per = {};
    out[k] = items.filter(x => x.title && !seen.has(x.title) && seen.add(x.title)).sort((a, b) => b.date.localeCompare(a.date))
      .filter(x => (per[x.source] = (per[x.source] || 0) + 1) <= 6).slice(0, 40);
  }
  console.log("::notice::Medien: " + [...new Set(stat)].join(" | "));
  // überregional
  { const N = [["Spiegel", "https://www.spiegel.de/schlagzeilen/index.rss"], ["Zeit", "https://newsfeed.zeit.de/index"], ["FAZ", "https://www.faz.net/rss/aktuell/"], ["Welt", "https://www.welt.de/feeds/latest.rss"], ["Bild", "https://www.bild.de/feed/alles.xml"], ["Süddeutsche", "https://rss.sueddeutsche.de/rss/Topthemen"]];
    const items = [];
    for (const [label, url] of N) { try { const r = parseRss(await get(url, { type: "text", ms: 20000 }), label).map(x => ({ ...x, source: label })); items.push(...r); stat.push(label + " " + r.length); } catch (e) { stat.push(label + " Fehler " + e.message); } }
    const seen = new Set(), per = {};
    out._national = items.filter(x => x.title && !seen.has(x.title) && seen.add(x.title)).sort((a, b) => b.date.localeCompare(a.date)).filter(x => (per[x.source] = (per[x.source] || 0) + 1) <= 6).slice(0, 40); }
  out._stat = [...new Set(stat)];
  return out;
});
// ---------- Ladesäulen & Parkplätze (OpenStreetMap) rund um die Lieblingsorte, 1× täglich ----------
// Der Browser fragt OpenStreetMap sonst selbst ab – das ist abends oft überlastet. Hier vorab gesammelt.
// Ladesäulenregister der Bundesnetzagentur (amtlich, vollständiger als OpenStreetMap)
const EVT = {}; // Ladesäulen ganz Deutschland, Kachel "lat2_lon2" (0,5°)
async function bnetza(RC) {
  const page = await get("https://www.bundesnetzagentur.de/ladeinfrastruktur", { type: "text" });
  let m = page.match(/href="([^"]*Ladesaeulenregister[^"]*\.csv[^"]*)"/i); if (!m) throw new Error("CSV-Link nicht gefunden");
  let url = decode(m[1]); if (!/^https?:/.test(url)) url = new URL(url, "https://www.bundesnetzagentur.de/").href;
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(240000) }); if (!r.ok) throw new Error("CSV HTTP " + r.status);
  const buf = new Uint8Array(await r.arrayBuffer()); let txt = new TextDecoder("utf-8").decode(buf);
  if ((txt.match(/�/g) || []).length > 20) txt = new TextDecoder("windows-1252").decode(buf);
  const lines = txt.split(/\r?\n/); const hi = lines.findIndex(l => /Breitengrad/i.test(l)); if (hi < 0) throw new Error("Kopfzeile fehlt");
  const sep = (lines[hi].match(/;/g) || []).length >= (lines[hi].match(/,/g) || []).length ? ";" : ",";
  const split = l => { const o = []; let cur = "", q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (ch === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === sep && !q) { o.push(cur); cur = ""; } else cur += ch; } o.push(cur); return o.map(x => x.trim()); };
  const H = split(lines[hi]); const col = re => H.findIndex(h => re.test(h));
  const iLat = col(/^Breitengrad/i), iLon = col(/^L(ä|ae)ngengrad/i), iOp = col(/^Betreiber/i), iName = col(/Anzeigename/i), iStr = col(/^Stra(ß|ss)e/i), iNr = col(/^Hausnummer/i), iOrt = col(/^Ort$/i),
    iKw = col(/Nennleistung Ladeeinrichtung/i), iN = col(/Anzahl Ladepunkte/i), iStat = col(/^Status/i), iOh = col(/^(Ö|Oe)ffnungszeiten$/i), iLoc = col(/Standortbezeichnung/i);
  const iPlug = H.map((h, i) => /^Steckertypen/i.test(h) ? i : -1).filter(i => i >= 0);
  const num = v => parseFloat(String(v || "").replace(",", "."));
  const numLL = v => parseFloat(String(v || "").replace(",", "."));
  const P = Object.values(PLACES); const out = [];
  for (let k = hi + 1; k < lines.length; k++) { const l = lines[k]; if (!l) continue; const c = split(l);
    const lat = numLL(c[iLat]), lon = numLL(c[iLon]); if (!isFinite(lat) || !isFinite(lon)) continue;
    if (iStat >= 0 && c[iStat] && !/betrieb/i.test(c[iStat])) continue;
    const plugs = [...new Set(iPlug.flatMap(i => String(c[i] || "").split(/[,;]/).map(x => x.trim()).filter(Boolean)))];
    { const key = Math.floor(lat * 2) + "_" + Math.floor(lon * 2); (EVT[key] = EVT[key] || []).push([Math.round(lat * 1e5) / 1e5, Math.round(lon * 1e5) / 1e5, iKw >= 0 ? num(c[iKw]) || 0 : 0, iN >= 0 ? parseInt(c[iN]) || 0 : 0, c[iOp] || "", [[c[iStr], c[iNr]].filter(Boolean).join(" "), c[iOrt]].filter(Boolean).join(", "), plugs.join("|"), (iName >= 0 && c[iName]) || (iLoc >= 0 && c[iLoc]) || "", iOh >= 0 ? c[iOh] || "" : ""]); }
    if (!P.some(p => distKm(p.lat, p.lon, lat, lon) <= RC)) continue;
    out.push({ lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5, op: c[iOp] || "", name: (iName >= 0 && c[iName]) || (iLoc >= 0 && c[iLoc]) || "", addr: [[c[iStr], c[iNr]].filter(Boolean).join(" "), c[iOrt]].filter(Boolean).join(", "),
      kw: iKw >= 0 ? num(c[iKw]) || null : null, n: iN >= 0 ? parseInt(c[iN]) || null : null, plugs, oh: iOh >= 0 ? c[iOh] || "" : "" }); }
  if (!out.length) throw new Error("keine Einträge erkannt (Spalten: " + H.slice(0, 12).join("|") + ")");
  return out;
}
async function evWrite() {
  const keys = Object.keys(EVT); if (!keys.length) return;
  await fs.mkdir(path.join(OUT, "ev"), { recursive: true });
  for (const k of keys) await fs.writeFile(path.join(OUT, "ev", k + ".json"), JSON.stringify(EVT[k]));
  await fs.writeFile(path.join(OUT, "ev", "index.json"), JSON.stringify({ generated: new Date().toISOString(), keys, n: keys.reduce((t, k) => t + EVT[k].length, 0) }));
}
// Kacheln vom zuletzt veröffentlichten Stand übernehmen (Register wird nur 1× täglich neu geladen)
async function evCopy() {
  try { const idx = await get(LIVE + "ev/index.json", { ms: 20000 }); if (!idx || !Array.isArray(idx.keys)) return "ev: kein Index";
    await fs.mkdir(path.join(OUT, "ev"), { recursive: true }); await fs.writeFile(path.join(OUT, "ev", "index.json"), JSON.stringify(idx));
    let ok = 0; const q = [...idx.keys];
    await Promise.all(Array.from({ length: 8 }, async () => { while (q.length) { const k = q.shift(); try { const d = await get(LIVE + "ev/" + k + ".json", { ms: 20000 }); await fs.writeFile(path.join(OUT, "ev", k + ".json"), JSON.stringify(d)); ok++; } catch {} } }));
    return "ev " + ok + "/" + idx.keys.length + " Kacheln";
  } catch (e) { return "ev: " + (e.message || e); } }
async function osmPoi() {
  try { const prev = await get(LIVE + "osm-poi.json", { ms: 20000 });
    if (prev && prev.data && prev.data.c && Date.now() - new Date(prev.generated) < 20 * 3600e3 && !prev.stale && Object.keys(PLACES).every(k => prev.data.places && prev.data.places[k])) { await fs.writeFile(path.join(OUT, "osm-poi.json"), JSON.stringify(prev)); let ev = await evCopy(); if (!/^ev \d+\/\d+/.test(ev) || /^ev 0\//.test(ev)) { try { await bnetza(15); await evWrite(); ev = "ev neu: " + Object.keys(EVT).length + " Kacheln"; } catch (e) { ev = "ev Fehler: " + (e.message || e); } } return "ok (vom " + prev.generated.slice(0, 16) + ", " + ev + ")"; } } catch {}
  const SERVERS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
  const op = async q => { let err; for (const u of SERVERS) { try { const r = await fetch(u, { method: "POST", headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q), signal: AbortSignal.timeout(150000) });
    if (!r.ok) throw new Error("HTTP " + r.status); const d = JSON.parse(await r.text()); if (!Array.isArray(d.elements)) throw new Error("Format"); return d.elements; } catch (e) { err = e; await sleep(2000); } } throw err; };
  const keepC = k => /^(name|operator|network|brand|addr:(street|housenumber|city)|capacity|fee|opening_hours|amenity)$/.test(k) || /^socket:/.test(k) || /(^|:)output$/.test(k);
  const keepP = k => /^(amenity|parking|park_ride|parking_space|name|capacity|capacity:disabled|fee|maxstay|opening_hours|access|addr:(street|housenumber))$/.test(k);
  const slim = (els, keep) => els.map(e => { const lat = e.lat ?? (e.center && e.center.lat), lon = e.lon ?? (e.center && e.center.lon); if (!isFinite(lat)) return null;
    const t = {}; for (const [k, v] of Object.entries(e.tags || {})) if (keep(k)) t[k] = v; return { lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5, tags: t }; }).filter(Boolean);
  const RC = 15, RP = 10; const out = { places: {}, c: [], p: [] }; const seenC = new Set(), seenP = new Set();
  for (const [k, p] of Object.entries(PLACES)) {
    const c = await op('[out:json][timeout:120];nwr["amenity"="charging_station"](around:' + RC * 1000 + ',' + p.lat + ',' + p.lon + ');out center tags;'); await sleep(1500);
    const pk = await op('[out:json][timeout:120];(nwr["amenity"="parking"](around:' + RP * 1000 + ',' + p.lat + ',' + p.lon + ');nwr["amenity"="parking_space"]["parking_space"="disabled"](around:' + RP * 1000 + ',' + p.lat + ',' + p.lon + '););out center tags;'); await sleep(1500);
    for (const e of slim(c, keepC)) { const id = e.lat + "," + e.lon; if (!seenC.has(id)) { seenC.add(id); out.c.push(e); } }
    for (const e of slim(pk, keepP)) { const id = e.lat + "," + e.lon; if (!seenP.has(id)) { seenP.add(id); out.p.push(e); } }
    out.places[k] = { lat: p.lat, lon: p.lon, rc: RC, rp: RP };
  }
  try { out.b = await bnetza(RC); } catch (e) { out.b = []; out.bErr = String(e.message || e); }
  await write("osm-poi.json", out);
  await evWrite();
  return "ok (" + out.c.length + " Ladestationen OSM, " + out.b.length + " Ladeeinrichtungen BNetzA" + (out.bErr ? " – BNetzA: " + out.bErr : "") + ", " + out.p.length + " Parkplätze)";
}
try { results["osm-poi.json"] = await osmPoi(); } catch (e) { results["osm-poi.json"] = "Fehler: " + (e.message || e);
  try { const prev = await get(LIVE + "osm-poi.json", { ms: 15000 }); prev.stale = true; await fs.writeFile(path.join(OUT, "osm-poi.json"), JSON.stringify(prev)); } catch {} }
console.log("::notice::OSM-Daten: " + results["osm-poi.json"]);
// ---------- Push-Benachrichtigung (ntfy) bei neuen Warnungen in den Lieblingsstädten ----------
async function pushAlarms() {
  const topic = process.env.NTFY_TOPIC; if (!topic) return "kein Thema";
  let prev = null; try { prev = (await get(LIVE + "push-state.json", { ms: 15000 })).data; } catch {}
  const sent = new Set((prev && prev.sent) || []); const now = [];const fresh = [];
  for (const [k, p] of Object.entries(PLACES)) {
    let nina = []; try { nina = JSON.parse(await fs.readFile(path.join(OUT, "nina-" + k + ".json"), "utf8")).data || []; } catch {}
    for (const a of nina) now.push({ id: "n:" + a.id, k, p, title: a.title || a.headline || "Warnung", text: a.text || "", sev: a.severity, src: "NINA" });
    try { const d = await get("https://api.brightsky.dev/alerts?lat=" + p.lat + "&lon=" + p.lon + "&tz=Europe/Berlin");
      for (const a of d.alerts || []) now.push({ id: "d:" + k + ":" + (a.alert_id || a.id) , k, p, title: a.headline_de || a.event_de, text: (a.description_de || "") + (a.expires ? " (bis " + new Date(a.expires).toLocaleString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + " Uhr)" : ""), sev: a.severity, src: "DWD" }); } catch {}
  }
  for (const w of now) if (!sent.has(w.id)) fresh.push(w);
  if (prev) for (const w of fresh.slice(0, 8)) {
    const sev = String(w.sev || "").toLowerCase();
    try { await fetch("https://ntfy.sh/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      topic, title: "⚠ " + w.p.name + ": " + w.title, message: (w.text || w.title).slice(0, 600) + "\n– " + w.src,
      priority: sev === "extreme" ? 5 : sev === "severe" ? 4 : 3, tags: ["warning"],
      click: "https://thhussmann.github.io/Lagebild-D-sseldorf-/?ort=" + (w.k === "dus" ? "duesseldorf" : w.k) + "#warnungen" }) }); } catch (e) { console.log("::notice::Push fehlgeschlagen: " + e.message); }
  }
  else await fetch("https://ntfy.sh/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, title: "Lagebild: Push eingerichtet", message: "Ab jetzt kommt hier eine Nachricht, sobald für Düsseldorf, Datteln, Alpen-Menzelen oder Salzhausen eine neue Warnung erscheint.", tags: ["white_check_mark"], click: "https://thhussmann.github.io/Lagebild-D-sseldorf-/" }) }).catch(() => {});
  await write("push-state.json", { sent: now.map(w => w.id) });
  console.log("::notice::Push: " + now.length + " aktive Warnungen, " + (prev ? fresh.length : 0) + " neu gemeldet");
  return "ok";
}
try { results["push"] = await pushAlarms(); } catch (e) { results["push"] = "Fehler: " + e.message; }
console.log("::notice::Push-Ergebnis: " + results["push"] + " (Thema " + (process.env.NTFY_TOPIC ? "gesetzt" : "fehlt") + ")");
await write("status.json", results);
console.log(JSON.stringify(results, null, 1));
