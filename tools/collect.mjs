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
    feeds: [["Blaulicht Alpen", "https://www.presseportal.de/rss/polizei/r/Alpen.rss2"]],
    efa: "Alpen Bahnhof" },
  salzhausen: { name: "Salzhausen", lat: 53.2236, lon: 10.1653, ars: "033530000000", uR: 30,
    feeds: [["Blaulicht Salzhausen", "https://www.presseportal.de/rss/polizei/r/Salzhausen.rss2"]] }
};

const results = {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url, { type = "json", ms = 25000 } = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: UA, signal: ctl.signal });
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
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const it = m[1]; const tag = n => (it.match(new RegExp("<" + n + "[^>]*>([\\s\\S]*?)</" + n + ">")) || [])[1] || "";
    const enc = tag("content:encoded"); const src = (decode(enc).match(/<b>([^<]+)<\/b>/) || [])[1] || label;
    return { title: strip(tag("title")), text: strip(tag("description")).slice(0, 400), link: strip(tag("link")), date: new Date(strip(tag("pubDate"))).toISOString(), source: src };
  });
}
async function blaulicht(key, p) {
  const all = [];
  for (const [label, url] of p.feeds) { all.push(...parseRss(await get(url, { type: "text" }), label)); await sleep(300); }
  const seen = new Set();
  return all.filter(x => !seen.has(x.link) && seen.add(x.link)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);
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
      // Zwei Abfragen (jetzt und in 2 Stunden), damit alle Züge der nächsten Stunden enthalten sind.
      const excl = "&excludedMeans=checkbox" + [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 17, 19].map(n => "&exclMOT_" + n + "=1").join("");
      const at = d => { const p = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d).reduce((o, x) => (o[x.type] = x.value, o), {});
        return "&itdDate=" + p.year + p.month + p.day + "&itdTime=" + p.hour + p.minute; };
      const base = "https://efa.vrr.de/standard/XML_TRIP_REQUEST2?outputFormat=rapidJSON&language=de&type_origin=any&name_origin=" + encodeURIComponent(a.id) + "&type_destination=any&name_destination=" + encodeURIComponent(b.id) + "&itdTripDateTimeDepArr=dep&calcNumberOfTrips=10&useRealtime=1" + excl;
      const raw = [];
      for (const t of [new Date(), new Date(Date.now() + 2 * 3600e3)]) { try { const d = await get(base + at(t), { ms: 30000 }); raw.push(...(d.journeys || [])); } catch (e) { if (!raw.length) throw e; } }
      const seen = new Set();
      const journeys = raw.map(j => {
        const legs = (j.legs || []).map(l => { const t = l.transportation || {}, pc = t.product && t.product.class;
          return { line: t.disassembledName || t.number || t.name || "", name: t.name || "", walk: pc === 99 || pc === 100 || /fu(ß|ss)weg/i.test(t.name || ""), dir: t.destination && t.destination.name || "",
            from: stopName(l.origin), to: stopName(l.destination),
            dep: l.origin && l.origin.departureTimePlanned, depEst: l.origin && l.origin.departureTimeEstimated, arr: l.destination && l.destination.arrivalTimePlanned, arrEst: l.destination && l.destination.arrivalTimeEstimated,
            plat: l.origin && l.origin.properties && (l.origin.properties.platformName || l.origin.properties.platform) || "", cancelled: (l.realtimeStatus || []).includes("TRIP_CANCELLED") }; });
        const ride = legs.filter(x => !x.walk);
        const rideLegs = ride;
        return { trainsOnly: rideLegs.every(l => /^(ICE|IC|EC|ECE|RE|RB|S|RRX|NX|FLX|NJ|TGV|THA)\s?\d*/i.test(l.line) || /zug|bahn/i.test(l.name)), dep: (ride[0] || legs[0] || {}).dep, depEst: (ride[0] || legs[0] || {}).depEst, arr: (ride[ride.length - 1] || legs[legs.length - 1] || {}).arr, arrEst: (ride[ride.length - 1] || legs[legs.length - 1] || {}).arrEst, changes: Math.max(0, ride.length - 1), legs };
      });
      const list = journeys.filter(j => j.dep && !seen.has(j.dep + "|" + j.legs.map(l => l.line).join(">")) && seen.add(j.dep + "|" + j.legs.map(l => l.line).join(">")))
        .filter(j => j.trainsOnly).sort((x, y) => new Date(x.dep) - new Date(y.dep));
      out.push({ key, from, to, journeys: list });
      console.log("::notice::Verbindung " + key + ": " + list.length + " Zugverbindungen – " + list.map(j => j.dep.slice(11, 16) + " " + j.legs.filter(l => !l.walk).map(l => l.line).join(">")).join(" | "));
    } catch (e) { out.push({ key, from, to, error: String(e.message || e), journeys: [] }); console.log("::warning::Verbindung " + key + ": " + (e.message || e)); }
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
  if (p.efa) tasks.push(job("efa-" + k + ".json", async () => { const r = await efa(p.efa); console.log("::notice::Abfahrten " + k + ": " + r.stop + " – " + r.rows.length + " Fahrten, z. B. " + r.rows.slice(0, 3).map(x => x.line + " " + x.dir).join(" | ")); return r; }));
  tasks.push(job("db-" + k + ".json", async () => {
    try { return await dbDeps(p); }
    catch (e) {
      if (k !== "dus") throw e;
      const r = await efa("Düsseldorf Hbf"); // Ersatz: VRR-Auskunft, nur Züge
      return { stop: "Düsseldorf Hbf", dist: null, source: "VRR", rows: r.rows.filter(x => /^(ICE|IC|EC|ECE|RE|RB|S|NJ|FLX|RRX)\s?\d/i.test(x.line)).map(x => ({ planned: x.planned, delay: x.est ? Math.round((new Date(x.est) - new Date(x.planned)) / 6e4) : null, line: x.line, dir: x.dir, plat: x.plat, cancelled: x.cancelled })) };
    }
  }));
}
tasks.push(job("nina-all.json", ninaAll));
tasks.push(job("einsaetze-kreis-re.json", kreisRe));
tasks.push(job("trips.json", trips));
tasks.push(job("pollen.json", () => get("https://opendata.dwd.de/climate_environment/health/alerts/s31fg.json")));
tasks.push(job("strom.json", async () => {
  const day = d => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
  const price = await get("https://api.energy-charts.info/price?bzn=DE-LU&start=" + day(new Date()) + "&end=" + day(new Date(Date.now() + 864e5)));
  let signal = null; try { signal = await get("https://api.energy-charts.info/signal?country=de"); } catch {}
  return { price, signal };
}));
for (const [k, url] of Object.entries(ODD)) tasks.push(job("odd-" + k + ".json", async () => places(await get(url, { ms: 40000 }))));
await Promise.all(tasks);
await write("status.json", results);
console.log(JSON.stringify(results, null, 1));
