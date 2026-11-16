import {spawn} from "node:child_process";import fs from "node:fs";
const [,,url,outdir,devs]=process.argv;fs.mkdirSync(outdir,{recursive:true});
const chrome=spawn("google-chrome",["--headless=new","--no-sandbox","--disable-gpu","--remote-debugging-port=9333","--user-data-dir=/tmp/qa-prof","about:blank"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));await sleep(2500);
const tabs=await (await fetch("http://127.0.0.1:9333/json")).json();const ws=new WebSocket(tabs.find(t=>t.type==="page").webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);let id=0;const pend={};const logs=[];
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend[d.id]){pend[d.id](d);delete pend[d.id];}
 if(d.method==="Runtime.exceptionThrown")logs.push("EXC "+(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text).split("\n")[0]);
 if(d.method==="Runtime.consoleAPICalled"&&d.params.type==="error")logs.push("ERR "+d.params.args.map(a=>a.value||a.description).join(" ").slice(0,200));};
const C=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}));});
const ev=async e=>(await C("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true})).result?.result?.value;
await C("Runtime.enable");await C("Page.enable");
const D={iphone:[393,852,3,true,"Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1"],ipad:[820,1180,2,true,"Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1"],mac:[1440,900,1,false,"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15"]};
const views=process.env.VIEWS?process.env.VIEWS.split(process.env.SEP||","):["","wetter","warnungen","luft","rhein","staus","parken","tanken","eladen","events","fussball","urlaub","webcams","blaulicht","bezirke","flaechen","alltag","finanzen","einstellungen","quellen"];
const probe=`(()=>{const W=innerWidth;const vis=e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=="hidden"&&s.display!=="none";};
const over=[...document.querySelectorAll("body *")].filter(e=>vis(e)&&e.getBoundingClientRect().right>W+2&&!e.closest("[style*='overflow'],.tbl-wrap,.hscroll")).filter(e=>{let p=e.parentElement;while(p){const o=getComputedStyle(p).overflowX;if(o==="auto"||o==="scroll"||o==="hidden")return false;p=p.parentElement;}return true;}).slice(0,6).map(e=>e.tagName.toLowerCase()+(e.id?"#"+e.id:"")+(e.className&&typeof e.className==="string"?"."+e.className.split(" ")[0]:"")+" r="+Math.round(e.getBoundingClientRect().right));
const btn=[...document.querySelectorAll("button,a.qapp,a.btn,.rbtn")].filter(vis);const small=btn.filter(b=>b.getBoundingClientRect().height<30).slice(0,8).map(b=>(b.textContent||b.getAttribute("aria-label")||"").trim().slice(0,25)+" h="+Math.round(b.getBoundingClientRect().height));
const tiny=[...document.querySelectorAll("body *")].filter(e=>vis(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<11).slice(0,6).map(e=>(e.textContent.trim().slice(0,20))+" "+getComputedStyle(e).fontSize);
const fonts=[...new Set([...document.querySelectorAll("body *")].filter(vis).map(e=>getComputedStyle(e).fontFamily.split(",")[0].replace(/"/g,"")))];
const vs=[...document.querySelectorAll("[id^=v-]")].filter(vis).map(e=>e.id);const home=document.querySelector("#home,.home,main>#k-wetter");
const states=[...document.querySelectorAll(".state")].filter(vis).map(e=>e.textContent.trim().slice(0,50)).slice(0,5);
return {sw:document.documentElement.scrollWidth,W,over,small,tiny,fonts,vs,states};})()`;
const res={};
for(const dn of devs.split(",")){const [w,h,s,m,ua]=D[dn];await C("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:s,mobile:m});await C("Emulation.setUserAgentOverride",{userAgent:ua});await C("Emulation.setTouchEmulationEnabled",{enabled:m});
 await C("Page.navigate",{url});await sleep(6000);
 for(const v of views){if(v.startsWith("js:")){logs.length=0;for(const step of v.slice(3).split("|")){await ev(step);await sleep(3500);}const r=await ev(probe);r.logs=[...logs];r.text=await ev(`((document.querySelector("#dbg")||{}).innerText||"")+((document.querySelector("#efa")||{}).innerText||"")`);res[dn+"/u78"]=r;const shot=await C("Page.captureScreenshot",{format:"jpeg",quality:60});fs.writeFileSync(`${outdir}/${dn}-u78.jpg`,Buffer.from(shot.result.data,"base64"));continue;}logs.length=0;await ev(`location.hash=${JSON.stringify(v?"#"+v:"")};window.scrollTo(0,0);1`);await sleep(v==="oepnv"?6000:2200);
  const r=await ev(probe);r.logs=[...logs];res[dn+"/"+(v||"home")]=r;
  const shot=await C("Page.captureScreenshot",{format:"jpeg",quality:60,captureBeyondViewport:false});fs.writeFileSync(`${outdir}/${dn}-${v||"home"}.jpg`,Buffer.from(shot.result.data,"base64"));}}
fs.writeFileSync(outdir+"/res.json",JSON.stringify(res,null,1));chrome.kill();process.exit(0);
