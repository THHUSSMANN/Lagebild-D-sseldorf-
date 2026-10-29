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
const DUS={lat:51.2254,lon:6.7763,ars:"051110000000",ab:["A3","A44","A46","A52","A57","A59","A524","A535"],efa:"Düsseldorf Heinrich-Heine-Allee"};
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
  nina:{name:"NINA-Warn-App",prov:"BBK – Bevölkerungsschutz",url:"https://nina.api.bund.dev/",ep:"warnung.bund.de/api31"},
  dwd:{name:"Unwetterwarnungen",prov:"Bright Sky (DWD Open Data)",url:"https://brightsky.dev/docs/",ep:"api.brightsky.dev/alerts"},
  wx:{name:"Wetter & Vorhersage",prov:"Open-Meteo (u. a. DWD ICON)",url:"https://open-meteo.com/en/docs",ep:"api.open-meteo.com/v1/forecast"},
  dwdobs:{name:"Messwerte DWD-Station",prov:"Bright Sky (DWD Open Data)",url:"https://brightsky.dev/docs/",ep:"api.brightsky.dev/current_weather"},
  aq:{name:"Luftqualität (Modell)",prov:"Open-Meteo / Copernicus CAMS",url:"https://open-meteo.com/en/docs/air-quality-api",ep:"air-quality-api.open-meteo.com"},
  uba:{name:"Luftmessstationen",prov:"Umweltbundesamt",url:"https://luftdaten.umweltbundesamt.de/api/air-data/v3/doc",ep:"luftdaten.umweltbundesamt.de/api/air-data/v3"},
  pollen:{name:"Pollenflug",prov:"Deutscher Wetterdienst",url:"https://opendata.dwd.de/climate_environment/health/alerts/",ep:"opendata.dwd.de/…/s31fg.json"},
  pegel:{name:"Wasserstand",prov:"WSV – PEGELONLINE",url:"https://pegelonline.wsv.de/webservice/dokuRestapi",ep:"pegelonline.wsv.de/webservices/rest-api/v2"},
  ab:{name:"Autobahn: Staus, Sperrungen, Baustellen, Webcams, E-Laden",prov:"Autobahn GmbH des Bundes",url:"https://autobahn.api.bund.dev/",ep:"verkehr.autobahn.de/o/autobahn"},
  fuel:{name:"Spritpreise",prov:"Tankerkönig (MTS-K)",url:"https://creativecommons.tankerkoenig.de/",ep:"creativecommons.tankerkoenig.de/json/list.php"},
  efa:{name:"Abfahrten Nahverkehr (VRR)",prov:"VRR – EFA",url:"https://www.vrr.de/de/fahrplan/",ep:"efa.vrr.de/standard/XML_DM_REQUEST"},
  db:{name:"Abfahrten Bahn & Bus",prov:"db.transport.rest (DB-Daten)",url:"https://v6.db.transport.rest/",ep:"v6.db.transport.rest"},
  bike:{name:"Leihräder",prov:"nextbike",url:"https://www.nextbike.de/",ep:"maps.nextbike.net/maps/nextbike-live.json"},
  gw:{name:"Grundwasser Düsseldorf",prov:"Open Data Düsseldorf",url:"https://opendata.duesseldorf.de/",ep:"opendata.duesseldorf.de/api/3"},
  park:{name:"Parken Düsseldorf",prov:"Open Data Düsseldorf",url:"https://opendata.duesseldorf.de/",ep:"opendata.duesseldorf.de/api/3"},
  hol:{name:"Feiertage",prov:"Nager.Date",url:"https://date.nager.at/Api",ep:"date.nager.at/api/v3"},
  school:{name:"Schulferien",prov:"OpenHolidays API",url:"https://www.openholidaysapi.org/",ep:"openholidaysapi.org/SchoolHolidays"},
  strom:{name:"Strompreis & Ökostrom-Ampel",prov:"Energy-Charts (Fraunhofer ISE)",url:"https://api.energy-charts.info/",ep:"api.energy-charts.info"},
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
function setStatus(k,ok,msg){status[k]={ok,msg:msg||"",at:new Date()};renderSources();}
function distKm(a,b,c,d){const R=6371,r=Math.PI/180;const x=(c-a)*r,y=(d-b)*r;
  const h=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
const fact=(v,l)=>'<div class="fact"><b>'+v+'</b><span>'+l+'</span></div>';
const stateBox=(msg,links)=>'<div class="state">'+esc(msg)+(links?' '+links:'')+'</div>';
const link=(href,txt)=>'<a href="'+esc(href)+'" target="_blank" rel="noopener">'+esc(txt)+' ↗</a>';
function setKpi(id,val,note,cls){const el=$(id);if(!el)return;el.className="kpi "+(cls?"s-"+cls:"s-info");
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
let sel=String(load("sel")||"dus-1");
// Direktaufruf z. B. für Kurzbefehle: ?ort=duesseldorf | dus-3 | datteln | alpen | salzhausen | <Name eines eigenen Orts>
(function(){try{const q=new URLSearchParams(location.search).get("ort");if(!q)return;const v=q.trim().toLowerCase();
  if(/^(dus|duesseldorf|düsseldorf|mitte)$/.test(v))sel="dus-1";
  else if(/^dus-([1-9]|10)$/.test(v))sel=v;
  else{const p=[...FAVS,...CUSTOM].find(x=>x.key===v||x.name.toLowerCase()===v||x.name.toLowerCase().startsWith(v));if(p)sel="p-"+p.key;}
  store("sel",sel);}catch(e){}})();
let STOPS=load("stops")||{};
let ABSEL=load("absel")||{};   // Autobahn-Auswahl je eigenem Ort
let TK=load("tk")||"";
let WX=null,AQ=null,HOL=null,SCHOOL=null,PARK=load("park")||{},BIKE=null,OBS=null;
const theme=load("theme")||"";if(theme)document.documentElement.setAttribute("data-theme",theme);

function allPlaces(){return[...FAVS,...CUSTOM];}
function ctx(){
  if(sel.startsWith("dus-")){
    const n=Math.min(10,Math.max(1,parseInt(sel.slice(4),10)||1)),b=BEZIRKE[n-1];
    return {key:"dus",isDus:true,bezirk:b,name:n===1?"Düsseldorf Mitte":"Düsseldorf · "+b.name,town:"Düsseldorf",short:b.name,detail:b.detail,
      lat:b.lat,lon:b.lon,center:{lat:DUS.lat,lon:DUS.lon},state:"NW",ars:DUS.ars,ab:DUS.ab,efaDefault:DUS.efa,pollen:/Tiefland/,wxIdx:n-1};
  }
  const p=allPlaces().find(x=>"p-"+x.key===sel)||FAVS[0];
  const isFav=FAVS.includes(p);
  return {key:p.key,isDus:false,name:p.name,town:p.name,short:p.name,detail:p.detail||"",lat:p.lat,lon:p.lon,center:{lat:p.lat,lon:p.lon},
    state:p.state||"NW",ars:p.ars||null,ab:isFav?p.ab:(ABSEL[p.key]||[]),efaDefault:p.state==="NW"?(p.efa||p.name+" Bahnhof"):null,pollen:p.pollen||null,wxIdx:10};
}
let C=ctx();

// ================= Auswahlfeld =================
const selEl=$("bezirk");
function buildSelect(){
  selEl.innerHTML="";
  const g1=document.createElement("optgroup");g1.label="Düsseldorf";
  BEZIRKE.forEach(b=>{const o=document.createElement("option");o.value="dus-"+b.id;o.textContent=b.id===1?"Düsseldorf Mitte":"Bezirk "+b.id+" · "+b.name;g1.appendChild(o);});
  selEl.appendChild(g1);
  const g2=document.createElement("optgroup");g2.label="Meine Orte";
  allPlaces().forEach(p=>{const o=document.createElement("option");o.value="p-"+p.key;o.textContent=p.name;g2.appendChild(o);});
  const add=document.createElement("option");add.value="__add";add.textContent="+ Ort hinzufügen …";g2.appendChild(add);
  selEl.appendChild(g2);
  selEl.value=sel;if(selEl.value!==sel){sel="dus-1";selEl.value=sel;}
}
buildSelect();
selEl.addEventListener("change",()=>{
  if(selEl.value==="__add"){selEl.value=sel;location.hash="#einstellungen";setTimeout(()=>$("place-q").focus(),300);return;}
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
  ["wx-now","wx-24","wx-7","air","uba","pollen","pegel","stau-list","traffic","roadworks","webcams","charging","efa","dep","bike","fuel","news","cal","alerts"]
    .forEach(id=>{const el=$(id);if(el)el.innerHTML='<div class="state">wird geladen …</div>';});
  $("stau-sum").innerHTML="";
  ["k-temp","k-wx","k-wind","k-aq","k-rhein","k-warn","k-traffic"].forEach(id=>setKpi(id,"–","wird geladen"));
}
function applyPlaceUi(){
  document.querySelectorAll("[data-dus]").forEach(el=>el.hidden=!C.isDus);
  document.title="Lagebild "+C.town;
  $("warn-title").textContent="Warnungen für "+C.town+(C.isDus?"":" · "+(C.detail||""));
  $("stau-title").textContent="Staus & Behinderungen rund um "+C.town;
  $("ab-list").textContent=(C.ab.length?C.ab.join(" · "):"keine Autobahnen gewählt")+" · Umkreis "+JAM_RADIUS_KM+" km";
  $("rhein-sec").textContent=C.isDus?"Rhein & Grundwasser":"Gewässer";
  $("efa-card").hidden=!C.efaDefault;
  $("stop").value=STOPS[C.key]||C.efaDefault||"";
  $("stop-lbl").textContent="Haltestelle für Abfahrten in "+C.town;
  $("stop").disabled=!C.efaDefault;
  renderMine();
}

// ================= Einstellungen & Ortssuche =================
$("tk").value=TK;$("theme").value=theme;
$("stop-save").addEventListener("click",()=>{const v=$("stop").value.trim();if(!v||!C.efaDefault)return;STOPS[C.key]=v;store("stops",STOPS);loadEFA();});
$("stop").addEventListener("keydown",e=>{if(e.key==="Enter")$("stop-save").click();});
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
    buildSelect();if(sel==="p-"+k)choose("dus-1");else renderMine();}));
  box.querySelectorAll("[data-ab]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.ab;
    const v=($("ab-"+k).value||"").toUpperCase().split(/[\s,;]+/).map(x=>x.replace(/^(\d)/,"A$1")).filter(x=>/^A\d{1,3}$/.test(x));
    ABSEL[k]=[...new Set(v)];store("absel",ABSEL);if(C.key===k){C=ctx();applyPlaceUi();loadAutobahn();}else renderMine();}));
}

// ================= Wetter =================
function wxCoords(){const pts=BEZIRKE.map(b=>[b.lat,b.lon]);if(!C.isDus)pts.push([C.lat,C.lon]);return pts;}
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
  setKpi("k-temp",fmt(c.temperature_2m,1)+"<small> °C</small>","gefühlt "+fmt(c.apparent_temperature,1)+" °C · "+C.short);
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
  const base="https://luftdaten.umweltbundesamt.de/api/air-data/v3";
  try{
    let all=load("uba_all");
    if(!all||!all.length||!("lat" in all[0])){
      const d=await getJSON(base+"/stations/json?lang=de",25000);
      const ix=d.indices||[];const I=n=>ix.indexOf(n);
      const iId=Math.max(0,I("station id")),iCode=I("station code"),iName=I("station name"),iCity=I("station city"),iTo=I("station active to"),iLat=I("station latitude"),iLon=I("station longitude");
      all=Object.values(d.data||{}).filter(a=>Array.isArray(a)&&(iTo<0||!a[iTo])).map(a=>({id:a[iId],code:a[iCode>=0?iCode:1],name:a[iName>=0?iName:2],city:a[iCity>=0?iCity:3],lat:parseFloat(a[iLat>=0?iLat:8]),lon:parseFloat(a[iLon>=0?iLon:7])}))
        .filter(s=>isFinite(s.lat)&&isFinite(s.lon));
      store("uba_all",all);
    }
    const st=all.map(s=>({...s,km:distKm(C.center.lat,C.center.lon,s.lat,s.lon)})).filter(s=>s.km<=(C.isDus?12:30)).sort((a,b)=>a.km-b.km).slice(0,4);
    if(!st.length)throw new Error("keine Messstation im Umkreis von 30 km");
    const today=isoDay(),yest=isoDay(new Date(Date.now()-864e5));
    const res=await Promise.all(st.map(s=>getJSON(base+"/airquality/json?date_from="+yest+"&time_from=1&date_to="+today+"&time_to=24&station="+s.id+"&lang=de").then(d=>({s,d})).catch(()=>({s,d:null}))));
    const rows=[];
    res.forEach(({s,d})=>{if(!d||!d.data)return;const per=d.data[s.id]||d.data[String(s.id)]||Object.values(d.data)[0];if(!per)return;
      const keys=Object.keys(per).sort();const k=keys[keys.length-1];if(!k)return;const v=per[k];
      const comps={};v.slice(3).forEach(c=>{if(Array.isArray(c))comps[c[0]]={val:c[1],idx:c[2]};});
      rows.push({name:s.name,km:s.km,code:s.code,time:k,idx:v[1],comps});});
    if(!rows.length)throw new Error("keine aktuellen Messwerte");
    let r='<table><thead><tr><th>Station</th><th>Index</th><th class="num">NO₂</th><th class="num">PM10</th><th class="num">PM2,5</th><th class="num">O₃</th><th>Stand</th></tr></thead><tbody>';
    rows.forEach(x=>{const ii=UBA_IDX[x.idx]||["–",""];const cv=id=>x.comps[id]?fmt(x.comps[id].val):"–";
      r+='<tr><td><b>'+esc(x.name)+'</b><br><span class="muted small">'+fmt(x.km,1)+' km · '+esc(x.code)+'</span></td><td><span class="pill p-'+ii[1]+'"><i></i>'+ii[0]+'</span></td><td class="num">'+cv(5)+'</td><td class="num">'+cv(1)+'</td><td class="num">'+cv(9)+'</td><td class="num">'+cv(3)+'</td><td class="muted">'+esc(String(x.time).slice(11,16))+'</td></tr>';});
    $("uba").innerHTML='<div class="tbl-wrap">'+r+'</tbody></table></div><div class="muted small">Nächstgelegene Stationen, Stundenmittel in µg/m³, vorläufige Werte.</div>';
    setStatus("uba",true);
  }catch(e){setStatus("uba",false,errText(e));$("uba").innerHTML=stateBox("Messwerte nicht verfügbar – "+errText(e)+".",link("https://www.umweltbundesamt.de/daten/luft/luftdaten/luftqualitaet","UBA-Luftqualität"));}
}
const POLLEN_ORDER=["Hasel","Erle","Esche","Birke","Graeser","Roggen","Beifuss","Ambrosia"];
const POLLEN_DE={Graeser:"Gräser",Beifuss:"Beifuß"};
async function loadPollen(){
  try{const d=await getJSON("https://opendata.dwd.de/climate_environment/health/alerts/s31fg.json");
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
  BEZIRKE.forEach((b,i)=>{const w=WX[i];if(!w)return;const c=w.current,[tx,ik]=wmo(c.weather_code);const aq=AQ&&AQ[i]?AQ[i].current.european_aqi:null,q=eaqi(aq);
    r+='<tr class="click'+("dus-"+b.id===sel?" sel":"")+'" data-id="'+b.id+'" tabindex="0"><td><b>'+b.id+'</b> '+esc(b.name)+'</td><td>'+icon(ik)+' <span class="muted" style="font-size:13px">'+esc(tx)+'</span></td><td class="num"><b>'+fmt(c.temperature_2m,1)+'°</b></td><td class="num">'+fmt(c.apparent_temperature,1)+'°</td><td class="num">'+fmt(c.wind_speed_10m)+' / '+fmt(c.wind_gusts_10m)+'</td><td class="num">'+fmt(w.daily.precipitation_probability_max[0])+' %</td><td class="num">'+(aq==null?"–":'<span class="pill p-'+q.c+'"><i></i>'+fmt(aq)+'</span>')+'</td></tr>';});
  $("districts").innerHTML=r+'</tbody></table>';
  $("districts").querySelectorAll("tr.click").forEach(tr=>{const f=()=>choose("dus-"+tr.dataset.id,true);tr.addEventListener("click",f);tr.addEventListener("keydown",e=>{if(e.key==="Enter")f();});});
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
  const pN=(C.ars?getJSON("https://warnung.bund.de/api31/dashboard/"+C.ars+".json"):ninaByArea()).then(d=>{okN=true;
    (d||[]).forEach(a=>{const p=a.payload&&a.payload.data||{};if(String(p.provider).toUpperCase()==="DWD")return;
      out.push({src:"NINA · "+(p.provider||"BBK"),title:(a.i18nTitle&&a.i18nTitle.de)||p.headline,sev:p.severity,from:a.sent,id:a.id,nina:true});});
    setStatus("nina",true,C.ars?"":"Abgleich über Warngebiete");}).catch(e=>setStatus("nina",false,errText(e)));
  await Promise.all([pD,pN]);
  const order={extreme:4,severe:3,moderate:2,minor:1};
  out.sort((a,b)=>(b.nina?1:0)-(a.nina?1:0)||(order[String(b.sev).toLowerCase()]||0)-(order[String(a.sev).toLowerCase()]||0));
  const box=$("alerts");
  if(!okD&&!okN){box.innerHTML=stateBox("Warnungen konnten nicht geladen werden. Bitte direkt prüfen:",link("https://warnung.bund.de/meldungen","NINA")+" · "+link("https://www.dwd.de/DE/wetter/warnungen_gemeinden/warnWetter_node.html","DWD"));setKpi("k-warn","?","nicht geladen","warn");return;}
  const nN=out.filter(a=>a.nina).length;
  if(!out.length){box.innerHTML='<div class="state good">Keine aktiven NINA- oder DWD-Warnungen für '+esc(C.town)+'.'+((okD&&okN)?"":" ("+(!okN?"NINA":"DWD")+" nicht erreichbar)")+'</div>';setKpi("k-warn","0","keine aktiven Warnungen","ok");return;}
  const sc=s=>{s=String(s).toLowerCase();return s==="extreme"?"crit":s==="severe"?"bad":s==="moderate"?"warn":"info";};
  const sevDe={extreme:"extrem",severe:"Unwetter / schwer",moderate:"markant",minor:"Hinweis"};
  box.innerHTML=(okN?'':'<div class="state">NINA nicht erreichbar – nur DWD-Warnungen. '+link("https://warnung.bund.de/meldungen","NINA öffnen")+'</div>')+
    out.map(a=>'<div class="alert sev-'+sc(a.sev)+'"><h3>'+(a.nina?'<span class="pill" style="margin-right:6px">NINA</span>':'')+esc(a.title)+'</h3>'+
    (a.text?'<p>'+esc(a.text)+'</p>':'')+(a.instr?'<details><summary>Handlungsempfehlung</summary><p>'+esc(a.instr)+'</p></details>':'')+
    (a.id?'<div class="meta">'+link("https://warnung.bund.de/meldungen/"+encodeURIComponent(a.id),"Meldung mit Handlungsempfehlungen öffnen")+'</div>':'')+
    '<div class="meta">'+esc(a.src)+(a.sev?' · '+esc(sevDe[String(a.sev).toLowerCase()]||a.sev):'')+(a.from?' · ab '+dateTime(a.from):'')+(a.to?' bis '+dateTime(a.to):'')+'</div></div>').join("");
  const top=sc(out[0].sev);setKpi("k-warn",String(out.length),(nN?nN+" × NINA · ":"")+out[0].title,top==="info"?"warn":top);
}

// ================= Gewässer =================
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
    const sName=(st.longname||st.shortname||"").replace(/\b\w+/g,w=>w.charAt(0)+w.slice(1).toLowerCase());
    $("pegel-title").textContent="Pegel "+sName;
    $("pegel-src").textContent="WSV PEGELONLINE · "+wName+(st.km!=null?" · km "+fmt(st.km,1):"")+(!C.isDus&&st.km!=null?"":"");
    $("k-rhein-lbl").textContent="Pegel "+sName;
    const tr=cm.trend===1?"steigend ↑":cm.trend===-1?"fallend ↓":"gleichbleibend →";
    const stateDe={low:"Niedrigwasser (unter MNW)",normal:"Mittelwasserbereich",high:"Hochwasser (über MHW)",unknown:"ohne Einstufung"}[cm.stateMnwMhw]||"";
    const cls=cm.stateMnwMhw==="high"?"bad":cm.stateMnwMhw==="low"?"warn":"ok";
    setKpi("k-rhein",fmt(cm.value)+"<small> "+esc(ts.unit||"cm")+"</small>",tr+(stateDe?" · "+stateDe:""),cls);
    let html='<div class="row"><div><div class="big">'+fmt(cm.value)+'<span style="font-size:22px"> '+esc(ts.unit||"cm")+'</span></div><div class="muted">'+esc(wName)+' · '+tr+(cm.timestamp?' · '+hhmm(cm.timestamp)+' Uhr':'')+'</div></div><span class="pill p-'+cls+'"><i></i>'+esc(stateDe||"–")+'</span></div>';
    if(Array.isArray(hist)&&hist.length>2)html+=spark(hist);
    const vals=Array.isArray(hist)?hist.map(h=>h.value):[];
    html+='<div class="facts">'+(wt&&wt.currentMeasurement?fact(fmt(wt.currentMeasurement.value,1)+" °C","Wassertemperatur"):"")+
      fact(vals.length?fmt(Math.min(...vals))+" – "+fmt(Math.max(...vals)):"–","Spanne 7 Tage")+
      fact(vals.length?(cm.value-vals[0]>0?"+":"")+fmt(cm.value-vals[0]):"–","Änderung 7 Tage")+
      (!C.isDus&&st.km!=null?fact(fmt(distKm(C.lat,C.lon,st.latitude,st.longitude),0)+" km","Entfernung"):"")+'</div>'+
      (C.isDus?'<div class="muted small">Hochwassermarken Düsseldorf: I = 710 cm, II = 830 cm. Schifffahrt: '+link("https://www.elwis.de/","ELWIS")+'</div>':'<div class="muted small">Nächster Pegel der Bundeswasserstraßen. Landesgewässer: '+link("https://www.hochwasserzentralen.de/","Hochwasserzentralen")+'</div>');
    $("pegel").innerHTML=html;setStatus("pegel",true);
  }catch(e){setStatus("pegel",false,errText(e));$("pegel").innerHTML=stateBox("Pegel nicht verfügbar – "+errText(e)+".",link("https://www.pegelonline.wsv.de/gast/start","PEGELONLINE"));setKpi("k-rhein","–","kein Pegel","info");}
}
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
  const jobs=[["ph","Parkhäuser Düsseldorf"],["pr","Park and Ride Anlagen Düsseldorf"],["bh","Behindertenparkplätze Düsseldorf"]];
  let anyOk=false,err="";
  await Promise.all(jobs.map(async([k,q])=>{
    try{const {url}=await oddResource(q);const j=await getJSON(url,20000);PARK[k]=normalizePlaces(j);anyOk=true;}catch(e){err=errText(e);}
  }));
  if(anyOk){store("park",PARK);setStatus("park",true,err?"teilweise":"");}else setStatus("park",false,err);
  renderParking();
}
function renderParking(){
  if(!C.isDus)return;
  const box=(id,list,label)=>{
    if(!list||!list.length){$(id).innerHTML=stateBox(label+" nicht verfügbar"+(status.park&&!status.park.ok?" – "+status.park.msg:"")+".",link("https://opendata.duesseldorf.de/","Open Data Düsseldorf"));return;}
    const s=list.map(p=>({...p,km:distKm(C.lat,C.lon,p.lat,p.lon)})).sort((x,y)=>x.km-y.km).slice(0,6);
    $(id).innerHTML='<div class="list">'+s.map(p=>'<div class="li"><span class="tag alt">'+fmt(p.km,1)+' km</span><div class="t">'+esc(p.name||p.addr||"Standort")+'</div>'+
      '<div class="r">'+(p.anz!=null&&p.anz!==""?esc(p.anz)+" Pl.":"")+'</div><div class="d">'+esc([p.addr,p.ort].filter(Boolean).join(", "))+(p.note?" · "+esc(p.note):"")+
      ' · <a href="https://maps.apple.com/?daddr='+p.lat+','+p.lon+'" target="_blank" rel="noopener">Route</a></div></div>').join("")+'</div>'+
      '<div class="muted small">'+list.length+' Standorte insgesamt · nächste zu '+esc(C.short)+'</div>';
  };
  box("park-ph",PARK.ph,"Parkhäuser");box("park-pr",PARK.pr,"P+R-Anlagen");box("park-bh",PARK.bh,"Behindertenparkplätze");
}
async function loadGW(){
  try{
    const {url}=await oddResource("Grundwassermessstellen Düsseldorf",/online|pegel|statist/i);
    const j=await getJSON(url,20000);
    let arr=Array.isArray(j)?j:(j.data||j.results||j.features||Object.values(j).find(Array.isArray)||[]);
    arr=arr.map(x=>x&&x.properties?x.properties:x);
    if(!arr.length)throw new Error("keine Einträge");
    const k=(o,re)=>{const kk=Object.keys(o).find(z=>re.test(z));return kk?o[kk]:undefined;};
    const rows=arr.map(o=>({nr:k(o,/brunnen|bnr|nummer/i),ort:k(o,/standort|strasse|straße/i),teil:k(o,/stadtteil/i),ws:k(o,/wasserstand/i),temp:k(o,/temp/i),last:k(o,/max_mess|letzte|datum/i)}));
    const latest=rows.map(r=>r.last).filter(Boolean).sort().pop();
    let r='<table><thead><tr><th>Brunnen</th><th>Standort</th><th class="num">Ø Wasserstand</th><th class="num">Ø Temp.</th><th>letzte Messung</th></tr></thead><tbody>';
    rows.slice(0,30).forEach(x=>{r+='<tr><td><b>'+esc(x.nr)+'</b></td><td>'+esc(x.ort||x.teil||"")+'</td><td class="num">'+(x.ws!=null?fmt(x.ws,2):"–")+'</td><td class="num">'+(x.temp!=null?fmt(x.temp,1)+" °C":"–")+'</td><td class="muted">'+esc(x.last?String(x.last).slice(0,16):"")+'</td></tr>';});
    $("gw").innerHTML='<div class="facts">'+fact(String(rows.length),"Online-Messstellen")+fact(latest?esc(String(latest).slice(0,10)):"–","jüngster Messwert")+'</div><div class="tbl-wrap">'+r+'</tbody></table></div>';
    setStatus("gw",true);
  }catch(e){setStatus("gw",false,errText(e));$("gw").innerHTML=stateBox("Grundwasserdaten nicht verfügbar – "+errText(e)+".",link("https://opendata.duesseldorf.de/dataset/grundwassermessstellen-d%C3%BCsseldorf","Datensatz öffnen"));}
}

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
function ensureMap(){
  if(typeof L==="undefined")return null;
  if(!MAP){
    MAP=L.map("stau-map",{scrollWheelZoom:false}).setView([C.center.lat,C.center.lon],10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:17,subdomains:"abc",attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(MAP);
    MAPLAYER=L.layerGroup().addTo(MAP);
  }
  if(MAPRING)MAPRING.remove();if(MAPCENTER)MAPCENTER.remove();
  MAPRING=L.circle([C.center.lat,C.center.lon],{radius:JAM_RADIUS_KM*1000,color:"#8a9aa5",weight:1,dashArray:"4 6",fill:false,interactive:false}).addTo(MAP);
  MAPCENTER=L.circleMarker([C.center.lat,C.center.lon],{radius:5,color:"#14212b",weight:2,fillColor:"#fff",fillOpacity:1}).bindTooltip(C.town).addTo(MAP);
  MAP.setView([C.center.lat,C.center.lon],10);
  return MAP;
}
function popupHtml(i,extra){
  return '<b>'+esc(i.ab)+' · '+esc(i.title||"")+'</b><br>'+esc(i.subtitle||"")+(extra?'<br>'+extra:'')+
    ((i.description||[]).filter(Boolean).length?'<br><span style="color:#5b6a75">'+esc((i.description||[]).filter(Boolean).slice(0,4).join(" · "))+'</span>':'');
}
async function loadAutobahn(){
  const roads=C.ab;
  if(!roads.length){
    const msg='<div class="state">Für '+esc(C.town)+' sind noch keine Autobahnen hinterlegt. <a href="#einstellungen">Unter Einstellungen → Meine Orte eintragen</a>, z. B. „A1, A43“.</div>';
    ["stau-list","traffic","roadworks","webcams","charging"].forEach(id=>$(id).innerHTML=msg);$("stau-sum").innerHTML="";setKpi("k-traffic","–","keine Autobahnen gewählt","info");
    if(ensureMap())MAPLAYER.clearLayers();return;}
  const svcs=["warning","closure","roadworks","webcam","electric_charging_station"];
  const got={};svcs.forEach(s=>got[s]=[]);let ok=0,total=0;const cLat=C.center.lat,cLon=C.center.lon,keyAtStart=C.key;
  await Promise.all(roads.flatMap(ab=>svcs.map(async svc=>{
    total++;
    try{const d=await getJSON("https://verkehr.autobahn.de/o/autobahn/"+encodeURIComponent(ab)+"/services/"+svc,20000);ok++;
      const lim=(svc==="warning"||svc==="closure")?JAM_RADIUS_KM:RADIUS_KM;
      (d[svc]||[]).forEach(w=>{const c=w.coordinate||{};const km=distKm(cLat,cLon,parseFloat(c.lat),parseFloat(c.long));
        if(isFinite(km)&&km<=lim)got[svc].push({...w,ab,km,lat:parseFloat(c.lat),lon:parseFloat(c.long)});});
    }catch(e){}
  })));
  if(keyAtStart!==C.key)return; // Ort inzwischen gewechselt
  if(!ok){setStatus("ab",false,"nicht erreichbar oder vom Browser blockiert (CORS)");
    const fb=stateBox("Die Autobahn-Schnittstelle antwortet nicht.",link("https://www.autobahn.de/","autobahn.de"));
    ["stau-list","traffic","roadworks","webcams","charging"].forEach(id=>$(id).innerHTML=fb);$("stau-sum").innerHTML="";setKpi("k-traffic","?","nicht geladen","warn");return;}
  setStatus("ab",true,ok<total?"teilweise geladen ("+ok+"/"+total+")":"");
  const uniq=list=>{const seen=new Set();return list.filter(i=>{const k=i.ab+"|"+i.title+"|"+i.subtitle+"|"+(i.identifier||"");if(seen.has(k))return false;seen.add(k);return true;});};
  const desc=w=>(w.description||[]).filter(Boolean).slice(0,3).join(" · ");
  const isClosed=m=>m._c||m.isBlocked==="true"||m.isBlocked===true;
  const warnings=uniq(got.warning);
  const jams=warnings.map(w=>({...w,jam:jamInfo(w)})).filter(w=>w.jam)
    .sort((a,b)=>(b.jam.kind==="stau")-(a.jam.kind==="stau")||(b.jam.delay||0)-(a.jam.delay||0)||a.km-b.km);
  const closuresAll=uniq([...got.closure.map(x=>({...x,_c:1})),...warnings.filter(w=>w.isBlocked==="true"||w.isBlocked===true)]);
  const maxDelay=jams.reduce((m,j)=>Math.max(m,j.jam.delay||0),0);
  const totLen=jams.reduce((s,j)=>s+(j.jam.len||0),0);
  const nStau=jams.filter(j=>j.jam.kind==="stau").length;
  const others=warnings.filter(w=>!w.jam&&!jamInfo(w)).length;
  setKpi("k-traffic",String(jams.length),jams.length?(maxDelay?"bis +"+maxDelay+" min":"")+(totLen?" · "+fmt(totLen,1)+" km":"")+(closuresAll.length?" · "+closuresAll.length+" Sperrung(en)":""):"freie Fahrt"+(closuresAll.length?" · "+closuresAll.length+" Sperrung(en)":""),
    nStau?(maxDelay>=20?"bad":"warn"):jams.length?"warn":"ok");
  $("stau-sum").innerHTML=fact(String(nStau),"Staus")+fact(String(jams.length-nStau),"stockender Verkehr")+fact(totLen?fmt(totLen,1)+" km":"–","Staulänge gesamt")+fact(maxDelay?"+"+maxDelay+" min":"–","größte Verzögerung")+fact(String(closuresAll.length),"Sperrungen")+fact(String(others),"weitere Behinderungen");
  $("stau-list").innerHTML=jams.length?'<div>'+jams.map(j=>{const J=j.jam;
      const det=[J.len?fmt(J.len,1)+" km":"",J.speed!=null?"Ø "+J.speed+" km/h":"",fmt(j.km)+" km entfernt"].filter(Boolean).join(" · ");
      return '<div class="jam"><span class="tag ab">'+esc(j.ab)+'</span><div class="t">'+(J.kind==="stau"?'<span class="pill p-bad" style="margin-right:6px"><i></i>Stau</span>':'<span class="pill p-warn" style="margin-right:6px"><i></i>stockend</span>')+esc(j.title)+'</div>'+
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
    setTimeout(()=>MAP.invalidateSize(),50);
  }else{$("stau-map").innerHTML='<div class="state" style="margin:12px">Kartenbibliothek nicht geladen – die Liste darunter ist vollständig.</div>';}
  const jamIds=new Set(jams.map(j=>j.ab+"|"+j.title+"|"+j.subtitle+"|"+(j.identifier||"")));
  const msgs=uniq([...got.closure.map(x=>({...x,_c:1})),...warnings]).filter(m=>!jamIds.has(m.ab+"|"+m.title+"|"+m.subtitle+"|"+(m.identifier||"")))
    .sort((a,b)=>(isClosed(b)?1:0)-(isClosed(a)?1:0)||a.km-b.km);
  $("traffic").innerHTML=msgs.length?'<div class="list">'+msgs.slice(0,15).map(i=>'<div class="li"><span class="tag ab">'+esc(i.ab)+'</span><div class="t">'+
    (isClosed(i)?'<span class="pill p-bad" style="margin-right:6px"><i></i>Sperrung</span>':'')+esc(i.title)+'</div><div class="r muted small">'+fmt(i.km)+' km</div><div class="d">'+esc(i.subtitle||"")+(desc(i)?" – "+esc(desc(i)):"")+'</div></div>').join("")+'</div>'+
    (msgs.length>15?'<div class="muted small">+ '+(msgs.length-15)+' weitere</div>':''):'<div class="state good">Keine weiteren Behinderungen im Umkreis.</div>';
  const rw=uniq(got.roadworks).sort((a,b)=>a.km-b.km);
  $("roadworks").innerHTML=rw.length?'<div class="list">'+rw.slice(0,12).map(i=>'<div class="li"><span class="tag ab">'+esc(i.ab)+'</span><div class="t">'+esc(i.title)+'</div><div class="r muted small">'+fmt(i.km)+' km</div><div class="d">'+esc(i.subtitle||"")+(desc(i)?" – "+esc(desc(i)):"")+'</div></div>').join("")+'</div>'+
    '<div class="muted small">'+rw.length+' Baustellen im Umkreis von '+RADIUS_KM+' km</div>':'<div class="state good">Keine Baustellen im Umkreis.</div>';
  const cams=uniq(got.webcam).filter(c=>c.imageurl).sort((a,b)=>a.km-b.km).slice(0,12);
  $("webcams").innerHTML=cams.length?'<div class="cams">'+cams.map(c=>'<a class="cam" href="'+esc(safeUrl(c.linkurl||c.imageurl))+'" target="_blank" rel="noopener"><img loading="lazy" alt="Webcam '+esc(c.title)+'" src="'+esc(safeUrl(c.imageurl))+'"><span><b>'+esc(c.ab)+'</b> '+esc(c.subtitle||c.title)+'</span></a>').join("")+'</div>':stateBox("Keine Webcams im Umkreis gefunden.");
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
async function loadEFA(){
  if(!C.efaDefault){setStatus("efa",true,"nicht im VRR-Gebiet");return;}
  const stop=STOPS[C.key]||C.efaDefault;
  $("efa-title").textContent="Abfahrten "+stop.replace(/^Düsseldorf[, ]*/,"");
  const url="https://efa.vrr.de/standard/XML_DM_REQUEST?outputFormat=rapidJSON&language=de&type_dm=any&name_dm="+encodeURIComponent(stop)+
    "&mode=direct&useRealtime=1&limit=14&itdDateTimeDepArr=dep&useAllStops=1";
  try{const d=await getJSON(url,20000);
    const ev=d.stopEvents||[];
    const locName=(d.locations&&d.locations[0]&&(d.locations[0].disassembledName||d.locations[0].name))||stop;
    if(!ev.length){$("efa").innerHTML=stateBox("Keine Abfahrten gefunden. Ist die Haltestelle „"+stop+"“ eindeutig? Unter Einstellungen anpassen.");setStatus("efa",true,"keine Treffer");return;}
    $("efa").innerHTML='<div class="muted small">'+esc(locName)+'</div><div class="tbl-wrap">'+depTable(ev.map(e=>{const t=e.transportation||{};
      return {planned:e.departureTimePlanned,est:e.departureTimeEstimated,line:t.disassembledName||t.number||t.name||"",dir:t.destination&&t.destination.name||"",
        plat:e.location&&e.location.properties&&(e.location.properties.platform||e.location.properties.platformName)||"",cancelled:(e.realtimeStatus||[]).includes("TRIP_CANCELLED")||e.isCancelled};}))+'</div>';
    setStatus("efa",true);
  }catch(e){setStatus("efa",false,errText(e));$("efa").innerHTML=stateBox("Abfahrten nicht verfügbar – "+errText(e)+".",link("https://www.vrr.de/de/fahrplanauskunft/","VRR-Auskunft"));}
}
function depTable(rows){
  let r='<table><thead><tr><th>Zeit</th><th>Linie</th><th>Richtung</th><th class="num">Gleis/Steig</th><th class="num">+min</th></tr></thead><tbody>';
  rows.forEach(x=>{const del=x.delay!=null?x.delay:(x.planned&&x.est?Math.round((new Date(x.est)-new Date(x.planned))/6e4):null);
    r+='<tr><td><b>'+(x.planned?hhmm(x.planned):"–")+'</b></td><td><span class="tag">'+esc(x.line)+'</span></td><td class="wrap-txt">'+esc(x.dir)+'</td><td class="num">'+esc(x.plat||"")+'</td><td class="num">'+
      (x.cancelled?'<span class="pill p-bad"><i></i>fällt aus</span>':del==null?'<span class="muted">–</span>':del>0?'<span style="color:var(--bad);font-weight:600">+'+del+'</span>':'<span style="color:var(--ok)">0</span>')+'</td></tr>';});
  return r+'</tbody></table>';
}
async function loadDep(){
  try{
    let stopId="8000085",stopName="Düsseldorf Hbf",dist=null;
    if(!C.isDus){
      const near=await getJSON("https://v6.db.transport.rest/locations/nearby?latitude="+C.lat+"&longitude="+C.lon+"&results=6&distance=3000&stops=true&poi=false&language=de",15000);
      const s=(near||[]).find(x=>x.type==="stop"||x.type==="station");
      if(!s)throw new Error("keine Haltestelle im Umkreis von 3 km");
      stopId=s.id;stopName=s.name;dist=s.distance;
    }
    $("dep-title").textContent=stopName+(C.isDus?" · Bahn":" · Bahn & Bus");
    const d=await getJSON("https://v6.db.transport.rest/stops/"+encodeURIComponent(stopId)+"/departures?duration=60&results=12&language=de"+(C.isDus?"&bus=false&tram=false&subway=false":""),15000);
    const deps=(d.departures||d||[]);
    if(!deps.length){$("dep").innerHTML=stateBox("Keine Abfahrten in der nächsten Stunde.");setStatus("db",true);return;}
    $("dep").innerHTML=(dist!=null?'<div class="muted small">nächste Haltestelle, '+fmt(dist)+' m entfernt</div>':'')+'<div class="tbl-wrap">'+depTable(deps.map(x=>({planned:x.plannedWhen||x.when,delay:x.delay!=null?Math.round(x.delay/60):null,line:x.line&&x.line.name,dir:x.direction,plat:x.platform||x.plannedPlatform,cancelled:x.cancelled})))+'</div>';
    setStatus("db",true);
  }catch(e){setStatus("db",false,errText(e));$("dep").innerHTML=stateBox("Abfahrten nicht verfügbar – "+errText(e)+".",link("https://www.bahn.de/","bahn.de"));}
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
  renderCal();
}
function renderCal(){
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
  $("cal").innerHTML=html||stateBox("wird geladen …");
}
function isoWeek(d){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y)/864e5+1)/7);}

// ================= Strom =================
async function loadStrom(){
  try{
    const day=isoDay(),tom=isoDay(new Date(Date.now()+864e5));
    const [pr,sig]=await Promise.all([getJSON("https://api.energy-charts.info/price?bzn=DE-LU&start="+day+"&end="+tom),getJSON("https://api.energy-charts.info/signal?country=de").catch(()=>null)]);
    const ts=pr.unix_seconds||[],pv=pr.price||[];const now=Date.now()/1000;
    let ci=-1;ts.forEach((t,i)=>{if(t<=now)ci=i;});const cur=ci>=0?pv[ci]:null;
    let share=null,signal=null;
    if(sig&&sig.unix_seconds){let si=-1;sig.unix_seconds.forEach((t,i)=>{if(t<=now)si=i;});if(si>=0){share=sig.share&&sig.share[si];signal=sig.signal&&sig.signal[si];}}
    const sigTxt={"-1":["Netzengpass","bad"],"0":["wenig Ökostrom","bad"],"1":["mittel","warn"],"2":["viel Ökostrom","ok"]}[String(signal)]||["–",""];
    setKpi("k-strom",fmt(cur!=null?cur/10:null,1)+"<small> ct/kWh</small>",share!=null?"Ökostrom "+fmt(share)+" % · "+sigTxt[0]:"Börsenpreis Day-Ahead",sigTxt[1]||"info");
    const pts=[];ts.forEach((t,i)=>{if(isoDay(new Date(t*1000))===day&&pv[i]!=null)pts.push([t,pv[i]/10]);});
    let chart="";
    if(pts.length>2){
      const W=640,H=170,pl=40,pr2=8,pt=12,pb=24,iw=W-pl-pr2,ih=H-pt-pb;
      let mn=Math.min(0,...pts.map(p=>p[1])),mx=Math.max(...pts.map(p=>p[1]));if(mx-mn<5)mx=mn+5;
      const t0=pts[0][0],t1=pts[pts.length-1][0];const x=t=>pl+(t-t0)/(t1-t0||1)*iw,y=v=>pt+ih-(v-mn)/(mx-mn)*ih;
      chart='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Börsenstrompreis heute">';
      [mn,(mn+mx)/2,mx].forEach(g=>{chart+='<line x1="'+pl+'" x2="'+(W-pr2)+'" y1="'+y(g)+'" y2="'+y(g)+'" stroke="var(--line)"/><text x="'+(pl-6)+'" y="'+(y(g)+4)+'" text-anchor="end">'+fmt(g)+'</text>';});
      if(mn<0)chart+='<line x1="'+pl+'" x2="'+(W-pr2)+'" y1="'+y(0)+'" y2="'+y(0)+'" stroke="var(--muted)" stroke-dasharray="3 3"/>';
      let d="";pts.forEach((p,i)=>{d+=(i?"H"+x(p[0]).toFixed(1)+"V":"M"+x(p[0]).toFixed(1)+" ")+y(p[1]).toFixed(1);});d+="H"+(W-pr2);
      chart+='<path d="'+d+'" fill="none" stroke="var(--accent)" stroke-width="2"/>';
      if(now>=t0&&now<=t1+3600)chart+='<line x1="'+x(Math.min(now,t1))+'" x2="'+x(Math.min(now,t1))+'" y1="'+pt+'" y2="'+(pt+ih)+'" stroke="var(--warn)" stroke-width="1.5"/>';
      [0,6,12,18].forEach(hh=>{const tt=pts.find(p=>new Date(p[0]*1000).toLocaleTimeString("de-DE",{...TZ,hour:"2-digit"})===String(hh).padStart(2,"0"));if(tt)chart+='<text x="'+x(tt[0])+'" y="'+(H-6)+'" text-anchor="middle">'+String(hh).padStart(2,"0")+':00</text>';});
      chart+='</svg>';
      const minP=pts.reduce((a,b)=>b[1]<a[1]?b:a),maxP=pts.reduce((a,b)=>b[1]>a[1]?b:a);
      chart+='<div class="facts">'+fact(fmt(minP[1],1)+" ct","günstigste Stunde "+hhmm(minP[0]*1000))+fact(fmt(maxP[1],1)+" ct","teuerste Stunde "+hhmm(maxP[0]*1000))+(share!=null?fact(fmt(share)+" %","Ökostromanteil jetzt"):"")+'</div>';
    }
    $("strom").innerHTML='<div class="row"><div><div class="big">'+fmt(cur!=null?cur/10:null,1)+'<span style="font-size:20px"> ct/kWh</span></div><div class="muted">Börsenpreis jetzt (ohne Steuern und Netzentgelte)</div></div>'+(signal!=null?'<span class="pill p-'+sigTxt[1]+'"><i></i>'+sigTxt[0]+'</span>':'')+'</div>'+chart;
    setStatus("strom",true);
  }catch(e){setStatus("strom",false,errText(e));$("strom").innerHTML=stateBox("Strompreis nicht verfügbar – "+errText(e)+".",link("https://www.energy-charts.info/","Energy-Charts"));}
}

// ================= Nachrichten =================
async function loadNews(){
  const reg=NEWS_REGION[C.state]||10;
  try{const d=await getJSON("https://www.tagesschau.de/api2u/news/?regions="+reg);
    const n=(d.news||[]).filter(x=>x.title);
    if(!n.length)throw new Error("keine Meldungen");
    $("news").innerHTML='<div class="sublbl">'+esc(STATE_NAME[C.state]||"")+'</div><div class="list">'+n.slice(0,8).map(x=>'<div class="li" style="grid-template-columns:1fr auto"><a class="t" href="'+esc(safeUrl(x.shareURL||x.detailsweb))+'" target="_blank" rel="noopener">'+esc(x.title)+'</a><span class="r muted small">'+(x.date?hhmm(x.date):"")+'</span>'+
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
}

// ================= Ablauf =================
let busy=false,lastSlow=0,slowKey="";
async function refreshAll(force){
  if(busy){pending=true;return;}busy=true;const btn=$("refresh");btn.disabled=true;btn.textContent="Lädt …";
  const tasks=[loadAlerts(),loadWeather(),loadObs(),loadAir(),loadRhein(),loadAutobahn(),loadEFA(),loadDep(),loadBike(),loadFuel(),loadStrom(),loadNews()];
  if(force||Date.now()-lastSlow>3600e3||slowKey!==C.key){
    lastSlow=Date.now();slowKey=C.key;
    tasks.push(loadUBA(),loadPollen(),loadHol());
    if(C.isDus)tasks.push(loadParking(),loadGW());
  }
  await Promise.allSettled(tasks);
  $("updated").textContent=C.name+" · zuletzt aktualisiert "+new Date().toLocaleString("de-DE",{...TZ,dateStyle:"medium",timeStyle:"short"})+" · Staus alle 3, Rest alle 10 Minuten";
  btn.disabled=false;btn.textContent="Aktualisieren";busy=false;lastRun=Date.now();
  if(pending){pending=false;refreshAll(true);}
}
let pending=false,lastRun=0;
function tick(){$("clock").textContent=new Date().toLocaleTimeString("de-DE",{...TZ,hour:"2-digit",minute:"2-digit"});
  $("sub").textContent=new Date().toLocaleDateString("de-DE",{...TZ,weekday:"long",day:"numeric",month:"long",year:"numeric"})+" · KW "+isoWeek(new Date());}
$("refresh").addEventListener("click",()=>refreshAll(true));
applyPlaceUi();renderSources();tick();setInterval(tick,15000);
if(C.isDus&&(PARK.ph||PARK.pr||PARK.bh))renderParking();
refreshAll(true);
setInterval(()=>{if(!document.hidden)refreshAll(false);},10*60*1000);
setInterval(()=>{if(!document.hidden&&!busy)loadAutobahn();},3*60*1000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-lastRun>5*60*1000)refreshAll(false);});
if("serviceWorker" in navigator&&location.protocol==="https:"){navigator.serviceWorker.register("sw.js").catch(()=>{});}
})();
