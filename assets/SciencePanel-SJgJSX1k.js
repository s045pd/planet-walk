var a=Object.defineProperty;var l=(s,t,e)=>t in s?a(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e;var o=(s,t,e)=>l(s,typeof t!="symbol"?t+"":t,e);class r{constructor(){o(this,"root");o(this,"scanCard");o(this,"scanStatus");o(this,"scanBody");o(this,"collectHint");o(this,"logCard");o(this,"logList");o(this,"actionMessage");o(this,"messageTimer",null);o(this,"onResize",()=>{this.applyResponsiveLayout()});this.root=document.createElement("div"),this.root.style.cssText=`
      position: fixed; right: 16px; bottom: 260px; z-index: 60;
      display: flex; flex-direction: column; gap: 10px; pointer-events: auto;
      width: min(360px, calc(100vw - 32px));
      max-height: 80vh; overflow-y: auto; touch-action: pan-y;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    `,this.scanCard=document.createElement("div"),this.scanCard.style.cssText=`
      background: rgba(10, 18, 28, 0.78); border: 1px solid rgba(101, 198, 255, 0.35);
      border-radius: 10px; color: #d9f0ff; padding: 12px 14px; backdrop-filter: blur(6px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.28);
    `;const t=document.createElement("div");t.textContent="科学扫描仪",t.style.cssText="font-size:clamp(12px, 3.2vw, 13px); font-weight:700; margin-bottom:8px; color:#8fd7ff;",this.scanStatus=document.createElement("div"),this.scanStatus.style.cssText="font-size:clamp(11px, 3vw, 12px); opacity:0.9; margin-bottom:6px;",this.scanStatus.textContent="状态: 待机 (E)",this.scanBody=document.createElement("div"),this.scanBody.style.cssText="font-size:clamp(11px, 3vw, 12px); line-height:1.7; color:#c7e6ff;",this.scanBody.textContent="按 E 激活扫描仪并对准地面。",this.collectHint=document.createElement("div"),this.collectHint.style.cssText=`
      font-size:clamp(11px, 3vw, 12px); margin-top:8px; padding-top:8px;
      border-top: 1px solid rgba(126, 179, 216, 0.25); color:#ffe5a3;
      min-height: 20px;
    `,this.collectHint.textContent="",this.scanCard.append(t,this.scanStatus,this.scanBody,this.collectHint),this.logCard=document.createElement("div"),this.logCard.style.cssText=`
      background: rgba(13, 17, 24, 0.8); border: 1px solid rgba(255, 205, 113, 0.28);
      border-radius: 10px; color: #f5f8ff; padding: 12px 14px; backdrop-filter: blur(6px);
      max-height: 46vh; overflow: hidden; display: flex; flex-direction: column;
    `;const e=document.createElement("div");e.textContent="采集日志",e.style.cssText="font-size:clamp(12px, 3.2vw, 13px); font-weight:700; margin-bottom:8px; color:#ffd47f;",this.logList=document.createElement("div"),this.logList.style.cssText=`
      overflow: auto; font-size:clamp(11px, 3vw, 12px); line-height:1.6;
      display: flex; flex-direction: column; gap: 6px; padding-right: 2px;
    `,this.logList.textContent="暂无样本记录。",this.logCard.append(e,this.logList),this.actionMessage=document.createElement("div"),this.actionMessage.style.cssText=`
      min-height: 18px; font-size:clamp(11px, 3vw, 12px); color:#b4ffd8; text-shadow: 0 0 8px rgba(0,0,0,0.5);
      padding-left: 4px;
    `,this.root.append(this.scanCard,this.logCard,this.actionMessage),document.body.appendChild(this.root),this.applyResponsiveLayout(),window.addEventListener("resize",this.onResize)}setScannerActive(t){this.scanStatus.textContent=t?"状态: 扫描中 (E 关闭)":"状态: 待机 (E 开启)",this.scanCard.style.borderColor=t?"rgba(101, 198, 255, 0.55)":"rgba(101, 198, 255, 0.35)",this.logCard.style.display=t?"flex":"none",this.collectHint.style.display=t?"block":"none",t||(this.scanBody.textContent="按 E 激活扫描仪并对准地面。")}updateScanData(t){if(!t){this.scanBody.textContent="未命中地表，请将视角对准地面。";return}this.scanBody.innerHTML=[`海拔: ${t.altitude.toFixed(2)} m`,`坡度: ${t.slope.toFixed(1)}°`,`地质类型: ${t.geologyType}`,`坐标: ${t.lat.toFixed(2)}°, ${t.lng.toFixed(2)}°`,`探测距离: ${t.distance.toFixed(1)} m`].join("<br>")}updateNearbyTarget(t){if(!t){this.collectHint.textContent="附近无采集点";return}const e=t.alreadyCollected?"已采集":"按 F 采集";this.collectHint.textContent=`${e}: ${t.sample.name} @ ${t.poi.name}`}setCollectionLog(t){if(t.length===0){this.logList.textContent="暂无样本记录。";return}const e=t.slice(0,12);this.logList.innerHTML=e.map(i=>{const n=new Date(i.collectedAt).toLocaleString();return`
        <div style="padding:6px 8px;border:1px solid rgba(255,255,255,0.12);border-radius:8px;background:rgba(255,255,255,0.02)">
          <div style="color:#ffe1a5;font-weight:600">${i.sampleName}</div>
          <div style="opacity:.85">${i.planet.toUpperCase()} · ${i.poiName}</div>
          <div style="opacity:.65">${n}</div>
        </div>
      `}).join("")}showActionMessage(t,e=!1){this.actionMessage.textContent=t,this.actionMessage.style.color=e?"#a8ffd0":"#ffd5a8",this.messageTimer!==null&&window.clearTimeout(this.messageTimer),this.messageTimer=window.setTimeout(()=>{this.actionMessage.textContent="",this.messageTimer=null},2200)}dispose(){this.messageTimer!==null&&window.clearTimeout(this.messageTimer),window.removeEventListener("resize",this.onResize),this.root.remove()}applyResponsiveLayout(){if(window.innerWidth<=880||window.innerHeight<=680){this.root.style.right="12px",this.root.style.left="12px",this.root.style.bottom="12px",this.root.style.width="calc(100vw - 24px)";return}this.root.style.right="16px",this.root.style.left="auto",this.root.style.bottom="260px",this.root.style.width="min(360px, calc(100vw - 32px))"}}export{r as SciencePanel};
