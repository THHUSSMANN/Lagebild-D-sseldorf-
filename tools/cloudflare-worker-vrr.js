// Cloudflare Worker: reicht VRR-Abfahrten (EFA) live an das Lagebild weiter.
// Einrichten: dash.cloudflare.com → Workers & Pages → Create → Worker → diesen Code einfügen → Deploy.
// Die Adresse (z. B. https://vrr-proxy.DEIN-NAME.workers.dev) im Lagebild unter Einstellungen → „Abfahrten-Vermittler“ eintragen.
// Sicher: leitet nur Abfahrts- und Haltestellen-Abfragen an efa.vrr.de weiter, sonst nichts.
const ALLOWED = ["/standard/XML_DM_REQUEST", "/standard/XML_STOPFINDER_REQUEST"];
export default {
  async fetch(req) {
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET", "Cache-Control": "max-age=20" };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const u = new URL(req.url);
    if (!ALLOWED.includes(u.pathname)) return new Response("nicht erlaubt", { status: 403, headers: cors });
    const r = await fetch("https://efa.vrr.de" + u.pathname + u.search, { headers: { Accept: "application/json" }, cf: { cacheTtl: 20 } });
    return new Response(r.body, { status: r.status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
  }
};
