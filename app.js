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
  geo:{name:"Ortssuche",prov:"Open-Meteo Geocoding",url:"https://open-meteo.com/en/docs/geocoding-api",ep:"geocoding-api.open-meteo.com/v1/search"}
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
async function getJSON(url,ms=15000){
  const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),ms);
  try{const r=await fetch(url,{signal:ctl.signal,headers:{Accept:"application/json"}});
    if(!r.ok)throw new Error("HTTP "+r.status);
    return JSON.parse(await r.text());}
  finally{clearTimeout(t)}
}
function errText(e){
  const m=String(e&&e.message||e);
  if(/Failed to fetch|NetworkError|Load failed|blocked|access control/i.test(m))return "nicht erreichbar oder vom Browser blockiert (CORS)";
  if(/abort/i.test(m))return "Zeitüberschreitung";
  if(/JSON/i.test(m))return "unerwartetes Datenformat";
  return m;
}
const FAVKEYS=["dus","datteln","alpen","salzhausen"];
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
function setKpi(id,val,note,cls){const el=$(id);if(!el)return;["s-ok","s-warn","s-bad","s-crit","s-info"].forEach(c=>el.classList.remove(c));el.classList.add(cls?"s-"+cls:"s-info");
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
let STOPS=load("stops")||{};let DIRF=load("dirf")||{};let STOPIDX=null,EFADATA=null;
if(STOPS.dus==="Düsseldorf Heinrich-Heine-Allee"){delete STOPS.dus;store("stops",STOPS);}
let ABSEL=load("absel")||{};   // Autobahn-Auswahl je eigenem Ort
let TK=load("tk")||"";
let WINDY=load("windy")||"";let HOMES=load("homes")||{};
const TTKEY_DEFAULT="RSDptU00A2TYdT3fwL1oTHnKl6XOEf51";let TTKEY=load("tomtom")||TTKEY_DEFAULT;
const ROUTES_DEFAULT="A52 Essen; A40 Duisburg; A57 Nimwegen; A2 Hannover";
// Strecken je Ort; die bisherige Liste gilt für Düsseldorf
if(load("routes")!=null&&load("routes_dus")==null)store("routes_dus",load("routes"));
const routesFor=k=>load("routes_"+k)??(k==="dus"?ROUTES_DEFAULT:"");
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
function renderAlarm(){
  const list=favPlaces().filter(p=>FAV_ALARM[p.key]&&FAV_ALARM[p.key].n>0).map(p=>({...FAV_ALARM[p.key],key:p.key,sel:p.sel}));
  if(!FAVKEYS.includes(C.key)&&LOCAL_ALARM.n>0)list.unshift({n:LOCAL_ALARM.n,title:LOCAL_ALARM.title,name:C.town,key:C.key,sel:sel});
  ALARM_SIG=list.map(x=>x.key+":"+(x.all&&x.all.length?x.all:[x.title]).slice().sort().join("|")).sort().join("#");
  const seen=list.length&&load("alarm_seen")===ALARM_SIG;
  document.body.classList.toggle("alarm",list.length>0&&!seen);document.body.classList.toggle("alarm-seen",!!seen);
  const b=$("alarmbar");b.hidden=!list.length;b.classList.toggle("seen",!!seen);
  b.innerHTML=list.length?'<span class="ab-h">⚠ Warnung'+(list.reduce((s,x)=>s+x.n,0)>1?"en":"")+'</span>'+list.map(x=>'<button type="button" class="ab-c" data-sel="'+esc(x.sel)+'"><b>'+esc(x.name)+'</b> '+esc(x.title)+(x.n>1?' <small>(+'+(x.n-1)+' weitere)</small>':'')+' ›</button>').join("")+(seen?'<span class="ab-s">gesehen ✓ – blinkt wieder bei neuer Warnung</span>':'<button type="button" class="ab-ok" data-ack="1">Gesehen ✓</button>'):"";
  // Kachel: Summe über alle Lieblingsstädte, je Stadt eine Zeile
  if(list.length){const tot=list.reduce((t,x)=>t+x.n,0);
    const el=$("k-warn");setKpi("k-warn",String(tot)+"<small> "+(tot===1?"Warnung":"Warnungen")+"</small>","","bad");
    const short=t=>String(t||"").replace(/^Amtliche (UNWETTER)?WARNUNG vor /i,"").replace(/^Amtliche /i,"");
    el.querySelector(".note").innerHTML=list.map(x=>'<span class="wl"><b>'+esc(x.name)+(x.n>1?" ("+x.n+")":"")+':</b> '+esc(short(x.title))+'</span>').join("");}
  document.querySelectorAll("#favs .fav").forEach(f=>f.classList.toggle("alarm-on",!!(FAV_ALARM[f.dataset.fav]&&FAV_ALARM[f.dataset.fav].n)));
}
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
    $("alarm-btn").textContent="⏰ Wecker"+(l.length?" ("+hm(l[0].at)+")":"");
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
  $("alarm-btn").addEventListener("click",()=>{const d=new Date(Date.now()+30*60000);$("al-time").value=d.toTimeString().slice(0,5);$("al-date").value=d.toLocaleDateString("sv-SE");$("al-msg").textContent="";render();dlg.showModal();});
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
const RADIO_SITE={wdr2:"https://www1.wdr.de/radio/wdr2/",wdr4:"https://www1.wdr.de/radio/wdr4/",antenne:"https://www.antenneduesseldorf.de/"};
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
$("radio-audio").addEventListener("error",()=>document.querySelectorAll("#radio .rbtn").forEach(x=>x.classList.remove("on","load")));
// Schnellwahl der Lieblingsstädte im Kopf
function buildFavs(){
  const dusSub=C.isDus?(C.short||""):"Oberkassel / Heerdt";
  const items=[["dus","Düsseldorf",dusSub],...FAVS.map(f=>[f.key,f.name,""])];
  setTimeout(renderAlarm,0);
  $("favs").innerHTML=items.map(([k,n,sub])=>'<button type="button" class="fav'+(C.key===k?" on":"")+'" data-fav="'+k+'">'+esc(n)+(sub?' <small>'+esc(sub)+'</small>':'')+'</button>').join("");
}
$("favs").addEventListener("click",e=>{const b=e.target.closest("[data-fav]");if(!b)return;const k=b.dataset.fav;
  if(k==="dus"){if(!C.isDus)choose("dus-4");}else if(C.key!==k)choose("p-"+k);});
selEl.addEventListener("change",()=>{
  if(selEl.value==="__add"){selEl.value=sel;location.hash="einstellungen";setTimeout(()=>$("place-q").focus(),300);return;}
  choose(selEl.value);
});
function choose(v,scroll){
  const before=C.key;sel=v;store("sel",v);C=ctx();selEl.value=v;
  applyPlaceUi();
  if(before===C.key&&C.isDus){renderWeather();renderAir();renderParking();renderBike();loadFuel();}
  else{WX=null;AQ=null;OBS=null;BIKE=null;clearPlaceViews();refreshAll(true);}
  if(scroll)window.scrollTo({top:0,behavior:"smooth"});
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
  {const fav=C.isDus||C.key==="datteln";GROUPS.mobil[0][1]="Deutsche Bahn";GROUPS.mobil[1][1]=C.isDus?"Rheinbahn":"Nahverkehr";
    $("bahn").querySelector("h2").textContent=fav?"Bahn-Verbindungen":"Bahn-Verbindung suchen";
    $("trip-from").value="";$("trip-to").value="";$("trip-from").placeholder=fav?"z. B. Düsseldorf-Heerdt":"Startbahnhof oder Adresse";$("trip-to").placeholder="Zielbahnhof oder Adresse";
    if(!fav)setKpi("k-bahn","Suche<small> Bahn</small>","Verbindung suchen · Abfahrten vor Ort","info");}
  $("app-title").textContent="Lagebild Thomas Hußmann";
  $("wx-h").innerHTML="Wetter <strong>"+esc(C.name)+"</strong>";
  if(typeof route==="function")route();
  document.title="Lagebild Thomas Hußmann · "+C.town;
  $("warn-title").textContent="Warnungen für "+C.town+(C.isDus?"":" · "+(C.detail||""));
  $("gmaps").href=gmapsUrl();
  $("stau-title").textContent="Verkehrslage rund um "+C.town;
  $("ab-list").textContent=(C.ab.length?C.ab.join(" · "):"keine Autobahnen gewählt")+" · Umkreis "+JAM_RADIUS_KM+" km";
  $("rhein-sec").textContent=C.isDus?"Rhein & Grundwasser":"Gewässer";
  $("efa-card").hidden=!C.efaDefault;
  $("stop").value=STOPS[C.key]||C.efaDefault||"";STOPIDX=null;
  $("stop-lbl").textContent="Haltestelle für Abfahrten in "+C.town;
  $("home-lbl").textContent="Meine Adresse in "+C.town;$("home-addr").value=(HOMES[C.key]||{}).q||"";
  $("stop").disabled=!C.efaDefault;
  renderMine();
}

// ================= Einstellungen & Ortssuche =================
$("tk").value=TK;$("windy").value=WINDY;
$("tomtom").value=TTKEY===TTKEY_DEFAULT?"":TTKEY;
$("home-save").addEventListener("click",async()=>{const q=$("home-addr").value.trim();const key=C.key;
  if(!q){delete HOMES[key];store("homes",HOMES);$("home-hint").textContent="Adresse entfernt.";loadTomTom();return;}
  $("home-hint").textContent="Adresse wird gesucht …";
  try{const r=await getJSON("https://api.tomtom.com/search/2/geocode/"+encodeURIComponent(q)+".json?limit=1&countrySet=DE&language=de-DE&key="+encodeURIComponent(TTKEY));
    const x=(r.results||[])[0];if(!x)throw new Error("nicht gefunden");
    HOMES[key]={q,label:x.address.freeformAddress,lat:x.position.lat,lon:x.position.lon};store("homes",HOMES);
    $("home-hint").textContent="✓ Gefunden: "+x.address.freeformAddress;loadTomTom();}
  catch(e){$("home-hint").textContent="Adresse nicht gefunden – bitte mit Ort eingeben ("+errText(e)+").";}});$("tomtom").placeholder="fest hinterlegt – nur bei Bedarf eigenen eintragen";
$("tomtom-save").addEventListener("click",async()=>{TTKEY=$("tomtom").value.trim()||TTKEY_DEFAULT;store("tomtom",TTKEY===TTKEY_DEFAULT?null:TTKEY);
  
  $("tomtom-hint").textContent="Schlüssel wird geprüft …";
  try{const r=await fetch("https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point="+C.center.lat+","+C.center.lon+"&key="+encodeURIComponent(TTKEY));
    $("tomtom-hint").textContent=r.ok?"✓ Schlüssel funktioniert – Verkehrslage ist aktiv.":"Schlüssel wird nicht akzeptiert (Fehler "+r.status+"). Bitte prüfen.";}
  catch(e){$("tomtom-hint").textContent="Prüfung nicht möglich: "+e.message;}
  ensureMap();loadTomTom();});
$("windy-save").addEventListener("click",()=>{WINDY=$("windy").value.trim();store("windy",WINDY);loadWindy();});$("theme").value=theme;
$("stop-save").addEventListener("click",()=>{const v=$("stop").value.trim();if(!v||!C.efaDefault)return;STOPS[C.key]=v;store("stops",STOPS);loadEFA();
  const m=stopMatch(v);$("stop-hint").innerHTML=m.file?"Übernommen – Abfahrten werden angezeigt.":m.id?"Diese Haltestelle wird noch nicht automatisch abgerufen. Live-Abfahrten öffnen sich über den Link in der Bus-Ansicht; sag Claude Bescheid, dann wird sie fest ergänzt.":"Haltestelle nicht im Verzeichnis gefunden – bitte aus der Vorschlagsliste wählen.";});
$("efa-dir").addEventListener("input",()=>{DIRF[C.key]=$("efa-dir").value;store("dirf",DIRF);renderEFA();});
$("efa-stops").addEventListener("click",e=>{const d=e.target.closest("[data-bdir]");if(d){store("busdir_"+C.key,+d.dataset.bdir);renderEFA();return;}const b=e.target.closest("[data-stop]");if(!b)return;STOPS[C.key]=b.dataset.stop;store("stops",STOPS);$("stop").value=b.dataset.stop;loadEFA();});
$("stop").addEventListener("keydown",e=>{if(e.key==="Enter")$("stop-save").click();});
$("routes-save").addEventListener("click",()=>{ROUTES_TXT=$("routes").value.trim();store("routes_"+C.key,ROUTES_TXT);ROUTES=parseRoutes(ROUTES_TXT);loadAutobahn();});
$("routes").addEventListener("keydown",e=>{if(e.key==="Enter")$("routes-save").click();});
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
function renderWeather(){
  $("wx-place").textContent=C.name+(C.detail?" · "+C.detail:"");
  if(!WX||!WX[C.wxIdx]){if(status.wx&&!status.wx.ok)$("wx-now").innerHTML=stateBox("Wetterdaten nicht verfügbar – "+status.wx.msg);return;}
  const w=WX[C.wxIdx],c=w.current,[txt,ic]=wmo(c.weather_code),day=w.daily;
  setKpi("k-temp",icon(ic)+" "+fmt(c.temperature_2m,1)+"<small> °C</small>",txt+" · Böen "+fmt(c.wind_gusts_10m)+" km/h",bft(c.wind_gusts_10m)>=9?"bad":bft(c.wind_gusts_10m)>=7?"warn":"info");
  setKpi("k-wx",icon(ic)+" <span style='font-size:21px'>"+esc(txt)+"</span>","Regenrisiko heute "+fmt(day.precipitation_probability_max[0])+" %");
  const g=c.wind_gusts_10m,bf=bft(g);
  setKpi("k-wind",fmt(c.wind_speed_10m)+"<small> / "+fmt(g)+" km/h</small>","aus "+windDir(c.wind_direction_10m)+" · Böen Bft "+bf,bf>=9?"bad":bf>=7?"warn":"ok");
  let obs="";
  if(OBS&&OBS.w){const o=OBS.w;
    obs='<div class="muted small">Gemessen an der DWD-Station '+esc(OBS.src&&OBS.src.station_name||"")+': <b style="color:var(--fg)">'+fmt(o.temperature,1)+' °C</b>, '+esc(o.condition||"")+', Wind '+fmt(o.wind_speed_10||o.wind_speed_30||o.wind_speed_60)+' km/h · '+hhmm(o.timestamp)+' Uhr</div>';}
  $("wx-now").innerHTML='<div class="row">'+icon(ic,"lg")+'<div><div class="big">'+fmt(c.temperature_2m,1)+'°</div><div class="muted">'+esc(txt)+' · gefühlt '+fmt(c.apparent_temperature,1)+'°</div></div>'+
   '<div class="muted" style="margin-left:auto;text-align:right">Heute<br><b style="color:var(--fg);font-size:18px">'+fmt(day.temperature_2m_min[0])+'° / '+fmt(day.temperature_2m_max[0])+'°</b></div></div>'+
   '<div class="facts">'+fact(fmt(c.relative_humidity_2m)+" %","Luftfeuchte")+fact(fmt(c.pressure_msl)+" hPa","Luftdruck")+fact(fmt(c.cloud_cover)+" %","Bewölkung")+
   fact(fmt(c.wind_speed_10m)+" km/h "+windDir(c.wind_direction_10m),"Wind")+fact(fmt(g)+" km/h (Bft "+bf+")","Böen")+fact(fmt(day.uv_index_max[0],1),"UV-Index max.")+
   fact(fmt(day.precipitation_sum[0],1)+" mm","Regen heute")+fact(fmt(c.precipitation,1)+" mm","Regen jetzt")+'</div>'+obs+
   '<div class="muted mono">Modellstand '+hhmm(c.time*1000)+' Uhr</div>';
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
  const W=640,H=200,pl=34,pr=10,pt=16,pb=28,iw=W-pl-pr,ih=H-pt-pb;
  let mn=Math.floor(Math.min(...T))-1,mx=Math.ceil(Math.max(...T))+1;if(mx-mn<4){mx+=2;mn-=2;}
  const x=i=>pl+(i+.5)*iw/T.length,y=v=>pt+ih-(v-mn)/(mx-mn)*ih,bw=iw/T.length*.7;
  let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Temperatur und Regenrisiko der nächsten 24 Stunden">';
  const step=Math.max(1,Math.round((mx-mn)/4));
  for(let v=Math.ceil(mn);v<=mx;v+=step){s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)" stroke-width="1"/><text x="'+(pl-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+v+'°</text>';}
  P.forEach((p,i)=>{if(p>0){const bh=p/100*ih;s+='<rect x="'+(x(i)-bw/2)+'" y="'+(pt+ih-bh)+'" width="'+bw+'" height="'+bh+'" fill="var(--accent)" opacity=".22" rx="1.5"><title>'+hhmm(L[i]*1000)+': '+p+' % Regenrisiko</title></rect>';}});
  let d="",a="M"+x(0)+" "+(pt+ih);T.forEach((t,i)=>{d+=(i?"L":"M")+x(i).toFixed(1)+" "+y(t).toFixed(1);a+="L"+x(i).toFixed(1)+" "+y(t).toFixed(1);});
  a+="L"+x(T.length-1)+" "+(pt+ih)+"Z";
  s+='<path d="'+a+'" fill="var(--accent)" opacity=".08"/><path d="'+d+'" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round"/>';
  T.forEach((t,i)=>{if(i%3===0){s+='<text x="'+x(i)+'" y="'+(H-8)+'" text-anchor="middle">'+hhmm(L[i]*1000)+'</text><text x="'+x(i)+'" y="'+(y(t)-8)+'" text-anchor="middle" style="fill:var(--fg);font-weight:600">'+Math.round(t)+'°</text>';}});
  s+='<circle cx="'+x(0)+'" cy="'+y(T[0])+'" r="4" fill="var(--accent)" stroke="var(--panel)" stroke-width="2"/>';
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
  setKpi("k-aq",fmt(c.european_aqi)+"<small> EAQI</small>",q.t+" · "+C.short,q.c);
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
    $("k-rhein-lbl").textContent="Pegel "+sName;
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
    $("pegel").innerHTML=html;setStatus("pegel",true);
  }catch(e){setStatus("pegel",false,errText(e));$("pegel").innerHTML=stateBox("Pegel nicht verfügbar – "+errText(e)+".",link("https://www.pegelonline.wsv.de/gast/start","PEGELONLINE"));setKpi("k-rhein","–","kein Pegel","info");}
}
async function loadLandespegel(){
  const card=$("lp-card");card.hidden=!C.isDus;if(!C.isDus)return;
  try{const d=await getData("landespegel.json");const l=(d.data||[]).filter(x=>x.value!=null).sort((a,b)=>["Düssel","Anger","Itter"].indexOf(a.water)-["Düssel","Anger","Itter"].indexOf(b.water));
    if(!l.length)throw new Error("keine Messwerte");
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
  const parts=[["pr","odd-pr.json"],["bh","odd-bh.json"],["aed","odd-aed.json"],["wc","odd-wc.json"],["rad","odd-rad.json"],["blitz","odd-blitz.json"]];
  let ok=0;
  await Promise.all(parts.map(async([k,f])=>{try{PARK[k]=(await getData(f)).data;ok++;}catch(e){}}));
  setStatus("park",ok>0,ok?(ok<parts.length?"teilweise":""):"Daten fehlen");
  renderParking();
}
function renderParking(){
  if(!C.isDus)return;
  const near=(list,n,max)=>(list||[]).map(p=>({...p,km:distKm(C.lat,C.lon,p.lat,p.lon)})).filter(p=>!max||p.km<=max).sort((x,y)=>x.km-y.km).slice(0,n);
  const route=p=>' · <a href="https://maps.apple.com/?daddr='+p.lat+','+p.lon+'" target="_blank" rel="noopener">Route</a>';
  const box=(id,list,label,n,max)=>{
    if(!list){$(id).innerHTML=stateBox(label+" nicht verfügbar.");return;}
    const s=near(list,n||5,max);
    if(!s.length){$(id).innerHTML=stateBox("Keine Einträge in der Nähe.");return;}
    $(id).innerHTML='<div class="list">'+s.map(p=>'<div class="li"><span class="tag alt">'+fmt(p.km,1)+' km</span><div class="t">'+esc(p.name||p.addr||label)+'</div><div class="r"></div><div class="d">'+esc([p.name?p.addr:"",p.info].filter(Boolean).join(" · "))+route(p)+'</div></div>').join("")+'</div>';
  };
  box("park-pr",PARK.pr,"P+R-Anlagen",6);box("park-bh",PARK.bh,"Behindertenparkplätze",6);
  box("svc-aed",PARK.aed,"Defibrillator",4);box("svc-wc",PARK.wc,"Toilette",4);box("svc-rad",PARK.rad,"Radstation",3);box("svc-blitz",PARK.blitz,"Messstelle",4,5);
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
  if(!C.isDus)return;
  if(!GARAGES){$("park-ph").innerHTML=stateBox("Parkhaus-Belegung nicht verfügbar.",link("https://vtmanager.duesseldorf.de/info/?parkquartier#main","Verkehrszentrale"));return;}
  const s=GARAGES.map(p=>({...p,km:distKm(C.lat,C.lon,p.lat,p.lon)})).sort((a,b)=>a.km-b.km).slice(0,8);
  {const g=s.find(p=>p.status===1&&p.kurzparkermax&&p.kurzparkerbelegt!=null);if(g){TILE_PARTS.traffic.park=fmt(Math.max(0,g.kurzparkermax-g.kurzparkerbelegt))+" frei im Parkhaus "+(g.bezeichnung||g.name);composeTile("k-traffic","traffic");}if(false)setKpi("k-park",fmt(Math.max(0,g.kurzparkermax-g.kurzparkerbelegt))+"<small> frei</small>",(g.bezeichnung||g.name)+" · "+fmt(g.km,1)+" km",(g.kurzparkerbelegt/g.kurzparkermax)>=.95?"bad":"ok");}
  const tr=t=>t>0?"↑":t<0?"↓":"";
  $("park-ph").innerHTML='<div class="list">'+s.map(p=>{const max=p.kurzparkermax,used=p.kurzparkerbelegt,free=(max!=null&&used!=null)?Math.max(0,max-used):null;
    const q=max&&used!=null?used/max:null;const cls=q==null||p.status!==1?"":q>=.95?"bad":q>=.8?"warn":"ok";
    return '<div class="li"><span class="tag alt">'+fmt(p.km,1)+' km</span><div class="t">'+esc(p.bezeichnung||p.name)+'</div>'+
      '<div class="r">'+(free!=null&&p.status===1?'<span class="pill p-'+cls+'"><i></i>'+fmt(free)+' frei '+tr(p.tendenz)+'</span>':'<span class="muted small">keine Belegung</span>')+'</div>'+
      '<div class="d">'+esc(p.vti_anschrift||"")+(max?" · "+fmt(max)+" Plätze":"")+(p.durchfahrtshoehe?" · Höhe "+fmt(p.durchfahrtshoehe,2)+" m":"")+' · <a href="https://maps.apple.com/?daddr='+p.lat+','+p.lon+'" target="_blank" rel="noopener">Route</a></div></div>';}).join("")+'</div>';
}

// ================= Stadtverkehr Düsseldorf (Verkehrszentrale) =================
const VT="https://vtmanager.duesseldorf.de/geoserverwfs?service=WFS&version=1.1.0&request=GetFeature&outputFormat=application/json&srsName=EPSG:4326&typeName=";
async function loadVT(){
  if(!C.isDus)return;
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
    const item=(x,badge)=>'<div class="li"><span class="tag '+(x.kind==="Sperrung"?"ab":"alt")+'">'+esc(badge||x.kind)+'</span><div class="t">'+esc(x.short||x.name)+'</div><div class="r"></div>'+
      '<div class="d">'+esc(range(x))+(x.text?'<details><summary>Details</summary>'+esc(x.text)+'</details>':'')+'</div></div>';
    const nSp=active.filter(x=>x.kind==="Sperrung").length;
    TILE_PARTS.traffic.vt=nSp+" Sperrungen in der Stadt";composeTile("k-traffic","traffic");
    if(false)setKpi("k-vt",String(nSp)+"<small> Sperrungen</small>",ev.length?ev.length+" Veranstaltung(en) angekündigt":"keine Veranstaltungen",nSp>30?"warn":"info");
    $("vt-sum").innerHTML=fact(String(nSp),"Sperrungen aktiv")+fact(String(active.length-nSp),"Meldungen / Baustellen")+fact(String(ev.length),"Veranstaltungen angekündigt")+fact(String(soon.length),"neu in 7 Tagen");
    $("vt-now").innerHTML=active.length?'<div class="list">'+active.slice(0,15).map(x=>item(x)).join("")+'</div>'+(active.length>15?'<div class="muted small">+ '+(active.length-15)+' weitere</div>':''):'<div class="state good">Keine aktiven Sperrungen.</div>';
    $("vt-events").innerHTML=ev.length?'<div class="list">'+ev.slice(0,8).map(x=>item(x,"Event")).join("")+'</div>':'<div class="state good">Keine angekündigten Veranstaltungen.</div>';
    $("vt-next").innerHTML=soon.length?'<div class="list">'+soon.slice(0,8).map(x=>item(x)).join("")+'</div>':'<div class="state good">Nichts Neues angekündigt.</div>';
    setStatus("vt",true);drawVTOnMap();
  }catch(e){setStatus("vt",false,errText(e));["vt-now","vt-events","vt-next"].forEach(id=>$(id).innerHTML=stateBox("Nicht verfügbar – "+errText(e)+".",link("https://vtmanager.duesseldorf.de/info/","Verkehrszentrale")));}
}
let VTGEO=null,VTLAYER=null;
function drawVTOnMap(){
  if(!MAP||typeof L==="undefined")return;
  if(VTLAYER){VTLAYER.remove();VTLAYER=null;}
  if(!C.isDus||!VTGEO)return;
  VTLAYER=L.layerGroup().addTo(MAP);
  VTGEO.active.filter(x=>x.kind==="Sperrung"&&x.geo).forEach(x=>L.geoJSON(x.geo,{style:{color:"#7d1f6b",weight:5,opacity:.85,dashArray:"6 4"}}).bindPopup("<b>Sperrung</b><br>"+esc(x.short||x.name)).addTo(VTLAYER));
  VTGEO.ev.filter(x=>x.geo).forEach(x=>L.geoJSON(x.geo,{style:{color:"#0b6e8a",weight:5,opacity:.8}}).bindPopup("<b>Veranstaltung</b><br>"+esc(x.short||x.name)+"<br>"+dateTime(x.from)).addTo(VTLAYER));
}

// ================= Polizei & Feuerwehr =================
async function loadEinsaetze(){
  const card=$("einsaetze-card");card.hidden=C.key!=="datteln";if(card.hidden)return;
  try{const d=await getData("einsaetze-kreis-re.json");const all=d.data.rows||[];
    const here=all.filter(x=>/datteln/i.test(x.ort)),other=all.filter(x=>!/datteln/i.test(x.ort));
    const tbl=(rows)=>'<div class="ein-list">'+rows.map(x=>'<div class="ein'+(x.laufend?" run":"")+'"><div class="z"><b>'+esc(x.time.slice(0,5))+'</b><div class="muted small">'+esc(x.date.slice(0,6))+'</div></div><div class="s">'+esc(x.stichwort)+'</div>'+
      (x.laufend?'<span class="pill p-bad"><i></i>läuft</span>':'<span class="pill p-ok"><i></i>beendet</span>')+'<div class="o">'+esc(x.ort)+(x.strasse?' · '+esc(x.strasse):'')+'</div></div>').join("")+'</div>';
    const running=here.filter(x=>x.laufend).length;
    setKpi("k-ein",String(here.length)+"<small> in Datteln</small>",here[0]?here[0].stichwort+" · "+here[0].date.slice(0,6):"keine Einsätze in Datteln",running?"bad":here.length?"warn":"ok");
    $("einsaetze").innerHTML='<div class="facts">'+fact(String(here.length),"Einsätze Datteln")+fact(String(running),"laufend in Datteln")+fact(String(all.length),"Einsätze im Kreis")+fact(esc(d.data.updated||"–"),"Stand Leitstelle")+'</div>'+
      '<div class="sublbl">Datteln</div>'+(here.length?tbl(here):'<div class="state good">Keine Einsätze in Datteln im angezeigten Zeitraum.</div>')+
      '<details style="margin-top:8px"><summary>Übrige Einsätze im Kreis Recklinghausen ('+other.length+')</summary>'+tbl(other)+'</details>'+
      '<div class="muted small">Kreisleitstelle Recklinghausen, ohne Rettungsdienst-Einsätze · abgerufen '+dataAge(d)+' · '+link("https://www.kreis-re.de/inhalte/buergerservice/leben_und_wohnen/feuerwehr-_und_rettungsleitstelle/_einsaetze_der_feuerwehren/index.asp","Originalliste")+'</div>';
    setStatus("einsaetze",true,"Stand "+dataAge(d));
  }catch(e){setStatus("einsaetze",false,errText(e));$("einsaetze").innerHTML=stateBox("Einsatzliste nicht verfügbar – "+errText(e)+".",link("https://www.kreis-re.de/inhalte/buergerservice/leben_und_wohnen/feuerwehr-_und_rettungsleitstelle/_einsaetze_der_feuerwehren/index.asp","Originalliste"));}
}
// Zusammengefasste Kacheln: Teilinformationen sammeln
const TILE_PARTS={traffic:{},mobil:{}};
function composeTile(id,group,main,cls){
  const parts=TILE_PARTS[group];const el=$(id);if(!el)return;
  if(main)parts._main=main;if(cls)parts._cls=cls;
  const ORD=["bahn","bus","ab","vt"];const notes=Object.entries(parts).filter(([k])=>!k.startsWith("_")).sort((a,b)=>(ORD.indexOf(a[0])+99)%199-(ORD.indexOf(b[0])+99)%199).map(([,v])=>v).filter(Boolean);
  setKpi(id,parts._main||"–",notes.join(" · "),parts._cls||"info");
}
// ================= Bahn-Verbindungen =================
const TRIP_KEYS={dus:["dus-re","re-dus"],datteln:["re-dus","dus-re"]};
async function loadTrips(){
  const keys=TRIP_KEYS[C.key]||[];const box=$("trips");
  if(!keys.length){box.innerHTML="";box.hidden=true;return;}
  box.hidden=false;
  try{const d=await getData("trips.json");const list=(d.data||[]).filter(t=>keys.includes(t.key)).sort((a,b)=>keys.indexOf(a.key)-keys.indexOf(b.key));
    const t2=x=>x?hhmm(x):"–";
    const del=(p,e)=>{if(!p||!e)return"";const m=Math.round((new Date(e)-new Date(p))/6e4);return m>0?' <span style="color:var(--bad);font-weight:600">+'+m+'</span>':"";};
    const now=Date.now()-60e3;
    {const first=k=>{const t=list.find(x=>x.key===k);const j=t&&(t.journeys||[]).find(j=>new Date(j.depEst||j.dep).getTime()>=now);return j;};
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
          '<span class="muted small">'+(dur!=null?Math.floor(dur/60)+":"+String(dur%60).padStart(2,"0")+" h":"")+' · '+j.changes+' Umst.'+(ride[0]&&ride[0].plat?' · ab Gl. '+esc(ride[0].plat):'')+'</span>'+
          (cancelled?'<span class="pill p-bad"><i></i>Ausfall</span>':risk?'<span class="pill p-warn"><i></i>Anschluss gefährdet</span>':'')+
          '<span class="lines">'+ride.map(l=>'<span class="tag" style="font-size:13px">'+esc(l.line)+'</span>').join(' › ')+'</span></summary>';
        const steps=ride.map((l,i)=>{
          const tr=i>0?transfers[i-1]:null;
          return (tr?'<div class="xfer'+(tr.risk?" bad":"")+'">Umstieg in <b>'+esc(tr.at)+'</b> · '+(tr.m>=0?tr.m+" min":"Anschluss verpasst")+(tr.fromPl||tr.toPl?' · von Gl. '+esc(tr.fromPl||"?")+' zu Gl. '+esc(tr.toPl||"?"):'')+(tr.risk?' · <b>knapp – bitte im DB Navigator prüfen</b>':'')+'</div>':'')+
            '<div class="leg'+(l.cancelled?" cx":"")+'"><div class="lg-head"><span class="tag">'+esc(l.line)+'</span>'+(l.dir?' <span class="muted small">Richtung '+esc(l.dir)+'</span>':'')+(l.cancelled?' <span class="pill p-bad"><i></i>fällt aus</span>':'')+'</div>'+
            '<div class="lg-row"><span>'+tm(l.dep,l.depEst)+'</span><span>'+esc(l.from)+'</span>'+plat(l.plat)+'</div>'+
            '<div class="lg-row"><span>'+tm(l.arr,l.arrEst)+'</span><span>'+esc(l.to)+'</span>'+plat(l.arrPlat)+'</div></div>';}).join("");
        return '<details class="trip'+(cancelled?" cx":risk?" warn":"")+'">'+summary+'<div class="trip-body">'+steps+'</div></details>';}).join("")+'</div>';}).join("")+
      '<div class="muted small">Antippen für Reiseverlauf mit Gleisen und Umstiegen · Echtzeit abgerufen '+dataAge(d)+'</div>';
    setStatus("trips",true,"Stand "+dataAge(d));
  }catch(e){setStatus("trips",false,errText(e));box.innerHTML=stateBox("Verbindungen nicht verfügbar – "+errText(e)+".",link("https://www.bahn.de/","bahn.de"));}
}
function tripQuery(){const f=$("trip-from").value.trim(),t=$("trip-to").value.trim();return {f,t};}
$("trip-form").addEventListener("submit",e=>{e.preventDefault();const {f,t}=tripQuery();if(!f){$("trip-from").focus();return;}if(!t){$("trip-to").focus();return;}
  window.open("https://www.bahn.de/buchung/fahrplan/suche#sts=true&so="+encodeURIComponent(f)+"&zo="+encodeURIComponent(t)+"&kl=2&r=13:16:KLASSENLOS:1&hd="+encodeURIComponent(new Date().toISOString().slice(0,19)),"_blank","noopener");});
$("trip-gm").addEventListener("click",()=>{const {f,t}=tripQuery();if(!f){$("trip-from").focus();return;}if(!t){$("trip-to").focus();return;}
  window.open("https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(f)+"&destination="+encodeURIComponent(t)+"&travelmode=transit","_blank","noopener");});

async function loadBlaulicht(){
  $("bl-title").textContent="Pressemitteilungen Polizei & Feuerwehr "+C.town;
  if(!FAVKEYS.includes(C.key)){$("bl").innerHTML=stateBox("Meldungen sind für Düsseldorf und die Favoriten hinterlegt. Für "+C.town+":",link("https://www.presseportal.de/blaulicht/r/"+encodeURIComponent(C.town),"Presseportal "+C.town));return;}
  try{const d=await getData("blaulicht-"+C.key+".json");const list=d.data||[];
    if(!list.length){$("bl").innerHTML='<div class="state good">Keine aktuellen Meldungen.</div>';setStatus("blaulicht",true);return;}
    const bday=x=>new Date(x).toLocaleDateString("sv-SE",{timeZone:"Europe/Berlin"});const td=bday(Date.now()),yd=bday(Date.now()-864e5);
    const day=list.filter(x=>bday(x.date)===td).length;
    const when=x=>{const d=bday(x.date);return (d===td?"heute":d===yd?"gestern":new Date(x.date).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}))+" "+hhmm(x.date);};
    setKpi("k-bl",String(day)+"<small> heute</small>",list[0]?"Neueste "+when(list[0])+": "+list[0].title.replace(/^(POL|FW)[-\w ]*:\s*/,"").slice(0,60):"",day?"warn":"info");
    const tag=s=>/feuerwehr|^fw/i.test(s)?["FW","bad"]:/polizei|^pol/i.test(s)?["POL","ab"]:["INFO","alt"];
    $("bl").innerHTML='<div class="list">'+list.slice(0,12).map(x=>{const t=tag(x.source+" "+x.title);
      return '<div class="li"><span class="tag '+(t[1]==="bad"?"":t[1])+'" style="'+(t[1]==="bad"?"background:var(--bad);color:#fff":"")+'">'+t[0]+'</span><a class="t" href="'+esc(safeUrl(x.link))+'" target="_blank" rel="noopener" style="color:var(--fg);text-decoration:none">'+esc(x.title.replace(/^(POL|FW)[-\w ]*:\s*/,""))+'</a>'+
        '<span class="r muted small">'+dateTime(x.date)+'</span><div class="d">'+esc(x.source)+' · '+esc(x.text.slice(0,220))+'</div></div>';}).join("")+'</div>'+
      '<div class="muted small">Offizielle Pressemeldungen · abgerufen '+dataAge(d)+' · '+link("https://www.presseportal.de/blaulicht/r/"+encodeURIComponent(C.isDus?"Düsseldorf":C.town),"alle Meldungen")+'</div>';
    setStatus("blaulicht",true,"Stand "+dataAge(d));
  }catch(e){setStatus("blaulicht",false,errText(e));$("bl").innerHTML=stateBox("Meldungen nicht verfügbar – "+errText(e)+".",link("https://www.presseportal.de/blaulicht/r/"+encodeURIComponent(C.town),"Presseportal"));}
}

// ================= Webcam-Seiten je Ort =================
// Webcams: img = direktes Kamerabild (nur https), sonst Link zur Webcam-Seite
const WEBCAM_LINKS={
  dus:[
    {t:"Blick vom ARAG-Tower",img:"https://www.arag.de/images/webcam/tower00006.jpg",u:"https://www.arag.de/images/webcam/tower00006.jpg"},
    {t:"Landtag NRW · Rheinufer",img:"https://www.landtag.nrw.de/web/WWW/webcam/mobotix1.jpg",u:"https://www.landtag.nrw.de/web/WWW/webcam/mobotix1.jpg"},
    {t:"Landtag NRW · Rheinknie",img:"https://www.landtag.nrw.de/web/WWW/webcam/mobotix4.jpg",u:"https://www.landtag.nrw.de/web/WWW/webcam/mobotix4.jpg"},
    {t:"Lausward · Blick Richtung Neuss",img:"https://www.swd-ag.de/webcam/blickvonderlausward2.jpg",u:"https://www.swd-ag.de/webcam/blickvonderlausward2.jpg"},
    {t:"Lausward · Blick zur Arena",img:"https://www.swd-ag.de/webcam/blickvonderlausward3.jpg",u:"https://www.swd-ag.de/webcam/blickvonderlausward3.jpg"},
    {t:"Burgplatz / Altstadt",live:["w5t15erd","fxmwsxp6"],u:"https://www.duesseldorf.de/webcams/burgplatz-1"},
    {t:"Rheinufer",live:["wx7j7ulr","hvasmdro"],u:"https://www.duesseldorf.de/webcams/rheinufer-1"},
    {t:"Stadt Düsseldorf · alle Webcams",u:"https://www.duesseldorf.de/webcams"},
    {t:"Alle Düsseldorfer Webcams",u:"https://mygermancity.com/duesseldorf-webcams"}],
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
  const lives=list.filter(x=>x.live),imgs=list.filter(x=>x.img),links=list.filter(x=>!x.img&&!x.live);const ts=Math.floor(Date.now()/300000);
  const host=u=>{try{return new URL(u).hostname.replace(/^www\./,"");}catch(e){return"";}};
  box.innerHTML=(lives.length?'<div class="sublbl">Livestreams der Stadt Düsseldorf – antippen zum Abspielen</div><div class="cams cams-l" style="margin-bottom:12px">'+lives.map((x,i)=>'<div class="cam live"><div class="lsbox" id="ls-'+i+'" data-i="'+i+'" style="background-image:url(https://player.livespotting.com/poster/'+x.live[1]+'.jpg?height=360)"><span class="ls-play">▶</span><span class="ls-badge">LIVE</span></div><span><b>'+esc(x.t)+'</b> · <a href="'+esc(x.u)+'" target="_blank" rel="noopener">duesseldorf.de ↗</a></span></div>').join("")+'</div>':'')+
    (imgs.length?'<div class="sublbl">Kamerabilder (aktualisieren sich alle paar Minuten)</div><div class="cams cams-l" style="margin-bottom:12px">'+imgs.map(x=>'<a class="cam" href="'+esc(x.u)+'" target="_blank" rel="noopener"><img loading="lazy" alt="Webcam '+esc(x.t)+'" src="'+esc(x.img)+'?t='+ts+'" onerror="this.closest(\'.cam\').classList.add(\'off\')"><span><b>'+esc(x.t)+'</b></span></a>').join("")+'</div>':'')+
    (links.length?'<div class="sublbl">'+(C.isDus?"Weitere Webcam-Seiten":"Webcams in der Umgebung (keine Kamera direkt im Ort)")+'</div><div class="cams cams-l" style="margin-bottom:10px">'+links.map(x=>'<a class="cam linkcam" href="'+esc(x.u)+'" target="_blank" rel="noopener"><div class="lc-box"><span class="lc-ic">📷</span><span class="lc-go">öffnen ↗</span></div><span><b>'+esc(x.t)+'</b><br><span class="muted small">'+esc(host(x.u))+'</span></span></a>').join("")+'</div>':'')||
    '<div class="state">Für '+esc(C.town)+' sind keine Webcams hinterlegt.</div>';
  box.querySelectorAll(".lsbox").forEach(el=>el.addEventListener("click",()=>playLive(el,lives[+el.dataset.i]),{once:true}));
  CAM_N.links=list.length;CAM_N.img=imgs.length+lives.length;camTile();
}
let LSLOAD=null;
function playLive(el,x){
  el.classList.add("loading");
  LSLOAD=LSLOAD||new Promise((res,rej)=>{const sc=document.createElement("script");sc.src="https://player.livespotting.com/player/clappr/latest/player.min.js";sc.onload=res;sc.onerror=rej;document.head.appendChild(sc);});
  LSLOAD.then(()=>{el.innerHTML="";el.style.backgroundImage="none";window.lsplayer.init(el.id,{player_id:x.live[0],livesource_id:x.live[1]});
    setTimeout(()=>{const p=el.querySelector(".player-poster");if(p)p.click();},400);el.classList.remove("loading");})
   .catch(()=>{el.classList.remove("loading");window.open(x.u,"_blank","noopener");});
}
// ================= Öffentliche Webcams (Windy) =================
async function loadWindy(){
  const box=$("webcams-public");
  if(!WINDY){box.innerHTML='<div class="muted small" style="margin-bottom:6px">Weitere öffentliche Webcams (Stadt, Rhein, Umgebung) nach Eintrag eines kostenlosen Windy-Schlüssels unter <a href="#einstellungen">Einstellungen</a>.</div>';setStatus("windy",false,"Schlüssel fehlt");return;}
  try{const r=await fetch("https://api.windy.com/webcams/api/v3/webcams?nearby="+C.center.lat+","+C.center.lon+","+(C.isDus?15:25)+"&include=images,urls,location&limit=12&lang=de",{headers:{"x-windy-api-key":WINDY}});
    if(!r.ok)throw new Error("HTTP "+r.status);const d=await r.json();const cams=d.webcams||[];
    box.innerHTML=cams.length?'<div class="sublbl">Öffentliche Webcams</div><div class="cams" style="margin-bottom:10px">'+cams.map(c=>{const img=c.images&&(c.images.current&&(c.images.current.preview||c.images.current.thumbnail));const url=c.urls&&(c.urls.detail||c.urls.provider);
      return '<a class="cam" href="'+esc(safeUrl(url))+'" target="_blank" rel="noopener"><img loading="lazy" alt="Webcam '+esc(c.title)+'" src="'+esc(safeUrl(img))+'"><span>'+esc(c.title)+'</span></a>';}).join("")+'</div>':'<div class="muted small">Keine öffentlichen Webcams im Umkreis gefunden.</div>';CAM_N.pub=cams.length;camTile();
    setStatus("windy",true);
  }catch(e){setStatus("windy",false,errText(e));box.innerHTML=stateBox("Öffentliche Webcams nicht verfügbar – "+errText(e)+".");}
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
  const box=$("tt");try{ensureMap();}catch(e){}
  if(!TTKEY){box.innerHTML='<div class="state">Für Staus auch auf Land- und Stadtstraßen (Echtzeit wie bei Google Maps) unter <a href="#einstellungen">Einstellungen</a> den kostenlosen TomTom-Schlüssel eintragen.</div>';return;}
  const la=C.center.lat,lo=C.center.lon,mb=mapBounds(),bbox=[mb[1],mb[0],mb[3],mb[2]].map(x=>x.toFixed(4)).join(",");
  const fields="{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description},startTime,endTime,from,to,length,delay,roadNumbers}}}";
  try{const res=await fetch("https://api.tomtom.com/traffic/services/5/incidentDetails?key="+encodeURIComponent(TTKEY)+"&bbox="+bbox+"&language=de-DE&timeValidityFilter=present&fields="+encodeURIComponent(fields));
    if(!res.ok)throw new Error(res.status===403?"Traffic-Freigabe für den Schlüssel fehlt noch (bei TomTom „Traffic API“ aktivieren)":res.status===401?"Schlüssel ungültig":"HTTP "+res.status);
    const d=await res.json();
    const CAT={0:"Unbekannt",1:"Unfall",2:"Nebel",3:"Gefahr",4:"Regen",5:"Glätte",6:"Stau",7:"Fahrstreifen gesperrt",8:"Straße gesperrt",9:"Baustelle",10:"Wind",11:"Überflutung",14:"Liegengebliebenes Fahrzeug"};
    const list=(d.incidents||[]).map(i=>{const p=i.properties||{};const c=(i.geometry&&i.geometry.coordinates)||[];const pt=Array.isArray(c[0])?c[Math.floor(c.length/2)]:c;
      return {geo:i.geometry,cat:p.iconCategory,mag:p.magnitudeOfDelay||0,delay:p.delay?Math.round(p.delay/60):null,len:p.length?p.length/1000:null,from:p.from,to:p.to,road:(p.roadNumbers||[]).join(", "),desc:((p.events||[])[0]||{}).description||CAT[p.iconCategory]||"",lat:pt&&pt[1],lon:pt&&pt[0],km:pt?distKm(la,lo,pt[1],pt[0]):99};})
      .filter(x=>x.delay>0||x.cat===1||x.cat===8||((x.cat===6||x.cat===7)&&x.mag>=2)).map(x=>{const H=HOMES[C.key];x.home=H&&isFinite(x.lat)?distKm(H.lat,H.lon,x.lat,x.lon):null;x.grp=/(^|, )A\d/.test(x.road)?0:x.home!=null&&x.home<=3?1:2;return x;})
      .sort((a,b)=>a.grp-b.grp||(a.grp===1?a.home-b.home:0)||(b.delay||0)-(a.delay||0)||b.mag-a.mag||a.km-b.km);
    if(MAP){if(!MAP._ttinc)MAP._ttinc=L.layerGroup();MAP._ttinc.clearLayers();
      const col=x=>x.cat===8?"#7d1f6b":x.mag>=4?"#8b0000":x.mag>=3||x.delay>=10?"#d62d20":x.mag>=2||x.delay>=3?"#f08a00":"#f3c623";
      list.slice().reverse().forEach(x=>{const g=x.geo;if(!g)return;const pop='<b>'+esc(x.road||"Straße")+' · '+esc(x.desc||"")+'</b><br>'+esc([x.from,x.to].filter(Boolean).join(" → "))+(x.delay?'<br><b>+'+x.delay+' min</b>':'')+(x.len?' · '+fmt(x.len,1)+' km':'');
        if(g.type==="LineString"&&g.coordinates.length>1){const ll=g.coordinates.map(c=>[c[1],c[0]]);L.polyline(ll,{color:"#fff",weight:9,opacity:.85,interactive:false}).addTo(MAP._ttinc);L.polyline(ll,{color:col(x),weight:6,opacity:1,dashArray:x.cat===8?"8 6":null}).bindPopup(pop).addTo(MAP._ttinc);}
        else if(isFinite(x.lat))L.circleMarker([x.lat,x.lon],{radius:7,color:"#fff",weight:2,fillColor:col(x),fillOpacity:1}).bindPopup(pop).addTo(MAP._ttinc);});
      applyMapMode();}
    const jams=list.filter(x=>x.cat===6||x.delay>0);
    TILE_PARTS.traffic.tt=jams.length?jams.length+" Behinderungen auf allen Straßen":"alle Straßen frei";composeTile("k-traffic","traffic");
    const magTxt=["","leicht","mäßig","stark","gesperrt"];
    box.innerHTML='<div class="facts" style="margin-bottom:8px">'+fact(String(jams.length),"Staus / zäh")+fact(String(list.filter(x=>x.cat===1).length),"Unfälle")+fact(String(list.filter(x=>x.cat===8).length),"Sperrungen")+fact(jams.length?"+"+Math.max(0,...jams.map(x=>x.delay||0))+" min":"–","größte Verzögerung")+'</div><div class="muted small" style="margin-bottom:6px">Rund um '+esc(C.town)+', auch Land- und Stadtstraßen · sortiert nach Verzögerung · die 25 wichtigsten</div>'+
      (list.length?'<div>'+list.slice(0,30).map((x,i)=>(i===0||list[i-1].grp!==x.grp?'<div class="sublbl" style="margin-top:8px">'+["Autobahnen","Rund um meine Adresse"+(HOMES[C.key]?" · "+esc(HOMES[C.key].label):""),"Weitere Straßen"][x.grp]+'</div>':'')+'<div class="jam"><span class="tag'+(x.road&&/^A/.test(x.road)?" ab":"")+'">'+esc(x.road||"Straße")+'</span><div class="t"><span class="pill '+(x.cat===8||x.mag>=4?"p-bad":x.mag>=3?"p-bad":"p-warn")+'" style="margin-right:6px"><i></i>'+esc(CAT[x.cat]||"Meldung")+'</span>'+(x.desc&&x.desc!==CAT[x.cat]?esc(x.desc):"")+'</div>'+
        '<div class="delay'+(x.delay!=null&&x.delay<15?" mid":"")+'">'+(x.delay?"+"+x.delay+" min":"")+'<small>'+(x.delay?"Verzögerung":esc(magTxt[x.mag]||""))+'</small></div>'+
        '<div class="d">'+esc([x.from,x.to].filter(Boolean).join(" → "))+[x.len?" · "+fmt(x.len,1)+" km":"",x.grp===1?" · "+fmt(x.home,1)+" km von meiner Adresse":isFinite(x.km)?" · "+fmt(x.km)+" km entfernt":""].join("")+'</div></div>').join("")+'</div>'
      :'<div class="state good">Keine Behinderungen im Umkreis gemeldet.</div>');
    setStatus("tomtom",true);
  }catch(e){setStatus("tomtom",false,errText(e));box.innerHTML=stateBox("TomTom-Verkehrslage nicht verfügbar – "+errText(e)+".",'<a href="#einstellungen">Schlüssel prüfen</a>');}
}
let MAPMODE=load("mapmode")||"tomtom";
// Fester Kartenausschnitt je Ort: [Süd, West, Nord, Ost]
const MAP_BOUNDS={dus:[51.15,6.62,51.72,7.45],datteln:[51.15,6.62,51.72,7.45],alpen:[51.17,6.38,51.70,6.86],salzhausen:[53.08,9.92,53.36,10.42]};
function mapBounds(){const b=MAP_BOUNDS[C.key];if(b)return b;const la=C.center.lat,lo=C.center.lon;return [la-.2,lo-.32,la+.2,lo+.32];}
function gmapsUrl(){const [s,w,n,e]=mapBounds();const span=Math.max(n-s,(e-w)*0.62);const z=span>0.45?10:span>0.22?11:12;return "https://www.google.com/maps/@"+((s+n)/2).toFixed(4)+","+((w+e)/2).toFixed(4)+","+z+"z/data=!5m1!1e1";}
let TTFLOW=load("ttflow")===true;
function applyMapMode(){
  if(!MAP)return;const tt=MAPMODE==="tomtom"&&!!TTKEY;const k=encodeURIComponent(TTKEY||"");
  if(!MAP._osm)MAP._osm=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,subdomains:"abc",attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'});
  if(!MAP._light)MAP._light=L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{maxZoom:19,subdomains:"abcd",attribution:'© OpenStreetMap © CARTO · Verkehr © TomTom'});
  if(TTKEY&&(!MAP._tt||MAP._ttk!==TTKEY)){if(MAP._tt)MAP._tt.remove();MAP._ttk=TTKEY;
    MAP._tt=L.tileLayer("https://api.tomtom.com/traffic/map/4/tile/flow/relative-delay/{z}/{x}/{y}.png?thickness=5&key="+k,{opacity:.8,maxZoom:18,zIndex:5});}
  [MAP._osm,MAP._light,MAP._tt,MAP._ttinc].forEach(l=>l&&MAP.hasLayer(l)&&l.remove());
  if(tt){MAP._light.addTo(MAP);if(TTFLOW)MAP._tt.addTo(MAP);if(MAP._ttinc)MAP._ttinc.addTo(MAP);}else MAP._osm.addTo(MAP);
  if(C.isDus&&!tt){if(!MAP._los)MAP._los=L.tileLayer.wms("https://vtmanager.duesseldorf.de/geovtinfo/wms",{layers:"vtinfo:LOS",format:"image/png",transparent:true,tiled:true,opacity:.85,zIndex:5,attribution:"Verkehrslage © Landeshauptstadt Düsseldorf"});MAP._los.addTo(MAP);}
  else if(MAP._los&&MAP.hasLayer(MAP._los))MAP._los.remove();
  if(MAPLAYER){if(tt&&MAP.hasLayer(MAPLAYER))MAPLAYER.remove();else if(!tt&&!MAP.hasLayer(MAPLAYER))MAPLAYER.addTo(MAP);}
  document.querySelectorAll(".tt-leg").forEach(e=>e.hidden=!tt);document.querySelectorAll(".osm-leg").forEach(e=>e.hidden=tt||!C.isDus);
  const fl=$("ttflow");if(fl){fl.parentElement.hidden=!tt;fl.checked=TTFLOW;}
  document.querySelectorAll("#mapsw [data-mm]").forEach(b=>b.classList.toggle("on",b.dataset.mm===(tt?"tomtom":"osm")));
  $("stau-src").textContent=tt?"Verkehr: TomTom Echtzeit · Karte © OpenStreetMap/CARTO":"Karte © OpenStreetMap · Meldungen: Autobahn GmbH"+(C.isDus?", Verkehrszentrale Düsseldorf":"");
}
document.addEventListener("change",e=>{if(e.target.id==="ttflow"){TTFLOW=e.target.checked;store("ttflow",TTFLOW);applyMapMode();}});
document.addEventListener("click",e=>{const b=e.target.closest("#mapsw [data-mm]");if(!b)return;
  if(b.dataset.mm==="tomtom"&&!TTKEY){location.hash="einstellungen";return;}
  MAPMODE=b.dataset.mm;store("mapmode",MAPMODE);applyMapMode();});
function ensureMap(){
  if(typeof L==="undefined")return null;
  if(!MAP){MAP=L.map("stau-map",{scrollWheelZoom:false}).setView([C.center.lat,C.center.lon],10);MAPLAYER=L.layerGroup().addTo(MAP);}
  applyMapMode();
  if(MAP._home){MAP._home.remove();MAP._home=null;}
  {const H=HOMES[C.key];if(H)MAP._home=L.marker([H.lat,H.lon],{icon:L.divIcon({className:"homeic",html:"🏠",iconSize:[26,26]})}).bindTooltip("Meine Adresse").addTo(MAP);}
  if(MAPRING)MAPRING.remove();if(MAPCENTER)MAPCENTER.remove();
  MAPRING=L.circle([C.center.lat,C.center.lon],{radius:JAM_RADIUS_KM*1000,color:"#8a9aa5",weight:1,dashArray:"4 6",fill:false,interactive:false}).addTo(MAP);
  MAPCENTER=L.circleMarker([C.center.lat,C.center.lon],{radius:5,color:"#14212b",weight:2,fillColor:"#fff",fillOpacity:1}).bindTooltip(C.town).addTo(MAP);
  {const [s,w,n,e]=mapBounds();MAP.fitBounds([[s,w],[n,e]],{padding:[4,4]});}
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
function renderPrio(rawW,rawC,okRoads){
  const box=$("prio");ROUTE_ITEMS=[];
  if(!ROUTES.length){box.innerHTML="";return;}
  const cards=ROUTES.map(r=>{
    if(!okRoads.has(r.ab))return '<div class="route unk"><span class="tag ab">'+esc(r.ab)+'</span><span class="rt">Richtung '+esc(r.dir)+'</span><span class="rv muted">keine Daten</span></div>';
    const cl=rawC.filter(c=>routeHit(c,r));
    const ws=rawW.filter(w=>routeHit(w,r)).map(w=>({...w,jam:jamInfo(w)}));
    const jams=ws.filter(w=>w.jam).sort((a,b)=>(b.jam.delay||0)-(a.jam.delay||0));
    const blocked=cl.length?cl[0]:ws.find(w=>w.isBlocked==="true"||w.isBlocked===true);
    let cls="ok",val="freie Fahrt",sub="im Umkreis von "+PRIO_RADIUS_KM+" km um "+C.town;
    if(blocked){cls="crit";val="Sperrung";sub=(blocked.subtitle||blocked.title||"")+" · "+fmt(blocked.km)+" km entfernt";}
    else if(jams.length){const j=jams[0];const st=jams.some(x=>x.jam.kind==="stau");cls=st&&(j.jam.delay||0)>=15?"bad":"warn";
      val=(st?"Stau":"stockend")+(j.jam.delay!=null?" · +"+j.jam.delay+" min":"")+(j.jam.len?" · "+fmt(j.jam.len,1)+" km":"")+(jams.length>1?" ("+jams.length+" Meldungen)":"");
      sub=(j.subtitle||j.title||"")+" · "+fmt(j.km)+" km entfernt";}
    else if(ws.length){cls="warn";val="Behinderung";sub=(ws[0].subtitle||ws[0].title||"")+" · "+fmt(ws[0].km)+" km entfernt";}
    ROUTE_ITEMS[ROUTES.indexOf(r)]=[...cl.map(c=>({...c,_c:1})),...ws];
    return '<div role="button" tabindex="0" data-route="'+ROUTES.indexOf(r)+'" class="route '+cls+'"><span class="tag ab">'+esc(r.ab)+'</span><span class="rt">Richtung '+esc(r.dir)+'</span><span class="rv">'+esc(val)+'</span><span class="rs">'+esc(sub)+'</span></div>';});
  box.innerHTML='<div class="sublbl">Meine Strecken</div><div class="prio">'+cards.join("")+'</div>';
}
// Detailliste hinter Kennzahlen und „Meine Strecken“
function abItem(i){
  const J=i.jam||jamInfo(i);const closed=i._c||i.isBlocked==="true"||i.isBlocked===true;
  const lines=(i.description||[]).map(x=>String(x).trim()).filter(Boolean);
  const pill=closed?'<span class="pill p-bad"><i></i>Sperrung</span>':J?(J.kind==="stau"?'<span class="pill p-bad"><i></i>Stau</span>':'<span class="pill p-warn"><i></i>stockend</span>'):'<span class="pill p-warn"><i></i>Behinderung</span>';
  const facts=[J&&J.delay!=null?"<b>+"+J.delay+" min</b>":"",J&&J.len?fmt(J.len,1)+" km lang":"",J&&J.speed!=null?"Ø "+J.speed+" km/h":"",fmt(i.km)+" km von "+esc(C.town)].filter(Boolean).join(" · ");
  return '<details class="abd"><summary><span class="tag ab">'+esc(i.ab)+'</span><span class="abd-t">'+pill+' '+esc(i.title||"")+'</span><span class="abd-s">'+esc(i.subtitle||"")+'</span><span class="abd-f">'+facts+'</span></summary>'+
    '<div class="abd-b">'+(lines.length?lines.map(esc).join("<br>"):'<span class="muted">Keine weiteren Angaben der Autobahn GmbH.</span>')+
    (isFinite(i.lat)?'<div style="margin-top:8px"><button type="button" class="btn sm" data-goto="'+i.lat+','+i.lon+'">Auf der Karte zeigen</button> <a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/maps/@?api=1&map_action=map&center='+i.lat+','+i.lon+'&zoom=14&layer=traffic">Google Maps ↗</a></div>':'')+'</div></details>';}
function showAbDetail(k){
  const box=$("stau-detail");if(!box)return;
  let set=null;
  if(/^r\d+$/.test(k)){const r=ROUTES[+k.slice(1)];const l=(ROUTE_ITEMS[+k.slice(1)]||[]).sort((a,b)=>a.km-b.km);set={t:"Meine Strecke: "+r.ab+" Richtung "+r.dir,l};}
  else set=AB_SETS[k];
  if(!set){box.hidden=true;return;}
  box.hidden=false;
  box.innerHTML='<div class="abd-head"><h3>'+esc(set.t)+' <span class="muted small">('+set.l.length+')</span></h3><button type="button" class="btn sm" data-close="1">Schließen ✕</button></div>'+
    (set.l.length?'<div class="muted small" style="margin-bottom:6px">Eintrag antippen für alle Angaben (Abschnitt, Dauer, Umleitung).</div>'+set.l.map(abItem).join(""):'<div class="state good">Keine Meldungen auf dieser Strecke im Umkreis von '+PRIO_RADIUS_KM+' km.</div>');
  document.querySelectorAll("#stau-sum .fbtn,#prio .route").forEach(b=>b.classList.toggle("on",(b.dataset.f||("r"+b.dataset.route))===k));
}
function selectAb(k){AB_SEL=AB_SEL===k?null:k;if(!AB_SEL){$("stau-detail").hidden=true;document.querySelectorAll("#stau-sum .fbtn,#prio .route").forEach(b=>b.classList.remove("on"));return;}
  showAbDetail(AB_SEL);setTimeout(()=>$("stau-detail").scrollIntoView({behavior:"smooth",block:"start"}),30);}
document.addEventListener("click",e=>{
  const f=e.target.closest("#stau-sum .fbtn");if(f){selectAb(f.dataset.f);return;}
  const r=e.target.closest("#prio .route[data-route]");if(r){selectAb("r"+r.dataset.route);return;}
  if(e.target.closest("#stau-detail [data-close]")){selectAb(AB_SEL);return;}
  const g=e.target.closest("#stau-detail [data-goto]");if(g&&MAP){const [la,lo]=g.dataset.goto.split(",").map(Number);$("stau-map").scrollIntoView({behavior:"smooth",block:"center"});MAP.setView([la,lo],13);
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
  const got={};svcs.forEach(s=>got[s]=[]);const rawW=[],rawC=[],okRoads=new Set();let ok=0,total=0;const cLat=C.center.lat,cLon=C.center.lon,keyAtStart=C.key;
  const jobs=[...roads.flatMap(ab=>svcs.map(svc=>[ab,svc,true])),...prioOnly.flatMap(ab=>["warning","closure"].map(svc=>[ab,svc,false]))];
  await Promise.all(jobs.map(async([ab,svc,local])=>{
    total++;
    try{const d=await getJSON("https://verkehr.autobahn.de/o/autobahn/"+encodeURIComponent(ab)+"/services/"+svc,20000);ok++;okRoads.add(ab);
      const lim=(svc==="warning"||svc==="closure")?JAM_RADIUS_KM:RADIUS_KM;
      (d[svc]||[]).forEach(w=>{const c=w.coordinate||{};const km=distKm(cLat,cLon,parseFloat(c.lat),parseFloat(c.long));if(!isFinite(km))return;
        const item={...w,ab,km,lat:parseFloat(c.lat),lon:parseFloat(c.long)};
        if(svc==="warning"&&km<=PRIO_RADIUS_KM)rawW.push(item);
        if(svc==="closure"&&km<=PRIO_RADIUS_KM)rawC.push(item);
        if(local&&km<=lim)got[svc].push(item);});
    }catch(e){}
  }));
  if(keyAtStart!==C.key)return; // Ort inzwischen gewechselt
  renderPrio(rawW,rawC,okRoads);
  if(!roads.length){
    const msg='<div class="state">Für '+esc(C.town)+' sind keine weiteren Autobahnen hinterlegt. <a href="#einstellungen">Unter Einstellungen → Meine Orte eintragen</a>.</div>';
    ["stau-list","traffic","roadworks","webcams","charging"].forEach(id=>$(id).innerHTML=msg);$("stau-sum").innerHTML="";
    const bad=ROUTES.length&&$("prio").querySelector(".route.bad,.route.crit");setKpi("k-traffic",bad?"!":"–",bad?"Störung auf Meinen Strecken":"Meine Strecken frei",bad?"bad":"ok");
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
  TILE_PARTS.traffic.ab=(jams.length?jams.length+" Staus/stockend":"Autobahn frei")+(maxDelay?" bis +"+maxDelay+" min":"");
  composeTile("k-traffic","traffic",String(jams.length)+"<small> Staus</small>",nStau?(maxDelay>=20?"bad":"warn"):jams.length?"warn":"ok");
  if(false)setKpi("k-traffic",String(jams.length),jams.length?(maxDelay?"bis +"+maxDelay+" min":"")+(totLen?" · "+fmt(totLen,1)+" km":"")+(closuresAll.length?" · "+closuresAll.length+" Sperrung(en)":""):"freie Fahrt"+(closuresAll.length?" · "+closuresAll.length+" Sperrung(en)":""),
    nStau?(maxDelay>=20?"bad":"warn"):jams.length?"warn":"ok");
  const otherList=warnings.filter(w=>!jamInfo(w)&&!isClosed(w)).sort((a,b)=>a.km-b.km);
  AB_SETS={
    stau:{t:"Staus",l:jams.filter(j=>j.jam.kind==="stau")},
    stockend:{t:"Stockender Verkehr",l:jams.filter(j=>j.jam.kind!=="stau")},
    len:{t:"Staus mit Längenangabe (längste zuerst)",l:jams.filter(j=>j.jam.len).sort((a,b)=>b.jam.len-a.jam.len)},
    delay:{t:"Verzögerungen (größte zuerst)",l:jams.filter(j=>j.jam.delay!=null).sort((a,b)=>b.jam.delay-a.jam.delay)},
    sperr:{t:"Sperrungen (nächste zuerst)",l:[...closuresAll].sort((a,b)=>a.km-b.km)},
    other:{t:"Weitere Behinderungen",l:otherList}};
  const fb=(k,v,l)=>'<button type="button" class="fact fbtn'+(AB_SEL===k?" on":"")+'" data-f="'+k+'"'+(AB_SETS[k].l.length?"":" disabled")+'><b>'+v+'</b><span>'+l+'</span></button>';
  $("stau-sum").innerHTML=fb("stau",String(nStau),"Staus")+fb("stockend",String(jams.length-nStau),"stockender Verkehr")+fb("len",totLen?fmt(totLen,1)+" km":"–","Staulänge gesamt")+fb("delay",maxDelay?"+"+maxDelay+" min":"–","größte Verzögerung")+fb("sperr",String(closuresAll.length),"Sperrungen")+fb("other",String(otherList.length),"weitere Behinderungen");
  if(AB_SEL&&!/^r\d/.test(AB_SEL))showAbDetail(AB_SEL);else if(AB_SEL)showAbDetail(AB_SEL);
  $("stau-list").innerHTML=jams.length?'<div>'+jams.map(j=>{const J=j.jam;
      const det=[J.len?fmt(J.len,1)+" km":"",J.speed!=null?"Ø "+J.speed+" km/h":"",fmt(j.km)+" km entfernt"].filter(Boolean).join(" · ");
      return '<div class="jam"><span class="tag ab">'+esc(j.ab)+'</span><div class="t">'+(j.pr<99?'<span class="pill" style="margin-right:6px">Meine Strecke</span>':'')+(J.kind==="stau"?'<span class="pill p-bad" style="margin-right:6px"><i></i>Stau</span>':'<span class="pill p-warn" style="margin-right:6px"><i></i>stockend</span>')+esc(j.title)+'</div>'+
        '<div class="delay'+(J.delay!=null&&J.delay<15?" mid":"")+'">'+(J.delay!=null?"+"+J.delay+" min":"")+'<small>'+(J.delay!=null?"Verzögerung":"")+'</small></div>'+
        '<div class="d">'+esc(j.subtitle||"")+(det?" · "+esc(det):"")+(desc(j)?'<br>'+esc(desc(j)):"")+'</div></div>';}).join("")+'</div>'
    :'<div class="state good">Derzeit keine Staus auf '+esc(roads.join(", "))+' im Umkreis von '+JAM_RADIUS_KM+' km.</div>';
  if(ensureMap()){
    MAPLAYER.clearLayers();
    uniq(got.roadworks).forEach(r=>{if(isFinite(r.lat))L.circleMarker([r.lat,r.lon],{radius:4,color:"#8a9aa5",weight:1,fillColor:"#8a9aa5",fillOpacity:.7}).bindPopup(popupHtml(r,"Baustelle")).addTo(MAPLAYER);});
    warnings.filter(w=>!jamInfo(w)&&!isClosed(w)).forEach(w=>{if(isFinite(w.lat))L.circleMarker([w.lat,w.lon],{radius:6,color:"#fff",weight:2,fillColor:"#c98a00",fillOpacity:1}).bindPopup(popupHtml(w,"Behinderung")).addTo(MAPLAYER);});
    closuresAll.forEach(c=>{const lines=geomLines(c);
      lines.forEach(ll=>L.polyline(ll,{color:"#7d1f6b",weight:5,opacity:.9}).bindPopup(popupHtml(c,"<b>Sperrung</b>")).addTo(MAPLAYER));
      if(isFinite(c.lat))L.circleMarker([c.lat,c.lon],{radius:6,color:"#fff",weight:2,fillColor:"#7d1f6b",fillOpacity:1}).bindPopup(popupHtml(c,"<b>Sperrung</b>")).addTo(MAPLAYER);});
    jams.forEach(j=>{const col=j.jam.kind==="stau"?"#d62d20":"#f0a020";const extra=[j.jam.delay!=null?"<b>+"+j.jam.delay+" min</b>":"",j.jam.len?fmt(j.jam.len,1)+" km":"",j.jam.speed!=null?"Ø "+j.jam.speed+" km/h":""].filter(Boolean).join(" · ");
      const lines=geomLines(j);
      if(lines.length)lines.forEach(ll=>{L.polyline(ll,{color:"#fff",weight:10,opacity:.8,interactive:false}).addTo(MAPLAYER);L.polyline(ll,{color:col,weight:6,opacity:1}).bindPopup(popupHtml(j,extra)).addTo(MAPLAYER);});
      else if(isFinite(j.lat))L.circleMarker([j.lat,j.lon],{radius:8,color:"#fff",weight:2,fillColor:col,fillOpacity:1}).bindPopup(popupHtml(j,extra)).addTo(MAPLAYER);});
    drawVTOnMap();setTimeout(()=>MAP.invalidateSize(),50);
  }else{$("stau-map").innerHTML='<div class="state" style="margin:12px">Kartenbibliothek nicht geladen – die Liste darunter ist vollständig.</div>';}
  const jamIds=new Set(jams.map(j=>j.ab+"|"+j.title+"|"+j.subtitle+"|"+(j.identifier||"")));
  const msgs=uniq([...got.closure.map(x=>({...x,_c:1})),...warnings]).filter(m=>!jamIds.has(m.ab+"|"+m.title+"|"+m.subtitle+"|"+(m.identifier||"")))
    .sort((a,b)=>(isClosed(b)?1:0)-(isClosed(a)?1:0)||a.km-b.km);
  $("traffic").innerHTML=msgs.length?'<div class="list">'+msgs.slice(0,15).map(i=>'<div class="li"><span class="tag ab">'+esc(i.ab)+'</span><div class="t">'+
    (isClosed(i)?'<span class="pill p-bad" style="margin-right:6px"><i></i>Sperrung</span>':'')+esc(i.title)+'</div><div class="r muted small">'+fmt(i.km)+' km</div><div class="d">'+esc(i.subtitle||"")+(desc(i)?" – "+esc(desc(i)):"")+'</div></div>').join("")+'</div>'+
    (msgs.length>15?'<div class="muted small">+ '+(msgs.length-15)+' weitere</div>':''):'<div class="state good">Keine weiteren Behinderungen im Umkreis.</div>';
  const rw=uniq(got.roadworks).sort((a,b)=>a.km-b.km);
  setKpi("k-verk",String(rw.length)+"<small> Baustellen</small>",uniq(got.electric_charging_station).length+" Ladepunkte","info");
  $("roadworks").innerHTML=rw.length?'<div class="list">'+rw.slice(0,12).map(i=>'<div class="li"><span class="tag ab">'+esc(i.ab)+'</span><div class="t">'+esc(i.title)+'</div><div class="r muted small">'+fmt(i.km)+' km</div><div class="d">'+esc(i.subtitle||"")+(desc(i)?" – "+esc(desc(i)):"")+'</div></div>').join("")+'</div>'+
    '<div class="muted small">'+rw.length+' Baustellen im Umkreis von '+RADIUS_KM+' km</div>':'<div class="state good">Keine Baustellen im Umkreis.</div>';
  const cams=uniq(got.webcam).filter(c=>c.imageurl).sort((a,b)=>a.km-b.km).slice(0,12);CAM_N.ab=cams.length;camTile();
  $("webcams").innerHTML=cams.length?'<div class="cams">'+cams.map(c=>'<a class="cam" href="'+esc(safeUrl(c.linkurl||c.imageurl))+'" target="_blank" rel="noopener"><img loading="lazy" alt="Webcam '+esc(c.title)+'" src="'+esc(safeUrl(c.imageurl))+'"><span><b>'+esc(c.ab)+'</b> '+esc(c.subtitle||c.title)+'</span></a>').join("")+'</div>':'<div class="muted small">Die Autobahn GmbH liefert derzeit keine Webcam-Bilder im Umkreis.</div>';
  const ch=uniq(got.electric_charging_station).sort((a,b)=>a.km-b.km);
  $("charging").innerHTML=ch.length?'<div class="list">'+ch.slice(0,8).map(i=>'<div class="li"><span class="tag ab">'+esc(i.ab)+'</span><div class="t">'+esc(i.title)+'</div><div class="r muted small">'+fmt(i.km)+' km</div><div class="d">'+esc(i.subtitle||"")+(desc(i)?" – "+esc(desc(i)):"")+'</div></div>').join("")+'</div>':stateBox("Keine Ladestationen an Autobahnen im Umkreis.");
}

// ================= Tankerkönig =================
async function loadFuel(){
  const box=$("fuel");
  if(!TK){box.innerHTML=stateBox("Für Spritpreise einmal einen kostenlosen Tankerkönig-Schlüssel unter Einstellungen eintragen.",'<a href="#einstellungen">Zu den Einstellungen</a>');setStatus("fuel",false,"Schlüssel fehlt");return;}
  try{const d=await getJSON("https://creativecommons.tankerkoenig.de/json/list.php?lat="+C.lat+"&lng="+C.lon+"&rad="+(C.isDus?4:8)+"&sort=dist&type=all&apikey="+encodeURIComponent(TK));
    if(!d.ok)throw new Error(d.message||"Abfrage abgelehnt");
    const st=(d.stations||[]).filter(s=>s.isOpen).slice(0,10);
    if(!st.length){box.innerHTML=stateBox("Keine geöffnete Tankstelle in der Nähe.");setStatus("fuel",true);return;}
    const best=k=>Math.min(...st.map(s=>s[k]).filter(v=>typeof v==="number"));
    const bE5=best("e5"),bE10=best("e10"),bD=best("diesel");
    const p=(v,b)=>typeof v!=="number"?"–":'<span style="'+(v===b?"color:var(--ok);font-weight:700":"")+'">'+v.toFixed(2).replace(".",",")+'<sup>9</sup></span>';
    let r='<table><thead><tr><th>Tankstelle</th><th class="num">km</th><th class="num">Super E5</th><th class="num">E10</th><th class="num">Diesel</th></tr></thead><tbody>';
    st.forEach(s=>{r+='<tr><td class="wrap-txt"><b>'+esc(s.brand||s.name)+'</b><br><span class="muted small">'+esc((s.street||"")+" "+(s.houseNumber||"")+", "+(s.place||""))+'</span></td><td class="num">'+fmt(s.dist,1)+'</td><td class="num">'+p(s.e5,bE5)+'</td><td class="num">'+p(s.e10,bE10)+'</td><td class="num">'+p(s.diesel,bD)+'</td></tr>';});
    box.innerHTML='<div class="tbl-wrap">'+r+'</tbody></table></div><div class="muted small">Geöffnete Tankstellen nahe '+esc(C.short)+', günstigster Preis grün.</div>';
    setStatus("fuel",true);
  }catch(e){setStatus("fuel",false,errText(e));box.innerHTML=stateBox("Spritpreise nicht verfügbar – "+errText(e)+".");}
}

// ================= ÖPNV =================
const normStop=x=>String(x||"").toLowerCase().replace(/straße/g,"str.").replace(/[^a-z0-9äöüß]/g,"");
function stopMatch(v){const n=normStop(v);const I=STOPIDX||{available:[],all:[]};
  const a=I.available.find(x=>normStop(x.name)===n||normStop(x.q)===n||normStop(x.name).endsWith(n));
  if(a)return {file:a.file,name:a.name};
  const s=I.all.find(x=>normStop(x.name)===n)||I.all.find(x=>normStop(x.name).includes(n));
  return s?{id:s.id,name:s.name}:{};}
async function loadStopIndex(){STOPIDX=null;$("stop-list").innerHTML="";if(!C.efaDefault||!FAVKEYS.includes(C.key))return;
  try{STOPIDX=(await getData("stops-"+C.key+".json")).data;
    $("stop-list").innerHTML=STOPIDX.all.map(x=>'<option value="'+esc(x.name)+'"></option>').join("");}catch(e){STOPIDX={available:[],all:[]};}}
async function loadEFA(){
  if(!C.efaDefault){setStatus("efa",true,"keine Haltestelle hinterlegt");return;}
  if(!STOPIDX)await loadStopIndex();
  const stop=STOPS[C.key]||C.efaDefault;const m=stopMatch(stop);
  const avail=(STOPIDX&&STOPIDX.available)||[];
  $("efa-stops").innerHTML=avail.length>1?avail.map(a=>'<button type="button" data-stop="'+esc(a.name)+'" class="'+(m.file===a.file?"on":"")+'">'+esc(a.name.replace(/^(Düsseldorf|Datteln|Alpen),?\s*/,""))+'</button>').join(""):"";
  $("efa-dir").value=DIRF[C.key]||"";
  $("efa-title").textContent=(C.isDus?"Rheinbahn · ":"Abfahrten ")+(m.name||stop).replace(/^Düsseldorf[, ]*/,"");
  $("efa-src").textContent=C.isDus?"Bus, U- und Straßenbahn · Echtzeit":"Bus & Bahn vor Ort · Echtzeit";
  const file=m.file||(stop===C.efaDefault?"efa-"+C.key+".json":null);
  if(!file||!FAVKEYS.includes(C.key)){EFADATA=null;
    $("efa").innerHTML=stateBox("„"+esc(m.name||stop)+"“ wird noch nicht automatisch abgerufen.",(m.id?link("https://efa.vrr.de/vrr/XSLT_DM_REQUEST?language=de&type_dm=stop&mode=direct&useRealtime=1&name_dm="+encodeURIComponent(m.id),"Live-Abfahrten öffnen")+" · ":"")+"Claude kann sie fest ergänzen.");return;}
  try{if(!BUSF)BUSF=await getData("busfahrten.json").then(x=>x.data||[]).catch(()=>[]);EFADATA=await getData(file);renderEFA();setStatus("efa",true,"Stand "+dataAge(EFADATA));}
  catch(e){setStatus("efa",false,errText(e));$("efa").innerHTML=stateBox("Abfahrten nicht verfügbar – "+errText(e)+".",link(C.isDus?"https://www.rheinbahn.de/":"https://www.vrr.de/",C.isDus?"Rheinbahn":"VRR-Fahrplanauskunft"));}
}
function renderEFA(){const d=EFADATA;if(!d)return;
  const pairs=(BUSF||[]).filter(x=>x.key===C.key);
  $("efa-dir").parentElement.hidden=pairs.length>0;$("efa-stops").hidden=false;
  if(pairs.length){const now=Date.now()-60e3;
    const short=x=>x.replace(/^Datteln,?\s*/,"").replace(/^Bus Bf$/,"Busbahnhof").replace(/^Lohstr\.$/,"Lohstraße");
    const nx=pairs.map(x=>({x,r:x.rows.filter(r=>new Date(r.depEst||r.dep).getTime()>=now)}));
    const f=nx[0]&&nx[0].r[0];
    if(f){TILE_PARTS.mobil.bus="Bus "+esc(f.line)+" "+hhmm(f.depEst||f.dep)+" "+short(nx[0].x.from)+" → "+short(nx[0].x.to);composeTile("k-bahn","mobil");}
    $("efa-title").textContent="Bus Lohstraße ⇄ Busbahnhof";
    const di=Math.min(+(load("busdir_"+C.key)||0),nx.length-1);
    $("efa-stops").innerHTML=nx.map(({x},i)=>'<button type="button" data-bdir="'+i+'" class="'+(i===di?"on":"")+'">'+esc(short(x.from))+' → '+esc(short(x.to))+'</button>').join("");
    $("efa").innerHTML=nx.filter((_,i)=>i===di).map(({x,r})=>'<div class="sublbl">'+esc(short(x.from))+' → '+esc(short(x.to))+'</div>'+(r.length?'<div class="list" style="margin-bottom:12px">'+r.slice(0,6).map(r=>{const dm=r.depEst&&r.dep?Math.round((new Date(r.depEst)-new Date(r.dep))/6e4):0;
      return '<div class="li"><span class="tag">'+esc(r.line)+'</span><div class="t"><b>'+hhmm(r.dep)+'</b>'+(dm>0?' <span style="color:var(--bad);font-weight:600">+'+dm+'</span>':'')+' → an '+hhmm(r.arrEst||r.arr)+'</div><div class="r muted small">'+(r.plat?'Steig '+esc(r.plat):'')+'</div><div class="d">Richtung '+esc(r.dir)+'</div></div>';}).join("")+'</div>':'<div class="muted small" style="margin-bottom:12px">Keine direkte Fahrt in den nächsten Stunden.</div>')).join("")+
      '<div class="muted small">Nur Busse ohne Umstieg zwischen Lohstraße und Busbahnhof · Echtzeit abgerufen '+dataAge(d)+'</div>';
    return;}const now=Date.now()-60e3;const f=normStop(DIRF[C.key]||"");
  let rows=(d.data.rows||[]).filter(x=>new Date(x.est||x.planned).getTime()>=now);
  if(f)rows=rows.filter(x=>normStop(x.dir).includes(f)||normStop(x.line)===f);
  rows=rows.slice(0,14);
  if(!rows.length){$("efa").innerHTML=busTripsHtml(d.data.stop)+stateBox(f?"Keine Abfahrten mit diesem Filter im abgerufenen Zeitraum.":"Keine weiteren Abfahrten im abgerufenen Zeitraum.");return;}
  {const x=rows[0];TILE_PARTS.mobil.bus=esc(x.line)+" "+hhmm(x.est||x.planned)+" ab "+esc(d.data.stop.replace(/^(Düsseldorf|Datteln),?\s*/,""));
    if(!(C.isDus||C.key==="datteln"))composeTile("k-bahn","mobil",hhmm(x.est||x.planned)+"<small> "+esc(x.line)+"</small>");else composeTile("k-bahn","mobil");}
  $("efa").innerHTML=busTripsHtml(d.data.stop)+'<div class="muted small">'+esc(d.data.stop)+' · alle Abfahrten · Echtzeit abgerufen '+dataAge(d)+'</div><div class="tbl-wrap">'+depTable(rows)+'</div>';
}
let BUSF=null;
function busTripsHtml(stop){if(!BUSF)return"";const n=normStop(stop);
  const t=BUSF.filter(x=>x.key===C.key&&(normStop(x.from)===n||normStop(x.fromQ).endsWith(n)||n.endsWith(normStop(x.from))));
  const now=Date.now()-60e3;
  return t.map(x=>{const r=x.rows.filter(r=>new Date(r.depEst||r.dep).getTime()>=now).slice(0,5);
    return '<div class="sublbl">Direkt nach '+esc(x.to.replace(/^Datteln,?\s*/,"").replace(/^Bus Bf$/,"Busbahnhof"))+'</div>'+(r.length?'<div class="list" style="margin-bottom:10px">'+r.map(r=>{const dm=r.depEst&&r.dep?Math.round((new Date(r.depEst)-new Date(r.dep))/6e4):0;
      return '<div class="li"><span class="tag">'+esc(r.line)+'</span><div class="t"><b>'+hhmm(r.dep)+'</b>'+(dm>0?' <span style="color:var(--bad);font-weight:600">+'+dm+'</span>':'')+' → an '+hhmm(r.arrEst||r.arr)+'</div><div class="r muted small">'+(r.plat?'Steig '+esc(r.plat):'')+'</div><div class="d">Richtung '+esc(r.dir)+'</div></div>';}).join("")+'</div>':'<div class="muted small" style="margin-bottom:10px">Keine direkte Fahrt im abgerufenen Zeitraum.</div>');}).join("");}
function depTable(rows){
  let r='<table><thead><tr><th>Zeit</th><th>Linie</th><th>Richtung</th><th class="num">Gleis/Steig</th><th class="num">+min</th></tr></thead><tbody>';
  rows.forEach(x=>{const del=x.delay!=null?x.delay:(x.planned&&x.est?Math.round((new Date(x.est)-new Date(x.planned))/6e4):null);
    r+='<tr><td><b>'+(x.planned?hhmm(x.planned):"–")+'</b></td><td><span class="tag">'+esc(x.line)+'</span></td><td class="wrap-txt">'+esc(x.dir)+'</td><td class="num">'+esc(x.plat||"")+'</td><td class="num">'+
      (x.cancelled?'<span class="pill p-bad"><i></i>fällt aus</span>':del==null?'<span class="muted">–</span>':del>0?'<span style="color:var(--bad);font-weight:600">+'+del+'</span>':'<span style="color:var(--ok)">0</span>')+'</td></tr>';});
  return r+'</tbody></table>';
}
async function loadDep(){
  if(!FAVKEYS.includes(C.key)){$("dep").innerHTML=stateBox("Bahn-Abfahrten sind für Düsseldorf und die Favoriten hinterlegt.",link("https://www.bahn.de/","bahn.de"));return;}
  try{const d=await getData("db-"+C.key+".json");const now=Date.now()-60e3;
    $("dep-title").textContent=d.data.stop+(C.isDus?" · Bahn":" · Bahn & Bus");
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
    html+='<div class="facts">'+fact(hhmm(d.sunrise[0]*1000),"Sonnenaufgang")+fact(hhmm(d.sunset[0]*1000),"Sonnenuntergang")+fact(Math.floor(len/3600)+" h "+Math.round(len%3600/60)+" min","Tageslicht")+fact(String(isoWeek(new Date())),"Kalenderwoche")+'</div>';}
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
    else if(hol){v=nd(hol.date).toLocaleDateString("de-DE",{day:"numeric",month:"numeric"})+"<small> "+esc(hol.localName)+"</small>";n=rel(days(hol.date))+" · "+(STATE_NAME[C.state]||"");}
    setKpi("k-strom",v,n,cls);}
  $("cal").innerHTML=html||stateBox("wird geladen …");
}
function isoWeek(d){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y)/864e5+1)/7);}

// ================= Börse =================
async function loadBoerse(){
  try{
    const d=await getData("boerse.json");const q=(d.data&&d.data.quotes)||[];if(!q.length)throw new Error("keine Kurse");
    const spark=(pts,up)=>{if(!pts||pts.length<2)return"";const mn=Math.min(...pts),mx=Math.max(...pts),W=200,H=34;
      const xy=pts.map((v,i)=>(i/(pts.length-1)*W).toFixed(1)+","+(mx===mn?H/2:(H-2-(v-mn)/(mx-mn)*(H-4))).toFixed(1)).join(" ");
      return '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true"><polyline points="'+xy+'" fill="none" stroke="'+(up?"var(--ok)":"var(--bad)")+'" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>';};
    const dax=q.find(x=>x.sym==="^GDAXI");
    const berlin=new Date(new Date().toLocaleString("en-US",{timeZone:"Europe/Berlin"}));const wd=berlin.getDay(),mm=berlin.getHours()*60+berlin.getMinutes();
    const xetra=wd>0&&wd<6&&mm>=540&&mm<1050;
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
async function loadNews(){
  const reg=NEWS_REGION[C.state]||10;
  try{const d=await getJSON("https://www.tagesschau.de/api2u/news/?regions="+reg);
    const n=(d.news||[]).filter(x=>x.title);
    if(!n.length)throw new Error("keine Meldungen");
    $("news-title").textContent="Nachrichten "+(STATE_NAME[C.state]||"");
    $("news").innerHTML='<div class="list">'+n.slice(0,8).map(x=>'<div class="li" style="grid-template-columns:1fr auto"><a class="t" href="'+esc(safeUrl(x.shareURL||x.detailsweb))+'" target="_blank" rel="noopener">'+esc(x.title)+'</a><span class="r muted small">'+(x.date?hhmm(x.date):"")+'</span>'+
      (x.firstSentence?'<div class="d" style="grid-column:1/-1">'+esc(x.firstSentence)+'</div>':'')+'</div>').join("")+'</div>';
    setStatus("news",true);
  }catch(e){setStatus("news",false,errText(e));$("news").innerHTML=stateBox("Nachrichten nicht verfügbar – "+errText(e)+".",link("https://www.tagesschau.de/inland/regional/","tagesschau regional"));}
}

// ================= Quellen =================
function renderSources(){
  let r='<table><thead><tr><th>Bereich</th><th>Anbieter</th><th>Endpunkt</th><th>Status</th></tr></thead><tbody>';
  Object.entries(SRC).forEach(([k,s])=>{const st=status[k];
    const pill=!st?'<span class="pill"><i></i>ausstehend</span>':st.ok?'<span class="pill p-ok"><i></i>live '+hhmm(st.at)+(st.msg?" · "+esc(st.msg):"")+'</span>':'<span class="pill p-bad"><i></i>'+esc(st.msg)+'</span>';
    r+='<tr><td><b>'+esc(s.name)+'</b></td><td><a href="'+s.url+'" target="_blank" rel="noopener">'+esc(s.prov)+'</a></td><td class="mono">'+esc(s.ep)+'</td><td>'+pill+'</td></tr>';});
  $("sources").innerHTML=r+'</tbody></table>';
  {const v=Object.values(status),ok=v.filter(x=>x.ok).length;setKpi("k-src",ok+"<small> / "+v.length+" live</small>",v.length-ok?(v.length-ok)+" ohne Daten":"alle Quellen erreichbar",v.length-ok>3?"warn":"ok");}
}

// ================= Ablauf =================
let busy=false,lastSlow=0,slowKey="";
async function refreshAll(force){
  if(busy){pending=true;return;}busy=true;const btn=$("refresh");btn.disabled=true;btn.textContent="Lädt …";
  const tasks=[loadAlerts(),scanFavAlarms(),loadWeather(),loadObs(),loadAir(),loadRhein(),loadLandespegel(),loadAutobahn(),loadTomTom(),loadBlaulicht(),loadEinsaetze(),loadTrips(),loadEFA(),loadBike(),loadFuel(),loadBoerse(),loadNews(),loadSammler()];
  if(C.isDus)tasks.push(loadVT(),loadGarages());
  renderWebcamLinks();
  if(force||Date.now()-lastSlow>3600e3||slowKey!==C.key){
    lastSlow=Date.now();slowKey=C.key;
    tasks.push(loadUBA(),loadPollen(),loadHol());
    tasks.push(loadWindy());if(C.isDus)tasks.push(loadParking());
  }
  await Promise.allSettled(tasks);
  $("updated").textContent=C.name+" · zuletzt aktualisiert "+new Date().toLocaleString("de-DE",{...TZ,dateStyle:"medium",timeStyle:"short"})+" · Staus alle 3, Rest alle 10 Minuten";
  btn.disabled=false;btn.textContent="↻ Aktualisieren";busy=false;lastRun=Date.now();
  if(pending){pending=false;refreshAll(true);}
}
let pending=false,lastRun=0;
function tick(){$("clock").textContent=new Date().toLocaleTimeString("de-DE",{...TZ,hour:"2-digit",minute:"2-digit",second:"2-digit"});
  $("sub").textContent=new Date().toLocaleDateString("de-DE",{...TZ,weekday:"long",day:"numeric",month:"long",year:"numeric"})+" · KW "+isoWeek(new Date());}
$("refresh").addEventListener("click",()=>refreshAll(true));
// ================= Übersicht, Ansichten, Anordnen =================
const TILE_DEFAULT=[...document.querySelectorAll("#tiles .tile")].map(t=>t.dataset.view);
const GROUPS={wetter:[["wetter","Wetter"],["bezirke","Wetter Stadtbezirke"]],verkehr:[["staus","Autobahn & Staus"],["stadtverkehr","Stadtverkehr"],["verkehr","Baustellen, Tanken, E-Laden"],["parken","Parken & Service"]],mobil:[["bahn","Deutsche Bahn"],["oepnv","Rheinbahn"]]};
function tileAvailable(v){
  if(["stadtverkehr","parken","bezirke"].includes(v))return C.isDus;
  if(v==="einsaetze")return C.key==="datteln";
  if(v==="bahn")return true;
  return !!$("v-"+v);
}
const groupOf=v=>Object.keys(GROUPS).find(g=>GROUPS[g].some(([x])=>x===v));
function applyTileOrder(){
  let order=load("tile_order")||TILE_DEFAULT;const box=$("tiles");
  // „Bus & Bahn“ einmalig direkt hinter „Verkehr“ einsortieren
  if(!load("ord_bahn2")){order=order.filter(v=>v!=="bahn");const i=order.indexOf("staus");order.splice(i<0?order.length:i+1,0,"bahn");store("ord_bahn2",1);if(load("tile_order"))store("tile_order",order);}
  TILE_DEFAULT.forEach((v,i)=>{if(!order.includes(v)){const prev=TILE_DEFAULT[i-1];const j=order.indexOf(prev);order.splice(j<0?order.length:j+1,0,v);}});
  [...order,...TILE_DEFAULT.filter(v=>!order.includes(v))].forEach(v=>{const t=box.querySelector('.tile[data-view="'+v+'"]');if(t)box.appendChild(t);});
}
function saveTileOrder(){store("tile_order",[...document.querySelectorAll("#tiles .tile")].map(t=>t.dataset.view));buildViewbar();}
function buildViewbar(){
  const cur=location.hash.slice(1);
  const g=groupOf(cur);
  $("viewbar-links").innerHTML=[...document.querySelectorAll("#tiles .tile")].filter(t=>!t.hidden).map(t=>{const on=t.dataset.view===cur||(g&&groupOf(t.dataset.view)===g);return '<a href="#'+t.dataset.view+'" class="'+(on?"on":"")+'">'+esc(t.querySelector(".lbl").textContent)+'</a>';}).join("");
}
function route(){
  let v=location.hash.slice(1);
  if(v&&!$("v-"+v))v="";
  if(v&&!tileAvailable(v))v="";
  const inView=!!v;
  $("home").hidden=inView;$("viewbar").hidden=false;document.querySelector("#viewbar .back").classList.toggle("home",!inView);document.querySelector("#viewbar .back").textContent=inView?"‹ Übersicht":"Übersicht";
  document.querySelectorAll(".view").forEach(el=>el.hidden=el.dataset.view!==v);
  buildViewbar();
  document.querySelectorAll(".subtabs").forEach(el=>{const g=groupOf(el.dataset.for);
    const tabs=(GROUPS[g]||[]).filter(([x])=>tileAvailable(x));el.hidden=tabs.length<2;
    el.innerHTML=tabs.map(([x,l])=>'<a href="#'+x+'" class="'+(x===v?"on":"")+'">'+esc(l)+'</a>').join("");});
  if(inView){window.scrollTo(0,Math.max(0,$("viewbar").offsetTop));if(v==="staus"&&MAP)setTimeout(()=>MAP.invalidateSize(),60);}
}
window.addEventListener("hashchange",route);
document.querySelectorAll(".view").forEach(v=>{const x=document.createElement("a");x.href="#";x.className="view-x";x.setAttribute("aria-label","Schließen, zurück zur Übersicht");x.innerHTML="✕ Schließen";v.prepend(x);});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&location.hash.length>1&&!document.querySelector("dialog[open]"))location.hash="";});
let EDITING=false,SORT=null;
document.querySelectorAll("#tiles .tile").forEach(t=>{
  const ctl=document.createElement("span");ctl.className="ctl";
  ctl.innerHTML='<button type="button" data-mv="-1" aria-label="nach vorne">◀</button><button type="button" data-mv="1" aria-label="nach hinten">▶</button>';
  t.appendChild(ctl);
  ctl.querySelectorAll("button").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();
    const list=[...$("tiles").children].filter(x=>!x.hidden);const i=list.indexOf(t),j=i+Number(b.dataset.mv);
    if(j<0||j>=list.length)return;if(Number(b.dataset.mv)<0)list[j].before(t);else list[j].after(t);saveTileOrder();}));
  const go=()=>{if(EDITING)return;location.hash=t.dataset.view;};
  t.addEventListener("click",go);t.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});
});
$("arrange").addEventListener("click",()=>{
  EDITING=!EDITING;$("tiles").classList.toggle("editing",EDITING);
  $("arrange").textContent=EDITING?"Fertig":"Anordnen";$("arrange-hint").hidden=!EDITING;$("arrange-reset").hidden=!EDITING;
  if(window.Sortable&&!SORT)SORT=Sortable.create($("tiles"),{animation:150,forceFallback:true,fallbackOnBody:true,fallbackTolerance:4,delay:0,filter:".ctl button",preventOnFilter:false,ghostClass:"tile-ghost",chosenClass:"tile-chosen",dragClass:"tile-drag",onStart:()=>$("tiles").classList.add("dragging"),onEnd:()=>{$("tiles").classList.remove("dragging");saveTileOrder();}});
  if(SORT)SORT.option("disabled",!EDITING);
  if(!EDITING)saveTileOrder();
});
$("arrange-reset").addEventListener("click",()=>{store("tile_order",null);applyTileOrder();saveTileOrder();});
applyTileOrder();route();
applyPlaceUi();renderSources();tick();setInterval(tick,1000);

refreshAll(true);
setInterval(()=>{if(!document.hidden)refreshAll(false);},10*60*1000);
setInterval(()=>{if(!document.hidden&&!busy){loadAutobahn();loadTomTom();}},3*60*1000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-lastRun>5*60*1000)refreshAll(false);});
if("serviceWorker" in navigator&&location.protocol==="https:"){navigator.serviceWorker.register("sw.js").catch(()=>{});}
})();
