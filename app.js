/* Lagebild Düsseldorf – © Thomas Hußmann
   Ruft ausschließlich offene Schnittstellen direkt aus dem Browser ab. */
(function(){
"use strict";

// ================= Grunddaten =================
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
const CENTER={lat:51.2254,lon:6.7763};
const ARS="051110000000";
const AUTOBAHNEN=["A3","A44","A46","A52","A57","A59"];
const RADIUS_KM=20;
const SRC={
  wx:{name:"Wetter & Vorhersage",prov:"Open-Meteo (u. a. DWD ICON)",url:"https://open-meteo.com/en/docs",ep:"api.open-meteo.com/v1/forecast"},
  dwdobs:{name:"Messwerte DWD-Station",prov:"Bright Sky (DWD Open Data)",url:"https://brightsky.dev/docs/",ep:"api.brightsky.dev/current_weather"},
  dwd:{name:"Unwetterwarnungen",prov:"Bright Sky (DWD Open Data)",url:"https://brightsky.dev/docs/",ep:"api.brightsky.dev/alerts"},
  nina:{name:"Bevölkerungswarnungen",prov:"BBK – NINA",url:"https://nina.api.bund.dev/",ep:"warnung.bund.de/api31/dashboard"},
  aq:{name:"Luftqualität (Modell)",prov:"Open-Meteo / Copernicus CAMS",url:"https://open-meteo.com/en/docs/air-quality-api",ep:"air-quality-api.open-meteo.com"},
  uba:{name:"Luftmessstationen",prov:"Umweltbundesamt",url:"https://luftdaten.umweltbundesamt.de/api/air-data/v3/doc",ep:"luftdaten.umweltbundesamt.de/api/air-data/v3"},
  pollen:{name:"Pollenflug",prov:"Deutscher Wetterdienst",url:"https://opendata.dwd.de/climate_environment/health/alerts/",ep:"opendata.dwd.de/…/s31fg.json"},
  pegel:{name:"Rheinpegel",prov:"WSV – PEGELONLINE",url:"https://pegelonline.wsv.de/webservice/dokuRestapi",ep:"pegelonline.wsv.de/webservices/rest-api/v2"},
  gw:{name:"Grundwasser",prov:"Open Data Düsseldorf",url:"https://opendata.duesseldorf.de/",ep:"opendata.duesseldorf.de/api/3"},
  ab:{name:"Autobahn: Meldungen, Baustellen, Webcams, Laden",prov:"Autobahn GmbH des Bundes",url:"https://autobahn.api.bund.dev/",ep:"verkehr.autobahn.de/o/autobahn"},
  fuel:{name:"Spritpreise",prov:"Tankerkönig (MTS-K)",url:"https://creativecommons.tankerkoenig.de/",ep:"creativecommons.tankerkoenig.de/json/list.php"},
  efa:{name:"Abfahrten Nahverkehr",prov:"VRR – EFA",url:"https://www.vrr.de/de/fahrplan/",ep:"efa.vrr.de/standard/XML_DM_REQUEST"},
  db:{name:"Abfahrten Bahn",prov:"db.transport.rest",url:"https://v6.db.transport.rest/",ep:"v6.db.transport.rest"},
  bike:{name:"Leihräder",prov:"nextbike",url:"https://www.nextbike.de/duesseldorf/",ep:"maps.nextbike.net/maps/nextbike-live.json"},
  park:{name:"Parkhäuser, P+R, Behindertenparkplätze",prov:"Open Data Düsseldorf",url:"https://opendata.duesseldorf.de/",ep:"opendata.duesseldorf.de/api/3"},
  hol:{name:"Feiertage",prov:"Nager.Date",url:"https://date.nager.at/Api",ep:"date.nager.at/api/v3"},
  school:{name:"Schulferien NRW",prov:"OpenHolidays API",url:"https://www.openholidaysapi.org/",ep:"openholidaysapi.org/SchoolHolidays"},
  strom:{name:"Strompreis & Ökostrom-Ampel",prov:"Energy-Charts (Fraunhofer ISE)",url:"https://api.energy-charts.info/",ep:"api.energy-charts.info"},
  news:{name:"Nachrichten NRW",prov:"tagesschau",url:"https://tagesschau.api.bund.dev/",ep:"tagesschau.de/api2u/news"}
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
    const txt=await r.text();return JSON.parse(txt);}
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
const bez=()=>BEZIRKE.find(b=>b.id===sel)||BEZIRKE[0];

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

// ================= Zustand & Einstellungen =================
let sel=Number(load("bezirk"))||1;
let WX=load("wx"),AQ=load("aq"),HOL=load("hol"),SCHOOL=load("school"),PARK=load("park")||{},BIKE=null,FUEL=null;
let STOP=load("stop")||"Düsseldorf Heinrich-Heine-Allee";
let TK=load("tk")||"";
const theme=load("theme")||"";if(theme)document.documentElement.setAttribute("data-theme",theme);

const selEl=$("bezirk");
BEZIRKE.forEach(b=>{const o=document.createElement("option");o.value=b.id;o.textContent=(b.id===1?"Düsseldorf ":"")+b.name;selEl.appendChild(o);});
selEl.value=sel;
selEl.addEventListener("change",()=>pick(Number(selEl.value),false));
function pick(id,scroll){sel=id;selEl.value=id;store("bezirk",id);
  renderWeather();renderAir();renderParking();renderBike();loadFuel();
  if(scroll)window.scrollTo({top:0,behavior:"smooth"});}

$("stop").value=STOP;$("tk").value=TK;$("theme").value=theme;
$("stop-save").addEventListener("click",()=>{const v=$("stop").value.trim();if(!v)return;STOP=v;store("stop",v);loadEFA();});
$("stop").addEventListener("keydown",e=>{if(e.key==="Enter")$("stop-save").click();});
$("tk-save").addEventListener("click",()=>{TK=$("tk").value.trim();store("tk",TK);loadFuel();});
$("theme").addEventListener("change",e=>{const v=e.target.value;store("theme",v);
  if(v)document.documentElement.setAttribute("data-theme",v);else document.documentElement.removeAttribute("data-theme");});

// ================= Wetter =================
async function loadWeather(){
  const lat=BEZIRKE.map(b=>b.lat).join(","),lon=BEZIRKE.map(b=>b.lon).join(",");
  const url="https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lon+
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day"+
    "&hourly=temperature_2m,precipitation_probability,precipitation,weather_code"+
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,sunrise,sunset,uv_index_max,daylight_duration"+
    "&forecast_days=7&timezone=Europe%2FBerlin&timeformat=unixtime";
  try{const d=await getJSON(url);WX=Array.isArray(d)?d:[d];store("wx",WX);setStatus("wx",true);}
  catch(e){setStatus("wx",false,errText(e));}
  renderWeather();
}
let OBS=null;
async function loadObs(){
  try{const d=await getJSON("https://api.brightsky.dev/current_weather?lat="+CENTER.lat+"&lon="+CENTER.lon+"&tz=Europe/Berlin");
    OBS={w:d.weather,src:(d.sources||[])[0]};setStatus("dwdobs",true);}
  catch(e){setStatus("dwdobs",false,errText(e));}
  renderWeather();
}
function renderWeather(){
  const b=bez();$("wx-place").textContent=b.name+" · "+b.detail;
  if(!WX||!WX.length){$("wx-now").innerHTML=stateBox("Wetterdaten nicht verfügbar – "+(status.wx?status.wx.msg:"")," ");return;}
  const w=WX[sel-1]||WX[0],c=w.current,[txt,ic]=wmo(c.weather_code),day=w.daily;
  setKpi("k-temp",fmt(c.temperature_2m,1)+"<small> °C</small>","gefühlt "+fmt(c.apparent_temperature,1)+" °C · "+b.name);
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
  const lat=BEZIRKE.map(b=>b.lat).join(","),lon=BEZIRKE.map(b=>b.lon).join(",");
  const url="https://air-quality-api.open-meteo.com/v1/air-quality?latitude="+lat+"&longitude="+lon+
    "&current=european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,uv_index&hourly=european_aqi&forecast_days=2&timezone=Europe%2FBerlin&timeformat=unixtime";
  try{const d=await getJSON(url);AQ=Array.isArray(d)?d:[d];store("aq",AQ);setStatus("aq",true);}
  catch(e){setStatus("aq",false,errText(e));}
  renderAir();
}
function renderAir(){
  if(!AQ||!AQ.length){$("air").innerHTML=stateBox("Luftdaten nicht verfügbar – "+(status.aq?status.aq.msg:""));return;}
  const a=AQ[sel-1]||AQ[0],c=a.current,q=eaqi(c.european_aqi);
  setKpi("k-aq",fmt(c.european_aqi)+"<small> EAQI</small>",q.t+" · "+bez().name,q.c);
  const scale='<div class="aq-scale" aria-hidden="true">'+AQ_COL.map((col,i)=>'<span style="background:'+col+'" class="'+(i===q.i?"on":"")+'"></span>').join("")+'</div>';
  let mx=null;if(a.hourly){const now=Date.now()/1000;a.hourly.time.forEach((t,i)=>{if(t>=now&&t<now+86400){const v=a.hourly.european_aqi[i];if(v!=null&&(mx==null||v>mx))mx=v;}});}
  $("air").innerHTML='<div class="row"><div><div class="big">'+fmt(c.european_aqi)+'</div><div class="muted">EAQI · '+esc(bez().name)+'</div></div><div style="flex:1;min-width:160px"><span class="pill p-'+q.c+'"><i></i>'+q.t+'</span>'+scale+
   '<div class="muted small" style="margin-top:6px">Höchstwert nächste 24 h: '+fmt(mx)+' ('+eaqi(mx).t+')</div></div></div>'+
   '<div class="facts">'+fact(fmt(c.pm10)+" µg/m³","Feinstaub PM10")+fact(fmt(c.pm2_5)+" µg/m³","Feinstaub PM2,5")+fact(fmt(c.nitrogen_dioxide)+" µg/m³","Stickstoffdioxid")+fact(fmt(c.ozone)+" µg/m³","Ozon")+'</div>'+
   '<div class="muted small">Modellwerte im Raster von etwa 10 km – für die tatsächlich gemessenen Werte siehe Messstationen.</div>';
  renderDistricts();
}
// UBA-Messstationen
const UBA_COMP={1:["PM10","Feinstaub PM10"],2:["CO","Kohlenmonoxid"],3:["O₃","Ozon"],4:["SO₂","Schwefeldioxid"],5:["NO₂","Stickstoffdioxid"],9:["PM2,5","Feinstaub PM2,5"]};
const UBA_IDX=[["sehr gut","ok"],["gut","ok"],["mäßig","warn"],["schlecht","bad"],["sehr schlecht","crit"]];
async function loadUBA(){
  const base="https://luftdaten.umweltbundesamt.de/api/air-data/v3";
  try{
    let st=load("uba_st");
    if(!st||!st.length){
      const d=await getJSON(base+"/stations/json?lang=de",25000);
      const ix=d.indices||[];const iId=Math.max(0,ix.indexOf("station id")),iCode=ix.indexOf("station code"),iName=ix.indexOf("station name"),iCity=ix.indexOf("station city"),iTo=ix.indexOf("station active to");
      st=Object.values(d.data||{}).filter(a=>Array.isArray(a)&&String(a[iCity>=0?iCity:3]).indexOf("Düsseldorf")===0&&(iTo<0||!a[iTo]))
        .map(a=>({id:a[iId],code:a[iCode>=0?iCode:1],name:a[iName>=0?iName:2]}));
      store("uba_st",st);
    }
    if(!st.length)throw new Error("keine Düsseldorfer Station gefunden");
    const today=isoDay(),yest=isoDay(new Date(Date.now()-864e5));
    const res=await Promise.all(st.map(s=>getJSON(base+"/airquality/json?date_from="+yest+"&time_from=1&date_to="+today+"&time_to=24&station="+s.id+"&lang=de").then(d=>({s,d})).catch(()=>({s,d:null}))));
    const rows=[];
    res.forEach(({s,d})=>{if(!d||!d.data)return;const per=d.data[s.id]||d.data[String(s.id)]||Object.values(d.data)[0];if(!per)return;
      const keys=Object.keys(per).sort();const k=keys[keys.length-1];if(!k)return;const v=per[k];
      const comps={};v.slice(3).forEach(c=>{if(Array.isArray(c))comps[c[0]]={val:c[1],idx:c[2]};});
      rows.push({name:s.name.replace(/^Düsseldorf[- ]?/,""),code:s.code,time:k,idx:v[1],comps});});
    if(!rows.length)throw new Error("keine aktuellen Messwerte");
    let r='<table><thead><tr><th>Station</th><th>Index</th><th class="num">NO₂</th><th class="num">PM10</th><th class="num">PM2,5</th><th class="num">O₃</th><th>Stand</th></tr></thead><tbody>';
    rows.forEach(x=>{const ii=UBA_IDX[x.idx]||["–",""];const cv=id=>x.comps[id]?fmt(x.comps[id].val):"–";
      r+='<tr><td><b>'+esc(x.name)+'</b> <span class="muted mono">'+esc(x.code)+'</span></td><td><span class="pill p-'+ii[1]+'"><i></i>'+ii[0]+'</span></td><td class="num">'+cv(5)+'</td><td class="num">'+cv(1)+'</td><td class="num">'+cv(9)+'</td><td class="num">'+cv(3)+'</td><td class="muted">'+esc(x.time.slice(11,16))+'</td></tr>';});
    $("uba").innerHTML='<div class="tbl-wrap">'+r+'</tbody></table></div><div class="muted small">Stundenmittel in µg/m³, vorläufige Werte. Index nach Umweltbundesamt (schlechtester Einzelstoff).</div>';
    setStatus("uba",true);
  }catch(e){setStatus("uba",false,errText(e));$("uba").innerHTML=stateBox("Messwerte nicht verfügbar – "+errText(e)+".",link("https://www.umweltbundesamt.de/daten/luft/luftdaten/luftqualitaet","UBA-Luftqualität")+" · "+link("https://www.lanuv.nrw.de/umwelt/luft/immissionen/aktuelle-luftqualitaet","LANUV"));}
}
// DWD-Pollen
const POLLEN_ORDER=["Hasel","Erle","Esche","Birke","Graeser","Roggen","Beifuss","Ambrosia"];
const POLLEN_DE={Graeser:"Gräser",Beifuss:"Beifuß"};
async function loadPollen(){
  try{const d=await getJSON("https://opendata.dwd.de/climate_environment/health/alerts/s31fg.json");
    const nrw=(d.content||[]).filter(c=>/Nordrhein/.test(c.region_name));
    const reg=nrw.find(c=>/Tiefland/.test(c.partregion_name))||nrw[0];
    if(!reg)throw new Error("Region nicht gefunden");
    const lv=v=>{const m={"0":0,"0-1":.5,"1":1,"1-2":1.5,"2":2,"2-3":2.5,"3":3};return m[String(v)]??null;};
    const txt=v=>({"0":"keine","0-1":"keine bis gering","1":"gering","1-2":"gering bis mittel","2":"mittel","2-3":"mittel bis hoch","3":"hoch"}[String(v)]||"–");
    const bars=v=>{const n=lv(v);if(n==null)return"–";let s='<span class="lvl'+(n>=2.5?" hi":"")+'" title="'+txt(v)+'">';for(let i=1;i<=6;i++)s+='<b class="'+(i<=n*2?"on":"")+'"></b>';return s+'</span>';};
    let r='<table><thead><tr><th>Pollenart</th><th>Heute</th><th>Morgen</th><th>Übermorgen</th></tr></thead><tbody>';
    POLLEN_ORDER.forEach(k=>{const p=(reg.Pollen||{})[k];if(!p)return;
      r+='<tr><td><b>'+(POLLEN_DE[k]||k)+'</b></td><td>'+bars(p.today)+' <span class="muted small">'+txt(p.today)+'</span></td><td>'+bars(p.tomorrow)+' <span class="muted small">'+txt(p.tomorrow)+'</span></td><td>'+bars(p.dayafter_to)+' <span class="muted small">'+txt(p.dayafter_to)+'</span></td></tr>';});
    $("pollen").innerHTML='<div class="tbl-wrap">'+r+'</tbody></table></div><div class="muted small">'+esc(reg.partregion_name||reg.region_name)+' · ausgegeben '+esc(d.last_update||"")+' · Übermorgen nur freitags vollständig.</div>';
    setStatus("pollen",true);
  }catch(e){setStatus("pollen",false,errText(e));$("pollen").innerHTML=stateBox("Pollendaten nicht verfügbar – "+errText(e)+".",link("https://www.dwd.de/DE/leistungen/gefahrenindizespollen/gefahrenindexpollen.html","DWD-Pollenflug"));}
}

// ================= Bezirke =================
function renderDistricts(){
  if(!WX||!WX.length)return;
  let r='<table><thead><tr><th>Bezirk</th><th>Wetter</th><th class="num">Temp.</th><th class="num">gefühlt</th><th class="num">Wind / Böen</th><th class="num">Regenrisiko heute</th><th class="num">EAQI</th></tr></thead><tbody>';
  BEZIRKE.forEach((b,i)=>{const w=WX[i];if(!w)return;const c=w.current,[tx,ik]=wmo(c.weather_code);const aq=AQ&&AQ[i]?AQ[i].current.european_aqi:null,q=eaqi(aq);
    r+='<tr class="click'+(b.id===sel?" sel":"")+'" data-id="'+b.id+'" tabindex="0"><td><b>'+b.id+'</b> '+esc(b.name)+'</td><td>'+icon(ik)+' <span class="muted" style="font-size:13px">'+esc(tx)+'</span></td><td class="num"><b>'+fmt(c.temperature_2m,1)+'°</b></td><td class="num">'+fmt(c.apparent_temperature,1)+'°</td><td class="num">'+fmt(c.wind_speed_10m)+' / '+fmt(c.wind_gusts_10m)+'</td><td class="num">'+fmt(w.daily.precipitation_probability_max[0])+' %</td><td class="num">'+(aq==null?"–":'<span class="pill p-'+q.c+'"><i></i>'+fmt(aq)+'</span>')+'</td></tr>';});
  $("districts").innerHTML=r+'</tbody></table>';
  $("districts").querySelectorAll("tr.click").forEach(tr=>{const f=()=>pick(Number(tr.dataset.id),true);tr.addEventListener("click",f);tr.addEventListener("keydown",e=>{if(e.key==="Enter")f();});});
}

// ================= Warnungen =================
async function loadAlerts(){
  const out=[];let okD=false,okN=false;
  const pD=getJSON("https://api.brightsky.dev/alerts?lat="+CENTER.lat+"&lon="+CENTER.lon+"&tz=Europe/Berlin").then(d=>{okD=true;
    (d.alerts||[]).forEach(a=>out.push({src:"DWD",title:a.headline_de||a.event_de,text:a.description_de,instr:a.instruction_de,sev:a.severity,from:a.onset,to:a.expires}));
    setStatus("dwd",true);}).catch(e=>setStatus("dwd",false,errText(e)));
  const pN=getJSON("https://warnung.bund.de/api31/dashboard/"+ARS+".json").then(d=>{okN=true;
    (d||[]).forEach(a=>{const p=a.payload&&a.payload.data||{};if(String(p.provider).toUpperCase()==="DWD")return;
      out.push({src:"NINA · "+(p.provider||"BBK"),title:(a.i18nTitle&&a.i18nTitle.de)||p.headline,sev:p.severity,from:a.sent,id:a.id});});
    setStatus("nina",true);}).catch(e=>setStatus("nina",false,errText(e)));
  await Promise.all([pD,pN]);
  const order={extreme:4,severe:3,moderate:2,minor:1};
  out.sort((a,b)=>(order[String(b.sev).toLowerCase()]||0)-(order[String(a.sev).toLowerCase()]||0));
  const box=$("alerts");
  if(!okD&&!okN){box.innerHTML=stateBox("Warnungen konnten nicht geladen werden. Bitte direkt prüfen:",link("https://www.dwd.de/DE/wetter/warnungen_gemeinden/warnWetter_node.html","DWD")+" · "+link("https://warnung.bund.de/meldungen","NINA"));setKpi("k-warn","?","nicht geladen","warn");return;}
  if(!out.length){box.innerHTML='<div class="state good">Keine aktiven Warnungen für Düsseldorf.'+((okD&&okN)?"":" (eine Quelle nicht erreichbar)")+'</div>';setKpi("k-warn","0","keine aktiven Warnungen","ok");return;}
  const sc=s=>{s=String(s).toLowerCase();return s==="extreme"?"crit":s==="severe"?"bad":s==="moderate"?"warn":"info";};
  const sevDe={extreme:"extrem",severe:"Unwetter",moderate:"markant",minor:"Hinweis"};
  box.innerHTML=out.map(a=>'<div class="alert sev-'+sc(a.sev)+'"><h3>'+esc(a.title)+'</h3>'+
    (a.text?'<p>'+esc(a.text)+'</p>':'')+(a.instr?'<details><summary>Handlungsempfehlung</summary><p>'+esc(a.instr)+'</p></details>':'')+
    (a.id?'<div class="meta">'+link("https://warnung.bund.de/meldungen/"+encodeURIComponent(a.id),"Meldung öffnen")+'</div>':'')+
    '<div class="meta">'+esc(a.src)+(a.sev?' · '+esc(sevDe[String(a.sev).toLowerCase()]||a.sev):'')+(a.from?' · ab '+dateTime(a.from):'')+(a.to?' bis '+dateTime(a.to):'')+'</div></div>').join("");
  const top=sc(out[0].sev);setKpi("k-warn",String(out.length),out[0].title,top==="info"?"warn":top);
}

// ================= Rhein & Grundwasser =================
async function loadRhein(){
  const base="https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/D%C3%9CSSELDORF";
  try{
    const [st,hist]=await Promise.all([getJSON(base+".json?includeTimeseries=true&includeCurrentMeasurement=true"),getJSON(base+"/W/measurements.json?start=P7D").catch(()=>[])]);
    const ts=(st.timeseries||[]).find(t=>t.shortname==="W")||{};const cm=ts.currentMeasurement||{};
    const wt=(st.timeseries||[]).find(t=>t.shortname==="WT");
    const tr=cm.trend===1?"steigend ↑":cm.trend===-1?"fallend ↓":"gleichbleibend →";
    const stateDe={low:"Niedrigwasser (unter MNW)",normal:"Mittelwasserbereich",high:"Hochwasser (über MHW)",unknown:"ohne Einstufung"}[cm.stateMnwMhw]||"";
    const cls=cm.stateMnwMhw==="high"?"bad":cm.stateMnwMhw==="low"?"warn":"ok";
    setKpi("k-rhein",fmt(cm.value)+"<small> cm</small>",tr+(stateDe?" · "+stateDe:""),cls);
    let html='<div class="row"><div><div class="big">'+fmt(cm.value)+'<span style="font-size:22px"> cm</span></div><div class="muted">'+tr+(cm.timestamp?' · '+hhmm(cm.timestamp)+' Uhr':'')+'</div></div><span class="pill p-'+cls+'"><i></i>'+esc(stateDe||"–")+'</span></div>';
    if(Array.isArray(hist)&&hist.length>2)html+=spark(hist);
    const vals=Array.isArray(hist)?hist.map(h=>h.value):[];
    html+='<div class="facts">'+(wt&&wt.currentMeasurement?fact(fmt(wt.currentMeasurement.value,1)+" °C","Wassertemperatur"):"")+
      fact(vals.length?fmt(Math.min(...vals))+" – "+fmt(Math.max(...vals))+" cm":"–","Spanne 7 Tage")+
      fact(vals.length?(cm.value-vals[0]>0?"+":"")+fmt(cm.value-vals[0])+" cm":"–","Änderung 7 Tage")+'</div>'+
      '<div class="muted small">Hochwassermarken Düsseldorf: I = 710 cm, II = 830 cm. Schifffahrtsmeldungen: '+link("https://www.elwis.de/","ELWIS")+'</div>';
    $("pegel").innerHTML=html;setStatus("pegel",true);
  }catch(e){setStatus("pegel",false,errText(e));$("pegel").innerHTML=stateBox("Pegel nicht verfügbar – "+errText(e)+".",link("https://www.pegelonline.wsv.de/gast/stammdaten?pegelnr=2750010","Pegel direkt"));setKpi("k-rhein","?","nicht geladen","warn");}
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

// ================= Open Data Düsseldorf (CKAN) =================
const ODD="https://opendata.duesseldorf.de/api/3/action/";
async function oddResource(query,prefer){
  // Sucht den Datensatz und liefert die erste JSON-Ressource (optional nach Namen bevorzugt)
  const d=await getJSON(ODD+"package_search?rows=8&q="+encodeURIComponent(query),20000);
  const pk=(d.result&&d.result.results||[]).find(p=>/düsseldorf/i.test(p.title||"")||/duesseldorf|d%C3%BCsseldorf/i.test(p.name||""))||(d.result&&d.result.results||[])[0];
  if(!pk)throw new Error("Datensatz nicht gefunden");
  const res=(pk.resources||[]).filter(r=>/json/i.test(r.format||"")||/\.(geo)?json(\?|$)/i.test(r.url||""));
  const r=(prefer&&res.find(x=>prefer.test((x.name||"")+" "+(x.description||""))))||res[0];
  if(!r)throw new Error("keine JSON-Ressource");
  return {pk,url:r.url};
}
function normalizePlaces(j){
  // akzeptiert Array, {features:[]}, {data:[]}, {results:[]} usw.
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
    return {name:String(name),addr:String(addr),ort:String(ort),anz,note:String(note),lat:parseFloat(String(lat).replace(",",".")),lon:parseFloat(String(lon).replace(",",".")),raw:o};
  }).filter(p=>isFinite(p.lat)&&isFinite(p.lon));
}
async function loadParking(){
  const jobs=[["ph","Parkhäuser Düsseldorf"],["pr","Park and Ride Anlagen Düsseldorf"],["bh","Behindertenparkplätze Düsseldorf"]];
  let anyOk=false,err="";
  await Promise.all(jobs.map(async([k,q])=>{
    try{const {url}=await oddResource(q);const j=await getJSON(url,20000);PARK[k]=normalizePlaces(j);anyOk=true;}
    catch(e){err=errText(e);}
  }));
  if(anyOk){store("park",PARK);setStatus("park",true,err?"teilweise":"");}else setStatus("park",false,err);
  renderParking();
}
function renderParking(){
  const b=bez();
  const box=(id,list,label)=>{
    if(!list||!list.length){$(id).innerHTML=stateBox(label+" nicht verfügbar"+(status.park&&!status.park.ok?" – "+status.park.msg:"")+".",link("https://opendata.duesseldorf.de/","Open Data Düsseldorf"));return;}
    const s=list.map(p=>({...p,km:distKm(b.lat,b.lon,p.lat,p.lon)})).sort((x,y)=>x.km-y.km).slice(0,6);
    $(id).innerHTML='<div class="list">'+s.map(p=>'<div class="li"><span class="tag alt">'+fmt(p.km,1)+' km</span><div class="t">'+esc(p.name||p.addr||"Standort")+'</div>'+
      '<div class="r">'+(p.anz!=null&&p.anz!==""?esc(p.anz)+" Pl.":"")+'</div><div class="d">'+esc([p.addr,p.ort].filter(Boolean).join(", "))+(p.note?" · "+esc(p.note):"")+
      ' · <a href="https://maps.apple.com/?daddr='+p.lat+','+p.lon+'" target="_blank" rel="noopener">Route</a></div></div>').join("")+'</div>'+
      '<div class="muted small">'+list.length+' Standorte insgesamt · nächste zu '+esc(b.name)+'</div>';
  };
  box("park-ph",PARK.ph,"Parkhäuser");box("park-pr",PARK.pr,"P+R-Anlagen");box("park-bh",PARK.bh,"Behindertenparkplätze");
}
async function loadGW(){
  try{
    let url;
    try{({url}=await oddResource("Grundwassermessstellen Düsseldorf",/online|pegel|statist/i));}catch(e){throw e;}
    const j=await getJSON(url,20000);
    let arr=Array.isArray(j)?j:(j.data||j.results||j.features||Object.values(j).find(Array.isArray)||[]);
    arr=arr.map(x=>x&&x.properties?x.properties:x);
    if(!arr.length)throw new Error("keine Einträge");
    const k=(o,re)=>{const kk=Object.keys(o).find(z=>re.test(z));return kk?o[kk]:undefined;};
    const rows=arr.map(o=>({nr:k(o,/brunnen|bnr|nummer/i),ort:k(o,/standort|strasse|straße/i),teil:k(o,/stadtteil/i),ws:k(o,/wasserstand/i),temp:k(o,/temp/i),last:k(o,/max_mess|letzte|datum/i)}));
    const latest=rows.map(r=>r.last).filter(Boolean).sort().pop();
    let r='<table><thead><tr><th>Brunnen</th><th>Standort</th><th class="num">Ø Wasserstand</th><th class="num">Ø Temp.</th><th>letzte Messung</th></tr></thead><tbody>';
    rows.slice(0,30).forEach(x=>{r+='<tr><td><b>'+esc(x.nr)+'</b></td><td>'+esc(x.ort||x.teil||"")+'</td><td class="num">'+(x.ws!=null?fmt(x.ws,2):"–")+'</td><td class="num">'+(x.temp!=null?fmt(x.temp,1)+" °C":"–")+'</td><td class="muted">'+esc(x.last?String(x.last).slice(0,16):"")+'</td></tr>';});
    $("gw").innerHTML='<div class="facts">'+fact(String(rows.length),"Online-Messstellen")+fact(latest?esc(String(latest).slice(0,10)):"–","jüngster Messwert")+'</div><div class="tbl-wrap">'+r+'</tbody></table></div>'+
      '<div class="muted small">Kennzahlen der automatisch übertragenden Brunnen. Verlauf je Brunnen: '+link("https://www.duesseldorf.de/umweltamt/umweltthemen-von-a-z/grundwasser/online-pegel","Online-Pegel der Stadt")+'</div>';
    setStatus("gw",true);
  }catch(e){setStatus("gw",false,errText(e));$("gw").innerHTML=stateBox("Grundwasserdaten nicht verfügbar – "+errText(e)+".",link("https://opendata.duesseldorf.de/dataset/grundwassermessstellen-d%C3%BCsseldorf","Datensatz öffnen"));}
}

// ================= Autobahn =================
async function loadAutobahn(){
  const svcs=["warning","closure","roadworks","webcam","electric_charging_station"];
  const got={};svcs.forEach(s=>got[s]=[]);let ok=0,total=0;
  await Promise.all(AUTOBAHNEN.flatMap(ab=>svcs.map(async svc=>{
    total++;
    try{const d=await getJSON("https://verkehr.autobahn.de/o/autobahn/"+ab+"/services/"+svc,20000);ok++;
      (d[svc]||[]).forEach(w=>{const c=w.coordinate||{};const km=distKm(CENTER.lat,CENTER.lon,parseFloat(c.lat),parseFloat(c.long));
        if(isFinite(km)&&km<=RADIUS_KM)got[svc].push({...w,ab,km});});
    }catch(e){}
  })));
  if(!ok){setStatus("ab",false,"nicht erreichbar oder vom Browser blockiert (CORS)");
    const fb=stateBox("Die Autobahn-Schnittstelle antwortet nicht.",link("https://www.verkehr.nrw/","verkehr.nrw")+" · "+link("https://www.autobahn.de/","autobahn.de"));
    ["traffic","roadworks","webcams","charging"].forEach(id=>$(id).innerHTML=fb);setKpi("k-traffic","?","nicht geladen","warn");return;}
  setStatus("ab",true,ok<total?"teilweise geladen ("+ok+"/"+total+")":"");
  const uniq=list=>{const seen=new Set();return list.filter(i=>{const k=i.ab+"|"+i.title+"|"+i.subtitle;if(seen.has(k))return false;seen.add(k);return true;});};
  const desc=w=>(w.description||[]).filter(Boolean).slice(0,3).join(" · ");
  // Meldungen + Sperrungen
  const msgs=uniq([...got.closure.map(x=>({...x,_c:1})),...got.warning]).sort((a,b)=>(b._c||0)-(a._c||0)||a.km-b.km);
  const closures=msgs.filter(m=>m._c||m.isBlocked==="true"||m.isBlocked===true).length;
  setKpi("k-traffic",String(msgs.length),closures?closures+" Sperrung(en)":"keine Sperrungen",closures?"bad":msgs.length?"warn":"ok");
  $("traffic").innerHTML=msgs.length?'<div class="list">'+msgs.slice(0,15).map(i=>'<div class="li"><span class="tag ab">'+esc(i.ab)+'</span><div class="t">'+
    ((i._c||i.isBlocked==="true"||i.isBlocked===true)?'<span class="pill p-bad" style="margin-right:6px"><i></i>Sperrung</span>':'')+esc(i.title)+'</div><div class="r muted small">'+fmt(i.km)+' km</div><div class="d">'+esc(i.subtitle||"")+(desc(i)?" – "+esc(desc(i)):"")+'</div></div>').join("")+'</div>'+
    (msgs.length>15?'<div class="muted small">+ '+(msgs.length-15)+' weitere</div>':''):'<div class="state good">Keine Meldungen im Umkreis von '+RADIUS_KM+' km.</div>';
  // Baustellen
  const rw=uniq(got.roadworks).sort((a,b)=>a.km-b.km);
  $("roadworks").innerHTML=rw.length?'<div class="list">'+rw.slice(0,12).map(i=>'<div class="li"><span class="tag ab">'+esc(i.ab)+'</span><div class="t">'+esc(i.title)+'</div><div class="r muted small">'+fmt(i.km)+' km</div><div class="d">'+esc(i.subtitle||"")+(desc(i)?" – "+esc(desc(i)):"")+'</div></div>').join("")+'</div>'+
    '<div class="muted small">'+rw.length+' Baustellen im Umkreis</div>':'<div class="state good">Keine Baustellen im Umkreis.</div>';
  // Webcams
  const cams=uniq(got.webcam).filter(c=>c.imageurl).sort((a,b)=>a.km-b.km).slice(0,12);
  $("webcams").innerHTML=cams.length?'<div class="cams">'+cams.map(c=>'<a class="cam" href="'+esc(safeUrl(c.linkurl||c.imageurl))+'" target="_blank" rel="noopener"><img loading="lazy" alt="Webcam '+esc(c.title)+'" src="'+esc(safeUrl(c.imageurl))+'"><span><b>'+esc(c.ab)+'</b> '+esc(c.subtitle||c.title)+'</span></a>').join("")+'</div>':stateBox("Keine Webcams im Umkreis gefunden.");
  // Laden
  const ch=uniq(got.electric_charging_station).sort((a,b)=>a.km-b.km);
  $("charging").innerHTML=ch.length?'<div class="list">'+ch.slice(0,8).map(i=>'<div class="li"><span class="tag ab">'+esc(i.ab)+'</span><div class="t">'+esc(i.title)+'</div><div class="r muted small">'+fmt(i.km)+' km</div><div class="d">'+esc(i.subtitle||"")+(desc(i)?" – "+esc(desc(i)):"")+'</div></div>').join("")+'</div>':stateBox("Keine Ladestationen an Autobahnen im Umkreis.");
}

// ================= Tankerkönig =================
async function loadFuel(){
  const box=$("fuel");
  if(!TK){box.innerHTML=stateBox("Für Spritpreise einmal einen kostenlosen Tankerkönig-Schlüssel unter Einstellungen eintragen.",'<a href="#einstellungen">Zu den Einstellungen</a>');setStatus("fuel",false,"Schlüssel fehlt");return;}
  const b=bez();
  try{const d=await getJSON("https://creativecommons.tankerkoenig.de/json/list.php?lat="+b.lat+"&lng="+b.lon+"&rad=4&sort=dist&type=all&apikey="+encodeURIComponent(TK));
    if(!d.ok)throw new Error(d.message||"Abfrage abgelehnt");
    const st=(d.stations||[]).filter(s=>s.isOpen).slice(0,10);
    if(!st.length){box.innerHTML=stateBox("Keine geöffnete Tankstelle im Umkreis von 4 km.");setStatus("fuel",true);return;}
    const best=k=>Math.min(...st.map(s=>s[k]).filter(v=>typeof v==="number"));
    const bE5=best("e5"),bE10=best("e10"),bD=best("diesel");
    const p=(v,b)=>typeof v!=="number"?"–":'<span style="'+(v===b?"color:var(--ok);font-weight:700":"")+'">'+v.toFixed(2).replace(".",",")+'<sup>9</sup></span>';
    let r='<table><thead><tr><th>Tankstelle</th><th class="num">km</th><th class="num">Super E5</th><th class="num">E10</th><th class="num">Diesel</th></tr></thead><tbody>';
    st.forEach(s=>{r+='<tr><td class="wrap-txt"><b>'+esc(s.brand||s.name)+'</b><br><span class="muted small">'+esc((s.street||"")+" "+(s.houseNumber||""))+'</span></td><td class="num">'+fmt(s.dist,1)+'</td><td class="num">'+p(s.e5,bE5)+'</td><td class="num">'+p(s.e10,bE10)+'</td><td class="num">'+p(s.diesel,bD)+'</td></tr>';});
    box.innerHTML='<div class="tbl-wrap">'+r+'</tbody></table></div><div class="muted small">Geöffnete Tankstellen im Umkreis von 4 km um '+esc(b.name)+', günstigster Preis grün.</div>';
    setStatus("fuel",true);
  }catch(e){setStatus("fuel",false,errText(e));box.innerHTML=stateBox("Spritpreise nicht verfügbar – "+errText(e)+".");}
}

// ================= VRR EFA =================
async function loadEFA(){
  $("efa-title").textContent="Abfahrten "+STOP.replace(/^Düsseldorf[, ]*/,"");
  const url="https://efa.vrr.de/standard/XML_DM_REQUEST?outputFormat=rapidJSON&language=de&type_dm=any&name_dm="+encodeURIComponent(STOP)+
    "&mode=direct&useRealtime=1&limit=14&itdDateTimeDepArr=dep&useAllStops=1&coordOutputFormat=WGS84[dd.ddddd]";
  try{const d=await getJSON(url,20000);
    const ev=d.stopEvents||[];
    const locName=(d.locations&&d.locations[0]&&(d.locations[0].disassembledName||d.locations[0].name))||STOP;
    if(!ev.length){$("efa").innerHTML=stateBox("Keine Abfahrten gefunden. Ist die Haltestelle „"+STOP+"“ eindeutig? Unter Einstellungen anpassen.");setStatus("efa",true,"keine Treffer");return;}
    let r='<table><thead><tr><th>Zeit</th><th>Linie</th><th>Richtung</th><th class="num">Steig</th><th class="num">+min</th></tr></thead><tbody>';
    ev.forEach(e=>{const pl=e.departureTimePlanned,es=e.departureTimeEstimated;const del=pl&&es?Math.round((new Date(es)-new Date(pl))/6e4):null;
      const t=e.transportation||{};const plat=e.location&&e.location.properties&&(e.location.properties.platform||e.location.properties.platformName)||"";
      const cancelled=(e.realtimeStatus||[]).includes("TRIP_CANCELLED")||e.isCancelled;
      r+='<tr><td><b>'+(pl?hhmm(pl):"–")+'</b></td><td><span class="tag">'+esc(t.disassembledName||t.number||t.name||"")+'</span></td><td class="wrap-txt">'+esc(t.destination&&t.destination.name||"")+'</td><td class="num">'+esc(plat)+'</td><td class="num">'+
        (cancelled?'<span class="pill p-bad"><i></i>fällt aus</span>':del==null?'<span class="muted">–</span>':del>0?'<span style="color:var(--bad);font-weight:600">+'+del+'</span>':'<span style="color:var(--ok)">0</span>')+'</td></tr>';});
    $("efa").innerHTML='<div class="muted small">'+esc(locName)+'</div><div class="tbl-wrap">'+r+'</tbody></table></div>';
    setStatus("efa",true);
  }catch(e){setStatus("efa",false,errText(e));$("efa").innerHTML=stateBox("Abfahrten nicht verfügbar – "+errText(e)+".",link("https://www.rheinbahn.de/","Rheinbahn")+" · "+link("https://www.vrr.de/de/fahrplanauskunft/","VRR-Auskunft"));}
}

// ================= Bahn =================
async function loadDep(){
  try{const d=await getJSON("https://v6.db.transport.rest/stops/8000085/departures?duration=45&results=12&bus=false&tram=false&subway=false&language=de",15000);
    const deps=(d.departures||d||[]);
    if(!deps.length){$("dep").innerHTML=stateBox("Keine Abfahrten im Zeitfenster.");setStatus("db",true);return;}
    let r='<table><thead><tr><th>Zeit</th><th>Zug</th><th>Ziel</th><th class="num">Gleis</th><th class="num">+min</th></tr></thead><tbody>';
    deps.forEach(x=>{const del=x.delay!=null?Math.round(x.delay/60):null;
      r+='<tr><td><b>'+hhmm(x.plannedWhen||x.when)+'</b></td><td><span class="tag">'+esc(x.line&&x.line.name)+'</span></td><td class="wrap-txt">'+esc(x.direction)+'</td><td class="num">'+esc(x.platform||x.plannedPlatform||"")+'</td><td class="num">'+
      (x.cancelled?'<span class="pill p-bad"><i></i>fällt aus</span>':del>0?'<span style="color:var(--bad);font-weight:600">+'+del+'</span>':'<span style="color:var(--ok)">0</span>')+'</td></tr>';});
    $("dep").innerHTML='<div class="tbl-wrap">'+r+'</tbody></table></div>';setStatus("db",true);
  }catch(e){setStatus("db",false,errText(e));$("dep").innerHTML=stateBox("Abfahrten nicht verfügbar – "+errText(e)+".",link("https://www.bahnhof.de/duesseldorf-hbf/abfahrt","bahnhof.de"));}
}

// ================= nextbike =================
async function loadBike(){
  try{
    let uid=load("nb_uid");
    if(!uid){const l=await getJSON("https://maps.nextbike.net/maps/nextbike-live.json?list_cities=1",25000);
      for(const c of (l.countries||[]))for(const ci of (c.cities||[]))if(/^D(ü|ue)sseldorf/i.test(ci.name||"")){uid=ci.uid;break;}
      if(!uid)throw new Error("Düsseldorf nicht im nextbike-Netz gefunden");store("nb_uid",uid);}
    const d=await getJSON("https://maps.nextbike.net/maps/nextbike-live.json?city="+uid,20000);
    const city=(d.countries||[]).flatMap(c=>c.cities||[]).find(c=>String(c.uid)===String(uid));
    BIKE={places:(city&&city.places||[]).filter(p=>p.spot!==false),total:city&&(city.available_bikes??city.num_places)};
    setStatus("bike",true);
  }catch(e){BIKE=null;setStatus("bike",false,errText(e));}
  renderBike();
}
function renderBike(){
  if(!BIKE){$("bike").innerHTML=stateBox("Leihrad-Daten nicht verfügbar"+(status.bike?" – "+status.bike.msg:"")+".",link("https://www.nextbike.de/duesseldorf/","nextbike Düsseldorf"));return;}
  const b=bez();const s=BIKE.places.map(p=>({...p,km:distKm(b.lat,b.lon,p.lat,p.lng)})).sort((x,y)=>x.km-y.km).slice(0,7);
  if(!s.length){$("bike").innerHTML=stateBox("Keine Stationen gefunden.");return;}
  $("bike").innerHTML='<div class="list">'+s.map(p=>'<div class="li"><span class="tag alt">'+fmt(p.km,1)+' km</span><div class="t">'+esc(p.name)+'</div><div class="r">'+fmt(p.bikes)+' Räder</div>'+
    (p.free_racks!=null?'<div class="d">'+fmt(p.free_racks)+' freie Plätze</div>':'')+'</div>').join("")+'</div>'+
    (BIKE.total!=null?'<div class="muted small">stadtweit '+fmt(BIKE.total)+' verfügbare Räder</div>':'');
}

// ================= Kalender =================
async function loadHol(){
  const y=new Date().getFullYear();
  try{const [a,b]=await Promise.all([getJSON("https://date.nager.at/api/v3/PublicHolidays/"+y+"/DE"),getJSON("https://date.nager.at/api/v3/PublicHolidays/"+(y+1)+"/DE")]);
    HOL=[...a,...b].filter(h=>!h.counties||h.counties.includes("DE-NW"));store("hol",HOL);setStatus("hol",true);}
  catch(e){setStatus("hol",false,errText(e));}
  try{const from=isoDay(),to=isoDay(new Date(Date.now()+400*864e5));
    const s=await getJSON("https://openholidaysapi.org/SchoolHolidays?countryIsoCode=DE&subdivisionCode=DE-NW&languageIsoCode=DE&validFrom="+from+"&validTo="+to);
    SCHOOL=(s||[]).map(x=>({start:x.startDate,end:x.endDate,name:((x.name||[]).find(n=>n.language==="DE")||(x.name||[])[0]||{}).text||"Ferien"}));store("school",SCHOOL);setStatus("school",true);}
  catch(e){setStatus("school",false,errText(e));}
  renderCal();
}
function renderCal(){
  const w=WX&&WX[sel-1];let html="";
  if(w){const d=w.daily;const len=d.daylight_duration[0];const lenY=null;
    html+='<div class="facts">'+fact(hhmm(d.sunrise[0]*1000),"Sonnenaufgang")+fact(hhmm(d.sunset[0]*1000),"Sonnenuntergang")+fact(Math.floor(len/3600)+" h "+Math.round(len%3600/60)+" min","Tageslicht")+
      fact(String(isoWeek(new Date())),"Kalenderwoche")+'</div>';}
  const today=isoDay();const nd=s=>new Date(s+"T12:00:00");const days=s=>Math.round((nd(s)-nd(today))/864e5);
  const rel=n=>n===0?"heute":n===1?"morgen":"in "+n+" Tagen";
  if(HOL&&HOL.length){const next=HOL.filter(h=>h.date>=today).slice(0,4);
    html+='<div><div class="sublbl">Feiertage NRW</div><div class="list">'+next.map(h=>'<div class="li"><span class="tag">'+nd(h.date).toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"})+'</span><div class="t">'+esc(h.localName)+'</div><div class="r muted small">'+rel(days(h.date))+'</div></div>').join("")+'</div></div>';}
  if(SCHOOL&&SCHOOL.length){const cur=SCHOOL.find(s=>s.start<=today&&s.end>=today);const next=SCHOOL.filter(s=>s.start>today).slice(0,3);
    html+='<div><div class="sublbl">Schulferien NRW</div>'+(cur?'<div class="state good">Jetzt: '+esc(cur.name)+' bis '+dateShort(nd(cur.end))+'</div>':'')+
      '<div class="list">'+next.map(s=>'<div class="li"><span class="tag alt">'+nd(s.start).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"})+'</span><div class="t">'+esc(s.name)+'</div><div class="r muted small">'+rel(days(s.start))+'</div><div class="d">bis '+dateShort(nd(s.end))+'</div></div>').join("")+'</div></div>';}
  $("cal").innerHTML=html||stateBox("wird geladen …");
}
function isoWeek(d){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y)/864e5+1)/7);}

// ================= Strom =================
async function loadStrom(){
  try{
    const day=isoDay(),tom=isoDay(new Date(Date.now()+864e5));
    const [pr,sig]=await Promise.all([
      getJSON("https://api.energy-charts.info/price?bzn=DE-LU&start="+day+"&end="+tom),
      getJSON("https://api.energy-charts.info/signal?country=de").catch(()=>null)]);
    const ts=pr.unix_seconds||[],pv=pr.price||[];const now=Date.now()/1000;
    let ci=-1;ts.forEach((t,i)=>{if(t<=now)ci=i;});
    const cur=ci>=0?pv[ci]:null;
    let share=null,signal=null;
    if(sig&&sig.unix_seconds){let si=-1;sig.unix_seconds.forEach((t,i)=>{if(t<=now)si=i;});if(si>=0){share=sig.share&&sig.share[si];signal=sig.signal&&sig.signal[si];}}
    const sigTxt={"-1":["Netzengpass","bad"],"0":["wenig Ökostrom","bad"],"1":["mittel","warn"],"2":["viel Ökostrom","ok"]}[String(signal)]||["–",""];
    setKpi("k-strom",fmt(cur!=null?cur/10:null,1)+"<small> ct/kWh</small>",share!=null?"Ökostrom "+fmt(share)+" % · "+sigTxt[0]:"Börsenpreis Day-Ahead",sigTxt[1]||"info");
    // Chart heute
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
  try{const d=await getJSON("https://www.tagesschau.de/api2u/news/?regions=10&ressort=inland");
    let n=(d.news||[]).filter(x=>x.title);
    if(!n.length){const d2=await getJSON("https://www.tagesschau.de/api2u/news/?regions=10");n=(d2.news||[]).filter(x=>x.title);}
    if(!n.length)throw new Error("keine Meldungen");
    $("news").innerHTML='<div class="list">'+n.slice(0,8).map(x=>'<div class="li" style="grid-template-columns:1fr auto"><a class="t" href="'+esc(safeUrl(x.shareURL||x.detailsweb))+'" target="_blank" rel="noopener">'+esc(x.title)+'</a><span class="r muted small">'+(x.date?hhmm(x.date):"")+'</span>'+
      (x.firstSentence?'<div class="d" style="grid-column:1/-1">'+esc(x.firstSentence)+'</div>':'')+'</div>').join("")+'</div>';
    setStatus("news",true);
  }catch(e){setStatus("news",false,errText(e));$("news").innerHTML=stateBox("Nachrichten nicht verfügbar – "+errText(e)+".",link("https://www1.wdr.de/nachrichten/rheinland/index.html","WDR Rheinland"));}
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
let busy=false,lastSlow=0;
async function refreshAll(force){
  if(busy)return;busy=true;const btn=$("refresh");btn.disabled=true;btn.textContent="Lädt …";
  const fast=[loadWeather(),loadObs(),loadAir(),loadAlerts(),loadRhein(),loadEFA(),loadDep(),loadStrom(),loadNews(),loadAutobahn(),loadBike(),loadFuel()];
  // seltener wechselnde Daten höchstens stündlich
  const slow=(force||Date.now()-lastSlow>3600e3)?[loadUBA(),loadPollen(),loadParking(),loadGW(),loadHol()]:[];
  if(slow.length)lastSlow=Date.now();
  await Promise.allSettled([...fast,...slow]);
  $("updated").textContent="Zuletzt aktualisiert: "+new Date().toLocaleString("de-DE",{...TZ,dateStyle:"medium",timeStyle:"short"})+" · automatisch alle 10 Minuten";
  btn.disabled=false;btn.textContent="Aktualisieren";busy=false;
}
function tick(){$("clock").textContent=new Date().toLocaleTimeString("de-DE",{...TZ,hour:"2-digit",minute:"2-digit"});
  $("sub").textContent=new Date().toLocaleDateString("de-DE",{...TZ,weekday:"long",day:"numeric",month:"long",year:"numeric"})+" · KW "+isoWeek(new Date());}
$("refresh").addEventListener("click",()=>refreshAll(true));
renderSources();tick();setInterval(tick,15000);
if(WX)renderWeather();if(AQ)renderAir();if(HOL||SCHOOL)renderCal();if(PARK.ph||PARK.pr||PARK.bh)renderParking();
let lastRun=0;
async function run(force){lastRun=Date.now();await refreshAll(force);}
run(true);
setInterval(()=>{if(!document.hidden)run(false);},10*60*1000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-lastRun>5*60*1000)run(false);});
if("serviceWorker" in navigator&&location.protocol==="https:"){navigator.serviceWorker.register("sw.js").catch(()=>{});}
})();
