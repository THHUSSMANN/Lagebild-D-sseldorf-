const B="https://vrr-proxy.thomas-hussmann.workers.dev";
const J=async u=>{const r=await fetch(B+u);if(!r.ok)throw new Error("HTTP "+r.status);return r.json();};
const T=async u=>{const r=await fetch(B+u);if(!r.ok)throw new Error("HTTP "+r.status);return r.text();};
const enc=encodeURIComponent;
const stops=["Düsseldorf Nikolaus-Knopp-Platz","Düsseldorf Heinrich-Heine-Allee","Düsseldorf Oststraße","Düsseldorf Barbarossaplatz","Düsseldorf Steinstr./Königsallee","Datteln Lohstr.","Datteln Busbahnhof","Alpen Bahnhof","Dortmund Stadion","Dortmund Hbf","Düsseldorf Hbf","Recklinghausen Hbf"];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const IDS={};
async function sid(n){if(n.startsWith("de:"))return n;if(IDS[n])return IDS[n];const d=await J("/standard/XML_STOPFINDER_REQUEST?outputFormat=rapidJSON&language=de&type_sf=any&name_sf="+enc(n));const l=(d.locations||[]).filter(x=>x.type==="stop").sort((a,b)=>(b.matchQuality||0)-(a.matchQuality||0))[0];if(!l)throw new Error("Haltestelle nicht gefunden");return IDS[n]=l.id;}
async function dm(n){const d=await J("/standard/XML_DM_REQUEST?outputFormat=rapidJSON&language=de&type_dm=any&name_dm="+enc(await sid(n))+"&mode=direct&useRealtime=1&limit=40");const ev=d.stopEvents||[];const rt=ev.filter(e=>e.departureTimeEstimated).length;const loc=(d.locations&&d.locations[0]&&d.locations[0].name)||"?";return `${ev.length} Abfahrten, ${rt} mit Echtzeit (${loc})`;}
async function trip(a,z){const d=await J("/standard/XML_TRIP_REQUEST2?outputFormat=rapidJSON&language=de&type_origin=any&name_origin="+enc(await sid(a))+"&type_destination=any&name_destination="+enc(await sid(z))+"&calcNumberOfTrips=4&useRealtime=1");const js=d.journeys||[];const rt=js.filter(j=>(j.legs||[]).some(l=>l.origin&&l.origin.departureTimeEstimated)).length;return `${js.length} Verbindungen, ${rt} mit Echtzeit`;}
async function iris(name){const s=await T("/iris/station/"+enc(name));const eva=(s.match(/eva="(\d+)"/)||[])[1];if(!eva)return "Bahnhof nicht gefunden";const p=new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin",year:"2-digit",month:"2-digit",day:"2-digit",hour:"2-digit",hour12:false}).formatToParts(new Date()).reduce((o,x)=>(o[x.type]=x.value,o),{});
 const pl=await T(`/iris/plan/${eva}/${p.year}${p.month}${p.day}/${p.hour}`);const f=await T("/iris/fchg/"+eva);return `EVA ${eva}: ${(pl.match(/<s /g)||[]).length} Züge im Fahrplan dieser Stunde, ${(f.match(/<s /g)||[]).length} Echtzeit-Meldungen`;}
const tasks=[...stops.map(s=>["ÖPNV-Abfahrten "+s,()=>dm(s)]),
 ["Bus Datteln Lohstr. → Busbahnhof",()=>trip("Datteln Lohstr.","Datteln Busbahnhof")],
 ["Bus Datteln Busbahnhof → Lohstr.",()=>trip("Datteln Busbahnhof","Datteln Lohstr.")],
 ["Dortmund Stadion → Hbf",()=>trip("Dortmund Stadion","Dortmund Hbf")],
 ["Taki: Messe Ost → Knopp-Platz (U78/79/80 + U75)",()=>trip("de:05111:18281","de:05111:18131")],
 ["Knopp-Platz → Arena (U75+U78)",()=>trip("de:05111:18131","de:05111:18075")],
 ["U78 Heine-Allee → Arena",()=>trip("Düsseldorf Heinrich-Heine-Allee","de:05111:18075")],
 ["U78 Arena → Heine-Allee",()=>trip("de:05111:18075","Düsseldorf Heinrich-Heine-Allee")],
 ...["Düsseldorf Hbf","Recklinghausen Hbf","Dortmund Hbf"].map(s=>["DB-Fernverkehr "+s,()=>iris(s)])];
for(const [n,f] of tasks){await sleep(700);try{console.log("✅ "+n+": "+await f());}catch(e){await sleep(3000);try{console.log("✅ "+n+" (2. Versuch): "+await f());}catch(e2){console.log("❌ "+n+": "+e2.message);}}}
