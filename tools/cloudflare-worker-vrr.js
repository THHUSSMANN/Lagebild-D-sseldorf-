// Cloudflare Worker „vrr-proxy“: reicht VRR-Abfahrten/-Verbindungen (EFA) und DB-Fernverkehr (IRIS) live an das Lagebild weiter.
// Einrichten: dash.cloudflare.com → Workers & Pages → vrr-proxy → Code bearbeiten → diesen Code einfügen → Bereitstellen.
// Sicher: leitet nur diese Fahrplan-Abfragen weiter, sonst nichts.
const A = ["/standard/XML_DM_REQUEST", "/standard/XML_STOPFINDER_REQUEST", "/standard/XML_TRIP_REQUEST2"];
export default {
  async fetch(req) {
    const c = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET", "Cache-Control": "max-age=20" };
    if (req.method === "OPTIONS") return new Response(null, { headers: c });
    const u = new URL(req.url);
    if (/^\/iris\/(station|plan|fchg)\/[^?]*$/.test(u.pathname)) {
      const r = await fetch("https://iris.noncd.db.de/iris-tts/timetable/" + u.pathname.slice(6), { cf: { cacheTtl: 20 } });
      return new Response(r.body, { status: r.status, headers: { ...c, "Content-Type": "text/xml; charset=utf-8" } });
    }
    if (!A.includes(u.pathname)) return new Response("nicht erlaubt", { status: 403, headers: c });
    const r = await fetch("https://efa.vrr.de" + u.pathname + u.search, { headers: { Accept: "application/json" }, cf: { cacheTtl: 20 } });
    return new Response(r.body, { status: r.status, headers: { ...c, "Content-Type": "application/json; charset=utf-8" } });
  }
};
