// Cloudflare Worker „vrr-proxy“: reicht VRR-Abfahrten/-Verbindungen (EFA) und DB-Fernverkehr (IRIS) live an das Lagebild weiter.
// Einrichten: dash.cloudflare.com → Workers & Pages → vrr-proxy → Code bearbeiten → diesen Code einfügen → Bereitstellen.
// Sicher: leitet nur diese Fahrplan-Abfragen weiter, sonst nichts.
// Robust (Stand 11/2026): Der VRR lehnt Anfragen zeitweise kurz ab (HTTP 403/429/5xx). Dann
//  1. bis zu zweimal kurz neu versuchen,
//  2. sonst die letzte gute Antwort derselben Abfrage ausliefern (höchstens 3 min alt, Kopfzeile „X-Lagebild-Stand: zwischengespeichert“).
// Haltestellensuche ändert sich praktisch nie → 1 Tag zwischenspeichern, spart Anfragen beim VRR.
const A = ["/standard/XML_DM_REQUEST", "/standard/XML_STOPFINDER_REQUEST", "/standard/XML_TRIP_REQUEST2"];
const RETRY = [403, 429, 500, 502, 503, 504];
const LAST = new Map(); // letzte gute Antworten (je Worker-Instanz, nur Fahrplandaten)
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function holen(url, init, ttl) {
  let r;
  for (let i = 0; i < 3; i++) {
    r = await fetch(url, { ...init, cf: { cacheTtlByStatus: { "200-299": ttl, "300-599": 0 } } });
    if (r.ok || !RETRY.includes(r.status)) return r;
    if (i < 2) await sleep(350 + i * 450);
  }
  return r;
}

async function antwort(key, url, init, ttl, maxAlt, typ, c) {
  const r = await holen(url, init, ttl);
  if (r.ok) {
    const body = await r.text();
    LAST.set(key, { at: Date.now(), body });
    if (LAST.size > 300) LAST.delete(LAST.keys().next().value);
    return new Response(body, { status: 200, headers: { ...c, "Content-Type": typ, "Cache-Control": "max-age=" + Math.min(ttl, 20) } });
  }
  const alt = LAST.get(key);
  if (alt && Date.now() - alt.at < maxAlt * 1000)
    return new Response(alt.body, { status: 200, headers: { ...c, "Content-Type": typ, "Cache-Control": "no-store", "X-Lagebild-Stand": "zwischengespeichert", "Access-Control-Expose-Headers": "X-Lagebild-Stand" } });
  return new Response(await r.text(), { status: r.status, headers: { ...c, "Content-Type": typ, "Cache-Control": "no-store" } });
}

export default {
  async fetch(req) {
    const c = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET" };
    if (req.method === "OPTIONS") return new Response(null, { headers: c });
    if (req.method !== "GET") return new Response("nicht erlaubt", { status: 405, headers: c });
    const u = new URL(req.url);
    if (/^\/iris\/(station|plan|fchg)\/[^?]*$/.test(u.pathname)) {
      const station = u.pathname.startsWith("/iris/station/");
      return antwort(u.pathname, "https://iris.noncd.db.de/iris-tts/timetable/" + u.pathname.slice(6), {}, station ? 86400 : 20, 180, "text/xml; charset=utf-8", c);
    }
    if (!A.includes(u.pathname)) return new Response("nicht erlaubt", { status: 403, headers: c });
    const stop = u.pathname === "/standard/XML_STOPFINDER_REQUEST";
    return antwort(u.pathname + u.search, "https://efa.vrr.de" + u.pathname + u.search, { headers: { Accept: "application/json" } }, stop ? 86400 : 20, stop ? 86400 : 180, "application/json; charset=utf-8", c);
  }
};
