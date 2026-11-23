/* Lagebild Düsseldorf – © Thomas Hußmann
   Ruft ausschließlich offene Schnittstellen direkt aus dem Browser ab.
   Düsseldorf (Mitte + 10 Stadtbezirke) plus frei wählbare Orte in ganz Deutschland. */
(function(){
"use strict";

// ================= Orte =================
const BEZIRKE=[
  {id:1,name:"Mitte",detail:"Altstadt, Carlstadt, Stadtmitte, Pempelfort",lat:51.2254,lon:6.7763},
  {id:2,name:"Flingern / Düsseltal",detail:"Flingern Nord/Süd, Düsseltal",lat:51.2310,lon:6.8040},
  {id:3,name:"Bilk / Friedrichstadt",detail:"Unterbilk, Hafen, Hamm, Volmerswerth, Flehe",lat:51.2030,lon:6.7750},
  {id:4,name:"Oberkassel / Heerdt",detail:"Niederkassel, Lörick, Heerdt",lat:51.2320,lon:6.7400},
  {id:5,name:"Kaiserswerth / Angermund",detail:"Stockum, Lohausen, Kalkum, Wittlaer",lat:51.3010,lon:6.7400},
  {id:6,name:"Rath / Mörsenbroich",detail:"Lichtenbroich, Unterrath",lat:51.2700,lon:6.8150},
  {id:7,name:"Gerresheim",detail:"Grafenberg, Ludenberg, Hubbelrath, Knittkuhl",lat:51.2370,lon:6.8650},
  {id:8,name:"Eller / Lierenfeld",detail:"Oberbilk, Vennhausen, Unterbach",lat:51.2010,lon:6.8450},
  {id:9,name:"Benrath / Wersten",detail:"Holthausen, Reisholz, Himmelgeist, Itter, Urdenbach",lat:51.1640,lon:6.8700},
  {id:10,name:"Garath / Hellerhof",detail:"Garath, Hellerhof",lat:51.1370,lon:6.9000}
];
// Einzelne Stadtteile zusätzlich zu den Bezirken
const STADTTEILE=[
];
const DUS={lat:51.2254,lon:6.7763,ars:"051110000000",ab:["A3","A44","A46","A52","A57","A59","A524","A535"],efa:"Düsseldorf Nikolaus-Knopp-Platz"};
// Favoriten (Regionalschlüssel = Kreisebene für die NINA-Warn-App)
const FAVS=[
  {key:"datteln",name:"Datteln",detail:"Kreis Recklinghausen",lat:51.6539,lon:7.3417,state:"NW",ars:"055620000000",ab:["A2","A43","A45","A52"],efa:"Datteln Busbahnhof",pollen:/Tiefland/},
  {key:"dortmund",name:"Dortmund",detail:"Kreisfreie Stadt",lat:51.5136,lon:7.4653,state:"NW",ars:"059130000000",ab:["A1","A2","A40","A44","A45"],efa:"Dortmund Hbf",pollen:/Tiefland/},
  {key:"alpen",name:"Alpen-Menzelen",detail:"Kreis Wesel",lat:51.6449,lon:6.5634,state:"NW",ars:"051700000000",ab:["A57","A42","A3","A40"],efa:"Alpen Bahnhof",pollen:/Tiefland/},
  {key:"salzhausen",name:"Salzhausen",detail:"Landkreis Harburg",lat:53.2236,lon:10.1653,state:"NI",ars:"033530000000",ab:["A7","A39","A1","A250"],efa:null,pollen:/Östl/}
];
const STATES={"Baden-Württemberg":"BW","Bayern":"BY","Berlin":"BE","Brandenburg":"BB","Bremen":"HB","Hamburg":"HH","Hessen":"HE","Mecklenburg-Vorpommern":"MV","Niedersachsen":"NI","Nordrhein-Westfalen":"NW","Rheinland-Pfalz":"RP","Saarland":"SL","Sachsen":"SN","Sachsen-Anhalt":"ST","Schleswig-Holstein":"SH","Thüringen":"TH"};
const STATE_NAME=Object.fromEntries(Object.entries(STATES).map(([a,b])=>[b,a]));
const NEWS_REGION={BW:1,BY:2,BE:3,BB:4,HB:5,HH:6,HE:7,MV:8,NI:9,NW:10,RP:11,SL:12,SN:13,ST:14,SH:15,TH:16};
const POLLEN_REGION={SH:/Schleswig/,HH:/Schleswig/,MV:/Mecklenburg/,NI:/Niedersachsen/,HB:/Niedersachsen/,NW:/Nordrhein/,BB:/Brandenburg/,BE:/Brandenburg/,ST:/Sachsen-Anhalt/,TH:/Thüringen/,SN:/^Sachsen$/,HE:/Hessen/,RP:/Rheinland/,SL:/Rheinland/,BW:/Baden/,BY:/Bayern/};
const RADIUS_KM=20,JAM_RADIUS_KM=30;

const SRC={
  nina:{name:"NINA-Warn-App",prov:"BBK – Bevölkerungsschutz",url:"https://nina.api.bund.dev/",ep:"warnung.bund.de/api31 (über Datensammler)"},
  dwd:{name:"Unwetterwarnungen",prov:"Bright Sky (DWD Open Data)",url:"https://brightsky.dev/docs/",ep:"api.brightsky.dev/alerts"},
  wx:{name:"Wetter & Vorhersage",prov:"Open-Meteo (u. a. DWD ICON)",url:"https://open-meteo.com/en/docs",ep:"api.open-meteo.com/v1/forecast"},
  dwdobs:{name:"Messwerte DWD-Station",prov:"Bright Sky (DWD Open Data)",url:"https://brightsky.dev/docs/",ep:"api.brightsky.dev/current_weather"},
  aq:{name:"Luftqualität (Modell)",prov:"Open-Meteo / Copernicus CAMS",url:"https://open-meteo.com/en/docs/air-quality-api",ep:"air-quality-api.open-meteo.com"},
  uba:{name:"Luftmessstationen",prov:"Umweltbundesamt",url:"https://luftdaten.umweltbundesamt.de/api/air-data/v3/doc",ep:"luftdaten.umweltbundesamt.de (über Datensammler)"},
  pollen:{name:"Pollenflug",prov:"Deutscher Wetterdienst",url:"https://opendata.dwd.de/climate_environment/health/alerts/",ep:"opendata.dwd.de (über Datensammler)"},
  landespegel:{name:"Landespegel Düssel, Anger, Itter",prov:"LANUK NRW Hochwasserportal",url:"https://hochwasserportal.nrw.de/",ep:"hochwasserportal.nrw.de (über Datensammler)"},
  tomtom:{name:"Verkehrslage alle Straßen",prov:"TomTom Traffic (eigener kostenloser Schlüssel)",url:"https://developer.tomtom.com/",ep:"api.tomtom.com"},
  pegel:{name:"Wasserstand",prov:"WSV – PEGELONLINE",url:"https://pegelonline.wsv.de/webservice/dokuRestapi",ep:"pegelonline.wsv.de/webservices/rest-api/v2"},
  ab:{name:"Autobahn: Staus, Sperrungen, Baustellen, Webcams, E-Laden",prov:"Autobahn GmbH des Bundes",url:"https://autobahn.api.bund.dev/",ep:"verkehr.autobahn.de/o/autobahn"},
  fuel:{name:"Spritpreise",prov:"Tankerkönig (MTS-K)",url:"https://creativecommons.tankerkoenig.de/",ep:"creativecommons.tankerkoenig.de/json/list.php"},
  efa:{name:"Rheinbahn & Bus vor Ort",prov:"Rheinbahn / Fahrplanauskunft",url:"https://www.rheinbahn.de/",ep:"Fahrplanauskunft (über Datensammler)"},
  bike:{name:"Leihräder",prov:"nextbike",url:"https://www.nextbike.de/",ep:"maps.nextbike.net/maps/nextbike-live.json"},
  vt:{name:"Stadtverkehr & Parkhäuser live",prov:"Verkehrszentrale Düsseldorf",url:"https://vtmanager.duesseldorf.de/info/",ep:"vtmanager.duesseldorf.de/geoserverwfs"},
  trips:{name:"Deutsche Bahn Düsseldorf ⇄ Recklinghausen",prov:"Deutsche Bahn (IRIS) & Fahrplanauskunft",url:"https://www.bahn.de/",ep:"über Datensammler"},
  einsaetze:{name:"Feuerwehreinsätze Kreis Recklinghausen",prov:"Kreisleitstelle Recklinghausen",url:"https://www.kreis-re.de/inhalte/buergerservice/leben_und_wohnen/feuerwehr-_und_rettungsleitstelle/_einsaetze_der_feuerwehren/index.asp",ep:"kreis-re.de (über Datensammler)"},
  blaulicht:{name:"Polizei & Feuerwehr",prov:"Presseportal Blaulicht",url:"https://www.presseportal.de/blaulicht/",ep:"presseportal.de/rss (über Datensammler)"},
  park:{name:"P+R, Behindertenparkplätze, AED, WC, Radstationen",prov:"Open Data Düsseldorf",url:"https://opendata.duesseldorf.de/",ep:"opendata.duesseldorf.de (über Datensammler)"},
  windy:{name:"Öffentliche Webcams",prov:"Windy Webcams API",url:"https://api.windy.com/webcams",ep:"api.windy.com/webcams/api/v3"},
  sammler:{name:"Datensammler (alle 10 Minuten)",prov:"GitHub Actions",url:"https://github.com/THHUSSMANN/Lagebild-D-sseldorf-/actions",ep:"data/*.json"},
  hol:{name:"Feiertage",prov:"Nager.Date",url:"https://date.nager.at/Api",ep:"date.nager.at/api/v3"},
  school:{name:"Schulferien",prov:"OpenHolidays API",url:"https://www.openholidaysapi.org/",ep:"openholidaysapi.org/SchoolHolidays"},
  boerse:{name:"Börse: Indizes, Devisen, Rohstoffe",prov:"Yahoo Finance (verzögert)",url:"https://finance.yahoo.com/",ep:"query1.finance.yahoo.com (über Datensammler)"},
  news:{name:"Regionale Nachrichten",prov:"tagesschau",url:"https://tagesschau.api.bund.dev/",ep:"tagesschau.de/api2u/news"},
  geo:{name:"Ortssuche",prov:"Open-Meteo Geocoding",url:"https://open-meteo.com/en/docs/geocoding-api",ep:"geocoding-api.open-meteo.com/v1/search"},
  radar:{name:"Regenradar",prov:"Deutscher Wetterdienst (GeoServer)",url:"https://maps.dwd.de/",ep:"maps.dwd.de/geoserver/dwd/wms · Niederschlagsradar"},
  pegelwv:{name:"Rhein-Vorhersage",prov:"WSV PEGELONLINE / BfG",url:"https://www.pegelonline.wsv.de/webservice/dokuRestapi",ep:"pegelonline.wsv.de …/WV/measurements.json"},
  ships:{name:"Schiffe (AIS-Karte)",prov:"VesselFinder (eingebettete Karte)",url:"https://www.vesselfinder.com/embed",ep:"vesselfinder.com/aismap.js"},
  flights:{name:"Flugzeuge über Düsseldorf",prov:"adsb.fi Open Data (über Datensammler)",url:"https://github.com/adsbfi/opendata",ep:"opendata.adsb.fi/api/v2/lat/…/lon/…/dist/…"},
  fb:{name:"Fußball (Fortuna, BVB)",prov:"OpenLigaDB (frei, ohne Schlüssel)",url:"https://www.openligadb.de",ep:"api.openligadb.de/getmatchdata/…"},
  tm:{name:"Großveranstaltungen",prov:"Ticketmaster Discovery API (eigener Schlüssel)",url:"https://developer.ticketmaster.com/",ep:"app.ticketmaster.com/discovery/v2/events.json"}
};
const status={};

// ================= Hilfen =================
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl=u=>/^https?:\/\//i.test(String(u||""))?String(u):"#";
const fmt=(n,d=0)=>n==null||n===""||isNaN(n)?"–":Number(n).toLocaleString("de-DE",{minimumFractionDigits:d,maximumFractionDigits:d});
const TZ={timeZone:"Europe/Berlin"};
const hhmm=d=>new Date(d).toLocaleTimeString("de-DE",{...TZ,hour:"2-digit",minute:"2-digit"});
const dayName=d=>new Date(d).toLocaleDateString("de-DE",{...TZ,weekday:"short",day:"2-digit",month:"2-digit"});
const dateTime=d=>new Date(d).toLocaleString("de-DE",{...TZ,weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
const dateShort=d=>new Date(d).toLocaleDateString("de-DE",{...TZ,day:"2-digit",month:"2-digit",year:"numeric"});
const isoDay=(d=new Date())=>d.toLocaleDateString("sv-SE",TZ);
function store(k,v){try{localStorage.setItem("lbd_"+k,JSON.stringify(v))}catch(e){}}
function load(k){try{return JSON.parse(localStorage.getItem("lbd_"+k))}catch(e){return null}}
/* VRR lehnt einzelne Anfragen gelegentlich kurz ab (HTTP 403/429/5xx) – dann bis zu dreimal kurz neu versuchen */
/* Wiederholung mit Zusatz „_r=…“: sonst liefert der Zwischenspeicher bei Cloudflare dieselbe Ablehnung noch einmal aus */
async function getJSON(url,ms=15000){for(let i=0;;i++){try{return await getJSON1(i&&/workers\.dev/.test(url)?url+(url.includes("?")?"&":"?")+"_r="+Date.now().toString(36)+i:url,ms);}catch(e){if(i>=3||!/workers\.dev|efa\.vrr\.de/.test(url)||!/HTTP (403|429|5\d\d)/.test(String(e&&e.message)))throw e;await new Promise(r=>setTimeout(r,900+i*900));}}}
async function getJSON1(url,ms=15000){
  const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),ms);
  try{const r=await fetch(url,{signal:ctl.signal,headers:{Accept:"application/json"}});
    if(!r.ok)throw new Error("HTTP "+r.status);
    return JSON.parse(await r.text());}
  finally{clearTimeout(t)}
}
// Vorab gesammelte OpenStreetMap-Daten rund um die Lieblingsorte (Datensammler, 1× täglich)
let OSMPOI=null;
async function osmLocal(kind,lat,lon,rKm){try{if(!OSMPOI)OSMPOI=getData("osm-poi.json").then(d=>d.data).catch(e=>{OSMPOI=null;throw e;});const D=await OSMPOI;if(!D||!D.places)return null;
  const R=kind==="c"?"rc":"rp";const ok=Object.values(D.places).some(p=>distKm(p.lat,p.lon,lat,lon)+rKm<=p[R]);if(!ok)return null;
  const pre=D[kind].filter(e=>Math.abs(e.lat-lat)<rKm/100&&Math.abs(e.lon-lon)<rKm/60);const near=e=>Math.abs(e.lat-lat)<rKm/100&&Math.abs(e.lon-lon)<rKm/60&&distKm(lat,lon,e.lat,e.lon)<=rKm;return {elements:pre.filter(near),b:kind==="c"?(D.b||[]).filter(near):[]};}catch(e){return null;}}
// OpenStreetMap-Abfrage: mehrere öffentliche Server gleichzeitig, der schnellste gewinnt
const OVERPASS=["https://overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter","https://maps.mail.ru/osm/tools/overpass/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
async function overpass(q){const ctls=[];
  const one=u=>{const c=new AbortController();ctls.push(c);const t=setTimeout(()=>c.abort(),25000);
    return fetch(u+"?data="+encodeURIComponent(q),{signal:c.signal}).then(async r=>{if(!r.ok)throw new Error("HTTP "+r.status);const d=JSON.parse(await r.text());if(!d||!Array.isArray(d.elements))throw new Error("JSON");return d;}).finally(()=>clearTimeout(t));};
  try{const d=await Promise.any(OVERPASS.map(one));ctls.forEach(c=>{try{c.abort();}catch(e){}});return d;}
  catch(e){throw new Error("Kein OpenStreetMap-Server hat geantwortet ("+((e.errors||[]).map(x=>errText(x)).filter((v,i,a)=>a.indexOf(v)===i).join(", ")||"unbekannt")+")");}}
function errText(e){
  const m=String(e&&e.message||e);
  if(/Failed to fetch|NetworkError|Load failed|blocked|access control/i.test(m))return "nicht erreichbar oder vom Browser blockiert (CORS)";
  if(/abort/i.test(m))return "Zeitüberschreitung";
  if(/JSON/i.test(m))return "unerwartetes Datenformat";
  if(/\b403\b/.test(m))return "Kontingent für heute aufgebraucht oder Schlüssel gesperrt (HTTP 403)";
  if(/\b429\b/.test(m))return "zu viele Abfragen in kurzer Zeit (HTTP 429)";
  return m;
}
const FAVKEYS=["dus","datteln","dortmund","alpen","salzhausen"];const EFAKEYS=[...FAVKEYS,"dortmund"];
async function getData(name){
  const d=await getJSON("data/"+name+"?t="+Math.floor(Date.now()/60000),15000);
  if(!d||!("data" in d))throw new Error("Datei leer");
  return d;
}
const dataAge=d=>{const m=Math.round((Date.now()-new Date(d.generated))/6e4);return m<1?"gerade eben":m<60?"vor "+m+" min":"vor "+Math.round(m/60)+" h";};
function setStatus(k,ok,msg){status[k]={ok,msg:msg||"",at:new Date()};renderSources();}
function distKm(a,b,c,d){const R=6371,r=Math.PI/180;const x=(c-a)*r,y=(d-b)*r;
  const h=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
const fact=(v,l)=>'<div class="fact"><b>'+v+'</b><span>'+l+'</span></div>';
const stateBox=(msg,links)=>'<div class="state">'+esc(msg)+(links?' '+links:'')+'</div>';
const link=(href,txt)=>'<a href="'+esc(href)+'" target="_blank" rel="noopener">'+esc(txt)+' ↗</a>';
let HNT=0;function setKpi(id,val,note,cls){const el=$(id);if(!el)return;clearTimeout(HNT);HNT=setTimeout(()=>{try{buildViewbar();}catch(e){}},300);["s-ok","s-warn","s-bad","s-crit","s-info"].forEach(c=>el.classList.remove(c));el.classList.add(cls?"s-"+cls:"s-info");
  el.querySelector(".val").innerHTML=val;el.querySelector(".note").textContent=note||" ";}

function wmo(c){
  if(c===0)return["Klar","sun"];if(c===1)return["Überwiegend klar","sun"];if(c===2)return["Teilweise bewölkt","partly"];if(c===3)return["Bedeckt","cloud"];
  if(c===45||c===48)return["Nebel","fog"];if(c>=51&&c<=57)return["Nieselregen","rain"];if(c>=61&&c<=67)return[c>=65?"Starker Regen":"Regen","rain"];
  if(c>=71&&c<=77)return["Schneefall","snow"];if(c>=80&&c<=82)return["Regenschauer","rain"];if(c===85||c===86)return["Schneeschauer","snow"];
  if(c>=95)return["Gewitter","storm"];return["–","cloud"];
}
function icon(kind,cls){
  const p={
    sun:'<circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></g>',
    partly:'<circle cx="9" cy="9" r="3.6" fill="currentColor" opacity=".8"/><path d="M8 19h9.5a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 8 19z" fill="currentColor"/>',
    cloud:'<path d="M7 18.5h10.5a4 4 0 0 0 .3-8 5.6 5.6 0 0 0-10.8 1.6A3.3 3.3 0 0 0 7 18.5z" fill="currentColor"/>',
    fog:'<g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h16M3 12h18M5 16h14M7 20h10"/></g>',
    rain:'<path d="M7 14h10.5a3.8 3.8 0 0 0 .3-7.6A5.4 5.4 0 0 0 7.4 8 3.1 3.1 0 0 0 7 14z" fill="currentColor"/><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/></g>',
    snow:'<path d="M7 14h10.5a3.8 3.8 0 0 0 .3-7.6A5.4 5.4 0 0 0 7.4 8 3.1 3.1 0 0 0 7 14z" fill="currentColor"/><g fill="currentColor"><circle cx="8" cy="18" r="1.2"/><circle cx="12" cy="20" r="1.2"/><circle cx="16" cy="18" r="1.2"/></g>',
    storm:'<path d="M7 13h10.5a3.8 3.8 0 0 0 .3-7.6A5.4 5.4 0 0 0 7.4 7 3.1 3.1 0 0 0 7 13z" fill="currentColor"/><path d="M12.5 13l-2.5 4.5h3l-2 4.5 5-6h-3l1.5-3z" fill="currentColor"/>'
  };
  return '<svg class="wicon '+(cls||"")+'" viewBox="0 0 24 24" aria-hidden="true">'+(p[kind]||p.cloud)+'</svg>';
}
function eaqi(v){
  if(v==null)return{t:"keine Daten",c:"",i:-1};
  if(v<=20)return{t:"gut",c:"ok",i:0};if(v<=40)return{t:"ziemlich gut",c:"ok",i:1};if(v<=60)return{t:"mäßig",c:"warn",i:2};
  if(v<=80)return{t:"schlecht",c:"bad",i:3};if(v<=100)return{t:"sehr schlecht",c:"bad",i:4};return{t:"extrem schlecht",c:"crit",i:5};
}
const AQ_COL=["#50f0e6","#50ccaa","#f0e641","#ff5050","#960032","#7d2181"];
const windDir=d=>d==null?"":["N","NO","O","SO","S","SW","W","NW"][Math.round(d/45)%8];
function bft(kmh){const t=[1,6,12,20,29,39,50,62,75,89,103,118];let b=0;while(b<t.length&&kmh>=t[b])b++;return b;}

// ================= Zustand =================
let CUSTOM=load("custom")||[];
let sel=String(load("sel")||"dus-4");
if(sel==="dus-heerdt"){sel="dus-4";store("sel",sel);}
if(!load("def_heerdt")){if(sel==="dus-1")sel="dus-4";store("def_heerdt",1);store("sel",sel);}
// Direktaufruf z. B. für Kurzbefehle: ?ort=duesseldorf | dus-3 | datteln | alpen | salzhausen | <Name eines eigenen Orts>
(function(){try{const q=new URLSearchParams(location.search).get("ort");if(!q)return;const v=q.trim().toLowerCase();
  if(/^(dus|duesseldorf|düsseldorf|heerdt|dus-heerdt|oberkassel)$/.test(v))sel="dus-4";
  else if(v==="mitte")sel="dus-1";
  else if(/^dus-([1-9]|10)$/.test(v))sel=v;
  else if(STADTTEILE.some(t=>t.key===v||"dus-"+t.key===v))sel="dus-"+v.replace(/^dus-/,"");
  else{const p=[...FAVS,...CUSTOM].find(x=>x.key===v||x.name.toLowerCase()===v||x.name.toLowerCase().startsWith(v));if(p)sel="p-"+p.key;}
  store("sel",sel);}catch(e){}})();
let EFAK=null;function ec(){return EFAK||C;}
const EFACITY={dus:{key:"dus",isDus:true,efaDefault:"Düsseldorf Nikolaus-Knopp-Platz"},datteln:{key:"datteln",isDus:false,efaDefault:"Datteln Busbahnhof"},dortmund:{key:"dortmund",isDus:false,efaDefault:"Dortmund Hbf"},alpen:{key:"alpen",isDus:false,efaDefault:"Alpen Bahnhof"},salzhausen:{key:"salzhausen",isDus:false,efaDefault:null}};
let STOPS=load("stops")||{};/* Ziel im ÖPNV-Feld gilt nur bis zum Neuladen */ let DIRF={};try{localStorage.removeItem("lbd_dirf");}catch(e){}let STOPIDX=null,EFADATA=null;
if(STOPS.dus==="Düsseldorf Heinrich-Heine-Allee"){delete STOPS.dus;store("stops",STOPS);}
let ABSEL=load("absel")||{};   // Autobahn-Auswahl je eigenem Ort
let TK=load("tk")||"";
let WINDY=load("windy")||"";let HOMES=load("homes")||{};
// feste Adressen für die Fahrt Düsseldorf ⇄ Datteln
const FIXHOME={dus:{label:"Alt-Heerdt 87, 40549 Düsseldorf",lat:51.22836,lon:6.72003},datteln:{label:"Helene-Weber-Straße 30, 45711 Datteln",lat:51.66456,lon:7.34258},dortmund:{label:"Blankensteiner Straße 5, 44137 Dortmund",lat:51.50286,lon:7.44386},alpen:{label:"Ringstraße 25, 46519 Alpen",lat:51.6167,lon:6.53155},salzhausen:{label:"Fliederweg 7, 21376 Salzhausen",lat:53.22205,lon:10.16865}};
for(const k of ["dus","datteln"])if(!HOMES[k]||!isFinite(HOMES[k].lat))HOMES[k]={q:FIXHOME[k].label,...FIXHOME[k]};
async function geocodeHome(key,q){const r=await getJSON("https://api.tomtom.com/search/2/geocode/"+encodeURIComponent(q)+".json?limit=1&countrySet=DE&language=de-DE&key="+encodeURIComponent(TTKEY));
  const x=(r.results||[])[0];if(!x)throw new Error("nicht gefunden");HOMES[key]={q,label:x.address.freeformAddress,lat:x.position.lat,lon:x.position.lon};store("homes",HOMES);return HOMES[key];}
setTimeout(async()=>{const m=location.hash.match(/^#home=(.+)$/);if(!m)return;
  try{const o=JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));const done=[];
    for(const [k,q] of Object.entries(o)){try{const h=await geocodeHome(k,q);done.push(h.label);}catch(e){done.push(q+" (nicht gefunden)");}}
    history.replaceState(null,"",location.pathname+location.search);
    alert("Adressen auf diesem Gerät gespeichert:\n"+done.join("\n"));if(typeof loadTomTom==="function")loadTomTom();}catch(e){}},800);
let GMKEY=load("gmkey")||"";const GMC={};
/* Fahrzeit von Google Maps (Routes API, Verkehr berücksichtigt) – je Strecke höchstens alle 10 min */
async function gmTime(o,d){const k=(o.label||o.lat+","+o.lon)+"|"+(d.label||d.lat+","+d.lon);const c=GMC[k];if(c&&Date.now()-c.at<10*6e4)return c.v;
  const pt=x=>x.label?{address:x.label}:{location:{latLng:{latitude:x.lat,longitude:x.lon}}};
  const r=await fetch("https://routes.googleapis.com/directions/v2:computeRoutes",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":GMKEY,"X-Goog-FieldMask":"routes.duration,routes.staticDuration,routes.distanceMeters"},
    body:JSON.stringify({origin:pt(o),destination:pt(d),travelMode:"DRIVE",routingPreference:"TRAFFIC_AWARE_OPTIMAL",languageCode:"de-DE"})});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||("HTTP "+r.status));const rt=(j.routes||[])[0];if(!rt)throw new Error("keine Route");
  const sec=parseInt(rt.duration,10),st=parseInt(rt.staticDuration||rt.duration,10);const v={min:Math.round(sec/60),dl:Math.max(0,Math.round((sec-st)/60)),km:(rt.distanceMeters||0)/1000};GMC[k]={at:Date.now(),v};return v;}
const TTKEY_DEFAULT="RSDptU00A2TYdT3fwL1oTHnKl6XOEf51";let TTKEY=load("tomtom")||TTKEY_DEFAULT;
const ROUTES_DEFAULT="A52 Essen; A40 Duisburg; A57 Nimwegen; A2 Hannover";
// Strecken je Ort; die bisherige Liste gilt für Düsseldorf
if(load("routes")!=null&&load("routes_dus")==null)store("routes_dus",load("routes"));
const ROUTES_DEFAULTS={dus:ROUTES_DEFAULT,datteln:"A2 Oberhausen; A43 Wuppertal; A52 Düsseldorf; A2 Hannover; A43 Münster"};
const routesFor=k=>load("routes_"+k)??(ROUTES_DEFAULTS[k]||"");
let ROUTES_TXT=routesFor(String(load("sel")||"dus-4").startsWith("dus-")?"dus":String(load("sel")).replace(/^p-/,""));
function parseRoutes(t){return String(t||"").split(/[;\n]+/).map(x=>x.trim()).filter(Boolean).map(x=>{const m=x.match(/^A?\s*(\d{1,3})\s*(?:Richtung|Ri\.|→|->|>|nach)?\s*(.+)$/i);return m?{ab:"A"+m[1],dir:m[2].trim()}:null;}).filter(Boolean);}
let ROUTES=parseRoutes(ROUTES_TXT);
let WX=null,AQ=null,HOL=null,SCHOOL=null,PARK=load("park")||{},BIKE=null,OBS=null;
const theme=load("theme")||"";if(theme)document.documentElement.setAttribute("data-theme",theme);

function allPlaces(){return[...FAVS,...CUSTOM];}
function ctx(){
  if(sel.startsWith("dus-")&&STADTTEILE.some(t=>"dus-"+t.key===sel)){
    const i=STADTTEILE.findIndex(t=>"dus-"+t.key===sel),t=STADTTEILE[i];
    return {key:"dus",isDus:true,bezirk:BEZIRKE[t.bezirk-1],name:"Düsseldorf-"+t.name,town:"Düsseldorf",short:t.name,detail:t.detail,
      lat:t.lat,lon:t.lon,center:{lat:DUS.lat,lon:DUS.lon},state:"NW",ars:DUS.ars,ab:DUS.ab,efaDefault:DUS.efa,pollen:/Tiefland/,wxIdx:10+i,districtSel:t.bezirk};
  }
  if(sel.startsWith("dus-")){
    const n=Math.min(10,Math.max(1,parseInt(sel.slice(4),10)||1)),b=BEZIRKE[n-1];
    return {key:"dus",isDus:true,bezirk:b,name:n===1?"Düsseldorf Mitte":"Düsseldorf · "+b.name,town:"Düsseldorf",short:b.name,detail:b.detail,
      lat:b.lat,lon:b.lon,center:{lat:DUS.lat,lon:DUS.lon},state:"NW",ars:DUS.ars,ab:DUS.ab,efaDefault:DUS.efa,pollen:/Tiefland/,wxIdx:n-1,districtSel:n};
  }
  const p=allPlaces().find(x=>"p-"+x.key===sel)||FAVS[0];
  const isFav=FAVS.includes(p);
  return {key:p.key,isDus:false,name:p.name,town:p.name,short:p.name,detail:p.detail||"",lat:p.lat,lon:p.lon,center:{lat:p.lat,lon:p.lon},
    state:p.state||"NW",ars:p.ars||null,ab:isFav?p.ab:(ABSEL[p.key]||[]),efaDefault:p.state==="NW"?(p.efa||p.name+" Bahnhof"):null,pollen:p.pollen||null,wxIdx:10+STADTTEILE.length};
}
let C=ctx();

// ================= Auswahlfeld =================
const selEl=$("bezirk");
function buildSelect(){
  selEl.innerHTML="";
  const g1=document.createElement("optgroup");g1.label="Düsseldorf";
  BEZIRKE.forEach(b=>{const o=document.createElement("option");o.value="dus-"+b.id;o.textContent=b.id===1?"Düsseldorf Mitte":"Bezirk "+b.id+" · "+b.name;g1.appendChild(o);
    STADTTEILE.filter(t=>t.bezirk===b.id).forEach(t=>{const o2=document.createElement("option");o2.value="dus-"+t.key;o2.textContent="Bezirk "+b.id+" · "+t.name;g1.appendChild(o2);});});
  selEl.appendChild(g1);
  const g2=document.createElement("optgroup");g2.label="Meine Orte";
  allPlaces().forEach(p=>{const o=document.createElement("option");o.value="p-"+p.key;o.textContent=p.name;g2.appendChild(o);});
  const add=document.createElement("option");add.value="__add";add.textContent="+ Ort hinzufügen …";g2.appendChild(add);
  selEl.appendChild(g2);
  selEl.value=sel;if(selEl.value!==sel){sel="dus-4";selEl.value=sel;}
}
buildSelect();
// Rot blinkender Hinweis bei aktiven Warnungen – für alle Lieblingsstädte gleichzeitig
let LOCAL_ALARM={n:0,title:""};const FAV_ALARM={};
function setAlarm(n,title,all){LOCAL_ALARM={n,title:title||"",all:all||[]};if(FAVKEYS.includes(C.key))FAV_ALARM[C.key]={n,title:title||"",all:all||[],name:C.key==="dus"?"Düsseldorf":C.town};renderAlarm();}
let ALARM_SIG="";
function favPlaces(){return [{key:"dus",name:"Düsseldorf",lat:BEZIRKE[0].lat,lon:BEZIRKE[0].lon,sel:"dus-4"},...FAVS.map(f=>({key:f.key,name:f.name,lat:f.lat,lon:f.lon,sel:"p-"+f.key}))];}
async function scanFavAlarms(){
  await Promise.all(favPlaces().map(async p=>{
    const titles=[];let ok=false;
    await Promise.all([
      getJSON("https://api.brightsky.dev/alerts?lat="+p.lat+"&lon="+p.lon+"&tz=Europe/Berlin").then(d=>{ok=true;(d.alerts||[]).forEach(a=>titles.push(a.headline_de||a.event_de));}).catch(()=>{}),
      getData("nina-"+p.key+".json").then(d=>{ok=true;(d.data||[]).forEach(a=>titles.unshift(a.headline||a.title));}).catch(()=>{})]);
    if(ok)FAV_ALARM[p.key]={n:titles.length,title:titles[0]||"",all:titles,name:p.name};
  }));
  renderAlarm();
}
var WARN_SUM=null;
// Übersicht aller fünf Orte in der Ansicht „Warnungen“
function renderWarnAll(){const box=$("warn-all-list");if(!box)return;const short=t=>String(t||"").replace(/^Amtliche (UNWETTER)?WARNUNG vor /i,"").replace(/^Amtliche /i,"");
  box.innerHTML=favPlaces().map(p=>{const a=FAV_ALARM[p.key];const n=a?a.n:null;const cur=p.key===C.key;
    return '<button type="button" class="wa'+(n?" hot":"")+(cur?" cur":"")+'" data-wsel="'+esc(p.sel)+'"><i class="dot"'+(n==null?' style="background:#8a9aa5"':'')+'></i><b>'+esc(p.name)+'</b><span class="wt">'+
      (n==null?"wird geladen …":n?[...new Set(a.all)].map(t=>esc(short(t))).join("<br>"):"keine Warnungen")+'</span></button>';}).join("");}
document.addEventListener("click",e=>{const b=e.target.closest("[data-wsel]");if(!b)return;if(b.dataset.wsel!==sel)choose(b.dataset.wsel);setTimeout(()=>{const w=$("warnungen");if(w)w.scrollIntoView({behavior:"smooth",block:"start"});},300);});
function renderAlarm(){
  const list=favPlaces().filter(p=>FAV_ALARM[p.key]&&FAV_ALARM[p.key].n>0).map(p=>({...FAV_ALARM[p.key],key:p.key,sel:p.sel}));
  if(!FAVKEYS.includes(C.key)&&LOCAL_ALARM.n>0)list.unshift({n:LOCAL_ALARM.n,title:LOCAL_ALARM.title,name:C.town,key:C.key,sel:sel});
  renderWarnAll();
  WARN_SUM={list,names:favPlaces().map(p=>p.name),loaded:Object.keys(FAV_ALARM).length};clearTimeout(HNT);HNT=setTimeout(()=>{try{buildViewbar();}catch(e){}},300);
  ALARM_SIG=list.map(x=>x.key+":"+(x.all&&x.all.length?x.all:[x.title]).slice().sort().join("|")).sort().join("#");
  const seen=list.length&&load("alarm_seen")===ALARM_SIG;
  document.body.classList.toggle("alarm",list.length>0&&!seen);document.body.classList.toggle("alarm-seen",!!seen);
  const b=$("alarmbar");b.hidden=!list.length;b.classList.toggle("seen",!!seen);
  b.innerHTML=list.length?'<span class="ab-h">Warnung'+(list.reduce((s,x)=>s+x.n,0)>1?"en":"")+'</span>'+list.map(x=>'<button type="button" class="ab-c" data-sel="'+esc(x.sel)+'"><b>'+esc(x.name)+'</b> '+esc(x.title)+(x.n>1?' <small>(+'+(x.n-1)+' weitere)</small>':'')+' ›</button>').join("")+(seen?'<span class="ab-s">gesehen ✓ – blinkt wieder bei neuer Warnung</span>':'<button type="button" class="ab-ok" data-ack="1">Gesehen ✓</button>'):"";
  // Kachel: Summe über alle Lieblingsstädte, je Stadt eine Zeile
  if(list.length){const tot=list.reduce((t,x)=>t+x.n,0);
    const el=$("k-warn");setKpi("k-warn",String(tot)+"<small> "+(tot===1?"Warnung":"Warnungen")+"</small>","","bad");
    const short=t=>String(t||"").replace(/^Amtliche (UNWETTER)?WARNUNG vor /i,"").replace(/^Amtliche /i,"");
    el.querySelector(".note").innerHTML=list.map(x=>'<span class="wl"><b>'+esc(x.name)+(x.n>1?" ("+x.n+")":"")+':</b> '+esc(short(x.title))+'</span>').join("");}
  document.querySelectorAll("#favs .fav").forEach(f=>f.classList.toggle("alarm-on",!!(FAV_ALARM[f.dataset.fav]&&FAV_ALARM[f.dataset.fav].n)));
}
// Aktiven Themen-Knopf erneut antippen = Bereich schließen (zurück zur Übersicht)
document.addEventListener("click",e=>{const a=e.target.closest("#headnav a.on[data-v]");if(!a||(typeof HEDIT!=="undefined"&&HEDIT))return;e.preventDefault();e.stopImmediatePropagation();history.pushState(null,"","#");route();window.scrollTo({top:0,behavior:"smooth"});},true);
// Veranstaltung antippen → in der Verkehrslage-Karte zeigen
document.addEventListener("click",e=>{const it=e.target.closest("#v-events [data-lat]");if(!it||e.target.closest("a,summary,details"))return;e.preventDefault();
  const la=it.dataset.lat,lo=it.dataset.lon,ev=!!it.closest("#ev-list");if(!C.isDus)choose("dus-4");history.pushState(null,"","#staus/karte");route();
  setTimeout(()=>{setVL(ev?"event":"next");const t=document.querySelector('#'+(ev?"vt-events":"vt-next")+' [data-lat="'+la+'"][data-lon="'+lo+'"]');if(t)t.click();},700);});
// Warnleiste antippen = Warnung gesehen (Blinken stoppt bis zur nächsten neuen Warnung)
document.addEventListener("click",e=>{if(!e.target.closest("#warnpill"))return;if(ALARM_SIG){store("alarm_seen",ALARM_SIG);renderAlarm();}});
$("alarmbar").addEventListener("click",e=>{if(e.target.closest("[data-ack]")){store("alarm_seen",ALARM_SIG);renderAlarm();return;}const c=e.target.closest(".ab-c");if(!c)return;if(c.dataset.sel!==sel)choose(c.dataset.sel);location.hash="warnungen";});
// ================= Taschenrechner =================
(function(){
  const dlg=$("calc-dlg");let expr="",last=null;
  const fmtN=n=>{if(!isFinite(n))return"Fehler";const r=Math.round(n*1e10)/1e10;return r.toLocaleString("de-DE",{maximumFractionDigits:10});};
  // sichere Auswertung ohne eval: + − × ÷ % Klammern, Dezimalkomma
  function calc(src){
    const t=[];const str=src.replace(/\s/g,"");let i=0;
    while(i<str.length){const c=str[i];
      if(/[0-9,.]/.test(c)){let j=i;while(j<str.length&&/[0-9,.]/.test(str[j]))j++;t.push(parseFloat(str.slice(i,j).replace(/\./g,"").replace(",",".")));i=j;continue;}
      if("+−×÷()%-*/".includes(c)){t.push({"-":"−","*":"×","/":"÷"}[c]||c);i++;continue;}
      throw new Error("Zeichen");}
    let p=0;
    const peek=()=>t[p],next=()=>t[p++];
    function prim(){let v;const x=next();
      if(x==="−")return -prim();if(x==="+")return prim();
      if(x==="("){v=sum();if(next()!==")")throw new Error(")");}
      else if(typeof x==="number")v=x;else throw new Error("Syntax");
      while(peek()==="%"){next();v=v/100;}
      return v;}
    function prod(){let v=prim();while(peek()==="×"||peek()==="÷"){const o=next(),r=prim();v=o==="×"?v*r:v/r;}return v;}
    function sum(){let v=prod();while(peek()==="+"||peek()==="−"){const o=next();let r=prod();
      // 200 + 10 % → 220
      if(t[p-1]==="%"&&typeof t[p-2]==="number")r=v*r;
      v=o==="+"?v+r:v-r;}return v;}
    const v=sum();if(p<t.length)throw new Error("Syntax");return v;}
  const show=()=>{$("calc-expr").textContent=expr;let r="";try{r=expr?fmtN(calc(expr)):"0";}catch(e){r=last!=null?$("calc-res").textContent:"0";}$("calc-res").textContent=r;};
  function key(k){
    if(k==="C"){expr="";last=null;}
    else if(k==="⌫")expr=expr.slice(0,-1);
    else if(k==="="){try{const v=calc(expr);$("calc-hist").textContent=expr+" = "+fmtN(v);expr=fmtN(v).replace(/\./g,"");last=v;}catch(e){$("calc-res").textContent="Fehler";return;}}
    else expr+=k;
    show();}
  $("calc-btn").addEventListener("click",()=>{dlg.showModal();show();});
  $("calc-keys").addEventListener("click",e=>{const b=e.target.closest("[data-k]");if(b)key(b.dataset.k);});
  $("calc-res").addEventListener("click",()=>{try{navigator.clipboard.writeText($("calc-res").textContent);$("calc-hist").textContent="Ergebnis kopiert";}catch(e){}});
  dlg.addEventListener("keydown",e=>{const m={"*":"×","/":"÷","-":"−","+":"+",".":",",",":",","Enter":"=","=":"=","Backspace":"⌫","Escape":null,"Delete":"C","c":"C","%":"%","(":"(",")":")"};
    if(/^[0-9]$/.test(e.key)){e.preventDefault();key(e.key);}else if(e.key in m&&m[e.key]){e.preventDefault();key(m[e.key]);}});
})();
// ================= Wecker & Erinnerung =================
(function(){
  const NTFY_TOPIC="lagebild-thh-de66cb14565a";
  const dlg=$("alarm-dlg");let AC=null,beepT=null,ringing=null;
  const list=()=>load("alarms")||[];const save=l=>store("alarms",l);
  const hm=ts=>new Date(ts).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
  const dayLbl=ts=>{const d=new Date(ts),t=new Date();const dd=Math.round((new Date(d.toDateString())-new Date(t.toDateString()))/864e5);return dd===0?"heute":dd===1?"morgen":d.toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"});};
  function render(){const l=list().filter(a=>a.at>Date.now()-60000).sort((a,b)=>a.at-b.at);save(l);
    $("al-list").innerHTML=l.length?l.map(a=>'<div class="al-it"><div><b>'+hm(a.at)+'</b> <span class="muted small">'+dayLbl(a.at)+(a.push?' · mit Push':'')+'</span><div>'+esc(a.text||"Wecker")+'</div></div><button type="button" data-del="'+a.id+'">Löschen</button></div>').join(""):'<div class="muted small">Kein Wecker gestellt.</div>';
    {const ab=$("alarm-btn"),sv=ab.querySelector("svg");ab.textContent="Wecker"+(l.length?" ("+hm(l[0].at)+")":"");if(sv)ab.prepend(sv);}
    $("al-next").innerHTML=l.length?'<div><div class="lbl2">Nächster Wecker</div><div class="big-t">'+hm(l[0].at)+'</div></div><div>'+esc(l[0].text||"Wecker")+'<div class="small" style="opacity:.7">'+dayLbl(l[0].at)+'</div></div>':'<div><div class="lbl2">Jetzt</div><div class="big-t" id="al-now">'+hm(Date.now())+'</div></div><div style="opacity:.8">Kein Wecker gestellt</div>';}
  function unlockAudio(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();}catch(e){}}
  function beep(){if(!AC)return;const t=AC.currentTime;[0,.25,.5].forEach((d,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type="square";o.frequency.value=i===2?1175:880;g.gain.setValueAtTime(.0001,t+d);g.gain.exponentialRampToValueAtTime(.25,t+d+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d+.2);o.connect(g).connect(AC.destination);o.start(t+d);o.stop(t+d+.22);});}
  function ring(a){document.querySelectorAll("dialog[open]").forEach(d=>d.close());ringing=a;$("ring-t").textContent=a.text||"Wecker";$("ring-time").textContent=hm(a.at)+" Uhr";$("ring").hidden=false;unlockAudio();beep();clearInterval(beepT);beepT=setInterval(beep,1200);
    try{navigator.vibrate&&navigator.vibrate([400,200,400]);}catch(e){}
    document.title="⏰ "+(a.text||"Wecker");}
  function stopRing(){clearInterval(beepT);$("ring").hidden=true;ringing=null;document.title="Lagebild Thomas Hußmann · "+C.town;}
  setInterval(()=>{if(ringing)return;const now=Date.now();const l=list();const due=l.find(a=>a.at<=now&&!a.done&&now-a.at<10*60000);
    if(due){due.done=true;save(l);ring(due);render();}},1000);
  async function add(at,text,push){
    if(at<=Date.now()+30000){$("al-msg").textContent="Bitte eine Zeit in der Zukunft wählen.";return;}
    const a={id:String(Date.now()),at,text:text.trim(),push};unlockAudio();
    if(push){if(at-Date.now()>3*864e5){$("al-msg").textContent="Push geht höchstens 3 Tage im Voraus – nur Wecker im Dashboard gestellt.";a.push=false;}
      else{try{const r=await fetch("https://ntfy.sh/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:NTFY_TOPIC,title:"⏰ "+(a.text||"Wecker")+" – "+hm(at)+" Uhr",message:a.text||"Wecker aus dem Lagebild",priority:5,tags:["alarm_clock"],delay:String(Math.floor(at/1000)),click:location.origin+location.pathname})});
        if(!r.ok)throw new Error("HTTP "+r.status);$("al-msg").textContent="Gestellt für "+hm(at)+" Uhr ("+dayLbl(at)+") – Push-Nachricht ist vorgemerkt.";}
      catch(e){a.push=false;$("al-msg").textContent="Gestellt – Push konnte nicht vorgemerkt werden ("+e.message+").";}}}
    else $("al-msg").textContent="Gestellt für "+hm(at)+" Uhr ("+dayLbl(at)+").";
    const l=list();l.push(a);save(l);render();}
  $("alarm-btn").addEventListener("click",()=>{if(/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)){if(document.body.classList.contains("harrange"))return;location.href="shortcuts://run-shortcut?name="+encodeURIComponent("ClockPhone");return;}const d=new Date(Date.now()+30*60000);$("al-time").value=d.toTimeString().slice(0,5);$("al-date").value=d.toLocaleDateString("sv-SE");$("al-msg").textContent="";render();dlg.showModal();});
  $("al-quick").addEventListener("click",e=>{const b=e.target.closest("[data-min]");if(!b)return;const m=+b.dataset.min;add(Date.now()+m*60000,$("al-text").value||("Kurzzeitwecker "+b.textContent),$("al-push").checked);});
  $("al-set").addEventListener("click",()=>{const t=$("al-time").value,d=$("al-date").value;if(!t){$("al-msg").textContent="Bitte eine Uhrzeit wählen.";return;}
    let at=new Date((d||new Date().toLocaleDateString("sv-SE"))+"T"+t).getTime();if(!d&&at<Date.now())at+=864e5;add(at,$("al-text").value,$("al-push").checked);});
  $("al-list").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;const a=list().find(x=>x.id===b.dataset.del);save(list().filter(x=>x.id!==b.dataset.del));render();
    if(a&&a.push)$("al-msg").textContent="Gelöscht. Die bereits vorgemerkte Push-Nachricht kommt trotzdem noch.";});
  $("ring-stop").addEventListener("click",stopRing);
  $("ring-snooze").addEventListener("click",()=>{const a=ringing;stopRing();if(a){const l=list();l.push({id:String(Date.now()),at:Date.now()+5*60000,text:a.text,push:false});save(l);render();}});
  document.querySelectorAll(".tooldlg [data-close]").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
  document.querySelectorAll(".tooldlg").forEach(d=>d.addEventListener("click",e=>{if(e.target===d)d.close();}));
  render();
})();
// Radio
let RADIO=null;
const RADIO_SITE={wdr2:"https://www1.wdr.de/radio/wdr2/",wdr4:"https://www1.wdr.de/radio/wdr4/",antenne:"https://www.antenneduesseldorf.de/",orfstm:"https://steiermark.orf.at/radio/",orfnoe:"https://noe.orf.at/radio/",kronehit:"https://www.kronehit.at/",antstm:"https://www.antenne.at/"};
/* Einstellungen auf andere Geräte übertragen (Text per AirDrop/Notizen, kein Server) */
{const SKIP=["placecache","addrcache","nb_cities"],PFX="LAGEBILD1:";
 const msg=(t,c)=>{const m=$("sync-msg");if(!m)return;m.textContent=t;m.className="hint "+(c||"");};
 const pack=()=>{const d={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||!k.startsWith("lbd_")||SKIP.includes(k.slice(4)))continue;const v=localStorage.getItem(k);if(v&&v.length>8000)continue;d[k]=v;}
   return PFX+btoa(unescape(encodeURIComponent(JSON.stringify({v:1,t:new Date().toISOString(),d}))));};
 /* robust: Leerzeichen/Zeilenumbrüche, doppelt eingefügter Text oder Zusatztext (z. B. Titel aus Notizen) werden ignoriert; der neueste gültige Block gewinnt */
 const unpack=t=>{t=(t||"").replace(/\s+/g,"").replace(/[\u200B-\u200D\uFEFF]/g,"");const ms=t.split(PFX).slice(1).map(x=>(/^[A-Za-z0-9+\/_-]+={0,2}/.exec(x)||[""])[0]).filter(Boolean);if(!ms.length)throw 0;
   let best=null;for(const b of ms){for(let n=b.length-(b.length%4);n>=Math.max(4,b.length-8);n-=4){try{const o=JSON.parse(decodeURIComponent(escape(atob(b.slice(0,n).replace(/-/g,"+").replace(/_/g,"/")))));if(o&&o.d&&(!best||String(o.t||"")>=String(best.t||"")))best=o;break;}catch(e){}}}
   if(!best)throw 0;return best;};
 const out=$("sync-out");if(out)out.addEventListener("click",async()=>{const t=pack();$("sync-text").value=t;
   try{if(navigator.share){await navigator.share({title:"Lagebild – Einstellungen",text:t});msg("Übertragen. Auf dem anderen Gerät „Einstellungen übernehmen“ tippen.","ok");return;}}catch(e){if(e&&e.name==="AbortError")return;}
   try{await navigator.clipboard.writeText(t);msg("Kopiert. Auf dem anderen Gerät einfügen und „Übernehmen“ tippen.","ok");}catch(e){$("sync-text").select();msg("Text oben markiert – bitte kopieren.","");}});
 const go=t=>{let o;try{o=unpack(t);}catch(e){msg("Das ist kein gültiger Übertragungs-Text. Bitte „Feld leeren“ und den Text vom anderen Gerät noch einmal komplett einfügen (er beginnt mit LAGEBILD1:).","err");return;}
   Object.entries(o.d).forEach(([k,v])=>{if(k.startsWith("lbd_"))try{localStorage.setItem(k,v);}catch(e){}});
   msg("Übernommen ("+Object.keys(o.d).length+" Einstellungen) – lädt neu …","ok");setTimeout(()=>location.reload(),800);};
 const pin=$("sync-in-paste");if(pin)pin.addEventListener("click",async()=>{let t="";try{t=await navigator.clipboard.readText();}catch(e){}
   if(t&&t.includes(PFX)){$("sync-text").value=t;go(t);}else{$("sync-text").focus();msg("Übertragungs-Text unten einfügen und „Übernehmen & neu laden“ tippen.","");}});
 const inb=$("sync-in");if(inb)inb.addEventListener("click",()=>go($("sync-text").value));
 /* Übertragung per Code: Empfänger zeigt 6-stelligen Code und wartet; Sender verschlüsselt mit dem Code (AES-GCM)
    und schickt einmalig über ntfy.sh (ohne Zwischenspeicherung) – nichts wird dauerhaft auf einem Server abgelegt. */
 const enc=new TextEncoder(),dec=new TextDecoder();
 const b64=u=>{let s="";u.forEach(b=>s+=String.fromCharCode(b));return btoa(s);},unb64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
 const topicOf=async c=>"lagebild-sync-"+[...new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode("lbd-sync|"+c)))].slice(0,12).map(b=>b.toString(16).padStart(2,"0")).join("");
 const keyOf=async(c,salt)=>crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:150000,hash:"SHA-256"},await crypto.subtle.importKey("raw",enc.encode(c),"PBKDF2",false,["deriveKey"]),{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
 const box=$("sync-codebox");let es=null,esT=null;
 const stopRecv=()=>{if(es){es.close();es=null;}clearTimeout(esT);};
 const apply=o=>{Object.entries(o.d||{}).forEach(([k,v])=>{if(k.startsWith("lbd_"))try{localStorage.setItem(k,v);}catch(e){}});
   box.hidden=false;box.innerHTML='<div class="code" style="font-size:30px">✓</div>Übernommen ('+Object.keys(o.d||{}).length+' Einstellungen) – lädt neu …';msg("","");setTimeout(()=>location.reload(),1200);};
 const recv=$("sync-recv");if(recv)recv.addEventListener("click",async()=>{stopRecv();
   const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,"0");const topic=await topicOf(code);
   box.hidden=false;box.innerHTML='Auf dem iPhone „Senden“ tippen und diesen Code eingeben:<div class="code">'+code.slice(0,3)+' '+code.slice(3)+'</div><span class="muted small">wartet … (10 Minuten gültig)</span>';msg("","");
   es=new EventSource("https://ntfy.sh/"+topic+"/sse");
   es.onmessage=async ev=>{try{const m=JSON.parse(ev.data);if(m.event!=="message"||!m.message)return;const p=JSON.parse(m.message);
       const key=await keyOf(code,unb64(p.s));const raw=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(p.i)},key,unb64(p.c)));
       let txt;if(p.z){const st=new Blob([raw]).stream().pipeThrough(new DecompressionStream("gzip"));txt=await new Response(st).text();}else txt=dec.decode(raw);
       stopRecv();apply(JSON.parse(txt));}catch(e){msg("Empfangen, aber nicht lesbar – bitte noch einmal versuchen.","err");}};
   es.onerror=()=>{};esT=setTimeout(()=>{stopRecv();box.hidden=true;msg("Code abgelaufen – bitte neu „Empfangen“ tippen.","err");},600000);});
 const send=$("sync-send");if(send)send.addEventListener("click",()=>{stopRecv();box.hidden=false;
   box.innerHTML='Code vom anderen Gerät eingeben:<input id="sync-code" inputmode="numeric" pattern="[0-9]*" maxlength="7" autocomplete="one-time-code" placeholder="000 000"><div class="sync-btns"><button type="button" class="btn" id="sync-code-go">Senden</button></div>';
   const inp=$("sync-code");inp.focus();
   const go2=async()=>{const code=(inp.value||"").replace(/\D/g,"");if(code.length!==6){msg("Bitte den 6-stelligen Code eingeben.","err");return;}
     try{msg("Wird gesendet …","");const d={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||!k.startsWith("lbd_")||SKIP.includes(k.slice(4)))continue;const v=localStorage.getItem(k);if(v&&v.length>8000)continue;d[k]=v;}
       let raw=enc.encode(JSON.stringify({v:1,t:new Date().toISOString(),d})),z=0;
       if(typeof CompressionStream!=="undefined"){raw=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer());z=1;}
       const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
       const c=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},await keyOf(code,salt),raw));
       const body=JSON.stringify({s:b64(salt),i:b64(iv),c:b64(c),z});if(body.length>3900)throw new Error("zu viele Daten");
       const r=await fetch("https://ntfy.sh/"+(await topicOf(code))+"?cache=no",{method:"POST",body});if(!r.ok)throw new Error("HTTP "+r.status);
       box.innerHTML='<div class="code" style="font-size:30px">✓</div>Gesendet. Das andere Gerät übernimmt die Einstellungen und lädt neu.';msg("","");
     }catch(e){msg("Senden fehlgeschlagen ("+(e.message||e)+"). Läuft auf dem anderen Gerät „Empfangen“ mit diesem Code?","err");}};
   $("sync-code-go").addEventListener("click",go2);inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();go2();}});});
 const clr=$("sync-clear");if(clr)clr.addEventListener("click",()=>{$("sync-text").value="";msg("Feld geleert.","");$("sync-text").focus();});}
/* ARD Sounds · Rubriken: aufklappbar, sortierbar, Reihenfolge nur auf diesem Gerät */
{const box=$("r-ard"),tg=$("r-ard-tg");if(box&&tg){
  const R=[["truecrime","True Crime","true-crime-120","#4a4f6e","#1c1f33"],["doku","Doku & Reportage","doku-reportage-204","#3d7fd1","#1f4f99"],["politik","Politik & Hintergrund","politik-hintergrund-100","#6b7a99","#38435c"],["hoerspiel","Hörspiel","hoerspiel-112","#8a5cf0","#5130b0"],["hoerbuch","Hörbuch","hoerbuch-108","#c98a3a","#8f5a17"],["wissen","Wissen","wissen-146","#2fb3a6","#137a70"],["geschichte","Geschichte","geschichte-138","#9b7a52","#5e4528"],["gesund","Gesund leben","gesund-leben-104","#5bbf6a","#2f8a3e"],["liebe","Leben & Liebe","liebe-sex-psychologie-100","#ff7aa8","#c2306a"],["gesellschaft","Gesellschaft","gesellschaft-100","#e0773a","#a8461a"],["kultur","Kultur","kultur-156","#d0508f","#94265f"],["musik","Musik entdecken","musik-166","#ff5e7a","#c21f45"],["kinder","Für Kinder","fuer-kinder-100","#f2b632","#c07f06"],["ukraine","Kriege & Konflikte","ukraine-300","#3a7bd5","#e0b400"]];
  const ic='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="1.8"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.8"/></svg>';
  box.innerHTML=R.map(([k,t,slug,c1,c2])=>'<button type="button" class="rapp" data-k="'+k+'" data-href="https://www.ardsounds.de/rubrik/'+slug+'/"><span class="r-ic" style="background:linear-gradient(160deg,'+c1+','+c2+')">'+ic+'</span><span class="r-tx"><b>'+esc(t)+'</b><small>ARD Sounds</small></span><span class="r-tr">↗</span></button>').join("");
  (load("radio_ard")||[]).forEach(k=>{const b=box.querySelector('[data-k="'+k+'"]');if(b)box.appendChild(b);});
  const names=()=>{$("r-ard-n").textContent=[...box.querySelectorAll(".rapp b")].slice(0,3).map(b=>b.textContent).join(", ")+" …";};names();
  box.insertAdjacentHTML("afterbegin",'<div class="r-head ard-head"><div><h2>Rubriken</h2><p>ARD Sounds · gedrückt halten und ziehen = sortieren</p></div><button type="button" class="td-x x-round" data-ard-close aria-label="Rubriken schließen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>');
  const set=o=>{box.hidden=!o;tg.setAttribute("aria-expanded",o?"true":"false");};set(false);
  tg.addEventListener("click",e=>{e.stopPropagation();set(true);});
  $("radio").appendChild(box); // außerhalb der Radio-Liste, damit das Fenster wirklich den ganzen Bildschirm füllt
  box.addEventListener("click",e=>{if(e.target.closest("[data-ard-close]")){e.stopPropagation();set(false);return;}if(e.target.closest(".rapp"))setTimeout(()=>set(false),250);});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!box.hidden){e.stopImmediatePropagation();set(false);}},true);
  setTimeout(()=>{try{reorder(box,".rapp",()=>true,()=>{store("radio_ard",[...box.querySelectorAll(".rapp")].map(b=>b.dataset.k));names();});}catch(e){}},0);}}
/* Google Maps ohne Safari-Rückfrage: App-Links (comgooglemaps://) in normale Google-Maps-Adressen umschreiben */
function gmWeb(u){try{const q=new URLSearchParams(u.split("?")[1]||"");let d=q.get("daddr")||"",w="";const i=Math.max(d.lastIndexOf("+to:"),d.lastIndexOf(" to:"));if(i>=0){w=d.slice(0,i);d=d.slice(i+4);}
  const m={driving:"driving",transit:"transit",walking:"walking",bicycling:"bicycling"}[q.get("directionsmode")]||"driving";
  return "https://www.google.com/maps/dir/?api=1&travelmode="+m+(q.get("saddr")?"&origin="+encodeURIComponent(q.get("saddr")):"")+"&destination="+encodeURIComponent(d)+(w?"&waypoints="+encodeURIComponent(w):"");}catch(e){return u;}}
function gmFix(root){if(!load("gm_web"))return;(root||document).querySelectorAll('a[href^="comgooglemaps://"]').forEach(a=>{a.href=gmWeb(a.getAttribute("href"));a.target="_blank";a.rel="noopener";});}
new MutationObserver(()=>gmFix()).observe(document.body,{subtree:true,childList:true});gmFix();
{const c=$("gm-web");if(c){c.checked=!!load("gm_web");c.addEventListener("change",()=>{store("gm_web",c.checked);if(c.checked)gmFix();else location.reload();});}}
/* ================= Neue Quellen v299 ================= */
/* Mondphase – ohne Schnittstelle berechnet */
function moonInfo(d){const syn=29.530588853,ref=Date.UTC(2000,0,6,18,14);let a=((d-ref)/864e5)%syn;if(a<0)a+=syn;
  const L=[[1,"🌑","Neumond"],[6.4,"🌒","zunehmende Sichel"],[8.4,"🌓","erstes Viertel"],[13.8,"🌔","zunehmender Mond"],[15.8,"🌕","Vollmond"],[21.1,"🌖","abnehmender Mond"],[23.1,"🌗","letztes Viertel"],[28.5,"🌘","abnehmende Sichel"],[99,"🌑","Neumond"]];
  const x=L.find(l=>a<l[0]);let f=14.765-a;if(f<0)f+=syn;const fd=Math.round(f);
  return {e:x[1],n:x[2],full:fd===0?"Mond · heute Vollmond":"Mond · Vollmond in "+fd+(fd===1?" Tag":" Tagen")};}

/* Regenradar (DWD, Messung bis −1 h und Vorhersage bis +2 h) */
let RADAR=null,RADAR_I=0,RADAR_PLAY=0,RADAR_KEY="";
function radarBase(){const s=3e5;return Math.floor((Date.now()-9e5)/s)*s;}
function radarSet(i){RADAR_I=i;if(!RADAR)return;const t=new Date(radarBase()+i*3e5);RADAR._wms.setParams({time:t.toISOString()});
  const hm=t.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});const r=$("radar-t");if(r&&+r.value!==i)r.value=i;
  $("radar-lbl").innerHTML=i===0?"<b>"+hm+"</b> · letztes Bild":(i<0?hm+" · vor "+(-i*5)+" Min":"<b>"+hm+"</b> · Vorhersage +"+(i*5)+" Min");}
function radarInit(){const el=$("radar-map");if(!el||!el.offsetParent||typeof L==="undefined")return;
  if(!RADAR){RADAR=L.map(el,{zoomControl:false,attributionControl:true,scrollWheelZoom:false});baseTiles(false).forEach(l=>l.addTo(RADAR));
    RADAR._wms=L.tileLayer.wms("https://maps.dwd.de/geoserver/dwd/wms",{layers:"Niederschlagsradar",format:"image/png",transparent:true,version:"1.3.0",opacity:.85,zIndex:6,tileSize:512,zoomOffset:-1,className:"radar-wms",updateWhenIdle:true,attribution:"Radar: Deutscher Wetterdienst"}).addTo(RADAR);
    let ok=0,bad=0;RADAR._wms.on("tileload",()=>{ok++;if(ok===1)setStatus("radar",true);}).on("tileerror",()=>{bad++;if(!ok&&bad>3)setStatus("radar",false,"Radarbilder nicht abrufbar");});
    RADAR._pin=L.circleMarker([C.lat,C.lon],{radius:6,color:"#fff",weight:2,fillColor:"#e53935",fillOpacity:1}).addTo(RADAR);
    $("radar-t").addEventListener("input",e=>{radarStop();radarSet(+e.target.value);});
    $("radar-play").addEventListener("click",()=>{if(RADAR_PLAY){radarStop();return;}let i=-12;$("radar-play").textContent="❚❚";RADAR_PLAY=setInterval(()=>{radarSet(i);i=i>=24?-12:i+1;},650);});
    $("radar-now").addEventListener("click",()=>{radarStop();radarSet(0);});
    setInterval(()=>{if(!RADAR_PLAY&&!document.hidden)radarSet(RADAR_I);},5*6e4);}
  if(RADAR_KEY!==C.key){RADAR_KEY=C.key;RADAR.setView([C.lat,C.lon],9);RADAR._pin.setLatLng([C.lat,C.lon]);}
  setTimeout(()=>RADAR.invalidateSize(),60);radarSet(RADAR_I);}
function radarStop(){clearInterval(RADAR_PLAY);RADAR_PLAY=0;const b=$("radar-play");if(b)b.textContent="▶";}

/* Rhein-Vorhersage (Wasserstandsvorhersage WV der BfG über PEGELONLINE) */
async function loadRheinWV(uuid,now){const box=$("pegel-wv");if(!box)return;
  try{const d=await getJSON("https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/"+uuid+"/WV/measurements.json");
    const f=(d||[]).filter(x=>x&&isFinite(x.value)&&new Date(x.timestamp)>Date.now());
    if(!f.length){box.innerHTML='<div class="muted small" style="margin-top:8px">Für diesen Pegel gibt es keine Wasserstandsvorhersage.</div>';setStatus("pegelwv",true,"keine Vorhersage hier");return;}
    const step=Math.max(1,Math.round(f.length/6));const pts=f.filter((x,i)=>i%step===0).slice(0,6);if(pts[pts.length-1]!==f[f.length-1])pts.push(f[f.length-1]);
    const last=f[f.length-1],diff=last.value-now,arrow=diff>5?"↑ steigt":diff<-5?"↓ fällt":"→ gleichbleibend";
    box.innerHTML='<div class="sublbl" style="margin-top:0">Tendenz <span class="muted">· '+arrow+' ('+(diff>0?"+":"")+fmt(diff)+' cm bis '+new Date(last.timestamp).toLocaleString("de-DE",{weekday:"short",hour:"2-digit",minute:"2-digit"})+')</span></div><div class="list">'+
      pts.map(x=>{const dd=x.value-now;return '<div class="li"><span class="tag">'+new Date(x.timestamp).toLocaleString("de-DE",{weekday:"short",hour:"2-digit",minute:"2-digit"})+'</span><div class="t"><b>'+fmt(x.value/100,2)+' m</b>'+(x.type==="estimate"?' <span class="muted small">Abschätzung</span>':'')+'</div><div class="r muted small">'+(dd>0?"+":"")+fmt(dd)+' cm</div></div>';}).join("")+'</div>'+
      '<div class="muted small">Vorhersagen sind Schätzungen.</div>';
    setStatus("pegelwv",true);
  }catch(e){box.innerHTML='';setStatus("pegelwv",false,errText(e));}}

/* Schiffe: eingebettete AIS-Karte (VesselFinder), erst beim Öffnen laden */
let SHIPS_KEY="";
let SHIPS_GPS=null;
function shipsInit(pos){const box=$("ships-box");if(!box||!box.offsetParent)return;if(pos)SHIPS_GPS=pos;else pos=SHIPS_GPS;const key=pos?"gps:"+pos.lat.toFixed(3)+","+pos.lon.toFixed(3):C.key;if(SHIPS_KEY===key)return;SHIPS_KEY=key;
  const lat=pos?pos.lat:C.isDus?51.2277:C.lat,lon=pos?pos.lon:C.isDus?6.7735:C.lon;
  const cb=document.querySelector('#ships-pos [data-shp="city"]');if(cb){cb.hidden=!pos;cb.textContent="↩ "+(C.town||C.name||"Stadt");}
  const gb=document.querySelector('#ships-pos [data-shp="gps"]');if(gb)gb.classList.toggle("on",!!pos);
  const doc='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:#dfe7ec}</style></head><body><script>var width="100%";var height="400";var latitude="'+lat+'";var longitude="'+lon+'";var zoom="13";var names=false;</'+'script><script src="https://www.vesselfinder.com/aismap.js"></'+'script></body></html>';
  box.innerHTML='<iframe title="Schiffe live" style="width:100%;height:410px;border:0;border-radius:14px;display:block" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" loading="lazy"></iframe>';
  const fr=box.firstChild;fr.srcdoc=doc;fr.addEventListener("load",()=>setStatus("ships",true));}

/* Schiffskarte: auf aktuellen Standort springen */
document.addEventListener("click",e=>{const b=e.target.closest("#ships-pos [data-shp]");if(!b)return;
  if(b.dataset.shp==="city"){SHIPS_GPS=null;SHIPS_KEY=null;shipsInit();return;}
  if(!navigator.geolocation){alert("Standort wird von diesem Gerät nicht unterstützt.");return;}
  const g=b.innerHTML;b.disabled=true;b.lastChild.textContent="Standort wird ermittelt …";
  navigator.geolocation.getCurrentPosition(p=>{b.disabled=false;b.innerHTML=g;shipsInit({lat:p.coords.latitude,lon:p.coords.longitude});},
    err=>{b.disabled=false;b.innerHTML=g;const s=$("ships-box");if(s)s.insertAdjacentHTML("afterbegin",'<p class="muted small" style="margin:0 0 8px">Standort nicht verfügbar'+(err.code===1?' – bitte in Safari den Standortzugriff für diese Seite erlauben.':'.')+'</p>');},
    {enableHighAccuracy:true,timeout:12000,maximumAge:60000});});

/* Flugzeuge über Düsseldorf – erst direkt, sonst Stand des Datensammlers */
async function loadFlights(){const box=$("flights");if(!box)return;const lat=51.2895,lon=6.7668;let ac=null,src="live";
  try{let d;try{d=await getJSON("https://opendata.adsb.fi/api/v2/lat/"+lat+"/lon/"+lon+"/dist/16");}catch(e1){d=await getJSON("https://api.airplanes.live/v2/point/"+lat+"/"+lon+"/16");}ac=(d.ac||d.aircraft||[]).map(a=>({cs:(a.flight||"").trim(),reg:a.r||"",type:a.t||"",alt:a.alt_baro,gs:a.gs,lat:a.lat,lon:a.lon,trk:a.track}));}
  catch(e){try{const d=await getData("flights.json");ac=(d.data&&d.data.ac)||[];src="Stand "+dataAge(d);}catch(e2){setStatus("flights",false,errText(e2));box.innerHTML=stateBox("Flugdaten nicht verfügbar.",link("https://globe.adsb.fi/?lat=51.29&lon=6.77&zoom=10","Live-Karte"));return;}}
  ac=ac.filter(a=>isFinite(a.lat)).map(a=>({...a,km:distKm(lat,lon,a.lat,a.lon)})).sort((a,b)=>a.km-b.km);
  const alt=a=>a.alt==="ground"?"am Boden":isFinite(a.alt)?fmt(a.alt*0.3048/1000,1)+" km":"–";
  box.innerHTML='<div class="facts">'+fact(String(ac.length),"Flugzeuge im Umkreis 30 km")+fact(String(ac.filter(a=>a.alt==="ground").length),"am Boden (Flughafen)")+'</div>'+
    (ac.length?'<div class="list">'+ac.slice(0,12).map(a=>'<div class="li"><span class="tag">'+esc(a.cs||a.reg||"?")+'</span><div class="t">'+esc(a.type||"")+(a.reg&&a.cs?' <span class="muted small">'+esc(a.reg)+'</span>':'')+'</div><div class="r muted small">'+alt(a)+(isFinite(a.gs)&&a.alt!=="ground"?" · "+fmt(a.gs*1.852)+" km/h":"")+'</div></div>').join("")+'</div>':'')+
    '<div class="muted small">'+(src==="live"?"Live":"Datensammler, "+src)+' · adsb.fi Open Data · '+link("https://globe.adsb.fi/?lat=51.29&lon=6.77&zoom=10","Live-Karte")+'</div>';
  setStatus("flights",true,src==="live"?"":src);flightsMap(ac,lat,lon);}

let FMAP=null,FLAY=null;
function flightsMap(ac,lat,lon){const el=$("flights-map");if(!el||typeof L==="undefined")return;
  if(!FMAP){FMAP=L.map(el,{zoomControl:false,attributionControl:true,scrollWheelZoom:false}).setView([lat,lon],10);baseTiles(false).forEach(l=>l.addTo(FMAP));FLAY=L.layerGroup().addTo(FMAP);
    L.circleMarker([51.2895,6.7668],{radius:5,color:"#fff",weight:2,fillColor:"#e53935",fillOpacity:1}).bindTooltip("Flughafen DUS").addTo(FMAP);}
  FLAY.clearLayers();ac.forEach(a=>{const r=isFinite(a.trk)?a.trk-45:-45;
    L.marker([a.lat,a.lon],{icon:L.divIcon({className:"",html:'<div class="plane-ic" style="transform:rotate('+r+'deg)">✈︎</div>',iconSize:[20,20],iconAnchor:[10,10]})})
     .bindTooltip(esc((a.cs||a.reg||"?")+(a.type?" · "+a.type:"")+(a.alt==="ground"?" · am Boden":isFinite(a.alt)?" · "+fmt(a.alt*0.3048)+" m":"")),{direction:"top"}).addTo(FLAY);});
  setTimeout(()=>FMAP.invalidateSize(),80);}
/* Großveranstaltungen über Ticketmaster (eigener kostenloser Schlüssel) */
let TMKEY=load("tm")||"";
let TMSCOPE=load("tmscope")||"dus";if(TMSCOPE==="sport")TMSCOPE="dus";
document.addEventListener("click",e=>{const b=e.target.closest("[data-tmmore]");if(!b)return;const r=b.nextElementSibling;if(r)r.hidden=false;b.remove();});
function sportVis(on){document.querySelectorAll("[data-sport]").forEach(el=>{if(!on){el.hidden=true;return;}if(el.matches(".tabseg")){el.hidden=false;return;}const t=el.dataset.tp,seg=document.querySelector('.tabseg[data-tabs="fb"] .on');el.hidden=!(seg&&t==="fb:"+seg.dataset.t);});}
document.addEventListener("click",e=>{const b=e.target.closest("[data-tmscope]");if(!b)return;TMSCOPE=b.dataset.tmscope;store("tmscope",TMSCOPE);loadTM();});
async function loadTM(){const box=$("tm-list");if(!box)return;const SPORT=false,DUSONLY=TMSCOPE==="dus";
  document.querySelectorAll("#tm-seg [data-tmscope]").forEach(b=>b.classList.toggle("on",b.dataset.tmscope===TMSCOPE));{const sr=$("tm-src");if(sr)sr.textContent=SPORT?"Heimspiele & nächste Spiele":DUSONLY?"Ticketmaster & Spielpläne · nach Tagen":"Ticketmaster · nach Tagen";}
  /* Programm der Düsseldorfer Spielstätten (Oper, Schauspielhaus, Arena, PSD Bank Dome, Mitsubishi Electric Halle, Castello, Capitol, zakk …) aus dem Sammler */
  let house=[];if(DUSONLY){try{house=(await getData("events-dus.json")).data||[];}catch(e){}}
  if(!TMKEY&&!(DUSONLY&&house.length)){box.innerHTML='<div class="muted small">Für Konzerte, Sport und Shows in der Nähe einmal einen kostenlosen Ticketmaster-Schlüssel unter <a href="#einstellungen">Einstellungen</a> eintragen.</div>';setStatus("tm",false,"Schlüssel fehlt");return;}
  try{const R0=DUSONLY?{lat:51.2254,lon:6.7763}:{lat:C.lat,lon:C.lon}; /* Bezugspunkt: gewählter Ort bzw. Düsseldorf */const iso=d=>d.toISOString().slice(0,19)+"Z";const now=new Date(),end=new Date(Date.now()+60*864e5);
    const U="https://app.ticketmaster.com/discovery/v2/events.json?apikey="+encodeURIComponent(TMKEY)+"&latlong="+R0.lat+","+R0.lon+"&radius="+(DUSONLY?15:70)+"&unit=km&locale=*&size=200&sort=date,asc&startDateTime="+iso(now)+"&endDateTime="+iso(end);
    let d={};if(TMKEY&&!SPORT){try{d=await getJSON(U+"&page=0");}catch(e){if(!house.length)throw e;}}let ev=((d._embedded||{}).events||[]);
    if(((d.page||{}).totalPages||1)>1){try{const d2=await getJSON(U+"&page=1");ev=ev.concat(((d2._embedded||{}).events||[]));}catch(e){}}const seen=new Set();const rows=[];
    const today0=isoDay(new Date());
    ev.forEach(e=>{const s=(e.dates||{}).start||{};
      /* Mehrfach-/Jahreskarten, Gutscheine, Parktickets und Termine, die schon begonnen haben, weglassen */
      if(!s.localDate||s.localDate<today0)return;if(/jahreskarte|mehrfach|saisonkarte|dauerkarte|gutschein|geschenk|voucher|parkticket|parken|season ticket/i.test(e.name||""))return;
      const k=e.name+"|"+s.localDate;if(seen.has(k))return;seen.add(k);
      const v=(((e._embedded||{}).venues||[])[0])||{};const city=(((v.city||{}).name||"").replace(/^D(ue|ü|u)sseldorf.*/i,"Düsseldorf").replace(/^Cologne$/i,"Köln").replace(/^Munich$/i,"München").replace(/^Muenster$/i,"Münster").replace(/^Moenchengladbach$/i,"Mönchengladbach"));
      const lat=+((v.location||{}).latitude),lon=+((v.location||{}).longitude);const km=isFinite(lat)&&isFinite(lon)?distKm(R0.lat,R0.lon,lat,lon):(isFinite(+e.distance)?+e.distance:99);
      rows.push({e,s,v,city,km,key:(s.localDate||"9")+(s.localTime||"99")});});
    {const TEAMRX=/fortuna d(ü|ue)sseldorf|d(ü|ue)sseldorfer eg|\bDEG\b|borussia dortmund|\bBVB\b/i;for(let i=rows.length-1;i>=0;i--)if(TEAMRX.test(rows[i].e.name||""))rows.splice(i,1);}
    if(DUSONLY){const nk=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g,"").slice(0,18);
      const have=new Set();for(let i=rows.length-1;i>=0;i--){if(rows[i].city!=="Düsseldorf"){rows.splice(i,1);continue;}have.add(nk(rows[i].e.name)+"|"+rows[i].s.localDate);}
      if(SPORT)rows.length=0;
      house.forEach(h=>{const ld=String(h.start).slice(0,10);if(ld<today0||(!SPORT&&ld>isoDay(end)))return;if(h.team)return;const k=nk(h.name)+"|"+ld;if(have.has(k))return;have.add(k);
        rows.push({sp:h.team?h:null,e:{name:h.name,url:h.url,classifications:[{segment:{name:h.kind||""}}]},s:{localDate:ld,localTime:h.allDay||String(h.start).length<16?"":String(h.start).slice(11,16)},v:{name:h.venue},city:"Düsseldorf",km:0,key:ld+(String(h.start).slice(11,16)||"99")});});}
    rows.sort((a,b)=>(a.s.localDate||"9").localeCompare(b.s.localDate||"9")||(DUSONLY?(a.s.localTime||"99").localeCompare(b.s.localTime||"99"):a.km-b.km)||a.key.localeCompare(b.key));
    if(!rows.length){box.innerHTML='<div class="muted small">Keine Veranstaltungen '+(DUSONLY?'in Düsseldorf':'im Umkreis von 70 km')+' in den nächsten 60 Tagen.</div>';setStatus("tm",true);return;}
    const today=isoDay(),tmr=isoDay(new Date(Date.now()+864e5));
    const dayH=d=>d===today?"Heute":d===tmr?"Morgen":new Date(d+"T12:00:00").toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"});
    const seg=e=>{const c=((e.classifications||[])[0]||{}).segment;return c&&c.name&&c.name!=="Undefined"?({Music:"Musik",Sports:"Sport","Arts & Theatre":"Kultur",Film:"Film",Miscellaneous:"Sonstiges"}[c.name]||c.name):"";};
    let shown=40;
    if(SPORT){/* zwei getrennte Blöcke: erst Fortuna, dann DEG – je mit Logo-Kopf und Liste der Heimspiele */
      const img=u=>u?'<img src="'+esc(safeUrl(u))+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'';
      const wd=d=>new Date(d+"T12:00:00").toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"});
      const block=(k,title,sub)=>{const L=rows.filter(r=>r.sp&&r.sp.team===k);if(!L.length)return'';const ic=L[0].sp.icon;
        return '<div class="tm-club"><div class="tm-club-h">'+img(ic)+'<div><b>'+esc(title)+'</b><span class="muted small">'+esc(sub)+' · '+L.length+' Heimspiele</span></div></div><div class="list">'+
          L.map((r,i)=>(i===6?'</div><button type="button" class="btn" data-tmmore style="width:100%;margin:8px 0">Alle '+L.length+' Heimspiele anzeigen</button><div class="list" hidden>':'')+'<a class="li tm-li tm-sport" href="'+esc(safeUrl(r.e.url))+'" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><span class="tag">'+esc(wd(r.s.localDate))+'</span><div class="t"><b>'+esc(r.e.name.replace(/^(DEG|Fortuna Düsseldorf) – /,"vs. "))+'</b><span class="muted small">'+esc(r.s.localTime?r.s.localTime+" Uhr":"Zeit folgt")+(r.sp.league?' · '+esc(r.sp.league):'')+'</span></div><div class="r">'+img(r.sp.icon2)+'</div></a>').join("")+'</div></div>';};
      const h=block("deg","Düsseldorfer EG","PSD Bank Dome · DEL2");
      box.innerHTML=(h||'<div class="muted small">Keine Heimspiele gefunden.</div>')+'<div class="muted small" style="margin-top:10px">DEG-Heimspiele aus dem DEL2-Spielplan · Fortuna und BVB unten.</div>';
      setStatus("tm",true,"Fortuna & DEG");return;}
    const render=()=>{let last="",html="";rows.slice(0,shown).forEach(r=>{const {e,s,v,city,km}=r;
        if(s.localDate!==last){if(last)html+='</div>';last=s.localDate;html+='<div class="sublbl" style="margin-top:12px">'+esc(dayH(s.localDate))+'</div><div class="list">';}
        const sp=r.sp,img=u=>u?'<img src="'+esc(safeUrl(u))+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'';
        html+='<a class="li tm-li'+(sp&&SPORT?' tm-sport':'')+'" href="'+esc(safeUrl(e.url))+'" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><span class="tag">'+esc(s.localTime?s.localTime.slice(0,5):"—")+'</span><div class="t">'+
          (sp&&SPORT?'<span class="tm-venue">🏟️ '+esc(v.name||"")+(sp.league?' · '+esc(sp.league):'')+'</span><div class="tm-logos">'+img(sp.icon)+'<i>:</i>'+img(sp.icon2)+'</div><b>'+esc(e.name)+'</b>'
          :'<span class="tm-city">'+esc(city||"–")+(km>=1.5?' <span class="muted">· '+fmt(km)+' km</span>':'')+'</span><span class="tm-venue">'+esc(v.name||"")+'</span><b>'+(sp&&sp.icon?'<img class="tm-ic" src="'+esc(safeUrl(sp.icon))+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'')+esc(e.name)+'</b>')+
          '</div><div class="r muted small">'+esc(seg(e))+'</div></a>';});
      if(last)html+='</div>';
      if(rows.length>shown)html+='<button type="button" class="btn" id="tm-more" style="width:100%;margin-top:12px">Weitere Termine anzeigen ('+(rows.length-shown)+')</button>';
      box.innerHTML=html+'<div class="muted small" style="margin-top:10px">'+(SPORT?'Heimspiele Fortuna Düsseldorf (OpenLigaDB) und DEG (DEL2-Spielplan) · nach Datum':DUSONLY?'Nur Düsseldorf · Quellen: Ticketmaster und Programme von Oper, Schauspielhaus, Merkur Spiel-Arena, PSD Bank Dome, Mitsubishi Electric Halle, Castello, Capitol, Stahlwerk, zakk, Fortuna, DEG · nach Tag und Uhrzeit':'Quelle: Ticketmaster · nächste 60 Tage, Umkreis 70 km um den gewählten Ort · nach Datum, am selben Tag nach Entfernung')+'.</div>';
      const m=$("tm-more");if(m)m.addEventListener("click",()=>{shown+=40;render();});};
    render();
    setStatus("tm",true);
  }catch(e){setStatus("tm",false,errText(e));box.innerHTML=stateBox("Veranstaltungen nicht verfügbar – "+errText(e)+(/40[13]/.test(String(e))?" (Schlüssel prüfen)":"")+".");}}
{const i=$("tm"),b=$("tm-save");if(i&&b){i.value=TMKEY;b.addEventListener("click",()=>{TMKEY=i.value.trim();store("tm",TMKEY);loadTM();b.textContent="Gespeichert ✓";setTimeout(()=>b.textContent="Speichern",1500);});}}

/* Karten und Listen erst laden, wenn die Ansicht sichtbar ist */
function lazyViews(){setTimeout(()=>{try{radarInit();shipsInit();const f=$("flights");if(f&&f.offsetParent&&(!window.FL_AT||Date.now()-window.FL_AT>6e4)){window.FL_AT=Date.now();loadFlights();}}catch(e){}},250);}
window.addEventListener("hashchange",lazyViews);document.addEventListener("click",lazyViews);lazyViews();
/* Wetter: unter „Wetter jetzt“ nur ein Bereich sichtbar, Auswahl über Reiter (wird gemerkt) */
function wxTab(k){document.querySelectorAll("#wx-seg [data-wx]").forEach(b=>b.classList.toggle("on",b.dataset.wx===k));document.querySelectorAll("[data-wxp]").forEach(p=>p.hidden=p.dataset.wxp!==k);store("wx_tab",k);if(k==="radar")setTimeout(()=>{try{radarInit();}catch(e){}},50);}
document.addEventListener("click",e=>{const b=e.target.closest("#wx-seg [data-wx]");if(b)wxTab(b.dataset.wx);});
{const k=load("wx_tab");if(k&&document.querySelector('#wx-seg [data-wx="'+k+'"]'))wxTab(k);}
/* Allgemeine Reiter: <div class="tabseg" data-tabs="x"> + Bereiche mit data-tp="x:wert" (Auswahl wird gemerkt) */
function tabSet(g,v){const seg=document.querySelector('.tabseg[data-tabs="'+g+'"]');if(!seg||!seg.querySelector('[data-t="'+v+'"]'))return;
  seg.querySelectorAll("[data-t]").forEach(b=>b.classList.toggle("on",b.dataset.t===v));document.querySelectorAll('[data-tp^="'+g+':"]').forEach(p=>p.hidden=p.dataset.tp!==g+":"+v||(p.hasAttribute("data-sport")&&seg.hidden));store("tab_"+g,v);}
document.addEventListener("click",e=>{const b=e.target.closest(".tabseg [data-t]");if(b)tabSet(b.closest(".tabseg").dataset.tabs,b.dataset.t);});
document.querySelectorAll(".tabseg[data-tabs]").forEach(s=>{const v=load("tab_"+s.dataset.tabs);if(v)tabSet(s.dataset.tabs,v);});
/* Fußball: nächste Spiele von Fortuna Düsseldorf und Borussia Dortmund (OpenLigaDB, frei, ohne Schlüssel) */
/* Zusatzspiele, die OpenLigaDB nicht führt (z. B. Niederrheinpokal). Format: Datum/Uhrzeit (Ortszeit), Heim, Gast, Wettbewerb, Stadion, Stadt.
   Neue Spiele einfach hier ergänzen; vergangene Spiele werden automatisch ausgeblendet. */
const EXTRA_GAMES=[
  {at:"2026-11-18T20:00",home:"Fortuna Düsseldorf",away:"MSV Duisburg",lg:"Niederrheinpokal",group:"Viertelfinale",stadium:"Merkur Spiel-Arena",city:"Düsseldorf"}
];
const extraMatches=()=>EXTRA_GAMES.map(g=>({matchDateTime:g.at,matchIsFinished:false,team1:{teamName:g.home},team2:{teamName:g.away},_lg:g.lg,group:g.group?{groupName:g.group}:null,location:{locationStadium:g.stadium||"",locationCity:g.city||""},_extra:true}));
const FB=[{k:"f95",name:"Fortuna Düsseldorf",rx:/Fortuna D(ü|ue|u)sseldorf/i,short:"F95",c1:"#e30613",c2:"#ffffff",fg:"#fff"},{k:"bvb",name:"Borussia Dortmund",rx:/^(Borussia Dortmund|BVB|Dortmund)$|Borussia Dortmund(?!\s*II)/i,short:"BVB",c1:"#fde100",c2:"#000000",fg:"#000"}];
/* Kalender-Termin (iCal) in ein Spiel umwandeln: „Heim - Gast | Wettbewerb | Spieltag“ */
function calMatch(e){const parts=(e.summary||"").split(/\s*\|\s*/);const teams=parts[0].replace(/\s*\(([^)]*)\)\s*$/,"").split(/\s+(?:-|–|:|vs\.?)\s+/);
  let comp=parts[1]||(/(Champions League|DFB-Pokal|Bundesliga|Supercup|Testspiel|Europa League|Conference League)/i.exec((e.cat||"")+" "+(e.summary||"")+" "+(e.desc||""))||[])[1]||"";
  if(!comp&&e.src===1)comp="Champions League";
  return {matchDateTime:e.start,matchIsFinished:false,team1:{teamName:(teams[0]||"").trim()},team2:{teamName:(teams[1]||"").trim()},_lg:comp||"Spiel",group:parts[2]?{groupName:parts[2]}:null,location:{locationStadium:(e.location||"").replace(/,\s*Deutschland$/,"")}};}
async function loadFussball(){const y=new Date().getFullYear(),season=new Date().getMonth()>=6?y:y-1;
  const leagues=[["bl1","Bundesliga"],["bl2","2. Bundesliga"],["bl3","3. Liga"],["dfb","DFB-Pokal"]];let all=[];
  try{const av=await getJSON("https://api.openligadb.de/getavailableleagues");(av||[]).filter(l=>String(l.leagueSeason)===String(season)&&/champions\s*league|uefa\s*cl|dfb[\s-]*pokal|^3\.\s*(fu(ß|ss)ball-)?liga/i.test(l.leagueName||"")&&!/frauen|women|youth|u19|jugend/i.test(l.leagueName||"")).forEach(l=>{if(!leagues.some(x=>x[0]===l.leagueShortcut))leagues.push([l.leagueShortcut,/champions/i.test(l.leagueName)?"Champions League":/^3\./.test(l.leagueName)?"3. Liga":"DFB-Pokal"]);});}catch(e){}
  await Promise.all(leagues.map(async([l,n])=>{try{const d=await getJSON("https://api.openligadb.de/getmatchdata/"+l+"/"+season);(d||[]).forEach(m=>{m._lg=n;all.push(m);});}catch(e){}}));
  const now=Date.now()-2.5*36e5;const kv=[];
  let bvbCal=[];try{const d=await getData("bvbcal.json");bvbCal=((d.data||{}).events||[]).map(calMatch);}catch(e){}
  if(!all.length&&!bvbCal.length){setStatus("fb",false,"keine Daten");FB.forEach(f=>{const b=$("fb-"+f.k);if(b)b.innerHTML=stateBox("Spielplan nicht verfügbar.",link("https://www.openligadb.de","OpenLigaDB"));});return;}
  const fbKey=s=>(s||"").toLowerCase().replace(/^bor\.\s*/,"borussia ").replace(/[^a-zäöüß0-9]/g,"");const ICONS={};
  all.forEach(m=>[m.team1,m.team2].forEach(x=>{if(x&&x.teamIconUrl)ICONS[fbKey(x.teamName)]=x.teamIconUrl;}));
  FB.forEach(f=>{const hit=all.find(m=>[m.team1,m.team2].some(x=>x&&x.teamIconUrl&&f.rx.test(x.teamName)));if(hit)f.icon=[hit.team1,hit.team2].find(x=>f.rx.test(x.teamName)).teamIconUrl;});
  const dayDiff=d=>{const a=new Date(d);a.setHours(0,0,0,0);const b=new Date();b.setHours(0,0,0,0);return Math.round((a-b)/864e5);};
  const inDays=n=>n<=0?"heute":n===1?"morgen":"in "+n+" Tagen";
  FB.forEach(f=>{const is=x=>x&&x.teamName&&f.rx.test(x.teamName)&&!/\bII\b|U\s?\d{2}/.test(x.teamName);
    let src=all;
    /* Zusatzspiele (Pokal u. a.) ergänzen – doppelte am selben Tag weglassen */
    {const own=all.filter(m=>is(m.team1)||is(m.team2));const ex=extraMatches().filter(m=>(is(m.team1)||is(m.team2))&&!own.some(o=>Math.abs(new Date(o.matchDateTime)-new Date(m.matchDateTime))<36e6));if(ex.length)src=src.concat(ex);}
    if(f.k==="bvb"&&bvbCal.length){const own=all.filter(m=>is(m.team1)||is(m.team2));
      /* Kalender-Spiele ergänzen, die OpenLigaDB nicht führt (z. B. Champions League) – Doppelte am selben Tag weglassen */
      const extra=bvbCal.filter(c=>!src.some(m=>(is(m.team1)||is(m.team2))&&Math.abs(new Date(m.matchDateTime)-new Date(c.matchDateTime))<36e6));src=src.concat(extra);}
    const ms=src.filter(m=>(is(m.team1)||is(m.team2))&&!m.matchIsFinished&&new Date(m.matchDateTime).getTime()>now).sort((a,b)=>new Date(a.matchDateTime)-new Date(b.matchDateTime));
    {const se=$("fb-"+f.k+"-src");const lg=[...new Set(ms.map(m=>m._lg).filter(Boolean))];if(se&&lg.length)se.textContent=lg.join(" · ");}
    const box=$("fb-"+f.k);if(!box)return;const card=box.closest(".card");if(card){card.classList.add("fb-card");card.style.setProperty("--club1",f.c1);card.style.setProperty("--club2",f.c2);card.style.setProperty("--clubfg",f.fg);}
    if(!ms.length){box.innerHTML='<div class="muted">Kein anstehendes Spiel gefunden – der Spielplan wird ergänzt, sobald OpenLigaDB ihn führt.</div>';return;}
    const dt=m=>new Date(m.matchDateTime);const dl=m=>dt(m).toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"});const tl=m=>dt(m).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
    const icon=x=>{if(x.teamIconUrl)return x.teamIconUrl;const k=fbKey(x.teamName);return ICONS[k]||(is(x)?f.icon:"");};
    const mono=x=>'<span class="fb-mono">'+esc((x.teamName||"?").replace(/^(FC|1\.\s*FC|SC|SV|VfL|VfB|TSG|Bor\.|Borussia|Bayer|Eintracht)\s+/i,"").split(/\s+/).map(w=>w[0]).join("").slice(0,3).toUpperCase())+'</span>';
    const team=(x,me)=>{const ic=icon(x);return '<div class="fb-team'+(me?" me":"")+'">'+(ic?'<img src="'+esc(safeUrl(ic))+'" alt="" loading="lazy" referrerpolicy="no-referrer">':mono(x))+'<b>'+esc(x.teamName)+'</b></div>'};
    const m=ms[0],home=is(m.team1),loc=m.location||{},dd=dayDiff(m.matchDateTime);
    const nh=ms.find(x=>is(x.team1));const nhd=nh?dayDiff(nh.matchDateTime):null;
    kv.push(f.short+" "+dt(m).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}));
    SP[f.k]=ms.map(x=>({day:isoDay(dt(x)),time:tl(x),home:is(x.team1),opp:((is(x.team1)?x.team2:x.team1)||{}).teamName||"",lg:x._lg||""}));
    box.innerHTML='<div class="fb-banner '+(home?"h":"a")+'"><span>'+(home?"🏟️ Heimspiel":"🚌 Auswärtsspiel")+'</span><b>'+esc(inDays(dd))+'</b></div>'+
      '<div class="fb-when" data-day="'+isoDay(dt(m))+'" data-team="'+f.k+'">'+esc(dl(m))+' · '+esc(tl(m))+' Uhr</div>'+
      '<div class="fb-next">'+team(m.team1,home)+'<div class="fb-vs">:</div>'+team(m.team2,!home)+'</div>'+
      '<div class="fb-where">'+esc(m._lg)+(m.group&&m.group.groupName?" · "+esc(m.group.groupName):"")+(loc.locationStadium?"<br>"+esc(loc.locationStadium):"")+(loc.locationCity?", "+esc(loc.locationCity):"")+'</div>'+
      (nh&&nh!==m?'<div class="fb-count"><b>'+nhd+'</b><span>Tage bis zum nächsten Heimspiel<br><em>'+esc(dl(nh))+' · vs. '+esc((nh.team2||{}).teamName||"")+'</em></span></div>':(home?'':'<div class="fb-count"><b>–</b><span>Kein weiteres Heimspiel im Kalender</span></div>'))+
      (ms.length>1?'<div class="sublbl" style="margin-top:14px">Danach</div><div class="list">'+ms.slice(1,40).map((x,i)=>(i===6?'</div><button type="button" class="btn" data-tmmore style="width:100%;margin:8px 0">Alle '+(ms.length-1)+' weiteren Spiele anzeigen</button><div class="list" hidden>':'')+(()=>{const h=is(x.team1),o=h?x.team2:x.team1;return '<div class="li fb-li '+(h?"h":"a")+'" data-day="'+isoDay(dt(x))+'" data-team="'+f.k+'"><span class="tag">'+esc(dl(x))+'</span><div class="t"><span class="fb-ha">'+(h?"Heimspiel":"Auswärts")+'</span><b>'+(h?"vs. ":"bei ")+esc(o.teamName)+'</b><span class="muted small">'+esc(tl(x))+' Uhr · '+esc(x._lg)+'</span></div><div class="r fb-in">'+esc(inDays(dayDiff(x.matchDateTime)))+'</div></div>';})()).join("")+'</div>':'');});
  sportTile();setStatus("fb",true);markParallel();}
/* DEG: Heimspiele aus dem DEL2-Spielplan (Sammler) im gleichen Kartenstil wie Fortuna/BVB */
const SP={f95:[],deg:[],bvb:[]},SPN={f95:"Fortuna",deg:"DEG",bvb:"BVB"};
/* Kachel „Events Sport“: nächstes Spiel je Verein (Fortuna, DEG, BVB) mit Tag und Uhrzeit */
function sportTile(){const nx=[["f95","F95"],["deg","DEG"],["bvb","BVB"]].map(([k,t])=>{const g=(SP[k]||[])[0];return g?{t,g}:null;}).filter(Boolean).sort((a,b)=>(a.g.day+a.g.time).localeCompare(b.g.day+b.g.time));
  if(!nx.length){setKpi("k-fb","–","nächste Spiele","info");return;}
  const wd=d=>new Date(d+"T12:00:00").toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"}).replace(/\.,/,"").replace(/\.$/,"");const f=nx[0];
  setKpi("k-fb",esc(f.t)+'<small> '+esc(wd(f.g.day))+'</small>',nx.map(x=>x.t+" "+wd(x.g.day)+(x.g.time?" "+x.g.time:"")+(x.g.home?" (H)":"")).join(" · "),"info");}
async function loadDEG(){const box=$("fb-deg");if(!box)return;let L=[];
  try{L=((await getData("events-dus.json")).data||[]).filter(r=>r.team==="deg"&&new Date(r.start).getTime()>Date.now()-2.5*36e5).sort((a,b)=>a.start.localeCompare(b.start));}catch(e){}
  const card=box.closest(".card");if(card){card.classList.add("fb-card");card.style.setProperty("--club1","#d40019");card.style.setProperty("--club2","#ffd200");card.style.setProperty("--clubfg","#fff");}
  if(!L.length){box.innerHTML='<div class="muted">Kein anstehendes Heimspiel gefunden.</div>';return;}
  const day=r=>r.start.slice(0,10),tm=r=>/T\d\d:\d\d/.test(r.start)?r.start.slice(11,16):"",dl=r=>new Date(day(r)+"T12:00:00").toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"});
  const dd=r=>{const a=new Date(day(r)+"T00:00:00"),b=new Date();b.setHours(0,0,0,0);return Math.round((a-b)/864e5);},inD=n=>n<=0?"heute":n===1?"morgen":"in "+n+" Tagen";
  const opp=r=>r.name.replace(/^DEG – /,""),img=u=>u?'<img src="'+esc(safeUrl(u))+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="fb-mono">?</span>';
  SP.deg=L.map(r=>({day:day(r),time:tm(r),home:true,opp:opp(r)}));try{sportTile();}catch(e){}const m=L[0];
  box.innerHTML='<div class="fb-banner h"><span>🏟️ Heimspiel</span><b>'+esc(inD(dd(m)))+'</b></div>'+
    '<div class="fb-when" data-day="'+day(m)+'" data-team="deg">'+esc(dl(m))+(tm(m)?' · '+esc(tm(m))+' Uhr':'')+'</div>'+
    '<div class="fb-next"><div class="fb-team me">'+img(m.icon)+'<b>Düsseldorfer EG</b></div><div class="fb-vs">:</div><div class="fb-team">'+img(m.icon2)+'<b>'+esc(opp(m))+'</b></div></div>'+
    '<div class="fb-where">DEL2 · PSD Bank Dome, Düsseldorf</div>'+
    (L.length>1?'<div class="sublbl" style="margin-top:14px">Weitere Heimspiele</div><div class="list">'+L.slice(1).map((r,i)=>(i===6?'</div><button type="button" class="btn" data-tmmore style="width:100%;margin:8px 0">Alle '+(L.length-1)+' weiteren Heimspiele anzeigen</button><div class="list" hidden>':'')+'<a class="li fb-li h" href="'+esc(safeUrl(r.url))+'" target="_blank" rel="noopener" style="text-decoration:none;color:inherit" data-day="'+day(r)+'" data-team="deg"><span class="tag">'+esc(dl(r))+'</span><div class="t"><span class="fb-ha">Heimspiel</span><b>vs. '+esc(opp(r))+'</b><span class="muted small">'+esc(tm(r)?tm(r)+" Uhr":"Zeit folgt")+' · DEL2</span></div><div class="r fb-in">'+esc(inD(dd(r)))+'</div></a>').join("")+'</div>':'');
  markParallel();}

/* ===== Urlaub: eigene Reisen mit Countdown, Bahnfahrten, Wetter/Schnee (Tal & Berg), Webcams und Links – gespeichert auf dem Gerät ===== */
/* bahn.de-Suchlink, der direkt die Verbindungen zeigt: bahn.de braucht dafür die Bahnhofsnummern (EVA) */
const EVA_KNOWN={"Düsseldorf Hbf":"8000085","Recklinghausen Hbf":"8000307","Dortmund Hbf":"8000080","St. Johann im Pongau":"8100043","Salzburg Hbf":"8100002","Winsen (Luhe)":"8000420"};
function dbLink(from,to,date,time,kl,fe,te){const ie=n=>{try{return IRISEVA[n]||"";}catch(e){return "";}};const fev=fe||EVA_KNOWN[from]||ie(from),tev=te||EVA_KNOWN[to]||ie(to);
  const id=(n,e)=>encodeURIComponent("A=1@O="+n+"@"+(e?"L="+e+"@":""));const hd=(date||isoDay())+"T"+(time||"08:00")+":00";
  return "https://www.bahn.de/buchung/fahrplan/suche#sts=true&so="+encodeURIComponent(from)+"&zo="+encodeURIComponent(to)+"&kl="+(kl||2)+"&r=13:16:KLASSENLOS:1&soid="+id(from,fev)+"&zoid="+id(to,tev)+"&sot=ST&zot=ST"+(fev?"&soei="+fev:"")+(tev?"&zoei="+tev:"")+"&hd="+encodeURIComponent(hd)+"&hza=D&hz=%5B%5D&ar=false&s=true&d=false&vm=00,01,02,03,04,05,06,07,08,09&fm=false&bp=false";}
const UL_DEFAULT=[{id:"wagrain-2026",title:"Urlaub Wagrain",place:"Wagrain",lat:47.3356,lon:13.2989,from:"2026-12-19",to:"2026-12-26",
  hotel:{name:"Sporthotel Wagrain",url:"https://www.sporthotel.at/de",addr:"Wagrain, Salzburger Land"},
  hin:{from:"Düsseldorf Hbf",to:"St. Johann im Pongau",date:"2026-12-19",dep:"07:22",arr:"14:56",note:"Sparpreis Europa, 1. Kl. · Sitzplatz reserviert",booked:true},
  rueck:{from:"St. Johann im Pongau",to:"Recklinghausen Hbf",date:"2026-12-26",dep:"11:01",arr:"20:16",note:"Gemerkte Reise – noch nicht gebucht"},
  cams:[{t:"Wagrain – Live-Webcam",u:"https://webtv.feratel.com/webtv/?design=v5&cam=75290&c1=0&c2=0&c8=0&lg=de"}],
  links:[{t:"Sporthotel Wagrain",u:"https://www.sporthotel.at/de"},{t:"Snow Space Salzburg",u:"https://www.snow-space.com/"},{t:"Wagrain-Kleinarl Tourismus",u:"https://www.wagrain-kleinarl.at/"}],
  berg:{name:"Grafenberg",ele:1700,lat:47.3525,lon:13.3115}}];
let UL=(load("urlaube")||UL_DEFAULT).map(u=>{if(u.hin&&u.hin.booked===undefined&&/sparpreis|flexpreis|gebucht|reserviert/i.test(u.hin.note||"")&&!/nicht gebucht/i.test(u.hin.note||""))u.hin.booked=true;return u;}),ULSEL=load("urlaub_sel")||(UL[0]&&UL[0].id);
const ulCur=()=>UL.find(u=>u.id===ULSEL)||UL[0];
const ulDays=d=>{const a=new Date(d+"T00:00:00"),b=new Date();b.setHours(0,0,0,0);return Math.round((a-b)/864e5);};
const ulDate=d=>d?new Date(d+"T12:00:00").toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"}):"";
function ulKpi(){const u=ulCur();if(!u){setKpi("k-urlaub","–","kein Urlaub","info");return;}const n=ulDays(u.from),m=ulDays(u.to);
  setKpi("k-urlaub",n>0?"in "+n+" Tagen":m>=0?"im Urlaub":"vorbei",u.place||u.title,"info");}
async function loadUrlaub(){ulKpi();const u=ulCur();if(!$("ul-top"))return;
  $("ul-seg").innerHTML=UL.length>1?UL.map(x=>'<button type="button" data-ul="'+esc(x.id)+'" class="'+(x===u?"on":"")+'">'+esc(x.title)+'</button>').join(""):"";$("ul-seg").hidden=UL.length<2;
  if(!u){$("ul-top").innerHTML='<div class="muted">Noch kein Urlaub angelegt.</div>';return;}
  $("ul-title").textContent=u.title;$("ul-sub").textContent=ulDate(u.from)+" – "+ulDate(u.to);
  const n=ulDays(u.from),m=ulDays(u.to),len=ulDays(u.to)-ulDays(u.from);
  $("ul-top").innerHTML='<div class="ul-count"><b>'+(n>0?n:m>=0?"🏔️":"✓")+'</b><span>'+(n>1?"Tage bis zur Abreise":n===1?"Tag bis zur Abreise – morgen geht's los!":n===0?"Heute geht's los!":m>=0?"Du bist im Urlaub – noch "+m+(m===1?" Tag":" Tage"):"Urlaub vorbei")+'</span></div>'+
    '<div class="muted">'+esc(ulDate(u.from))+' bis '+esc(ulDate(u.to))+' · '+len+' Nächte · '+esc(u.place||"")+'</div>'+
    (u.hotel&&u.hotel.name?'<div style="margin-top:10px"><b>🏨 '+esc(u.hotel.name)+'</b>'+(u.hotel.addr?'<div class="muted small">'+esc(u.hotel.addr)+'</div>':'')+'<div class="ul-btns">'+(u.hotel.url?'<a class="btn" href="'+esc(safeUrl(u.hotel.url))+'" target="_blank" rel="noopener">Hotel-Website</a>':'')+'<a class="btn" href="https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent("Alt-Heerdt 87, Düsseldorf")+'&destination='+encodeURIComponent((u.hotel.name||"")+" "+(u.place||""))+'" target="_blank" rel="noopener">Route ab Düsseldorf</a></div></div>':'');
  const trip=(t,lbl,ic,key)=>{if(!t||!t.from)return"";const k=ulDays(t.date);
    return '<div class="ul-trip'+(t.booked?' ul-booked':'')+'"'+(t.booked?' data-ulrt="'+key+'"':'')+'><span class="ul-ic">'+ic+'</span><div>'+(t.booked?'<span class="ul-fav">★ Gebucht · Favorit</span><br>':'')+'<b>'+esc(lbl)+' · '+esc(ulDate(t.date))+'</b><div class="muted small">'+esc(t.from)+' → '+esc(t.to)+'</div></div><div class="ul-t">'+esc(t.dep||"")+' – '+esc(t.arr||"")+'</div>'+
      '<div style="grid-column:2/4">'+(t.note?'<span class="'+(/nicht gebucht|gemerkt/i.test(t.note)?"ul-tag":"muted small")+'">'+esc(t.note)+'</span> ':'')+(k>=0&&k<=1?'<span class="ul-tag">Prüfe Echtzeit vor Abfahrt</span>':'')+
      '<div class="sync-btns" style="margin-top:6px"><a class="btn" href="'+esc(dbLink(t.from,t.to,t.date,t.dep,/1\. ?Kl/i.test(t.note||"")?1:2))+'" target="_blank" rel="noopener">Verbindung bei bahn.de</a></div></div></div>';};
  $("ul-trips").innerHTML=(trip(u.hin,"Hinreise","🚆","hin")+trip(u.rueck,"Rückreise","🏠","rueck"))||'<div class="muted">Keine Bahnfahrten eingetragen.</div>';
  $("ul-cams").innerHTML=(u.cams||[]).length?(u.cams||[]).map((c,i)=>'<div class="ul-cam" style="margin-bottom:10px"><b>'+esc(c.t)+'</b>'+(i===0?'<iframe src="'+esc(safeUrl(c.u))+'" loading="lazy" allowfullscreen referrerpolicy="no-referrer"></iframe>':'')+'<div class="sync-btns" style="margin-top:6px"><a class="btn" href="'+esc(safeUrl(c.u))+'" target="_blank" rel="noopener">Webcam öffnen ↗</a></div></div>').join(""):'<div class="muted">Keine Webcams eingetragen.</div>';
  $("ul-links").innerHTML=(u.links||[]).length?'<div class="ul-links">'+u.links.map(l=>'<a class="btn" href="'+esc(safeUrl(l.u))+'" target="_blank" rel="noopener">'+esc(l.t)+' ↗</a>').join("")+'</div>':'<div class="muted">Keine Links eingetragen.</div>';
  $("ul-src").textContent=u.place||"";ulForm(u);
  ulLive(u);
  /* Wetter Tal + Berg mit Schneehöhe; Vorhersage reicht 16 Tage – davor aktueller Stand */
  try{const q=(lat,lon,ele)=>getJSON("https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lon+(ele?"&elevation="+ele:"")+"&current=temperature_2m,weather_code,snow_depth,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,snowfall_sum,precipitation_sum&timezone=Europe%2FBerlin&forecast_days=16");
    const [tal,berg]=await Promise.all([q(u.lat,u.lon),u.berg&&u.berg.lat?q(u.berg.lat,u.berg.lon,u.berg.ele).catch(()=>null):Promise.resolve(null)]);
    const box=(w,lbl)=>{if(!w)return"";const c=w.current,[tx,ik]=wmo(c.weather_code);return '<div class="ul-wxbox"><div class="muted small">'+esc(lbl)+'</div><div class="big">'+icon(ik)+' '+fmt(c.temperature_2m)+'°</div><div class="small">'+esc(tx)+'</div><div class="small">❄️ Schneehöhe: <b>'+(c.snow_depth!=null?fmt(c.snow_depth*100)+" cm":"–")+'</b></div></div>';};
    const d=tal.daily,inTrip=d.time.map((t,i)=>i).filter(i=>d.time[i]>=u.from&&d.time[i]<=u.to);const show=inTrip.length?inTrip:d.time.map((t,i)=>i).slice(0,7);
    let tb='<table class="tbl" style="margin-top:12px"><thead><tr><th>'+(inTrip.length?"Urlaubstage":"Nächste Tage")+'</th><th></th><th class="num">min</th><th class="num">max</th><th class="num">Neuschnee</th></tr></thead><tbody>';
    show.forEach(i=>{const[tx,ik]=wmo(d.weather_code[i]);tb+='<tr><td>'+esc(new Date(d.time[i]+"T12:00:00").toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"}))+'</td><td>'+icon(ik)+'</td><td class="num">'+fmt(d.temperature_2m_min[i])+'°</td><td class="num"><b>'+fmt(d.temperature_2m_max[i])+'°</b></td><td class="num">'+fmt(d.snowfall_sum[i],1)+' cm</td></tr>';});
    $("ul-wx").innerHTML='<div class="ul-wxgrid">'+box(tal,"Jetzt im Tal · "+(u.place||""))+box(berg,u.berg?"Jetzt am Berg · "+u.berg.name+" ("+u.berg.ele+" m)":"")+'</div>'+tb+'</tbody></table>'+(inTrip.length?'':'<div class="muted small" style="margin-top:6px">Die Vorhersage für die Urlaubstage erscheint ab '+esc(ulDate(new Date(new Date(u.from+"T12:00:00").getTime()-15*864e5).toISOString().slice(0,10)))+'.</div>');
  }catch(e){$("ul-wx").innerHTML='<div class="muted">Wetter gerade nicht abrufbar.</div>';}}
/* Gebuchte Fahrt: am Reisetag (ab 6 Std. vorher) Echtzeit des Zuges am Abfahrtsbahnhof – Verspätung, Gleis, Ausfall (DB IRIS über den Vermittler) */
async function ulLive(u){for(const key of ["hin","rueck"]){const t=u[key];if(!t||!t.booked||!t.dep||!t.date)continue;
  const el=document.querySelector('[data-ulrt="'+key+'"]');if(!el)continue;const dep=new Date(t.date+"T"+t.dep+":00"),h=(dep-Date.now())/36e5;
  let box=el.querySelector(".ul-live");if(!box){box=document.createElement("div");box.className="ul-live";el.appendChild(box);}
  if(h>6){box.textContent="Echtzeit (Verspätung, Gleis) erscheint hier am Reisetag ab "+String(Math.max(0,dep.getHours()-6)).padStart(2,"0")+":"+t.dep.slice(3)+" Uhr.";continue;}
  if(h<-3){box.textContent="";continue;}
  try{const map=await irisStation(t.from);const want=t.date.slice(2).replace(/-/g,"")+t.dep.replace(":","");
    const tr=Object.values(map).find(v=>v.dpT===want);if(!tr){box.textContent="Zug noch nicht in der Echtzeit gefunden.";continue;}
    const late=tr.dpCt?Math.round((new Date(irisT(tr.dpCt))-new Date(irisT(tr.dpT)))/6e4):0;
    box.innerHTML='<b>● live</b> '+esc(tr.c+" "+tr.n)+' · '+(tr.dpCs==="c"?'<b style="color:#e53935">fällt aus</b>':late>0?'<b style="color:#e53935">+'+late+' min</b> (ab '+esc(irisT(tr.dpCt).slice(11,16))+')':'<b style="color:var(--ok)">pünktlich</b>')+(tr.dpPp?' · Gleis '+esc(tr.dpPp):'');
  }catch(e){box.textContent="Echtzeit gerade nicht abrufbar.";}}}
const ulLines=t=>(t||"").split("\n").map(l=>l.split("|").map(x=>x.trim())).filter(a=>a[0]&&a[1]).map(a=>({t:a[0],u:a[1]}));
const ulTrip=t=>{let x=(t||"").trim();const b=/^★/.test(x);x=x.replace(/^★\s*/,"");const a=x.split("|").map(y=>y.trim());return a[0]?{from:a[0],to:a[1]||"",date:a[2]||"",dep:a[3]||"",arr:a[4]||"",note:a[5]||"",booked:b}:null;};
const ulTripStr=t=>t?(t.booked?"★ ":"")+[t.from,t.to,t.date,t.dep,t.arr,t.note].join(" | "):"";
function ulForm(u){const v=(id,x)=>{const e=$(id);if(e&&document.activeElement!==e)e.value=x||"";};
  v("ulf-title",u.title);v("ulf-place",u.place);v("ulf-from",u.from);v("ulf-to",u.to);v("ulf-hotel",u.hotel?[u.hotel.name,u.hotel.url,u.hotel.addr].join(" | "):"");
  v("ulf-hin",ulTripStr(u.hin));v("ulf-rueck",ulTripStr(u.rueck));v("ulf-cams",(u.cams||[]).map(c=>c.t+" | "+c.u).join("\n"));v("ulf-links",(u.links||[]).map(c=>c.t+" | "+c.u).join("\n"));v("ulf-berg",u.berg?u.berg.name+" | "+u.berg.ele:"");}
async function ulRead(base){const g=id=>($(id).value||"").trim();const u={...base,title:g("ulf-title")||"Urlaub",place:g("ulf-place"),from:g("ulf-from"),to:g("ulf-to")};
  const h=g("ulf-hotel").split("|").map(x=>x.trim());u.hotel={name:h[0]||"",url:h[1]||"",addr:h[2]||""};u.hin=ulTrip(g("ulf-hin"));u.rueck=ulTrip(g("ulf-rueck"));
  u.cams=ulLines($("ulf-cams").value);u.links=ulLines($("ulf-links").value);
  if(u.place&&(u.place!==base.place||!u.lat)){try{const r=await getJSON("https://geocoding-api.open-meteo.com/v1/search?count=1&language=de&name="+encodeURIComponent(u.place));const x=(r.results||[])[0];if(x){u.lat=x.latitude;u.lon=x.longitude;}}catch(e){}}
  const b=g("ulf-berg").split("|").map(x=>x.trim());if(b[0]){u.berg={name:b[0],ele:+b[1]||1500,lat:(base.berg&&base.berg.name===b[0]&&base.berg.lat)||u.lat,lon:(base.berg&&base.berg.name===b[0]&&base.berg.lon)||u.lon};}else u.berg=null;
  return u;}
document.addEventListener("click",async e=>{const s=e.target.closest("#ul-seg [data-ul]");if(s){ULSEL=s.dataset.ul;store("urlaub_sel",ULSEL);loadUrlaub();return;}
  const id=e.target.id;if(!/^ulf-(save|new|del)$/.test(id))return;const cur=ulCur()||{id:"u"+Date.now()};
  if(id==="ulf-del"){if(UL.length<1)return;UL=UL.filter(x=>x!==cur);ULSEL=UL[0]&&UL[0].id;store("urlaube",UL);store("urlaub_sel",ULSEL);loadUrlaub();return;}
  const u=await ulRead(id==="ulf-new"?{id:"u"+Date.now()}:cur);if(id==="ulf-new")UL.push(u);else UL=UL.map(x=>x===cur?u:x);ULSEL=u.id;
  store("urlaube",UL);store("urlaub_sel",ULSEL);$("ulf-msg").textContent="Gespeichert.";$("ul-edit").open=false;loadUrlaub();});
/* Kennzeichnung: spielt am selben Tag ein weiteres Team, erscheint ein gelber Hinweis */
function markParallel(){document.querySelectorAll("#v-fussball [data-day][data-team]").forEach(el=>{el.querySelectorAll(".fb-par").forEach(x=>x.remove());
  const d=el.dataset.day,me=el.dataset.team;const o=Object.keys(SP).filter(k=>k!==me).flatMap(k=>SP[k].filter(g=>g.day===d).map(g=>SPN[k]+(g.time?" "+g.time:"")+(g.home&&k!=="bvb"?" · in Düsseldorf":g.home?" · Dortmund":" · auswärts")));
  if(!o.length)return;const b=document.createElement("span");b.className="fb-par";b.textContent="Gleicher Tag: "+o.join(" | ");(el.querySelector(".t")||el).appendChild(b);});}
/* Sender frei sortierbar (gedrückt halten und ziehen), Reihenfolge nur auf diesem Gerät */
{const box=$("r-st");if(box){const o=load("radio_ord")||[];o.forEach(k=>{const b=box.querySelector('[data-st="'+k+'"]');if(b)box.appendChild(b);});
  setTimeout(()=>{try{reorder(box,".rbtn",()=>true,()=>store("radio_ord",[...box.querySelectorAll(".rbtn")].map(b=>b.dataset.st)));}catch(e){}},0);}}
{const box=$("r-apps");if(box){box.addEventListener("dragstart",e=>e.preventDefault());(load("radio_apps")||[]).forEach(k=>{const b=box.querySelector('[data-k="'+k+'"]');if(b)box.appendChild(b);});
  setTimeout(()=>{try{reorder(box,".rapp",()=>true,()=>store("radio_apps",[...box.querySelectorAll(".rapp")].map(b=>b.dataset.k)));}catch(e){}},0);}}
(async()=>{try{RADIO=(await getData("radio.json")).data;}catch(e){}})();
$("radio").addEventListener("click",async e=>{const b=e.target.closest(".rbtn");if(!b)return;const a=$("radio-audio"),k=b.dataset.st;
  const all=document.querySelectorAll("#radio .rbtn");
  if(b.classList.contains("on")||b.classList.contains("load")){a.pause();a.removeAttribute("src");a.load();all.forEach(x=>x.classList.remove("on","load"));return;}
  if(!RADIO){try{RADIO=(await getData("radio.json")).data;}catch(err){}}
  const url=RADIO&&RADIO[k]&&RADIO[k].url;
  if(!url){window.open(RADIO_SITE[k],"_blank","noopener");return;}
  all.forEach(x=>x.classList.remove("on","load"));b.classList.add("load");
  a.src=url;a.play().then(()=>{b.classList.remove("load");b.classList.add("on");}).catch(()=>{b.classList.remove("load");window.open(RADIO_SITE[k],"_blank","noopener");});
});
function toolsShow(open){const l=$("tools");l.hidden=!open;$("tools-toggle").setAttribute("aria-expanded",open?"true":"false");document.body.classList.toggle("t-open",open&&!document.body.classList.contains("harrange"));}
$("tools-toggle").addEventListener("click",()=>toolsShow($("tools").hidden));
document.addEventListener("click",e=>{if(e.target.closest("[data-tools-close]")){toolsShow(false);return;}
  const t=e.target.closest("#toolgrid [data-tool]");if(t&&!document.body.classList.contains("harrange")&&!document.body.classList.contains("arranging")&&t.dataset.tool!=="arrange"&&t.dataset.tool!=="lagemail")setTimeout(()=>{if(!document.body.classList.contains("harrange"))toolsShow(false);},150);});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("tools").hidden&&!document.body.classList.contains("harrange"))toolsShow(false);});
window.addEventListener("hashchange",()=>{if(!$("tools").hidden&&!document.body.classList.contains("harrange")&&location.hash!=="")toolsShow(false);});
/* App direkt öffnen; ist sie nicht da, nach kurzer Zeit die Webseite */
document.addEventListener("click",e=>{const a=e.target.closest("a[data-app],button[data-href]");if(!a)return;e.preventDefault();const web=a.href||a.dataset.href;if(!a.dataset.app){window.open(web,"_blank","noopener");return;}let left=false;
  const vis=()=>{left=true;};document.addEventListener("visibilitychange",vis);window.addEventListener("blur",vis,{once:true});
  location.href=a.dataset.app;setTimeout(()=>{document.removeEventListener("visibilitychange",vis);window.removeEventListener("blur",vis);if(!left&&!document.hidden)window.open(web,"_blank","noopener");},2500);});
function radioShow(open){const l=$("radio-list");l.hidden=!open;document.body.classList.toggle("r-open",open);
  document.querySelectorAll("#radio-toggle,[data-radio-open]").forEach(x=>{x.setAttribute("aria-expanded",open?"true":"false");x.classList.toggle("on",open&&x.hasAttribute("data-radio-open"));});}
document.addEventListener("click",e=>{const t=e.target.closest("#radio-toggle,[data-radio-open]");if(!t||(typeof HEDIT!=="undefined"&&HEDIT))return;radioShow($("radio-list").hidden);});
function radioTile(){const o=document.querySelector("#radio .rbtn.on");document.querySelectorAll("[data-radio-open] .hn-v").forEach(v=>v.textContent=o?o.querySelector("b").textContent.trim()+" läuft":"Sonos · WDR 2 · WDR 4");document.querySelectorAll(".qa-rv").forEach(v=>v.textContent=o?o.querySelector("b").textContent.trim():"Musik");
  document.body.classList.toggle("radio-on",!!o);if(o){const ic=o.querySelector(".r-ic");const m=ic&&(ic.getAttribute("style")||"").match(/#[0-9a-f]{6}/gi);if(m&&m.length>1){document.body.style.setProperty("--rc1",m[0]);document.body.style.setProperty("--rc2",m[1]);}}}
new MutationObserver(radioTile).observe($("radio"),{subtree:true,attributes:true,attributeFilter:["class"]});
/* schließen: Kreuz, Tipp auf leere Fläche, Auswahl eines Senders, Esc */
document.addEventListener("click",e=>{const l=$("radio-list");if(l.hidden)return;
  if(e.target.closest("[data-radio-close]")||e.target===l){radioShow(false);return;}
  if(e.target.closest("#radio .rbtn,#radio .rapp"))setTimeout(()=>radioShow(false),250);});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("radio-list").hidden)radioShow(false);});
setInterval(()=>{const on=document.querySelector("#radio .rbtn.on");const t=on?"· "+on.textContent.replace(/\s+/g," ").trim()+" läuft":"";if($("radio-now").textContent!==t)$("radio-now").textContent=t;},1000);
$("radio-audio").addEventListener("error",()=>document.querySelectorAll("#radio .rbtn").forEach(x=>x.classList.remove("on","load")));
// Schnellwahl der Lieblingsstädte im Kopf
function buildFavs(){
  const dusSub=C.isDus?(C.short||""):"Oberkassel / Heerdt";
  const items=[["dus","Düsseldorf",dusSub],...FAVS.map(f=>[f.key,f.name,""])];
  setTimeout(renderAlarm,0);
  const pick=document.querySelector("header .pick");if(pick&&selEl.parentNode!==pick)pick.appendChild(selEl);
  $("favs").innerHTML=items.map(([k,n,sub])=>'<div role="button" tabindex="0" class="fav'+(C.key===k?" on":"")+(k==="dus"&&C.isDus?" hasPick":"")+'" data-fav="'+k+'">'+esc(n)+(sub?' <small>'+esc(sub)+'</small>':'')+(k==="dus"&&C.isDus?' <span class="pcaret">▾</span>':'')+'</div>').join("");
  // Stadtteil-Auswahl direkt im Düsseldorf-Knopf (unsichtbares Auswahlfeld darüber)
  const d=document.querySelector('#favs [data-fav="dus"].hasPick');if(d)d.appendChild(selEl);
}
$("favs").addEventListener("click",e=>{const b=e.target.closest("[data-fav]");if(!b)return;const k=b.dataset.fav;
  if(k==="dus"){if(!C.isDus)choose("dus-4");}else if(C.key!==k)choose("p-"+k);});
selEl.addEventListener("change",()=>{
  if(selEl.value==="__add"){selEl.value=sel;location.hash="einstellungen";setTimeout(()=>$("place-q").focus(),300);return;}
  choose(selEl.value);
});
function choose(v,scroll){
  const before=C.key;sel=v;store("sel",v);C=ctx();selEl.value=v;
  if(typeof RS!=="undefined"&&!RS.lock){RS.city=null;RS.at=0;}
  applyPlaceUi();
  if(before===C.key&&C.isDus){renderWeather();renderAir();renderParking();renderBike();loadFuel();}
  else{WX=null;AQ=null;OBS=null;BIKE=null;clearPlaceViews();refreshAll(true);}
  if(scroll)window.scrollTo({top:0,behavior:"smooth"});
  // Ort oben gewechselt, während Reise & Verkehr offen ist → Ansicht für den neuen Ort neu aufbauen
  if(/^#(staus|parken|tanken|eladen)/.test(location.hash))setTimeout(()=>{try{route();}catch(e){}},60);
}
function clearPlaceViews(){
  TILE_PARTS.traffic={};TILE_PARTS.mobil={};
  ["bl","webcams-public","wx-now","wx-24","wx-7","air","uba","pollen","pegel","stau-list","traffic","roadworks","webcams","charging","efa","dep","bike","fuel","news","cal","alerts"]
    .forEach(id=>{const el=$(id);if(el)el.innerHTML='<div class="state">wird geladen …</div>';});
  $("stau-sum").innerHTML="";
  $("prio").innerHTML="";["k-temp","k-wx","k-wind","k-aq","k-rhein","k-warn","k-traffic"].forEach(id=>setKpi(id,"–","wird geladen"));
}
function applyPlaceUi(){
  buildFavs();
  $("gmaps-btn").href=gmapsUrl();
  ROUTES_TXT=routesFor(C.key);ROUTES=parseRoutes(ROUTES_TXT);$("routes").value=ROUTES_TXT;
  $("routes-lbl").textContent="Meine Strecken für "+C.town+" (Priorität)";
  document.querySelectorAll("[data-dus]:not(.view)").forEach(el=>el.hidden=!C.isDus);
  $("k-ein").hidden=C.key!=="datteln";
  $("k-bahn").dataset.view="bahn";
  {const fav=C.isDus||C.key==="datteln";
    $("bahn").querySelector("h2").textContent=fav?"Bahn-Verbindungen":"Bahn-Verbindung suchen";
    $("trip-from").value="";$("trip-to").value="";$("trip-from").placeholder=fav?"z. B. Düsseldorf-Heerdt":"Startbahnhof oder Adresse";$("trip-to").placeholder="Zielbahnhof oder Adresse";
    if(!fav)setKpi("k-bahn","Suche<small> Bahn</small>","Verbindung suchen · Abfahrten vor Ort","info");}
  $("app-title").textContent="Lagebild Thomas Hußmann";
  $("wx-h").innerHTML="Wetter <strong>"+esc(C.name)+"</strong>";
  if(typeof route==="function")route();
  document.title="Lagebild Thomas Hußmann · "+C.town;
  $("warn-title").textContent="Einzelheiten: "+C.town+(C.isDus?"":" · "+(C.detail||""));
  $("gmaps").href=gmapsUrl();
  setStauTitle();
  if($("ab-list"))$("ab-list").textContent=(C.ab.length?C.ab.join(" · "):"keine Autobahnen gewählt")+" · Umkreis "+JAM_RADIUS_KM+" km";
  $("rhein-sec").textContent=C.isDus?"Pegel Düsseldorf":"Pegel & Gewässer";
  $("efa-card").hidden=!C.efaDefault;
  $("stop").value=STOPS[C.key]||C.efaDefault||"";STOPIDX=null;if(C.efaDefault)loadStopIndex();
  $("stop-lbl").textContent="Haltestelle für Abfahrten in "+C.town;
  $("home-lbl").textContent="Meine Adresse in "+C.town;$("home-addr").value=(HOMES[C.key]||{}).q||"";
  $("stop").disabled=!C.efaDefault;
  renderMine();
}

// ================= Einstellungen & Ortssuche =================
$("tk").value=TK;$("windy").value=WINDY;
$("tomtom").value=TTKEY;$("tomtom").readOnly=true;$("tomtom-save").hidden=true;$("tomtom-hint").innerHTML="<b>✓ TomTom ist aktiv.</b> Der Schlüssel ist fest im Dashboard eingebaut und gilt automatisch auf allen Geräten – hier muss nichts mehr eingetragen oder gespeichert werden.";
$("home-save").addEventListener("click",async()=>{const q=$("home-addr").value.trim();const key=C.key;
  if(!q){delete HOMES[key];store("homes",HOMES);$("home-hint").textContent="Adresse entfernt.";loadTomTom();return;}
  $("home-hint").textContent="Adresse wird gesucht …";
  try{const h=await geocodeHome(key,q);$("home-hint").textContent="✓ Gefunden: "+h.label;loadTomTom();}
  catch(e){$("home-hint").textContent="Adresse nicht gefunden – bitte mit Ort eingeben ("+errText(e)+").";}});
{const g=$("gmkey");if(g)g.value=GMKEY;const b=$("gmkey-save");if(b)b.addEventListener("click",async()=>{GMKEY=$("gmkey").value.trim();store("gmkey",GMKEY||null);const h=$("gmkey-hint");
  if(!GMKEY){h.textContent="Entfernt – Fahrzeiten wieder von TomTom.";return;}h.textContent="Prüfe …";
  try{const v=await gmTime(FIXHOME.dus,FIXHOME.datteln);h.textContent="✓ Funktioniert: Düsseldorf → Datteln laut Google "+v.min+" min. Reise-Kacheln nutzen jetzt Google-Zeiten.";RS.at=0;}catch(e){h.textContent="✗ Google meldet: "+(e.message||e);}});}
$("tomtom-save").addEventListener("click",async()=>{TTKEY=$("tomtom").value.trim()||TTKEY_DEFAULT;store("tomtom",TTKEY===TTKEY_DEFAULT?null:TTKEY);
  
  $("tomtom-hint").textContent="Schlüssel wird geprüft …";
  try{const r=await fetch("https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point="+C.center.lat+","+C.center.lon+"&key="+encodeURIComponent(TTKEY));
    $("tomtom-hint").textContent=r.ok?"✓ Schlüssel funktioniert – Verkehrslage ist aktiv.":"Schlüssel wird nicht akzeptiert (Fehler "+r.status+"). Bitte prüfen.";}
  catch(e){$("tomtom-hint").textContent="Prüfung nicht möglich: "+e.message;}
  ensureMap();loadTomTom();});
$("windy-save").addEventListener("click",()=>{WINDY=$("windy").value.trim();store("windy",WINDY);loadWindy();});$("theme").value=theme;
$("stop-save").addEventListener("click",()=>{const v=$("stop").value.trim();if(!v||!C.efaDefault)return;STOPS[C.key]=v;store("stops",STOPS);loadEFA();
  const m=stopMatch(v);$("stop-hint").innerHTML=m.file?"Übernommen – Abfahrten werden angezeigt.":m.id?"Übernommen – Abfahrten kommen live vom VRR.":"Haltestelle nicht im Verzeichnis gefunden – bitte aus der Vorschlagsliste wählen.";});
$("efa-dir").addEventListener("input",()=>{DIRF[C.key]=$("efa-dir").value;renderEFA();efaGo();});
// Ziel eingeben → Verbindung mit Bus & Bahn in Google Maps (ab aktueller Haltestelle)
let EFASTOP="";
function efaGo(){const a=$("efa-go");if(!a)return;const q=($("efa-dir").value||"").trim();if(q.length<3||!EFASTOP){a.hidden=true;return;}
  const o=encodeURIComponent(EFASTOP),d=encodeURIComponent(q),nt=IOS?'':' target="_blank" rel="noopener"';
  const vrr="https://efa.vrr.de/vrr/XSLT_TRIP_REQUEST2?language=de&sessionID=0&requestID=0&itdTripDateTimeDepArr=dep&useRealtime=1&type_origin=any&name_origin="+o+"&type_destination=any&name_destination="+d;
  const gm=IOS?"comgooglemaps://?saddr="+o+"&daddr="+d+"&directionsmode=transit":"https://www.google.com/maps/dir/?api=1&travelmode=transit&origin="+o+"&destination="+d;
  a.innerHTML='<div class="efa-gh">Verbindung nach „'+esc(q)+'“ <small>ab '+esc(EFASTOP)+'</small></div><div class="efa-gb"><a class="efa-go" href="'+vrr+'" target="_blank" rel="noopener">VRR ↗<small>offizielle Auskunft</small></a><a class="efa-go" href="'+gm+'"'+nt+'>Google Maps ↗<small>Bus &amp; Bahn</small></a></div>';a.hidden=false;}
$("efa-dir").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();efaGo();const a=$("efa-go");const l=a&&!a.hidden&&a.querySelector("a");if(l)l.click();}});
$("efa-stops").addEventListener("click",e=>{const d=e.target.closest("[data-bdir]");if(d){store("busdir_"+ec().key,+d.dataset.bdir);renderEFA();return;}const b=e.target.closest("[data-stop]");if(!b)return;STOPS[ec().key]=b.dataset.stop;store("stops",STOPS);$("stop").value=b.dataset.stop;loadEFA();});
$("stop").addEventListener("keydown",e=>{if(e.key==="Enter"){$("stop-sug").innerHTML="";$("stop-save").click();}});
$("stop").addEventListener("input",()=>{const q=normStop($("stop").value);const box=$("stop-sug");
  if(q.length<2||!STOPIDX){box.innerHTML="";return;}
  const all=[...STOPIDX.available.map(a=>({name:a.name,ok:1})),...STOPIDX.all].filter((x,i,a)=>a.findIndex(y=>normStop(y.name)===normStop(x.name))===i);
  const hits=all.filter(x=>normStop(x.name).includes(q)).sort((a,b)=>(b.ok||0)-(a.ok||0)||normStop(a.name).indexOf(q)-normStop(b.name).indexOf(q)).slice(0,8);
  box.innerHTML=hits.map(x=>'<button type="button" data-sug="'+esc(x.name)+'">'+esc(x.name)+(x.ok?' <span class="muted small">· Abfahrten verfügbar</span>':'')+'</button>').join("")||'<div class="muted small" style="padding:6px">Keine Haltestelle gefunden.</div>';});
$("stop-sug").addEventListener("click",e=>{const b=e.target.closest("[data-sug]");if(!b)return;$("stop").value=b.dataset.sug;$("stop-sug").innerHTML="";$("stop-save").click();});
$("routes-save").addEventListener("click",()=>{ROUTES_TXT=$("routes").value.trim();store("routes_"+C.key,ROUTES_TXT);ROUTES=parseRoutes(ROUTES_TXT);loadAutobahn();});
$("routes").addEventListener("keydown",e=>{if(e.key==="Enter")$("routes-save").click();});
// Kontostand: öffnet die Finanztabelle in iCloud (Link nur lokal auf dem Gerät gespeichert)
{const fi=$("fin");if(fi){const l=load("fin_link")||"";fi.value=/^shareddocuments:/.test(l)?decodeURIComponent(l.split("com~apple~CloudDocs/")[1]||""):l;}}
// Link prüfen und vervollständigen (z. B. „icloud.com/…“ ohne https)
{const o=load("fin_link");if(o&&/^https?:\/\/[^./]+\/?$/i.test(o))store("fin_link",null);} // kaputten Alt-Eintrag wie „https://iCloud“ entfernen
const finNorm=v=>{v=String(v||"").trim().replace(/^<|>$/g,"");if(!v)return "";
  // echter Freigabe-Link (Rechnername mit Punkt, z. B. www.icloud.com/iclouddrive/…)
  const m=v.match(/(https?):\/\/[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s<>"]*)?/i);if(m)return m[0].replace(/[),.;]+$/,"");
  if(/^(shareddocuments|ms-excel|numbers):/i.test(v))return v;
  const d=v.match(/(?:^|\s)((?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\/[^\s<>"]+)/i);if(d&&!/\s/.test(v.slice(v.indexOf(d[1]))))return "https://"+d[1];
  // Dateipfad in iCloud Drive (z. B. „iCloud Drive/Finanzen/Datei.xlsx“) → öffnet die Datei in der Dateien-App
  if(v.includes("/")){let p=v.replace(/^https?:\/\//i,"").replace(/^\/+/,"").replace(/^(iCloud( Drive)?)\//i,"");
    return "shareddocuments:///private/var/mobile/Library/Mobile%20Documents/com~apple~CloudDocs/"+p.split("/").map(encodeURIComponent).join("/");}
  return "";};
function finMsg(t,ok){const m=$("fin-msg");if(m){m.textContent=t;m.style.color=ok?"var(--ok, #2e9d5b)":"#d62d20";}}
$("fin-save").addEventListener("click",()=>{const raw=$("fin").value.trim();const v=finNorm(raw);
  if(raw&&!v){finMsg("Darin ist kein Link zu erkennen. In der Dateien-App die Datei lange drücken → Teilen → „Link kopieren“ und hier einfügen.",false);return;}
  store("fin_link",v||null);
  if(v&&load("fin_link")!==v){finMsg("Der Browser lässt das Speichern nicht zu (privates Surfen aktiv?). Bitte normal in Safari bzw. über das Symbol auf dem Home-Bildschirm öffnen.",false);return;}
  $("fin").value=/^shareddocuments:/.test(v)?raw:v;finMsg(v?(/^shareddocuments:/.test(v)?"Als Dateipfad gespeichert ✓ – „Kontostand“ öffnet die Datei in der Dateien-App. ":"")+"Gespeichert ✓ – „Kontostand“ unter Tools öffnet jetzt diese Datei. Hinweis: Safari und das Home-Bildschirm-Symbol speichern getrennt.":"Link gelöscht.",true);});
{const fi=$("fin");if(fi)fi.addEventListener("paste",()=>setTimeout(()=>$("fin-save").click(),50));}
$("fin-open").addEventListener("click",()=>{let l=finNorm(load("fin_link"));
  // Auf iPhone/iPad ohne gespeicherten Link: Kurzbefehl „Kontostand“ öffnet die Datei direkt (kein Link nötig)
  if(!/^https?:/i.test(l||"")&&(/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1))){location.href="shortcuts://run-shortcut?name="+encodeURIComponent("Kontostand");return;}
  if(!l){const raw=prompt("iCloud-Link zu deiner Finanztabelle einfügen (beginnt mit https://www.icloud.com/…; wird nur auf diesem Gerät gespeichert):")||"";l=finNorm(raw);
    if(!l){if(raw.trim())alert("Das ist kein gültiger Link. Bitte in der Dateien-App „Link kopieren“ verwenden – der Link beginnt mit https://www.icloud.com/");return;}
    store("fin_link",l);const fi=$("fin");if(fi)fi.value=l;}
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  // OneDrive/SharePoint-Link: direkt in Excel öffnen (ohne Umweg über Kurzbefehle)
  if(ios&&/onedrive\.live\.com|sharepoint\.com|1drv\.ms/i.test(l)){location.href="ms-excel:ofe|u|"+l;return;}
  if(/^https?:/i.test(l))window.open(l,"_blank","noopener");else location.href=l;});
$("tk-save").addEventListener("click",()=>{TK=$("tk").value.trim();store("tk",TK);loadFuel();});
$("theme").addEventListener("change",e=>{const v=e.target.value;store("theme",v);
  if(v)document.documentElement.setAttribute("data-theme",v);else document.documentElement.removeAttribute("data-theme");});
async function searchPlace(){
  const q=$("place-q").value.trim();const box=$("place-results");if(q.length<2)return;
  box.innerHTML='<div class="state">Suche …</div>';
  try{const d=await getJSON("https://geocoding-api.open-meteo.com/v1/search?count=8&language=de&countryCode=DE&name="+encodeURIComponent(q));setStatus("geo",true);
    const res=d.results||[];
    if(!res.length){box.innerHTML='<div class="state">Kein Ort gefunden.</div>';return;}
    box.innerHTML=res.map((r,i)=>'<div class="li"><span class="tag alt">'+esc(STATES[r.admin1]||"")+'</span><div class="t">'+esc(r.name)+'</div><div class="r"><button type="button" data-i="'+i+'">Hinzufügen</button></div><div class="d">'+esc([r.admin4&&r.admin4!==r.name?r.admin4:"",r.admin3,r.admin2,r.admin1].filter(Boolean).join(", "))+'</div></div>').join("");
    box.querySelectorAll("button[data-i]").forEach(b=>b.addEventListener("click",()=>{const r=res[Number(b.dataset.i)];
      const key="c"+Date.now().toString(36);
      CUSTOM.push({key,name:r.name,detail:[r.admin3||r.admin2,r.admin1].filter(Boolean).join(", "),lat:r.latitude,lon:r.longitude,state:STATES[r.admin1]||"NW"});
      store("custom",CUSTOM);box.innerHTML='<div class="state good">'+esc(r.name)+' gespeichert. Wähle unten die Autobahnen in der Nähe.</div>';$("place-q").value="";
      buildSelect();choose("p-"+key);location.hash="#einstellungen";}));
  }catch(e){setStatus("geo",false,errText(e));box.innerHTML=stateBox("Suche nicht möglich – "+errText(e)+".");}
}
$("place-search").addEventListener("click",searchPlace);
$("place-q").addEventListener("keydown",e=>{if(e.key==="Enter")searchPlace();});
function renderMine(){
  const box=$("place-mine");
  const favs=FAVS.map(p=>'<div class="li"><span class="tag">Favorit</span><div class="t">'+esc(p.name)+'</div><div class="r"><button type="button" data-go="p-'+p.key+'">Anzeigen</button></div><div class="d">'+esc(p.detail)+' · Autobahnen '+esc(p.ab.join(", "))+'</div></div>').join("");
  const cus=CUSTOM.map(p=>{const ab=(ABSEL[p.key]||[]).join(", ");
    return '<div class="li"><span class="tag alt">'+esc(p.state)+'</span><div class="t">'+esc(p.name)+'</div><div class="r"><button type="button" data-go="p-'+p.key+'">Anzeigen</button> <button type="button" data-del="'+esc(p.key)+'">Entfernen</button></div>'+
      '<div class="d">'+esc(p.detail||"")+'<div class="inline" style="margin-top:6px"><input type="text" id="ab-'+esc(p.key)+'" value="'+esc(ab)+'" placeholder="Autobahnen, z. B. A1, A43" aria-label="Autobahnen für '+esc(p.name)+'"><button type="button" data-ab="'+esc(p.key)+'">Speichern</button></div></div></div>';}).join("");
  box.innerHTML=favs+cus;
  box.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>choose(b.dataset.go,true)));
  box.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>{
    if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="Wirklich entfernen?";setTimeout(()=>{b.dataset.armed="";b.textContent="Entfernen";},4000);return;}
    const k=b.dataset.del;CUSTOM=CUSTOM.filter(p=>p.key!==k);delete ABSEL[k];store("custom",CUSTOM);store("absel",ABSEL);
    buildSelect();if(sel==="p-"+k)choose("dus-4");else renderMine();}));
  box.querySelectorAll("[data-ab]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.ab;
    const v=($("ab-"+k).value||"").toUpperCase().split(/[\s,;]+/).map(x=>x.replace(/^(\d)/,"A$1")).filter(x=>/^A\d{1,3}$/.test(x));
    ABSEL[k]=[...new Set(v)];store("absel",ABSEL);if(C.key===k){C=ctx();applyPlaceUi();loadAutobahn();}else renderMine();}));
}

// ================= Wetter =================
function wxCoords(){const pts=[...BEZIRKE,...STADTTEILE].map(b=>[b.lat,b.lon]);if(!C.isDus)pts.push([C.lat,C.lon]);return pts;}
async function loadWeather(){
  const pts=wxCoords();
  const url="https://api.open-meteo.com/v1/forecast?latitude="+pts.map(p=>p[0]).join(",")+"&longitude="+pts.map(p=>p[1]).join(",")+
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day"+
    "&hourly=temperature_2m,precipitation_probability,precipitation,weather_code"+
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,sunrise,sunset,uv_index_max,daylight_duration"+
    "&forecast_days=7&timezone=Europe%2FBerlin&timeformat=unixtime";
  try{const d=await getJSON(url);WX=Array.isArray(d)?d:[d];setStatus("wx",true);}
  catch(e){setStatus("wx",false,errText(e));}
  renderWeather();
}
async function loadObs(){
  try{const d=await getJSON("https://api.brightsky.dev/current_weather?lat="+C.center.lat+"&lon="+C.center.lon+"&tz=Europe/Berlin");
    OBS={w:d.weather,src:(d.sources||[])[0]};setStatus("dwdobs",true);}
  catch(e){setStatus("dwdobs",false,errText(e));}
  renderWeather();
}
// Kleidungsempfehlung aus Tagesvorhersage (8–20 Uhr)
function renderWear(w){const box=$("wear");if(!box||!w)return;
  const h=w.hourly,now=Date.now()/1000;const today=new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Berlin"});
  const idx=h.time.map((t,i)=>i).filter(i=>{const d=new Date(h.time[i]*1000);const hh=+d.toLocaleString("de-DE",{timeZone:"Europe/Berlin",hour:"2-digit",hour12:false});return d.toLocaleDateString("sv-SE",{timeZone:"Europe/Berlin"})===today&&hh>=7&&hh<=21&&h.time[i]>=now-3600;});
  const use=idx.length?idx:h.time.map((t,i)=>i).filter(i=>h.time[i]>=now).slice(0,12);
  const temps=use.map(i=>h.temperature_2m[i]),pp=use.map(i=>h.precipitation_probability[i]||0),pr=use.map(i=>h.precipitation[i]||0);
  const tmin=Math.min(...temps),tmax=Math.max(...temps),feel=w.current.apparent_temperature,rain=Math.max(...pp),rainSum=pr.reduce((a,b)=>a+b,0),gust=w.daily.wind_gusts_10m_max[0],uv=w.daily.uv_index_max[0];
  const codes=use.map(i=>h.weather_code[i]);const snow=codes.some(c=>c>=71&&c<=77||c===85||c===86);
  const t=Math.min(tmin,feel);const rows=[];
  if(t<0)rows.push(["🧥","Wintermantel, Mütze, Schal und Handschuhe","Gefühlt "+fmt(feel)+" °C – es friert."]);
  else if(t<6)rows.push(["🧥","Warme Winterjacke, Schal","Morgens/abends nur "+fmt(tmin)+" °C."]);
  else if(t<11)rows.push(["🧥","Übergangsjacke oder dicker Pullover","Zwischen "+fmt(tmin)+" und "+fmt(tmax)+" °C."]);
  else if(t<16)rows.push(["🧶","Leichte Jacke oder Pullover","Zwischen "+fmt(tmin)+" und "+fmt(tmax)+" °C."]);
  else if(tmax<23)rows.push(["👕","Langarmshirt, Jacke reicht dünn","Bis "+fmt(tmax)+" °C."]);
  else rows.push(["👕","Leichte, luftige Kleidung","Bis "+fmt(tmax)+" °C."]);
  if(tmax-tmin>=8)rows.push(["🧅","Zwiebelprinzip","Es wird im Tagesverlauf "+fmt(tmax-tmin)+" Grad wärmer bzw. kälter."]);
  if(snow)rows.push(["🥾","Feste, rutschfeste Winterschuhe","Schnee oder Schneeregen möglich."]);
  else if(rain>=60||rainSum>=2)rows.push(["☔",gust>=50?"Regenjacke mit Kapuze, wasserfeste Schuhe":"Regenjacke und Schirm, wasserfeste Schuhe","Regenrisiko bis "+fmt(rain)+" %"+(rainSum?" · rund "+fmt(rainSum,1)+" mm":"")+"."]);
  else if(rain>=30)rows.push(["🌂",gust>=50?"Kapuze statt Schirm":"Knirps einpacken","Regenrisiko bis "+fmt(rain)+" %."]);
  if(gust>=50)rows.push(["💨","Windfeste Jacke mit Kapuze – Schirm eher zu Hause lassen","Böen bis "+fmt(gust)+" km/h."]);
  if(uv>=6)rows.push(["🧢","Sonnenbrille, Kopfbedeckung, Sonnencreme","UV-Index "+fmt(uv)+"."]);
  else if(uv>=3&&tmax>=18)rows.push(["🕶️","Sonnenbrille mitnehmen","UV-Index "+fmt(uv)+"."]);
  const no=[];
  if(tmax<18)no.push("kurze Hosen und Sandalen");if(rain>=50)no.push("Wildleder und Stoffschuhe");if(t<6)no.push("dünne Sneaker");if(tmax>=25)no.push("dicke Jacke");if(gust>=50)no.push("Regenschirm");
  box.innerHTML='<div class="wear">'+rows.map(r=>'<div class="wear-row"><span class="wear-ic">'+r[0]+'</span><div><b>'+esc(r[1])+'</b><div class="muted small">'+esc(r[2])+'</div></div></div>').join("")+
    (no.length?'<div class="wear-row"><span class="wear-ic">🚫</span><div><b class="wear-no">Besser nicht: '+esc(no.join(", "))+'</b></div></div>':'')+'</div>';
  $("wear-src").textContent="heute "+(idx.length?"7–21 Uhr":"nächste Stunden")+" · "+C.town;}
function renderWeather(){
  $("wx-place").textContent=C.name+(C.detail?" · "+C.detail:"");
  if(!WX||!WX[C.wxIdx]){if(status.wx&&!status.wx.ok)$("wx-now").innerHTML=stateBox("Wetterdaten nicht verfügbar – "+status.wx.msg);return;}
  const w=WX[C.wxIdx],c=w.current,[txt,ic]=wmo(c.weather_code),day=w.daily;
  try{renderWear(w);}catch(e){}
  setKpi("k-temp",icon(ic)+" "+fmt(c.temperature_2m,1)+"<small> °C</small>",txt+" · Böen "+fmt(c.wind_gusts_10m)+" km/h",bft(c.wind_gusts_10m)>=9?"bad":bft(c.wind_gusts_10m)>=7?"warn":"info");
  setKpi("k-wx",icon(ic)+" <span style='font-size:21px'>"+esc(txt)+"</span>","Regenrisiko heute "+fmt(day.precipitation_probability_max[0])+" %");
  const g=c.wind_gusts_10m,bf=bft(g);
  setKpi("k-wind",fmt(c.wind_speed_10m)+"<small> / "+fmt(g)+" km/h</small>","aus "+windDir(c.wind_direction_10m)+" · Böen Bft "+bf,bf>=9?"bad":bf>=7?"warn":"ok");
  let obs="";
  if(OBS&&OBS.w){const o=OBS.w;
    obs='<div class="muted small">Gemessen an der DWD-Station '+esc(OBS.src&&OBS.src.station_name||"")+': <b style="color:var(--fg)">'+fmt(o.temperature,1)+' °C</b>, '+esc(({dry:"trocken",fog:"Nebel",rain:"Regen",sleet:"Schneeregen",snow:"Schnee",hail:"Hagel",thunderstorm:"Gewitter"})[o.condition]||o.condition||"")+', Wind '+fmt(o.wind_speed_10||o.wind_speed_30||o.wind_speed_60)+' km/h · '+hhmm(o.timestamp)+' Uhr</div>';}
  $("wx-now").innerHTML='<div class="row">'+icon(ic,"lg")+'<div><div class="big">'+fmt(c.temperature_2m,1)+'°</div><div class="muted">'+esc(txt)+' · gefühlt '+fmt(c.apparent_temperature,1)+'°</div></div>'+
   '<div class="muted" style="margin-left:auto;text-align:right">Heute<br><b style="color:var(--fg);font-size:18px">'+fmt(day.temperature_2m_min[0])+'° / '+fmt(day.temperature_2m_max[0])+'°</b></div></div>'+
   '<div class="facts">'+fact(fmt(c.relative_humidity_2m)+" %","Luftfeuchte")+fact(fmt(c.pressure_msl)+" hPa","Luftdruck")+fact(fmt(c.cloud_cover)+" %","Bewölkung")+
   fact(fmt(c.wind_speed_10m)+" km/h "+windDir(c.wind_direction_10m),"Wind")+fact(fmt(g)+" km/h (Bft "+bf+")","Böen")+fact(fmt(day.uv_index_max[0],1),"UV-Index max.")+
   fact(fmt(day.precipitation_sum[0],1)+" mm","Regen heute")+fact(fmt(c.precipitation,1)+" mm","Regen jetzt")+'</div>'+obs+
   '<div class="muted small">Modellstand '+hhmm(c.time*1000)+' Uhr</div>';
  const h=w.hourly,now=Date.now()/1000;let i0=h.time.findIndex(t=>t>=now-3600);if(i0<0)i0=0;
  const T=[],P=[],L=[];for(let i=i0;i<Math.min(i0+24,h.time.length);i++){T.push(h.temperature_2m[i]);P.push(h.precipitation_probability[i]);L.push(h.time[i]);}
  $("wx-24").innerHTML=chart24(T,P,L);
  let r='<table><thead><tr><th>Tag</th><th>Wetter</th><th class="num">min</th><th class="num">max</th><th class="num">Regen</th><th class="num">Risiko</th><th class="num">Böen km/h</th><th class="num">UV</th><th>Sonne</th></tr></thead><tbody>';
  day.time.forEach((t,i)=>{const[tx,ik]=wmo(day.weather_code[i]);
    r+='<tr><td>'+(i===0?"<b>Heute</b>":dayName(t*1000))+'</td><td>'+icon(ik)+' <span class="muted" style="font-size:13px">'+esc(tx)+'</span></td><td class="num">'+fmt(day.temperature_2m_min[i])+'°</td><td class="num"><b>'+fmt(day.temperature_2m_max[i])+'°</b></td><td class="num">'+fmt(day.precipitation_sum[i],1)+' mm</td><td class="num">'+fmt(day.precipitation_probability_max[i])+' %</td><td class="num">'+fmt(day.wind_gusts_10m_max[i])+'</td><td class="num">'+fmt(day.uv_index_max[i],1)+'</td><td class="muted">'+hhmm(day.sunrise[i]*1000)+' – '+hhmm(day.sunset[i]*1000)+'</td></tr>';});
  $("wx-7").innerHTML=r+'</tbody></table>';
  renderDistricts();renderCal();
}
function chart24(T,P,L){
  if(!T.length)return stateBox("keine Stundenwerte");
  /* Breite an das Gerät anpassen, damit die Schrift auf dem iPhone nicht winzig wird */
  const W=Math.round(Math.min(640,Math.max(340,(window.innerWidth||640)-70))),narrow=W<480,H=narrow?250:220,pl=narrow?36:38,pr=12,pt=30,pb=34,iw=W-pl-pr,ih=H-pt-pb;
  const ev=narrow?4:3;
  let mn=Math.floor(Math.min(...T))-1,mx=Math.ceil(Math.max(...T))+1;if(mx-mn<4){mx+=2;mn-=2;}
  const x=i=>pl+(i+.5)*iw/T.length,y=v=>pt+ih-(v-mn)/(mx-mn)*ih,bw=iw/T.length*.7;
  let s='<svg class="chart c24" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Temperatur und Regenrisiko der nächsten 24 Stunden">';
  const step=Math.max(1,Math.round((mx-mn)/4));
  for(let v=Math.ceil(mn);v<=mx;v+=step){s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)" stroke-width="1"/><text class="ax" x="'+(pl-6)+'" y="'+(y(v)+5)+'" text-anchor="end">'+v+'°</text>';}
  P.forEach((p,i)=>{if(p>0){const bh=p/100*ih;s+='<rect x="'+(x(i)-bw/2)+'" y="'+(pt+ih-bh)+'" width="'+bw+'" height="'+bh+'" fill="var(--accent)" opacity=".22" rx="1.5"><title>'+hhmm(L[i]*1000)+': '+p+' % Regenrisiko</title></rect>';}});
  let d="",a="M"+x(0)+" "+(pt+ih);T.forEach((t,i)=>{d+=(i?"L":"M")+x(i).toFixed(1)+" "+y(t).toFixed(1);a+="L"+x(i).toFixed(1)+" "+y(t).toFixed(1);});
  a+="L"+x(T.length-1)+" "+(pt+ih)+"Z";
  s+='<path d="'+a+'" fill="var(--accent)" opacity=".08"/><path d="'+d+'" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>';
  T.forEach((t,i)=>{if(i%ev===0){s+='<text class="ax" x="'+x(i)+'" y="'+(H-9)+'" text-anchor="middle">'+hhmm(L[i]*1000).replace(/:00$/,"")+(narrow?" h":"")+'</text><circle cx="'+x(i)+'" cy="'+y(t)+'" r="3" fill="var(--accent)"/><text class="tv" x="'+x(i)+'" y="'+(y(t)-10)+'" text-anchor="middle">'+Math.round(t)+'°</text>';}});
  s+='<circle cx="'+x(0)+'" cy="'+y(T[0])+'" r="5" fill="var(--accent)" stroke="var(--panel)" stroke-width="2"/>';
  return s+'</svg>';
}

// ================= Luft =================
async function loadAir(){
  const pts=wxCoords();
  const url="https://air-quality-api.open-meteo.com/v1/air-quality?latitude="+pts.map(p=>p[0]).join(",")+"&longitude="+pts.map(p=>p[1]).join(",")+
    "&current=european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone&hourly=european_aqi&forecast_days=2&timezone=Europe%2FBerlin&timeformat=unixtime";
  try{const d=await getJSON(url);AQ=Array.isArray(d)?d:[d];setStatus("aq",true);}
  catch(e){setStatus("aq",false,errText(e));}
  renderAir();
}
function renderAir(){
  if(!AQ||!AQ[C.wxIdx]){if(status.aq&&!status.aq.ok)$("air").innerHTML=stateBox("Luftdaten nicht verfügbar – "+status.aq.msg);return;}
  const a=AQ[C.wxIdx],c=a.current,q=eaqi(c.european_aqi);
  setKpi("k-aq",fmt(c.european_aqi)+"<small> EAQI</small>",q.t+" · "+C.short,q.i<=2?"":q.c);/* Kachel erst ab „schlecht“ (EAQI > 60) einfärben */
  const scale='<div class="aq-scale" aria-hidden="true">'+AQ_COL.map((col,i)=>'<span style="background:'+col+'" class="'+(i===q.i?"on":"")+'"></span>').join("")+'</div>';
  let mx=null;if(a.hourly){const now=Date.now()/1000;a.hourly.time.forEach((t,i)=>{if(t>=now&&t<now+86400){const v=a.hourly.european_aqi[i];if(v!=null&&(mx==null||v>mx))mx=v;}});}
  $("air").innerHTML='<div class="row"><div><div class="big">'+fmt(c.european_aqi)+'</div><div class="muted">EAQI · '+esc(C.short)+'</div></div><div style="flex:1;min-width:160px"><span class="pill p-'+q.c+'"><i></i>'+q.t+'</span>'+scale+
   '<div class="muted small" style="margin-top:6px">Höchstwert nächste 24 h: '+fmt(mx)+' ('+eaqi(mx).t+')</div></div></div>'+
   '<div class="facts">'+fact(fmt(c.pm10)+" µg/m³","Feinstaub PM10")+fact(fmt(c.pm2_5)+" µg/m³","Feinstaub PM2,5")+fact(fmt(c.nitrogen_dioxide)+" µg/m³","Stickstoffdioxid")+fact(fmt(c.ozone)+" µg/m³","Ozon")+'</div>'+
   '<div class="muted small">Modellwerte im Raster von etwa 10 km – gemessene Werte siehe Messstationen.</div>';
  renderDistricts();
}
const UBA_IDX=[["sehr gut","ok"],["gut","ok"],["mäßig","warn"],["schlecht","bad"],["sehr schlecht","crit"]];
async function loadUBA(){
  if(!FAVKEYS.includes(C.key)){$("uba").innerHTML=stateBox("Messstationen sind für Düsseldorf und die drei Favoriten hinterlegt. Für "+C.town+":",link("https://www.umweltbundesamt.de/daten/luft/luftdaten/luftqualitaet","UBA-Luftqualität"));setStatus("uba",true,"nur Favoriten");return;}
  try{const d=await getData("uba-"+C.key+".json");const rows=d.data||[];
    let r='<table><thead><tr><th>Station</th><th>Index</th><th class="num">NO₂</th><th class="num">PM10</th><th class="num">PM2,5</th><th class="num">O₃</th><th>Stand</th></tr></thead><tbody>';
    rows.forEach(x=>{const ii=UBA_IDX[x.idx]||["–",""];const cv=id=>x.comps[id]?fmt(x.comps[id].val):"–";
      r+='<tr><td><b>'+esc(x.name)+'</b><br><span class="muted small">'+fmt(x.km,1)+' km · '+esc(x.code)+'</span></td><td><span class="pill p-'+ii[1]+'"><i></i>'+ii[0]+'</span></td><td class="num">'+cv(5)+'</td><td class="num">'+cv(1)+'</td><td class="num">'+cv(9)+'</td><td class="num">'+cv(3)+'</td><td class="muted">'+esc(String(x.time).slice(11,16))+'</td></tr>';});
    $("uba").innerHTML='<div class="tbl-wrap">'+r+'</tbody></table></div><div class="muted small">Nächstgelegene Stationen, Stundenmittel in µg/m³, vorläufige Werte · abgerufen '+dataAge(d)+'</div>';
    setStatus("uba",true,"Stand "+dataAge(d));
  }catch(e){setStatus("uba",false,errText(e));$("uba").innerHTML=stateBox("Messwerte nicht verfügbar – "+errText(e)+".",link("https://www.umweltbundesamt.de/daten/luft/luftdaten/luftqualitaet","UBA-Luftqualität"));}
}
const POLLEN_ORDER=["Hasel","Erle","Esche","Birke","Graeser","Roggen","Beifuss","Ambrosia"];
const POLLEN_DE={Graeser:"Gräser",Beifuss:"Beifuß"};
async function loadPollen(){
  try{const d=(await getData("pollen.json")).data;
    const rr=POLLEN_REGION[C.state]||/Nordrhein/;
    const inState=(d.content||[]).filter(c=>rr.test(c.region_name));
    const reg=(C.pollen&&inState.find(c=>C.pollen.test(c.partregion_name||"")))||inState[0];
    if(!reg)throw new Error("Region nicht gefunden");
    const lv=v=>({"0":0,"0-1":.5,"1":1,"1-2":1.5,"2":2,"2-3":2.5,"3":3}[String(v)]??null);
    const txt=v=>({"0":"keine","0-1":"keine bis gering","1":"gering","1-2":"gering bis mittel","2":"mittel","2-3":"mittel bis hoch","3":"hoch"}[String(v)]||"–");
    const bars=v=>{const n=lv(v);if(n==null)return"–";let s='<span class="lvl'+(n>=2.5?" hi":"")+'" title="'+txt(v)+'">';for(let i=1;i<=6;i++)s+='<b class="'+(i<=n*2?"on":"")+'"></b>';return s+'</span>';};
    let r='<table><thead><tr><th>Pollenart</th><th>Heute</th><th>Morgen</th><th>Übermorgen</th></tr></thead><tbody>';
    POLLEN_ORDER.forEach(k=>{const p=(reg.Pollen||{})[k];if(!p)return;
      r+='<tr><td><b>'+(POLLEN_DE[k]||k)+'</b></td><td>'+bars(p.today)+' <span class="muted small">'+txt(p.today)+'</span></td><td>'+bars(p.tomorrow)+' <span class="muted small">'+txt(p.tomorrow)+'</span></td><td>'+bars(p.dayafter_to)+' <span class="muted small">'+txt(p.dayafter_to)+'</span></td></tr>';});
    $("pollen").innerHTML='<div class="tbl-wrap">'+r+'</tbody></table></div><div class="muted small">'+esc(reg.partregion_name||reg.region_name)+' · ausgegeben '+esc(d.last_update||"")+'</div>';
    setStatus("pollen",true);
  }catch(e){setStatus("pollen",false,errText(e));$("pollen").innerHTML=stateBox("Pollendaten nicht verfügbar – "+errText(e)+".",link("https://www.dwd.de/DE/leistungen/gefahrenindizespollen/gefahrenindexpollen.html","DWD-Pollenflug"));}
}

// ================= Düsseldorfer Bezirke =================
function renderDistricts(){
  if(!C.isDus||!WX)return;
  let r='<table><thead><tr><th>Bezirk</th><th>Wetter</th><th class="num">Temp.</th><th class="num">gefühlt</th><th class="num">Wind / Böen</th><th class="num">Regenrisiko heute</th><th class="num">EAQI</th></tr></thead><tbody>';
  const row=(val,label,i)=>{const w=WX[i];if(!w)return"";const c=w.current,[tx,ik]=wmo(c.weather_code);const aq=AQ&&AQ[i]?AQ[i].current.european_aqi:null,q=eaqi(aq);
    return '<tr class="click'+(val===sel?" sel":"")+'" data-v="'+val+'" tabindex="0"><td>'+label+'</td><td>'+icon(ik)+' <span class="muted" style="font-size:13px">'+esc(tx)+'</span></td><td class="num"><b>'+fmt(c.temperature_2m,1)+'°</b></td><td class="num">'+fmt(c.apparent_temperature,1)+'°</td><td class="num">'+fmt(c.wind_speed_10m)+' / '+fmt(c.wind_gusts_10m)+'</td><td class="num">'+fmt(w.daily.precipitation_probability_max[0])+' %</td><td class="num">'+(aq==null?"–":'<span class="pill p-'+q.c+'"><i></i>'+fmt(aq)+'</span>')+'</td></tr>';};
  BEZIRKE.forEach((b,i)=>{r+=row("dus-"+b.id,'<b>'+b.id+'</b> '+esc(b.name),i);
    STADTTEILE.forEach((t,j)=>{if(t.bezirk===b.id)r+=row("dus-"+t.key,'<b>'+b.id+'</b> '+esc(t.name),10+j);});});
  $("districts").innerHTML=r+'</tbody></table>';
  {const ts=BEZIRKE.map((b,i)=>WX[i]&&WX[i].current.temperature_2m).filter(v=>v!=null);if(ts.length)setKpi("k-bez",fmt(Math.min(...ts))+"–"+fmt(Math.max(...ts))+"<small> °C</small>","Spanne über alle Bezirke");}
  $("districts").querySelectorAll("tr.click").forEach(tr=>{const f=()=>choose(tr.dataset.v,true);tr.addEventListener("click",f);tr.addEventListener("keydown",e=>{if(e.key==="Enter")f();});});
}

// ================= Warnungen: NINA + DWD =================
function pointIn(geo,lat,lon){
  const inRing=(ring)=>{let ins=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
    if(((yi>lat)!==(yj>lat))&&(lon<(xj-xi)*(lat-yi)/((yj-yi)||1e-12)+xi))ins=!ins;}return ins;};
  const poly=c=>inRing(c[0])&&!c.slice(1).some(inRing);
  const g=geo&&(geo.type==="Feature"?geo.geometry:geo);if(!g)return false;
  if(g.type==="FeatureCollection"||geo.type==="FeatureCollection")return (geo.features||[]).some(f=>pointIn(f,lat,lon));
  if(g.type==="Polygon")return poly(g.coordinates);
  if(g.type==="MultiPolygon")return g.coordinates.some(poly);
  if(g.type==="GeometryCollection")return (g.geometries||[]).some(x=>pointIn(x,lat,lon));
  return false;
}
async function ninaByArea(){
  // Für eigene Orte ohne Regionalschlüssel: alle aktuellen Meldungen holen und per Warngebiet prüfen
  const provs=["mowas","katwarn","biwapp","lhp","police"];
  const lists=await Promise.all(provs.map(p=>getJSON("https://warnung.bund.de/api31/"+p+"/mapData.json").then(l=>(l||[]).map(x=>({...x,_p:p}))).catch(()=>[])));
  const items=lists.flat().slice(0,60);
  const hits=[];
  await Promise.all(items.map(async it=>{try{const g=await getJSON("https://warnung.bund.de/api31/warnings/"+encodeURIComponent(it.id)+".geojson",15000);
    if(pointIn(g,C.lat,C.lon))hits.push({id:it.id,payload:{data:{provider:it._p.toUpperCase(),severity:it.severity,headline:it.i18nTitle&&it.i18nTitle.de}},i18nTitle:it.i18nTitle,sent:it.startDate});}catch(e){}}));
  return hits;
}
async function loadAlerts(){
  const out=[];let okD=false,okN=false;
  const pD=getJSON("https://api.brightsky.dev/alerts?lat="+C.center.lat+"&lon="+C.center.lon+"&tz=Europe/Berlin").then(d=>{okD=true;
    (d.alerts||[]).forEach(a=>out.push({src:"DWD",title:a.headline_de||a.event_de,text:a.description_de,instr:a.instruction_de,sev:a.severity,from:a.onset,to:a.expires}));
    setStatus("dwd",true);}).catch(e=>setStatus("dwd",false,errText(e)));
  const fav=FAVKEYS.includes(C.key);
  const pN=getData(fav?"nina-"+C.key+".json":"nina-all.json").then(d=>{okN=true;
    let list=d.data||[];
    if(!fav)list=list.filter(w=>w.geo&&pointIn(w.geo,C.lat,C.lon));
    list.forEach(a=>out.push({src:"NINA · "+(a.provider||"BBK"),title:a.headline||a.title,text:a.text,instr:a.instr,area:a.area,sev:a.severity,from:a.sent,id:a.id,nina:true}));
    setStatus("nina",true,"Stand "+dataAge(d)+(fav?"":" · Abgleich über Warngebiete")+(d.stale?" · veraltet":""));}).catch(e=>setStatus("nina",false,errText(e)));
  await Promise.all([pD,pN]);
  const order={extreme:4,severe:3,moderate:2,minor:1};
  out.sort((a,b)=>(b.nina?1:0)-(a.nina?1:0)||(order[String(b.sev).toLowerCase()]||0)-(order[String(a.sev).toLowerCase()]||0));
  const box=$("alerts");
  if(!okD&&!okN){box.innerHTML=stateBox("Warnungen konnten nicht geladen werden. Bitte direkt prüfen:",link("https://warnung.bund.de/meldungen","NINA")+" · "+link("https://www.dwd.de/DE/wetter/warnungen_gemeinden/warnWetter_node.html","DWD"));setKpi("k-warn","?","nicht geladen","warn");return;}
  const nN=out.filter(a=>a.nina).length;
  if(!out.length){box.innerHTML='<div class="state good">Keine aktiven NINA- oder DWD-Warnungen für '+esc(C.town)+'.'+((okD&&okN)?"":" ("+(!okN?"NINA":"DWD")+" nicht erreichbar)")+'</div>';setKpi("k-warn","0","keine aktiven Warnungen","ok");setAlarm(0);return;}
  const sc=s=>{s=String(s).toLowerCase();return s==="extreme"?"crit":s==="severe"?"bad":s==="moderate"?"warn":"info";};
  const sevDe={extreme:"extrem",severe:"Unwetter / schwer",moderate:"markant",minor:"Hinweis"};
  box.innerHTML=(okN?'':'<div class="state">NINA nicht erreichbar – nur DWD-Warnungen. '+link("https://warnung.bund.de/meldungen","NINA öffnen")+'</div>')+
    out.map(a=>'<div class="alert sev-'+sc(a.sev)+'"><h3>'+(a.nina?'<span class="pill" style="margin-right:6px">NINA</span>':'')+esc(a.title)+'</h3>'+
    (a.area?'<div class="meta">Gebiet: '+esc(a.area)+'</div>':'')+(a.text?'<p>'+esc(a.text)+'</p>':'')+(a.instr?'<details><summary>Handlungsempfehlung</summary><p>'+esc(a.instr)+'</p></details>':'')+
    (a.id?'<div class="meta">'+link("https://warnung.bund.de/meldungen/"+encodeURIComponent(a.id),"Meldung mit Handlungsempfehlungen öffnen")+'</div>':'')+
    '<div class="meta">'+esc(a.src)+(a.sev?' · '+esc(sevDe[String(a.sev).toLowerCase()]||a.sev):'')+(a.from?' · ab '+dateTime(a.from):'')+(a.to?' bis '+dateTime(a.to):'')+'</div></div>').join("");
  const top=sc(out[0].sev);setKpi("k-warn",String(out.length),(nN?nN+" × NINA · ":"")+out[0].title,top==="info"?"warn":top);
  setAlarm(out.length,out[0].title,out.map(a=>a.title));
}

// ================= Gewässer =================
// Vergleichsskala: aktueller Stand zwischen Niedrig- und Hochwasser
function levelScale(v,m){
  const pts=[["NNW",m.NNW],["MNW",m.MNW],["MW",m.MW],["MHW",m.MHW],["HSW",m.HSW],["I",m.I],["II",m.II],["III",m.III],["HHW",m.HHW]].filter(([,x])=>x!=null&&isFinite(x));
  if(!pts.length||v==null)return"";
  let lo=Math.min(v,...pts.map(p=>p[1])),hi=Math.max(v,...pts.map(p=>p[1]));const pad=(hi-lo)*.06||10;lo-=pad;hi+=pad;
  const pc=x=>Math.max(0,Math.min(100,(x-lo)/(hi-lo)*100));
  const mnw=m.MNW!=null?pc(m.MNW):0,mhw=m.MHW!=null?pc(m.MHW):100;
  return '<div class="wlvl"><div class="wlvl-bar" style="--mnw:'+mnw+'%;--mhw:'+mhw+'%">'+(()=>{let last=-99;return pts.filter(([k])=>k!=="NNW"&&k!=="HHW").sort((a,b)=>a[1]-b[1]).map(([k,x])=>{const q=pc(x);const show=q-last>=8;if(show)last=q;return '<i class="wlvl-mk" style="left:'+q+'%">'+(show?'<span>'+k+'</span>':'')+'</i>';}).join("");})()+
    '<b class="wlvl-cur" style="left:'+pc(v)+'%" title="aktuell"></b></div></div>';
}
function levelText(v,m,u){
  u=u||"cm";const d=(x)=>Math.round(v-x);
  let st,cls;
  if(m.III!=null&&v>=m.III){st="Hochwasser – Informationswert 3 überschritten";cls="crit";}
  else if(m.II!=null&&v>=m.II){st="Hochwasser – Informationswert 2 überschritten";cls="bad";}
  else if(m.I!=null&&v>=m.I){st="erhöht – Informationswert 1 überschritten";cls="bad";}
  else if(m.MHW!=null&&v>=m.MHW){st="Hochwasser (über mittlerem Hochwasser)";cls="bad";}
  else if(m.MNW!=null&&v<=m.MNW){st="Niedrigwasser (unter mittlerem Niedrigwasser)";cls="warn";}
  else if(m.MW!=null&&v<m.MW){st="normal, etwas unter Mittelwasser";cls="ok";}
  else{st="normal, etwas über Mittelwasser";cls="ok";}
  const cmp=m.MW!=null?(d(m.MW)>=0?d(m.MW)+" "+u+" über":-d(m.MW)+" "+u+" unter")+" Mittelwasser ("+fmt(m.MW)+" "+u+")":"";
  return {st,cls,cmp};
}
async function loadRhein(){
  const P="https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations";
  try{
    let uuid,st;
    if(C.isDus){st=await getJSON(P+"/D%C3%9CSSELDORF.json?includeTimeseries=true&includeCurrentMeasurement=true");}
    else{const list=await getJSON(P+".json?latitude="+C.lat+"&longitude="+C.lon+"&radius=50&includeTimeseries=true&includeCurrentMeasurement=true");
      const withW=(list||[]).filter(s=>(s.timeseries||[]).some(t=>t.shortname==="W"&&t.currentMeasurement)).map(s=>({...s,km:distKm(C.lat,C.lon,s.latitude,s.longitude)})).sort((a,b)=>a.km-b.km);
      if(!withW.length)throw new Error("kein Pegel im Umkreis von 50 km");st=withW[0];}
    uuid=st.uuid;
    const hist=await getJSON(P+"/"+uuid+"/W/measurements.json?start=P7D").catch(()=>[]);
    const ts=(st.timeseries||[]).find(t=>t.shortname==="W")||{};const cm=ts.currentMeasurement||{};
    const wt=(st.timeseries||[]).find(t=>t.shortname==="WT");
    const water=(st.water&&st.water.longname)||"";const wName=water.charAt(0)+water.slice(1).toLowerCase();
    const sName=(st.longname||st.shortname||"").replace(/\p{L}+/gu,w=>w.charAt(0)+w.slice(1).toLowerCase());
    $("pegel-title").textContent="Pegel "+sName;
    $("pegel-src").textContent="WSV PEGELONLINE · "+wName+(st.km!=null?" · km "+fmt(st.km,1):"")+(!C.isDus&&st.km!=null?"":"");
    $("k-rhein-lbl").textContent="Pegel "+sName;$("k-rhein").dataset.water=/^rhein$/i.test(wName)?"":wName;
    const tr=cm.trend===1?"steigend ↑":cm.trend===-1?"fallend ↓":"gleichbleibend →";
    const cvRaw=await getJSON(P+"/"+uuid+"/W.json?includeCharacteristicValues=true").then(x=>x.characteristicValues||[]).catch(()=>[]);
    const M={};cvRaw.forEach(c=>{M[c.shortname]=c.value;});
    if(C.isDus){M.I=710;M.II=830;}
    const LT=cm.value!=null?levelText(cm.value,M,ts.unit||"cm"):null;
    const stateDe=LT&&M.MW!=null?LT.st:({low:"Niedrigwasser (unter MNW)",normal:"Mittelwasserbereich",high:"Hochwasser (über MHW)",unknown:"ohne Einstufung"}[cm.stateMnwMhw]||"");
    const cls=LT&&M.MW!=null?LT.cls:cm.stateMnwMhw==="high"?"bad":cm.stateMnwMhw==="low"?"warn":"ok";
    setKpi("k-rhein",fmt(cm.value)+"<small> "+esc(ts.unit||"cm")+"</small>",(LT&&LT.cmp?LT.cmp.replace(/ \(.*\)/,"")+" · ":"")+tr,cls);
    let html='<div class="row"><div><div class="big">'+fmt(cm.value)+'<span style="font-size:22px"> '+esc(ts.unit||"cm")+'</span></div><div class="muted">'+esc(wName)+' · '+tr+(cm.timestamp?' · '+hhmm(cm.timestamp)+' Uhr':'')+'</div></div><span class="pill p-'+cls+'"><i></i>'+esc(stateDe||"–")+'</span></div>'+(LT&&LT.cmp?'<div class="cmp">'+esc(LT.cmp)+'</div>':'')+levelScale(cm.value,M)+
      (cvRaw.length?'<div class="muted small">'+["NNW","MNW","MW","MHW","HSW","HHW"].filter(k=>M[k]!=null).map(k=>k+" "+fmt(M[k])).join(" · ")+(C.isDus?" · Hochwassermarke I 710 · II 830":"")+' cm <span title="NNW niedrigster, MNW mittlerer niedrigster, MW Mittel-, MHW mittlerer höchster, HSW höchster Schifffahrtswasserstand, HHW höchster bekannter Wasserstand">ⓘ</span></div>':'');
    if(Array.isArray(hist)&&hist.length>2)html+=spark(hist);
    const vals=Array.isArray(hist)?hist.map(h=>h.value):[];
    html+='<div class="facts">'+(wt&&wt.currentMeasurement?fact(fmt(wt.currentMeasurement.value,1)+" °C","Wassertemperatur"):"")+
      fact(vals.length?fmt(Math.min(...vals))+" – "+fmt(Math.max(...vals)):"–","Spanne 7 Tage")+
      fact(vals.length?(cm.value-vals[0]>0?"+":"")+fmt(cm.value-vals[0]):"–","Änderung 7 Tage")+
      (!C.isDus&&st.km!=null?fact(fmt(distKm(C.lat,C.lon,st.latitude,st.longitude),0)+" km","Entfernung"):"")+'</div>'+
      (C.isDus?'<div class="muted small">Schifffahrt: '+link("https://www.elwis.de/","ELWIS")+'</div>':'<div class="muted small">Nächster Pegel der Bundeswasserstraßen. Landesgewässer: '+link("https://www.hochwasserzentralen.de/","Hochwasserzentralen")+'</div>');
    $("pegel").innerHTML=html;setStatus("pegel",true);loadRheinWV(uuid,cm.value);
  }catch(e){const w=$("pegel-wv");if(w)w.innerHTML="";setStatus("pegel",false,errText(e));$("pegel").innerHTML=stateBox("Pegel nicht verfügbar – "+errText(e)+".",link("https://www.pegelonline.wsv.de/gast/start","PEGELONLINE"));setKpi("k-rhein","–","kein Pegel","info");}
}
/* Landespegel (Düssel, Anger, Itter …) auch für die Lage-Mail vorhalten */
let LP_LAST=null;async function lpLoad(){if(LP_LAST)return LP_LAST;try{const d=await getData("landespegel.json");LP_LAST=(d.data||[]).filter(x=>x.value!=null);}catch(e){LP_LAST=[];}return LP_LAST;}
async function loadLandespegel(){
  const fb=document.querySelector('.tabseg[data-tabs="pg"] [data-t="fl"]');if(fb)fb.hidden=!C.isDus;if(!C.isDus){if(fb&&fb.classList.contains("on"))tabSet("pg","rhein");return;}
  try{const d=await getData("landespegel.json");const l=(d.data||[]).filter(x=>x.value!=null).sort((a,b)=>["Düssel","Anger","Itter"].indexOf(a.water)-["Düssel","Anger","Itter"].indexOf(b.water));
    if(!l.length)throw new Error("keine Messwerte");LP_LAST=l;
    $("landespegel").innerHTML=l.map(x=>{const M={MNW:x.mnw,MW:x.mw,MHW:x.mhw,I:x.i1,II:x.i2,III:x.i3};const t=levelText(x.value,M,x.unit);
      return '<div class="lp"><div class="lp-h"><div><b>'+esc(x.water)+'</b> <span class="muted small">Pegel '+esc(x.name.replace(/_\d+$/,""))+'</span></div><span class="lp-v">'+fmt(x.value,x.value<100?1:0)+' <small>'+esc(x.unit)+'</small></span></div>'+
        '<div class="row" style="gap:6px;margin-top:4px"><span class="pill p-'+t.cls+'"><i></i>'+esc(t.st)+'</span></div>'+(t.cmp?'<div class="cmp small">'+esc(t.cmp)+'</div>':'')+levelScale(x.value,M)+
        '<div class="muted small">'+[["MNW",x.mnw],["MW",x.mw],["MHW",x.mhw],["Info 1",x.i1],["Info 2",x.i2],["Info 3",x.i3]].filter(([,v])=>v).map(([k,v])=>k+" "+fmt(v)).join(" · ")+' '+esc(x.unit)+(x.time?' · Stand '+hhmm(x.time)+' Uhr':'')+'</div></div>';}).join("")+
      '<div class="muted small" style="margin-top:6px">Informationswerte 1–3 sind die Hochwasser-Meldestufen des Landes NRW. '+link("https://hochwasserportal.nrw.de/","Hochwasserportal NRW")+'</div>';
    const worst=l.map(x=>levelText(x.value,{MNW:x.mnw,MW:x.mw,MHW:x.mhw,I:x.i1,II:x.i2,III:x.i3}).cls);
    setStatus("landespegel",true,"Stand "+dataAge(d));
    TILE_LP=worst.includes("crit")||worst.includes("bad")?"Düssel/Anger erhöht":"";
  }catch(e){$("landespegel").innerHTML=stateBox("Landespegel nicht verfügbar – "+errText(e)+".",link("https://hochwasserportal.nrw.de/","Hochwasserportal NRW"));}
}
let TILE_LP="";
function spark(h){
  const W=640,H=110,p=8,pl=40;const v=h.map(x=>x.value),t=h.map(x=>new Date(x.timestamp).getTime());
  let mn=Math.min(...v),mx=Math.max(...v);if(mx-mn<10){mx+=5;mn-=5;}
  const x=i=>pl+(t[i]-t[0])/(t[t.length-1]-t[0]||1)*(W-pl-p),y=val=>p+(H-2*p-14)*(1-(val-mn)/(mx-mn));
  let d="",a="M"+x(0)+" "+(H-14);v.forEach((val,i)=>{if(i%2&&i!==v.length-1)return;d+=(d?"L":"M")+x(i).toFixed(1)+" "+y(val).toFixed(1);a+="L"+x(i).toFixed(1)+" "+y(val).toFixed(1);});
  a+="L"+x(v.length-1)+" "+(H-14)+"Z";const L=v.length-1;
  let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Pegelverlauf der letzten 7 Tage">';
  [mn,mx].forEach(g=>{s+='<line x1="'+pl+'" x2="'+(W-p)+'" y1="'+y(g)+'" y2="'+y(g)+'" stroke="var(--line)"/><text x="'+(pl-6)+'" y="'+(y(g)+4)+'" text-anchor="end">'+Math.round(g)+'</text>';});
  s+='<path d="'+a+'" fill="var(--accent)" opacity=".1"/><path d="'+d+'" fill="none" stroke="var(--accent)" stroke-width="2"/>';
  s+='<circle cx="'+x(L)+'" cy="'+y(v[L])+'" r="4" fill="var(--accent)" stroke="var(--panel)" stroke-width="2"/>';
  s+='<text x="'+pl+'" y="'+(H-2)+'">vor 7 Tagen</text><text x="'+(W-p)+'" y="'+(H-2)+'" text-anchor="end">jetzt</text>';
  return s+'</svg>';
}

// ================= Open Data Düsseldorf =================
const ODD="https://opendata.duesseldorf.de/api/3/action/";
async function oddResource(query,prefer){
  const d=await getJSON(ODD+"package_search?rows=8&q="+encodeURIComponent(query),20000);
  const list=d.result&&d.result.results||[];
  const pk=list.find(p=>/düsseldorf/i.test(p.title||"")||/duesseldorf|d%C3%BCsseldorf/i.test(p.name||""))||list[0];
  if(!pk)throw new Error("Datensatz nicht gefunden");
  const res=(pk.resources||[]).filter(r=>/json/i.test(r.format||"")||/\.(geo)?json(\?|$)/i.test(r.url||""));
  const r=(prefer&&res.find(x=>prefer.test((x.name||"")+" "+(x.description||""))))||res[0];
  if(!r)throw new Error("keine JSON-Ressource");
  return {pk,url:r.url};
}
function normalizePlaces(j){
  let arr=Array.isArray(j)?j:j&&(j.features||j.data||j.results||j.items||j.records||Object.values(j).find(Array.isArray))||[];
  const pickKey=(o,re)=>{const k=Object.keys(o).find(k=>re.test(k));return k?o[k]:undefined;};
  return arr.map(it=>{
    let o=it&&it.properties?{...it.properties}:{...it};
    let lat=pickKey(o,/^(lat|latitude|breite|y)$/i),lon=pickKey(o,/^(lon|lng|long|longitude|laenge|länge|x)$/i);
    if((lat==null||lon==null)&&it&&it.geometry&&Array.isArray(it.geometry.coordinates)){lon=it.geometry.coordinates[0];lat=it.geometry.coordinates[1];}
    const name=pickKey(o,/^(name|bezeichnung|titel|title|standort|parkhaus)$/i)||pickKey(o,/name/i)||"";
    const addr=pickKey(o,/adresse|zufahrt|strasse|straße|anschrift|address/i)||"";
    const ort=pickKey(o,/^ort$|stadtteil/i)||"";
    const anz=pickKey(o,/anzahl|plaetze|plätze|stellpl|number|kapazit/i);
    const note=pickKey(o,/zeit|hinweis|bemerkung|note/i)||"";
    return {name:String(name),addr:String(addr),ort:String(ort),anz,note:String(note),lat:parseFloat(String(lat).replace(",",".")),lon:parseFloat(String(lon).replace(",","."))};
  }).filter(p=>isFinite(p.lat)&&isFinite(p.lon));
}
async function loadParking(){
  const parts=[["pr","odd-pr.json"],["bh","odd-bh.json"]];
  let ok=0;
  await Promise.all(parts.map(async([k,f])=>{try{PARK[k]=(await getData(f)).data;ok++;}catch(e){}}));
  setStatus("park",ok>0,ok?(ok<parts.length?"teilweise":""):"Daten fehlen");
  renderParking();
}
function PKREF(){return C.isDus?{lat:C.lat,lon:C.lon}:(HOMES.dus&&isFinite(HOMES.dus.lat)?HOMES.dus:{lat:51.2254,lon:6.7763});}
function renderParking(){
  const R=PKREF();
  const near=(list,n,max)=>(list||[]).map(p=>({...p,km:distKm(R.lat,R.lon,p.lat,p.lon)})).filter(p=>!max||p.km<=max).sort((x,y)=>x.km-y.km).slice(0,n);
  const route=p=>NAVTO(p.lat,p.lon,p.addr||p.vti_anschrift);
  const box=(id,list,label,n,max)=>{
    if(!list){$(id).innerHTML=stateBox(label+" nicht verfügbar.");return;}
    const s=near(list,n||5,max);
    if(!s.length){$(id).innerHTML=stateBox("Keine Einträge in der Nähe.");return;}
    $(id).innerHTML='<div class="list">'+s.map(p=>'<div class="li"><span class="tag alt">'+fmt(p.km,1)+' km</span><div class="t">'+esc(p.name||p.addr||label)+'</div><div class="r"></div><div class="d">'+esc([p.name?p.addr:"",p.info].filter(Boolean).join(" · "))+route(p)+'</div></div>').join("")+'</div>';
  };
  box("park-pr",PARK.pr,"P+R-Anlagen",6);box("park-bh",PARK.bh,"Behindertenparkplätze",6);
  renderGarages();
}
// Parkhäuser live (Verkehrszentrale)
let GARAGES=null;
async function loadGarages(){
  try{const d=await getJSON(VT+"vtinfo:Parkhaeuser",20000);GARAGES=(d.features||[]).map(f=>({...f.properties,lon:f.geometry&&f.geometry.coordinates[0],lat:f.geometry&&f.geometry.coordinates[1]}));setStatus("vt",true);}
  catch(e){GARAGES=null;setStatus("vt",false,errText(e));}
  renderGarages();
}
function renderGarages(){
  const R=PKREF();
  if(!GARAGES){$("park-ph").innerHTML=stateBox("Parkhaus-Belegung nicht verfügbar.",link("https://vtmanager.duesseldorf.de/info/?parkquartier#main","Verkehrszentrale"));return;}
  const s=GARAGES.map(p=>({...p,km:distKm(R.lat,R.lon,p.lat,p.lon)})).sort((a,b)=>a.km-b.km).slice(0,8);
  {const g=s.find(p=>p.status===1&&p.kurzparkermax&&p.kurzparkerbelegt!=null);if(g){TILE_PARTS.traffic.park=fmt(Math.max(0,g.kurzparkermax-g.kurzparkerbelegt))+" frei im Parkhaus "+(g.bezeichnung||g.name);composeTile("k-traffic","traffic");}if(false)setKpi("k-park",fmt(Math.max(0,g.kurzparkermax-g.kurzparkerbelegt))+"<small> frei</small>",(g.bezeichnung||g.name)+" · "+fmt(g.km,1)+" km",(g.kurzparkerbelegt/g.kurzparkermax)>=.95?"bad":"ok");}
  const tr=t=>t>0?"↑":t<0?"↓":"";
  $("park-ph").innerHTML='<div class="list">'+s.map(p=>{const max=p.kurzparkermax,used=p.kurzparkerbelegt,free=(max!=null&&used!=null)?Math.max(0,max-used):null;
    const q=max&&used!=null?used/max:null;const cls=q==null||p.status!==1?"":q>=.95?"bad":q>=.8?"warn":"ok";
    return '<div class="li"><span class="tag alt">'+fmt(p.km,1)+' km</span><div class="t">'+esc(p.bezeichnung||p.name)+'</div>'+
      '<div class="r">'+(free!=null&&p.status===1?'<span class="pill p-'+cls+'"><i></i>'+fmt(free)+' frei '+tr(p.tendenz)+'</span>':'<span class="muted small">keine Belegung</span>')+'</div>'+
      '<div class="d">'+[max?fmt(max)+" Plätze":"",p.durchfahrtshoehe?"Höhe "+fmt(p.durchfahrtshoehe,2)+" m":""].filter(Boolean).join(" · ")+'</div>'+NAVTO(p.lat,p.lon,p.vti_anschrift)+'</div>';}).join("")+'</div>';
}

// ================= Stadtverkehr Düsseldorf (Verkehrszentrale) =================
const VT="https://vtmanager.duesseldorf.de/geoserverwfs?service=WFS&version=1.1.0&request=GetFeature&outputFormat=application/json&srsName=EPSG:4326&typeName=";
async function loadVT(){
  try{
    const [sp,me,ve]=await Promise.all(["vtinfo:Sperrungen","vtinfo:Meldungen","vtinfo:Veranstaltungen"].map(t=>getJSON(VT+t,20000)));
    const now=Date.now(),wk=now+7*864e5;
    const norm=(f,kind)=>{const p=f.properties||{};return {id:p.messageid||p.fid,kind,name:p.name||"",short:p.textshort||"",text:p.textlong||"",addr:p.address||"",from:p.startevent,to:p.endevent,geo:f.geometry};};
    const dedupe=list=>{const m=new Map();list.forEach(x=>{const k=x.id+"|"+x.name;const o=m.get(k);
      // bei wiederkehrenden Zeitfenstern das nächste/aktuelle behalten
      if(!o||(new Date(x.to)>=now&&(new Date(x.from)<new Date(o.from)||new Date(o.to)<now)))m.set(k,x);});return [...m.values()];};
    const all=dedupe([...(sp.features||[]).map(f=>norm(f,"Sperrung")),...(me.features||[]).map(f=>norm(f,"Meldung"))]);
    const active=all.filter(x=>new Date(x.from)<=now&&new Date(x.to)>=now).sort((a,b)=>(a.kind==="Sperrung"?0:1)-(b.kind==="Sperrung"?0:1)||new Date(b.from)-new Date(a.from));
    const soon=all.filter(x=>new Date(x.from)>now&&new Date(x.from)<=wk).sort((a,b)=>new Date(a.from)-new Date(b.from));
    const ev=dedupe((ve.features||[]).map(f=>norm(f,"Veranstaltung"))).filter(x=>new Date(x.to)>=now).sort((a,b)=>new Date(a.from)-new Date(b.from));
    VTGEO={active,ev};
    const range=x=>dateTime(x.from)+" – "+(isoDay(new Date(x.from))===isoDay(new Date(x.to))?hhmm(x.to):dateTime(x.to));
    const pt=g=>{let c=g&&g.coordinates;while(Array.isArray(c)&&Array.isArray(c[0]))c=c[0];return Array.isArray(c)&&isFinite(c[1])&&Math.abs(c[1])<=90?c:null;};
    const item=(x,badge)=>{const c=pt(x.geo);return '<div class="li" data-kat="'+(badge?"meld":x.kind==="Sperrung"?"sperr":"bau")+'"'+(c?' data-lat="'+c[1]+'" data-lon="'+c[0]+'"':'')+'><span class="tag '+(x.kind==="Sperrung"?"ab":"alt")+'">'+esc(badge||x.kind)+'</span><div class="t"><b class="ortp"></b>'+esc(x.short||x.name)+'</div><div class="r"></div>'+
      '<div class="d">'+esc(range(x))+(x.text?'<details><summary>Details</summary>'+esc(x.text)+'</details>':'')+'</div></div>';};
    const nSp=active.filter(x=>x.kind==="Sperrung").length;
    TILE_PARTS.traffic.vt=nSp+" Sperrungen in der Stadt";composeTile("k-traffic","traffic");
    if(false)setKpi("k-vt",String(nSp)+"<small> Sperrungen</small>",ev.length?ev.length+" Veranstaltung(en) angekündigt":"keine Veranstaltungen",nSp>30?"warn":"info");
    $("vt-sum").innerHTML=fact(String(nSp),"Sperrungen aktiv")+fact(String(active.length-nSp),"Meldungen / Baustellen")+fact(String(ev.length),"Veranstaltungen angekündigt")+fact(String(soon.length),"neu in 7 Tagen");
    [...$("vt-sum").children].forEach((f,i)=>{f.dataset.vtgo=["now","now","events","next"][i];f.setAttribute("role","button");f.style.cursor="pointer";});
    $("vt-now").innerHTML=active.length?'<div class="list">'+active.slice(0,60).map(x=>item(x)).join("")+'</div>'+(active.length>60?'<div class="muted small">+ '+(active.length-60)+' weitere</div>':''):'<div class="state good">Keine aktiven Sperrungen.</div>';
    $("vt-events").innerHTML=ev.length?'<div class="list">'+ev.slice(0,8).map(x=>item(x,"Event")).join("")+'</div>':'<div class="state good">Keine angekündigten Veranstaltungen.</div>';
    $("vt-next").innerHTML=soon.length?'<div class="list">'+soon.slice(0,8).map(x=>item(x)).join("")+'</div>':'<div class="state good">Nichts Neues angekündigt.</div>';
    {const el=$("ev-list"),en=$("ev-next");if(el){el.innerHTML=ev.length?'<div class="list">'+ev.slice(0,30).map(x=>item(x,"Event")).join("")+'</div>':'<div class="state good">Keine angekündigten Veranstaltungen.</div>';fillOrte(el);}
      if(en){en.innerHTML=soon.length?'<div class="list">'+soon.slice(0,20).map(x=>item(x)).join("")+'</div>':'<div class="state good">Nichts Neues angekündigt.</div>';fillOrte(en);}
      const td=ev.filter(x=>new Date(x.from)<=now).length;setKpi("k-events",String(ev.length)+"<small> angekündigt</small>",td?td+" laufen gerade":(ev[0]?"nächste: "+dateTime(ev[0].from):"keine"),ev.length?"info":"ok");}
    setStatus("vt",true);drawVTOnMap();fillOrte($("vt-now")).then(()=>fillOrte($("vt-next"))).then(()=>fillOrte($("vt-events")));
  }catch(e){setStatus("vt",false,errText(e));["vt-now","vt-events","vt-next"].forEach(id=>$(id).innerHTML=stateBox("Nicht verfügbar – "+errText(e)+".",link("https://vtmanager.duesseldorf.de/info/","Verkehrszentrale")));}
}
let VTGEO=null,VTLAYER=null;
function drawVTOnMap(){
  if(!MAP||typeof L==="undefined")return;
  if(VTLAYER){VTLAYER.remove();VTLAYER=null;}
  if(!VTGEO)return;
  VTLAYER=L.layerGroup().addTo(MAP);
  VTGEO.active.filter(x=>x.kind==="Sperrung"&&x.geo).forEach(x=>L.geoJSON(x.geo,{style:{color:"#7d1f6b",weight:5,opacity:.85,dashArray:"6 4"}}).bindPopup("<b>Sperrung</b><br>"+esc(x.short||x.name)).addTo(VTLAYER));
  VTGEO.ev.filter(x=>x.geo).forEach(x=>L.geoJSON(x.geo,{style:{color:"#0b6e8a",weight:5,opacity:.8}}).bindPopup("<b>Veranstaltung</b><br>"+esc(x.short||x.name)+"<br>"+dateTime(x.from)).addTo(VTLAYER));
}

// ================= Polizei & Feuerwehr =================
async function loadEinsaetze(){
  const card=$("einsaetze-card");card.hidden=C.key!=="datteln";if(card.hidden)return;
  try{const d=await getData("einsaetze-kreis-re.json");
    // nur die letzten 48 Stunden – laufende Einsätze bleiben immer sichtbar
    const ts=x=>{const m=String(x.date).match(/(\d{2})\.(\d{2})\.(\d{4})/);return m?new Date(m[3]+"-"+m[2]+"-"+m[1]+"T"+(x.time||"00:00:00")).getTime():Date.now();};
    const all=(d.data.rows||[]).filter(x=>x.laufend||Date.now()-ts(x)<=48*3600e3);
    const here=all.filter(x=>/datteln/i.test(x.ort)),other=all.filter(x=>!/datteln/i.test(x.ort));
    const tbl=(rows)=>'<div class="ein-list">'+rows.map(x=>'<div class="ein'+(x.laufend?" run":"")+'"><div class="z"><b>'+esc(x.time.slice(0,5))+'</b><div class="muted small">'+esc(x.date.slice(0,6))+'</div></div><div class="s">'+esc(x.stichwort)+'</div>'+
      (x.laufend?'<span class="pill p-bad"><i></i>läuft</span>':'<span class="pill p-ok"><i></i>beendet</span>')+'<div class="o">'+esc(x.ort)+(x.strasse?' · '+esc(x.strasse):'')+'</div></div>').join("")+'</div>';
    const running=here.filter(x=>x.laufend).length;
    setKpi("k-ein",String(here.length)+"<small> in Datteln</small>",here[0]?here[0].stichwort+" · "+here[0].date.slice(0,6):"keine Einsätze in Datteln",running?"bad":here.length?"warn":"ok");
    $("einsaetze").innerHTML='<div class="facts">'+fact(String(here.length),"Einsätze Datteln")+fact(String(running),"laufend in Datteln")+fact(String(all.length),"Einsätze im Kreis")+fact(esc(d.data.updated||"–"),"Stand Leitstelle")+'</div>'+
      '<div class="sublbl">Datteln</div>'+(here.length?tbl(here):'<div class="state good">Keine Einsätze in Datteln im angezeigten Zeitraum.</div>')+
      '<details style="margin-top:8px"><summary>Übrige Einsätze im Kreis Recklinghausen ('+other.length+')</summary>'+tbl(other)+'</details>'+
      '<div class="muted small">Kreisleitstelle Recklinghausen, ohne Rettungsdienst-Einsätze · angezeigt: letzte 48 Stunden, laufende Einsätze immer · abgerufen '+dataAge(d)+' · '+link("https://www.kreis-re.de/inhalte/buergerservice/leben_und_wohnen/feuerwehr-_und_rettungsleitstelle/_einsaetze_der_feuerwehren/index.asp","Originalliste")+'</div>';
    setStatus("einsaetze",true,"Stand "+dataAge(d));
  }catch(e){setStatus("einsaetze",false,errText(e));$("einsaetze").innerHTML=stateBox("Einsatzliste nicht verfügbar – "+errText(e)+".",link("https://www.kreis-re.de/inhalte/buergerservice/leben_und_wohnen/feuerwehr-_und_rettungsleitstelle/_einsaetze_der_feuerwehren/index.asp","Originalliste"));}
}
// Zusammengefasste Kacheln: Teilinformationen sammeln
const TILE_PARTS={traffic:{},mobil:{}};
function composeTile(id,group,main,cls){
  const parts=TILE_PARTS[group];const el=$(id);if(!el)return;
  if(main)parts._main=main;if(cls)parts._cls=cls;
  const ORD=["bahn","bus","ab","vt"];const notes=Object.entries(parts).filter(([k])=>!k.startsWith("_")).sort((a,b)=>(ORD.indexOf(a[0])+99)%199-(ORD.indexOf(b[0])+99)%199).map(([,v])=>v).filter(Boolean);
  const RK=["ok","info","warn","bad","crit"];let cl2=parts._cls||"info";if(parts._rcls&&(group==="traffic"||RK.indexOf(parts._rcls)>RK.indexOf(cl2)))cl2=parts._rcls;
  setKpi(id,parts._main||"–",notes.join(" · "),cl2);
}
// ================= Bahn-Verbindungen =================
const TRIP_KEYS={dus:["dus-re","re-dus"],datteln:["re-dus","dus-re"]};
// Bahnhöfe je Ort und Kürzel für die Bahnverbindungen
const STN={dus:["dus","Düsseldorf Hbf"],datteln:["re","Recklinghausen Hbf"],dortmund:["do","Dortmund Hbf"],alpen:["al","Alpen"],salzhausen:["wl","Winsen (Luhe)"]};
const CITYN={dus:"Düsseldorf",datteln:"Datteln",dortmund:"Dortmund",alpen:"Alpen-Menzelen",salzhausen:"Salzhausen"};
const CITYPAIRS=(()=>{const core=["dus","datteln","dortmund"],o=[];for(const a of core)for(const b of core)if(a!==b)o.push([a,b]);for(const x of ["alpen","salzhausen"])for(const b of core){o.push([x,b]);o.push([b,x]);}o.push(["alpen","salzhausen"],["salzhausen","alpen"]);return o;})();
const RSTRIP=Object.fromEntries(CITYPAIRS.map(([a,b])=>[a+">"+b,STN[a][0]+"-"+STN[b][0]]));
/* Bahnverbindungen live: Regional-/S-Bahn-Verbindungen über den eigenen VRR-Vermittler frisch holen und mit den gesammelten Daten
   (inkl. DB-Fernverkehr aus IRIS) zusammenführen – Verspätungen und Ausfälle sind so sekundenaktuell */
const TRIPLIVE={},TRIPLIVE_BUSY={};let FERNDONE=null;let TRIPLIVE_T=null;const TRIPSTOP=load("tripstops")||{};
const tsName=x=>{if(!x)return"";let p=x;while(p&&p.type&&p.type!=="stop"&&p.parent)p=p.parent;const n=(p&&p.name)||x.name||"";const pa=n.split(", ");return pa.length===2&&pa[1].startsWith(pa[0])?pa[1]:n;};
async function tripStopId(name){if(TRIPSTOP[name])return TRIPSTOP[name];const base=(typeof EFAPROXY!=="undefined"&&EFAPROXY)||"";if(!base)throw 0;
  const sf=await getJSON(base.replace(/\/+$/,"")+"/standard/XML_STOPFINDER_REQUEST?outputFormat=rapidJSON&language=de&type_sf=any&name_sf="+encodeURIComponent(name),7000);
  const l=(sf.locations||[]).filter(x=>x.type==="stop").sort((a,b)=>(b.isBest?1:0)-(a.isBest?1:0))[0];if(!l)throw 0;TRIPSTOP[name]=l.id;store("tripstops",TRIPSTOP);return l.id;}
async function tripLiveFetch(t){TRIPLIVE_BUSY[t.key]=1;try{const base=((typeof EFAPROXY!=="undefined"&&EFAPROXY)||"").replace(/\/+$/,"");if(!base)return false;
    const a=await tripStopId(t.from),b=await tripStopId(t.to);
    const excl="&excludedMeans=checkbox"+[2,3,4,5,6,7,8,9,10,11,19].map(n=>"&exclMOT_"+n+"=1").join("");
    const d=await getJSON(base+"/standard/XML_TRIP_REQUEST2?outputFormat=rapidJSON&language=de&type_origin=any&name_origin="+encodeURIComponent(a)+"&type_destination=any&name_destination="+encodeURIComponent(b)+"&itdTripDateTimeDepArr=dep&calcNumberOfTrips=8&useRealtime=1&lineRestriction=400&routeType=LEASTTIME"+excl,9000);
    const js=(d.journeys||[]).map(j=>{const legs=(j.legs||[]).map(l=>{const tr=l.transportation||{},pc=tr.product&&tr.product.class;const pr=o=>o&&o.properties||{};
        return{line:tr.disassembledName||tr.number||tr.name||"",name:tr.name||"",walk:pc===99||pc===100||/fu(ß|ss)weg/i.test(tr.name||""),dir:tr.destination&&tr.destination.name||"",from:tsName(l.origin),to:tsName(l.destination),
          dep:l.origin&&l.origin.departureTimePlanned,depEst:l.origin&&l.origin.departureTimeEstimated,arr:l.destination&&l.destination.arrivalTimePlanned,arrEst:l.destination&&l.destination.arrivalTimeEstimated,
          plat:pr(l.origin).platformName||pr(l.origin).platform||"",arrPlat:pr(l.destination).platformName||pr(l.destination).platform||"",cancelled:(l.realtimeStatus||[]).includes("TRIP_CANCELLED")};});
      const ride=legs.filter(x=>!x.walk);const f=ride[0]||legs[0]||{},z=ride[ride.length-1]||legs[legs.length-1]||{};
      return{trainsOnly:ride.every(l=>/^(ICE|IC|EC|ECE|RE|RB|S|RRX|NX|FLX|NJ|TGV|THA)\s?\d*/i.test(l.line)||/zug|bahn/i.test(l.name)),dep:f.dep,depEst:f.depEst,arr:z.arr,arrEst:z.arrEst,changes:Math.max(0,ride.length-1),legs};}).filter(j=>j.dep&&j.trainsOnly);
    if(!js.length)return false;TRIPLIVE[t.key]={at:Date.now(),js};return true;}catch(e){return false;}finally{delete TRIPLIVE_BUSY[t.key];}}
/* ICE/IC live: DB-IRIS über den Vermittler (/iris/…) – Ist-Zeiten, Gleis und Ausfall je Zug an Abfahrts- und Ankunftsbahnhof */
const IRISC={},IRISEVA=load("iriseva")||{};let IRIS_OK=null;
const irisT=t=>{if(!t)return null;const y=2000+ +t.slice(0,2),mo=+t.slice(2,4)-1,d=+t.slice(4,6),h=+t.slice(6,8),mi=+t.slice(8,10);
  const g=new Date(Date.UTC(y,mo,d,12));const off=(()=>{const z=new Intl.DateTimeFormat("en-US",{timeZone:"Europe/Berlin",timeZoneName:"shortOffset"}).formatToParts(g).find(x=>x.type==="timeZoneName").value.match(/GMT([+-]\d+)/);return z?+z[1]*60:60;})();
  return new Date(Date.UTC(y,mo,d,h,mi)-off*6e4).toISOString();};
const irisParse=x=>{const o={};for(const m of x.matchAll(/<s id="([^"]+)"[^>]*>([\s\S]*?)<\/s>/g)){const b=m[2];const g=(str,k)=>(str.match(new RegExp(k+'="([^"]*)"'))||[])[1];
  const tl=(b.match(/<tl ([^>]*)\/?>/)||[])[1]||"",dp=(b.match(/<dp ([^>]*)\/?>/)||[])[1]||"",ar=(b.match(/<ar ([^>]*)\/?>/)||[])[1]||"";
  o[m[1]]={c:g(tl,"c"),n:g(tl,"n"),dpT:g(dp,"pt"),dpCt:g(dp,"ct"),dpCs:g(dp,"cs"),dpPp:g(dp,"cp")||g(dp,"pp"),arT:g(ar,"pt"),arCt:g(ar,"ct"),arCs:g(ar,"cs"),arPp:g(ar,"cp")||g(ar,"pp")};}return o;};
async function irisText(path){const base=((typeof EFAPROXY!=="undefined"&&EFAPROXY)||"").replace(/\/+$/,"");const r=await fetch(base+"/iris/"+path);if(!r.ok)throw new Error("HTTP "+r.status);return r.text();}
async function irisStation(name){const k=name.replace(/\s+/g," ").trim();const c=IRISC[k];if(c&&Date.now()-c.at<45000)return c.map;
  let eva=IRISEVA[k];if(!eva){const x=await irisText("station/"+encodeURIComponent(k.replace(/^Winsen ?\(Luhe\)$/,"Winsen(Luhe)").replace(/\s+(Bahnhof|Bf\.?)$/i,"")));const m=x.match(/eva="(\d+)"/);if(!m)throw 0;eva=m[1];IRISEVA[k]=eva;store("iriseva",IRISEVA);}
  const all={};const hrs=[0,1,2,3].map(h=>{const p=new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin",year:"2-digit",month:"2-digit",day:"2-digit",hour:"2-digit",hour12:false}).formatToParts(new Date(Date.now()+h*3600e3)).reduce((o,x)=>(o[x.type]=x.value,o),{});return p.year+p.month+p.day+"/"+p.hour;});
  await Promise.all(hrs.map(async h=>{try{Object.assign(all,irisParse(await irisText("plan/"+eva+"/"+h)));}catch(e){}}));
  try{const ch=irisParse(await irisText("fchg/"+eva));for(const [id,v] of Object.entries(ch))if(all[id]){const a=all[id];for(const f of ["dpCt","arCt","dpCs","arCs","dpPp","arPp"])if(v[f])a[f]=v[f];}}catch(e){}
  const map={};for(const v of Object.values(all))if(v.c&&v.n)map[v.c+" "+v.n]=v;IRISC[k]={at:Date.now(),map};return map;}
const FERN=/^(ICE|IC|EC|ECE|NJ|FLX)\s?\d+/i;
async function fernLive(list){let ch=false;const names=new Set();
  list.forEach(t=>(t.journeys||[]).forEach(j=>j.legs.forEach(l=>{if(!l.walk&&FERN.test(l.line)){names.add(l.from);names.add(l.to);}})));
  if(!names.size)return false;const maps={};await Promise.all([...names].map(async n=>{try{maps[n]=await irisStation(n);}catch(e){}}));
  if(!Object.keys(maps).length){IRIS_OK=false;return false;}IRIS_OK=true;
  list.forEach(t=>(t.journeys||[]).forEach(j=>{let touched=false;j.legs.forEach(l=>{if(l.walk||!FERN.test(l.line))return;const key=l.line.replace(/\s+/," ").trim().replace(/^(\D+)(\d)/,"$1 $2");
      const a=maps[l.from]&&maps[l.from][key],b=maps[l.to]&&maps[l.to][key];
      if(a&&a.dpT){l.depEst=irisT(a.dpCt||a.dpT);if(a.dpPp)l.plat=a.dpPp;if(a.dpCs==="c")l.cancelled=true;touched=true;l.irisLive=true;}
      if(b&&b.arT){l.arrEst=irisT(b.arCt||b.arT);if(b.arPp)l.arrPlat=b.arPp;if(b.arCs==="c")l.cancelled=true;touched=true;l.irisLive=true;}});
    if(touched){const r=j.legs.filter(x=>!x.walk);if(r[0])j.depEst=r[0].depEst;if(r.length)j.arrEst=r[r.length-1].arrEst;ch=true;}}));
  return ch;}
function tripLiveMerge(t){const L=TRIPLIVE[t.key];if(!L||Date.now()-L.at>180000)return t;
  const sig=j=>j.dep+"|"+j.legs.filter(l=>!l.walk).map(l=>l.line).join(">");const m=new Map(L.js.map(j=>[sig(j),j]));
  const minLive=Math.min(...L.js.map(j=>new Date(j.dep).getTime())),maxLive=Math.max(...L.js.map(j=>new Date(j.dep).getTime()));
  const out=(t.journeys||[]).map(j=>{const lj=m.get(sig(j));if(lj){m.delete(sig(j));return lj;}return j;});
  m.forEach(j=>out.push(j));out.sort((x,y)=>new Date(x.dep)-new Date(y.dep));
  return{...t,journeys:out,live:true,liveRange:[minLive,maxLive]};}
async function loadTrips(opt){opt=opt||{};
  const keys=opt.keys||(typeof RS!=="undefined"&&RS.tdir?[RSTRIP[RS.tdir]]:(TRIP_KEYS[C.key]||[]));const box=opt.box||$("trips");
  if(!keys.length){box.innerHTML="";box.hidden=true;return;}
  box.hidden=false;
  try{const d=await getData("trips.json");const list=(d.data||[]).filter(t=>keys.includes(t.key)).sort((a,b)=>keys.indexOf(a.key)-keys.indexOf(b.key)).map(t=>tripLiveMerge(t));
    if(opt._fern)await fernLive(list);
    {const stale=list.filter(t=>t.from&&t.to&&!(TRIPLIVE[t.key]&&Date.now()-TRIPLIVE[t.key].at<45000)&&!TRIPLIVE_BUSY[t.key]);
     if(stale.length)Promise.all(stale.map(t=>tripLiveFetch(t))).then(ch=>{if(ch.some(Boolean)&&box.isConnected&&box.offsetParent!==null)loadTrips(opt);});
     if(!opt._fern)fernLive(list).then(c=>{if(c&&box.isConnected&&box.offsetParent!==null){FERNDONE=list;loadTrips({...opt,_fern:1});}});
     clearTimeout(TRIPLIVE_T);TRIPLIVE_T=setTimeout(()=>{if(box.isConnected&&box.offsetParent!==null)loadTrips(opt);},50000);}
    const liveAll=list.length&&list.every(t=>t.live);
    const t2=x=>x?hhmm(x):"–";
    const del=(p,e)=>{if(!p||!e)return"";const m=Math.round((new Date(e)-new Date(p))/6e4);return m>0?' <span style="color:var(--bad);font-weight:600">+'+m+'</span>':"";};
    const now=Date.now()-60e3;
    if(!opt.box){const first=k=>{const t=list.find(x=>x.key===k);const j=t&&(t.journeys||[]).find(j=>new Date(j.depEst||j.dep).getTime()>=now);return j;};
      const k1=C.isDus?"dus-re":"re-dus",j=first(k1);
      if(j){const m=j.depEst&&j.dep?Math.round((new Date(j.depEst)-new Date(j.dep))/6e4):0;
        TILE_PARTS.mobil.bahn=(C.isDus?"Bahn nach Recklinghausen":"Bahn nach Düsseldorf")+" an "+hhmm(j.arrEst||j.arr);
        composeTile("k-bahn","mobil",hhmm(j.dep)+(m>0?'<small style="color:var(--bad)"> +'+m+'</small>':"")+"<small> "+esc((j.legs.find(l=>!l.walk)||{}).line||"")+"</small>",m>=10?"warn":"info");
        if(false)setKpi("k-bahn",hhmm(j.dep)+(m>0?'<small style="color:var(--bad)"> +'+m+'</small>':"")+"<small> "+esc((j.legs.find(l=>!l.walk)||{}).line||"")+"</small>",(C.isDus?"nach Recklinghausen":"nach Düsseldorf")+" · an "+hhmm(j.arrEst||j.arr)+" · "+j.changes+" Umst.",m>=10?"warn":"info");}
      else{TILE_PARTS.mobil.bahn="keine Bahn im abgerufenen Zeitraum";composeTile("k-bahn","mobil");}}
    box.innerHTML=list.map(t=>{
      const js=(t.journeys||[]).filter(j=>new Date(j.depEst||j.dep).getTime()>=now);
      const head='<div class="sublbl" style="margin-top:6px">'+esc(t.from)+' → '+esc(t.to)+'</div>';
      if(t.error||!js.length)return head+'<div class="state">'+(t.error?"Nicht verfügbar – "+esc(t.error):"Keine weiteren Fahrten im abgerufenen Zeitraum.")+'</div>';
      return head+'<div class="trips">'+js.map(j=>{
        const est=(p,e)=>e||p;const mins=(a,b)=>Math.round((new Date(b)-new Date(a))/6e4);
        const dur=j.arr&&j.dep?mins(est(j.dep,j.depEst),est(j.arr,j.arrEst)):null;
        const ride=j.legs.filter(l=>!l.walk);const cancelled=ride.some(l=>l.cancelled);
        // Umstiege prüfen: Zeit zwischen Ankunft und nächster Abfahrt (mit Echtzeit)
        const transfers=ride.slice(1).map((l,i)=>{const prev=ride[i];const m=mins(est(prev.arr,prev.arrEst),est(l.dep,l.depEst));return {at:l.from,m,fromPl:prev.arrPlat,toPl:l.plat,risk:m<2||prev.cancelled||l.cancelled};});
        const risk=transfers.some(t=>t.risk);
        const plat=p=>p?'<span class="pl">Gl. '+esc(p)+'</span>':'';
        const tm=(p,e)=>'<b>'+t2(p)+'</b>'+del(p,e);
        const summary='<summary><span class="tt">'+tm(j.dep,j.depEst)+' → '+tm(j.arr,j.arrEst)+'</span>'+
          '<span class="muted small jd">'+(dur!=null?Math.floor(dur/60)+":"+String(dur%60).padStart(2,"0")+" h":"")+' · '+j.changes+' Umst.'+(ride[0]&&ride[0].plat?' · ab Gl. '+esc(ride[0].plat):'')+'</span>'+
          (cancelled?'<span class="pill p-bad"><i></i>Ausfall</span>':risk?'<span class="pill p-warn"><i></i>Anschluss gefährdet</span>':'')+
          '<span class="lines">'+ride.map(l=>'<span class="tag" style="font-size:13px">'+esc(l.line)+'</span>').join(' › ')+'</span></summary>';
        const steps=ride.map((l,i)=>{
          const tr=i>0?transfers[i-1]:null;
          return (tr?'<div class="xfer'+(tr.risk?" bad":"")+'">Umstieg in <b>'+esc(tr.at)+'</b> · '+(tr.m>=0?tr.m+" min":"Anschluss verpasst")+(tr.fromPl||tr.toPl?' · von Gl. '+esc(tr.fromPl||"?")+' zu Gl. '+esc(tr.toPl||"?"):'')+(tr.risk?' · <b>knapp – bitte im DB Navigator prüfen</b>':'')+'</div>':'')+
            '<div class="leg'+(l.cancelled?" cx":"")+'"><div class="lg-head"><span class="tag">'+esc(l.line)+'</span>'+(l.dir?' <span class="muted small">Richtung '+esc(l.dir)+'</span>':'')+(l.cancelled?' <span class="pill p-bad"><i></i>fällt aus</span>':'')+'</div>'+
            '<div class="lg-row"><span>'+tm(l.dep,l.depEst)+'</span><span>'+esc(l.from)+'</span>'+plat(l.plat)+'</div>'+
            '<div class="lg-row"><span>'+tm(l.arr,l.arrEst)+'</span><span>'+esc(l.to)+'</span>'+plat(l.arrPlat)+'</div></div>';}).join("");
        return '<details class="trip'+(cancelled?" cx":risk?" warn":"")+'">'+summary+'<div class="trip-body">'+steps+'</div></details>';}).join("")+'</div>';}).join("")+
      '<div class="muted small">Antippen für Reiseverlauf mit Gleisen und Umstiegen · '+(liveAll?'<b style="color:var(--ok)">● live</b> ('+(IRIS_OK?'VRR & DB-Fernverkehr':'VRR-Echtzeit, Fernverkehr Stand '+dataAge(d))+')':'Echtzeit abgerufen '+dataAge(d))+'</div>';
    setStatus("trips",true,"Stand "+dataAge(d));
  }catch(e){setStatus("trips",false,errText(e));box.innerHTML=stateBox("Verbindungen nicht verfügbar – "+errText(e)+".",link("https://www.bahn.de/","bahn.de"));}
}
function tripQuery(){const f=$("trip-from").value.trim(),t=$("trip-to").value.trim();return {f,t};}
$("trip-form").addEventListener("submit",e=>{e.preventDefault();const {f,t}=tripQuery();if(!f){$("trip-from").focus();return;}if(!t){$("trip-to").focus();return;}
  const n=new Date();window.open(dbLink(f,t,isoDay(n),n.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"}),2),"_blank","noopener");});
$("trip-gm").addEventListener("click",()=>{const {f,t}=tripQuery();if(!f){$("trip-from").focus();return;}if(!t){$("trip-to").focus();return;}
  window.open("https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(f)+"&destination="+encodeURIComponent(t)+"&travelmode=transit","_blank","noopener");});

let BLORT=load("blort")||{};
document.addEventListener("click",e=>{const b=e.target.closest("#bl-orte [data-blo]");if(!b)return;BLORT[C.key]=b.dataset.blo;store("blort",BLORT);loadBlaulicht();});
async function loadBlaulicht(){
  $("bl-title").textContent="Pressemitteilungen Polizei & Feuerwehr "+C.town;
  if(!FAVKEYS.includes(C.key)){$("bl").innerHTML=stateBox("Meldungen sind für Düsseldorf und die Favoriten hinterlegt. Für "+C.town+":",link("https://www.presseportal.de/blaulicht/r/"+encodeURIComponent(C.town),"Presseportal "+C.town));return;}
  try{const d=await getData("blaulicht-"+C.key+".json");const list=d.data||[];BL_LAST={key:C.key,town:C.town,list};
    if(!list.length){$("bl").innerHTML='<div class="state good">Keine aktuellen Meldungen.</div>';setStatus("blaulicht",true);return;}
    const bday=x=>new Date(x).toLocaleDateString("sv-SE",{timeZone:"Europe/Berlin"});const td=bday(Date.now()),yd=bday(Date.now()-864e5);
    const day=list.filter(x=>bday(x.date)===td).length;
    const when=x=>{const d=bday(x.date);return (d===td?"heute":d===yd?"gestern":new Date(x.date).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}))+" "+hhmm(x.date);};
    setKpi("k-bl",String(day)+"<small> heute</small>",list[0]?"Neueste "+when(list[0])+": "+list[0].title.replace(/^(POL|FW)[-\w ]*:\s*/,"").slice(0,60):"","info");
    const tag=s=>/feuerwehr|^fw/i.test(s)?["FW","bad"]:/polizei|^pol/i.test(s)?["POL","ab"]:["INFO","alt"];
    const orte=[...new Set(list.map(x=>x.ort).filter(Boolean))];const sel=orte.includes(BLORT[C.key])?BLORT[C.key]:"";
    const shown=sel?list.filter(x=>x.ort===sel):list;
    $("bl").innerHTML=(orte.length>1?'<div class="stop-chips" id="bl-orte"><button type="button" data-blo="" class="'+(sel?"":"on")+'">Alle</button>'+orte.map(o=>'<button type="button" data-blo="'+esc(o)+'" class="'+(sel===o?"on":"")+'">'+esc(o)+' <span class="muted small">'+list.filter(x=>x.ort===o).length+'</span></button>').join("")+'</div>':'')+
      '<div class="list">'+shown.slice(0,15).map(x=>{const t=tag(x.source+" "+x.title);
      return '<div class="li"><span class="tag '+(t[1]==="bad"?"":t[1])+'" style="'+(t[1]==="bad"?"background:var(--bad);color:#fff":"")+'">'+t[0]+'</span><a class="t" href="'+esc(safeUrl(x.link))+'" target="_blank" rel="noopener" style="color:var(--fg);text-decoration:none">'+esc(x.title.replace(/^(POL|FW)[-\w ]*:\s*/,""))+'</a>'+
        '<span class="r muted small">'+dateTime(x.date)+'</span><div class="d">'+(orte.length>1&&x.ort?'<span class=\"ortc\">'+esc(x.ort)+'</span>':'')+esc(x.source)+' · '+esc(x.text.slice(0,220))+'</div></div>';}).join("")+'</div>'+
      '<div class="muted small">Offizielle Pressemeldungen · abgerufen '+dataAge(d)+' · '+link("https://www.presseportal.de/blaulicht/r/"+encodeURIComponent(C.isDus?"Düsseldorf":C.town),"alle Meldungen")+'</div>';
    setStatus("blaulicht",true,"Stand "+dataAge(d));
  }catch(e){setStatus("blaulicht",false,errText(e));$("bl").innerHTML=stateBox("Meldungen nicht verfügbar – "+errText(e)+".",link("https://www.presseportal.de/blaulicht/r/"+encodeURIComponent(C.town),"Presseportal"));}
}

// ================= Webcam-Seiten je Ort =================
// Webcams: img = direktes Kamerabild (nur https), sonst Link zur Webcam-Seite
const WEBCAM_LINKS={
  dus:[
    {t:"Burgplatz / Altstadt",hls:"https://ch-fra-n12.livespotting.com/vpu/a6mam24n/fxmwsxp6_720.m3u8",u:"https://www.duesseldorf.de/webcams/burgplatz-1",by:"Stadt Düsseldorf"},
    {t:"Rheinufer",hls:"https://ch-fra-n12.livespotting.com/vpu/a6mam24n/hvasmdro_720.m3u8",u:"https://www.duesseldorf.de/webcams/rheinufer-1",by:"Stadt Düsseldorf"},
    {t:"Flughafen · Vorfeld",hls:"https://stream-5gw.1000eyes.de/cupertino/dused0c.stream/playlist.m3u8",u:"https://www.dus.com/de-de/erleben/webcams",by:"Flughafen Düsseldorf"},
    {t:"Flughafen · Flugbetrieb",hls:"https://stream-5gw.1000eyes.de/cupertino/dusfcae.stream/playlist.m3u8",u:"https://www.dus.com/de-de/erleben/webcams",by:"Flughafen Düsseldorf"},
    {t:"Flughafen · Terminal",hls:"https://stream-5gw.1000eyes.de/cupertino/dusc926.stream/playlist.m3u8",u:"https://www.dus.com/de-de/erleben/webcams",by:"Flughafen Düsseldorf"},
    {t:"Flughafen · Rollweg",hls:"https://stream-5gw.1000eyes.de/cupertino/dus1ba9.stream/playlist.m3u8",u:"https://www.dus.com/de-de/erleben/webcams",by:"Flughafen Düsseldorf"},
    {t:"Flughafen · Abfertigung",hls:"https://stream-5gw.1000eyes.de/cupertino/dus5abb.stream/playlist.m3u8",u:"https://www.dus.com/de-de/erleben/webcams",by:"Flughafen Düsseldorf"},
    {t:"Stadtwerke · Lausward",off:"liefert derzeit kein Bild",u:"https://www.swd-ag.de/ueber-uns/erzeugung-standorte/webcam/",by:"Stadtwerke Düsseldorf"},
    {t:"Unterbacher See · West",img:"https://unterbachersee.de/wp-content/uploads/webcam-west.jpg",u:"https://unterbachersee.de/webcam/",by:"Unterbacher See · Bild alle paar Minuten neu"}],
  datteln:[
    {t:"Haltern am See · Marktplatz (ca. 15 km)",u:"https://www.windfinder.com/webcams/datteln"},
    {t:"Dortmund · Hansaplatz (ca. 18 km)",u:"https://www.windfinder.com/webcams/datteln"},
    {t:"Dortmund · Phoenixsee (ca. 22 km)",u:"https://www.windfinder.com/webcams/datteln"}],
  alpen:[
    {t:"Rhein bei Rees · Promenade (ca. 20 km)",u:"https://www.webcamtaxi.com/en/germany/north-rhine-westphalia/rhine-river-rees-cam.html"}],
  salzhausen:[
    {t:"Webcams Lüneburger Heide (Karte)",u:"https://www.tourispo.de/webcams-ausflugsziele/lueneburger-heide"},
    {t:"Embsen / Lüneburg (ca. 20 km)",u:"https://www.windfinder.com/webcams/embsen_lower_saxony_germany"}]
};
const CAM_N={links:0,img:0,pub:0,ab:0};
function camTile(){const n=CAM_N.img+CAM_N.pub+CAM_N.ab;setKpi("k-cam",n?String(n)+"<small> Livebilder</small>":String(CAM_N.links)+"<small> Links</small>",n?"Kamerabilder "+C.town:CAM_N.links?"Webcams in der Umgebung":"keine Webcams hinterlegt","info");}
function renderWebcamLinks(){
  const list=WEBCAM_LINKS[C.key]||[];const box=$("webcam-links");
  $("cam-title").textContent="Webcams "+C.town;
  const host=u=>{try{return new URL(u).hostname.replace(/^www\./,"");}catch(e){return"";}};
  const tiles=list.filter(x=>(x.live||x.hls||x.img)&&!x.off),links=[]; // Kameras ohne Bild werden nicht gezeigt // reine Link-Kacheln ohne Bild ausgeblendet
  box.innerHTML=(tiles.length?'<div class="sublbl">Live – antippen für Großansicht</div><div class="cams cams-l" style="margin-bottom:12px">'+tiles.map((x,i)=>
      x.off?'<a class="cam linkcam offcam" href="'+esc(x.u)+'" target="_blank" rel="noopener"><div class="lc-box"><span class="lc-ic">⏸</span><span class="lc-go">'+esc(x.off)+'</span></div><span><b>'+esc(x.t)+'</b><br><span class="muted small">'+esc(x.by||host(x.u))+'</span></span></a>'
      :'<div class="cam live" data-ci="'+i+'"><div class="lsbox">'+(x.live?'<div class="lsinner" id="lst-'+i+'" data-li="'+i+'"></div><span class="ls-hit"></span>':'')+(x.hls?'<video muted playsinline autoplay data-hls="'+esc(x.hls)+'"></video>':'')+(x.img?'<img src="'+esc(x.img)+'?t='+Date.now()+'" alt="">':'')+'<span class="ls-badge">LIVE</span></div><span><b>'+esc(x.t)+'</b><br><span class="muted small">'+esc(x.by||host(x.u))+'</span></span></div>').join("")+'</div>':'')+
    (links.length?'<div class="sublbl">'+(C.isDus?"Weitere Webcam-Seiten":"Webcams in der Umgebung (keine Kamera direkt im Ort)")+'</div><div class="cams cams-l" style="margin-bottom:10px">'+links.map(x=>'<a class="cam linkcam" href="'+esc(x.u)+'" target="_blank" rel="noopener"><div class="lc-box"><span class="lc-ic">📷</span><span class="lc-go">öffnen ↗</span></div><span><b>'+esc(x.t)+'</b><br><span class="muted small">'+esc(host(x.u))+'</span></span></a>').join("")+'</div>':'')||
    '';
  box.querySelectorAll(".cam.live").forEach(el=>el.addEventListener("click",()=>openCam(tiles[+el.dataset.ci])));
  box.querySelectorAll("video[data-hls]").forEach(v=>attachHls(v,v.dataset.hls));
  box.querySelectorAll(".lsinner").forEach(el=>tileLive(el,tiles[+el.dataset.li]));
  CAM_N.links=list.length;CAM_N.img=tiles.filter(x=>!x.off).length;camTile();
}
let HLSLOAD=null;
// Livestream der Stadt stumm direkt in der Kachel abspielen
function tileLive(el,x){
  LSLOAD=LSLOAD||new Promise((res,rej)=>{const sc=document.createElement("script");sc.src="https://player.livespotting.com/player/clappr/latest/player.min.js";sc.onload=res;sc.onerror=rej;document.head.appendChild(sc);});
  LSLOAD.then(()=>{window.lsplayer.init(el.id,{player_id:x.live[0],livesource_id:x.live[1]});
    let n=0;const t=setInterval(()=>{const v=el.querySelector("video");const p=el.querySelector(".player-poster");
      if(v){v.muted=true;v.playsInline=true;}
      if(p&&p.offsetParent!==null)p.click();
      if((v&&!v.paused&&v.readyState>2)||++n>20)clearInterval(t);},500);}).catch(()=>{});}
function attachHls(v,url){v.muted=true;v.playsInline=true;
  if(v.canPlayType("application/vnd.apple.mpegurl")){v.src=url;v.play().catch(()=>{});return;}
  HLSLOAD=HLSLOAD||new Promise((res,rej)=>{const sc=document.createElement("script");sc.src="https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js";sc.onload=res;sc.onerror=rej;document.head.appendChild(sc);});
  HLSLOAD.then(()=>{if(window.Hls&&Hls.isSupported()){const h=new Hls({maxBufferLength:10});h.loadSource(url);h.attachMedia(v);v._hls=h;v.play().catch(()=>{});}}).catch(()=>{});}
let LSLOAD=null,CAMT=null;
function openCam(x){const d=$("cam-dlg"),b=$("cam-big");$("cam-big-t").textContent=x.t;$("cam-big-src").href=x.u;b.innerHTML="";clearInterval(CAMT);
  if(x.img){const im=document.createElement("img");const set=()=>im.src=x.img+"?t="+Date.now();set();im.alt="Webcam "+x.t;b.appendChild(im);CAMT=setInterval(set,60000);}
  else if(x.hls){const v=document.createElement("video");v.controls=true;v.style.width="100%";v.style.height="100%";b.appendChild(v);attachHls(v,x.hls);}
  else if(x.live){const el=document.createElement("div");el.id="lsbig"+Date.now();el.className="lsbox";el.style.border="0";el.style.borderRadius="0";b.appendChild(el);playLive(el,x);}
  d.showModal();}
document.addEventListener("DOMContentLoaded",()=>{});
$("cam-dlg").addEventListener("close",()=>{clearInterval(CAMT);$("cam-big").querySelectorAll("video").forEach(v=>{if(v._hls)v._hls.destroy();});$("cam-big").innerHTML="";});
function playLive(el,x){
  el.classList.add("loading");
  LSLOAD=LSLOAD||new Promise((res,rej)=>{const sc=document.createElement("script");sc.src="https://player.livespotting.com/player/clappr/latest/player.min.js";sc.onload=res;sc.onerror=rej;document.head.appendChild(sc);});
  LSLOAD.then(()=>{el.innerHTML="";el.style.backgroundImage="none";window.lsplayer.init(el.id,{player_id:x.live[0],livesource_id:x.live[1]});
    setTimeout(()=>{const p=el.querySelector(".player-poster");if(p)p.click();},400);el.classList.remove("loading");})
   .catch(()=>{el.classList.remove("loading");window.open(x.u,"_blank","noopener");});
}
// ================= Öffentliche Webcams (Windy) =================
function windySt(t,c){const w=$("windy-st");if(!w)return;w.textContent=t;w.style.color=c==="ok"?"#2e9e5b":c==="err"?"#d93a3a":"";w.style.fontWeight=c?"600":"";}
/* Windy-Bildadressen laufen im kostenlosen Tarif nach ca. 10 Min. ab – daher alle 9 Min. neu holen */
setInterval(()=>{if(WINDY&&!document.hidden)loadWindy();},9*60e3);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&WINDY&&Date.now()-(window.WINDY_AT||0)>9*60e3)loadWindy();});
async function loadWindy(){
  const box=$("webcams-public");
  if(!WINDY){box.innerHTML='<div class="muted small" style="margin-bottom:6px">Weitere öffentliche Webcams (Stadt, Rhein, Umgebung) nach Eintrag eines kostenlosen Windy-Schlüssels unter <a href="#einstellungen">Einstellungen</a>.</div>';setStatus("windy",false,"Schlüssel fehlt");windySt("");return;}windySt("… Windy wird geprüft","");
  try{const r=await fetch("https://api.windy.com/webcams/api/v3/webcams?nearby="+C.center.lat+","+C.center.lon+","+(C.isDus?15:25)+"&include=images,urls,location&limit=12&lang=de",{headers:{"x-windy-api-key":WINDY}});
    if(!r.ok)throw new Error("HTTP "+r.status);const d=await r.json();const cams=d.webcams||[];
    box.innerHTML=cams.length?'<div class="sublbl">Öffentliche Webcams</div><div class="cams" style="margin-bottom:10px">'+cams.map(c=>{const img=c.images&&(c.images.current&&(c.images.current.preview||c.images.current.thumbnail));const url=c.urls&&(c.urls.detail||c.urls.provider);
      return '<a class="cam" href="'+esc(safeUrl(url))+'" target="_blank" rel="noopener"><img loading="lazy" alt="Webcam '+esc(c.title)+'" src="'+esc(safeUrl(img))+'"><span>'+esc(c.title)+'</span></a>';}).join("")+'</div>':'<div class="muted small">Keine öffentlichen Webcams im Umkreis gefunden.</div>';CAM_N.pub=cams.length;camTile();
    window.WINDY_AT=Date.now();setStatus("windy",true);windySt("✓ Windy ist aktiv – "+cams.length+" Webcams rund um "+(C.name||"den Ort")+". Zu sehen unter „Webcams“.","ok");
  }catch(e){setStatus("windy",false,errText(e));windySt("✕ Windy antwortet nicht: "+errText(e)+(/40[13]/.test(String(e))?" – Schlüssel prüfen (Webcams API gewählt? evtl. ein paar Minuten warten).":""),"err");box.innerHTML=stateBox("Öffentliche Webcams nicht verfügbar – "+errText(e)+".");}
}
async function loadSammler(){try{const d=await getData("status.json");const bad=Object.entries(d.data||{}).filter(([k,v])=>v!=="ok");setStatus("sammler",!bad.length||bad.length<5,"Lauf "+dataAge(d)+(bad.length?" · "+bad.length+" Quelle(n) mit Fehler":""));}catch(e){setStatus("sammler",false,"noch keine Daten – GitHub Pages auf „GitHub Actions“ umstellen");}}


// ================= Autobahn: Staus & Behinderungen =================
let MAP=null,MAPLAYER=null,MAPRING=null,MAPCENTER=null;
function jamInfo(w){
  const txt=[w.title,w.subtitle,...(w.description||[])].filter(Boolean).join(" ");
  const t=String(w.abnormalTrafficType||"").toUpperCase();
  let kind=null;
  if(/STATIONARY/.test(t)||/\bStau\b/i.test(txt))kind="stau";
  else if(/QUEUING|SLOW/.test(t)||/stockend|zähfl|Verkehrsbehinderung durch hohes/i.test(txt))kind="stockend";
  if(!kind)return null;
  let len=null;const m=txt.match(/Länge[^0-9]{0,12}(\d+(?:[,.]\d+)?)\s*km/i)||txt.match(/(\d+(?:[,.]\d+)?)\s*km\s*(?:Stau|stockend|lang)/i)||txt.match(/Stau[^.]{0,60}?(\d+(?:[,.]\d+)?)\s*km/i);
  if(m)len=parseFloat(m[1].replace(",","."));
  const delay=w.delayTimeValue!=null&&w.delayTimeValue!==""?parseInt(w.delayTimeValue,10):null;
  const speed=w.averageSpeed!=null&&w.averageSpeed!==""?parseInt(w.averageSpeed,10):null;
  return {kind,len,delay:isFinite(delay)?delay:null,speed:isFinite(speed)?speed:null};
}
function geomLines(w){
  const g=w.geometry;if(!g||!g.coordinates)return[];
  const toLL=a=>a.map(c=>[parseFloat(c[1]),parseFloat(c[0])]).filter(p=>isFinite(p[0])&&isFinite(p[1]));
  if(g.type==="LineString")return[toLL(g.coordinates)];
  if(g.type==="MultiLineString")return g.coordinates.map(toLL);
  return[];
}
// ================= TomTom: Verkehrslage auf allen Straßen =================
async function loadTomTom(){
  const box=$("tt");renderCarRoutes();try{ensureMap();}catch(e){}
  if(!TTKEY){box.innerHTML='<div class="state">Für Staus auch auf Land- und Stadtstraßen (Echtzeit wie bei Google Maps) unter <a href="#einstellungen">Einstellungen</a> den kostenlosen TomTom-Schlüssel eintragen.</div>';return;}
  const la=C.center.lat,lo=C.center.lon,mb=mapBounds(),bbox=[mb[1],mb[0],mb[3],mb[2]].map(x=>x.toFixed(4)).join(",");
  const fields="{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description},startTime,endTime,from,to,length,delay,roadNumbers}}}";
  try{const res=await fetch("https://api.tomtom.com/traffic/services/5/incidentDetails?key="+encodeURIComponent(TTKEY)+"&bbox="+bbox+"&language=de-DE&timeValidityFilter=present&fields="+encodeURIComponent(fields));
    if(!res.ok)throw new Error(res.status===403?"Traffic-Freigabe für den Schlüssel fehlt noch (bei TomTom „Traffic API“ aktivieren)":res.status===401?"Schlüssel ungültig":"HTTP "+res.status);
    const d=await res.json();
    const CAT={0:"Unbekannt",1:"Unfall",2:"Nebel",3:"Gefahr",4:"Regen",5:"Glätte",6:"Stau",7:"Fahrstreifen gesperrt",8:"Straße gesperrt",9:"Baustelle",10:"Wind",11:"Überflutung",14:"Liegengebliebenes Fahrzeug"};
    const list=(d.incidents||[]).map(i=>{const p=i.properties||{};const c=(i.geometry&&i.geometry.coordinates)||[];const pt=Array.isArray(c[0])?c[Math.floor(c.length/2)]:c;
      return {geo:i.geometry,cat:p.iconCategory,mag:p.magnitudeOfDelay||0,delay:p.delay?Math.round(p.delay/60):null,len:p.length?p.length/1000:null,from:p.from,to:p.to,road:(p.roadNumbers||[]).join(", "),desc:((p.events||[])[0]||{}).description||CAT[p.iconCategory]||"",lat:pt&&pt[1],lon:pt&&pt[0],km:pt?distKm(la,lo,pt[1],pt[0]):99};})
      .filter(x=>{const H=HOMES[C.key];const nearHome=H&&isFinite(x.lat)&&distKm(H.lat,H.lon,x.lat,x.lon)<=3;return x.delay>0||x.cat===1||((x.cat===6||x.cat===7)&&x.mag>=2)||(x.cat===8&&(/(^|, )[AB]\d/.test(x.road)||x.km<=4||nearHome));}).map(x=>{const H=HOMES[C.key];x.home=H&&isFinite(x.lat)?distKm(H.lat,H.lon,x.lat,x.lon):null;x.grp=/(^|, )A\d/.test(x.road)?0:x.home!=null&&x.home<=3?1:2;return x;})
      .sort((a,b)=>a.grp-b.grp||(a.grp===1?a.home-b.home:0)||(b.delay||0)-(a.delay||0)||b.mag-a.mag||a.km-b.km);
    if(MAP){if(!MAP._ttinc)MAP._ttinc=L.layerGroup();MAP._ttinc.clearLayers();
      const col=x=>x.cat===8?"#7d1f6b":x.mag>=4?"#8b0000":x.mag>=3||x.delay>=20?"#d62d20":x.delay>=10?"#f08a00":"#f3c623";
      list.slice().reverse().forEach(x=>{const g=x.geo;if(!g)return;const pop='<b>'+esc(x.road||"Straße")+' · '+esc(x.desc||"")+'</b><br>'+esc([x.from,x.to].filter(Boolean).join(" → "))+(x.delay?'<br><b>+'+x.delay+' min</b>':'')+(x.len?' · '+fmt(x.len,1)+' km':'');
        if(g.type==="LineString"&&g.coordinates.length>1){const ll=g.coordinates.map(c=>[c[1],c[0]]);L.polyline(ll,{color:"#fff",weight:9,opacity:.85,interactive:false,kat:ttKat(x.cat)}).addTo(MAP._ttinc);L.polyline(ll,{color:col(x),weight:6,opacity:1,dashArray:x.cat===8?"8 6":null,kat:ttKat(x.cat)}).bindPopup(pop).addTo(MAP._ttinc);}
        else if(isFinite(x.lat))L.circleMarker([x.lat,x.lon],{radius:7,color:"#fff",weight:2,fillColor:col(x),fillOpacity:1,kat:ttKat(x.cat)}).bindPopup(pop).addTo(MAP._ttinc);});
      applyMapMode();vlMapFilter();}
    const jams=list.filter(x=>x.cat===6||x.delay>0);
    {const mx=jams.length?Math.max(0,...jams.map(x=>x.delay||0)):0,nA=jams.filter(x=>/(^|, )A\d/.test(x.road)).length;
      TILE_PARTS.traffic.tt=jams.length?(mx?"größte Verzögerung +"+mx+" min · ":"")+nA+" davon auf Autobahnen":"alle Straßen frei";TILE_PARTS.traffic._tt=1;
      composeTile("k-traffic","traffic",String(jams.length)+"<small> Staus</small>","info");}
    TT={list,jams,CAT};TTF=null;renderTT();fillPlaces();
    setStatus("tomtom",true);
  }catch(e){setStatus("tomtom",false,errText(e));box.innerHTML=stateBox("TomTom-Verkehrslage nicht verfügbar – "+errText(e)+".",'<a href="#einstellungen">Schlüssel prüfen</a>');}
}
let TT=null,TTF=null;const PLACECACHE=Object.fromEntries(Object.entries(load("placecache")||{}).filter(([,v])=>v));
// Ort (Stadt/Stadtteil) vor Stau- und Baustellenmeldungen setzen
async function fillOrte(box,again){if(!box)return;let miss=0;
  await Promise.all([...box.querySelectorAll("[data-lat] .ortp:empty")].slice(0,90).map(async el=>{const r=el.closest("[data-lat]");const la=+r.dataset.lat,lo=+r.dataset.lon;if(!isFinite(la)||!isFinite(lo))return;const o=await placeOf(la,lo);if(o&&!el.textContent){el.textContent=o;el.classList.add("ortc");}else if(!o)miss++;}));
  // was nicht klappte, nach einer Pause noch einmal versuchen
  if(miss&&!again)setTimeout(()=>fillOrte(box,true),15000);}
// Ortsabfragen in einer Warteschlange (TomTom erlaubt nur wenige Abfragen pro Sekunde – sonst fehlen Ortsnamen)
const PQ={run:0,q:[],inflight:{}};
function pqNext(){while(PQ.run<2&&PQ.q.length){const j=PQ.q.shift();PQ.run++;j().finally(()=>{setTimeout(()=>{PQ.run--;pqNext();},220);});}}
function placeOf(lat,lon){if(!isFinite(lat)||!isFinite(lon))return Promise.resolve("");const k=(+lat).toFixed(3)+","+(+lon).toFixed(3);if(PLACECACHE[k]!==undefined)return Promise.resolve(PLACECACHE[k]);
  if(PQ.inflight[k])return PQ.inflight[k];
  const p=new Promise(res=>{PQ.q.push(async()=>{let v="";for(let t=0;t<2&&!v;t++){if(t)await new Promise(r=>setTimeout(r,1500));v=await placeOf0(+lat,+lon);}delete PQ.inflight[k];res(v);});pqNext();});
  PQ.inflight[k]=p;return p;}
// Straße + Ort zu einer Koordinate (für Parkplätze ohne Adresse in OpenStreetMap)
const ADDRC=load("addrcache")||{};
function addrOf(lat,lon){const k=(+lat).toFixed(4)+","+(+lon).toFixed(4);if(ADDRC[k])return Promise.resolve(ADDRC[k]);
  return new Promise(res=>{PQ.q.push(async()=>{let v="";try{if(!TTKEY||Date.now()<TTGEO_OFF)throw 0;const r=await getJSON("https://api.tomtom.com/search/2/reverseGeocode/"+lat+","+lon+".json?language=de-DE&key="+encodeURIComponent(TTKEY));
    const a=((r.addresses||[])[0]||{}).address||{};v=[[a.streetName,a.streetNumber].filter(Boolean).join(" "),a.municipalitySubdivision&&a.municipalitySubdivision!==a.municipality?a.municipalitySubdivision:a.municipality].filter(Boolean).join(", ");
    }catch(e){if(e&&/40[03]|429/.test(String(e.message||e)))TTGEO_OFF=Date.now()+15*60000;}if(!v)v=await nomiAddr(lat,lon);try{
    if(v){ADDRC[k]=v;const ks=Object.keys(ADDRC);if(ks.length>800)ks.slice(0,300).forEach(x=>delete ADDRC[x]);store("addrcache",ADDRC);}}catch(e){}res(v);});pqNext();});}
// Ortsname zu Koordinate: erst TomTom; ist dessen Kontingent erschöpft oder gibt es keinen Treffer → OpenStreetMap (Nominatim, max. 1 Abfrage/Sekunde)
let TTGEO_OFF=0;
const NQ={q:[],busy:false};
function nomi(lat,lon,zoom){return new Promise(res=>{NQ.q.push({lat,lon,zoom,res});nqNext();});}
async function nqNext(){if(NQ.busy||!NQ.q.length)return;NQ.busy=true;const j=NQ.q.shift();let a=null;
  try{const r=await getJSON("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom="+j.zoom+"&accept-language=de&lat="+j.lat+"&lon="+j.lon,12000);a=r.address||null;}catch(e){}
  j.res(a);setTimeout(()=>{NQ.busy=false;nqNext();},1100);}
async function nomiPlace(lat,lon){const a=await nomi(lat,lon,14);if(!a)return "";const city=a.city||a.town||a.village||a.municipality||"",sub=a.suburb||a.city_district||a.borough||"";
  return city&&sub&&sub!==city?city+"-"+sub:city||sub||a.county||"";}
async function nomiAddr(lat,lon){const a=await nomi(lat,lon,18);if(!a)return "";const city=a.city||a.town||a.village||a.municipality||"",sub=a.suburb||a.city_district||"";
  return [[a.road,a.house_number].filter(Boolean).join(" "),sub&&sub!==city?sub:city].filter(Boolean).join(", ");}
async function placeOf0(lat,lon){const k=lat.toFixed(3)+","+lon.toFixed(3);if(PLACECACHE[k]!==undefined)return PLACECACHE[k];let v="";
  if(Date.now()>TTGEO_OFF&&TTKEY){try{const r=await getJSON("https://api.tomtom.com/search/2/reverseGeocode/"+lat+","+lon+".json?language=de-DE&key="+encodeURIComponent(TTKEY));
    const a=((r.addresses||[])[0]||{}).address||{};const city=a.municipality||"",sub=a.municipalitySubdivision||"";
    v=city&&sub&&sub!==city?city+"-"+sub:city||sub||a.countrySecondarySubdivision||a.countrySubdivisionName||"";}
    catch(e){if(/40[03]|429|403|limit|quota/i.test(String(e&&e.message||e)))TTGEO_OFF=Date.now()+15*60000;}}
  if(!v)v=await nomiPlace(lat,lon);
  if(!v)return "";PLACECACHE[k]=v;
  const ks=Object.keys(PLACECACHE);if(ks.length>1500)ks.slice(0,500).forEach(x=>delete PLACECACHE[x]);store("placecache",PLACECACHE);return v;}
let FILLING=false,FILLNEXT=null;
async function fillPlaces(only){if(!TT)return;if(FILLING){FILLNEXT=only||null;return;}FILLING=true;try{const l=(only||TT.list.slice(0,60)).filter(x=>!x.ort&&isFinite(x.lat));
  for(let i=0;i<l.length;i+=3){await Promise.all(l.slice(i,i+3).map(async x=>{let v=await placeOf(x.lat,x.lon);if(!v){await new Promise(r=>setTimeout(r,700));v=await placeOf(x.lat,x.lon);}x.ort=v||null;}));renderTT();if(FILLNEXT)break;await new Promise(r=>setTimeout(r,250));}}finally{FILLING=false;const n=FILLNEXT;FILLNEXT=null;if(n)fillPlaces(n);}}
const ttKat=c=>c===9?"bau":c===7||c===8?"sperr":c===6?"stau":"unfall";
function renderTT(){if(!TT)return;const {list,jams,CAT}=TT;const box=$("tt");const magTxt=["","leicht","mäßig","stark","gesperrt"];
  const F={stau:x=>x.cat===6||x.delay>0,unfall:x=>x.cat===1,sperr:x=>x.cat===8,delay:x=>x.delay>0};
  let l=TTF?list.filter(F[TTF]):list;if(TTF==="delay")l=l.slice().sort((a,b)=>b.delay-a.delay);
  const fb=(k,v,t,n)=>'<button type="button" class="fact fbtn'+(TTF===k?" on":"")+'" data-ttf="'+k+'"'+(n?"":" disabled")+'><b>'+v+'</b><span>'+t+'</span></button>';
  const nU=list.filter(F.unfall).length,nS=list.filter(F.sperr).length,mx=jams.length?Math.max(0,...jams.map(x=>x.delay||0)):0;
  box.innerHTML='<div class="stau-sum" style="margin-bottom:8px">'+fb("stau",String(jams.length),"Staus / zäh",jams.length)+fb("unfall",String(nU),"Unfälle",nU)+fb("sperr",String(nS),"Sperrungen",nS)+fb("delay",mx?"+"+mx+" min":"–","größte Verzögerung",mx)+'</div>'+
    '<div class="muted small" style="margin-bottom:6px">'+(TTF?'Gefiltert – Kennzahl erneut antippen zeigt wieder alles. ':'Kennzahl antippen filtert die Liste. ')+'Eintrag antippen zeigt ihn in der Karte.</div>'+
    (l.length?'<div>'+l.slice(0,80).map((x,i)=>(!TTF&&(i===0||l[i-1].grp!==x.grp)?'<div class="sublbl" style="margin-top:8px">'+["Autobahnen","Rund um meine Adresse"+(HOMES[C.key]?" · "+esc(HOMES[C.key].label):""),"Weitere Straßen"][x.grp]+'</div>':'')+'<div class="jam ttj" role="button" tabindex="0" data-kat="'+ttKat(x.cat)+'" data-i="'+list.indexOf(x)+'"'+(isFinite(x.lat)?' data-lat="'+x.lat+'" data-lon="'+x.lon+'"':'')+'><span class="tag'+(x.road&&/^A/.test(x.road)?" ab":"")+'">'+esc(x.road||"Straße")+'</span><div class="t"><span class="pill '+(x.cat===8||x.mag>=3?"p-bad":"p-warn")+'" style="margin-right:6px"><i></i>'+esc(CAT[x.cat]||"Meldung")+'</span><b class="ortp"></b>'+(x.desc&&x.desc!==CAT[x.cat]?esc(x.desc):"")+'</div>'+
      '<div class="delay'+(x.delay!=null&&x.delay>=20?"":x.delay>=10?" mid":" low")+'">'+(x.delay?"+"+x.delay+" min":"")+'<small>'+(x.delay?"Verzögerung":esc(magTxt[x.mag]||""))+'</small></div>'+
      '<div class="d">'+(x.ort?'<span class=\"ortc\">'+esc(x.ort)+'</span>':'')+esc([x.from,x.to].filter(Boolean).join(" → "))+[x.len?" · "+fmt(x.len,1)+" km":"",x.grp===1?" · "+fmt(x.home,1)+" km von meiner Adresse":isFinite(x.km)?" · "+fmt(x.km)+" km entfernt":""].join("")+' · <span style="color:var(--accent)">in Karte zeigen ›</span></div></div>').join("")+'</div>'
    :'<div class="state good">Keine Behinderungen im Umkreis gemeldet.</div>');
  const missing=l.slice(0,80).filter(x=>!x.ort&&isFinite(x.lat));if(missing.length)setTimeout(()=>fillPlaces(missing),50);
}
document.addEventListener("click",e=>{const f=e.target.closest("#tt [data-ttf]");if(f){TTF=TTF===f.dataset.ttf?null:f.dataset.ttf;renderTT();return;}
  const j=e.target.closest("#tt .ttj");if(j&&TT&&MAP){const x=TT.list[+j.dataset.i];if(!x||!isFinite(x.lat))return;
    if(MAPMODE!=="tomtom"&&TTKEY){MAPMODE="tomtom";store("mapmode",MAPMODE);applyMapMode();}
    openMap();setTimeout(()=>$("stau-map").scrollIntoView({behavior:"smooth",block:"center"}),150);MAP.setView([x.lat,x.lon],14);
    if(MAP._ttinc)MAP._ttinc.eachLayer(l=>{if(l.getPopup&&l.getPopup()&&(l.getLatLng?Math.abs(l.getLatLng().lat-x.lat)<1e-5:l.getLatLngs().flat().some(p=>Math.abs(p.lat-x.lat)<1e-5&&Math.abs(p.lng-x.lon)<1e-5)))l.openPopup([x.lat,x.lon]);});}});
let MAPMODE="tomtom"; // OpenStreetMap-Ansicht entfernt – Karte immer TomTom (ohne Schlüssel automatisch einfache Grundkarte)
// Fester Kartenausschnitt je Ort: [Süd, West, Nord, Ost]
const MAP_BOUNDS={dus:[51.12,6.66,51.36,6.96],datteln:[51.60,7.24,51.72,7.46],alpen:[51.50,6.40,51.70,6.70],salzhausen:[53.15,10.04,53.30,10.30]};
function mapBounds(){const b=MAP_BOUNDS[C.key];if(b)return b;const la=C.center.lat,lo=C.center.lon;return [la-.2,lo-.32,la+.2,lo+.32];}
function gmapsUrl(){const [s,w,n,e]=mapBounds();const span=Math.max(n-s,(e-w)*0.62);const z=span>0.45?10:span>0.22?11:12;return "https://www.google.com/maps/@"+((s+n)/2).toFixed(4)+","+((w+e)/2).toFixed(4)+","+z+"z/data=!5m1!1e1";}
let TTFLOW=load("ttflow2")!==false; // Verkehrsfluss (grün/gelb/rot auf allen Straßen) standardmäßig an
// TomTom-Kacheln scharf: 512-px-Bild auf 256 px Fläche (Retina), Beschriftung in normaler Größe und im Dunkelmodus mit dunklem TomTom-Stil statt Farbumkehr
const isDark=()=>{const t=document.documentElement.getAttribute("data-theme");return t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;};
function ttBase(){const k=encodeURIComponent(TTKEY||"");return L.tileLayer("https://api.tomtom.com/maps/orbis/map-display/tile/{z}/{x}/{y}.png?apiVersion=1&tileSize=512&style="+(isDark()?"street-dark":"street-light")+"&key="+k,{tileSize:256,maxZoom:20,attribution:"Karte & Verkehr © TomTom"});}
function ttFlow(){const k=encodeURIComponent(TTKEY||"");return L.tileLayer("https://api.tomtom.com/traffic/map/4/tile/flow/relative-delay/{z}/{x}/{y}.png?tileSize=512&thickness=6&key="+k,{tileSize:256,opacity:.8,minZoom:11,maxZoom:18,zIndex:5});}
function applyMapMode(){
  if(!MAP)return;const tt=MAPMODE==="tomtom"&&!!TTKEY;const k=encodeURIComponent(TTKEY||"");
  if(!MAP._osm)MAP._osm=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,subdomains:"abc",attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'});
  if(TTKEY&&(!MAP._light||MAP._lightk!==TTKEY)){if(MAP._light)MAP._light.remove();MAP._lightk=TTKEY;MAP._light=ttBase();}
  if(TTKEY&&(!MAP._tt||MAP._ttk!==TTKEY)){if(MAP._tt)MAP._tt.remove();MAP._ttk=TTKEY;
    MAP._tt=ttFlow();}
  [MAP._osm,MAP._light,MAP._tt,MAP._ttinc].forEach(l=>l&&MAP.hasLayer(l)&&l.remove());
  MAP.getContainer().classList.toggle("ttmap",tt);
  if(tt){MAP._light.addTo(MAP);if(TTFLOW)MAP._tt.addTo(MAP);if(MAP._ttinc)MAP._ttinc.addTo(MAP);}else MAP._osm.addTo(MAP);
  if(C.isDus&&!tt){if(!MAP._los)MAP._los=L.tileLayer.wms("https://vtmanager.duesseldorf.de/geovtinfo/wms",{layers:"vtinfo:LOS",format:"image/png",transparent:true,tiled:true,opacity:.85,zIndex:5,attribution:"Verkehrslage © Landeshauptstadt Düsseldorf"});MAP._los.addTo(MAP);}
  else if(MAP._los&&MAP.hasLayer(MAP._los))MAP._los.remove();
  if(MAPLAYER&&!MAP.hasLayer(MAPLAYER))MAPLAYER.addTo(MAP); // Autobahn-Meldungen (auch Baustellen) immer zeigen
  document.querySelectorAll(".tt-leg").forEach(e=>e.hidden=!tt);document.querySelectorAll(".osm-leg").forEach(e=>e.hidden=tt||!C.isDus);
  const fl=$("ttflow");if(fl){fl.parentElement.hidden=!tt;fl.checked=TTFLOW;}
  document.querySelectorAll("#mapsw [data-mm]").forEach(b=>b.classList.toggle("on",b.dataset.mm===(tt?"tomtom":"osm")));
  $("stau-src").textContent=tt?"Karte & Verkehr: TomTom Echtzeit":"Karte © OpenStreetMap · Meldungen: Autobahn GmbH"+(C.isDus?", Verkehrszentrale Düsseldorf":"");
}
document.addEventListener("change",e=>{if(e.target.id==="ttflow"){TTFLOW=e.target.checked;store("ttflow2",TTFLOW);applyMapMode();}});
document.addEventListener("click",e=>{const b=e.target.closest("#mapsw [data-mm]");if(!b)return;
  if(b.dataset.mm==="tomtom"&&!TTKEY){location.hash="einstellungen";return;}
  MAPMODE=b.dataset.mm;store("mapmode",MAPMODE);applyMapMode();});
// Autofahrt zwischen den eigenen Adressen in Düsseldorf und Datteln (Google Maps, mit aktueller Verkehrslage)
function renderCarRoutes(){const box=$("car-routes");if(!box)return;CARR=[];const A=HOMES.dus,B=HOMES.datteln;
  const wr=$("car-wrap");if(!(C.key==="dus"||C.key==="datteln")){if(wr)wr.hidden=true;return;}
  if(wr)wr.hidden=false;
  if(!A||!B){box.innerHTML='<div class="muted small" style="grid-column:1/-1">Für die Autofahrt Düsseldorf ⇄ Datteln einmal den Einrichtungslink mit deinen Adressen öffnen (oder unter Einstellungen „Meine Adresse“ für beide Orte eintragen).</div>';return;}
  const u=(o,d)=>"https://www.google.com/maps/dir/?api=1&travelmode=driving&origin="+encodeURIComponent(o.label)+"&destination="+encodeURIComponent(d.label);
  const ab=[[A,B,"Düsseldorf → Datteln"],[B,A,"Datteln → Düsseldorf"]];if(C.key==="datteln")ab.reverse();
  box.innerHTML=ab.map(([o,d,t],i)=>'<a class="carrow" target="_blank" rel="noopener" href="'+u(o,d)+'"><span class="cn">'+t+'<small id="cari-'+i+'">Autofahrt · Fahrzeit live</small></span><span class="ct" id="cart-'+i+'">…</span><span class="go">↗</span></a>').join("");
  if(!TTKEY)return;
  box.insertAdjacentHTML("beforeend",'<div id="car-incs" class="car-incs"></div>');
  CARR=ab.map(([,,t])=>({t,wait:1}));renderCarIncs();
  (async()=>{for(const [i,[o,d,t]] of ab.entries()){const el=$("cart-"+i);
    try{const url="https://api.tomtom.com/routing/1/calculateRoute/"+o.lat+","+o.lon+":"+d.lat+","+d.lon+"/json?traffic=true&travelMode=car&routeType=fastest&computeTravelTimeFor=all&sectionType=traffic&instructionsType=coded&language=de-DE&key="+encodeURIComponent(TTKEY);
      let r;try{r=await getJSON(url);}catch(e){await new Promise(z=>setTimeout(z,1500));r=await getJSON(url);}
      const rt=r.routes[0],sm=rt.summary;const min=Math.round(sm.travelTimeInSeconds/60),dl=Math.round((sm.trafficDelayInSeconds||0)/60),km=sm.lengthInMeters/1000;
      const arr=new Date(Date.now()+sm.travelTimeInSeconds*1000);
      el.innerHTML=(min>=60?Math.floor(min/60)+" h "+String(min%60).padStart(2,"0"):min)+' min '+(dl>0?'<span class="cs '+(dl>=15?"bad":"warn")+'">+'+dl+' Stau</span>':'<span class="cs ok">frei</span>');
      {const ii=$("cari-"+i);if(ii)ii.textContent=fmt(km)+" km · Ankunft "+hhmm(arr);}
      const P=routeParse(rt);CARR[i]={t,...P};renderCarIncs();carRW(i);
    }catch(e){el.innerHTML='<span class="cs">–</span>';{const ii=$("cari-"+i);if(ii)ii.textContent="Fahrzeit derzeit nicht verfügbar";}CARR[i]={t,err:1};renderCarIncs();}
    await new Promise(z=>setTimeout(z,400));}
    for(const r of CARR)for(const x of (r.secs||[]))if(isFinite(x.lat)&&!x.ort){x.ort=await placeOf(x.lat,x.lon);renderCarIncs();}})();}
let CARR=[],MAPFOCUS=0;const RWCACHE={};
function routeParse(rt){const pts=(rt.legs||[]).flatMap(l=>l.points||[]);const ins=(rt.guidance&&rt.guidance.instructions)||[];
  const roadAt=idx=>{let best=null;for(const x of ins){if(x.pointIndex<=idx)best=x;else break;}return best?[(best.roadNumbers||[]).join("/"),best.street].filter(Boolean).join(" · "):"";};
  const CATS={JAM:"Stau",ROAD_WORK:"Baustelle",ROAD_CLOSURE:"Sperrung",OTHER:"Behinderung"};
  const secs=(rt.sections||[]).filter(x=>x.sectionType==="TRAFFIC").map(x=>{const p=pts[x.startPointIndex]||{};
    let len=0;for(let k=x.startPointIndex;k<x.endPointIndex&&k+1<pts.length;k++)len+=distKm(pts[k].latitude,pts[k].longitude,pts[k+1].latitude,pts[k+1].longitude);
    return {cat:CATS[x.simpleCategory]||"Behinderung",delay:Math.round((x.delayInSeconds||0)/60),speed:x.effectiveSpeedInKmh,len,road:roadAt(x.startPointIndex),lat:p.latitude,lon:p.longitude,cause:((x.tec&&x.tec.causes)||[]).map(c=>c.mainCauseCode).join(","),ort:null};});
  return {secs,pts,abs:[...new Set(ins.flatMap(x=>(x.roadNumbers||[]).filter(n=>/^A\s?\d+$/.test(n)).map(n=>n.replace(/\s/g,""))))]};}
function svcFor(ab,svc){const key=ab+"|"+svc,c=RWCACHE[key];if(c&&(svc==="roadworks"||Date.now()-c.at<3*60e3))return c.p;
  const pr=getJSON("https://verkehr.autobahn.de/o/autobahn/"+encodeURIComponent(ab)+"/services/"+svc,20000)
  .then(d=>(d[svc]||[]).map(w=>({...w,ab,_svc:svc,lat:parseFloat((w.coordinate||{}).lat),lon:parseFloat((w.coordinate||{}).long)})).filter(w=>isFinite(w.lat))).then(l=>{RWGOOD[key]=l;return l;}).catch(()=>{delete RWCACHE[key];return RWGOOD[key]||[];});
  RWCACHE[key]={p:pr,at:Date.now()};return pr;}
const RWGOOD={};
const rwFor=ab=>svcFor(ab,"roadworks");
// Baustellen der Autobahn GmbH, die auf der berechneten Strecke liegen (in Fahrtrichtung)
async function carRW(i){const r=CARR[i];if(!r||!r.pts||!r.pts.length)return;const out=await routeRW(r);if(CARR[i]!==r)return;r.rw=out;renderCarIncs();if(MAPRT&&MAPRT.t===r.t&&!MAPRT.rw){MAPRT.rw=out;renderMapRoute();}
  const ii=$("cari-"+i);if(ii&&out.length&&!/Baustelle/.test(ii.textContent))ii.textContent+=" · 🚧 "+out.length+(out.length===1?" Baustelle":" Baustellen");}
async function routeRW(r,svcs){const P=r.pts;svcs=svcs||["roadworks"];
  const lists=await Promise.all((r.abs||[]).flatMap(ab=>svcs.map(sv=>svcFor(ab,sv))));
  let la0=90,la1=-90,lo0=180,lo1=-180;P.forEach(p=>{la0=Math.min(la0,p.latitude);la1=Math.max(la1,p.latitude);lo0=Math.min(lo0,p.longitude);lo1=Math.max(lo1,p.longitude);});
  const cum=[0];for(let k=1;k<P.length;k++)cum[k]=cum[k-1]+distKm(P[k-1].latitude,P[k-1].longitude,P[k].latitude,P[k].longitude);
  const out=[],seen=new Set();
  lists.flat().forEach(w=>{if(w.lat<la0-.01||w.lat>la1+.01||w.lon<lo0-.015||w.lon>lo1+.015)return;
    let best=1e9,bk=-1;for(let k=0;k<P.length;k++){const dla=Math.abs(P[k].latitude-w.lat);if(dla>.004)continue;const d=distKm(P[k].latitude,P[k].longitude,w.lat,w.lon);if(d<best){best=d;bk=k;}}
    if(best>0.15)return;
    const g=geomLines(w)[0];if(g&&g.length>1){const a=g[0],b=g[g.length-1];const k2=Math.min(P.length-1,bk+8),k1=Math.max(0,bk-8);
      const rx=P[k2].longitude-P[k1].longitude,ry=P[k2].latitude-P[k1].latitude,wx=b[1]-a[1],wy=b[0]-a[0];
      const n=Math.hypot(rx,ry)*Math.hypot(wx,wy);if(n>0&&(rx*wx+ry*wy)/n<-0.3)return;} // Gegenrichtung
    const key=w.identifier||w.title+"|"+w.subtitle;if(seen.has(key))return;seen.add(key);
    out.push({...w,at:cum[bk]});});
  return out.sort((a,b)=>a.at-b.at);}
function abRow(x){const J=x.jam;const lines=(x.description||[]).map(v=>String(v).trim()).filter(Boolean);
  const pill=x.cl?'<span class="pill p-bad" style="margin-right:6px"><i></i>Sperrung</span>':J&&J.kind==="stau"?'<span class="pill p-bad" style="margin-right:6px"><i></i>Stau</span>':'<span class="pill p-warn" style="margin-right:6px"><i></i>stockend</span>';
  return '<div class="jam ttj carinc" role="button" tabindex="0" data-lat="'+x.lat+'" data-lon="'+x.lon+'"><span class="tag ab">'+esc(x.ab)+'</span><div class="t">'+pill+(x.ort?'<span class=\"ortc\">'+esc(x.ort)+'</span>':'')+esc(x.subtitle||x.title||"")+'</div>'+
    '<div class="delay'+(J&&J.delay!=null?(J.delay>=20?"":J.delay>=10?" mid":" low"):" low km")+'">'+(J&&J.delay!=null?"+"+J.delay+" min":"nach "+fmt(x.at,0)+" km")+'<small>'+(J&&J.delay!=null?"Verzögerung":"ab Start")+'</small></div>'+
    '<div class="d">'+esc([J&&J.len?fmt(J.len,1)+" km lang":"",J&&J.delay!=null?"nach "+fmt(x.at,0)+" km":"",lines.slice(0,2).join(" · ")].filter(Boolean).join(" · "))+' · <span style="color:var(--accent)">in Karte zeigen ›</span></div></div>';}
function rwRow(x){const lines=(x.description||[]).map(v=>String(v).trim()).filter(Boolean);const lane=lines.find(l=>/fahrstreifen|spur|gesperrt|verengt|verschwenk|tempo|km\/h/i.test(l));const when=lines.filter(l=>/beginn|ende|bis|ab |\d{2}\.\d{2}\./i.test(l)).slice(0,2);
    return '<div class="jam ttj carinc" role="button" tabindex="0" data-lat="'+x.lat+'" data-lon="'+x.lon+'"><span class="tag ab">'+esc(x.ab)+'</span><div class="t"><span class="pill" style="margin-right:6px"><i style="background:#8a9aa5"></i>Baustelle</span>'+(x.ort?'<span class=\"ortc\">'+esc(x.ort)+'</span>':'')+esc(x.subtitle||x.title||"")+'</div>'+
    '<div class="delay low km">nach '+fmt(x.at,0)+' km<small>ab Start</small></div>'+
    '<div class="d">'+esc([lane,...when].filter(Boolean).join(" · ")||x.title||"")+' · <span style="color:var(--accent)">in Karte zeigen ›</span></div></div>';}
function incRow(x){return '<div class="jam ttj carinc" role="button" tabindex="0" data-lat="'+x.lat+'" data-lon="'+x.lon+'"><span class="tag'+(/^A\d/.test(x.road)?" ab":"")+'">'+esc(x.road.split(" · ")[0]||"Straße")+'</span><div class="t"><span class="pill '+(x.cat==="Sperrung"||x.delay>=20?"p-bad":"p-warn")+'" style="margin-right:6px"><i></i>'+esc(x.cat)+'</span>'+(x.ort?'<span class=\"ortc\">'+esc(x.ort)+'</span>':"")+esc(x.road.split(" · ")[1]||"")+'</div>'+
    '<div class="delay'+(x.delay>=20?"":x.delay>=10?" mid":" low")+'">'+(x.delay?"+"+x.delay+" min":"")+'<small>'+(x.delay?"Verzögerung":"")+'</small></div>'+
    '<div class="d">'+fmt(x.len,1)+' km'+(x.speed?' · Ø '+x.speed+' km/h':'')+' · <span style="color:var(--accent)">in Karte zeigen ›</span></div></div>';}
let MAPRT=null;
function renderMapRoute(){const box=$("mapcity-route");if(!box)return;const r=MAPRT;if(!r){box.innerHTML="";return;}
  const n=(r.secs||[]).length,m=(r.rw||[]).length;
  box.innerHTML='<div class="sublbl" style="margin-top:14px;font-size:15px">Unterwegs '+esc(r.t)+'</div>'+
    (r.wait?'<div class="state">Strecke wird berechnet …</div>':r.err?stateBox("Strecke derzeit nicht verfügbar – "+r.err+"."):
    '<div class="sublbl" style="margin-top:6px">Staus &amp; Behinderungen jetzt <span class="muted small">(TomTom, schon in der Fahrzeit eingerechnet)</span></div>'+(n?r.secs.map(incRow).join(""):'<div class="state good">Keine Staus oder Sperrungen auf dieser Strecke.</div>')+
    '<div class="sublbl" style="margin-top:10px">Baustellen auf der Strecke <span class="muted small">(Autobahn GmbH, in Fahrtrichtung, km ab Start)</span></div>'+(r.rw?(m?r.rw.map(rwRow).join(""):'<div class="state good">Keine Autobahn-Baustellen auf dieser Strecke gemeldet.</div>'):'<div class="state">wird geladen …</div>'));}
function renderCarIncs(){const box=$("car-incs");if(!box)return;
  const openSet=new Set([...box.querySelectorAll("details.cr[open]")].map(d=>d.dataset.t));
  box.innerHTML=CARR.filter(r=>r&&((r.secs&&r.secs.length)||(r.rw&&r.rw.length))).map(r=>{const n=(r.secs||[]).length,m=(r.rw||[]).length;
    return '<details class="cr" data-t="'+esc(r.t)+'"'+(openSet.has(r.t)?' open':'')+'><summary class="route-h">Unterwegs <b>'+esc(r.t)+'</b><span class="route-n">'+[n?n+(n===1?" Behinderung":" Behinderungen"):"",m?"🚧 "+m+(m===1?" Baustelle":" Baustellen"):""].filter(Boolean).join(" · ")+'</span></summary>'+
    (n?'<div class="sublbl" style="margin-top:6px">Staus & Behinderungen jetzt (TomTom, schon in der Fahrzeit eingerechnet)</div>'+r.secs.map(incRow).join(""):'<div class="state good">Keine Staus oder Sperrungen auf dieser Strecke.</div>')+
    (m?'<div class="sublbl" style="margin-top:10px">Baustellen auf der Strecke (Autobahn GmbH, in Fahrtrichtung, km ab Start)</div>'+r.rw.map(rwRow).join(""):"")+'</details>';}).join("");}
document.addEventListener("click",e=>{const j=e.target.closest(".carinc");if(!j||!MAP)return;const la=+j.dataset.lat,lo=+j.dataset.lon;if(!isFinite(la))return;
  openMap();setTimeout(()=>$("stau-map").scrollIntoView({behavior:"smooth",block:"center"}),150);MAP.setView([la,lo],14);L.popup().setLatLng([la,lo]).setContent(j.querySelector(".t").innerText+"<br>"+j.querySelector(".d").innerText.replace(" · in Karte zeigen ›","")).openOn(MAP);});
function fitMap(){if(!MAP)return;const el=$("stau-map");if(!el.offsetWidth)return;const [s,w,n,e]=mapBounds();MAP.invalidateSize();MAP.fitBounds([[s,w],[n,e]],{padding:[4,4]});}
// Karte war ausgeblendet (Kategorie-Ansicht) → Größe neu messen und Linien/Punkte neu zeichnen
function mapRefresh(){if(!MAP)return;MAP.invalidateSize({pan:false});MAP.setView(MAP.getCenter(),MAP.getZoom(),{reset:true});}
// Einheitliche Grundkarte: TomTom (mit Verkehrsfluss, wenn gewünscht); ohne Schlüssel einfache Grundkarte
function baseTiles(flow){const k=encodeURIComponent(TTKEY||"");if(!TTKEY)return [L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"})];
  const o=[ttBase()];if(flow)o.push(ttFlow());return o;}
function ensureMap(){
  if(typeof L==="undefined")return null;
  if(!MAP){MAP=L.map("stau-map",{scrollWheelZoom:false,dragging:!L.Browser.mobile,tap:!L.Browser.mobile}).setView([C.center.lat,C.center.lon],10);MAPLAYER=L.layerGroup().addTo(MAP);}
  applyMapMode();
  if(MAP._home){MAP._home.remove();MAP._home=null;}
  {const H=HOMES[C.key];if(H)MAP._home=L.marker([H.lat,H.lon],{icon:L.divIcon({className:"homeic",html:"🏠",iconSize:[26,26]})}).bindTooltip("Meine Adresse").addTo(MAP);}
  if(MAPRING)MAPRING.remove();if(MAPCENTER)MAPCENTER.remove();
  MAPRING=L.circle([C.center.lat,C.center.lon],{radius:JAM_RADIUS_KM*1000,color:"#8a9aa5",weight:1,dashArray:"4 6",fill:false,interactive:false}).addTo(MAP);
  MAPCENTER=L.circleMarker([C.center.lat,C.center.lon],{radius:5,color:"#14212b",weight:2,fillColor:"#fff",fillOpacity:1}).bindTooltip(C.town).addTo(MAP);
  fitMap();
  return MAP;
}
function popupHtml(i,extra){
  return '<b>'+esc(i.ab)+' · '+esc(i.title||"")+'</b><br>'+esc(i.subtitle||"")+(extra?'<br>'+extra:'')+
    ((i.description||[]).filter(Boolean).length?'<br><span style="color:#5b6a75">'+esc((i.description||[]).filter(Boolean).slice(0,4).join(" · "))+'</span>':'');
}
const PRIO_RADIUS_KM=60;
const escRe=x=>String(x).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function routeHit(w,r){
  if(w.ab!==r.ab)return false;
  const t=[w.title,w.subtitle,(w.description||[])[0]].filter(Boolean).join(" | ");
  // „aus Richtung X“ ist die Gegenrichtung und zählt nicht
  return new RegExp("(→|->|>|(?<!aus )Richtung|(?<!aus )Ri\\.|nach|in Fahrtrichtung)[^|→>()]{0,40}?"+escRe(r.dir),"i").test(t.replace(/\(?aus Richtung [^)|]*\)?/gi,""));
}
let ROUTE_ITEMS=[],AB_SETS={},AB_SEL=null;
// „Meine Autobahnstrecken“ automatisch aus den PKW-Routen (TomTom) ab dem gewählten Ort
let AUTOR=[];
function renderAutoPrio(){const box=$("prio");if(!box||typeof RS==="undefined"||!RS.city)return false;
  const dirs=rsDirs();ROUTE_ITEMS=[];AUTOR=[];const O=(RS.gps&&RS.pos)?RS.pos:FIXHOME[RS.city];
  {const h=$("prio-h");if(h)h.innerHTML='Meine Strecken ab '+esc(RS.gps&&RS.pos?"Standort":CITYN[RS.city])+' <span class="muted small">· Route TomTom, Meldungen Autobahn GmbH</span>';}
  const cards=dirs.map((d,i)=>{const D=RS.data[d[0]];const a=D&&D.alts&&D.alts[0];const to=CITYN[d[3]];
    if(!a)return '<div class="route unk"><span class="tag">PKW</span><span class="rt">→ '+esc(to)+'</span><span class="rv muted">'+(D&&D.err?"nicht verfügbar"+(/HTTP 4(03|29)/.test(D.err)?" · TomTom-Kontingent":""):"wird berechnet …")+'</span></div>';
    const items=[...(a.ab||[]).map(w=>({...w,_c:w.cl?1:0})),...(a.rw||[]).map(w=>({...w,_rw:1}))].map(w=>({...w,km:distKm(O.lat,O.lon,w.lat,w.lon)}));
    const cl=items.filter(x=>x._c),jams=items.filter(x=>x.jam&&!x._c).sort((x,y)=>(y.jam.delay||0)-(x.jam.delay||0)),rws=items.filter(x=>x._rw);
    let cls="ok",val="freie Fahrt";
    if(cl.length){cls="crit";val="Sperrung";}
    else if(jams.length){const j=jams[0];const st=jams.some(x=>x.jam.kind==="stau");cls=st&&(j.jam.delay||0)>=20?"bad":(j.jam.delay||0)>=10?"warn":"info";val=(st?"Stau":"stockend")+(j.jam.delay!=null?" · +"+j.jam.delay+" min":"");}
    else if(a.dl>=10){cls=a.dl>=20?"bad":"warn";val="+"+a.dl+" min Verzögerung";}
    const via=(a.abs||[]).length?"über "+a.abs.join(", "):"ohne Autobahn";
    const sub=[via,hm(a.min)+(a.dl>0?" (davon +"+a.dl+" min Stau)":""),cl.length?"⛔ "+(cl[0].subtitle||cl[0].title||""):"",rws.length?"🚧 "+rws.length+(rws.length===1?" Baustelle":" Baustellen"):""].filter(Boolean).join(" · ");
    ROUTE_ITEMS[i]=items;AUTOR[i]={t:CITYN[RS.city]+" → "+to+" ("+via+")"};
    return '<div role="button" tabindex="0" data-route="'+i+'" class="route '+cls+'"><span class="tag ab">'+esc((a.abs||[])[0]||"PKW")+'</span><span class="rt">→ '+esc(to)+'</span><span class="rv">'+esc(val)+'</span><span class="rs">'+esc(sub)+'</span></div>';});
  box.innerHTML='<div class="prio">'+cards.join("")+'</div>';
  return true;}
function renderPrio(rawW,rawC,okRoads,rawR){if(renderAutoPrio())return;rawR=rawR||[];
  const box=$("prio");ROUTE_ITEMS=[];
  if(!ROUTES.length){box.innerHTML="";return;}
  const cards=ROUTES.map(r=>{
    if(!okRoads.has(r.ab))return '<div class="route unk"><span class="tag ab">'+esc(r.ab)+'</span><span class="rt">→ '+esc(r.dir)+'</span><span class="rv muted">keine Daten</span></div>';
    const cl=rawC.filter(c=>routeHit(c,r));
    const ws=rawW.filter(w=>routeHit(w,r)).map(w=>({...w,jam:jamInfo(w)}));
    const jams=ws.filter(w=>w.jam).sort((a,b)=>(b.jam.delay||0)-(a.jam.delay||0));
    const blocked=cl.length?cl[0]:ws.find(w=>w.isBlocked==="true"||w.isBlocked===true);
    let cls="ok",val="freie Fahrt",sub="keine Meldungen der Autobahn GmbH";
    if(blocked){cls="crit";val="Sperrung";sub=(blocked.subtitle||blocked.title||"")+" · "+fmt(blocked.km)+" km entfernt";}
    else if(jams.length){const j=jams[0];const st=jams.some(x=>x.jam.kind==="stau");cls=st&&(j.jam.delay||0)>=20?"bad":(j.jam.delay||0)>=10?"warn":"info";
      val=(st?"Stau":"stockend")+(j.jam.delay!=null?" · +"+j.jam.delay+" min":"")+(j.jam.len?" · "+fmt(j.jam.len,1)+" km":"")+(jams.length>1?" ("+jams.length+" Meldungen)":"");
      sub=(j.subtitle||j.title||"")+" · "+fmt(j.km)+" km entfernt";}
    else if(ws.length){cls="warn";val="Behinderung";sub=(ws[0].subtitle||ws[0].title||"")+" · "+fmt(ws[0].km)+" km entfernt";}
    const seen=new Set();const rws=rawR.filter(w=>routeHit(w,r)).filter(w=>{const k=w.identifier||w.title+"|"+w.subtitle;if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>a.km-b.km).map(w=>({...w,_rw:1}));
    const rwTxt=rws.length?"🚧 "+rws.length+(rws.length===1?" Baustelle":" Baustellen")+(cls==="ok"?" · nächste: "+(rws[0].subtitle||rws[0].title||"")+" · "+fmt(rws[0].km)+" km entfernt":""):"";
    if(rwTxt)sub=cls==="ok"?rwTxt:sub+" · "+rwTxt;
    ROUTE_ITEMS[ROUTES.indexOf(r)]=[...cl.map(c=>({...c,_c:1})),...ws,...rws];
    return '<div role="button" tabindex="0" data-route="'+ROUTES.indexOf(r)+'" class="route '+cls+'"><span class="tag ab">'+esc(r.ab)+'</span><span class="rt">→ '+esc(r.dir)+'</span><span class="rv">'+esc(val)+'</span>'+(cls==="ok"&&!rws.length?'':'<span class="rs">'+esc(sub)+'</span>')+'</div>';});
  box.innerHTML='<div class="prio">'+cards.join("")+'</div>';
}
// Detailliste hinter Kennzahlen und „Meine Strecken“
function abItem(i){
  const J=i._rw?null:(i.jam||jamInfo(i));const closed=i._c||i.isBlocked==="true"||i.isBlocked===true;
  const lines=(i.description||[]).map(x=>String(x).trim()).filter(Boolean);
  const pill=i._rw&&!closed?'<span class="pill"><i style="background:#8a9aa5"></i>Baustelle</span>':closed?'<span class="pill p-bad"><i></i>Sperrung</span>':J?(J.kind==="stau"?'<span class="pill p-bad"><i></i>Stau</span>':'<span class="pill p-warn"><i></i>stockend</span>'):'<span class="pill p-warn"><i></i>Behinderung</span>';
  const facts=[J&&J.delay!=null?"<b>+"+J.delay+" min</b>":"",J&&J.len?fmt(J.len,1)+" km lang":"",J&&J.speed!=null?"Ø "+J.speed+" km/h":"",fmt(i.km)+" km von "+esc(C.town),i._rw?esc(lines.filter(l=>/fahrstreifen|spur|verengt|verschwenk|tempo|km\/h|ende|bis/i.test(l)).slice(0,2).join(" · ")):""].filter(Boolean).join(" · ");
  return '<details class="abd"><summary><span class="tag ab">'+esc(i.ab)+'</span><span class="abd-t">'+pill+' '+(i.ort?'<span class=\"ortc\">'+esc(i.ort)+'</span>':'')+esc(i.title||"")+'</span><span class="abd-s">'+esc(i.subtitle||"")+'</span><span class="abd-f">'+facts+'</span></summary>'+
    '<div class="abd-b">'+(lines.length?lines.map(esc).join("<br>"):'<span class="muted">Keine weiteren Angaben der Autobahn GmbH.</span>')+
    (isFinite(i.lat)?'<div style="margin-top:8px"><button type="button" class="btn sm" data-goto="'+i.lat+','+i.lon+'">Auf der Karte zeigen</button> <a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/maps/@?api=1&map_action=map&center='+i.lat+','+i.lon+'&zoom=14&layer=traffic">Google Maps ↗</a></div>':'')+'</div></details>';}
function showAbDetail(k){
  const box=$("stau-detail");if(!box)return;
  let set=null;
  if(/^r\d+$/.test(k)){const n=+k.slice(1),r=ROUTES[n],A=AUTOR[n];const l=(ROUTE_ITEMS[n]||[]).slice().sort((a,b)=>a.km-b.km);set={t:"Meine Strecke: "+(A?A.t:(r?r.ab+" Richtung "+r.dir:"")),l};}
  else set=AB_SETS[k];
  if(!set){box.hidden=true;return;}
  {if(/^r\d+$/.test(k)){const h=$("prio-h");if(h&&box.nextElementSibling!==h)h.before(box);}else{const an=$("stau-sum");if(an&&an.nextElementSibling!==box)an.after(box);}}
  box.hidden=false;
  box.innerHTML='<div class="abd-head"><h3>'+esc(set.t)+' <span class="muted small">('+set.l.length+')</span></h3><button type="button" class="td-x x-round" data-close="1" aria-label="Schließen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'+
    (set.l.length?'<div class="muted small" style="margin-bottom:6px">Eintrag antippen für alle Angaben (Abschnitt, Dauer, Umleitung).</div>'+set.l.map(abItem).join(""):'<div class="state good">Keine Meldungen auf dieser Strecke im Umkreis von '+PRIO_RADIUS_KM+' km.</div>');
  document.querySelectorAll("#stau-sum .fbtn,#prio .route").forEach(b=>b.classList.toggle("on",(b.dataset.f||("r"+b.dataset.route))===k));
  const miss=set.l.filter(x=>!x.ort&&!x._pq&&isFinite(x.lat)).slice(0,40);
  if(miss.length)(async()=>{for(const x of miss){x._pq=1;x.ort=await placeOf(x.lat,x.lon);}if(AB_SEL===k){const op=[...box.querySelectorAll("details.abd")].map(d=>d.open);showAbDetail(k);box.querySelectorAll("details.abd").forEach((d,j)=>{if(op[j])d.open=true;});}})();
}
function selectAb(k){AB_SEL=AB_SEL===k?null:k;if(!AB_SEL){$("stau-detail").hidden=true;document.querySelectorAll("#stau-sum .fbtn,#prio .route").forEach(b=>b.classList.remove("on"));return;}
  showAbDetail(AB_SEL);setTimeout(()=>$("stau-detail").scrollIntoView({behavior:"smooth",block:"start"}),30);}
document.addEventListener("click",e=>{
  const f=e.target.closest("#stau-sum .fbtn");if(f){selectAb(f.dataset.f);return;}
  const r=e.target.closest("#prio .route[data-route]");if(r){selectAb("r"+r.dataset.route);return;}
  if(e.target.closest("#stau-detail [data-close]")){selectAb(AB_SEL);return;}
  const g=e.target.closest("#stau-detail [data-goto]");if(g&&MAP){const [la,lo]=g.dataset.goto.split(",").map(Number);openMap();setTimeout(()=>$("stau-map").scrollIntoView({behavior:"smooth",block:"center"}),150);MAP.setView([la,lo],13);
    MAPLAYER.eachLayer(l=>{const ll=l.getLatLng&&l.getLatLng();if(ll&&Math.abs(ll.lat-la)<1e-6&&Math.abs(ll.lng-lo)<1e-6&&l.openPopup)l.openPopup();});}
});
document.addEventListener("keydown",e=>{const r=e.target.closest&&e.target.closest("#prio .route[data-route]");if(r&&(e.key==="Enter"||e.key===" ")){e.preventDefault();selectAb("r"+r.dataset.route);}});
async function loadAutobahn(){
  const roads=C.ab,prioOnly=[...new Set(ROUTES.map(r=>r.ab))].filter(a=>!roads.includes(a));
  if(!roads.length&&!ROUTES.length){
    const msg='<div class="state">Für '+esc(C.town)+' sind noch keine Autobahnen hinterlegt. <a href="#einstellungen">Unter Einstellungen → Meine Orte eintragen</a>, z. B. „A1, A43“.</div>';
    ["stau-list","traffic","roadworks","webcams","charging"].forEach(id=>$(id).innerHTML=msg);$("stau-sum").innerHTML="";$("prio").innerHTML="";setKpi("k-traffic","–","keine Autobahnen gewählt","info");
    if(ensureMap())MAPLAYER.clearLayers();return;}
  const svcs=["warning","closure","roadworks","webcam","electric_charging_station"];
  const got={};svcs.forEach(s=>got[s]=[]);const rawW=[],rawC=[],rawR=[],okRoads=new Set();let ok=0,total=0;const cLat=C.center.lat,cLon=C.center.lon,keyAtStart=C.key;
  const jobs=[...roads.flatMap(ab=>svcs.map(svc=>[ab,svc,true])),...prioOnly.flatMap(ab=>["warning","closure","roadworks"].map(svc=>[ab,svc,false]))];
  await Promise.all(jobs.map(async([ab,svc,local])=>{
    total++;
    try{const d=await getJSON("https://verkehr.autobahn.de/o/autobahn/"+encodeURIComponent(ab)+"/services/"+svc,20000);ok++;okRoads.add(ab);
      const lim=(svc==="warning"||svc==="closure")?JAM_RADIUS_KM:RADIUS_KM;
      (d[svc]||[]).forEach(w=>{const c=w.coordinate||{};const km=distKm(cLat,cLon,parseFloat(c.lat),parseFloat(c.long));if(!isFinite(km))return;
        const item={...w,ab,km,lat:parseFloat(c.lat),lon:parseFloat(c.long)};
        if(svc==="warning"&&km<=PRIO_RADIUS_KM)rawW.push(item);
        if(svc==="closure"&&km<=PRIO_RADIUS_KM)rawC.push(item);
        if(svc==="roadworks"&&km<=PRIO_RADIUS_KM)rawR.push(item);
        if(local&&km<=lim)got[svc].push(item);});
    }catch(e){}
  }));
  if(keyAtStart!==C.key)return; // Ort inzwischen gewechselt
  renderPrio(rawW,rawC,okRoads,rawR);
  if(!roads.length){
    const msg='<div class="state">Für '+esc(C.town)+' sind keine weiteren Autobahnen hinterlegt. <a href="#einstellungen">Unter Einstellungen → Meine Orte eintragen</a>.</div>';
    ["stau-list","traffic","roadworks","webcams","charging"].forEach(id=>$(id).innerHTML=msg);$("stau-sum").innerHTML="";
    const bad=$("prio").querySelector(".route.bad,.route.crit");setKpi("k-traffic",bad?"!":"–",bad?"Störung auf Meinen Strecken":"Meine Strecken frei",bad?"bad":"ok");
    if(ensureMap())MAPLAYER.clearLayers();setStatus("ab",ok>0,ok?"":"nicht erreichbar");return;}
  if(!ok){setStatus("ab",false,"nicht erreichbar oder vom Browser blockiert (CORS)");
    const fb=stateBox("Die Autobahn-Schnittstelle antwortet nicht.",link("https://www.autobahn.de/","autobahn.de"));
    ["stau-list","traffic","roadworks","webcams","charging"].forEach(id=>$(id).innerHTML=fb);$("stau-sum").innerHTML="";setKpi("k-traffic","?","nicht geladen","warn");return;}
  setStatus("ab",true,ok<total?"teilweise geladen ("+ok+"/"+total+")":"");
  const uniq=list=>{const seen=new Set();return list.filter(i=>{const k=i.ab+"|"+i.title+"|"+i.subtitle+"|"+(i.identifier||"");if(seen.has(k))return false;seen.add(k);return true;});};
  const desc=w=>(w.description||[]).filter(Boolean).slice(0,3).join(" · ");
  const isClosed=m=>m._c||m.isBlocked==="true"||m.isBlocked===true;
  const warnings=uniq(got.warning);
  const prioIdx=w=>{const i=ROUTES.findIndex(r=>routeHit(w,r));return i<0?99:i;};
  const jams=warnings.map(w=>({...w,jam:jamInfo(w),pr:prioIdx(w)})).filter(w=>w.jam)
    .sort((a,b)=>a.pr-b.pr||(b.jam.kind==="stau")-(a.jam.kind==="stau")||(b.jam.delay||0)-(a.jam.delay||0)||a.km-b.km);
  const closuresAll=uniq([...got.closure.map(x=>({...x,_c:1})),...warnings.filter(w=>w.isBlocked==="true"||w.isBlocked===true)]);
  const maxDelay=jams.reduce((m,j)=>Math.max(m,j.jam.delay||0),0);
  const totLen=jams.reduce((s,j)=>s+(j.jam.len||0),0);
  const nStau=jams.filter(j=>j.jam.kind==="stau").length;
  const others=warnings.filter(w=>!w.jam&&!jamInfo(w)).length;
  TILE_PARTS.traffic.ab=TILE_PARTS.traffic._tt?"":(jams.length?jams.length+" Staus/stockend":"Autobahn frei")+(maxDelay?" bis +"+maxDelay+" min":"");
  if(!TILE_PARTS.traffic._tt)composeTile("k-traffic","traffic",String(jams.length)+"<small> Staus</small>","info");else composeTile("k-traffic","traffic");
  if(false)setKpi("k-traffic",String(jams.length),jams.length?(maxDelay?"bis +"+maxDelay+" min":"")+(totLen?" · "+fmt(totLen,1)+" km":"")+(closuresAll.length?" · "+closuresAll.length+" Sperrung(en)":""):"freie Fahrt"+(closuresAll.length?" · "+closuresAll.length+" Sperrung(en)":""),
    nStau?(maxDelay>=20?"bad":"warn"):jams.length?"warn":"ok");
  const otherList=warnings.filter(w=>!jamInfo(w)&&!isClosed(w)).sort((a,b)=>a.km-b.km);
  AB_SETS={
    stau:{t:"Staus",l:jams.filter(j=>j.jam.kind==="stau")},
    stockend:{t:"Stockender Verkehr",l:jams.filter(j=>j.jam.kind!=="stau")},
    len:{t:"Staus mit Längenangabe (längste zuerst)",l:jams.filter(j=>j.jam.len).sort((a,b)=>b.jam.len-a.jam.len)},
    delay:{t:"Verzögerungen (größte zuerst)",l:jams.filter(j=>j.jam.delay!=null).sort((a,b)=>b.jam.delay-a.jam.delay)},
    sperr:{t:"Sperrungen (nächste zuerst)",l:[...closuresAll].sort((a,b)=>a.km-b.km)},
    other:{t:"Weitere Behinderungen",l:otherList},
    bau:{t:"Baustellen (Meine Strecken zuerst, dann nächste)",l:uniq(got.roadworks).map(w=>({...w,_rw:1,pr:prioIdx(w)})).sort((a,b)=>(a.pr<99?0:1)-(b.pr<99?0:1)||a.km-b.km)}};
  const fb=(k,v,l)=>'<button type="button" class="fact fbtn'+(AB_SEL===k?" on":"")+'" data-f="'+k+'"'+(AB_SETS[k].l.length?"":" disabled")+'><b>'+v+'</b><span>'+l+'</span></button>';
  $("stau-sum").innerHTML=fb("stau",String(nStau),"Staus")+fb("stockend",String(jams.length-nStau),"stockender Verkehr")+fb("len",totLen?fmt(totLen,1)+" km":"–","Staulänge gesamt")+fb("delay",maxDelay?"+"+maxDelay+" min":"–","größte Verzögerung")+fb("sperr",String(closuresAll.length),"Sperrungen")+fb("other",String(otherList.length),"weitere Behinderungen")+fb("bau",String(AB_SETS.bau.l.length),"Baustellen");
  renderCarIncs();
  if(AB_SEL&&!/^r\d/.test(AB_SEL))showAbDetail(AB_SEL);else if(AB_SEL)showAbDetail(AB_SEL);
  $("stau-list").innerHTML=jams.length?'<div>'+jams.map(j=>{const J=j.jam;
      const det=[J.len?fmt(J.len,1)+" km":"",J.speed!=null?"Ø "+J.speed+" km/h":"",fmt(j.km)+" km entfernt"].filter(Boolean).join(" · ");
      return '<div class="jam" data-kat="stau" data-lat="'+j.lat+'" data-lon="'+j.lon+'"><span class="tag ab">'+esc(j.ab)+'</span><div class="t"><b class="ortp"></b>'+(j.pr<99?'<span class="pill" style="margin-right:6px">Meine Strecke</span>':'')+(J.kind==="stau"?'<span class="pill p-bad" style="margin-right:6px"><i></i>Stau</span>':'<span class="pill p-warn" style="margin-right:6px"><i></i>stockend</span>')+esc(j.title)+'</div>'+
        '<div class="delay'+(J.delay!=null&&J.delay>=20?"":J.delay>=10?" mid":" low")+'">'+(J.delay!=null?"+"+J.delay+" min":"")+'<small>'+(J.delay!=null?"Verzögerung":"")+'</small></div>'+
        '<div class="d">'+esc(j.subtitle||"")+(det?" · "+esc(det):"")+(desc(j)?'<br>'+esc(desc(j)):"")+'</div></div>';}).join("")+'</div>'
    :'<div class="state good">Derzeit keine Staus auf '+esc(roads.join(", "))+' im Umkreis von '+JAM_RADIUS_KM+' km.</div>';
  if(ensureMap()){
    MAPLAYER.clearLayers();
    uniq(got.roadworks).forEach(r=>{if(isFinite(r.lat))L.circleMarker([r.lat,r.lon],{radius:5,color:"#fff",weight:1.5,fillColor:"#6f7f8a",fillOpacity:.9,kat:"bau"}).bindPopup(popupHtml(r,"Baustelle")).addTo(MAPLAYER);});
    warnings.filter(w=>!jamInfo(w)&&!isClosed(w)).forEach(w=>{if(isFinite(w.lat))L.circleMarker([w.lat,w.lon],{radius:6,color:"#fff",weight:2,fillColor:"#c98a00",fillOpacity:1,kat:"unfall"}).bindPopup(popupHtml(w,"Behinderung")).addTo(MAPLAYER);});
    closuresAll.forEach(c=>{const lines=geomLines(c);
      lines.forEach(ll=>L.polyline(ll,{color:"#7d1f6b",weight:5,opacity:.9,kat:"sperr"}).bindPopup(popupHtml(c,"<b>Sperrung</b>")).addTo(MAPLAYER));
      if(isFinite(c.lat))L.circleMarker([c.lat,c.lon],{radius:6,color:"#fff",weight:2,fillColor:"#7d1f6b",fillOpacity:1,kat:"sperr"}).bindPopup(popupHtml(c,"<b>Sperrung</b>")).addTo(MAPLAYER);});
    jams.forEach(j=>{const col=j.jam.kind==="stau"?"#d62d20":"#f0a020";const extra=[j.jam.delay!=null?"<b>+"+j.jam.delay+" min</b>":"",j.jam.len?fmt(j.jam.len,1)+" km":"",j.jam.speed!=null?"Ø "+j.jam.speed+" km/h":""].filter(Boolean).join(" · ");
      const lines=geomLines(j);
      if(lines.length)lines.forEach(ll=>{L.polyline(ll,{color:"#fff",weight:10,opacity:.8,interactive:false,kat:"stau"}).addTo(MAPLAYER);L.polyline(ll,{color:col,weight:6,opacity:1,kat:"stau"}).bindPopup(popupHtml(j,extra)).addTo(MAPLAYER);});
      else if(isFinite(j.lat))L.circleMarker([j.lat,j.lon],{radius:8,color:"#fff",weight:2,fillColor:col,fillOpacity:1,kat:"stau"}).bindPopup(popupHtml(j,extra)).addTo(MAPLAYER);});
    vlMapFilter();
    drawVTOnMap();setTimeout(()=>MAP.invalidateSize(),50);
  }else{$("stau-map").innerHTML='<div class="state" style="margin:12px">Kartenbibliothek nicht geladen – die Liste darunter ist vollständig.</div>';}
  const jamIds=new Set(jams.map(j=>j.ab+"|"+j.title+"|"+j.subtitle+"|"+(j.identifier||"")));
  const msgs=uniq([...got.closure.map(x=>({...x,_c:1})),...warnings]).filter(m=>!jamIds.has(m.ab+"|"+m.title+"|"+m.subtitle+"|"+(m.identifier||"")))
    .sort((a,b)=>(isClosed(b)?1:0)-(isClosed(a)?1:0)||a.km-b.km);
  $("traffic").innerHTML=msgs.length?'<div class="list">'+msgs.slice(0,40).map(i=>'<div class="li" data-kat="'+(isClosed(i)?"sperr":"unfall")+'" data-lat="'+i.lat+'" data-lon="'+i.lon+'"><span class="tag ab">'+esc(i.ab)+'</span><div class="t"><b class="ortp"></b>'+
    (isClosed(i)?'<span class="pill p-bad" style="margin-right:6px"><i></i>Sperrung</span>':'')+esc(i.title)+'</div><div class="r muted small">'+fmt(i.km)+' km</div><div class="d">'+esc(i.subtitle||"")+(desc(i)?" – "+esc(desc(i)):"")+'</div></div>').join("")+'</div>'+
    (msgs.length>40?'<div class="muted small">+ '+(msgs.length-40)+' weitere</div>':''):'<div class="state good">Keine weiteren Behinderungen im Umkreis.</div>';
  fillOrte($("stau-list")).then(()=>fillOrte($("traffic"))).then(()=>fillOrte($("roadworks")));
  const rw=uniq(got.roadworks).sort((a,b)=>a.km-b.km);
  setKpi("k-verk",String(rw.length)+"<small> Baustellen</small>",uniq(got.electric_charging_station).length+" Ladepunkte","info");
  $("roadworks").innerHTML=rw.length?'<div class="list">'+rw.slice(0,40).map(i=>'<div class="li" data-kat="bau" data-lat="'+i.lat+'" data-lon="'+i.lon+'"><span class="tag ab">'+esc(i.ab)+'</span><div class="t"><b class="ortp"></b>'+esc(i.title)+'</div><div class="r muted small">'+fmt(i.km)+' km</div><div class="d">'+esc(i.subtitle||"")+(desc(i)?" – "+esc(desc(i)):"")+'</div></div>').join("")+'</div>'+
    '<div class="muted small">'+rw.length+' Baustellen im Umkreis von '+RADIUS_KM+' km</div>':'<div class="state good">Keine Baustellen im Umkreis.</div>';
  const cams=uniq(got.webcam).filter(c=>c.imageurl).sort((a,b)=>a.km-b.km).slice(0,12);CAM_N.ab=cams.length;camTile();
  $("webcams").innerHTML=cams.length?'<div class="cams">'+cams.map(c=>'<a class="cam" href="'+esc(safeUrl(c.linkurl||c.imageurl))+'" target="_blank" rel="noopener"><img loading="lazy" alt="Webcam '+esc(c.title)+'" src="'+esc(safeUrl(c.imageurl))+'"><span><b>'+esc(c.ab)+'</b> '+esc(c.subtitle||c.title)+'</span></a>').join("")+'</div>':'<div class="muted small">Die Autobahn GmbH liefert derzeit keine Webcam-Bilder im Umkreis.</div>';
  const ch=uniq(got.electric_charging_station).sort((a,b)=>a.km-b.km);
  $("charging").innerHTML=ch.length?'<div class="list">'+ch.slice(0,8).map(i=>'<div class="li"><span class="tag ab">'+esc(i.ab)+'</span><div class="t">'+esc(i.title)+'</div><div class="r muted small">'+fmt(i.km)+' km</div><div class="d">'+esc(i.subtitle||"")+(desc(i)?" – "+esc(desc(i)):"")+'</div></div>').join("")+'</div>':stateBox("Keine Ladestationen an Autobahnen im Umkreis.");
}

// ================= Tankerkönig =================
// Unterwegs: automatisch der aktuelle Standort, wenn er mehr als 2 km vom gewählten Ort entfernt ist
let AUTOPOS=null,AUTOAT=0,FUELPOS=null;const AUTOMAN={};
function nearPos(fresh){return new Promise(res=>{if(!window.isSecureContext||!navigator.geolocation)return res(null);
  if(!fresh&&AUTOPOS&&Date.now()-AUTOAT<120000)return res(AUTOPOS);
  navigator.geolocation.getCurrentPosition(p=>{AUTOPOS={lat:p.coords.latitude,lon:p.coords.longitude};AUTOAT=Date.now();res(AUTOPOS);},()=>res(null),{enableHighAccuracy:false,timeout:8000,maximumAge:fresh?0:120000});});}
async function autoAway(){try{if(navigator.permissions){const st=await navigator.permissions.query({name:"geolocation"});if(st.state==="denied")return null;}}catch(e){}
  const p=await nearPos();if(!p||!isFinite(C.lat))return null;return distKm(p.lat,p.lon,C.lat,C.lon)>2?p:null;}
async function fuelAuto(){if(AUTOMAN.fu)return;const p=await autoAway();const was=FUELPOS;FUELPOS=p;if(!!was!==!!p||(p&&was&&distKm(p.lat,p.lon,was.lat,was.lon)>0.3))loadFuel();}
document.addEventListener("click",e=>{const a=e.target.closest("[data-fuelpos]");if(!a)return;e.preventDefault();
  if(a.dataset.fuelpos==="ort"){AUTOMAN.fu=true;FUELPOS=null;$("fu-q").value="";loadFuel();}
  else{AUTOMAN.fu=true;AUTOPOS=null;const box=$("fuel");box.innerHTML='<div class="state">Standort wird ermittelt …</div>';nearPos().then(p=>{if(!p){box.innerHTML=stateBox("Standort nicht freigegeben – unter Einstellungen → Apps → Safari → Standort „Erlauben“ wählen.");return;}FUELPOS={...p};$("fu-q").value="";loadFuel();});}});
document.addEventListener("submit",async e=>{if(e.target.id!=="fu-form")return;e.preventDefault();const q=$("fu-q").value.trim();if(!q)return;const hb=$("fu-hits");hb.innerHTML='<div class="muted small">sucht …</div>';
  try{const r=await getJSON("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=de&accept-language=de&q="+encodeURIComponent(q));
    const set=(la,lo,n)=>{hb.innerHTML="";AUTOMAN.fu=true;FUELPOS={lat:la,lon:lo,name:n};loadFuel();};
    if(!r.length){hb.innerHTML='<div class="muted small">Nichts gefunden – anders schreiben, z. B. „Holstenstraße 1, Kiel“.</div>';return;}
    if(r.length===1){set(+r[0].lat,+r[0].lon,r[0].name||q);return;}
    hb.innerHTML=r.map(x=>'<button type="button" data-fuhit="'+x.lat+','+x.lon+'" data-n="'+esc(x.name||q)+'">'+esc(x.display_name)+'</button>').join("");
    hb.querySelectorAll("[data-fuhit]").forEach(b=>b.addEventListener("click",()=>{const [la,lo]=b.dataset.fuhit.split(",").map(Number);set(la,lo,b.dataset.n);}));
  }catch(err){hb.innerHTML='<div class="muted small">Ortssuche nicht erreichbar – '+esc(errText(err))+'.</div>';}});
async function loadFuel(){
  const box=$("fuel");const FP=FUELPOS;{const h=$("fuel-h");if(h)h.textContent=FP?(FP.name?"Tankstellen · "+FP.name:"Tankstellen in deiner Nähe"):"Tankstellen in "+(C.isDus?"Düsseldorf":C.town);}
  if(!TK){box.innerHTML=stateBox("Für Spritpreise einmal einen kostenlosen Tankerkönig-Schlüssel unter Einstellungen eintragen.",'<a href="#einstellungen">Zu den Einstellungen</a>');setStatus("fuel",false,"Schlüssel fehlt");return;}
  try{const d=await getJSON("https://creativecommons.tankerkoenig.de/json/list.php?lat="+(FP?FP.lat:C.lat)+"&lng="+(FP?FP.lon:C.lon)+"&rad="+(FP?5:C.isDus?4:8)+"&sort=dist&type=all&apikey="+encodeURIComponent(TK));
    if(!d.ok)throw new Error(d.message||"Abfrage abgelehnt");
    const st=(d.stations||[]).slice(0,15);/* auch geschlossene zeigen (ausgegraut), z. B. früh morgens */
    if(!st.length){box.innerHTML=stateBox("Keine Tankstelle in der Nähe gefunden.");setStatus("fuel",true);return;}
    const best=k=>Math.min(...st.filter(s=>s.isOpen).map(s=>s[k]).filter(v=>typeof v==="number"));
    const bE5=best("e5"),bE10=best("e10"),bD=best("diesel");
    const p=(v,b,o)=>typeof v!=="number"?"–":'<span style="'+(o!==false&&v===b?"color:var(--ok);font-weight:700":"")+'">'+v.toFixed(2).replace(".",",")+'<sup>9</sup></span>';
    let r='<table><thead><tr><th>Tankstelle</th><th class="num">km</th><th class="num">Super E5</th><th class="num">E10</th><th class="num">Diesel</th></tr></thead><tbody>';
    st.forEach(s=>{const ad=((s.street||"")+" "+(s.houseNumber||"")).trim()+", "+(s.place||"");const nv=isFinite(s.lat)&&isFinite(s.lng)?(IOS?"comgooglemaps://?daddr="+s.lat+","+s.lng+"&directionsmode=driving":"https://www.google.com/maps/dir/?api=1&travelmode=driving&dir_action=navigate&destination="+s.lat+","+s.lng):"";
      r+='<tr'+(s.isOpen?'':' class="fu-closed"')+'><td class="wrap-txt">'+(nv?'<a class="fu-nav" href="'+nv+'"'+(IOS?'':' target="_blank" rel="noopener"')+' title="Mit Google Maps hinfahren">':'')+'<b>'+esc(s.brand||s.name)+'</b>'+(s.isOpen?'':' <span class="fu-zu">geschlossen</span>')+'<br><span class="small">'+GMICON+esc(ad)+(nv?' ↗':'')+'</span>'+(nv?'</a>':'')+'</td><td class="num">'+fmt(s.dist,1)+'</td><td class="num">'+p(s.e5,bE5,s.isOpen)+'</td><td class="num">'+p(s.e10,bE10,s.isOpen)+'</td><td class="num">'+p(s.diesel,bD,s.isOpen)+'</td></tr>';});
    box.innerHTML='<div class="tbl-wrap">'+r+'</tbody></table></div><div class="muted small">'+(FP?(FP.name?'Um '+esc(FP.name):'Um deinen aktuellen Standort')+' · <a href="#" data-fuelpos="ort">zurück zu '+esc(C.short)+'</a>':'Tankstellen nahe '+esc(C.short)+(AUTOMAN.fu?' · <a href="#" data-fuelpos="gps">um meinen Standort suchen</a>':''))+'<br>Sortiert nach Entfernung · günstigster Preis der geöffneten grün · geschlossene ausgegraut.</div>';
    setStatus("fuel",true);
  }catch(e){setStatus("fuel",false,errText(e));box.innerHTML=stateBox("Spritpreise nicht verfügbar – "+errText(e)+".");}
}

// ================= ÖPNV =================
const normStop=x=>String(x||"").toLowerCase().replace(/straße/g,"str.").replace(/[^a-z0-9äöüß]/g,"");
function stopMatch(v){const n=normStop(v);const I=STOPIDX||{available:[],all:[]};
  const a=I.available.find(x=>normStop(x.name)===n||normStop(x.q)===n||normStop(x.name).endsWith(n));
  if(a)return {file:a.file,name:a.name,id:a.id};
  const s=I.all.find(x=>normStop(x.name)===n)||I.all.find(x=>normStop(x.name).includes(n));
  return s?{id:s.id,name:s.name}:{};}
async function loadStopIndex(){STOPIDX=null;if(!ec().efaDefault||!EFAKEYS.includes(ec().key))return;
  try{STOPIDX=(await getData("stops-"+ec().key+".json")).data;
  }catch(e){STOPIDX={available:[],all:[]};}}
function proxyOn(){try{return !!EFAPROXY;}catch(e){return false;}}
/* U78 Heinrich-Heine-Allee → MERKUR SPIEL-ARENA: Direktfahrten live über den VRR-Vermittler, Abfahrt und Ankunft */
let U78T=null,U78GAP=false;
/* Nikolaus-Knopp-Platz → MERKUR SPIEL-ARENA: Verbindungen mit Umstieg (U75 bis Heine-Allee, dann U78) aus der VRR-Auskunft */
let KAT=null;
const KA_CFG={"@KA":{first:/^U75$/,A:"de%3A05111%3A18131",Z:"de%3A05111%3A18075",to:"Ankunft",note:"ab Nikolaus-Knopp-Platz · Umstieg an der Heinrich-Heine-Allee in die U78",none:"Gerade keine Verbindung zur Arena gefunden."},
 "@TAKI":{A:"de%3A05111%3A18281",Z:"de%3A05111%3A18131",to:"Ankunft",last:/^U75$/,note:"ab Messe Ost/Stockumer Kirchstr. mit U78/U79/U80 · Umstieg in die U75 Richtung Neuss",none:"Gerade keine Verbindung nach Hause gefunden."}};
async function kaLive(seq,key){key=key||"@KA";const C=KA_CFG[key];const box=$("efa");clearTimeout(KAT);if(!box)return;if((box.dataset.v||"")!=="ka"+key)box.innerHTML='<div class="state">Verbindungen werden geladen …</div>';box.dataset.v="ka"+key;
  const base=EFAPROXY.replace(/\/$/,""),A=C.A,Z=C.Z;
  const atT=ms=>{const p=new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date(ms)).reduce((o,x)=>(o[x.type]=x.value,o),{});return "&itdDate="+p.year+p.month+p.day+"&itdTime="+p.hour+p.minute;};
  const isPT=l=>l.transportation&&l.transportation.product&&![99,100].includes(l.transportation.product.class);
  try{/* der VRR liefert pro Anfrage nur ca. 3 Fahrten – bis zu viermal ab der letzten Abfahrt weiterfragen */
    const all=[];let t=Date.now();
    const draw=fin=>{
    const seen=new Set(),rows=[];
    all.forEach(x=>{const P=x.legs.filter(isPT);if(!P.length)return;{const ln=q=>String(q.transportation.disassembledName||"").replace(/\s+/g,"");if((C.first||C.last)&&(P.length>2||(C.first&&!C.first.test(ln(P[0])))||(C.last&&!C.last.test(ln(P[P.length-1])))))return;}const f=P[0],l=P[P.length-1];const k=P.map(q=>q.transportation.disassembledName+q.origin.departureTimePlanned).join("|");if(seen.has(k))return;seen.add(k);
      const dep=f.origin.departureTimePlanned,depEst=f.origin.departureTimeEstimated;if(new Date(depEst||dep).getTime()<Date.now()-60e3)return;
      rows.push({dep,depEst,arr:l.destination.arrivalTimePlanned,arrEst:l.destination.arrivalTimeEstimated,legs:P.map(q=>({line:String(q.transportation.disassembledName||q.transportation.number||"").replace(/\s+/g,""),
        from:(q.origin.name||"").replace(/^(Düsseldorf[ ,-]*|D-)/,"").replace(/\s+U$/,""),dep:q.origin.departureTimePlanned,depEst:q.origin.departureTimeEstimated,arr:q.destination.arrivalTimePlanned,arrEst:q.destination.arrivalTimeEstimated})),
        cx:P.some(q=>(q.realtimeStatus||[]).includes("TRIP_CANCELLED")||q.isCancelled)});});
    /* gleiche Abfahrt am Knopp-Platz: nur die schnellste Verbindung */
    {const best=new Map();rows.forEach(r=>{const k=String(r.dep).slice(0,16);const b=best.get(k);if(!b||new Date(r.arrEst||r.arr)<new Date(b.arrEst||b.arr))best.set(k,r);});rows.length=0;rows.push(...best.values());}
    rows.sort((a,b)=>new Date(a.depEst||a.dep)-new Date(b.depEst||b.dep));rows.splice(12);
    const hm=x=>new Date(x).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"});const dl=(p,e)=>e?Math.round((new Date(e)-new Date(p))/6e4):0;
    const late=(p,e)=>{const d=dl(p,e);return d>0?' <span style="color:#e53935;font-weight:700">+'+d+'</span>':"";};
    box.innerHTML=rows.length?'<table class="tbl efa-tbl u78-tbl" style="width:100%"><thead><tr><th>Ab</th><th>Verbindung</th><th>'+C.to+'</th></tr></thead><tbody>'+rows.map(r=>{
        const lines='<span class="kl-row">'+r.legs.map(q=>'<span class="kline">'+esc(q.line)+'</span>').join('<span class="kl-ar">→</span>')+'</span>';
        const via=r.legs.slice(1).map(q=>"Umstieg <span style=\"white-space:nowrap\">"+esc(q.from.replace(/^Heinrich-Heine-Allee$/,"Heine-Allee"))+" <b>"+hm(q.depEst||q.dep)+"</b>"+late(q.dep,q.depEst)+"</span>").join("<br>");
        return '<tr'+(r.cx?' style="opacity:.5;text-decoration:line-through"':'')+'><td><b>'+hm(r.depEst||r.dep)+'</b>'+late(r.dep,r.depEst)+'</td><td>'+lines+(via?'<span class="kl-via">'+via+'</span>':'')+'</td><td><b>'+hm(r.arrEst||r.arr)+'</b>'+late(r.arr,r.arrEst)+'<small class="muted" style="display:block;font-size:12.5px">'+Math.round((new Date(r.arrEst||r.arr)-new Date(r.depEst||r.dep))/6e4)+' min</small></td></tr>';}).join("")+'</tbody></table>'
      +'<div class="muted small" style="margin-top:6px">'+C.note+' · Verbindungen laut VRR-Auskunft · '+link("https://www.rheinbahn.de/","Rheinbahn")+'</div>'
      :!fin?'<div class="state">Verbindungen werden geladen …</div>':stateBox(C.none,link("https://www.rheinbahn.de/","Rheinbahn"));
    };
    for(let k=0;k<6;k++){const j=await getJSON(base+"/standard/XML_TRIP_REQUEST2?outputFormat=rapidJSON&language=de&type_origin=any&name_origin="+A+"&type_destination=any&name_destination="+Z+"&calcNumberOfTrips=6&useRealtime=1"+atT(t),15000).catch(()=>({}));
      if(seq!==EFASEQ||EFASTOP!==key)return;const js=(j.journeys||[]).filter(x=>(x.legs||[]).some(isPT));if(!js.length){t+=10*60e3;continue;}all.push(...js);draw(false);
      t=Math.max(...js.map(x=>new Date(x.legs.find(isPT).origin.departureTimePlanned).getTime()))+60e3;}
    draw(true);
    setStatus("efa",true,"live");}
  catch(e){if(seq===EFASEQ)box.innerHTML=stateBox("Verbindungen gerade nicht verfügbar – "+errText(e)+".",link("https://www.rheinbahn.de/","Rheinbahn"));}
  KAT=setTimeout(()=>{if(EFASTOP===key&&document.visibilityState==="visible")kaLive(EFASEQ,key);},60000);}
/* „Taki“ (Grieche an der Messe Ost): U78/U79/U80 ab Messe Ost/Stockumer Kirchstr. Richtung Heinrich-Heine-Allee */
let TAKIT=null;
async function takiLive(seq){const box=$("efa");clearTimeout(TAKIT);if(!box)return;if((box.dataset.v||"")!=="taki")box.innerHTML='<div class="state">Live-Fahrten werden geladen …</div>';box.dataset.v="taki";
  const base=EFAPROXY.replace(/\/$/,""),ID="de%3A05111%3A18281",HA="de%3A05111%3A18036";
  const atT=ms=>{const p=new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date(ms)).reduce((o,x)=>(o[x.type]=x.value,o),{});return "&itdDate="+p.year+p.month+p.day+"&itdTime="+p.hour+p.minute;};
  try{const [a,b,t]=await Promise.all([0,75].map(m=>getJSON(base+"/standard/XML_DM_REQUEST?outputFormat=rapidJSON&language=de&type_dm=any&name_dm="+ID+"&mode=direct&useRealtime=1&limit=120&lineRestriction=400"+atT(Date.now()+m*6e4),15000).catch(()=>({}))).concat(
      getJSON(base+"/standard/XML_TRIP_REQUEST2?outputFormat=rapidJSON&language=de&type_origin=any&name_origin="+ID+"&type_destination=any&name_destination="+HA+"&maxChanges=0&calcNumberOfTrips=8&useRealtime=1",15000).catch(()=>({}))));
    if(seq!==EFASEQ||EFASTOP!=="@TAKI")return;
    const mk=x=>String(x||"").slice(0,16),arrBy=new Map();
    (t.journeys||[]).forEach(j=>{const l=(j.legs||[])[0];if(!l||!l.transportation)return;arrBy.set(String(l.transportation.disassembledName||"").replace(/\s+/g,"")+mk(l.origin.departureTimePlanned),{arr:l.destination.arrivalTimePlanned,arrEst:l.destination.arrivalTimeEstimated});});
    const seen=new Set(),rows=[];
    [...(a.stopEvents||[]),...(b.stopEvents||[])].forEach(e=>{const tr=e.transportation||{};const line=String(tr.disassembledName||tr.number||"").replace(/\s+/g,"").toUpperCase();
      if(!/^U(78|79|80)$/.test(line)||!/uni ost|botanisch|hbf|hauptbahnhof|holthausen|heine/i.test((tr.destination||{}).name||""))return;
      const k=line+mk(e.departureTimePlanned);if(seen.has(k))return;seen.add(k);const dep=e.departureTimePlanned,depEst=e.departureTimeEstimated;
      if(new Date(depEst||dep).getTime()<Date.now()-60e3)return;const x=arrBy.get(k);
      rows.push({line,dest:((tr.destination||{}).name||"").replace(/^(Düsseldorf[ ,-]*|D-)/,"").replace(/\/Botanischer Garten$/,""),dep,depEst,arr:x?x.arr:new Date(new Date(dep).getTime()+11*6e4).toISOString(),arrEst:x?x.arrEst:(depEst?new Date(new Date(depEst).getTime()+11*6e4).toISOString():null),exact:!!x,
        cx:(e.realtimeStatus||[]).includes("TRIP_CANCELLED")||!!e.isCancelled});});
    rows.sort((x,y)=>new Date(x.depEst||x.dep)-new Date(y.depEst||y.dep));rows.splice(18);
    const hm=x=>new Date(x).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"});const dl=(p,e)=>e?Math.round((new Date(e)-new Date(p))/6e4):0;
    box.innerHTML=rows.length?'<table class="tbl efa-tbl u78-tbl" style="width:100%"><thead><tr><th>Ab</th><th>Linie</th><th>An Heine-Allee</th></tr></thead><tbody>'+rows.map(r=>{const d1=dl(r.dep,r.depEst);const st=[];if(r.cx)st.push("opacity:.5;text-decoration:line-through");
        return '<tr'+(st.length?' style="'+st.join(";")+'"':'')+'><td><b>'+hm(r.depEst||r.dep)+'</b>'+(d1>0?' <span style="color:#e53935;font-weight:700">+'+d1+'</span>':'')+'</td><td><span class="line">'+esc(r.line)+'</span><small class="muted" style="display:block;font-size:12.5px;line-height:1.25">'+esc(r.dest)+'</small></td><td><b>'+(r.exact?'':'ca. ')+hm(r.arrEst||r.arr)+'</b><small class="muted" style="display:block;font-size:12.5px">'+Math.round((new Date(r.arrEst||r.arr)-new Date(r.depEst||r.dep))/6e4)+' min</small></td></tr>';}).join("")+'</tbody></table>'
      +'<div class="muted small" style="margin-top:6px">ab Messe Ost/Stockumer Kirchstr., Steig 1 · alle drei Linien fahren durch bis Heinrich-Heine-Allee (ca. 11 min) · '+link("https://www.rheinbahn.de/","Rheinbahn")+'</div>'
      :stateBox("Gerade keine Abfahrten Richtung Heinrich-Heine-Allee gefunden.",link("https://www.rheinbahn.de/","Rheinbahn"));
    setStatus("efa",true,"live");}
  catch(e){if(seq===EFASEQ)box.innerHTML=stateBox("Live-Abfahrten gerade nicht verfügbar – "+errText(e)+".",link("https://www.rheinbahn.de/","Rheinbahn"));}
  TAKIT=setTimeout(()=>{if(EFASTOP==="@TAKI"&&document.visibilityState==="visible")takiLive(EFASEQ);},45000);}
async function u78Live(seq){const R=EFASTOP==="@U78R",SP=EFASTOP;const box=$("efa");clearTimeout(U78T);if(!box)return;if(!box.innerHTML||(box.dataset.v||"")!=="u78"+(R?"r":""))box.innerHTML='<div class="state">Live-Fahrten werden geladen …</div>';box.dataset.v="u78"+(R?"r":"");
  try{if(!proxyOn())throw new Error("Vermittler fehlt");const base=EFAPROXY.replace(/\/+$/,"");const HA=await tripStopId("Düsseldorf Heinrich-Heine-Allee"),AR="de:05111:18075";const a=R?AR:HA,z=R?HA:AR;
    /* Abfahrtsmonitor Heine-Allee (viele Fahrten) + Verbindungsauskunft (genaue Ankunft) zusammenführen */
    const [d,dm,ALTD]=await Promise.all([getJSON(base+"/standard/XML_TRIP_REQUEST2?outputFormat=rapidJSON&language=de&type_origin=any&name_origin="+encodeURIComponent(a)+"&type_destination=any&name_destination="+encodeURIComponent(z)+"&itdTripDateTimeDepArr=dep&calcNumberOfTrips=8&maxChanges=0&useRealtime=1",9000).catch(()=>({})),
      (async()=>{/* Heine-Allee ist sehr belebt: zwei Abfragen (jetzt und in 60 min), damit genug U78-Fahrten zusammenkommen */
        const at=m=>{const t=new Date(Date.now()+m*6e4),p=new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(t).reduce((o,x)=>(o[x.type]=x.value,o),{});return "&itdDate="+p.year+p.month+p.day+"&itdTime="+p.hour+p.minute;};
        /* nacheinander statt gleichzeitig und mit eigenen Wiederholungen: der VRR lehnt parallele Abfragen gern ab (HTTP 403) –
           fehlte das Fenster „jetzt“, begann die Liste sonst erst eine Stunde später */
        const one=async m=>{for(let i=0;i<3;i++){try{return await getJSON(base+"/standard/XML_DM_REQUEST?outputFormat=rapidJSON&language=de&type_dm=any&name_dm="+encodeURIComponent(a)+"&mode=direct&useRealtime=1&limit=250&lineRestriction=400"+at(m),15000);}catch(e){await new Promise(r=>setTimeout(r,1500*(i+1)));}}return null;};
        const r0=await one(0),r1=await one(60);
        return {stopEvents:[r0,r1].flatMap(x=>(x&&x.stopEvents)||[]),gap:!r0};})(),
      /* Rückweg: Verbindungen mit Umstieg/Fußweg (z. B. abends zu Fuß zum Freiligrathplatz + U79/U80), falls keine U78 mehr fährt */
      R?(async()=>{/* Rückweg ohne U78 (abends/nachts): U79/U80 ab Freiligrathplatz Richtung Stadt – zwei Zeitfenster, damit auch die Nachtfahrten dabei sind */
        const atT=ms=>{const p=new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date(ms)).reduce((o,x)=>(o[x.type]=x.value,o),{});return "&itdDate="+p.year+p.month+p.day+"&itdTime="+p.hour+p.minute;};
        const rs=await Promise.all([0,180,360].map(m=>getJSON(base+"/standard/XML_DM_REQUEST?outputFormat=rapidJSON&language=de&type_dm=any&name_dm=de%3A05111%3A18028&mode=direct&useRealtime=1&limit=200&lineRestriction=400"+atT(Date.now()+m*6e4),15000).catch(()=>({}))));
        return {stopEvents:rs.flatMap(x=>x.stopEvents||[])};})():Promise.resolve({})]);

    if(seq!==EFASEQ||EFASTOP!==SP)return;U78GAP=!!dm.gap;
    const seen=new Set();const tr=(d.journeys||[]).map(j=>(j.legs||[]).filter(l=>l.transportation&&l.transportation.product&&![99,100].includes(l.transportation.product.class))).filter(l=>l.length===1).map(([l])=>({line:l.transportation.disassembledName||"",dep:l.origin.departureTimePlanned,depEst:l.origin.departureTimeEstimated,arr:l.destination.arrivalTimePlanned,arrEst:l.destination.arrivalTimeEstimated,plat:(l.origin.properties||{}).platformName||(l.origin.properties||{}).platform||"",cx:(l.realtimeStatus||[]).includes("TRIP_CANCELLED")}))
      .filter(r=>/U\s?78/i.test(r.line)&&!seen.has(r.dep)&&seen.add(r.dep));
    const tt=tr.length?tr.reduce((x,r)=>x+(new Date(r.arr)-new Date(r.dep)),0)/tr.length:16*6e4;const mk=x=>String(x||"").slice(0,16);const byDep=new Map(tr.map(r=>[mk(r.dep),r]));
    const ln=e=>{const t=e.transportation||{};return String(t.disassembledName||t.number||"").replace(/\s+/g,"");};
    const isOther=e=>!R&&/^U(79|80)$/i.test(ln(e))&&/duisburg|flughafen|airport|kaiserswerth|wittlaer|lohausen|arena|messe|stadion|stockum|nordpark|freiligrath|reeser/i.test(((e.transportation||{}).destination||{}).name||"");
    const rows=(dm.stopEvents||[]).filter(e=>{const t=e.transportation||{};return (/^U78$/i.test(ln(e))&&(R?/hbf|hauptbahnhof|heine/i:/arena|messe|stadion|stockum/i).test((t.destination||{}).name||""))||isOther(e);})
      .map(e=>{const dep=e.departureTimePlanned;if(isOther(e))return {line:ln(e).toUpperCase(),other:true,dest:(((e.transportation||{}).destination||{}).name||"").replace(/^(Düsseldorf[ ,-]*|D-)/,"").replace(/\s+S\s+U$|\s+U$/,""),dep,depEst:e.departureTimeEstimated,arr:null,plat:(e.location&&e.location.properties&&(e.location.properties.platformName||e.location.properties.platform))||"",cx:(e.realtimeStatus||[]).includes("TRIP_CANCELLED")||!!e.isCancelled};const j=byDep.get(mk(dep));const sh=e.departureTimeEstimated?new Date(e.departureTimeEstimated)-new Date(dep):0;
        return j||{line:"U78",dep,depEst:e.departureTimeEstimated,arr:new Date(new Date(dep).getTime()+tt).toISOString(),arrEst:sh?new Date(new Date(dep).getTime()+tt+sh).toISOString():null,plat:(e.location&&e.location.properties&&(e.location.properties.platformName||e.location.properties.platform))||"",cx:(e.realtimeStatus||[]).includes("TRIP_CANCELLED")||!!e.isCancelled};});
    tr.forEach(r=>{if(!rows.some(x=>!x.other&&mk(x.dep)===mk(r.dep)))rows.push(r);});{const sn=new Set();for(let i=0;i<rows.length;i++){const k2=(rows[i].other?rows[i].line:"U78")+mk(rows[i].dep);if(sn.has(k2)){rows.splice(i,1);i--;}else sn.add(k2);}}rows.sort((x,y)=>new Date(x.dep)-new Date(y.dep));
    for(let i=rows.length-1;i>=0;i--)if(new Date(rows[i].depEst||rows[i].dep).getTime()<Date.now()-60e3)rows.splice(i,1);
    if(R){const tm=x=>new Date(x).getTime(),WALK=34*6e4,RIDE=13*6e4;const hm0=x=>new Date(x).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"});
      const u78=rows.filter(x=>!x.other).map(x=>tm(x.dep)).sort((a,b)=>a-b);const seenA=new Set();
      (ALTD.stopEvents||[]).forEach(e=>{const t=e.transportation||{};const line=String(t.disassembledName||t.number||"").replace(/\s+/g,"").toUpperCase();
        if(!/^U(79|80)$/.test(line)||!/uni ost|botanisch|hbf|hauptbahnhof|holthausen|heine/i.test((t.destination||{}).name||""))return;
        const pd=e.departureTimePlanned,ed=e.departureTimeEstimated;const k=line+String(pd).slice(0,16);if(seenA.has(k))return;seenA.add(k);
        const leave=tm(ed||pd)-WALK;if(leave<Date.now()-60e3)return;
        /* nur in der Lücke, in der keine U78 fährt (Abstand zur vorigen/nächsten U78 über 40 min) */
        const prev=u78.filter(x=>x<=leave).pop(),next=u78.find(x=>x>leave);
        if(next!=null&&next-leave<40*6e4)return;if(prev!=null&&leave-prev<20*6e4&&next!=null)return;
        rows.push({alt:true,other:true,line,fp:pd,fpEst:ed||null,dest:"ab Freiligrathplatz",dep:new Date(tm(pd)-WALK).toISOString(),depEst:ed?new Date(tm(ed)-WALK).toISOString():null,arr:new Date(tm(pd)+RIDE).toISOString(),arrEst:ed?new Date(tm(ed)+RIDE).toISOString():null,cx:(e.realtimeStatus||[]).includes("TRIP_CANCELLED")});});
      rows.sort((x,y)=>tm(x.dep)-tm(y.dep));}
    rows.splice(R?24:20);
    const hm=x=>new Date(x).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"});const dl=(p,e)=>e?Math.round((new Date(e)-new Date(p))/6e4):0;
    box.innerHTML=(U78GAP?'<div class="state warn" style="margin-bottom:8px">Die Fahrten der nächsten Stunde werden gerade nachgeladen …</div>':'')+(rows.length?'<table class="tbl efa-tbl u78-tbl" style="width:100%"><thead><tr><th>Ab</th><th>Linie</th><th>'+(R?"An Heine-Allee":"An Arena")+'</th></tr></thead><tbody>'+rows.map(r=>{const d1=dl(r.dep,r.depEst),d2=dl(r.arr,r.arrEst);
      const st=[];if(!r.other)st.push("background:rgba(255,204,0,.28)");if(r.cx)st.push("opacity:.5;text-decoration:line-through");
      if(r.alt){const d3=dl(r.fp,r.fpEst);/* groß: echte Live-Abfahrt am Freiligrathplatz; klein darunter: Empfehlung zum Loslaufen */
        return '<tr style="background:rgba(79,182,211,.14)"><td><b>'+hm(r.fpEst||r.fp)+'</b>'+(d3>0?' <span style="color:#e53935;font-weight:700">+'+d3+'</span>':'')+'</td><td><span class="line">'+esc(r.line)+'</span><small class="muted" style="display:block;font-size:12.5px;line-height:1.25">'+esc(r.dest)+'</small></td><td><b>ca. '+hm(r.arrEst||r.arr)+'</b><small class="muted" style="display:block;font-size:12.5px">geschätzt</small></td></tr>';}
      if(r.other)return '<tr'+(st.length?' style="'+st.join(";")+'"':'')+'><td><b>'+hm(r.depEst||r.dep)+'</b>'+(d1>0?' <span style="color:#e53935;font-weight:700">+'+d1+'</span>':'')+'</td><td><span class="line">'+esc(r.line)+'</span><small class="muted" style="display:block;font-size:12.5px;line-height:1.25">'+esc(r.dest)+'</small></td><td><b>ca. '+hm(new Date(new Date(r.depEst||r.dep).getTime()+13*6e4))+'</b><small class="muted" style="display:block;font-size:12.5px;line-height:1.25">Freiligrath&shy;platz</small></td></tr>';
      return '<tr'+(st.length?' style="'+st.join(";")+'"':'')+'><td><b>'+hm(r.depEst||r.dep)+'</b>'+(d1>0?' <span style="color:#e53935;font-weight:700">+'+d1+'</span>':'')+'</td><td><span class="line">U78</span></td><td><b>'+hm(r.arrEst||r.arr)+'</b>'+(d2>0?' <span style="color:#e53935">+'+d2+'</span>':'')+'<small class="muted" style="display:block;font-size:12.5px">'+Math.round((new Date(r.arrEst||r.arr)-new Date(r.depEst||r.dep))/6e4)+' min</small></td></tr>';}).join("")+'</tbody></table><div class="muted small" style="margin-top:6px">'+(R?'<span style="background:rgba(255,204,0,.28);padding:0 4px;border-radius:4px">U78 gelb</span> · '+(rows.some(x=>x.alt)?'<span style="background:rgba(79,182,211,.14);padding:0 4px;border-radius:4px">Blau</span> = U79/U80 ab Freiligrathplatz, solange keine U78 fährt (Abfahrt live) · ':''):'<span style="background:rgba(255,204,0,.28);padding:0 4px;border-radius:4px">U78 gelb</span> fährt bis zur Arena · U79/U80 fahren bis Freiligrathplatz (nächster Halt zur Arena, Ankunft geschätzt) · ')+'Direktfahrten '+(R?'U78 ':'')+(R?'ab MERKUR SPIEL-ARENA/Messe Nord bis Heinrich-Heine-Allee':'ab Heinrich-Heine-Allee bis MERKUR SPIEL-ARENA/Messe Nord')+' · <b style="color:var(--ok)">● live</b> (VRR) · erneuert alle 45 s</div>'
      :'<div class="state">Gerade keine U78-Fahrt zur Arena gefunden.</div>');setStatus("efa",true,"U78 live");
  }catch(e){if(seq===EFASEQ)box.innerHTML=stateBox("U78-Fahrten gerade nicht abrufbar.",link("https://www.rheinbahn.de/","Rheinbahn"));}
  U78T=setTimeout(()=>{if(EFASTOP===SP&&box.offsetParent)u78Live(seq);},U78GAP?8000:45000);}
/* Düsseldorf: Haltestellen-Knöpfe in zwei Gruppen – U75 zum/vom Nikolaus-Knopp-Platz und Arena & Messe */
function dusStops(cur){const av=((STOPIDX&&STOPIDX.available)||[]).map(a=>a.name);const nm=(rx,def)=>av.find(n=>rx.test(n))||def;
  const K=nm(/knopp/i,"Düsseldorf Nikolaus-Knopp-Platz"),O=nm(/oststr/i,"Düsseldorf Oststraße"),B=nm(/barbarossa/i,"Düsseldorf Barbarossaplatz"),H=nm(/heine/i,"Düsseldorf Heinrich-Heine-Allee"),S=nm(/steinstr/i,"Düsseldorf Steinstr./Königsallee");
  const b=(id,t,sm,wide)=>'<button type="button" data-stop="'+esc(id)+'" class="'+(cur===id?"on":"")+(wide?" wide":"")+'">'+esc(t)+'<small>'+esc(sm)+'</small></button>';
  return '<div class="stop-grp">Ab Knopp-Platz</div>'+b(K,"In die City","U75")+b("@KA","Zur Arena","U75 + U78")
    +'<div class="stop-grp">Nach Hause <span>→ Knopp-Platz</span></div>'+b(H,"Heine-Allee","U75")+b(O,"Oststraße","U75")+b(S,"Kö/Steinstraße","U75")+b(B,"Barbarossaplatz","U75")+b("@TAKI","Taki · Messe Ost","U78/U79/U80 + U75",1)
    +'<div class="stop-grp">Arena &amp; Messe</div>'+b("@U78","Heine-Allee","→ Arena")+b("@U78R","Arena","→ Heine-Allee");}
async function loadEFA(){const EK=ec().key;
  if(!ec().efaDefault){$("efa-title").textContent="Abfahrten";$("efa-stops").innerHTML="";$("efa").innerHTML=stateBox("Für diesen Ort gibt es keine Echtzeit-Abfahrten im VRR.",'<a href="https://www.hvv.de/de/fahrplaene/abruf-fahrplaninfos/abfahrten" target="_blank" rel="noopener">HVV-Abfahrten ↗</a>');setStatus("efa",true,"keine Haltestelle hinterlegt");return;}
  if(!STOPIDX)await loadStopIndex();
  // gespeicherte Haltestelle nur verwenden, wenn sie für diesen Ort wirklich abgerufen wird (sonst Standard, z. B. Nikolaus-Knopp-Platz)
  let stop=STOPS[ec().key]||ec().efaDefault;
  if(ec().isDus&&stop==="@KA"){EFASTOP=stop;efaGo();$("efa-stops").innerHTML=dusStops(stop);
    $("efa-title").textContent="Richtung Arena";$("efa-src").textContent="U75 + U78 · Umstieg Heine-Allee · Echtzeit";kaLive(++EFASEQ);return;}
  if(ec().isDus&&stop==="@TAKI"){EFASTOP=stop;efaGo();const avail=(STOPIDX&&STOPIDX.available)||[];
    $("efa-stops").innerHTML=dusStops(stop);
    $("efa-title").textContent="Nach Hause";$("efa-src").textContent="Taki · Messe Ost → Knopp-Platz · U78/U79/U80 + U75 · Echtzeit";kaLive(++EFASEQ,"@TAKI");return;}
  if(ec().isDus&&(stop==="@U78"||stop==="@U78R")){const R=stop==="@U78R";EFASTOP=stop;efaGo();const avail=(STOPIDX&&STOPIDX.available)||[];
    $("efa-stops").innerHTML=dusStops(stop);
    $("efa-title").textContent=R?"Richtung City":"Richtung Arena";$("efa-src").textContent=R?"U78 ab Arena → Heine-Allee · Echtzeit":"U78 ab Heine-Allee → Arena (+ U79/U80) · Echtzeit";u78Live(++EFASEQ);return;}
  {const mm=stopMatch(stop);if(stop!==ec().efaDefault&&!mm.file&&!(mm.id&&proxyOn())){delete STOPS[ec().key];store("stops",STOPS);stop=ec().efaDefault;}}
  const m=stopMatch(stop);EFASTOP=stop;efaGo();
  let avail=(STOPIDX&&STOPIDX.available)||[];if(avail.length<2&&ec().isDus)avail=["Düsseldorf Nikolaus-Knopp-Platz","Düsseldorf Heinrich-Heine-Allee","Düsseldorf Oststraße","Düsseldorf Barbarossaplatz"].map(n=>({name:n,file:null}));
  $("efa-stops").innerHTML=ec().isDus?dusStops(stop):avail.length>1?avail.map(a=>'<button type="button" data-stop="'+esc(a.name)+'" class="'+((a.file?m.file===a.file:stop===a.name)?"on":"")+'">'+esc(a.name.replace(/^(Düsseldorf|Datteln|Alpen),?\s*/,"").replace(/\s+U$/,"").replace(/^Heinrich-Heine-Allee$/,"Heine-Allee").replace(/^Nikolaus-Knopp-Platz$/,"Knopp-Platz"))+'</button>').join(""):"";
  $("efa-dir").value=DIRF[ec().key]||"";
  {const sn0=normStop(stop),nmS=(m.name||stop).replace(/^Düsseldorf[, ]*/,"").replace(/\s+U$/,"");
    $("efa-title").textContent=!ec().isDus?"Abfahrten "+nmS:sn0.includes("knopp")?"Richtung City":/heinrichheine|oststr|barbarossa|steinstr/.test(sn0)?"Nach Hause":"Rheinbahn · "+nmS;}
  $("efa-src").textContent=ec().isDus?(/knopp/.test(normStop(stop))?"U75 ab Knopp-Platz · Echtzeit":/heinrichheine|oststr|barbarossa|steinstr/.test(normStop(stop))?"U75 ab "+String(stop).replace(/^Düsseldorf\s+/,"").replace(/^Steinstr\.\/Königsallee$/,"Kö/Steinstraße").replace(/^Heinrich-Heine-Allee$/,"Heine-Allee")+" → Knopp-Platz · Echtzeit":"Bus, U- und Straßenbahn · Echtzeit"):"Bus & Bahn vor Ort · Echtzeit";
  const file=m.file||(stop===ec().efaDefault?"efa-"+ec().key+".json":null);
  if(!file&&m.id&&proxyOn()&&EFAKEYS.includes(ec().key)){/* jede beliebige VRR-Haltestelle: direkt live über den Vermittler */
    EFADATA=null;$("efa").innerHTML='<div class="state">Live-Abfahrten werden geladen …</div>';
    EFADATA={generated:new Date().toISOString(),data:{stop:m.name||stop,id:m.id,rows:[]}};efaLive(m.id,EK,stop,++EFASEQ);return;}
  if(!file||!EFAKEYS.includes(ec().key)){EFADATA=null;
    $("efa").innerHTML=stateBox("„"+esc(m.name||stop)+"“ wird noch nicht automatisch abgerufen.",(m.id?link("https://efa.vrr.de/vrr/XSLT_DM_REQUEST?language=de&type_dm=stop&mode=direct&useRealtime=1&name_dm="+encodeURIComponent(m.id),"Live-Abfahrten öffnen")+" · ":"")+"Claude kann sie fest ergänzen.");return;}
  try{if(!BUSF)BUSF=await getData("busfahrten.json").then(x=>x.data||[]).catch(()=>[]);const ED=await getData(file);if(ec().key!==EK)return;EFADATA=ED;renderEFA();setStatus("efa",true,"Stand "+dataAge(EFADATA));
    efaLive(m.id||(ED.data&&ED.data.id)||null,EK,stop,++EFASEQ);}
  catch(e){/* gesammelte Datei fehlt oder ist kaputt: direkt live beim VRR holen statt Fehlermeldung */
    if(proxyOn()&&EFAKEYS.includes(ec().key)){try{const id=m.id||(await tripStopId(m.name||stop));if(id&&ec().key===EK){EFADATA={generated:new Date().toISOString(),data:{stop:m.name||stop,id,rows:[]}};$("efa").innerHTML='<div class="state">Live-Abfahrten werden geladen …</div>';efaLive(id,EK,stop,++EFASEQ);return;}}catch(e2){}}
    setStatus("efa",false,errText(e));$("efa").innerHTML=stateBox("Abfahrten nicht verfügbar – "+errText(e)+".",link(ec().isDus?"https://www.rheinbahn.de/":"https://www.vrr.de/",ec().isDus?"Rheinbahn":"VRR-Fahrplanauskunft"));}
}
/* Abfahrten live – Reihenfolge: 1) eigener Cloudflare-Vermittler, 2) VRR direkt, 3) DB-Auskunft (transport.rest), 4) gesammelte Daten */
let EFASEQ=0,EFALIVE_T=null,EFAPROXY=(load("efaproxy")||"https://vrr-proxy.thomas-hussmann.workers.dev").trim();const HAFASID=load("hafasid")||{};
const efaRows=d=>(d.stopEvents||[]).map(e=>{const tr=e.transportation||{};return{planned:e.departureTimePlanned,est:e.departureTimeEstimated,line:tr.disassembledName||tr.number||tr.name||"",dir:tr.destination&&tr.destination.name||"",
  plat:e.location&&e.location.properties&&(e.location.properties.platform||e.location.properties.platformName)||"",cancelled:(e.realtimeStatus||[]).includes("TRIP_CANCELLED")};});
async function efaFrom(base,id,name){const d=await getJSON(base+"/standard/XML_DM_REQUEST?outputFormat=rapidJSON&language=de&type_dm="+(id?"stop":"any")+"&name_dm="+encodeURIComponent(id||name)+"&mode=direct&useRealtime=1&limit=160&itdDateTimeDepArr=dep&useAllStops=1",7000);
  const L=d.locations&&d.locations[0];const rows=efaRows(d);if(!rows.length)throw new Error("leer");return{name:L&&(L.disassembledName||L.name),rows};}
async function hafasDeps(stopName){const TR="https://v6.db.transport.rest";
  let hid=HAFASID[stopName];
  if(!hid){const q=stopName.replace(/\s+U$/,"");const l=await getJSON(TR+"/locations?query="+encodeURIComponent(q.includes("Düsseldorf")?q:"Düsseldorf "+q)+"&results=1&addresses=false&poi=false",7000);
    hid=l&&l[0]&&l[0].id;if(!hid)throw new Error("Haltestelle unbekannt");HAFASID[stopName]=hid;store("hafasid",HAFASID);}
  const d=await getJSON(TR+"/stops/"+encodeURIComponent(hid)+"/departures?duration=90&results=120&remarks=false",8000);
  const rows=(d.departures||d||[]).map(x=>({planned:x.plannedWhen,est:x.when||x.plannedWhen,line:((x.line&&x.line.name)||"").replace(/^(U|Bus|STR|Tram)\s+/i,(m,a)=>/^u$/i.test(a)?"U":""),dir:x.direction||"",plat:x.platform||x.plannedPlatform||"",cancelled:!!x.cancelled,delay:x.delay!=null?Math.round(x.delay/60):null}));
  if(!rows.length)throw new Error("leer");return{rows};}
async function efaLive(id,EK,stop,seq){
  const stopName=(EFADATA&&EFADATA.data&&EFADATA.data.stop)||stop;let res=null,src="";
  const tries=[];if(EFAPROXY)tries.push(["Vermittler",()=>efaFrom(EFAPROXY.replace(/\/+$/,""),id,stop)]);
  tries.push(["VRR",()=>efaFrom("https://efa.vrr.de",id,stop)]);
  tries.push(["DB",()=>hafasDeps(stopName)]);
  for(const [n,f] of tries){try{res=await f();src=n;break;}catch(e){}}
  if(res&&ec().key===EK&&seq===EFASEQ){EFADATA={generated:new Date().toISOString(),live:true,src,data:{stop:res.name||stopName,id,rows:res.rows}};renderEFA();setStatus("efa",true,"live · "+src);}
  clearTimeout(EFALIVE_T);EFALIVE_T=setTimeout(()=>{const box=$("efa");if(box&&box.offsetParent&&seq===EFASEQ)efaLive(id,EK,stop,seq);},45000);}
{const i=$("efaproxy"),b=$("efaproxy-save"),st=$("efaproxy-st");if(i&&b){i.value=EFAPROXY;b.addEventListener("click",async()=>{EFAPROXY=i.value.trim();store("efaproxy",EFAPROXY);b.textContent="Gespeichert ✓";setTimeout(()=>b.textContent="Speichern",1500);
  if(st&&EFAPROXY){st.textContent="Test läuft …";try{await getJSON(EFAPROXY.replace(/\/+$/,"")+"/standard/XML_STOPFINDER_REQUEST?outputFormat=rapidJSON&type_sf=any&name_sf=D%C3%BCsseldorf%20Hbf",8000);st.textContent="✓ Vermittler antwortet";}catch(e){st.textContent="✗ keine Antwort – Adresse prüfen";}}});}}
function renderEFA(){const d=EFADATA;if(!d)return;
  const pairs=(BUSF||[]).filter(x=>x.key===ec().key);
  $("efa-dir").parentElement.hidden=pairs.length>0;$("efa-stops").hidden=false;
  if(pairs.length){const now=Date.now()-60e3;busLive(pairs);
    const short=x=>x.replace(/^(Datteln|Dortmund),?\s*/,"").replace(/^Bus Bf$/,"Busbahnhof").replace(/^Lohstr\.$/,"Lohstraße");
    const nx=pairs.map(x=>({x,r:x.rows.filter(r=>new Date(r.depEst||r.dep).getTime()>=now)}));
    const f=nx[0]&&nx[0].r[0];
    if(f){TILE_PARTS.mobil.bus="Bus "+esc(f.line)+" "+hhmm(f.depEst||f.dep)+" "+short(nx[0].x.from)+" → "+short(nx[0].x.to);composeTile("k-bahn","mobil");}
    $("efa-title").textContent=ec().key==="dortmund"?"Westfalenstadion → Hauptbahnhof":"Bus Lohstraße ⇄ Busbahnhof";
    const di=Math.min(+(load("busdir_"+ec().key)||0),nx.length-1);
    $("efa-stops").innerHTML=nx.map(({x},i)=>'<button type="button" data-bdir="'+i+'" class="'+(i===di?"on":"")+'">'+esc(short(x.from))+' → '+esc(short(x.to))+'</button>').join("");
    $("efa").innerHTML=nx.filter((_,i)=>i===di).map(({x,r})=>'<div class="sublbl">'+esc(short(x.from))+' → '+esc(short(x.to))+'</div>'+(r.length?'<div class="list" style="margin-bottom:12px">'+r.slice(0,6).map(r=>{const dm=r.depEst&&r.dep?Math.round((new Date(r.depEst)-new Date(r.dep))/6e4):0;
      return '<div class="li"><span class="tag">'+esc(r.line)+'</span><div class="t"><b>'+hhmm(r.dep)+'</b>'+(dm>0?' <span style="color:var(--bad);font-weight:600">+'+dm+'</span>':'')+' → an '+hhmm(r.arrEst||r.arr)+'</div><div class="r muted small">'+(r.plat?'Steig '+esc(r.plat):'')+'</div><div class="d">Richtung '+esc(r.dir)+'</div></div>';}).join("")+'</div>':'<div class="muted small" style="margin-bottom:12px">Keine direkte Fahrt in den nächsten Stunden.</div>')).join("")+
      '<div class="muted small">Nur Verbindungen ohne Umstieg · '+(pairs.every(x=>x.live)?'<b style="color:var(--ok)">● live</b> (VRR)':'Echtzeit abgerufen '+dataAge(d))+'</div>';
    return;}const now=Date.now()-60e3;const f=normStop(DIRF[ec().key]||"");
  let rows=(d.data.rows||[]).filter(x=>new Date(x.est||x.planned).getTime()>=now);
  /* Heine-Allee & Oststraße: nur die linksrheinischen Linien U75/U76/U77 Richtung Oberkassel/Heerdt/Neuss/Krefeld */
  {const sn=normStop(d.data.stop||"");
  /* Barbarossaplatz: nur Richtung Neuss */
  /* Knopp-Platz: nur U75 Richtung Vennhauser Allee (alles andere in der Rheinbahn-App) */
  if(ec().isDus&&sn.includes("knopp")){rows=rows.filter(x=>/^U\s?75$/i.test(x.line||"")&&/vennhaus/i.test(x.dir||""));const sk=new Set();rows=rows.filter(x=>{const k=x.line+"|"+String(x.planned||x.time||x.dep||"").slice(0,16);if(sk.has(k))return false;sk.add(k);return true;});}
  else if(ec().isDus&&(sn.includes("barbarossa")||sn.includes("heinrichheine")||sn.includes("oststr")||sn.includes("steinstr"))){
    /* nach Hause: nur die U75 Richtung Neuss – sie hält am Nikolaus-Knopp-Platz */
    rows=rows.filter(x=>/^U ?75$/i.test(String(x.line).trim())&&/neuss/i.test(x.dir||""));const sk=new Set();rows=rows.filter(x=>{const k=String(x.planned||x.time||x.dep||"").slice(0,16);if(sk.has(k))return false;sk.add(k);return true;});}}
  let noHit=false;if(f){const fr=rows.filter(x=>normStop(x.dir).includes(f)||normStop(x.line)===f);if(fr.length)rows=fr;else noHit=true;}
  rows=rows.slice(0,ec().isDus?16:14);
  EFASTOP=d.data.stop||"";efaGo();
  if(!rows.length){$("efa").innerHTML=busTripsHtml(d.data.stop)+stateBox(f?"Keine Linie fährt Richtung „"+esc(DIRF[ec().key])+"“. Für eine Verbindung mit Umsteigen den Knopf oben antippen.":"Keine weiteren Abfahrten im abgerufenen Zeitraum.");return;}
  {const x=rows[0];TILE_PARTS.mobil.bus=esc(x.line)+" "+hhmm(x.est||x.planned)+" ab "+esc(d.data.stop.replace(/^(Düsseldorf|Datteln),?\s*/,""));
    if(!(ec().isDus||ec().key==="datteln"))composeTile("k-bahn","mobil",hhmm(x.est||x.planned)+"<small> "+esc(x.line)+"</small>");else composeTile("k-bahn","mobil");}
  $("efa").innerHTML=busTripsHtml(d.data.stop)+efaStale(d)+(noHit?'<div class="muted small" style="margin-bottom:6px">Keine Linie fährt direkt Richtung „'+esc(DIRF[ec().key])+'“ – hier alle Abfahrten:</div>':'')+'<div class="muted small">'+esc(d.data.stop)+' · '+(ec().isDus&&normStop(d.data.stop||"").includes("knopp")?'nur U75 Richtung Vennhauser Allee':'alle Abfahrten')+' · '+(d.live?'<b style="color:var(--ok)">● live</b> ('+esc(d.src==='DB'?'DB-Auskunft':d.src==='VRR'?'VRR':'eigener Vermittler')+')':'Echtzeit abgerufen '+dataAge(d))+'</div><div class="tbl-wrap">'+depTable(rows)+'</div>'+(ec().isDus&&normStop(d.data.stop||"").includes("knopp")?'<div class="muted small" style="margin-top:6px">Andere Linien: <a href="https://www.rheinbahn.de/" target="_blank" rel="noopener">Rheinbahn ↗</a></div>':'');
}
let BUSF=null;
/* Direkte Busfahrten (Datteln Lohstr. ⇄ Busbahnhof, Westfalenstadion → Hbf) live über den VRR-Vermittler */
let BUSLIVE_AT=0,BUSLIVE_BUSY=false,BUSLIVE_T=null;
async function busLive(pairs){if(BUSLIVE_BUSY||Date.now()-BUSLIVE_AT<45000)return;BUSLIVE_BUSY=true;let ch=false;
  try{const base=((typeof EFAPROXY!=="undefined"&&EFAPROXY)||"").replace(/\/+$/,"");if(!base)return;
    await Promise.all(pairs.map(async x=>{try{const a=await tripStopId(x.fromQ||x.from),b=await tripStopId(x.toQ||x.to);
      const d=await getJSON(base+"/standard/XML_TRIP_REQUEST2?outputFormat=rapidJSON&language=de&type_origin=any&name_origin="+encodeURIComponent(a)+"&type_destination=any&name_destination="+encodeURIComponent(b)+"&itdTripDateTimeDepArr=dep&calcNumberOfTrips=6&maxChanges=0&useRealtime=1",9000);
      const seen=new Set();const rows=(d.journeys||[]).map(j=>(j.legs||[]).filter(l=>l.transportation&&l.transportation.product&&l.transportation.product.class!==100&&l.transportation.product.class!==99)).filter(l=>l.length===1).map(([l])=>({
        line:l.transportation.disassembledName||l.transportation.number||"",dir:(l.transportation.destination||{}).name||"",dep:l.origin.departureTimePlanned,depEst:l.origin.departureTimeEstimated,arr:l.destination.arrivalTimePlanned,arrEst:l.destination.arrivalTimeEstimated,
        plat:l.origin.properties&&(l.origin.properties.platformName||l.origin.properties.platform)||""})).filter(r=>{const k=r.line+r.dep;if(seen.has(k))return false;seen.add(k);return true;});
      if(rows.length){const lo=new Date(rows[0].dep).getTime();x.rows=[...rows,...x.rows.filter(r=>new Date(r.dep).getTime()>new Date(rows[rows.length-1].dep).getTime())].sort((p,q)=>new Date(p.dep)-new Date(q.dep));x.live=true;ch=true;}}catch(e){}}));
  }finally{BUSLIVE_BUSY=false;BUSLIVE_AT=Date.now();}
  if(ch&&EFADATA)renderEFA();clearTimeout(BUSLIVE_T);BUSLIVE_T=setTimeout(()=>{const box=$("efa");if(box&&box.offsetParent&&EFADATA)renderEFA();},50000);}
/* Abruf älter als 15 min (GitHub verzögert geplante Läufe): deutlicher Hinweis + Live-Abfahrten beim VRR */
function efaStale(d){const age=(Date.now()-new Date(d.generated))/6e4;if(!(age>15))return"";const st=(d.data&&d.data.stop)||EFASTOP||"";const mm=stopMatch(st);
  const u="https://efa.vrr.de/vrr/XSLT_DM_REQUEST?language=de&type_dm=stop&mode=direct&useRealtime=1&name_dm="+encodeURIComponent(mm.id||st);
  if(d.live)return '';return '<div class="state" style="margin-bottom:10px;border-left:3px solid var(--warn,#e0a800)"><b>Abfahrten '+dataAge(d)+' abgerufen</b> – Verspätungen können fehlen. <a href="'+u+'" target="_blank" rel="noopener">Live beim VRR ↗</a></div>';}
function busTripsHtml(stop){if(!BUSF)return"";const n=normStop(stop);
  const t=BUSF.filter(x=>x.key===ec().key&&(normStop(x.from)===n||normStop(x.fromQ).endsWith(n)||n.endsWith(normStop(x.from))));
  const now=Date.now()-60e3;
  return t.map(x=>{const r=x.rows.filter(r=>new Date(r.depEst||r.dep).getTime()>=now).slice(0,5);
    return '<div class="sublbl">Direkt nach '+esc(x.to.replace(/^Datteln,?\s*/,"").replace(/^Bus Bf$/,"Busbahnhof"))+'</div>'+(r.length?'<div class="list" style="margin-bottom:10px">'+r.map(r=>{const dm=r.depEst&&r.dep?Math.round((new Date(r.depEst)-new Date(r.dep))/6e4):0;
      return '<div class="li"><span class="tag">'+esc(r.line)+'</span><div class="t"><b>'+hhmm(r.dep)+'</b>'+(dm>0?' <span style="color:var(--bad);font-weight:600">+'+dm+'</span>':'')+' → an '+hhmm(r.arrEst||r.arr)+'</div><div class="r muted small">'+(r.plat?'Steig '+esc(r.plat):'')+'</div><div class="d">Richtung '+esc(r.dir)+'</div></div>';}).join("")+'</div>':'<div class="muted small" style="margin-bottom:10px">Keine direkte Fahrt im abgerufenen Zeitraum.</div>');}).join("");}
function depTable(rows){
  let r='<table><thead><tr><th>Zeit</th><th>Linie</th><th>Richtung</th><th class="num">Gleis/Steig</th><th class="num">+min</th></tr></thead><tbody>';
  /* gleiche Fahrt doppelt (z. B. „Neuss Hbf“ und „Neuss Hauptbahnhof“ zur selben Minute) nur einmal zeigen */
  {const sk=new Set();rows=rows.filter(x=>{const k=String(x.line).trim()+"|"+hhmm(x.planned||x.est)+"|"+String(x.dir||"").replace(/Hauptbahnhof/i,"Hbf").replace(/^D-/,"");if(sk.has(k))return false;sk.add(k);return true;});}
  rows.forEach(x=>{const mm=t=>{const d=new Date(t);d.setSeconds(0,0);return d.getTime();};const del=x.delay!=null?x.delay:(x.planned&&x.est?Math.round((mm(x.est)-mm(x.planned))/6e4):null);
    const st=normStop((EFADATA&&EFADATA.data&&EFADATA.data.stop)||"");
    /* U75 gelb: am Nikolaus-Knopp-Platz Richtung Stadt (Vennhauser Allee), an der Heinrich-Heine-Allee zurück Richtung Heerdt/Neuss */
    const u75=/^U ?75$/i.test(String(x.line).trim());
    /* Oststraße: jede Linie Richtung Neuss gelb */
    /* U75 gelb: am Knopp-Platz in die Stadt (alles außer Neuss), an Heine-Allee und Oststraße zurück Richtung Neuss */
    const toNeuss=/neuss/i.test(x.dir||"");
    const hl=ec().isDus&&(st.includes("barbarossa")?toNeuss:u75&&(st.includes("knopp")?!toNeuss:toNeuss));
    const tA=x.est||x.planned;r+='<tr'+(hl?' class="hl"':'')+'><td><b>'+(tA?hhmm(tA):"–")+'</b>'+(del>0&&x.planned&&hhmm(x.planned)!==hhmm(tA)?'<br><s class="muted small">'+hhmm(x.planned)+'</s>':'')+'</td><td><span class="tag">'+esc(x.line)+'</span></td><td class="wrap-txt">'+esc(x.dir)+'</td><td class="num">'+esc(x.plat||"")+'</td><td class="num">'+
      (x.cancelled?'<span class="pill p-bad"><i></i>fällt aus</span>':del==null?'<span class="muted">–</span>':del>0?'<span style="color:var(--bad);font-weight:600">+'+del+'</span>':'<span style="color:var(--ok)">0</span>')+'</td></tr>';});
  return r+'</tbody></table>';
}
async function loadDep(){
  if(!EFAKEYS.includes(ec().key)){$("dep").innerHTML=stateBox("Bahn-Abfahrten sind für Düsseldorf und die Favoriten hinterlegt.",link("https://www.bahn.de/","bahn.de"));return;}
  try{const d=await getData("db-"+ec().key+".json");const now=Date.now()-60e3;
    $("dep-title").textContent=d.data.stop+(ec().isDus?" · Bahn":" · Bahn & Bus");
    const rows=(d.data.rows||[]).filter(x=>new Date(x.planned).getTime()+((x.delay||0)*6e4)>=now).slice(0,12);
    if(!rows.length){$("dep").innerHTML=stateBox("Keine weiteren Abfahrten im abgerufenen Zeitraum.");setStatus("db",true);return;}
    $("dep").innerHTML='<div class="muted small">'+(d.data.dist!=null?"nächste Haltestelle, "+fmt(d.data.dist)+" m entfernt · ":"")+'Echtzeit abgerufen '+dataAge(d)+'</div><div class="tbl-wrap">'+depTable(rows)+'</div>';
    setStatus("db",true,"Stand "+dataAge(d));
  }catch(e){const m=/404/.test(errText(e))?"Bahn-Schnittstelle derzeit nicht erreichbar":errText(e);setStatus("db",false,m);$("dep").innerHTML=stateBox("Bahn-Abfahrten nicht verfügbar – "+m+". Bus und Bahn im VRR stehen links.",link("https://www.bahn.de/","bahn.de"));}
}
async function loadBike(){
  try{
    let cities=load("nb_cities");
    if(!cities||!cities.length){const l=await getJSON("https://maps.nextbike.net/maps/nextbike-live.json?list_cities=1",25000);
      cities=[];(l.countries||[]).forEach(c=>(c.cities||[]).forEach(ci=>{if(isFinite(ci.lat))cities.push({uid:ci.uid,name:ci.name,lat:ci.lat,lng:ci.lng});}));store("nb_cities",cities);}
    const near=cities.map(c=>({...c,km:distKm(C.center.lat,C.center.lon,c.lat,c.lng)})).filter(c=>c.km<=20).sort((a,b)=>a.km-b.km)[0];
    if(!near){BIKE={none:true};setStatus("bike",true,"kein Angebot in der Nähe");renderBike();return;}
    const d=await getJSON("https://maps.nextbike.net/maps/nextbike-live.json?city="+near.uid,20000);
    const city=(d.countries||[]).flatMap(c=>c.cities||[]).find(c=>String(c.uid)===String(near.uid));
    BIKE={places:(city&&city.places||[]).filter(p=>p.spot!==false),total:city&&city.available_bikes,city:near.name};
    setStatus("bike",true);
  }catch(e){BIKE=null;setStatus("bike",false,errText(e));}
  renderBike();
}
function renderBike(){
  if(!BIKE){$("bike").innerHTML=stateBox("Leihrad-Daten nicht verfügbar"+(status.bike?" – "+status.bike.msg:"")+".");return;}
  if(BIKE.none){$("bike").innerHTML=stateBox("Kein nextbike-Angebot in der Nähe von "+C.town+".");return;}
  const s=BIKE.places.map(p=>({...p,km:distKm(C.lat,C.lon,p.lat,p.lng)})).filter(p=>p.km<=6).sort((x,y)=>x.km-y.km).slice(0,7);
  if(!s.length){$("bike").innerHTML=stateBox("Keine Station im Umkreis von 6 km.");return;}
  $("bike").innerHTML='<div class="list">'+s.map(p=>'<div class="li"><span class="tag alt">'+fmt(p.km,1)+' km</span><div class="t">'+esc(p.name)+'</div><div class="r">'+fmt(p.bikes)+' Räder</div>'+
    (p.free_racks!=null?'<div class="d">'+fmt(p.free_racks)+' freie Plätze</div>':'')+'</div>').join("")+'</div>'+
    (BIKE.total!=null?'<div class="muted small">'+esc(BIKE.city)+': '+fmt(BIKE.total)+' verfügbare Räder</div>':'');
}

// ================= Kalender =================
async function loadHol(){
  const y=new Date().getFullYear(),code="DE-"+C.state;
  try{const [a,b]=await Promise.all([getJSON("https://date.nager.at/api/v3/PublicHolidays/"+y+"/DE"),getJSON("https://date.nager.at/api/v3/PublicHolidays/"+(y+1)+"/DE")]);
    HOL=[...a,...b].filter(h=>!h.counties||h.counties.includes(code));setStatus("hol",true);}
  catch(e){setStatus("hol",false,errText(e));}
  try{const from=isoDay(),to=isoDay(new Date(Date.now()+400*864e5));
    const s=await getJSON("https://openholidaysapi.org/SchoolHolidays?countryIsoCode=DE&subdivisionCode="+code+"&languageIsoCode=DE&validFrom="+from+"&validTo="+to);
    SCHOOL=(s||[]).map(x=>({start:x.startDate,end:x.endDate,name:((x.name||[]).find(n=>n.language==="DE")||(x.name||[])[0]||{}).text||"Ferien"}));setStatus("school",true);}
  catch(e){setStatus("school",false,errText(e));}
  renderCal();loadFerien();
}
// Schulferien-Übersicht: NRW immer, dazu das Land des Orts (z. B. Niedersachsen für Salzhausen)
const FERIEN_CACHE={};
async function loadFerien(){
  const y=new Date().getFullYear(),years=[y,y+1,y+2];
  const states=[...new Set(["NW",C.state])];
  $("fer-title").textContent="Schulferien "+years[0]+"–"+years[2]+" · "+states.map(s=>STATE_NAME[s]).join(" & ");
  try{
    const data=await Promise.all(states.map(async st=>{if(!FERIEN_CACHE[st]){const r=await getJSON("https://openholidaysapi.org/SchoolHolidays?countryIsoCode=DE&subdivisionCode=DE-"+st+"&languageIsoCode=DE&validFrom="+years[0]+"-01-01&validTo="+years[2]+"-12-31");
      FERIEN_CACHE[st]=(r||[]).map(x=>({start:x.startDate,end:x.endDate,name:(((x.name||[]).find(n=>n.language==="DE")||(x.name||[])[0]||{}).text||"Ferien").trim()}));}return [st,FERIEN_CACHE[st]];}));
    const today=isoDay();const dm=d=>d.slice(8,10)+"."+d.slice(5,7)+".";
    const ORDER=["Winterferien","Osterferien","Pfingstferien","Sommerferien","Herbstferien","Weihnachtsferien"];
    $("ferien").innerHTML='<div class="fer-grid">'+data.map(([st,l])=>{
      const names=[...new Set(l.map(x=>x.name))].sort((a,b)=>((ORDER.indexOf(a)+99)%105)-((ORDER.indexOf(b)+99)%105));
      return '<div class="fer"><div class="sublbl">'+esc(STATE_NAME[st])+'</div><div class="tbl-wrap"><table><thead><tr><th>Ferien</th>'+years.map(x=>'<th>'+x+'</th>').join("")+'</tr></thead><tbody>'+
        names.map(n=>'<tr><td>'+esc(n)+'</td>'+years.map(yr=>{const e=l.filter(x=>x.name===n&&x.start.startsWith(String(yr)));
          if(!e.length)return '<td class="muted">–</td>';
          const cls=e.some(x=>x.start<=today&&x.end>=today)?"now":e.every(x=>x.end<today)?"past":"";
          return '<td class="'+cls+'">'+e.map(x=>x.start===x.end?dm(x.start):dm(x.start)+"–"+dm(x.end)).join("<br>")+'</td>';}).join("")+'</tr>').join("")+'</tbody></table></div></div>';}).join("")+'</div>'+
      '<div class="muted small" style="margin-top:6px">Grün = laufende Ferien · durchgestrichen = vorbei. Spätere Jahre werden ergänzt, sobald die Länder sie veröffentlicht haben.</div>';
    setStatus("school",true);
  }catch(e){$("ferien").innerHTML=stateBox("Ferien nicht verfügbar – "+errText(e)+".",link("https://www.schulferien.org/","schulferien.org"));}
}
function renderCal(){
  $("cal-src").textContent="Feiertage · Schulferien "+(STATE_NAME[C.state]||"");
  const w=WX&&WX[C.wxIdx];let html="";const sn=STATE_NAME[C.state]||"";
  if(w){const d=w.daily;const len=d.daylight_duration[0];
    html+='<div class="facts">'+fact(hhmm(d.sunrise[0]*1000),"Sonnenaufgang")+fact(hhmm(d.sunset[0]*1000),"Sonnenuntergang")+fact(Math.floor(len/3600)+" h "+Math.round(len%3600/60)+" min","Tageslicht")+fact(String(isoWeek(new Date())),"Kalenderwoche")+(()=>{const m=moonInfo(new Date());return '<div class="fact moon"><b>'+m.e+' '+esc(m.n)+'</b><span>'+esc(m.full)+'</span></div>'})()+'</div>';}
  const today=isoDay();const nd=s=>new Date(s+"T12:00:00");const days=s=>Math.round((nd(s)-nd(today))/864e5);
  const rel=n=>n===0?"heute":n===1?"morgen":"in "+n+" Tagen";
  if(HOL&&HOL.length){const next=HOL.filter(h=>h.date>=today).slice(0,4);
    html+='<div><div class="sublbl">Feiertage '+esc(sn)+'</div><div class="list">'+next.map(h=>'<div class="li"><span class="tag">'+nd(h.date).toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"})+'</span><div class="t">'+esc(h.localName)+'</div><div class="r muted small">'+rel(days(h.date))+'</div></div>').join("")+'</div></div>';}
  if(SCHOOL&&SCHOOL.length){const cur=SCHOOL.find(s=>s.start<=today&&s.end>=today);const next=SCHOOL.filter(s=>s.start>today).slice(0,3);
    html+='<div><div class="sublbl">Schulferien '+esc(sn)+'</div>'+(cur?'<div class="state good">Jetzt: '+esc(cur.name)+' bis '+dateShort(nd(cur.end))+'</div>':'')+
      '<div class="list">'+next.map(s=>'<div class="li"><span class="tag alt">'+nd(s.start).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"})+'</span><div class="t">'+esc(s.name)+'</div><div class="r muted small">'+rel(days(s.start))+'</div><div class="d">bis '+dateShort(nd(s.end))+'</div></div>').join("")+'</div></div>';}
  {let v="–",n="",cls="info";
    const cur=SCHOOL&&SCHOOL.find(x=>x.start<=today&&x.end>=today);
    const hol=HOL&&HOL.find(h=>h.date>=today);
    if(cur){v='<span class="vt">'+esc(cur.name).replace(/^(Herbst|Oster|Sommer|Winter|Pfingst|Weihnachts)(ferien)/i,"$1&shy;$2")+'</span>';n="bis "+dateShort(nd(cur.end))+" · "+(STATE_NAME[C.state]||"");cls="ok";}
    else if(hol){v="–";n="Feiertag "+nd(hol.date).toLocaleDateString("de-DE",{day:"numeric",month:"numeric"})+" "+hol.localName;}
    setKpi("k-strom",v,n,cls);
    /* Kachel „Events Kultur“: Veranstaltungen in Düsseldorf statt Feiertag */
    evDus().then(()=>{const td=evNext(0,50),nx=evNext(14,1)[0];if(!td.length&&!nx)return;
      if(td.length)setKpi("k-strom",td.length+'<small> heute</small>',noPic0(td[0].name).slice(0,60)+(td.length>1?" u. a.":""),"info");
      else setKpi("k-strom",new Date(String(nx.start).slice(0,10)+"T12:00:00").toLocaleDateString("de-DE",{day:"numeric",month:"numeric"})+'<small> '+esc(noPic0(nx.name).slice(0,40))+'</small>',"nächstes Event in Düsseldorf","info");});}
  $("cal").innerHTML=html||stateBox("wird geladen …");
}
function isoWeek(d){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y)/864e5+1)/7);}

// ================= Börse =================
function renderGold(g,fx){const box=$("gold");if(!box)return;
  if(!g||!g.pts||g.pts.length<5){box.innerHTML=stateBox("Goldpreis-Verlauf noch nicht verfügbar.");return;}
  const p=g.pts.filter(x=>x.eur!=null);const last=p[p.length-1];const OZ=31.1035;
  const ago=days=>{const t=last.t-days*86400;let best=p[0];for(const x of p)if(x.t<=t)best=x;return best;};
  const ch=d=>{const a=ago(d);return (last.eur-a.eur)/a.eur*100;};
  const fmtP=v=>(v>=0?"+":"")+v.toLocaleString("de-DE",{minimumFractionDigits:1,maximumFractionDigits:1})+" %";
  const W=640,H=150,pl=50,pr=8,pt=8,pb=18;const vs=p.map(x=>x.eur);const mn=Math.min(...vs),mx=Math.max(...vs);
  const X=i=>pl+i/(p.length-1)*(W-pl-pr),Y=v=>pt+(H-pt-pb)*(1-(v-mn)/(mx-mn||1));
  const d=p.map((x,i)=>(i?"L":"M")+X(i).toFixed(1)+" "+Y(x.eur).toFixed(1)).join("");
  const up=ch(365)>=0;
  const months=[];p.forEach((x,i)=>{const dt=new Date(x.t*1000);if(i&&new Date(p[i-1].t*1000).getMonth()!==dt.getMonth()&&dt.getMonth()%3===0)months.push([i,dt.toLocaleDateString("de-DE",{month:"short",year:"2-digit"})]);});
  box.innerHTML='<div class="row"><div><div class="big">'+Math.round(last.eur).toLocaleString("de-DE")+'<span style="font-size:20px"> € je Unze</span></div><div class="muted">'+(last.eur/OZ).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})+' € je Gramm · '+Math.round(last.usd).toLocaleString("de-DE")+' US-$ je Unze</div></div></div>'+
    '<div class="facts" style="margin:8px 0">'+[[7,"1 Woche"],[30,"1 Monat"],[182,"6 Monate"],[365,"1 Jahr"]].map(([n,l])=>{const v=ch(n);return fact('<span style="color:'+(v>=0?"var(--ok)":"var(--bad)")+'">'+fmtP(v)+'</span>',l);}).join("")+'</div>'+
    '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Goldpreis 12 Monate in Euro">'+
    [mn,(mn+mx)/2,mx].map(v=>'<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="var(--line)"/><text x="'+(pl-6)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+Math.round(v).toLocaleString("de-DE")+'</text>').join("")+
    months.map(([i,l])=>'<text x="'+X(i)+'" y="'+(H-4)+'" text-anchor="middle">'+l+'</text>').join("")+
    '<path d="'+d+'L'+X(p.length-1)+' '+(H-pb)+'L'+pl+' '+(H-pb)+'Z" fill="#c9a227" opacity=".15"/><path d="'+d+'" fill="none" stroke="#c9a227" stroke-width="2.2"/></svg>'+
    '<div class="muted small">Gold-Terminkontrakt (COMEX), in Euro umgerechnet · Tageswerte der letzten 12 Monate · Keine Anlageberatung.</div>';}
async function loadBoerse(){
  try{
    const d=await getData("boerse.json");const q=(d.data&&d.data.quotes)||[];if(!q.length)throw new Error("keine Kurse");
    const spark=(pts,up)=>{if(!pts||pts.length<2)return"";const mn=Math.min(...pts),mx=Math.max(...pts),W=200,H=34;
      const xy=pts.map((v,i)=>(i/(pts.length-1)*W).toFixed(1)+","+(mx===mn?H/2:(H-2-(v-mn)/(mx-mn)*(H-4))).toFixed(1)).join(" ");
      return '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true"><polyline points="'+xy+'" fill="none" stroke="'+(up?"var(--ok)":"var(--bad)")+'" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>';};
    const dax=q.find(x=>x.sym==="^GDAXI");
    const berlin=new Date(new Date().toLocaleString("en-US",{timeZone:"Europe/Berlin"}));const wd=berlin.getDay(),mm=berlin.getHours()*60+berlin.getMinutes();
    const xetra=wd>0&&wd<6&&mm>=540&&mm<1050;
    renderGold(d.data.gold,q.find(x=>x.sym==="EURUSD=X"));
    $("boerse").innerHTML='<div class="row" style="margin-bottom:8px"><div class="muted small">Xetra '+(xetra?'<b style="color:var(--ok)">geöffnet</b> (9:00–17:30)':'<b>geschlossen</b> – Werte vom letzten Handel')+' · Kurse mit ca. 15 Min. Verzögerung</div></div>'+
      '<div class="mk">'+q.map(x=>{const ch=x.prev?(x.price-x.prev)/x.prev*100:null;const up=ch==null||ch>=0;
        const dig=x.price>=1000?0:x.price>=10?2:4;
        return '<a class="mk-i '+(ch==null?"":up?"up":"dn")+'" style="text-decoration:none;color:inherit" target="_blank" rel="noopener" href="https://finance.yahoo.com/quote/'+encodeURIComponent(x.sym)+'"><div class="mk-n">'+esc(x.name)+'</div>'+
          '<div class="row" style="align-items:baseline"><span class="mk-v">'+x.price.toLocaleString("de-DE",{minimumFractionDigits:dig,maximumFractionDigits:dig})+'</span>'+
          (ch!=null?'<span class="mk-c">'+(up?"▲ +":"▼ ")+ch.toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})+' %</span>':'')+'</div>'+
          '<div class="muted small">'+(x.m1!=null?'1 Monat: '+(x.m1>=0?"+":"")+x.m1.toLocaleString("de-DE",{maximumFractionDigits:1})+' %':'')+(x.time?' · Stand '+hhmm(x.time*1000):'')+'</div>'+spark(x.pts,up)+'</a>';}).join("")+'</div>'+
      '<div class="muted small" style="margin-top:6px">Tagesveränderung gegenüber dem letzten Schlusskurs. Antippen öffnet Details. Keine Anlageberatung. Abgerufen '+dataAge(d)+'</div>';
    setStatus("boerse",true);
  }catch(e){setStatus("boerse",false,errText(e));$("boerse").innerHTML=stateBox("Börsendaten nicht verfügbar – "+errText(e)+".",link("https://www.boerse-frankfurt.de/","Börse Frankfurt"));}
}

// ================= Nachrichten =================
let NEWSMODE=load("newsmode")||"reg",NEWSDATA={reg:[],nat:[]};
async function loadNews(){
  const reg=NEWS_REGION[C.state]||10;const R=[],N=[];
  const ts=x=>({title:x.title,text:x.firstSentence||"",link:x.shareURL||x.detailsweb,date:x.date,source:"tagesschau"});
  await Promise.all([
    getJSON("https://www.tagesschau.de/api2u/news/?regions="+reg).then(d=>{R.push(...(d.news||[]).filter(x=>x.title).map(ts));setStatus("news",true);}).catch(e=>setStatus("news",false,errText(e))),
    getJSON("https://www.tagesschau.de/api2u/homepage/").then(d=>N.push(...(d.news||[]).filter(x=>x.title).map(ts))).catch(()=>{}),
    getData("medien.json").then(m=>{const d=m.data||{};R.push(...(d[FAVKEYS.includes(C.key)?C.key:"dus"]||[]));N.push(...(d._national||[]));}).catch(()=>{})]);
  const prep=l=>{const seen=new Set();return l.filter(x=>!seen.has(x.title)&&seen.add(x.title)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));};
  NEWSDATA={reg:prep(R),nat:prep(N)};renderNews();
}
function renderNews(){
  const regName=C.isDus?"Düsseldorf & NRW":C.key==="salzhausen"?"Lüneburger Heide & Niedersachsen":C.town+" & "+(STATE_NAME[C.state]||"");
  $("news-title").textContent="Nachrichten";
  const items=NEWSDATA[NEWSMODE]||[];const srcs=[...new Set(items.map(x=>x.source))];
  const dt=x=>{if(!x)return"";const d=new Date(x);return d.toDateString()===new Date().toDateString()?hhmm(x):d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"})+" "+hhmm(x);};
  $("news").innerHTML='<div class="stop-chips" id="news-sw"><button type="button" data-nm="reg" class="'+(NEWSMODE==="reg"?"on":"")+'">Regional · '+esc(regName)+'</button><button type="button" data-nm="nat" class="'+(NEWSMODE==="nat"?"on":"")+'">Überregional</button></div>'+
    (items.length?'<div class="muted small" style="margin-bottom:6px">Quellen: '+esc(srcs.join(" · "))+'</div><div class="list">'+items.slice(0,40).map(x=>'<div class="li" style="grid-template-columns:1fr auto"><a class="t" href="'+esc(safeUrl(x.link))+'" target="_blank" rel="noopener"><span class="news-src">'+esc(x.source)+'</span>'+esc(x.title)+'</a><span class="r muted small">'+dt(x.date)+'</span>'+
      (x.text?'<div class="d" style="grid-column:1/-1">'+esc(String(x.text).slice(0,220))+'</div>':'')+'</div>').join("")+'</div>'
    :stateBox("Nachrichten nicht verfügbar.",link("https://www.tagesschau.de/","tagesschau")));
}
document.addEventListener("click",e=>{const b=e.target.closest("#news-sw [data-nm]");if(!b)return;NEWSMODE=b.dataset.nm;store("newsmode",NEWSMODE);renderNews();});
document.addEventListener("click",e=>{const b=e.target.closest("#press-sw [data-ps]");if(!b)return;
  document.querySelectorAll("#press-sw [data-ps]").forEach(x=>x.classList.toggle("on",x===b));
  document.querySelectorAll("[data-ps-card]").forEach(c=>c.hidden=c.dataset.psCard!==b.dataset.ps);});

// ================= Quellen =================
function renderSources(){
  let r='<table><thead><tr><th>Bereich</th><th>Anbieter</th><th>Endpunkt</th><th>Status</th></tr></thead><tbody>';
  Object.entries(SRC).forEach(([k,s])=>{const st=status[k];
    const pill=!st?(k==="geo"?'<span class="pill"><i></i>nur bei Ortssuche</span>':'<span class="pill"><i></i>ausstehend</span>'):st.ok?'<span class="pill p-ok"><i></i>live '+hhmm(st.at)+(st.msg?" · "+esc(st.msg):"")+'</span>':'<span class="pill p-bad"><i></i>'+esc(st.msg)+'</span>';
    r+='<tr><td><b>'+esc(s.name)+'</b></td><td><a href="'+s.url+'" target="_blank" rel="noopener">'+esc(s.prov)+'</a></td><td class="mono">'+esc(s.ep)+'</td><td>'+pill+'</td></tr>';});
  $("sources").innerHTML=r+'</tbody></table>';
  {const v=Object.values(status),ok=v.filter(x=>x.ok).length;setKpi("k-src",ok+"<small> / "+v.length+" live</small>",v.length-ok?(v.length-ok)+" ohne Daten":"alle Quellen erreichbar",v.length-ok>3?"warn":"ok");}
}

// ================= Ablauf =================
let busy=false,lastSlow=0,slowKey="";
// ================= Stadtverkehr Datteln (TomTom) =================
const TOWNS={dus:{lat:51.2254,lon:6.7763,z:12,name:"Düsseldorf"},datteln:{lat:51.6539,lon:7.3417,z:13,name:"Datteln"},dortmund:{lat:51.5136,lon:7.4653,z:12,name:"Dortmund"},alpen:{lat:51.6,lon:6.52,z:12,name:"Alpen-Menzelen"},salzhausen:{lat:53.2231,lon:10.1658,z:12,name:"Salzhausen"}};
const homeOr=k=>HOMES[k]&&isFinite(HOMES[k].lat)?HOMES[k]:{...TOWNS[k],label:TOWNS[k].name};
async function loadDatteln(){const box=$("sd-list");if(!box)return;
  if(!TTKEY){box.innerHTML=stateBox("Für den Stadtverkehr Datteln unter Einstellungen den kostenlosen TomTom-Schlüssel eintragen.",'<a href="#einstellungen">Zu den Einstellungen</a>');return;}
  const T=TOWNS.datteln,bbox=[T.lon-.12,T.lat-.075,T.lon+.12,T.lat+.075].map(x=>x.toFixed(4)).join(",");
  const fields="{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description},from,to,length,delay,roadNumbers}}}";
  const CAT={0:"Meldung",1:"Unfall",2:"Nebel",3:"Gefahr",4:"Regen",5:"Glätte",6:"Stau",7:"Fahrstreifen gesperrt",8:"Straße gesperrt",9:"Baustelle",10:"Wind",11:"Überflutung",14:"Liegengebliebenes Fahrzeug"};
  try{const d=await getJSON("https://api.tomtom.com/traffic/services/5/incidentDetails?key="+encodeURIComponent(TTKEY)+"&bbox="+bbox+"&language=de-DE&timeValidityFilter=present&fields="+encodeURIComponent(fields));
    const l=(d.incidents||[]).map(i=>{const p=i.properties||{};const c=(i.geometry&&i.geometry.coordinates)||[];const pt=Array.isArray(c[0])?c[Math.floor(c.length/2)]:c;
      return {cat:p.iconCategory,mag:p.magnitudeOfDelay||0,delay:p.delay?Math.round(p.delay/60):0,len:p.length?p.length/1000:null,from:p.from,to:p.to,road:(p.roadNumbers||[]).join(", "),desc:((p.events||[])[0]||{}).description||"",lat:pt&&pt[1],lon:pt&&pt[0]};})
      .map(x=>{x.km=isFinite(x.lat)?distKm(T.lat,T.lon,x.lat,x.lon):99;return x;})
      .sort((a,b)=>(b.cat===8)-(a.cat===8)||(b.delay||0)-(a.delay||0)||b.mag-a.mag||a.km-b.km);
    const grp=x=>x.cat===9?"Baustellen":x.cat===8||x.cat===7?"Sperrungen":"Staus, Unfälle & Behinderungen";
    const order=["Staus, Unfälle & Behinderungen","Sperrungen","Baustellen"];
    box.innerHTML=l.length?'<div class="stau-sum" style="margin-bottom:8px">'+order.map(g=>'<div class="fact"><b>'+l.filter(x=>grp(x)===g).length+'</b><span>'+g+'</span></div>').join("")+'</div>'+
      order.map(g=>{const a=l.filter(x=>grp(x)===g);return a.length?'<div class="sublbl" style="margin-top:10px">'+g+'</div>'+a.slice(0,25).map(x=>
        '<div class="jam sdj" role="button" tabindex="0" data-kat="'+ttKat(x.cat)+'" data-lat="'+x.lat+'" data-lon="'+x.lon+'"><span class="tag'+(/^A\d/.test(x.road)?" ab":"")+'">'+esc(x.road||"Straße")+'</span><div class="t"><span class="pill '+(x.cat===8||x.mag>=3?"p-bad":"p-warn")+'" style="margin-right:6px"><i></i>'+esc(CAT[x.cat]||"Meldung")+'</span><b class="ortp"></b>'+(x.desc&&x.desc!==CAT[x.cat]?esc(x.desc):"")+'</div>'+
        '<div class="delay'+(x.delay>=20?"":x.delay>=10?" mid":" low")+'">'+(x.delay?"+"+x.delay+" min":"")+'<small>'+(x.delay?"Verzögerung":"")+'</small></div>'+
        '<div class="d">'+esc([x.from,x.to].filter(Boolean).join(" → "))+(x.len?" · "+fmt(x.len,1)+" km":"")+" · "+fmt(x.km,1)+' km vom Zentrum · <span style="color:var(--accent)">in Karte zeigen ›</span></div></div>').join(""):"";}).join("")
      :'<div class="state good">Keine Staus, Sperrungen oder Baustellen in und um Datteln gemeldet.</div>';
    fillOrte(box);
  }catch(e){box.innerHTML=stateBox("Verkehrslage Datteln nicht verfügbar – "+errText(e)+".");}}
document.addEventListener("click",e=>{const j=e.target.closest(".sdj");if(!j)return;const la=+j.dataset.lat,lo=+j.dataset.lon;if(!isFinite(la))return;
  MAPFOCUS=1;if(location.hash!=="#staus/karte")location.hash="staus/karte";setTimeout(()=>{if(!MAP)return;$("stau-map").scrollIntoView({behavior:"smooth",block:"center"});MAP.invalidateSize();MAP.setView([la,lo],14);L.popup().setLatLng([la,lo]).setContent([...j.querySelector(".t").childNodes].map(n=>n.textContent.trim()).filter(Boolean).join(" · ")+"<br>"+j.querySelector(".d").innerText.replace(" · in Karte zeigen ›","")).openOn(MAP);},250);});

// ================= Karte: Orte und Strecken =================
let MAPGO=null;
// ================= Reise Düsseldorf ⇄ Datteln (TomTom mit Alternativrouten) =================
let RS={dir:null,data:{},sel:0,at:0,sv:{}},RSMAP=null,RSLAY=null;try{const m=sessionStorage.getItem("lb_rsmode");if(m)RS.mode=m;}catch(e){}
// Stabile Ampel je Strecke: Verschärfung sofort, Entwarnung erst nach 2 Bestätigungen (kein Flackern)
function svUpd(k,a){const cl=(a.ab||[]).some(w=>w.cl);const lv=a.dl>=20?2:a.dl>=10?1:0;/* nur echte Verzögerung zählt, Sperrungen ohne Zeitverlust nicht */const s=RS.sv[k];
  const mk=()=>({lv,cl,sv:lv>=2?"dl-bad":lv?"dl-warn":"",n:0,cand:-1});
  if(!s||lv>=s.lv){RS.sv[k]=mk();return;}
  s.n=(s.cand===lv?s.n:0)+1;s.cand=lv;if(s.n>=2)RS.sv[k]=mk();}
const RSDIRS=CITYPAIRS.map(([a,b])=>[a+">"+b,CITYN[a]+" → "+CITYN[b],a,b]);
function setStauTitle(){const el=$("stau-title");if(!el)return;const pane=(location.hash.split("/")[1]||"reise");
  let mg=null;try{mg=MAPGO;}catch(e){}const mk=(mg==="dus"||mg==="datteln")?mg:(C.key==="datteln"?"datteln":"dus");el.textContent=pane==="reise"?"Reise ab "+((typeof RS!=="undefined"&&RS.gps&&RS.pos)?"Standort":(CITYN[(typeof RS!=="undefined"&&RS.city)||""]||C.town)):"Verkehrslage · "+(pane==="karte"?((TOWNS[mg]||{}).name||C.town):C.town);}
const IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
// Nur ansehen (ohne Navigation): auf dem iPhone direkt die Routenübersicht der Google-Maps-App
// App: exakte Koordinaten statt Adresstext (Google findet sonst z. B. Alpen-Menzelen/Salzhausen nicht sicher)
const gmView=(o,d,via)=>{const A=isFinite(o.lat)?o.lat+","+o.lon:o.label,B=isFinite(d.lat)?d.lat+","+d.lon:d.label;
  return IOS?"comgooglemaps://?saddr="+encodeURIComponent(A)+"&daddr="+(via?via[0].toFixed(5)+","+via[1].toFixed(5)+"+to:":"")+encodeURIComponent(B)+"&directionsmode=driving":gmUrl(o,d,via);};
// Uber: Abholung am aktuellen Standort, Ziel = Adresse der Fahrt
const uberUrl=d=>"https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]="+d.lat+"&dropoff[longitude]="+d.lon+"&dropoff[nickname]="+encodeURIComponent(d.label.split(",").slice(-1)[0].trim())+"&dropoff[formatted_address]="+encodeURIComponent(d.label);
const hm=min=>min>=60?Math.floor(min/60)+" h "+String(min%60).padStart(2,"0")+" min":min+" min";
/* Start am aktuellen Standort: Ziele = alle Wohnorte, außer dem, an dem man gerade ist (< 2 km) */
RS.gps=load("rs_gps")===true;RS.pos=null;
function rsDirs(){if(RS.gps&&RS.pos)return Object.keys(CITYN).filter(c=>distKm(RS.pos.lat,RS.pos.lon,FIXHOME[c].lat,FIXHOME[c].lon)>2).map(c=>["@"+c,"Standort → "+CITYN[c],"@",c]);return RSDIRS.filter(x=>x[2]===RS.city);}
function rsEnds(k){if(k&&k[0]==="@"&&RS.pos)return [{lat:+RS.pos.lat.toFixed(5),lon:+RS.pos.lon.toFixed(5),label:""},FIXHOME[k.slice(1)]];const r=RSDIRS.find(x=>x[0]===k)||RSDIRS[0];return [FIXHOME[r[2]],FIXHOME[r[3]]];}
function rsStart(){const el=$("rs-start");if(el)setBtns(el,'<button type="button" data-rshome="1"'+(RS.gps?"":' class="on"')+'>Ab '+esc(CITYN[RS.city]||"Wohnort")+'</button><button type="button" data-rsgps="1"'+(RS.gps?' class="on"':"")+'>Ab Standort</button>');}
function cityChips(){return Object.entries(CITYN).map(([c,n])=>'<button type="button" data-rscity="'+c+'" class="cc-'+c+(c===RS.city?" on":"")+'">'+n+'</button>').join("");}
async function rsPos(f){const p=await nearPos(f);if(!p)return false;const old=RS.pos;RS.pos=p;if(old&&distKm(old.lat,old.lon,p.lat,p.lon)>1)Object.keys(RS.data).forEach(k=>{if(k[0]==="@")delete RS.data[k];});return true;}
const gmUrl=(o,d,via,nav)=>"https://www.google.com/maps/dir/?api=1&travelmode=driving"+(o?"&origin="+(o.label?encodeURIComponent(o.label):o.lat+","+o.lon):"")+"&destination="+(d.label?encodeURIComponent(d.label):d.lat+","+d.lon)+(via?"&waypoints="+via[0].toFixed(5)+","+via[1].toFixed(5):"")+(nav?"&dir_action=navigate":"");
async function loadReise(force){if(!$("rs-alts"))return;if(!RS.city)rsCity(C.isDus?"dus":(CITYN[C.key]?C.key:"dus"));
  if(RS.gps){const n=RS.pos;if(!(await rsPos())){RS.gps=false;store("rs_gps",false);}else if(!n)force=true;}
  if(!force&&Date.now()-RS.at<10*60*1000&&rsDirs().every(x=>RS.data[x[0]])){renderReise();return;}
  RS.at=Date.now();renderReise();
  if(!TTKEY){$("rs-alts").innerHTML=stateBox("Für die Fahrzeit den TomTom-Schlüssel unter Einstellungen eintragen.",'<a href="#einstellungen">Zu den Einstellungen</a>');return;}
  const city=RS.city;for(const [k,t] of rsDirs().sort((a,b)=>(b[0]===RS.dir)-(a[0]===RS.dir))){if(RS.city&&RS.city!==city)break;/* nur bei echtem Ortswechsel abbrechen */const [o,d]=rsEnds(k);
    try{const url="https://api.tomtom.com/routing/1/calculateRoute/"+o.lat+","+o.lon+":"+d.lat+","+d.lon+"/json?traffic=true&travelMode=car&routeType=fastest&maxAlternatives=2&computeTravelTimeFor=all&sectionType=traffic&instructionsType=coded&language=de-DE&key="+encodeURIComponent(TTKEY);
      /* TomTom lehnt bei zu vielen Abfragen pro Sekunde ab (HTTP 429): bis zu 4 Versuche mit wachsender Pause */
      let r,le;for(const w of [0,1500,3500,7000]){if(w)await new Promise(z=>setTimeout(z,w));try{r=await getJSON(url,20000);break;}catch(e){le=e;if(!/\b(429|5\d\d)\b|Timeout|abgebrochen|fetch/i.test(String(e&&e.message||e)))break;}}
      if(!r)throw le;
      const main=(r.routes[0].legs||[]).flatMap(l=>l.points||[]);
      const alts=r.routes.map((rt,i)=>{const P=routeParse(rt);const sm=rt.summary;
        let via=null;if(i>0){let best=-1;for(let a=Math.floor(P.pts.length*.15);a<P.pts.length*.85;a+=3){const q=P.pts[a];let m=1e9;for(let b=0;b<main.length;b+=4){const dd=Math.abs(main[b].latitude-q.latitude)+Math.abs(main[b].longitude-q.longitude);if(dd<m)m=dd;}if(m>best){best=m;via=[q.latitude,q.longitude];}}}
        return {t,i,...P,min:Math.round(sm.travelTimeInSeconds/60),dl:Math.round((sm.trafficDelayInSeconds||0)/60),km:sm.lengthInMeters/1000,arr:new Date(Date.now()+sm.travelTimeInSeconds*1000),via,rw:null};});
      {const pv=RS.data[k]&&RS.data[k].alts;if(pv&&pv[0]&&pv[0].ab)alts[0].ab=pv[0].ab;}
      RS.data[k]={alts};
      if(GMKEY)gmTime(o,d).then(g=>{const a=alts[0];a.tt={min:a.min,dl:a.dl};a.min=g.min;a.dl=g.dl;a.arr=new Date(Date.now()+g.min*6e4);a.src="Google";if(g.km)a.km=g.km;svUpd&&RS.data[k]&&RS.data[k].alts===alts&&svUpd(k,a);renderReise();}).catch(e=>{RS.gmErr=String(e.message||e);renderReise();});
      alts.forEach(a=>routeRW(a,["warning","closure"]).then(async l=>{a.ab=l.map(w=>({...w,jam:jamInfo(w),cl:w._svc==="closure"||w.isBlocked===true||w.isBlocked==="true"})).filter(w=>w.cl||w.jam);if(a.i===0&&RS.data[k]&&RS.data[k].alts===alts){svUpd(k,a);renderReise();}else if(RS.dir===k)renderReise();for(const w of a.ab)if(!w.ort){w.ort=await placeOf(w.lat,w.lon);if(RS.dir===k)renderReise();}}));
      alts.forEach(a=>routeRW(a).then(async l=>{a.rw=l;if(RS.dir===k)renderReise();for(const w of l)if(!w.ort){w.ort=await placeOf(w.lat,w.lon);if(RS.dir===k&&RS.data[k]&&RS.data[k].alts&&RS.data[k].alts[RS.sel]===a)renderReise();}}));
      (async()=>{for(const a of alts)for(const x of a.secs)if(isFinite(x.lat)&&!x.ort){x.ort=await placeOf(x.lat,x.lon);if(RS.dir===k)renderReise();}})();
    }catch(e){if(!(RS.data[k]&&RS.data[k].alts))RS.data[k]={err:errText(e)};/* sonst letzten Stand behalten */}
    renderReise();}
  if(RS.city&&RS.city!==city){RS.at=0;loadReise(false);}}
const TDIRS=CITYPAIRS.map(([a,b])=>[a+">"+b,a,"nach "+CITYN[b],STN[a][1]+" → "+STN[b][1],b]);
// Bahn: je Ort Hin- und Rückfahrt zu jedem anderen Ort als eigener Knopf; Fahrten erst nach Antippen
function tdirsOf(k){return TDIRS.filter(x=>x[1]===k);} // nur Fahrten ab dem gewählten Ort
function rsCity(k){RS.city=k;EFAK=EFACITY[k];STOPIDX=null;
  setBtns($("rs-city"),cityChips());
  const ok=rsDirs();if(ok.length&&!ok.some(x=>x[0]===RS.dir)){RS.dir=ok[0][0];RS.sel=0;}
  if(RS.tdir&&!tdirsOf(k).some(x=>x[0]===RS.tdir))RS.tdir=null;
  rsMode(RS.mode||"auto");}
document.addEventListener("click",async e=>{const g=e.target.closest("[data-rsgps]");if(!g)return;e.preventDefault();
  if(!(await rsPos(1))){$("rs-alts").innerHTML=stateBox("Standort nicht verfügbar – bitte die Ortung für Safari bzw. die App erlauben.");return;}
  RS.gps=true;store("rs_gps",true);RS.dir=null;RS.sel=0;RS.at=0;renderReise();loadReise(true);});
document.addEventListener("click",e=>{if(!e.target.closest("[data-rshome]"))return;e.preventDefault();RS.gps=false;store("rs_gps",false);RS.dir=null;RS.sel=0;renderReise();loadReise();});
document.addEventListener("click",e=>{const b=e.target.closest("[data-rscity]");if(!b)return;const k=b.dataset.rscity;if(RS.gps){RS.gps=false;store("rs_gps",false);RS.dir=null;}
  const y=window.scrollY;const keep=()=>{if(Math.abs(window.scrollY-y)>4)window.scrollTo(0,y);};
  EFAK=EFACITY[k];RS.city=k;RS.at=0;
  RS.lock=1;try{if(k==="dus"){if(!C.isDus)choose("dus-4");}else if(C.key!==k)choose("p-"+k);}finally{RS.lock=0;}
  rsCity(k);keep();if(location.hash==="#staus/karte")mapGo(k);
  {const h=location.hash.slice(1);if(h==="parken")pkShow(k);else if(h==="eladen"){ELP=null;loadEL();}else if(h==="tanken")loadFuel();}
  // Seite bleibt, wo sie ist, solange die Daten neu geladen werden (außer man scrollt selbst)
  let touched=false;const tt=()=>{touched=true;};addEventListener("touchstart",tt,{once:true,passive:true});addEventListener("wheel",tt,{once:true,passive:true});
  const guard=()=>{if(!touched&&Math.abs(window.scrollY-y)>120)window.scrollTo(0,y);};addEventListener("scroll",guard,{passive:true});
  [50,150,400,800,1500,2500,4000].forEach(t=>setTimeout(guard,t));setTimeout(()=>removeEventListener("scroll",guard),5000);});
// Knöpfe aktualisieren, ohne sie neu zu erzeugen (sonst springt die Seite beim Antippen nach oben)
function setBtns(box,html){if(!box)return;const t=document.createElement("div");t.innerHTML=html;const nw=[...t.children],old=[...box.children];
  if(old.length===nw.length&&old.every((o,i)=>o.tagName===nw[i].tagName&&o.outerHTML.split(">")[0].replace(/class="[^"]*"/,"")===nw[i].outerHTML.split(">")[0].replace(/class="[^"]*"/,""))){
    old.forEach((o,i)=>{if(o.className!==nw[i].className)o.className=nw[i].className;if(o.innerHTML!==nw[i].innerHTML)o.innerHTML=nw[i].innerHTML;});}
  else box.innerHTML=html;}
// ÖPNV: Auswahl per Knopf statt langer Liste (Abfahrten vor Ort bzw. Verbindungen Dortmund ⇄ Datteln)
const OEOPT={dortmund:[["o-do-dat","Westfalenstadion → Datteln Busbahnhof"],["dep","Westfalenstadion → Hauptbahnhof"]],datteln:[["dep","Bus Lohstraße ⇄ Busbahnhof"],["o-dat-do","Datteln Busbahnhof → Dortmund Hbf"]]};
function rsOe(){const opts=OEOPT[RS.city]||[["dep","Abfahrten vor Ort"]];if(!opts.some(o=>o[0]===RS.oe))RS.oe=opts.length>1?null:opts[0][0];
  const seg=$("oe-seg");seg.hidden=opts.length<2;seg.style.gridTemplateColumns="repeat("+opts.length+",1fr)";setBtns(seg,opts.map(([k,l])=>'<button type="button" data-oe="'+k+'" class="'+(RS.oe===k?"on":"")+'">'+l+'</button>').join(""));
  const ob=$("oe-trips"),sec=ob.closest("section"),dep=$("oe-dep");
  if(!RS.oe){sec.hidden=true;dep.hidden=true;}
  else if(RS.oe==="dep"){sec.hidden=true;dep.hidden=false;}
  else{dep.hidden=true;sec.hidden=false;ob.hidden=false;$("oe-title").textContent=(opts.find(o=>o[0]===RS.oe)||[])[1]||"Bus & Bahn";ob.innerHTML='<div class="state">wird geladen …</div>';loadTrips({keys:RS.oe.split(","),box:ob});}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-oe]");if(!b)return;RS.oe=RS.oe===b.dataset.oe?null:b.dataset.oe;rsOe();});
function rsMode(m){RS.mode=m;try{sessionStorage.setItem("lb_rsmode",m);}catch(e){}setStauTitle();if(m==="auto")renderReise();if(m==="oepnv"){loadEFA();
    rsOe();}document.querySelectorAll("#rs-mode [data-rsm]").forEach(b=>b.classList.toggle("on",b.dataset.rsm===m));document.querySelectorAll("[data-rsp]").forEach(p=>p.hidden=p.dataset.rsp!==m);
  if(m==="bahn"){
    const td=$("rs-tdir");
    setBtns(td,tdirsOf(RS.city).map(([k,a,to,sub,b])=>'<button type="button" data-rstd="'+k+'" class="cc-'+(a===RS.city?b:a)+(RS.tdir===k?" on":"")+'">'+esc(to)+'<small>'+esc(sub.replace(/ Hbf/g," Hbf"))+'</small></button>').join(""));
    $("trips-card").hidden=!RS.tdir;if(!RS.tdir)return;
    const t=RSTRIP[RS.tdir]||"";const st=(()=>{const d=TDIRS.find(x=>x[0]===RS.tdir);return d?d[3]:"";})();
    const src=document.querySelector("#trips-card .src");if(src)src.textContent=st+" · Nah- und Fernverkehr · Echtzeit";loadTrips();}else drawReise();}
document.addEventListener("click",e=>{const b=e.target.closest("[data-rsm]");if(b)rsMode(b.dataset.rsm);const t=e.target.closest("[data-rstd]");if(t){RS.tdir=RS.tdir===t.dataset.rstd?null:t.dataset.rstd;rsMode("bahn");if(RS.tdir)setTimeout(()=>{const c=$("trips-card");if(c&&c.getBoundingClientRect().top>innerHeight*.7)c.scrollIntoView({behavior:"smooth",block:"start"});},60);}});
const NAVTO=(lat,lon,lbl)=>' <a class="nav-go el-ad" href="'+(IOS?"comgooglemaps://?daddr="+lat+","+lon+"&directionsmode=driving":"https://www.google.com/maps/dir/?api=1&travelmode=driving&dir_action=navigate&destination="+lat+","+lon)+'"'+(IOS?'':' target="_blank" rel="noopener"')+'>'+GMICON+esc(lbl||"Route hierhin")+' ↗</a>';
const GMICON='<svg class="gmi" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.5s-7-6-7-11.6a7 7 0 0 1 14 0c0 5.6-7 11.6-7 11.6z"/><circle cx="12" cy="9.8" r="2.6"/></svg>';
function renderReise(){const D=RS.data;setStauTitle();try{renderAutoPrio();}catch(e){}
  if(!RS.city){rsCity(C.isDus?"dus":(CITYN[C.key]?C.key:"dus"));return;}
  {const ok=rsDirs();if(ok.length&&!ok.some(x=>x[0]===RS.dir)){RS.dir=ok[0][0];RS.sel=0;}if(RS.tdir&&!tdirsOf(RS.city).some(x=>x[0]===RS.tdir))RS.tdir=null;}
  $("rs-quick").innerHTML="";rsStart();
  // Verzögerung farbig: ab 10 min gelb, ab 20 min rot pulsierend
  const sev=a=>{if(!a)return "";const cl=(a.ab||[]).some(w=>w.cl);return cl||a.dl>=20?"dl-bad":a.dl>=10?"dl-warn":"";};
  let worst="";
  setBtns($("rs-dir"),rsDirs().map(([k,t,,to])=>{const a=D[k]&&D[k].alts&&D[k].alts[0];const st=RS.sv[k];const sv=st?st.sv:(a&&a.dl>=20?"dl-bad":a&&a.dl>=10?"dl-warn":"");if(sv==="dl-bad"||(sv&&!worst))worst=sv;const cl=st?st.cl:false;
    return '<button type="button" data-rsdir="'+k+'" class="cc-'+to+(RS.dir===k?" on":"")+(sv?" "+sv:"")+'">'+GMICON+t+'<small>'+(a?hm(a.min)+(a.dl>0?" · +"+a.dl+" min":" · frei"):D[k]&&D[k].err?"nicht verfügbar":"wird berechnet …")+'</small></button>';}).join(""));
  {const P=TILE_PARTS.traffic;const all=rsDirs().every(x=>D[x[0]]&&D[x[0]].alts);const nc=worst==="dl-bad"?"bad":worst==="dl-warn"?"warn":all?"ok":null;if(P._rcls!==nc){P._rcls=nc;composeTile("k-traffic","traffic");}}
  const cur=D[RS.dir];const box=$("rs-alts"),inc=$("rs-incs");
  if(!cur){box.innerHTML='<div class="state">Fahrzeit wird berechnet …</div>';inc.innerHTML="";drawReise();return;}
  if(cur.err){box.innerHTML=stateBox("Fahrzeit derzeit nicht verfügbar – "+cur.err+".");inc.innerHTML="";drawReise();return;}
  if(RS.sel>=cur.alts.length)RS.sel=0;const [o,d]=rsEnds(RS.dir);
  box.innerHTML='<h3 class="sub2 vl-h rs-h">'+GMICON+esc((rsDirs().find(x=>x[0]===RS.dir)||RSDIRS.find(x=>x[0]===RS.dir)||[,""])[1])+'</h3><div class="muted small" style="margin:2px 2px 6px">'+(cur.alts.length>1?cur.alts.length+" Routen, die schnellste zuerst. Route antippen zeigt sie in der Karte und ihre Störungen darunter.":"Eine Route gefunden.")+'</div>'+
    cur.alts.map(a=>{const m=(a.rw||[]).length;
      return '<div class="alt'+(a.i===RS.sel?" on":"")+'" data-rsalt="'+a.i+'" role="button" tabindex="0"><span class="an">'+(a.i+1)+'</span><span class="at">'+hm(a.min)+' <span class="cs '+(a.dl>=20?"bad":a.dl>=10?"warn":a.dl>0?"lo":"ok")+'">'+(a.dl>0?"+"+a.dl+" Stau":"frei")+'</span></span><span class="muted small">'+fmt(a.km)+' km</span>'+
        '<span class="ad">'+(a.i===0?"Schnellste"+(a.src?" · Zeit: Google Maps":"")+" · ":"+"+(a.min-cur.alts[0].min)+" min · ")+(a.abs.length?"über "+esc(a.abs.join(", "))+" · ":"")+'Ankunft '+hhmm(a.arr)+(a.secs.length?" · "+a.secs.length+(a.secs.length===1?" Behinderung":" Behinderungen"):"")+(a.ab&&a.ab.some(w=>w.cl)?" · ⛔ Sperrung":"")+(m?" · 🚧 "+m+(m===1?" Baustelle":" Baustellen"):"")+'</span>'+
        (a.i===RS.sel?'<span class="ag"><a href="'+gmView(o,d,null)+'"'+(IOS?'':' target="_blank" rel="noopener"')+'>'+GMICON+'In Google Maps öffnen ↗</a><a class="sec" href="'+uberUrl(d)+'" target="_blank" rel="noopener">Uber bestellen ↗</a></span>':'')+'</div>';}).join("")+
    '<div class="muted small" style="margin:0 2px 8px">Google Maps öffnet die Route von '+esc(o.label)+' nach '+esc(d.label)+' zur Kontrolle. Die Navigation startest du dort selbst; Alternativen zeigt Google grau zum Antippen.</div>';
  const a=cur.alts[RS.sel];const n=a.secs.length,m=(a.rw||[]).length;
  // TomTom und Autobahn GmbH zusammen: gleiche Stelle (< 3 km) nur einmal, Sperrungen immer
  const near=(w)=>a.secs.some(x=>{if(!isFinite(x.lat)||!isFinite(w.lat))return false;const L=+x.len||0;return distKm(x.lat,x.lon,w.lat,w.lon)<3+(L>50?L/1000:L);});
  const abx=a.ab?a.ab.filter(w=>w.cl||!near(w)):null;
  inc.innerHTML='<div class="sublbl" style="margin-top:12px;font-size:15px">Staus &amp; Sperrungen auf Route '+(a.i+1)+' <span class="muted small">(TomTom live und Autobahn GmbH · gleiche Meldungen nur einmal)</span></div>'+
    (n?a.secs.map(incRow).join(""):"")+(abx?abx.map(abRow).join(""):"")+
    (!n&&abx&&!abx.length?'<div class="state good">Keine Staus oder Sperrungen auf dieser Route.</div>':"")+(!a.ab?'<div class="state">Meldungen der Autobahn GmbH werden geladen …</div>':"")+
    '<div class="sublbl" style="margin-top:12px;font-size:15px">Baustellen auf Route '+(a.i+1)+' <span class="muted small">(Autobahn GmbH, in Fahrtrichtung, km ab Start)</span></div>'+(a.rw?(m?a.rw.map(rwRow).join(""):'<div class="state good">Keine Autobahn-Baustellen auf dieser Route gemeldet.</div>'):'<div class="state">wird geladen …</div>');
  drawReise();}
function drawReise(){if(typeof L==="undefined"){$("rs-map").hidden=true;return;}const el=$("rs-map");el.hidden=false;if(!el.offsetWidth)return;
  if(!RSMAP){RSMAP=L.map("rs-map",{scrollWheelZoom:false,dragging:!L.Browser.mobile,tap:!L.Browser.mobile});baseTiles(true).forEach(l=>l.addTo(RSMAP));RSMAP.getContainer().classList.toggle("ttmap",!!TTKEY);RSLAY=L.layerGroup().addTo(RSMAP);}
  RSMAP.invalidateSize();RSLAY.clearLayers();const cur=RS.data[RS.dir];
  if(!cur||!cur.alts){const [o,d]=rsEnds(RS.dir);RSMAP.fitBounds([[o.lat,o.lon],[d.lat,d.lon]],{padding:[20,20]});return;}
  const ord=cur.alts.filter(a=>a.i!==RS.sel).concat(cur.alts.filter(a=>a.i===RS.sel));let bounds=null;
  ord.forEach(a=>{const ll=a.pts.map(p=>[p.latitude,p.longitude]);if(ll.length<2)return;const on=a.i===RS.sel;
    if(on){L.polyline(ll,{color:"#fff",weight:10,opacity:.9,interactive:false}).addTo(RSLAY);L.polyline(ll,{color:"#0b6e8a",weight:6}).bindTooltip("Route "+(a.i+1)).addTo(RSLAY);
      a.secs.forEach(x=>{if(isFinite(x.lat))L.circleMarker([x.lat,x.lon],{radius:8,color:"#fff",weight:2,fillColor:x.cat==="Sperrung"?"#7d1f6b":x.delay>=20?"#d62d20":x.delay>=10?"#f08a00":"#f3c623",fillOpacity:1}).bindPopup("<b>"+esc(x.cat)+"</b>"+(x.delay?"<br>+"+x.delay+" min":"")).addTo(RSLAY);});
      (a.rw||[]).forEach(w=>L.circleMarker([w.lat,w.lon],{radius:6,color:"#fff",weight:2,fillColor:"#8a9aa5",fillOpacity:1}).bindPopup(popupHtml(w,"Baustelle")).addTo(RSLAY));
      L.marker(ll[0],{icon:L.divIcon({className:"homeic",html:"🏠",iconSize:[26,26]})}).bindTooltip("Start").addTo(RSLAY);
      L.circleMarker(ll[ll.length-1],{radius:7,color:"#14212b",weight:2,fillColor:"#fff",fillOpacity:1}).bindTooltip("Ziel").addTo(RSLAY);}
    else L.polyline(ll,{color:"#8a9aa5",weight:5,opacity:.8,dashArray:"8 8"}).bindTooltip("Route "+(a.i+1)+" antippen zum Auswählen").on("click",()=>{RS.sel=a.i;renderReise();}).addTo(RSLAY);
    const b=L.latLngBounds(ll);bounds=bounds?bounds.extend(b):b;});
  if(bounds)RSMAP.fitBounds(bounds,{padding:[14,14]});}
document.addEventListener("click",e=>{const d=e.target.closest("[data-rsdir]");if(d){RS.dir=d.dataset.rsdir;RS.sel=0;renderReise();return;}
  const a=e.target.closest("[data-rsalt]");if(a&&!e.target.closest("a")){RS.sel=+a.dataset.rsalt;renderReise();}});
document.addEventListener("click",e=>{const j=e.target.closest("#rs-incs .carinc");if(!j||!RSMAP)return;e.stopImmediatePropagation();const la=+j.dataset.lat,lo=+j.dataset.lon;if(!isFinite(la))return;
  $("rs-map").scrollIntoView({behavior:"smooth",block:"center"});RSMAP.setView([la,lo],14);L.popup().setLatLng([la,lo]).setContent(j.querySelector(".t").innerText).openOn(RSMAP);},true);
document.addEventListener("click",e=>{const b=e.target.closest("[data-al]");if(!b)return;const k=b.dataset.al;document.querySelectorAll("#al-seg [data-al]").forEach(x=>x.classList.toggle("on",x===b));document.querySelectorAll("[data-alp]").forEach(p=>p.hidden=p.dataset.alp!==k);if(k==="ev")loadTM();else sportVis(false);});
document.addEventListener("click",e=>{const g=e.target.closest("[data-vtgo]");if(g){const b=document.querySelector('#vt-seg [data-vts="'+g.dataset.vtgo+'"]');if(b){b.click();setTimeout(()=>$("vt-seg").scrollIntoView({behavior:"smooth",block:"start"}),30);}}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-vts]");if(!b)return;const k=b.dataset.vts;
  document.querySelectorAll("#vt-seg [data-vts]").forEach(x=>x.classList.toggle("on",x===b));document.querySelectorAll("[data-vtp]").forEach(p=>p.hidden=p.dataset.vtp!==k);});
function karteLbl(k){return "Verkehr";k=k||(MAPGO==="dus"||MAPGO==="datteln"?MAPGO:(C.key==="datteln"?"datteln":"dus"));return k==="datteln"?"Staus & Baustellen":"Sperrungen & Events";}
function mapCity(k){const rr=k==="r0"||k==="r1";if(rr){const p=$("mapcity-route").parentNode;p.append($("mapcity-route"),$(k==="r0"?"mapcity-dus":"mapcity-datteln"),$(k==="r0"?"mapcity-datteln":"mapcity-dus"));}
  $("mapcity-route").hidden=!rr;if(!rr)MAPRT=null;if(k!=="dus"&&k!=="datteln"&&!rr)k=null;$("mapcity-dus").hidden=!(rr||k==="dus");$("mapcity-datteln").hidden=!(rr||k==="datteln");if(rr)k=null;if(k){document.querySelectorAll("a[data-karte]").forEach(a=>a.textContent=karteLbl(k));document.querySelectorAll("#mapgo [data-mapgo]").forEach(b=>b.classList.toggle("on",b.dataset.mapgo===k));}setStauTitle();}
async function mapGo(k){MAPGO=k;document.querySelectorAll("#mapgo [data-mapgo]").forEach(b=>b.classList.toggle("on",b.dataset.mapgo===k));mapCity(k);
  const info=$("mapgo-info");if(!MAP){try{ensureMap();}catch(e){}}
  if(MAP){MAP.invalidateSize();if(MAP._route){MAP._route.remove();MAP._route=null;}}
  if(TOWNS[k]){const T=TOWNS[k];if(MAP)MAP.setView([T.lat,T.lon],T.z);info.textContent="Live-Verkehr rund um "+T.name+(MAPMODE!=="tomtom"&&TTKEY?" · für alle Straßen oben „TomTom“ wählen":"");return;}
  const A=homeOr("dus"),B=homeOr("datteln");const [o,d,t]=k==="r0"?[A,B,"Düsseldorf → Datteln"]:[B,A,"Datteln → Düsseldorf"];
  if(!TTKEY){info.textContent="Für die Strecke den TomTom-Schlüssel unter Einstellungen eintragen.";if(MAP)MAP.fitBounds([[o.lat,o.lon],[d.lat,d.lon]],{padding:[20,20]});return;}
  info.textContent=t+" · Strecke wird berechnet …";
  try{let pts=null,secs=[],sm=null;const c=CARR.find(r=>r&&r.t===t&&r.pts);
    if(c){pts=c.pts;secs=c.secs||[];}
    MAPRT={t,wait:1};renderMapRoute();
    const url="https://api.tomtom.com/routing/1/calculateRoute/"+o.lat+","+o.lon+":"+d.lat+","+d.lon+"/json?traffic=true&travelMode=car&routeType=fastest&sectionType=traffic&instructionsType=coded&language=de-DE&key="+encodeURIComponent(TTKEY);
    const r=await getJSON(url);const rt=r.routes[0];sm=rt.summary;pts=(rt.legs||[]).flatMap(l=>l.points||[]);
    const tr=(rt.sections||[]).filter(x=>x.sectionType==="TRAFFIC");
    if(MAPGO!==k)return;
    {const RT={t,...routeParse(rt)};MAPRT=RT;renderMapRoute();
      routeRW(RT).then(l=>{if(MAPRT!==RT)return;RT.rw=l;renderMapRoute();});
      (async()=>{for(const x of RT.secs)if(isFinite(x.lat)&&!x.ort){x.ort=await placeOf(x.lat,x.lon);if(MAPRT!==RT)return;renderMapRoute();}})();}
    const ll=pts.map(p=>[p.latitude,p.longitude]);if(MAP){const g=L.layerGroup().addTo(MAP);MAP._route=g;
    L.polyline(ll,{color:"#fff",weight:10,opacity:.9,interactive:false}).addTo(g);
    L.polyline(ll,{color:"#0b6e8a",weight:6,opacity:.95}).bindTooltip(t).addTo(g);
    tr.forEach(x=>{const seg=ll.slice(x.startPointIndex,x.endPointIndex+1);if(seg.length<2)return;const dl=Math.round((x.delayInSeconds||0)/60);
      L.polyline(seg,{color:x.simpleCategory==="ROAD_CLOSURE"?"#7d1f6b":dl>=10?"#d62d20":"#f08a00",weight:7,opacity:1}).bindPopup("<b>"+({JAM:"Stau",ROAD_WORK:"Baustelle",ROAD_CLOSURE:"Sperrung"}[x.simpleCategory]||"Behinderung")+"</b>"+(dl?"<br>+"+dl+" min":"")).addTo(g);});
    L.marker(ll[0],{icon:L.divIcon({className:"homeic",html:"🏠",iconSize:[26,26]})}).bindTooltip("Start").addTo(g);
    L.circleMarker(ll[ll.length-1],{radius:7,color:"#14212b",weight:2,fillColor:"#fff",fillOpacity:1}).bindTooltip("Ziel").addTo(g);
    MAP.fitBounds(L.latLngBounds(ll),{padding:[16,16]});}
    const min=Math.round(sm.travelTimeInSeconds/60),dl=Math.round((sm.trafficDelayInSeconds||0)/60);
    info.innerHTML='<b>'+esc(t)+'</b> · '+(min>=60?Math.floor(min/60)+" h "+String(min%60).padStart(2,"0"):min)+' min · '+fmt(sm.lengthInMeters/1000)+' km · '+(dl>0?'<span class="cs '+(dl>=15?"bad":"warn")+'">+'+dl+' min Stau</span>':'<span class="cs ok">frei</span>')+(tr.length?' · '+tr.length+(tr.length===1?" Behinderung":" Behinderungen")+' farbig markiert':'');
  }catch(e){info.textContent=t+" · Strecke derzeit nicht verfügbar ("+errText(e)+").";MAPRT={t,err:errText(e)};renderMapRoute();}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-mapgo]");if(!b)return;e.preventDefault();const k=b.dataset.mapgo;
  if(location.hash!=="#staus/karte"){MAPFOCUS=1;location.hash="staus/karte";setTimeout(()=>mapGo(k),250);}else mapGo(k);});

// ================= E-Ladesäulen (OpenStreetMap, ganz DE/AT) =================
var ELKEY=null,ELR=load("el_rad")||2,ELF=load("el_f")||"all",ELD=null,ELP=null,ELMAP=null,ELLAY=null;
function elFavs(){const F=[["dus","Düsseldorf",51.2254,6.7763],["datteln","Datteln",51.6539,7.3417],["dortmund","Dortmund",51.5136,7.4653],["alpen","Alpen-Menzelen",51.6449,6.5634],["salzhausen","Salzhausen",53.2236,10.1645]];
  return F.map(([k,n,la,lo])=>{const H=HOMES[k];return {k,name:n,lat:H&&isFinite(H.lat)?H.lat:la,lon:H&&isFinite(H.lon)?H.lon:lo};});}
function renderELWhere(){const w=$("el-where");w.style.gridTemplateColumns="1fr";w.innerHTML='<button type="button" data-elw="gps" class="gpsbtn'+(ELP&&ELP.k==="gps"?" on":"")+'"><svg class="pin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>An meinem Standort suchen</button>';}
function renderELSeg(){$("el-seg").innerHTML='<div class="seg s3">'+[[2,"2 km"],[5,"5 km"],[10,"10 km"]].map(([v,l])=>'<button type="button" data-elr="'+v+'" class="'+(ELR==v?"on":"")+'">'+l+'</button>').join("")+'</div><div class="seg">'+
  [["all","Alle Ladesäulen"],["fast","Schnelllader 50+ kW"]].map(([v,l])=>'<button type="button" data-elf="'+v+'" class="'+(ELF===v?"on":"")+'">'+l+'</button>').join("")+'</div>';}
// Ladesäulenregister der Bundesnetzagentur für ganz Deutschland, in 0,5°-Kacheln vom eigenen Server
let EVIDX=null;const EVC={};
async function evNear(la,lo,r){try{if(!EVIDX)EVIDX=getJSON("data/ev/index.json?t="+Math.floor(Date.now()/36e5),15000).catch(e=>{EVIDX=null;throw e;});const I=await EVIDX;if(!I||!Array.isArray(I.keys))return null;
  const dl=r/111,dn=r/(111*Math.cos(la*Math.PI/180));const ks=new Set();
  for(let a=Math.floor((la-dl)*2);a<=Math.floor((la+dl)*2);a++)for(let b=Math.floor((lo-dn)*2);b<=Math.floor((lo+dn)*2);b++){const k=a+"_"+b;if(I.keys.includes(k))ks.add(k);}
  const rows=(await Promise.all([...ks].map(k=>EVC[k]||(EVC[k]=getJSON("data/ev/"+k+".json?t="+Math.floor(Date.now()/36e5),15000).catch(e=>{delete EVC[k];throw e;}))))).flat();
  const b=rows.filter(x=>distKm(la,lo,x[0],x[1])<=r).map(x=>({lat:x[0],lon:x[1],kw:x[2]||null,n:x[3]||null,op:x[4],addr:x[5],plugs:x[6]?x[6].split("|"):[],name:x[7],oh:x[8]}));
  return {elements:[],b,src:"bnetza"};}catch(e){return null;}}
// Löschen-Kreuz (ⓧ) in Eingabefeldern + „Alle Eingaben löschen“
function clrInit(root){(root||document).querySelectorAll('#bs-dlg input[type="text"]:not(#bs-cut), #fl-list input[data-fk="br"], #fl-list input[data-fk="abz"], #fl-list input[data-fk="nm"]').forEach(inp=>{
  if(inp.dataset.clr)return;inp.dataset.clr="1";if(!inp.placeholder)inp.placeholder=" ";
  const w=document.createElement("span");w.className="clr-w";inp.before(w);w.append(inp);
  const b=document.createElement("button");b.type="button";b.className="clr-x";b.setAttribute("aria-label","Eingabe löschen");b.tabIndex=-1;
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>';w.append(b);});}
document.addEventListener("click",e=>{const b=e.target.closest(".clr-x");if(b){e.preventDefault();const inp=b.parentNode.querySelector("input");inp.value="";inp.dispatchEvent(new Event("input",{bubbles:true}));inp.dispatchEvent(new Event("change",{bubbles:true}));inp.focus();return;}
  if(e.target.closest("#bs-clear")){["bs-area","bs-auf","bs-pers","bs-wid"].forEach(id=>{const x=$(id);if(x)x.value="";});const c=$("bs-cut");if(c)c.value="20";const t=$("bs-p20");if(t)t.checked=true;
    $("bs-area").dispatchEvent(new Event("input",{bubbles:true}));$("bs-p20").dispatchEvent(new Event("change",{bubbles:true}));$("bs-area").focus();}});
document.addEventListener("DOMContentLoaded",()=>clrInit());setTimeout(()=>clrInit(),0);
{const fl=document.getElementById("fl-list");if(fl)new MutationObserver(()=>clrInit(fl)).observe(fl,{childList:true,subtree:true});}
// Raster aufräumen: bleibt am Ende eine einzelne Kachel übrig, nimmt sie die volle Breite ein
function spanLast(){["tiles","toolgrid","headnav"].forEach(id=>{const g=document.getElementById(id);if(!g)return;const gt=getComputedStyle(g).gridTemplateColumns,rm=gt.match(/^repeat\((\d+)/),cols=rm?+rm[1]:gt.split(" ").filter(x=>/px$/.test(x)).length;
  [...g.children].forEach(c=>c.classList.remove("span2"));const v=[...g.children].filter(c=>!c.hidden&&getComputedStyle(c).display!=="none"&&getComputedStyle(c).gridColumnEnd!=="-1"&&c.dataset.tool!=="arrange");
  if(cols===2&&v.length%2===1)v[v.length-1].classList.add("span2");});}
["tiles","toolgrid","headnav"].forEach(id=>{const g=document.getElementById(id);if(g)new MutationObserver(()=>{clearTimeout(spanLast.t);spanLast.t=setTimeout(spanLast,50);}).observe(g,{childList:true,subtree:false,attributes:true,attributeFilter:["hidden","class","style"]});});
window.addEventListener("resize",()=>spanLast());document.addEventListener("click",()=>setTimeout(spanLast,120));setTimeout(spanLast,300);
// Kopf-Knöpfe WeekCal / Erinnerungen: Ziel lokal anpassbar (z. B. Kurzbefehl)
const QA={cal:["qa-cal","weekcal://"],rem:["qa-rem","x-apple-reminderkit://"],sonos:["qa-sonos","shortcuts://run-shortcut?name=WDR%202%20Sonos"],sonos4:["qa-sonos4","shortcuts://run-shortcut?name=WDR%204%20Sonos"],sonosfav:["qa-sonosfav","shortcuts://run-shortcut?name=Sonos%20Favoriten"],sonosant:["qa-sonosant","shortcuts://run-shortcut?name=Antenne%20Sonos"],sonosstop:["qa-sonosstop","shortcuts://run-shortcut?name=SONOS%20Wiedergabe%2FPause"],licht:["qa-licht","shortcuts://run-shortcut?name=Licht%20Entspannen"],lichtaus:["qa-lichtaus","shortcuts://run-shortcut?name=Licht%20Aus"]};
function scUrl(u){const m=/^shortcuts:\/\/run-shortcut\?name=([^&]+)/.exec(u||"");if(!m)return u;const back=encodeURIComponent(location.href.split("#")[0]);return "shortcuts://x-callback-url/run-shortcut?name="+m[1]+"&x-success="+back+"&x-cancel="+back+"&x-error="+back;}
document.addEventListener("click",e=>{const a=e.target.closest("#qa-sonos,#qa-sonos4,#qa-sonosfav,#qa-sonosant,[data-sonos]");if(!a||(typeof HEDIT!=="undefined"&&HEDIT))return;e.preventDefault();const k=a.id?a.id.slice(3):"sonos";if(a.id)sonosSet(a.id);location.href=scUrl(load("qa_"+k)||(QA[k]||QA.sonos)[1]);});
// Sonos: zuletzt gestarteten Sender als „läuft“ markieren (Sonos meldet keinen Status zurück – gilt 6 Stunden)
function sonosGet(){const o=load("sonos_now");return o&&o.id&&Date.now()-o.at<6*3600e3?o:null;}
function sonosSet(id){store("sonos_now",id?{id,at:Date.now()}:null);sonosMark();}
function sonosMark(){const o=sonosGet();document.querySelectorAll("#radio .rsonos").forEach(b=>b.classList.toggle("on",!!o&&b.id===o.id));
  const st=$("sonos-stop");if(st){st.hidden=false;$("sonos-stop-sub").textContent="Wiedergabe anhalten (Kurzbefehl)";if(o){const b=$(o.id);const nm=b?((b.querySelector(".r-tx b")||{}).textContent||""):"";$("sonos-stop-sub").textContent="läuft: "+nm+" · seit "+new Date(o.at).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})+" Uhr";}}}
{const st=$("sonos-stop");if(st)st.addEventListener("click",()=>{sonosSet(null);location.href=scUrl(load("qa_sonosstop")||QA.sonosstop[1]);});
 sonosMark();document.addEventListener("visibilitychange",()=>{if(!document.hidden)sonosMark();});}


// Licht (Hue über Kurzbefehle): Glühbirne öffnet Menü „Entspannen / Aus“
{const lb=$("qa-licht"),lm=$("licht-menu");const close=()=>{if(lm){lm.hidden=true;}if(lb)lb.setAttribute("aria-expanded","false");};
 if(lb&&lm){lb.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();const o=lm.hidden;lm.hidden=!o;lb.setAttribute("aria-expanded",String(o));});
  lm.addEventListener("click",e=>{const b=e.target.closest("[data-licht]");if(!b)return;e.stopPropagation();const k=b.dataset.licht;close();lb.classList.add("go");setTimeout(()=>lb.classList.remove("go"),2500);location.href=scUrl(load("qa_"+k)||QA[k][1]);});
  document.addEventListener("click",e=>{if(!lm.hidden&&!e.target.closest("#licht-menu,#qa-licht"))close();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});}}

// Düsseldorf: neutrale Karten-Überschrift; die gewählte Verbindung steht unter den Knöpfen
{const T=$("efa-title"),S=$("efa-src"),E=$("efa-sel");if(T&&S&&E){const N="Bus & Bahn Düsseldorf",NS="Rheinbahn · Echtzeit";
 const sync=()=>{const d=!!(ec()&&ec().isDus);if(!d){E.hidden=true;return;}const t=T.textContent,s=S.textContent;
  if(t!==N){E.dataset.t=t;T.textContent=N;}if(s!==NS){E.dataset.s=s;S.textContent=NS;}
  E.innerHTML='<b>'+esc(E.dataset.t||"")+'</b><small>'+esc(E.dataset.s||"")+'</small>';E.hidden=!E.dataset.t;};
 const mo=new MutationObserver(sync);[T,S].forEach(x=>mo.observe(x,{childList:true,characterData:true,subtree:true}));}}
function qaInit(){Object.entries(QA).forEach(([k,[id,def]])=>{const v=load("qa_"+k)||"";const a=$(id);if(a)a.href=v||def;const i=$(id+"-in");if(i)i.value=v;});}
qaInit();
document.addEventListener("click",e=>{const b=e.target.closest("[data-qasave]");if(!b)return;const k=b.dataset.qasave;const i=$(QA[k][0]+"-in");const v=(i.value||"").trim();
  if(v&&!/^[a-z][a-z0-9+.-]*:/i.test(v)){i.setCustomValidity("Bitte eine Adresse wie weekcal:// oder shortcuts://… eintragen");i.reportValidity();return;}i.setCustomValidity("");store("qa_"+k,v||null);qaInit();b.textContent="Gespeichert ✓";setTimeout(()=>b.textContent="Speichern",1500);});
async function loadEL(){const box=$("el-list");if(!box)return;const ck=(typeof RS!=="undefined"&&RS.city)||C.key;ELKEY=ck;
  if(!ELP||(ELP.auto&&ELP.k!==ck)){const f=elFavs().find(x=>x.k===ck);ELP={...(f||{k:ck,name:C.short||C.town,lat:C.center.lat,lon:C.center.lon}),auto:1};}
  renderELWhere();renderELSeg();$("el-title").textContent="E-Ladesäulen · "+ELP.name;
  const la=ELP.lat,lo=ELP.lon;const gm='<a class="el-gm" href="https://www.google.com/maps/search/Ladestation/@'+la+','+lo+',14z" target="_blank" rel="noopener">'+GMICON+'Ladesäulen um '+esc(ELP.name)+' in Google Maps zeigen ↗</a>';EGM=gm;
  box.innerHTML='<div class="state">Ladesäulen werden geladen …</div>'+gm;
  const q='[out:json][timeout:25];nwr["amenity"="charging_station"](around:'+(ELR*1000)+','+la+','+lo+');out center tags;';
  try{const d=(await osmLocal("c",la,lo,ELR))||(await evNear(la,lo,ELR))||await overpass(q);const BN=d.b||[];
    const kw=t=>{let m=0;for(const [k,v] of Object.entries(t))if(/(^|:)output$/.test(k)){const x=String(v).match(/([\d.,]+)\s*(kW|W)?/i);if(x){let n=parseFloat(x[1].replace(",","."));if(/^W$/i.test(x[2]||"")||n>1000)n/=1000;if(n>m)m=n;}}return m||null;};
    const SOCK={type2:"Typ 2",type2_combo:"CCS",chademo:"CHAdeMO",tesla_supercharger:"Tesla",schuko:"Schuko",type2_cable:"Typ 2 Kabel"};
    ELD=(d.elements||[]).map(e=>{const t=e.tags||{};const lat=e.lat??(e.center&&e.center.lat),lon=e.lon??(e.center&&e.center.lon);
      const so=Object.keys(SOCK).filter(k=>t["socket:"+k]&&t["socket:"+k]!=="no").map(k=>SOCK[k]+(/^\d+$/.test(t["socket:"+k])?" ×"+t["socket:"+k]:""));
      return {name:t.name||t.operator||t.network||t.brand||"Ladesäule",op:t.operator||t.network||"",addr:[[t["addr:street"],t["addr:housenumber"]].filter(Boolean).join(" "),t["addr:city"]].filter(Boolean).join(", "),
        cap:t.capacity,so,kw:kw(t),fee:t.fee,oh:t.opening_hours,lat,lon,km:distKm(la,lo,lat,lon)};}).filter(x=>isFinite(x.lat)).sort((a,b)=>a.km-b.km);
    if(BN.length){const pl=a=>[...new Set(a.map(x=>/combo|ccs/i.test(x)?"CCS":/chademo/i.test(x)?"CHAdeMO":/tesla/i.test(x)?"Tesla":/schuko/i.test(x)?"Schuko":/typ\s?2/i.test(x)?"Typ 2":x))];
      const bn=BN.map(b=>({name:b.name||b.op||"Ladesäule",op:b.op,addr:b.addr,cap:b.n,so:pl(b.plugs||[]),kw:b.kw,fee:null,oh:b.oh,lat:b.lat,lon:b.lon,km:distKm(la,lo,b.lat,b.lon),bn:1}));
      ELD=bn.concat(ELD.filter(x=>!bn.some(b=>distKm(b.lat,b.lon,x.lat,x.lon)<0.04))).sort((a,b)=>a.km-b.km);}
    renderEL();
  }catch(e){ELD=null;$("el-map").hidden=true;box.innerHTML=stateBox("OpenStreetMap antwortet gerade nicht – "+errText(e)+". Später erneut versuchen oder Google Maps nutzen.")+EGM;}}
let EGM="";
function renderEL(){const box=$("el-list");if(!ELD)return;const l=ELF==="fast"?ELD.filter(x=>x.kw>=50):ELD;
  const nav=x=>IOS?"comgooglemaps://?daddr="+x.lat+","+x.lon+"&directionsmode=driving":"https://www.google.com/maps/dir/?api=1&travelmode=driving&dir_action=navigate&destination="+x.lat+","+x.lon;
  const info=x=>esc([x.so.join(", "),x.cap?x.cap+" Ladepunkte":"",x.fee==="no"?"kostenlos":"",x.oh==="24/7"?"rund um die Uhr":x.oh||""].filter(Boolean).join(" · "));
  if(typeof L!=="undefined"){$("el-map").hidden=false;if(!ELMAP){ELMAP=L.map("el-map",{scrollWheelZoom:false,dragging:!L.Browser.mobile,tap:!L.Browser.mobile});baseTiles(false).forEach(l=>l.addTo(ELMAP));ELMAP.getContainer().classList.toggle("ttmap",!!TTKEY);ELLAY=L.layerGroup().addTo(ELMAP);}
    ELMAP.invalidateSize();ELLAY.clearLayers();
    L.circleMarker([ELP.lat,ELP.lon],{radius:6,color:"#14212b",weight:2,fillColor:"#fff",fillOpacity:1}).bindTooltip(ELP.name).addTo(ELLAY);
    l.slice(0,300).forEach(x=>L.circleMarker([x.lat,x.lon],{radius:7,color:"#fff",weight:2,fillColor:x.kw>=50?"#0b6e8a":"#2e9d5b",fillOpacity:1}).bindPopup('<b>'+esc(x.name)+'</b><br>'+(x.kw?fmt(x.kw,0)+' kW · ':'')+info(x)+(x.addr?'<br>'+esc(x.addr):'')+'<br><a href="'+nav(x)+'" target="_blank" rel="noopener">Route in Google Maps ↗</a>').addTo(ELLAY));
    ELMAP.fitBounds(L.latLng(ELP.lat,ELP.lon).toBounds(ELR*2000),{padding:[4,4]});}
  else $("el-map").hidden=true;
  box.innerHTML='<div class="muted small" style="margin-bottom:4px">'+l.length+' Ladestationen'+(ELF==="fast"?" mit mind. 50 kW":"")+' im Umkreis von '+ELR+' km um '+esc(ELP.name)+', die nächste zuerst. In der Karte: blau = Schnelllader, grün = normal. Adresse antippen startet die Navigation in Google Maps.</div>'+
    (l.length?l.slice(0,80).map(x=>'<a class="el" href="'+nav(x)+'"'+(IOS?'':' target="_blank" rel="noopener"')+' style="text-decoration:none;color:inherit" title="Mit Google Maps hinfahren"><span class="t">'+esc(x.name)+'</span><span class="k">'+fmt(x.km,1)+' km</span>'+
      '<span class="d">'+(x.kw?'<span class="kw'+(x.kw>=50?" fast":"")+'">'+fmt(x.kw,0)+' kW</span>':'')+info(x)+
      (x.op&&x.op!==x.name?'<br>'+esc(x.op):"")+'</span><span class="el-ad">'+GMICON+esc(x.addr||"Route zur Ladesäule")+' ↗</span></a>').join("")
     :'<div class="state">Keine Ladestationen gefunden – Umkreis vergrößern.</div>')+
    EGM+'<div class="muted small" style="margin-top:8px">Daten: Ladesäulenregister der Bundesnetzagentur (rund um deine Orte) und OpenStreetMap-Mitwirkende, Ortssuche: Nominatim. Belegung live gibt es dort nicht. Amtliche Liste für Deutschland: <a href="https://www.bundesnetzagentur.de/ladesaeulenkarte" target="_blank" rel="noopener">Ladesäulenkarte der Bundesnetzagentur ↗</a></div>';}
function elGPS(){const msg=$("el-gpsmsg");let done=false;
  const show=h=>{msg.innerHTML=h;msg.scrollIntoView({behavior:"smooth",block:"nearest"});};
  if(!window.isSecureContext||!navigator.geolocation){show(stateBox("Standort wird hier nicht unterstützt."));return;}
  document.querySelectorAll("#el-where button").forEach(b=>b.classList.toggle("on",b.dataset.elw==="gps"));
  show('<div class="state">📍 Standort wird ermittelt …</div>');
  const ok=p=>{if(done)return;done=true;msg.innerHTML="";elSet({k:"gps",name:"deinen Standort",lat:p.coords.latitude,lon:p.coords.longitude});};
  const fail=err=>{if(done)return;done=true;const c=err&&err.code;
    show(c===1?stateBox("Standort nicht freigegeben.",'So geht es auf dem iPhone: <b>Einstellungen → Datenschutz &amp; Sicherheit → Ortungsdienste</b> muss an sein, dort bei <b>Safari-Websites</b> „Beim Verwenden der App“ wählen. Dann <b>Einstellungen → Apps → Safari → Standort</b> auf „Fragen“ oder „Erlauben“ stellen. Danach die App schließen, neu öffnen und „Mein Standort“ noch einmal antippen.')
      :stateBox(c===3||c==="wd"?"Standort hat zu lange gedauert.":"Standort konnte nicht ermittelt werden.",'Bitte noch einmal antippen, am besten mit WLAN oder im Freien. Oder oben einen Ort bzw. eine Adresse eingeben.'));};
  setTimeout(()=>fail({code:"wd"}),32000); // falls das iPhone gar nicht antwortet
  navigator.geolocation.getCurrentPosition(ok,err=>{if(err&&err.code===1)return fail(err);
    navigator.geolocation.getCurrentPosition(ok,fail,{enableHighAccuracy:true,timeout:20000,maximumAge:0});},
    {enableHighAccuracy:false,timeout:8000,maximumAge:300000});}
function elSet(p){ELP=p;$("el-hits").innerHTML="";loadEL();}
document.addEventListener("click",e=>{const r=e.target.closest("[data-elr]");if(r){ELR=+r.dataset.elr;store("el_rad",ELR);loadEL();return;}
  const f=e.target.closest("[data-elf]");if(f){ELF=f.dataset.elf;store("el_f",ELF);renderELSeg();renderEL();return;}
  const w=e.target.closest("[data-elw]");if(w){const k=w.dataset.elw;AUTOMAN.el=true;
    if(k==="gps"){elGPS();return;}
    const fv=elFavs().find(x=>x.k===k);if(fv)elSet(fv);return;}
  const h=e.target.closest("[data-elhit]");if(h){const [la,lo]=h.dataset.elhit.split(",").map(Number);$("el-q").value=h.textContent;elSet({k:"q",name:h.dataset.n,lat:la,lon:lo});}});
document.addEventListener("submit",async e=>{if(e.target.id!=="el-form")return;e.preventDefault();const q=$("el-q").value.trim();if(!q)return;const hb=$("el-hits");hb.innerHTML='<div class="muted small">sucht …</div>';
  try{const r=await getJSON("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=de,at&accept-language=de&q="+encodeURIComponent(q));
    if(!r.length){hb.innerHTML='<div class="muted small">Nichts gefunden – anders schreiben, z. B. „Hauptstraße 5, Wels“.</div>';return;}
    if(r.length===1){elSet({k:"q",name:r[0].name||q,lat:+r[0].lat,lon:+r[0].lon});return;}
    hb.innerHTML=r.map(x=>'<button type="button" data-elhit="'+x.lat+','+x.lon+'" data-n="'+esc(x.name||q)+'">'+esc(x.display_name)+'</button>').join("");
  }catch(err){hb.innerHTML='<div class="muted small">Ortssuche nicht erreichbar – '+esc(errText(err))+'.</div>';}});

// ================= Parken Datteln (OpenStreetMap) =================
var PKS=null,PKDAT=null,PKGPS=null,PKPOS=null;
function pkShow(k){PKS=k;{const gb=document.querySelector('#pk-seg [data-pks="gps"]');if(gb){const n=CITYN[(typeof RS!=="undefined"&&RS.city)||"dus"]||"Ort";gb.lastChild.textContent=k==="gps"?"Zurück zu "+n:"An meinem Standort suchen (2 km)";}}const pane=k==="gps"||k==="dus"||k==="datteln"?k:"city";document.querySelectorAll("#pk-seg [data-pks]").forEach(b=>b.classList.toggle("on",b.dataset.pks===k));
  document.querySelectorAll("#v-parken [data-pk]").forEach(d=>d.hidden=d.dataset.pk!==pane);if(k==="datteln"&&!PKDAT)loadPkDat();if(k==="gps")pkGPS();if(pane==="city")loadPkCity(k);}
const PKC={};
const PKCENTER={dortmund:{lat:51.4926,lon:7.4519,lbl:"um das Westfalenstadion"}};
async function loadPkCity(k){const box=$("pk-city");if(!box)return;const Z=PKCENTER[k]||FIXHOME[k]||TOWNS[k];const n=CITYN[k]||k;$("pk-city-h").textContent="Parken in "+n+(PKCENTER[k]?" · Westfalenstadion":"");
  if(PKC[k]){renderPk("pk-city",PKC[k],'Öffentliche Parkmöglichkeiten bis 3 km '+(PKCENTER[k]?PKCENTER[k].lbl:'um deine Adresse in '+esc(n))+', die nächste zuerst. Antippen öffnet die Route in Google Maps.');return;}
  box.innerHTML='<div class="state">wird geladen …</div>';
  try{const d=await pkQuery(Z,3000);PKC[k]=pkParse(d,Z);if(PKS===k)loadPkCity(k);}catch(e){box.innerHTML=stateBox("Parkdaten für "+esc(n)+" nicht verfügbar – "+errText(e)+".");}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-pks]");if(b){e.preventDefault();AUTOMAN.pk=true;
  // Standort-Knopf ist ein Umschalter: erneut antippen führt zurück zum gewählten Ort
  if(b.dataset.pks==="gps"&&PKS==="gps"&&b.closest("#pk-seg"))pkShow((typeof RS!=="undefined"&&RS.city)||"dus");else pkShow(b.dataset.pks);}});
function pkParse(d,R){return (d.elements||[]).map(e=>{const t=e.tags||{};const lat=e.lat??(e.center&&e.center.lat),lon=e.lon??(e.center&&e.center.lon);
      const kind=t.amenity==="parking_space"||(t.parking_space==="disabled")?"bh":t.park_ride&&t.park_ride!=="no"?"pr":/multi-storey|underground/.test(t.parking||"")?"ph":"pp";
      return {kind,name:t.name||({ph:t.parking==="underground"?"Tiefgarage":"Parkhaus",pr:"Park + Ride",bh:"Behindertenparkplatz",pp:"Parkplatz"})[kind],cap:t.capacity,dis:t["capacity:disabled"],
        fee:t.fee,max:t.maxstay,oh:t.opening_hours,access:t.access,pk:t.parking||"",addr:[t["addr:street"],t["addr:housenumber"]].filter(Boolean).join(" "),lat,lon,km:distKm(R.lat,R.lon,lat,lon)};})
      // nur öffentliche Anlagen: keine privaten, Kunden-, Anwohner- oder Mitarbeiterparkplätze, keine Garagenhöfe/Carports;
      // einfache Parkplätze nur, wenn ausdrücklich öffentlich, gebührenpflichtig, benannt oder größer
      .filter(x=>isFinite(x.lat)&&!/^(private|no|customers|delivery|residents|permit|employees|agricultural|forestry)$/.test(x.access||"")&&!/garage_boxes|carports|garage$/.test(x.pk)
        &&(x.kind!=="pp"||/^(yes|public|permissive|destination)$/.test(x.access||"")||x.fee==="yes"||(x.name&&x.name!=="Parkplatz")||Number(x.cap)>=20)).sort((a,b)=>a.km-b.km);}
async function pkQuery(Z,r){const loc=await osmLocal("p",Z.lat,Z.lon,r/1000);if(loc)return loc;const q='[out:json][timeout:25];(nwr["amenity"="parking"](around:'+r+','+Z.lat+','+Z.lon+');nwr["amenity"="parking_space"]["parking_space"="disabled"](around:'+r+','+Z.lat+','+Z.lon+'););out center tags;';
  return overpass(q);}
async function loadPkDat(){const box=$("pk-dat");if(!box)return;
  const H=HOMES.datteln&&isFinite(HOMES.datteln.lat)?HOMES.datteln:null,Z={lat:51.6539,lon:7.3417};
  try{const d=await pkQuery(Z,3000);PKDAT=pkParse(d,H||Z);
    renderPk("pk-dat",PKDAT,'Öffentliche Parkmöglichkeiten, die nächste zuerst (Entfernung von '+(H?"deiner Adresse":"der Innenstadt")+'). Antippen öffnet die Route in Google Maps. Eine Live-Belegung gibt es für Datteln nicht.');
  }catch(e){box.innerHTML=stateBox("Parkdaten für Datteln nicht verfügbar – "+errText(e)+".");}}
function pkGPS(){const box=$("pk-gps");if(!box)return;
  if(!window.isSecureContext||!navigator.geolocation){box.innerHTML=stateBox("Standort wird hier nicht unterstützt.");return;}
  box.innerHTML='<div class="state">Standort wird ermittelt …</div>';
  const ok=async p=>{PKPOS={lat:p.coords.latitude,lon:p.coords.longitude};box.innerHTML='<div class="state">Parkplätze im Umkreis von 2 km werden geladen …</div>';
    try{const d=await pkQuery(PKPOS,2000);PKGPS=pkParse(d,PKPOS);
      renderPk("pk-gps",PKGPS,'Öffentliche Parkmöglichkeiten bis 2 km um deinen Standort, die nächste zuerst. Antippen öffnet die Route in Google Maps. Live-Belegung gibt es hier nicht. <a href="#" data-pks="gps">Standort neu ermitteln ↻</a>');
    }catch(e){box.innerHTML=stateBox("Parkdaten nicht verfügbar – "+errText(e)+".");}};
  const fail=err=>{box.innerHTML=err&&err.code===1?stateBox("Standort nicht freigegeben.",'Auf dem iPhone: <b>Einstellungen → Datenschutz &amp; Sicherheit → Ortungsdienste → Safari-Websites</b> auf „Beim Verwenden der App“ und <b>Einstellungen → Apps → Safari → Standort</b> auf „Fragen“ oder „Erlauben“. Dann die App neu öffnen.')
    :stateBox("Standort konnte nicht ermittelt werden.",'<a href="#" data-pks="gps">Noch einmal versuchen ↻</a>');};
  navigator.geolocation.getCurrentPosition(ok,err=>{if(err&&err.code===1)return fail(err);navigator.geolocation.getCurrentPosition(ok,fail,{enableHighAccuracy:true,timeout:20000,maximumAge:0});},{enableHighAccuracy:false,timeout:8000,maximumAge:120000});}
function renderPk(id,data,intro){const box=$(id);if(!data)return;
  const nav=x=>IOS?"comgooglemaps://?daddr="+x.lat+","+x.lon+"&directionsmode=driving":"https://www.google.com/maps/dir/?api=1&travelmode=driving&dir_action=navigate&destination="+x.lat+","+x.lon;
  const G=[["ph","Parkhäuser & Tiefgaragen",8],["pp","Parkplätze",12],["pr","Park + Ride",4],["bh","Behindertenparkplätze",8]];
  const bh=data.filter(x=>x.kind==="bh"||Number(x.dis)>0);
  box.innerHTML='<div class="muted small" style="margin-bottom:4px">'+intro+'</div>'+
    (G.map(([k,l,n])=>{const a=k==="bh"?bh:data.filter(x=>x.kind===k);if(!a.length)return"";return '<div class="sublbl" style="margin-top:12px">'+l+' <span class="muted small" style="font-weight:400">('+a.length+')</span></div>'+a.slice(0,n).map(x=>
      '<a class="el pk-nav" href="'+nav(x)+'"'+(IOS?'':' target="_blank" rel="noopener"')+' style="text-decoration:none;color:inherit" title="Mit Google Maps hinfahren"><span class="t">'+esc(x.name)+'</span><span class="k">'+fmt(x.km,1)+' km</span><span class="d">'+
      esc([x.cap?x.cap+" Plätze":"",Number(x.dis)>0?x.dis+" Behindertenplätze":"",x.fee==="yes"?"gebührenpflichtig":x.fee==="no"?"kostenlos":"",x.max?"max. "+x.max:"",x.oh==="24/7"?"rund um die Uhr":x.oh||""].filter(Boolean).join(" · "))+'</span><span class="el-ad">'+GMICON+(x.addr?esc(x.addr):'<span class="pka" data-lat="'+x.lat+'" data-lon="'+x.lon+'"></span>')+' ↗</span></a>').join("");}).join("")
    ||'<div class="state">Keine öffentlichen Parkplätze gefunden.</div>')+'<div class="muted small" style="margin-top:8px">Daten: OpenStreetMap-Mitwirkende, Adressen: TomTom.</div>';
  // fehlende Adressen nachladen (Straße, Ortsteil)
  [...box.querySelectorAll(".pka:empty")].forEach(async el=>{const v=await addrOf(+el.dataset.lat,+el.dataset.lon);if(v&&el.isConnected){el.textContent=v;const it=data.find(x=>Math.abs(x.lat-el.dataset.lat)<1e-6&&Math.abs(x.lon-el.dataset.lon)<1e-6);if(it)it.addr=v;}});}
async function refreshAll(force){
  if(busy){pending=true;return;}busy=true;const btn=$("refresh");btn.disabled=true;
  const tasks=[loadAlerts(),scanFavAlarms(),loadWeather(),loadObs(),loadAir(),loadRhein(),loadLandespegel(),loadAutobahn(),loadTomTom(),loadBlaulicht(),loadEinsaetze(),loadTrips(),loadEFA(),loadBike(),loadFuel(),loadBoerse(),loadNews(),loadSammler()];
  tasks.push(loadVT(),loadDatteln());if(location.hash==="#staus/reise")tasks.push(loadReise(true));else{RS.at=0;if(TTKEY)setTimeout(()=>{try{loadReise(false);}catch(e){}},4000);}if(ELKEY)tasks.push(loadEL());tasks.push(loadGarages());if(PKDAT)tasks.push(loadPkDat());
  renderWebcamLinks();
  if(force||Date.now()-lastSlow>3600e3||slowKey!==C.key){
    lastSlow=Date.now();slowKey=C.key;
    tasks.push(loadUBA(),loadPollen(),loadHol());
    tasks.push(loadWindy(),loadParking(),loadTM(),loadFussball(),loadDEG(),loadUrlaub());
  }
  await Promise.allSettled(tasks);
  {const um=$("upd-mini");if(um)um.innerHTML="<b>"+esc(C.isDus?"Düsseldorf":C.town)+"</b><span> · zuletzt aktualisiert "+new Date().toLocaleTimeString("de-DE",{...TZ,hour:"2-digit",minute:"2-digit"})+" Uhr"+(APPV?' · <span class="appv">'+esc(APPV)+'</span>':"")+"</span>";}
  $("updated").textContent=C.name+" · zuletzt aktualisiert "+new Date().toLocaleString("de-DE",{...TZ,dateStyle:"medium",timeStyle:"short"})+" · Staus alle 3, Rest alle 10 Minuten";
  btn.disabled=false;busy=false;lastRun=Date.now();
  if(pending){pending=false;refreshAll(true);}
}
let pending=false,lastRun=0;
function tick(){$("clock").textContent=new Date().toLocaleTimeString("de-DE",{...TZ,hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const nar=innerWidth<600;$("sub").textContent=new Date().toLocaleDateString("de-DE",nar?{...TZ,weekday:"short",day:"numeric",month:"short"}:{...TZ,weekday:"long",day:"numeric",month:"long",year:"numeric"})+" · KW "+isoWeek(new Date());}
$("refresh").addEventListener("click",()=>refreshAll(true));
// ================= Übersicht, Ansichten, Anordnen =================
const TILE_DEFAULT=[...document.querySelectorAll("#tiles .tile")].map(t=>t.dataset.view);
const GROUPS={wetter:[["wetter","Wetter"],["bezirke","Wetter Stadtbezirke"]],verkehr:[["staus/reise","Reise"],["staus/karte","Verkehr"],["parken","Parken"],["tanken","Tanken"],["eladen","E-Laden"]]};
function tileAvailable(v){
  v=String(v).split("/")[0];
  if(["bezirke","events"].includes(v))return C.isDus; // Veranstaltungen gibt es nur für Düsseldorf
  if(v==="einsaetze")return C.key==="datteln";
  if(v==="bahn")return false;if(v==="oepnv")return true; // jetzt unter Verkehr → Reise → Bus & Bahn
  return !!$("v-"+v);
}
const groupOf=v=>Object.keys(GROUPS).find(g=>GROUPS[g].some(([x])=>x===v||x.split("/")[0]===v));
function applyTileOrder(){
  let order=load("tile_order")||TILE_DEFAULT;const box=$("tiles");
  // „Bus & Bahn“ einmalig direkt hinter „Verkehr“ einsortieren
  if(!load("ord_bahn2")){order=order.filter(v=>v!=="bahn");const i=order.indexOf("staus");order.splice(i<0?order.length:i+1,0,"bahn");store("ord_bahn2",1);if(load("tile_order"))store("tile_order",order);}
  /* einmalig: gewünschte Reihenfolge wiederherstellen – Reise & Verkehr, Wetter, darunter Feuerwehreinsätze */
  if(!load("ord_fix_1116")){const top=["staus","wetter","einsaetze"];order=[...top,...order.filter(v=>!top.includes(v))];store("tile_order",order);store("ord_fix_1116",1);}
  TILE_DEFAULT.forEach((v,i)=>{if(!order.includes(v)){const prev=TILE_DEFAULT[i-1];const j=order.indexOf(prev);order.splice(j<0?order.length:j+1,0,v);}});
  [...order,...TILE_DEFAULT.filter(v=>!order.includes(v))].forEach(v=>{const t=box.querySelector('.tile[data-view="'+v+'"]');if(t)box.appendChild(t);});
}
function saveTileOrder(){store("tile_order",[...document.querySelectorAll("#tiles .tile")].map(t=>t.dataset.view));buildViewbar();}
function buildViewbar(){
  const cur=location.hash.slice(1).split("/")[0];
  const g=groupOf(cur);
  // Warnleiste: immer über alle Lieblingsorte (Düsseldorf, Datteln, Dortmund, Alpen-Menzelen, Salzhausen)
  {const sv=$("tool-src-v"),ks=$("k-src");if(sv&&ks)sv.textContent=((ks.querySelector(".val")||{}).textContent||"").replace(/\s+/g," ").trim().replace(/^[–?-]$/,"");}
  if(WARN_SUM&&WARN_SUM.loaded&&$("warnpill")){const wp=$("warnpill"),L=WARN_SUM.list,tot=L.reduce((t,x)=>t+x.n,0);
    const short=t=>String(t||"").replace(/^Amtliche (UNWETTER)?WARNUNG vor /i,"").replace(/^Amtliche /i,"");
    wp.className="warnpill wp-"+(tot?"bad":"ok")+(cur==="warnungen"?" on":"");
    $("warnpill-v").textContent=tot?tot+(tot===1?" Warnung":" Warnungen")+" · "+L.map(x=>x.name+": "+short(x.title)).join(" · ").slice(0,90):"Keine Warnungen · alle 5 Orte ruhig";}
  else{const wt=$("k-warn"),wp=$("warnpill");if(wt&&wp){const st=(["ok","warn","bad","crit","info"].find(c=>wt.classList.contains("s-"+c)))||"info";wp.className="warnpill wp-"+st+(cur==="warnungen"?" on":"");
    $("warnpill-v").textContent=[((wt.querySelector(".val")||{}).textContent||"").replace(/\s+/g," ").trim(),((wt.querySelector(".note")||{}).textContent||"").trim()].filter(x=>x&&x!=="–").join(" · ").slice(0,60)||"…";}}
  {const hn=$("headnav");if(hn&&!(typeof HEDIT!=="undefined"&&HEDIT))hn.innerHTML=[...document.querySelectorAll("#tiles .tile")].filter(t=>!t.hidden&&!["warnungen","quellen","einstellungen"].includes(t.dataset.view)).map(t=>{const v=t.dataset.view;const on=v===cur||(g&&groupOf(v)===g);const st=(["ok","warn","bad","crit","info"].find(c=>t.classList.contains("s-"+c)))||"info";return '<a data-v="'+v+'" class="hbtn hn-'+st+(on?" on":"")+'" href="#'+(v==="staus"?"staus/reise":v)+'"><span class="hn-l">'+esc(t.querySelector(".lbl").textContent)+'</span><span class="hn-v">'+esc(((t.querySelector(".val")||{}).textContent||"").replace(/\s+/g," ").trim().replace(/^[–?-]$/,"…").slice(0,26))+'</span></a>';}).join("");}
  $("viewbar-links").innerHTML=[...document.querySelectorAll("#tiles .tile")].filter(t=>!t.hidden).map(t=>{const on=t.dataset.view===cur||(g&&groupOf(t.dataset.view)===g);return '<a href="#'+t.dataset.view+'" class="'+(on?"on":"")+'">'+esc(t.querySelector(".lbl").textContent)+'</a>';}).join("");
}
let ROUTEKEY=null;
window.addEventListener("hashchange",route);
function route(){try{route0();}finally{const h=location.hash.slice(1);ROUTEKEY=(h.split("/")[0]||"")+"/"+(h.split("/")[1]||"reise");}}
function route0(){
  {const h=location.hash.slice(1);if(h==="oepnv"){history.replaceState(null,"","#staus/reise");RS.mode="oepnv";try{sessionStorage.setItem("lb_rsmode","oepnv");}catch(e){}setTimeout(()=>{try{rsMode("oepnv");}catch(e){}},0);}if(h==="verkehr"||h==="staus/meld"){history.replaceState(null,"","#staus/karte");}
  if(h==="stadtverkehr"||h==="stadtdatteln"){const k=h==="stadtverkehr"?"dus":"datteln";MAPFOCUS=1;history.replaceState(null,"","#staus/karte");setTimeout(()=>mapGo(k),250);}}
  let v=location.hash.slice(1);const pane=v.split("/")[1]||"reise";v=v.split("/")[0];
  document.querySelectorAll("#staus [data-pane]").forEach(p=>p.hidden=p.dataset.pane!==pane);
  if(v&&!$("v-"+v))v="";
  if(v&&!tileAvailable(v))v="";
  const inView=!!v;
  $("home").hidden=inView;$("viewbar").hidden=false;document.querySelector("#viewbar .back").classList.toggle("home",!inView);document.querySelector("#viewbar .back").textContent=inView?"‹ Übersicht":"Übersicht";
  document.querySelectorAll(".view").forEach(el=>el.hidden=el.dataset.view!==v);
  buildViewbar();
  document.querySelectorAll(".subtabs").forEach(el=>{const g=groupOf(el.dataset.for);
    const tabs=(GROUPS[g]||[]).filter(([x])=>tileAvailable(x));el.hidden=tabs.length<2;
    const cur=(v==="staus"||location.hash.includes("/"))?v+"/"+pane:v;el.classList.toggle("grid3",g==="verkehr");
    el.innerHTML=tabs.map(([x,l])=>'<a href="#'+x+'" class="'+(x===cur?"on":"")+'"'+(x==="staus/karte"?' data-karte':'')+'>'+esc(x==="staus/karte"?karteLbl():l)+(x==="staus/karte"?' <span class="fcnt" id="fcnt-all"></span>':'')+'</a>').join("");});
  if(typeof foldCount==="function")foldCount();
  // „Ich bin in …“ gilt für den ganzen Bereich Reise & Verkehr (Reise, Verkehrslage, Parken, Tanken, E-Laden)
  if(["staus","parken","tanken","eladen"].includes(v)){const rc=document.querySelector(".rv-city"),vw=$("v-"+v);if(rc&&vw){const st=vw.querySelector(".subtabs");if(st&&rc.nextElementSibling!==st)st.before(rc);else if(!st&&rc.parentNode!==vw)vw.prepend(rc);}
    if(!RS.city){rsCity(C.isDus?"dus":(CITYN[C.key]?C.key:"dus"));}if(EFAK!==EFACITY[RS.city]){EFAK=EFACITY[RS.city];STOPIDX=null;}if(RS.mode==="oepnv"&&v==="staus")rsOe();setBtns($("rs-city"),cityChips());}
  if(v==="eladen"&&(ELKEY!==RS.city||!ELP)){if(ELP&&ELP.k!=="gps"&&ELP.k!==RS.city)ELP=null;loadEL();}
  if(v==="eladen"&&!AUTOMAN.el&&!(ELP&&ELP.k==="gps"))autoAway().then(p=>{if(p&&location.hash==="#eladen"&&!(ELP&&ELP.k==="gps")&&!AUTOMAN.el)elGPS();});
  if(v==="parken"){pkShow(PKS==="gps"?"gps":RS.city||"dus");if(PKS!=="gps"&&!AUTOMAN.pk)autoAway().then(p=>{if(p&&location.hash==="#parken"&&PKS!=="gps"&&!AUTOMAN.pk)pkShow("gps");});}
  if(v==="tanken")fuelAuto();
  if(inView){if(ROUTEKEY!==v+"/"+pane){const top=()=>{const m=document.querySelector("main");window.scrollTo(0,m?Math.max(0,m.getBoundingClientRect().top+window.scrollY-6):0);};top();requestAnimationFrame(top);setTimeout(top,80);}if(v==="staus"){setStauTitle();if(!RS.city)RS.city=C.isDus?"dus":(CITYN[C.key]?C.key:"dus");setBtns($("rs-city"),cityChips());}if(v==="staus"&&pane==="reise")setTimeout(()=>loadReise(false),30);
    if(v==="staus"&&pane==="karte"){const vc=RS.city||(C.isDus?"dus":(TOWNS[C.key]?C.key:"dus"));if(MAPGO!==vc&&!/^r\d$/.test(MAPGO||""))setTimeout(()=>mapGo(vc),80);setTimeout(()=>{try{ensureMap();if(MAP){MAP.invalidateSize();if(!MAPFOCUS&&!MAPGO)fitMap();MAPFOCUS=0;}}catch(e){}},60);}}
}

// interne Links ohne Sprung des Browsers zu gleichnamigen Abschnitten
document.addEventListener("click",e=>{if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey)return;const a=e.target.closest('a[href^="#"]');if(!a||a.target)return;
  const h=a.getAttribute("href");e.preventDefault();history.pushState(null,"",h.length>1?h:location.pathname+location.search);route();});
try{history.scrollRestoration="manual";}catch(e){}window.scrollTo(0,0);
// Schließen führt zur übergeordneten Ansicht zurück (Schnittstellen → Einstellungen), sonst zur Übersicht
const VIEWPARENT={quellen:["einstellungen","‹ Zurück zu Einstellungen"],einstellungen:["","‹ Zurück zu Tools"],flaechen:["","‹ Zurück zu Tools"],finanzen:["","‹ Zurück zu Tools"]};
// Einstellungen schließen → Übersicht mit geöffneten Tools, Knopf im Blick
document.addEventListener("click",e=>{const x=e.target.closest("#v-einstellungen .view-x,#v-flaechen .view-x,#v-finanzen .view-x");if(!x)return;
  setTimeout(()=>{toolsShow(true);},120);});
document.querySelectorAll(".view").forEach(v=>{const p=VIEWPARENT[v.dataset.view];const x=document.createElement("a");x.href="#"+(p?p[0]:"");x.className="view-x";x.setAttribute("aria-label",p?p[1]:"Schließen, zurück zur Übersicht");x.innerHTML=p?p[1]:"✕ Schließen";v.prepend(x);
  // iOS-26-Leiste: Unterreiter + runder Schließen-Knopf in einer Zeile
  // überall nur das runde ✕ (bei Unterseiten führt es eine Ebene zurück)
  x.classList.add("round");x.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';x.title=p?p[1].replace(/^‹\s*/,""):"Schließen";
  const bar=document.createElement("div");bar.className="vtop";x.after(bar);
  const st=v.querySelector(":scope > .subtabs, :scope > .segsw");if(st)bar.append(st);else{const sp=document.createElement("span");sp.className="vtop-sp";bar.append(sp);}
  bar.append(x);});
// aktiven Unterreiter in der Leiste sichtbar halten
new MutationObserver(()=>{document.querySelectorAll(".vtop .subtabs a.on").forEach(a=>{const b=a.parentNode;if(a.offsetLeft<b.scrollLeft||a.offsetLeft+a.offsetWidth>b.scrollLeft+b.clientWidth)b.scrollTo({left:a.offsetLeft-12,behavior:"smooth"});});}).observe(document.body,{subtree:true,attributes:true,attributeFilter:["class"]});
document.addEventListener("click",e=>{if(e.target.closest("[data-uber]")){const u="https://m.uber.com/ul/?action=setPickup&pickup=my_location";if(IOS)location.href=u;else window.open(u,"_blank","noopener");}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&location.hash.length>1&&!document.querySelector("dialog[open]"))location.hash="";});
let EDITING=false,SORT=null;
document.querySelectorAll("#tiles .tile").forEach(t=>{
  const ctl=document.createElement("span");ctl.className="ctl";
  ctl.innerHTML='<button type="button" data-mv="-1" aria-label="nach vorne">◀</button><button type="button" data-mv="1" aria-label="nach hinten">▶</button>';
  t.appendChild(ctl);
  ctl.querySelectorAll("button").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();
    const list=[...$("tiles").children].filter(x=>!x.hidden);const i=list.indexOf(t),j=i+Number(b.dataset.mv);
    if(j<0||j>=list.length)return;if(Number(b.dataset.mv)<0)list[j].before(t);else list[j].after(t);saveTileOrder();}));
  const go=()=>{if(EDITING)return;history.pushState(null,"","#"+(t.dataset.view==="staus"?"staus/reise":t.dataset.view));route();};
  t.addEventListener("click",go);t.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});
});
$("arrange").addEventListener("click",()=>{
  EDITING=!EDITING;$("tiles").classList.toggle("editing",EDITING);
  $("arrange").textContent=EDITING?"Fertig":"Anordnen";$("arrange-hint").hidden=!EDITING;$("arrange-reset").hidden=!EDITING;
  if(window.Sortable&&!SORT)SORT=Sortable.create($("tiles"),{animation:150,forceFallback:true,fallbackOnBody:true,fallbackTolerance:4,delay:0,filter:".ctl button",preventOnFilter:false,ghostClass:"tile-ghost",chosenClass:"tile-chosen",dragClass:"tile-drag",onStart:()=>$("tiles").classList.add("dragging"),onEnd:()=>{$("tiles").classList.remove("dragging");saveTileOrder();}});
  if(SORT)SORT.option("disabled",!EDITING);
  if(!EDITING)saveTileOrder();
  document.body.classList.toggle("arranging",EDITING);if(!EDITING)buildViewbar();
  // Tools lassen sich im selben Modus verschieben
  if(EDITING){$("tools").hidden=false;$("tools-toggle").setAttribute("aria-expanded","true");}
  if(window.Sortable&&!TSORT)TSORT=Sortable.create($("toolgrid"),{animation:150,forceFallback:true,fallbackOnBody:true,fallbackTolerance:4,ghostClass:"tile-ghost"});
  if(TSORT&&!HEDIT)TSORT.option("disabled",!EDITING);
  if(!EDITING)store("tool_order",[...$("toolgrid").children].map(x=>x.dataset.tool));
});
let TSORT=null;
{const ord=load("tool_order");const g=$("toolgrid");if(Array.isArray(ord)&&g){ord.forEach(k=>{const el=g.querySelector('[data-tool="'+k+'"]');if(el)g.appendChild(el);});
  // neu hinzugekommene Tools (z. B. Einstellungen, Schnittstellen) vor „Anordnen“ einreihen
  const ar=g.querySelector('[data-tool="arrange"]');[...g.children].filter(x=>!ord.includes(x.dataset.tool)&&x!==ar).forEach(x=>g.insertBefore(x,ar));if(ar)g.appendChild(ar);}}
document.addEventListener("click",e=>{if(!document.body.classList.contains("arranging"))return;const t=e.target.closest("#toolgrid [data-tool]");if(t&&t.dataset.tool!=="arrange"){e.preventDefault();e.stopImmediatePropagation();}},true);
// Eigenes Verschieben per Finger (ohne Fremdbibliothek): kurz gedrückt halten, dann ziehen
function reorder(box,sel,act,done,hold){if(!box)return null;let drag=null,tm=0,sx=0,sy=0,moved=false;
  const start=(x,y,t)=>{if(!(act?act():HEDIT))return;const it=t.closest&&t.closest(sel);if(!it||!box.contains(it))return;sx=x;sy=y;moved=false;clearTimeout(tm);
    tm=setTimeout(()=>{drag=it;it.classList.add("h-chosen");box.classList.add("h-dragging");try{navigator.vibrate&&navigator.vibrate(12);}catch(e){}},hold||200);};
  const move=(x,y,e)=>{if(!drag){if(Math.hypot(x-sx,y-sy)>10)clearTimeout(tm);return;}if(e.cancelable)e.preventDefault();moved=true;
    drag.style.visibility="hidden";const hit=document.elementFromPoint(x,y);drag.style.visibility="";
    const o=hit&&hit.closest(sel);if(!o||o===drag||o.parentNode!==box)return;
    const L=[...box.children],a=L.indexOf(drag),b=L.indexOf(o);box.insertBefore(drag,a<b?o.nextSibling:o);
    // während des Ziehens nahe am Rand mitscrollen
    if(y<70)window.scrollBy(0,-12);else if(y>innerHeight-70)window.scrollBy(0,12);};
  const end=()=>{clearTimeout(tm);if(!drag)return;drag.classList.remove("h-chosen");box.classList.remove("h-dragging");drag=null;if(moved&&done)done();
    if(moved){const stop=ev=>{ev.preventDefault();ev.stopImmediatePropagation();};document.addEventListener("click",stop,{capture:true,once:true});setTimeout(()=>document.removeEventListener("click",stop,true),400);}};
  box.addEventListener("touchstart",e=>{const t=e.touches[0];start(t.clientX,t.clientY,e.target);},{passive:true});
  box.addEventListener("touchmove",e=>{const t=e.touches[0];move(t.clientX,t.clientY,e);},{passive:false});
  box.addEventListener("touchend",end);box.addEventListener("touchcancel",end);
  box.addEventListener("mousedown",e=>{if(e.button)return;start(e.clientX,e.clientY,e.target);const mm=ev=>move(ev.clientX,ev.clientY,ev),mu=()=>{end();removeEventListener("mousemove",mm);removeEventListener("mouseup",mu);};addEventListener("mousemove",mm);addEventListener("mouseup",mu);});
  box.addEventListener("contextmenu",e=>{if(HEDIT)e.preventDefault();});
  return {};}
// Anordnen direkt im Kopf: Themen-Knöpfe und Tools an Ort und Stelle verschieben
let HEDIT=false,HSORT=null;
$("arrange-tool").addEventListener("click",()=>{HEDIT=!HEDIT;document.body.classList.toggle("harrange",HEDIT);
  const at=$("arrange-tool");at.lastChild.textContent=HEDIT?"Fertig":"Anordnen";$("harrange-hint").hidden=!HEDIT;
  if(HEDIT){$("tools").hidden=false;$("tools-toggle").setAttribute("aria-expanded","true");}
  // Links während des Anordnens „entschärfen“: iPad zieht sonst beim Gedrückthalten die Adresse statt des Knopfs
  document.querySelectorAll("#headnav a[href],#toolgrid a[href]").forEach(x=>{if(HEDIT){x.dataset.href=x.getAttribute("href");x.removeAttribute("href");}});
  if(!HEDIT)document.querySelectorAll("#headnav [data-href],#toolgrid [data-href]").forEach(x=>{x.setAttribute("href",x.dataset.href);delete x.dataset.href;});
  if(HEDIT&&!HSORT){HSORT=reorder($("headnav"),"[data-v]");reorder($("toolgrid"),"[data-tool]:not([data-tool='arrange'])");}
  if(!HEDIT){const tiles=$("tiles");[...$("headnav").querySelectorAll("[data-v]")].forEach(x=>{const t=tiles.querySelector('.tile[data-view="'+x.dataset.v+'"]');if(t)tiles.appendChild(t);});
    saveTileOrder();store("tool_order",[...$("toolgrid").children].map(x=>x.dataset.tool));}});
document.addEventListener("click",e=>{if(!HEDIT)return;const t=e.target.closest("#headnav a,#toolgrid [data-tool]");if(t&&!(t.dataset&&t.dataset.tool==="arrange")){e.preventDefault();e.stopImmediatePropagation();}},true);
/* Immer sortierbar: Knopf gedrückt halten und ziehen – kein „Anordnen“-Modus mehr nötig */
{const hn=$("headnav"),tg=$("toolgrid");
  const saveHead=()=>{const tiles=$("tiles");[...hn.querySelectorAll("[data-v]")].forEach(x=>{const t=tiles.querySelector('.tile[data-view="'+x.dataset.v+'"]');if(t)tiles.appendChild(t);});saveTileOrder();};
  const saveTools=()=>store("tool_order",[...tg.children].map(x=>x.dataset.tool));
  [hn,tg].forEach(b=>{b.addEventListener("dragstart",e=>e.preventDefault());b.addEventListener("contextmenu",e=>e.preventDefault());});
  /* 16.11.: Verschieben nur noch im Modus „Anordnen“ (Tools) – sonst rutschten Kacheln beim Scrollen versehentlich weg */
  const ar=$("arrange-tool");if(ar)ar.hidden=false;}
$("arrange-reset").addEventListener("click",()=>{store("tile_order",null);applyTileOrder();saveTileOrder();});
applyTileOrder();{const kb=$("k-bahn");if(kb)kb.hidden=true;}route();
applyPlaceUi();renderSources();tick();setInterval(tick,1000);

refreshAll(true);
setInterval(()=>{if(!document.hidden)refreshAll(false);},10*60*1000);
setInterval(()=>{if(!document.hidden&&!busy){loadAutobahn();loadTomTom();}},3*60*1000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-lastRun>5*60*1000)refreshAll(false);});
if("serviceWorker" in navigator&&location.protocol==="https:"){navigator.serviceWorker.register("sw.js").catch(()=>{});}
if(/[?&]debug\b/.test(location.search))window.__LB={get RS(){return RS;},renderReise,TILE_PARTS};

// ================= Besuchersicherheit: Fläche, Besucherzahl, Rettungswegbreite =================
// § 7 Abs. 4 SBauVO NRW: 1,20 m je 600 (im Freien) bzw. 200 Personen (andere), Zwischenwerte zulässig,
// lichte Mindestbreite je Rettungswegteil 1,20 m; bei Versammlungsräumen mit höchstens 200 Besucherplätzen 0,90 m.
const rwMin=(p,div)=>div===200&&p<=200?0.9:1.2;
const rwBreite=(p,div,w)=>p>0?Math.max(rwMin(p,div),p/div*(w||1.2)):0;
{const num=v=>{v=String(v||"").trim().replace(/\s/g,"");if(/,/.test(v))v=v.replace(/\./g,"").replace(",",".");else if(/^\d{1,3}(\.\d{3})+$/.test(v))v=v.replace(/\./g,"");const n=parseFloat(v);return isFinite(n)?n:NaN;};
  const f0=n=>Math.round(n).toLocaleString("de-DE"),f2=n=>n.toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2});
  const st=load("bsicher")||{};let sel=st.sel||2,mode=st.mode===200?200:600;
  function calc(){const A=num($("bs-area").value),cut=num($("bs-cut").value);const P0=num($("bs-pers").value);const AU=num($("bs-auf").value);
    if(isFinite(A)&&A>0){const on=$("bs-p20").checked;$("bs-cut").disabled=!on;const k=on?(isFinite(cut)?Math.min(Math.max(cut,0),100):20):0;const u=AU>0?AU:0;const N=Math.max(0,A*(1-k/100)-u);
      $("bs-net").innerHTML='<span>Nettofläche für Besucher</span><b>'+f2(N)+' m²</b><span>'+f0(A)+' m²'+(k?' − '+String(k).replace(".",",")+' % ('+f0(A*k/100)+' m²)':' (ohne Pauschale)')+(u?' − '+f0(u)+' m² Aufbauten':'')+'</span>';
      $("bs-dens").innerHTML=[1,2,3,4].map(d=>'<button type="button" data-bsd="'+d+'" class="'+(d===sel?"on":"")+'"><span>'+d+(d===1?" Person":" Personen")+' / m²'+(d===1?' <small>(nur Vergleich)</small>':d===2?' <small>(Mindestansatz Stehflächen)</small>':'')+'</span><b>'+f0(Math.floor(N*d))+'</b></button>').join("");}
    else{$("bs-net").innerHTML="";$("bs-dens").innerHTML='<div class="muted small">Bitte eine Fläche eingeben.</div>';}
    const div=mode;const W0=num($("bs-wid").value);
    if(isFinite(P0)&&P0>0){const r=P0/div*1.2,w=rwBreite(P0,div);
      $("bs-rw").innerHTML='<span>Erforderliche Gesamtbreite ('+(div===600?"im Freien":"in Gebäuden")+')</span><b>'+f2(w)+' m</b><span>'+(w>r+0.005?'rechnerisch '+f2(r)+' m, aber Mindestbreite '+f2(rwMin(P0,div))+' m (§ 7 Abs. 4 SBauVO)':'je Rettungswegteil mind. '+f2(rwMin(P0,div))+' m')+'</span>';}
    else $("bs-rw").innerHTML="";
    if(isFinite(W0)&&W0>0)$("bs-wp").innerHTML='<span>Zulässige Personen bei '+f2(W0)+' m ('+(div===600?"im Freien":"in Gebäuden")+')</span><b>'+f0(Math.floor(W0/1.2*div+1e-9))+' Personen</b>';else $("bs-wp").innerHTML="";
    // Tabelle wie in der Excel-Vorlage: 1,20 m bis 18 m in 0,60-m-Schritten
    let rows="";for(let k=2;k<=30;k++){const w=k*0.6,p=Math.round(w/1.2*div);const hit=isFinite(P0)&&P0>0&&P0<=p&&P0>Math.round((w-0.6)/1.2*div);rows+='<tr'+(hit?' class="hit"':'')+'><td>'+f2(w)+' m</td><td>'+f0(p)+'</td></tr>';}
    $("bs-tab").innerHTML='<table><thead><tr><th>Rettungswegbreite</th><th>Anzahl Personen</th></tr></thead><tbody>'+rows+'</tbody></table>';
    store("bsicher",{a:$("bs-area").value,c:$("bs-cut").value,u:$("bs-auf").value,z:$("bs-p20").checked,p:$("bs-pers").value,w:$("bs-wid").value,sel,mode});}
  const dlg=$("bs-dlg");
  if(dlg){$("bs-area").value=st.a||"";$("bs-cut").value=st.c||"20";$("bs-pers").value=st.p||"";
    $("bs-wid").value=st.w||"";$("bs-auf").value=st.u||"";$("bs-p20").checked=st.z!==false;$("bs-p20").addEventListener("change",calc);["bs-area","bs-cut","bs-auf","bs-pers","bs-wid"].forEach(id=>$(id).addEventListener("input",calc));
    document.querySelectorAll("#bs-mode [data-bsm]").forEach(b=>b.classList.toggle("on",+b.dataset.bsm===mode));
    $("bs-mode").addEventListener("click",e=>{const b=e.target.closest("[data-bsm]");if(!b)return;mode=+b.dataset.bsm;document.querySelectorAll("#bs-mode [data-bsm]").forEach(x=>x.classList.toggle("on",x===b));calc();});
    $("bs-dens").addEventListener("click",e=>{const b=e.target.closest("[data-bsd]");if(!b)return;sel=+b.dataset.bsd;$("bs-pers").value=b.querySelector("b").textContent.replace(/\./g,"");calc();});
    $("bs-btn").addEventListener("click",()=>{if(document.body.classList.contains("harrange"))return;calc();dlg.showModal();});}}

// ================= Veranstaltungsflächen Düsseldorf (aus „Berechnung Veranstaltungsflächen“, © Thomas Hußmann) =================
{const FL=[["Rheinpark (groß/nördlich)", 220730, "https://maps.duesseldorf.de/?Ls=all&Zoom=7&Center=344243,5679162&Marker=344243,5679162&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.242535&mlon=6.768503#map=17/51.242535/6.768503"], ["Rheinpark (klein/südlich)", 6676, "https://maps.duesseldorf.de/?Ls=all&Zoom=7&Center=344374,5678298&Marker=344374,5678298&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.234807&mlon=6.770754#map=18/51.234807/6.770754"], ["Altstadtufer (zwischen Oberkasseler-/Kniebrücke inkl. Burgplatz und altes Hafenbecken)", 86702, "https://maps.duesseldorf.de/?Ls=all&Zoom=6&Center=344250,5677250&Marker=344202,5677038&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.223439&mlon=6.768840#map=17/51.223439/6.768840"], ["Burgplatz", 6478, "https://maps.duesseldorf.de/?Ls=all&Zoom=8&Center=344379.0,5677437.5&Marker=344376,5677438&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.227080&mlon=6.771156#map=18/51.227080/6.771156"], ["Marktplatz", 3109, "https://maps.duesseldorf.de/?Ls=all&Zoom=8&Center=344431.0,5677302.5&Marker=344430,5677300&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.225855&mlon=6.771989#map=18/51.225855/6.771989"], ["Kurze Str./Andreasstr.", 2036, "https://maps.duesseldorf.de/?Ls=all&Zoom=7&Center=344562,5677422&Marker=344500.4,5677412.2&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.226882&mlon=6.772947#map=18/51.226882/6.772947"], ["Bolkerstr.", 2704, "https://maps.duesseldorf.de/?Ls=all&Zoom=7&Center=344582.1,5677334.3&Marker=344582.1,5677334.3&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.226205&mlon=6.774150#map=18/51.226205/6.774150"], ["Schadowplatz", 3126, "https://maps.duesseldorf.de/?Ls=all&Zoom=8&Center=345013.5,5677332.0&Marker=345024,5677338&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.226358&mlon=6.780472#map=18/51.226358/6.780472"], ["G.-Gründgens-Platz", 5642, "https://maps.duesseldorf.de/?Ls=all&Zoom=8&Center=345228.5,5677475.0&Marker=345224,5677478&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.227670&mlon=6.783274#map=18/51.227670/6.783274"], ["Königsallee, westseitig", 14396, "https://maps.duesseldorf.de/?Ls=all&Zoom=6&Center=344876.0,5676929.5&Marker=344868,5676920&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.222560&mlon=6.778421#map=18/51.222560/6.778421"], ["Königsallee, ostseitig (Einkaufseite)", 21239, "https://maps.duesseldorf.de/?Ls=all&Zoom=6&Center=344918.5,5676927.0&Marker=344926,5676924&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.222611&mlon=6.779249#map=18/51.222611/6.779249"], ["Platz des Landtags/Caritas-Platz", 18886, "https://maps.duesseldorf.de/?Ls=all&Zoom=7&Center=343811.5,5676474.1&Marker=343811.5,5676474.1&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.218265&mlon=6.763498#map=18/51.218265/6.763498"], ["Hafenbecken 1 (inkl. Fußgängerbrücke)", 18104, "https://maps.duesseldorf.de/?Ls=all&Zoom=8&Center=343066.1,5676069.7&Marker=343126.0,5676149.5&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.215161&mlon=6.753832#map=18/51.215161/6.753832"], ["Oberkasseler Rheinwiesen (zwischen Oberkasseler-/Kniebrücke)", 239904, "https://maps.duesseldorf.de/?Ls=all&Zoom=7&Center=343803,5677386&Marker=343803,5677386&Rotation=0&Background=bg_stpllight_rvr&Layers=vstfle&Filters=&ExtentsUTM=&PointsUTM=&CirclesUTM=&Lang=de&Nt=false", "https://www.openstreetmap.org/?mlat=51.226456&mlon=6.762979#map=17/51.226456/6.762979"]];
  FL.push(["Freie Fläche",0,"",""]);const FREE=FL.length-1; // neutrales Feld für jede beliebige Fläche
  const num=v=>{v=String(v??"").trim().replace(/\s/g,"");if(!v)return NaN;if(/,/.test(v))v=v.replace(/\./g,"").replace(",",".");else if(/^\d{1,3}(\.\d{3})+$/.test(v))v=v.replace(/\./g,"");const n=parseFloat(v);return isFinite(n)?n:NaN;};
  const f0=n=>Math.round(n).toLocaleString("de-DE"),f2=n=>n.toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2});
  let S=load("fl_state")||{};S.inc=S.inc||{};S.abz=S.abz||{};S.br=S.br||{};/* leere Gesamtfläche bei festen Flächen = Standardwert wiederherstellen */const brFix=()=>{let c=0;Object.keys(S.br).forEach(k=>{if(+k!==FREE&&String(S.br[k]).trim()===""){delete S.br[k];c=1;}});return c;};brFix();S.note=S.note||{};S.p20=S.p20||{};
  const incOf=i=>i===FREE?S.inc[i]===true:S.inc[i]!==false;const nmOf=i=>i===FREE?(S.nm||"Freie Fläche"):FL[i][0];const nrOf=i=>i===FREE?"+":String(i+1);
  const mapA=(f,nm)=>f[2]?'<a class="fl-map" href="'+esc(f[2])+'" target="_blank" rel="noopener" title="In Düsseldorf Maps zeigen" aria-label="'+esc(nm)+' in Düsseldorf Maps zeigen">'+FLPIN+'</a>':"";
  const save=()=>store("fl_state",S);
  const par=()=>{const div=num(S.div??600),w=num(S.w??"1,2");const d=String(S.d??"1; 2; 3; 4").split(/[;\s]+/).map(num).filter(x=>x>0).slice(0,6);return {div:div>0?div:600,w:w>0?w:1.2,d:d.length?d:[1,2,3,4]};};
  const pz=()=>{const v=num(S.pz??20);return isFinite(v)?Math.min(Math.max(v,0),100):20;};
  const pzi=i=>S.p20[i]===false?0:pz();
  const netOf=i=>{const b=num(S.br[i]??(i===FREE?"":FL[i][1])),a=num(S.abz[i]);return Math.max(0,(b||0)*(1-pzi(i)/100)-(a>0?a:0));};
  const calcTxt=i=>{const b=num(S.br[i]??(i===FREE?"":FL[i][1]))||0,a=num(S.abz[i]);return f0(b)+' m²'+(pzi(i)?' − '+String(pzi(i)).replace(".",",")+' % ('+f0(b*pzi(i)/100)+' m²)':' (ohne Pauschale)')+(a>0?' − '+f0(a)+' m² Aufbauten':'')+' = <b>'+f0(netOf(i))+' m² netto</b>';};
  function sums(){const P=par();let br=0,ab=0,ne=0,n=0,pa=0;const per=P.d.map(()=>0);
    FL.forEach((f,i)=>{if(!incOf(i))return;const b=num(S.br[i]??(i===FREE?"":f[1])),a=num(S.abz[i]);const N=netOf(i);br+=b||0;pa+=(b||0)*pzi(i)/100;ab+=a>0?a:0;ne+=N;n++;P.d.forEach((d,k)=>per[k]+=N*d);});
    $("fl-sum").innerHTML='<h3>Gesamtkapazität der einbezogenen Flächen <span class="muted small">('+n+' von '+(FL.length-1)+')</span></h3><div class="muted small" style="margin-bottom:6px">Gesamtfläche '+f0(br)+' m² − Pauschale '+f0(pa)+' m² − Aufbauten '+f0(ab)+' m² = <b>Netto '+f0(ne)+' m²</b></div>'+
      '<table><thead><tr><th>Dichte</th><th>Personen</th><th class="rw">Rettungsweg</th></tr></thead><tbody>'+P.d.map((d,k)=>'<tr><td>'+String(d).replace(".",",")+' P/m²</td><td><b>'+f0(Math.floor(per[k]))+'</b></td><td class="rw">'+f2(rwBreite(per[k],P.div,P.w))+' m</td></tr>').join("")+'</tbody></table>';}
  function card(f,i){const P=par();const N=netOf(i);
    return '<table><thead><tr><th>Dichte</th><th>Personen</th><th class="rw">Rettungsweg</th></tr></thead><tbody>'+P.d.map(d=>'<tr><td>'+String(d).replace(".",",")+' P/m²</td><td>'+f0(Math.floor(N*d))+'</td><td class="rw">'+f2(rwBreite(Math.floor(N*d),P.div,P.w))+' m</td></tr>').join("")+'</tbody></table>';}
  const FLPIN='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.5s-7-6-7-11.6a7 7 0 0 1 14 0c0 5.6-7 11.6-7 11.6z"/><circle cx="12" cy="9.8" r="2.6"/></svg>';
  let FLSEL=null,FLS=false;
  const ordr=()=>{const o=(Array.isArray(S.ord)?S.ord:[]).filter(i=>i>=0&&i<FL.length);if(!o.includes(FREE))o.unshift(FREE);FL.forEach((f,i)=>{if(!o.includes(i))o.push(i);});return o;};
  const tileTxt=i=>{const P=par();if(i===FREE&&!(num(S.br[i])>0))return '<span>Eigene Fläche eingeben und berechnen</span>';const d=P.d.includes(2)?2:P.d[0];return '<span>'+f0(netOf(i))+' m² netto</span><span><b>'+f0(Math.floor(netOf(i)*d))+'</b> Personen</span>';};
  function grid(){const g=$("fl-grid");if(!g)return;g.innerHTML=ordr().map(i=>{const f=FL[i];return '<div class="fl-t'+(!incOf(i)?" off":"")+(i===FREE?" free":"")+'" data-ft="'+i+'" role="button" tabindex="0"><span class="fl-th"><span class="fa-nr">'+nrOf(i)+'</span>'+mapA(f,nmOf(i))+'</span><span class="fl-tn" data-tn>'+esc(nmOf(i))+'</span><small data-tt>'+tileTxt(i)+'</small></div>';}).join("");}
  function showSel(i){if(brFix()){save();render();}FLSEL=i;const sec=$("fl-list").closest(".fl");sec.classList.toggle("det",i!=null);
    document.querySelectorAll("#fl-list [data-fi]").forEach(x=>x.classList.toggle("sel",+x.dataset.fi===i));
    const v=$("v-flaechen");if(v&&!v.hidden)window.scrollTo(0,Math.max(0,v.getBoundingClientRect().top+scrollY-6));}
  function render(){const P=par();$("fl-div").value=S.div??"600";$("fl-w").value=S.w??"1,20";$("fl-d").value=S.d??"1; 2; 3; 4";$("fl-pz").value=S.pz??"20";
    $("fl-list").innerHTML=FL.map((f,i)=>{const on=incOf(i);const b=S.br[i]??(i===FREE?"":f[1]);const a=S.abz[i]??"";const N=netOf(i);
      return '<div class="fa'+(on?"":" off")+(i===FREE?" free":"")+'" data-fi="'+i+'"><div class="fa-h"><span class="fa-nr">'+nrOf(i)+'</span>'+(i===FREE?'<input class="fa-nm" type="text" data-fk="nm" placeholder="Name der Fläche (optional)" value="'+esc(S.nm||"")+'">':'<span class="fa-n">'+esc(f[0])+'</span>')+mapA(f,nmOf(i))+'<label class="fa-sw"><input type="checkbox" data-fk="inc"'+(on?" checked":"")+'>einbeziehen</label></div>'+
        '<div class="fa-in"><label>Gesamtfläche (m²)<input type="text" inputmode="decimal" data-fk="br" value="'+esc(String(b).replace(".",","))+'"></label>'+
        '<label class="fa-y">Bühnen, Gastro, Aufbauten (m²)<span class="fa-ab"><input type="text" inputmode="decimal" data-fk="abz" placeholder="0" value="'+esc(String(a))+'"></span></label>'+
        '<label>Nettofläche<span class="net" data-net>'+f0(N)+' m²</span></label></div><label class="tgl fa-tg"><input type="checkbox" data-fk="p20"'+(S.p20[i]===false?"":" checked")+'><span class="tgl-s"></span><span data-pzl>'+String(pz()).replace(".",",")+' % Pauschale abziehen</span></label><small class="fa-calc" data-calc>'+calcTxt(i)+'</small><button type="button" class="btn sm clr-all" data-flclr="'+i+'">Eingaben dieser Fläche löschen</button>'+
        '<div data-tab>'+card(f,i)+'</div>'+
        '<textarea data-fk="note" placeholder="Maßnahmen (nur auf diesem Gerät gespeichert)">'+esc(S.note[i]||"")+'</textarea>'+
        (f[2]?'':'<!--')+'<div class="fa-l"><a href="'+esc(f[2])+'" target="_blank" rel="noopener">Düsseldorf Maps ↗</a><a href="'+esc(f[3])+'" target="_blank" rel="noopener">OpenStreetMap ↗</a></div>'+(f[2]?'':'-->')+'</div>';}).join("");
    sums();grid();showSel(FLSEL);}
  function upd(i){const el=document.querySelector('#fl-list [data-fi="'+i+'"]');if(!el)return;const f=FL[i];const N=netOf(i);
    el.querySelector("[data-net]").textContent=f0(N)+" m²";el.querySelector("[data-calc]").innerHTML=calcTxt(i);el.querySelector("[data-pzl]").textContent=String(pz()).replace(".",",")+" % Pauschale abziehen";el.querySelector("[data-tab]").innerHTML=card(f,i);el.classList.toggle("off",!incOf(i));sums();const t=document.querySelector('#fl-grid [data-ft="'+i+'"]');if(t){t.querySelector("[data-tt]").innerHTML=tileTxt(i);t.classList.toggle("off",!incOf(i));}}
  document.addEventListener("input",e=>{const t=e.target;if(t.closest("#v-flaechen .fl-set")){S.pz=$("fl-pz").value;S.div=$("fl-div").value;S.w=$("fl-w").value;S.d=$("fl-d").value;save();document.querySelectorAll("#fl-list [data-fi]").forEach(x=>upd(+x.dataset.fi));return;}
    const c=t.closest("#fl-list [data-fi]");if(!c||!t.dataset.fk)return;const i=+c.dataset.fi;
    if(t.dataset.fk==="nm"){S.nm=t.value;save();const tn=document.querySelector('#fl-grid [data-ft="'+i+'"] [data-tn]');if(tn)tn.textContent=nmOf(i);return;}if(t.dataset.fk==="inc")S.inc[i]=t.checked;else if(t.dataset.fk==="p20")S.p20[i]=t.checked;else if(t.dataset.fk==="br")S.br[i]=t.value;else if(t.dataset.fk==="abz")S.abz[i]=t.value;else if(t.dataset.fk==="note")S.note[i]=t.value;save();if(t.dataset.fk!=="note")upd(i);});
  document.addEventListener("change",e=>{const t=e.target;if(t.matches("#fl-list [data-fk=inc]")){const i=+t.closest("[data-fi]").dataset.fi;S.inc[i]=t.checked;save();upd(i);}});
  document.addEventListener("click",e=>{
    if(e.target.closest("#fl-grid .fl-map")){if(FLS)e.preventDefault();return;}
    const t=e.target.closest("#fl-grid [data-ft]");if(t&&!FLS){showSel(+t.dataset.ft);return;}
    if(e.target.closest("#fl-back")){showSel(null);return;}
    const so=e.target.closest("#fl-sort");if(so){FLS=!FLS;so.classList.toggle("on",FLS);so.lastChild.textContent=FLS?"Fertig":"Anordnen";$("fl-grid").classList.toggle("sorting",FLS);return;}
    {const fc=e.target.closest("[data-flclr]");if(fc){const i=+fc.dataset.flclr;delete S.br[i];S.abz[i]="";S.p20[i]=true;if(i===FREE)S.nm="";save();render();return;}}
    if(e.target.closest("#fl-reset")&&confirm("Alle Abzüge, Notizen und Einstellungen der Veranstaltungsflächen zurücksetzen?")){S={inc:{},abz:{},br:{},note:{},p20:{}};save();render();}});
  if($("fl-list")){render();reorder($("fl-grid"),".fl-t",()=>FLS,()=>{S.ord=[...$("fl-grid").children].map(x=>+x.dataset.ft);save();});
    window.addEventListener("hashchange",()=>{if(location.hash!=="#flaechen")showSel(null);});}}
// Neue Dashboard-Version automatisch laden: beim Zurückkehren in die App und alle 10 Minuten nachsehen
{const myV=((document.querySelector('script[src*="app.js?v="]')||{}).src||"").split("v=")[1]||"";let chk=0;
  const check=async()=>{if(!myV||Date.now()-chk<60000)return;chk=Date.now();
    try{const t=await (await fetch("index.html?nv="+Date.now(),{cache:"no-store"})).text();const m=t.match(/app\.js\?v=(\d+)/);
      if(m&&m[1]!==myV&&!document.body.classList.contains("harrange")){if(location.hash.length>1)PENDV=1;else location.reload();}}catch(e){}};
  let PENDV=0;window.addEventListener("hashchange",()=>{if(PENDV&&location.hash.length<=1&&!document.body.classList.contains("harrange"))location.reload();});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)check();});setInterval(()=>{if(!document.hidden)check();},10*60000);setTimeout(check,15000);}

// Verkehr: aufklappbare Bereiche, Zustand merken, Anzahl im Titel
function openMap(){if(location.hash!=="#staus/karte"){MAPFOCUS=1;location.hash="staus/karte";route();}if(MAP)MAP.invalidateSize();}
function foldCount(){const c=$("fcnt-all");if(!c)return;let n=0;["tt","stau-list","traffic"].forEach(id=>{const el=$(id);if(el)n+=el.querySelectorAll(".jam,.li,details.abd").length;});c.textContent=n?String(n):"";}
// Verkehrslage: Staus der Autobahn GmbH, die TomTom an gleicher Stelle (< 3 km + Staulänge) schon meldet, nur einmal zeigen
function dedupVL(){const box=$("stau-list");if(!box)return;const T=(typeof TT!=="undefined"&&TT&&TT.list)?TT.list.filter(x=>(x.delay>0||x.cat===6)&&isFinite(x.lat)):[];
  box.querySelectorAll(".jam[data-lat]").forEach(el=>{const la=+el.dataset.lat,lo=+el.dataset.lon;const d=T.some(x=>{const L=+x.len||0;return distKm(x.lat,x.lon,la,lo)<3+(L>50?L/1000:L);});
    if(el.hidden!==d)el.hidden=d;});try{vlCount();}catch(e){}}
["tt","stau-list"].forEach(id=>{const el=$(id);if(el)new MutationObserver(()=>setTimeout(dedupVL,0)).observe(el,{childList:true});});
["tt","stau-list","traffic"].forEach(id=>{const el=$(id);if(!el)return;foldCount(id);new MutationObserver(()=>foldCount(id)).observe(el,{childList:true,subtree:true});});

/* Verkehrslage: Kategorie-Knöpfe statt langer Liste */
const VLN={stau:"Staus",unfall:"Unfälle oder Behinderungen",sperr:"Sperrungen",bau:"Baustellen",event:"Veranstaltungen",next:"neuen Meldungen in den nächsten 7 Tagen"};
let VLK=load("vl_k");if(!VLK||VLK==="karte"||VLK==="meld")VLK="stau";
const vlVis=el=>!el.closest("[hidden]")&&!!el.closest("#vl-merged");
function vlFacts(){const f=$("vl-facts");if(!f)return;if(typeof TT==="undefined"||!TT){f.innerHTML="";return;}
  const j=TT.jams||[];const len=j.reduce((t,x)=>t+(x.len||0),0),mx=j.length?Math.max(0,...j.map(x=>x.delay||0)):0;
  f.innerHTML=j.length?'<span>Staulänge gesamt <b>'+fmt(len,1)+' km</b></span><span>größte Verzögerung <b>+'+mx+' min</b></span>':'<span>Keine Staus im Umkreis</span>';}
function vlCount(){const body=$("vl-body");if(!body)return;vlFacts();
  document.querySelectorAll("#vl-cat [data-vl]").forEach(b=>{const k=b.dataset.vl,n=b.querySelector(".n");if(!n)return;
    let c;if(k==="next"||k==="event"){const d=$("mapcity-dus");const on=!!(d&&!d.hidden);b.hidden=!on;if(!on&&VLK===k)setTimeout(()=>setVL("stau"),0);c=on?$(k==="event"?"vt-events":"vt-next").querySelectorAll(".li").length:0;}
    else c=[...body.querySelectorAll('[data-kat~="'+k+'"]')].filter(vlVis).length;
    n.textContent=c?String(c):"";b.classList.toggle("none",!c);});
  const em=$("vl-empty");if(!em)return;
  if(VLK==="karte"||VLK==="next"||VLK==="event"){em.hidden=true;if(VLK==="next"||VLK==="event"){const d=$("mapcity-dus");em.hidden=!!(d&&!d.hidden);em.textContent="Städtische Meldungen gibt es nur für Düsseldorf. Für "+(C.name||"diesen Ort")+" stehen Staus, Sperrungen und Baustellen in den anderen Knöpfen.";if(!em.hidden)em.style.display="block";else em.style.display="";}else em.style.display="";return;}
  em.style.display="";const has=[...body.querySelectorAll('[data-kat~="'+VLK+'"]')].some(vlVis);em.hidden=has;em.textContent="Derzeit keine "+VLN[VLK]+" gemeldet.";}
function setVL(k){VLK=VLN[k]?k:"stau";store("vl_k",VLK);const body=$("vl-body");if(!body)return;
  body.dataset.k=VLK;body.classList.toggle("flt",VLK!=="karte"&&VLK!=="next"&&VLK!=="event");
  {const nb=document.querySelector('#vt-seg [data-vts="now"]');if(nb&&!nb.classList.contains("on"))nb.click();}
  document.querySelectorAll("#vl-cat [data-vl]").forEach(b=>b.classList.toggle("on",b.dataset.vl===VLK));
  vlMapFilter();vlCount();try{vlMerge();}catch(e){}}
// Karte: Meldungen der gewählten Kategorie kräftig, die übrigen blass
function vlMapFilter(){if(typeof MAP==="undefined"||!MAP)return;const k=VLK;
  const apply=g=>g&&g.eachLayer(l=>{const kt=l.options&&l.options.kat;if(!kt||!l.setStyle)return;const on=k==="next"||k==="event"||kt===k;
    if(l.options._op==null){l.options._op=l.options.opacity;l.options._fop=l.options.fillOpacity;}
    l.setStyle({opacity:on?l.options._op:.12,fillOpacity:on?l.options._fop:.1});if(on&&l.bringToFront)l.bringToFront();});
  apply(MAP._ttinc);apply(typeof MAPLAYER!=="undefined"?MAPLAYER:null);}
document.addEventListener("click",e=>{const b=e.target.closest("#vl-cat [data-vl]");if(!b)return;e.preventDefault();setVL(b.dataset.vl);
  const c=$("vl-cat");if(c&&c.getBoundingClientRect().top<0)c.scrollIntoView({block:"start"});});
/* Eintrag in einer Liste antippen: zur Karte wechseln und Stelle zeigen */
let VLRING=null,VLBACK=null;

// ================= Verkehrslage: alle Quellen in einer Liste, nach Entfernung, ohne Doppelungen =================
// Zuverlässigste Quelle gewinnt: Staus → TomTom (gemessen) vor Autobahn GmbH; sonst Verkehrszentrale (amtlich) vor Autobahn GmbH vor TomTom
const VMSRC=[["vt-now","Stadt"],["traffic","Autobahn"],["roadworks","Autobahn"],["stau-list","Autobahn"],["tt","TomTom"],["sd-list","TomTom"]];
const VMPRIO={stau:["TomTom","Autobahn","Stadt"],other:["Stadt","Autobahn","TomTom"]};
let VMT=0;
function vlMerge(){const box=$("vl-merged");if(!box)return;
  const ref=isFinite(C.lat)?[C.lat,C.lon]:null;
  const all=[];VMSRC.forEach(([id,q])=>{const c=$(id);if(!c)return;c.querySelectorAll("[data-kat][data-lat]").forEach(el=>{if(el.hidden)return;
    const la=+el.dataset.lat,lo=+el.dataset.lon;if(!isFinite(la)||!isFinite(lo))return;const k=(el.dataset.kat||"").split(/\s+/)[0];
    all.push({el,q,k,la,lo,km:ref?distKm(ref[0],ref[1],la,lo):0});});});
  // Doppelungen: gleiche Art, < 300 m auseinander → nur die zuverlässigere Quelle
  const rank=x=>(VMPRIO[x.k==="stau"?"stau":"other"]).indexOf(x.q);
  all.sort((a,b)=>rank(a)-rank(b));const keep=[];
  all.forEach(x=>{if(keep.some(y=>y.k===x.k&&distKm(y.la,y.lo,x.la,x.lo)<0.3))return;keep.push(x);});
  keep.sort((a,b)=>a.km-b.km);
  const vk=typeof VLK!=="undefined"?VLK:"stau";const cnt=a=>a.filter(x=>(" "+x.el.dataset.kat+" ").includes(" "+vk+" ")).length;
  const row=x=>{const c=x.el.cloneNode(true);c.removeAttribute("id");c.querySelectorAll("[id]").forEach(n=>n.removeAttribute("id"));c.classList.add("vm");/* eigene Entfernungsangaben der Quelle entfernen (widersprechen der neuen) */
    const tw=document.createTreeWalker(c,NodeFilter.SHOW_TEXT);let tn;while(tn=tw.nextNode()){tn.textContent=tn.textContent.replace(/\s*·?\s*[\d.,]+\s*km\s+(vom Zentrum|von meiner Adresse|von (meinem|deinem|Ihrem) Standort|von hier|entfernt|von [A-ZÄÖÜ][\wäöüß()\-]*(?:\s[A-ZÄÖÜ(][\wäöüß()\-]*)?(?=\s·|$))/gi,"");}
    const m=document.createElement("div");m.className="vmeta";m.innerHTML='<span class="vd">📍 '+fmt(x.km,1).replace(".",",")+' km</span><span class="vq">'+x.q+'</span>';c.append(m);return c;};
  const near=keep.filter(x=>x.km<=3),mid=keep.filter(x=>x.km>3&&x.km<=10),far=keep.filter(x=>x.km>10);
  const wasOpen=!!box.querySelector(".vm-far.open");
  box.innerHTML="";
  const grp=(t,arr,cls)=>{if(!arr.length)return;const g=document.createElement("div");g.className="vm-grp "+(cls||"");
    if(cls==="vm-far"){const b=document.createElement("button");b.type="button";b.className="vm-far-btn";b.textContent=t+" ("+cnt(arr)+")";g.append(b);if(wasOpen)g.classList.add("open");}
    else{const hh=document.createElement("div");hh.className="vm-gh";hh.innerHTML=t+' <span class="n">'+cnt(arr)+'</span>';g.append(hh);}
    const it=document.createElement("div");it.className="list vm-items";arr.forEach(x=>it.append(row(x)));g.append(it);box.append(g);};
  grp("In deiner Nähe · bis 3 km",near);grp("Im Umkreis · 3 bis 10 km",mid);grp("Weiter entfernt · über 10 km",far,"vm-far");
  if(!keep.length)box.innerHTML='<div class="state">wird geladen …</div>';
  else if(vk!=="karte"&&VLN[vk]&&!cnt(near)&&!cnt(mid)){const st=document.createElement("div");st.className="vm-empty";st.textContent="Bis 10 km keine "+VLN[vk]+" gemeldet.";box.prepend(st);}
  const hd=$("vl-all-h");if(hd)hd.innerHTML='Meldungen rund um '+esc(C.short||C.name||"")+' <span class="muted small">· nach Entfernung · jede Meldung nur einmal</span>';
  box.querySelectorAll(".vm-grp").forEach(g=>{g.classList.toggle("vm-none",!cnt([...g.querySelectorAll(".vm")].map(el=>({el}))));});
  try{vlCount();}catch(e){}}
document.addEventListener("click",e=>{const b=e.target.closest(".vm-far-btn");if(b){b.parentNode.classList.toggle("open");}});
VMSRC.forEach(([id])=>{const el=$(id);if(el)new MutationObserver(()=>{clearTimeout(VMT);VMT=setTimeout(vlMerge,150);}).observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden"]});});
document.addEventListener("click",e=>{const it=e.target.closest("#vl-body [data-kat][data-lat]");if(!it||e.target.closest("a,summary,details"))return;
  const la=+it.dataset.lat,lo=+it.dataset.lon;if(!isFinite(la)||!isFinite(lo))return;e.stopImmediatePropagation();e.preventDefault();
  if(typeof MAP==="undefined"||!MAP)return;VLBACK=it;
  const el=$("stau-map");window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-12,behavior:"smooth"});
  setTimeout(()=>{MAP.invalidateSize();MAP.setView([la,lo],14,{animate:true});
    if(VLRING)VLRING.remove();VLRING=L.circleMarker([la,lo],{radius:22,color:"#0b6e8a",weight:4,fill:false,className:"vlring"}).addTo(MAP);
    const t=it.querySelector(".t"),d=it.querySelector(".d");
    const tx=t?[...t.childNodes].map(n=>n.textContent.trim()).filter(Boolean).join(" · "):"";
    L.popup({maxWidth:300}).setLatLng([la,lo]).setContent('<b>'+esc(tx)+'</b>'+(d?"<br>"+esc(d.innerText.replace(" · in Karte zeigen ›","")):"")+'<br><a href="#" class="vlback">↓ zurück zur Liste</a>').openOn(MAP);},250);},true);
document.addEventListener("click",e=>{if(!e.target.closest(".vlback"))return;e.preventDefault();if(VLBACK&&VLBACK.isConnected)VLBACK.scrollIntoView({behavior:"smooth",block:"center"});});
{let vlT=0;const mo=new MutationObserver(()=>{clearTimeout(vlT);vlT=setTimeout(vlCount,250);});const b=$("vl-body");if(b){mo.observe(b,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden"]});setVL(VLK);}}


// ================= Lage-Mail (v375): ein Tipp öffnet die Mail-App mit der aktuellen Lage =================
/* Texte in Großbuchstaben (CSS uppercase) würden aus „ß“ ein „SS“ machen – dort das große ẞ einsetzen */
function fixSharpS(){try{document.querySelectorAll("label,th,small,.lbl,.stop-grp,.badge,.chip,.kicker,h3,h4").forEach(e=>{if(getComputedStyle(e).textTransform!=="uppercase")return;
  for(const n of e.childNodes)if(n.nodeType===3&&n.textContent.includes("ß"))n.textContent=n.textContent.replace(/ß/g,"ẞ");});}catch(e){}}
setTimeout(fixSharpS,1500);addEventListener("hashchange",()=>setTimeout(fixSharpS,600));
/* Versionsnummer der geladenen App: Name des aktiven Offline-Speichers (lagebild-vNNN), sonst aus sw.js */
let APPV="";(async()=>{try{const k=(await caches.keys()).map(x=>(x.match(/^lagebild-v(\d+)$/)||[])[1]).filter(Boolean).map(Number);if(k.length)APPV="v"+Math.max(...k);}catch(e){}
  if(!APPV){try{const t=await (await fetch("sw.js",{cache:"no-store"})).text();const m=t.match(/lagebild-v(\d+)/);if(m)APPV="v"+m[1];}catch(e){}}
  if(APPV){const um=document.querySelector("#upd-mini > span");if(um&&!um.querySelector(".appv"))um.insertAdjacentHTML("beforeend",' · <span class="appv">'+APPV+'</span>');
    const ft=document.querySelector(".ft-min");if(ft)ft.textContent="© Thomas Hußmann · "+APPV;}})();
const noPic0=s=>String(s||"").replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}️‍⃣]/gu,"").replace(/\s+/g," ").trim();
var BL_LAST=null;
/* Programm der Düsseldorfer Spielstätten (ohne Fortuna/DEG/BVB) für Kachel „Events Kultur“ und Lage-Mail */
let EVDUS=null;async function evDus(){if(EVDUS)return EVDUS;try{EVDUS=((await getData("events-dus.json")).data||[]).filter(r=>!r.team&&r.name&&r.start);}catch(e){EVDUS=[];}return EVDUS;}
function evNext(days,max){const td=isoDay(new Date()),end=isoDay(new Date(Date.now()+days*864e5)),now=Date.now();
  return (EVDUS||[]).filter(r=>{const d=String(r.start).slice(0,10);if(d<td||d>end)return false;return String(r.start).length<16||new Date(r.start).getTime()>now-36e5;})
    .sort((a,b)=>String(a.start).localeCompare(String(b.start))).filter((r,i,a)=>a.findIndex(x=>x.name===r.name&&String(x.start).slice(0,10)===String(r.start).slice(0,10))===i).slice(0,max);}
setTimeout(()=>evDus(),3000);
/* Messen (Messe Düsseldorf u. a.) aus dem Datensammler, falls vorhanden */
let MESSE_LAST=null;async function messeLoad(){if(MESSE_LAST)return MESSE_LAST;try{MESSE_LAST=((await getData("messen.json")).data||[]);}catch(e){MESSE_LAST=[];}return MESSE_LAST;}
/* Störungen Bus & Bahn (VRR-Meldungen) – nur deine Linien bzw. Datteln/Recklinghausen */
let STOER_LAST=null;async function stoerLoad(){if(STOER_LAST)return STOER_LAST;try{STOER_LAST=((await getData("stoerungen.json")).data||[]);}catch(e){STOER_LAST=[];}return STOER_LAST;}
const STOER_RX=/^(U75|U78|U79|U80)$/i;
/* nur echte Einschränkungen auf deinen Linien (keine Werbung, keine fremden Busse); kurze Überschrift + Zeitfenster */
const STOER_KEY=/busse statt|ersatz|umleitung|ausfall|ausfälle|störung|sperrung|gesperrt|verspät|bauarbeiten|baumaßnahme|fahrleitung|unfall|einschränk|verlegt|entfällt|nicht bedient|nicht angefahren|kein(e)? (bahn|fahrten)|umsteigen/i;
function stoerMine(){const now=Date.now();return (STOER_LAST||[]).filter(x=>(!x.from||new Date(x.from).getTime()<=now)&&x.lines.some(l=>STOER_RX.test(l))&&STOER_KEY.test(x.title+" "+x.subtitle+" "+x.text))
  .map(x=>{const raw=(x.subtitle||x.title).replace(/^(Straßenbahnlinie|Linie|U\d+)\s*\d*\s*:\s*/i,"").replace(/\s+auf der (Linie )?U\d+$/i,"").trim();
    const w=(x.text.match(/zwischen \d{1,2}(?:[.:]\d{2})? und \d{1,2}(?:[.:]\d{2})? Uhr/i)||[])[0]||"";
    return {...x,head:raw.length>70?raw.slice(0,68)+" …":raw,when:w?w.replace(/^zwischen /i,"").replace(" und ","–"):""};})
  .sort((a,b)=>(a.planned-b.planned)||String(a.to||"9").localeCompare(String(b.to||"9")));}
/* Großlagen an einem Tag: Messen, Arena/PSD Bank Dome/Mitsubishi Electric Halle, Heimspiele Fortuna und DEG */
function grossLagen(day){const out=[];const big=/arena|dome|mitsubishi|messe\b|iss\s*dome/i;
  (MESSE_LAST||[]).forEach(m=>{if(/messe d(ü|ue)sseldorf/i.test(m.place||"")&&m.start<=day&&(m.end||m.start)>=day)out.push({t:"",title:m.name,where:m.place||"Messe Düsseldorf",kind:"Messe"});});
  (EVDUS||[]).forEach(e=>{if(String(e.start).slice(0,10)===day&&big.test(e.venue||""))out.push({t:String(e.start).length>=16?String(e.start).slice(11,16):"",title:noPic0(e.name),where:e.venue});});
  (SP.f95||[]).forEach(x=>{if(x.day===day&&x.home)out.push({t:x.time,title:"Fortuna – "+x.opp+(x.lg?" ("+x.lg+")":""),where:"Merkur Spiel-Arena"});});
  (SP.deg||[]).forEach(x=>{if(x.day===day&&x.home)out.push({t:x.time,title:"DEG – "+x.opp,where:"PSD Bank Dome"});});
  const seen=new Set();return out.filter(x=>{const k=x.title.toLowerCase().slice(0,30)+x.t;if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>(a.t||"00").localeCompare(b.t||"00"));}
/* Wetter-Hinweise für die nächsten 48 Stunden (nur wenn relevant) */
function wxHints(){const w=WX&&WX[C.wxIdx];if(!w||!w.daily)return[];const d=w.daily,H=[];
  for(let i=0;i<3;i++){if(d.temperature_2m_max[i]==null)continue;const tag=i===0?"heute":i===1?"morgen":new Date(d.time[i]+"T12:00:00").toLocaleDateString("de-DE",{weekday:"long"});
    const g=d.wind_gusts_10m_max[i],c=d.weather_code[i],tmin=d.temperature_2m_min[i],pr=d.precipitation_sum[i]||0;
    if(c>=95)H.push("Gewitter möglich "+tag);
    if(g>=75)H.push("Schwere Sturmböen bis "+fmt(g)+" km/h "+tag);else if(g>=60)H.push("Sturmböen bis "+fmt(g)+" km/h "+tag);
    if(tmin<=1&&(pr>=.3||[56,57,66,67,71,73,75,77,85,86].includes(c)))H.push(([71,73,75,77,85,86].includes(c)?"Schnee und Glätte ":"Glättegefahr ")+tag+" (Tiefstwert "+fmt(tmin)+" °C)");}
  return H;}
function lageText(){
  /* Reiner Text ohne Piktogramme, luftig gegliedert: Abschnitt = Trennlinie, Überschrift, Leerzeile, Einträge */
  const noPic=s=>String(s||"").replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u2190-\u21FF\u2B00-\u2BFF️‍⃣]/gu,"").replace(/\s+/g," ").replace(/\s+([,.:])/g,"$1").replace(/^[\s·–-]+|[\s·–-]+$/g,"").trim();
  const T=el=>el?noPic(el.textContent):"";
  const cap=w=>w.charAt(0)+w.slice(1).toLowerCase();
  const short=t=>noPic(String(t||"").replace(/^Amtliche (UNWETTER)?WARNUNG vor /i,"").replace(/^Amtliche /i,"")).replace(/\b[A-ZÄÖÜ]{3,}\b/g,cap).replace(/^./,c=>c.replace(/ß/g,"ẞ").toUpperCase());
  const now=new Date(),dt={timeZone:"Europe/Berlin"};
  const LINE="————————————————————";
  const L=[],H=t=>{L.push("",LINE,t.replace(/ß/g,"ẞ").toUpperCase(),"");};
  L.push("Lagebild Thomas Hußmann","",
    now.toLocaleDateString("de-DE",{...dt,weekday:"long",day:"numeric",month:"long",year:"numeric"})+", "+hhmm(now)+" Uhr",
    "Ort: "+String(C.name).replace(/ · /g,", "));
  const B="• ";const dshort=x=>new Date(x).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"});
  // ---- Daten sammeln ----
  let nW=0,nL=0;const WL=[];
  favPlaces().forEach(p=>{const a=FAV_ALARM[p.key];if(a)nL++;if(a&&a.n)nW+=a.n;
    WL.push([p.name,!a?"noch nicht geladen":a.n?[...new Set((a.all&&a.all.length?a.all:[a.title]).map(short))].join(", "):"keine"]);});
  if(!FAVKEYS.includes(C.key)&&LOCAL_ALARM.n>0){nW+=LOCAL_ALARM.n;WL.push([C.town,[...new Set((LOCAL_ALARM.all.length?LOCAL_ALARM.all:[LOCAL_ALARM.title]).map(short))].join(", ")]);}
  const td0=isoDay(new Date()),tm0=isoDay(new Date(Date.now()+864e5));const GL=[[td0,"Heute"],[tm0,"Morgen"]].map(([d,n])=>[n,grossLagen(d)]);
  /* Großlagen kompakt: Messen in eine Zeile, Rest je eine Zeile mit Uhrzeit */
  const glLines=l=>{const ms=l.filter(x=>x.kind==="Messe").map(x=>x.title),ot=l.filter(x=>x.kind!=="Messe");
    return [...(ms.length?[B+"Messe: "+ms.join(", ")]:[]),...ot.map(x=>B+(x.t?x.t+" Uhr – ":"")+x.title.replace(/\s*\((.*)\)$/,", $1")+(x.where?" ("+x.where+")":""))];};
  const ST=stoerMine();const WH=wxHints();
  const rt=[...document.querySelectorAll("#prio .route")];
  const route=r=>{const g=s=>T(r.querySelector(s));const to=g(".rt").replace(/^→\s*/,"");const st=g(".rv");const parts=g(".rs").replace(/ \(davon \+(\d+) min Stau\)/," (davon $1 min Stau)").split(" · ").map(x=>x.trim()).filter(Boolean);
    const via=(parts.find(x=>/^über /.test(x))||"").replace(/^über /,"");const time=parts.find(x=>/\d+\s*(h|min)\b/.test(x)&&!/Baustelle/.test(x))||"";
    const rest=parts.filter(x=>x!==time&&!/^über /.test(x));const stau=(time.match(/davon (\d+) min Stau/)||[])[1];
    const unav=/nicht verfügbar|nicht abrufbar|berechnet|Kontingent/.test(st)||!time;
    return {to,unav,ok:/frei/i.test(st),st,line1:B+to+": "+(unav?"Fahrzeit gerade nicht abrufbar":time.replace(/\s*\(davon.*\)/,"")+(via?" über "+via:"")),
      line2:unav?"":[/frei/i.test(st)?"freie Fahrt":st,...(stau&&+stau>0?[stau+" min Stau"]:[]),...rest].join(" · ")};};
  const RT=rt.map(route);
  // ---- AUF EINEN BLICK ----
  H("Auf einen Blick");
  {const wu=[...new Set(WL.filter(w=>w[1]!=="keine"&&w[1]!=="noch nicht geladen").flatMap(w=>w[1].split(", ")))];
    L.push(B+(nW?"Warnungen: "+nW+" – "+wu.slice(0,3).join(", "):"Keine Warnungen"));
    GL.forEach(([n,l])=>{if(!l.length)return;const ms=l.filter(x=>x.kind==="Messe").map(x=>x.title),ot=l.filter(x=>x.kind!=="Messe").map(x=>x.title.replace(/\s*\(.*\)$/,"")+(x.t?" ("+x.t+")":""));
      L.push(B+n+": "+[...(ms.length?[ms.join(" + ")]:[]),...ot].join(", "));});
    if(RT.length){const bad=RT.filter(r=>!r.unav&&!r.ok);L.push(B+"Verkehr: "+(RT.every(r=>r.unav)?"Fahrzeiten gerade nicht abrufbar":bad.length?bad.map(r=>r.st+" Richtung "+r.to).join(", "):"alle Strecken frei"));}
    const sU=ST.filter(x=>!x.planned);if(ST.length)L.push(B+"Bus & Bahn: "+[...new Set(ST.slice(0,3).map(x=>x.lines.filter(l=>STOER_RX.test(l)).join("/")+" "+x.head))].join(", "));
    if(WH.length)L.push(B+"Wetter: "+WH[0]+(WH.length>1?" u. a.":""));}
  // ---- WARNUNGEN ----
  H("Warnungen");WL.forEach(([n,t])=>L.push(B+n+": "+t));
  // ---- GROSSLAGEN ----
  if(GL.some(([,l])=>l.length)){H("Großveranstaltungen Düsseldorf");let first=true;GL.forEach(([n,l])=>{if(!l.length)return;if(!first)L.push("");first=false;
      const gl=glLines(l);L.push(n.replace(/ß/g,"ẞ").toUpperCase()+(gl.length>1?" – "+gl.length+" Großveranstaltungen gleichzeitig":""),...gl);});}
  // ---- STÖRUNGEN BUS & BAHN ----
  if(ST.length){H("Bus & Bahn – deine Linien");ST.slice(0,5).forEach((x,i)=>{if(i)L.push("");
      L.push(B+x.lines.filter(l=>STOER_RX.test(l)).join(", ")+": "+x.head);const d=[];if(x.when)d.push(x.when);if(x.to)d.push("bis "+dshort(x.to));if(d.length)L.push(d.join(" · "));});
    if(ST.length>5)L.push("","Weitere "+(ST.length-5)+" Meldungen: rheinbahn.de");}
  // ---- WETTER ----
  H("Wetter "+C.town);
  try{const w=WX&&WX[C.wxIdx];if(!w)throw 0;const c=w.current,d=w.daily;
    L.push(B+"Jetzt: "+fmt(c.temperature_2m,1)+" °C, "+wmo(c.weather_code)[0].toLowerCase()+", Böen "+fmt(c.wind_gusts_10m)+" km/h");
    [["Heute",0],["Morgen",1]].forEach(([n,i])=>{if(d.temperature_2m_max[i]==null)return;
      L.push(B+n+": "+wmo(d.weather_code[i])[0]+", "+fmt(d.temperature_2m_min[i])+" bis "+fmt(d.temperature_2m_max[i])+" °C",
        "Regen "+fmt(d.precipitation_probability_max[i])+" %"+(d.precipitation_sum[i]>=.5?" ("+fmt(d.precipitation_sum[i],1)+" mm)":"")+" · Böen bis "+fmt(d.wind_gusts_10m_max[i])+" km/h");});
    if(WH.length){L.push("","Achtung:");WH.forEach(h=>L.push(B+h));}
  }catch(e){const k=$("k-temp"),v=T(k&&k.querySelector(".val"));L.push(v&&v!=="–"?B+v+", "+T(k.querySelector(".note")):"noch nicht geladen");}
  // ---- MEINE STRECKEN ----
  {const h=$("prio-h");H(h&&T(h)?T(h).replace(/\s*·.*$/,""):"Reise und Verkehr");
    if(RT.length)RT.forEach((r,n)=>{if(n)L.push("");L.push(r.line1);if(r.line2)L.push(r.line2);});
    else{const k=$("k-traffic");L.push(k?(T(k.querySelector(".val"))+", "+T(k.querySelector(".note"))):"noch nicht geladen");}}
  // ---- POLIZEI & FEUERWEHR ----
  if(BL_LAST&&BL_LAST.key===C.key){const td=new Date().toLocaleDateString("sv-SE",dt),day=x=>new Date(x.date).toLocaleDateString("sv-SE",dt);
    const l=BL_LAST.list;H("Polizei und Feuerwehr "+BL_LAST.town);
    L.push(l.filter(x=>day(x)===td).length+" Meldungen heute","");
    l.slice(0,4).forEach((x,i)=>{if(i)L.push("");L.push(B+(day(x)===td?"Heute":new Date(x.date).toLocaleDateString("de-DE",{...dt,day:"2-digit",month:"2-digit"}))+", "+hhmm(x.date)+" Uhr",
      noPic(String(x.title||"").replace(/^(POL|FW)[-\w ]*:\s*/,"")));});}
  // ---- SPORT ----
  H("Events Sport");
  if(!status.fb)L.push("Spielplan wird noch geladen");
  else [...FB.slice(0,1),{k:"deg",name:"Düsseldorfer EG"},...FB.slice(1)].forEach((f,fi)=>{const l=(SP[f.k]||[]);if(fi)L.push("");L.push(f.name.replace(/ß/g,"ẞ").toUpperCase());
    if(!l.length){L.push("kein anstehendes Spiel im Spielplan");return;}
    const wd=d=>new Date(d+"T12:00:00").toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"}).replace(/\.,/,".");
    l.slice(0,3).forEach(x=>L.push(B+wd(x.day)+(x.time?", "+x.time+" Uhr":"")+" – "+(x.home?"Heim gegen ":"Auswärts bei ")+x.opp+(x.lg&&!/^(3\. Liga|Bundesliga|DEL2?)$/.test(x.lg)?" ("+x.lg+")":"")));});
  // ---- KULTUR ----
  {const ev=evNext(2,10);if(ev.length){H("Events Kultur Düsseldorf");let last="";
    ev.forEach(r=>{const d=String(r.start).slice(0,10);if(d!==last){if(last)L.push("");L.push(new Date(d+"T12:00:00").toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"2-digit"}).replace(/ß/g,"ẞ").toUpperCase());last=d;}
      L.push(B+(String(r.start).length>=16&&!r.allDay?String(r.start).slice(11,16)+" Uhr – ":"")+noPic(r.name)+(r.venue?" ("+noPic(r.venue)+")":""));});}}
  // ---- PEGEL ----
  {const k=$("k-rhein");const rv=k&&!k.hidden?T(k.querySelector(".val")):"";const lp=(LP_LAST||[]).slice().sort((a,b)=>["Düssel","Anger","Itter"].indexOf(a.water)-["Düssel","Anger","Itter"].indexOf(b.water));
    if((rv&&rv!=="–")||lp.length){H("Pegel");
      if(rv&&rv!=="–"){const nt=T(k.querySelector(".note")).replace(/\s*·\s*$/,"");L.push(B+T(k.querySelector(".lbl")).replace(/^Pegel Düsseldorf$/,"Rhein Düsseldorf")+": "+rv+(nt&&nt!=="wird geladen"?", "+nt.replace(/ · /g,", "):""));}
      lp.forEach(x=>{const t=levelText(x.value,{MNW:x.mnw,MW:x.mw,MHW:x.mhw,I:x.i1,II:x.i2,III:x.i3},x.unit);
        L.push(B+x.water+" ("+String(x.name||"").replace(/_\d+$/,"")+"): "+fmt(x.value,x.value<100?1:0)+" "+(x.unit||"cm")+", "+t.st);});}}
  // ---- LUFT nur bei schlechten Werten ----
  {const k=$("k-aq");const v=k&&!k.hidden?T(k.querySelector(".val")):"";if(parseInt(v,10)>=60){H("Luftqualität");L.push(B+v+" – "+T(k.querySelector(".note")).replace(/\s*·\s*$/,"").replace(/ · /g,", "));}}
  L.push("",LINE,"","Live im Dashboard:",location.origin+location.pathname,"","© Thomas Hußmann");
  return {subject:"Lage "+now.toLocaleDateString("de-DE",{...dt,day:"2-digit",month:"2-digit"})+", "+hhmm(now)+" Uhr"+(nW?" – "+nW+(nW===1?" Warnung":" Warnungen"):nL===favPlaces().length?" – keine Warnungen":""),
    /* Schlussfilter: keine Piktogramme/Emojis in der Mail (© bleibt) */
    body:L.map(l=>String(l).replace(/(?!©)[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D\u20E3]/gu,"").replace(/[ \t]{2,}/g," ").replace(/^ +| +$/g,"")).join("\n")};}
function lageMailUrl(){const {subject,body}=lageText();const to=(load("lagemail_to")||"").split(/[,;\s]+/).filter(Boolean).map(encodeURIComponent).join(",");
  let b=body;if(b.length>6000)b=b.slice(0,6000)+"\n…";
  return "mailto:"+to+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(b.replace(/\n/g,"\r\n"));}
/* Tipp = Mail kommt direkt ins Postfach (Versand über ntfy.sh, ohne Mail-App). Ohne hinterlegte Adresse einmal nachfragen.
   Klappt der Versand nicht, öffnet sich ersatzweise die Mail-App mit fertigem Text. */
const okMail=v=>!!v&&v.split(/[,;\s]+/).filter(Boolean).every(x=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));
function cutBytes(s,max){const enc=new TextEncoder();if(enc.encode(s).length<=max)return s;while(enc.encode(s+"\n…").length>max)s=s.slice(0,-40);return s+"\n…";}
/* Versand (v382): ntfy.sh nimmt keine anonymen Mails an. Auf iPhone/iPad/Mac übernimmt deshalb der Kurzbefehl „Lage-Mail“
   den Versand ohne Rückfrage (Aktion „E-Mail senden“, „Verfassen anzeigen“ aus). Sonst bzw. auf Wunsch: Mail-App mit fertigem Text. */
/* Erst senden, wenn die Lage vollständig ist (Warnungen aller Orte, Wetter, alle Fahrzeiten, Spielplan).
   Fehlt noch etwas: Knopf zeigt „Lädt …“, danach „Jetzt senden“ – zweiter Tipp verschickt (iOS öffnet den Kurzbefehl nur direkt nach einem Tipp). */
function lageMissing(){const m=[];
  if(favPlaces().some(p=>!FAV_ALARM[p.key]))m.push("Warnungen");
  if(!(WX&&WX[C.wxIdx]))m.push("Wetter");
  if(TTKEY&&typeof RS!=="undefined"&&RS.city&&rsDirs().some(x=>!(RS.data[x[0]]&&(RS.data[x[0]].alts||RS.data[x[0]].err))))m.push("Fahrzeiten");
  if(!status.fb)m.push("Spielplan");
  if(typeof EVDUS!=="undefined"&&!EVDUS)m.push("Veranstaltungen");
  if(!LP_LAST)m.push("Pegel");
  if(!MESSE_LAST)m.push("Messen");
  if(!STOER_LAST)m.push("Störungen");
  return m;}
let LM_WAIT=0;
function lageSend(btn){const mode=load("lagemail_mode")||(IOS||/Mac/.test(navigator.platform)?"kb":"mail");const lbl=btn.querySelector(".qa-ml");
  btn.classList.remove("ready","busy");
  if(mode==="kb"){const {subject,body}=lageText();
    location.href="shortcuts://run-shortcut?name="+encodeURIComponent("Lage-Mail")+"&input=text&text="+encodeURIComponent(subject+"\n"+body);
    lbl.textContent="Gestartet ✓";btn.classList.add("sent");setTimeout(()=>{lbl.textContent="Lage-Mail";btn.classList.remove("sent");},4000);return;}
  lbl.textContent="Lage-Mail";location.href=lageMailUrl();}
function sendLageMail(btn){const lbl=btn.querySelector(".qa-ml");
  if(btn.classList.contains("ready")||!lageMissing().length){clearInterval(LM_WAIT);lageSend(btn);return;}
  if(btn.classList.contains("busy"))return;
  btn.classList.add("busy");lbl.textContent="Lage wird geladen …";
  try{if(TTKEY&&typeof loadReise==="function")loadReise(false);}catch(e){}
  try{if(typeof evDus==="function"&&!EVDUS)evDus().catch(()=>{});}catch(e){}
  try{if(!LP_LAST)lpLoad();}catch(e){}
  try{if(!MESSE_LAST)messeLoad();}catch(e){}
  try{if(!STOER_LAST)stoerLoad();}catch(e){}
  const t0=Date.now();clearInterval(LM_WAIT);
  LM_WAIT=setInterval(()=>{const miss=lageMissing();if(miss.length&&Date.now()-t0<30000){lbl.textContent="Lädt: "+miss[0]+" …";return;}
    clearInterval(LM_WAIT);btn.classList.remove("busy");btn.classList.add("ready");lbl.textContent="Jetzt senden";},700);}
{const m=$("qa-mail");if(m)m.addEventListener("click",e=>{e.preventDefault();sendLageMail(m);});}
{const s=$("lm-mode");if(s){s.value=load("lagemail_mode")||(IOS||/Mac/.test(navigator.platform)?"kb":"mail");s.addEventListener("change",()=>store("lagemail_mode",s.value));}}
{const i=$("lm-to");if(i)i.value=load("lagemail_to")||"";
  const b=$("lm-save");if(b)b.addEventListener("click",()=>{const v=$("lm-to").value.trim();const bad=v&&v.split(/[,;\s]+/).filter(Boolean).some(x=>!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));const msg=$("lm-msg");
    if(bad){msg.textContent="Bitte gültige Mail-Adresse(n) eintragen.";msg.style.color="var(--bad)";return;}
    store("lagemail_to",v||null);msg.textContent=v?"Gespeichert ✓":"Gelöscht.";msg.style.color="";});}
})();


/* Aktiven Reiter oben sichtbar mittig halten (einzeilige iOS-Leiste) */
function vtopCenter(){document.querySelectorAll(".vtop .subtabs").forEach(b=>{const a=b.querySelector("a.on");if(a&&b.scrollWidth>b.clientWidth)b.scrollLeft=a.offsetLeft-(b.clientWidth-a.offsetWidth)/2;});}
addEventListener("hashchange",()=>setTimeout(vtopCenter,60));addEventListener("load",()=>setTimeout(vtopCenter,300));


// Scrollposition in Unteransichten merken (iOS lädt die Seite nach App-Wechsel oft neu)
{const K="lb_scroll";let t=0;addEventListener("scroll",()=>{clearTimeout(t);t=setTimeout(()=>{try{if(location.hash.length>1)sessionStorage.setItem(K,JSON.stringify({h:location.hash,y:Math.round(scrollY),at:Date.now()}));}catch(e){}},250);},{passive:true});
 try{const o=JSON.parse(sessionStorage.getItem(K)||"null");if(o&&o.h===location.hash&&o.y>0&&Date.now()-o.at<6*3600e3){let n=0,stop=0;addEventListener("touchstart",()=>stop=1,{once:true,passive:true});addEventListener("wheel",()=>stop=1,{once:true,passive:true});const go=()=>{if(stop)return;if(scrollY<o.y-40&&document.body.scrollHeight>o.y+innerHeight*.5)scrollTo(0,o.y);if(++n<8)setTimeout(go,500);};setTimeout(go,700);}}catch(e){}}
