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
  ["re-dus", "Recklinghausen Hbf", "Düsseldorf Hbf"]
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
  for (const [key, from, to] of TRIPS) {
    try {
      const a = await stopId(from), b = await stopId(to);
      // Nur Züge (Fern-, Regionalverkehr, S-Bahn): Busse, U-/Straßenbahn usw. ausgeschlossen.
      // Vier Abfragen (jetzt bis in 3 Stunden), damit alle Züge der nächsten Stunden enthalten sind.
      const excl = "&excludedMeans=checkbox" + [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 19].map(n => "&exclMOT_" + n + "=1").join("");
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
      try { fern = await irisFern(from, to); } catch (e) { console.log("::warning::IRIS " + key + ": " + (e.message || e)); }
      try { const fc = await fernCombos(from, to); fern.push(...fc); } catch (e) { console.log("::warning::Fern+Umstieg " + key + ": " + (e.message || e)); }
      const dur = j => (new Date(j.arrEst || j.arr) - new Date(j.depEst || j.dep)) / 6e4;
      const best = Math.min(...journeys.filter(j => j.arr && j.dep).map(dur), 999);
      journeys.push(...fern.filter(j => j.arr && j.dep && dur(j) > 0 && dur(j) <= Math.max(best + 30, 120)));
      const list = journeys.filter(j => j.dep && !seen.has(j.dep + "|" + j.legs.map(l => l.line).join(">")) && seen.add(j.dep + "|" + j.legs.map(l => l.line).join(">")))
        .filter(j => j.trainsOnly).sort((x, y) => new Date(x.dep) - new Date(y.dep));
      out.push({ key, from, to, journeys: list });
      console.log("::notice::Verbindung " + key + ": " + list.length + " Zugverbindungen (" + list.filter(j => j.legs.some(l => /^(ICE|IC|EC|ECE)/i.test(l.line))).length + " mit Fernverkehr) – " + list.map(j => j.dep.slice(11, 16) + " " + j.legs.filter(l => !l.walk).map(l => l.line).join(">")).join(" | "));
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
  if (p.efa) tasks.push((async () => {
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
  })());
}
tasks.push(job("nina-all.json", ninaAll));
tasks.push(job("einsaetze-kreis-re.json", kreisRe));
tasks.push(job("trips.json", trips));
tasks.push(job("pollen.json", () => get("https://opendata.dwd.de/climate_environment/health/alerts/s31fg.json")));
// Radio: Stream-Adressen prüfen (bekannte Adressen zuerst, sonst radio-browser.info)
tasks.push(job("radio.json", async () => {
  const ST = [
    ["wdr2", "WDR 2 Rhein und Ruhr", ["https://wdr-wdr2-rheinruhr.icecastssl.wdr.de/wdr/wdr2/rheinruhr/mp3/128/stream.mp3", "https://wdr-wdr2-rheinruhr.icecast.wdr.de/wdr/wdr2/rheinruhr/mp3/128/stream.mp3"], "WDR 2 Rhein und Ruhr"],
    ["wdr4", "WDR 4", ["https://wdr-wdr4-live.icecastssl.wdr.de/wdr/wdr4/live/mp3/128/stream.mp3", "https://wdr-wdr4-live.icecast.wdr.de/wdr/wdr4/live/mp3/128/stream.mp3"], "WDR 4"],
    ["antenne", "Antenne Düsseldorf", ["https://antenneduesseldorf-live.cast.addradio.de/antenneduesseldorf/live/mp3/high", "https://edge.audio.3qsdn.com/antenneduesseldorf", "https://stream.antenneduesseldorf.de/live/mp3-192"], "Antenne Duesseldorf", "https://www.antenneduesseldorf.de/"]
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
    datteln: [["WDR", WDR], ["Ruhr Nachrichten", ["https://www.ruhrnachrichten.de/feed/", "https://www.ruhrnachrichten.de/rss"]], ["Recklinghäuser Zeitung", ["https://www.recklinghaeuser-zeitung.de/feed/"]], ["Bild Ruhrgebiet", ["https://www.bild.de/feed/regional-ruhrgebiet.xml", "https://www.bild.de/feed/regional/ruhrgebiet.xml", "https://www.bild.de/rssfeeds/vw-ruhrgebiet/vw-ruhrgebiet-16786752,dzbildplus=true,sort=1,teaserbildmobil=false,view=rss2.bild.xml"]]],
    alpen: [["Rheinische Post Kreis Wesel", "https://rp-online.de/nrw/staedte/wesel/feed.rss"], ["RP Xanten", "https://rp-online.de/nrw/staedte/xanten/feed.rss"], ["RP Rheinberg", "https://rp-online.de/nrw/staedte/rheinberg/feed.rss"], ["RP Alpen", "https://rp-online.de/nrw/staedte/alpen/feed.rss"],
      ["NRZ Wesel", ["https://www.nrz.de/lokales/wesel-hamminkeln-schermbeck/feed.rss", "https://www.nrz.de/lokales/wesel-hamminkeln-schermbeck/rss", "https://www.nrz.de/staedte/wesel-hamminkeln-schermbeck/feed.rss", "https://www.nrz.de/rss"]],
      ["Niederrhein Nachrichten", ["https://www.niederrhein-nachrichten.de/feed/", "https://niederrhein-nachrichten.de/feed/", "https://www.nn-online.de/feed/"]],
      ["Radio KW", ["https://www.radiokw.de/nachrichten/lokalnachrichten/index.rss", "https://www.radiokw.de/rss/lokalnachrichten.xml", "https://www.radiokw.de/feed/", "https://www.radiokw.de/rss"]], ["WDR", WDR]],
    salzhausen: [["NDR", ["https://www.ndr.de/home/index-rss.xml", "https://www.ndr.de/nachrichten/index-rss.xml", "https://www.ndr.de/nachrichten/niedersachsen/index-rss.xml"]], ["Landeszeitung Lüneburg", ["https://www.landeszeitung.de/feed/", "https://www.landeszeitung.de/rss"]]]
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
    out[k] = items.filter(x => x.title && !seen.has(x.title) && seen.add(x.title)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  }
  console.log("::notice::Medien: " + [...new Set(stat)].join(" | "));
  out._stat = [...new Set(stat)];
  return out;
});
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
