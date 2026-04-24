var ft=Object.defineProperty;var vt=(l,t,e)=>t in l?ft(l,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):l[t]=e;var a=(l,t,e)=>vt(l,typeof t!="symbol"?t+"":t,e);import{S as yt,C as wt,W as bt,a as St,A as Mt,P as kt,E as xt,R as Pt,U as Ct,V as Et,b as Tt,O as At,B as W,c as S,d as A,e as G,f as st,g,h as U,M as N,i as V,j as at,k,Q as O,l as _t,m as ot,G as nt,n as Lt,D as rt,H as Dt,F as K,o as zt}from"./three-BLFfpTKp.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function e(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=e(i);fetch(i.href,o)}})();const It={uniforms:{tDiffuse:{value:null},uStrength:{value:.42},uGrainAmount:{value:.035}},vertexShader:`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    uniform float uGrainAmount;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 col = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5;
      float r = length(d);
      float v = 1.0 - smoothstep(0.28, 0.82, r) * uStrength;
      col.rgb *= v;
      float n = (hash(vUv * 1000.0) - 0.5) * uGrainAmount;
      col.rgb += n;
      gl_FragColor = col;
    }
  `};class Rt{constructor(t){a(this,"renderer");a(this,"scene",new yt);a(this,"camera");a(this,"clock",new wt);a(this,"stats",{fps:0,drawCalls:0});a(this,"composer");a(this,"bloomPass");a(this,"systems",[]);a(this,"running",!1);a(this,"frameAccum",0);a(this,"frameCount",0);a(this,"loop",()=>{if(!this.running)return;requestAnimationFrame(this.loop);const t=Math.min(this.clock.getDelta(),.1);for(const e of this.systems)e.update(t);this.composer.render(t),this.frameAccum+=t,this.frameCount++,this.frameAccum>=.5&&(this.stats.fps=this.frameCount/this.frameAccum,this.stats.drawCalls=this.renderer.info.render.calls,this.frameAccum=0,this.frameCount=0)});a(this,"handleResize",()=>{const t=window.innerWidth,e=window.innerHeight;this.renderer.setSize(t,e,!1),this.composer.setSize(t,e),this.bloomPass.setSize(t,e),this.camera.aspect=t/e,this.camera.updateProjectionMatrix()});this.renderer=new bt({canvas:t,antialias:!0,logarithmicDepthBuffer:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.renderer.setSize(window.innerWidth,window.innerHeight,!1),this.renderer.outputColorSpace=St,this.renderer.toneMapping=Mt,this.renderer.toneMappingExposure=1,this.camera=new kt(55,window.innerWidth/window.innerHeight,.1,5e4),this.camera.position.set(0,0,3e3),this.composer=new xt(this.renderer),this.composer.setSize(window.innerWidth,window.innerHeight),this.composer.addPass(new Pt(this.scene,this.camera)),this.bloomPass=new Ct(new Et(window.innerWidth,window.innerHeight),.22,.35,1.3),this.composer.addPass(this.bloomPass);const e=new Tt(It);this.composer.addPass(e),this.composer.addPass(new At),window.addEventListener("resize",this.handleResize)}register(t){this.systems.push(t)}start(){this.running||(this.running=!0,this.clock.start(),this.loop())}stop(){this.running=!1}setBloom(t,e){this.bloomPass.strength=t,this.bloomPass.threshold=e}dispose(){this.stop(),window.removeEventListener("resize",this.handleResize),this.composer.dispose(),this.renderer.dispose()}}const X={KeyW:"forward",KeyS:"back",KeyA:"left",KeyD:"right",ArrowUp:"forward",ArrowDown:"back",ArrowLeft:"left",ArrowRight:"right",Space:"jump",ShiftLeft:"sprint",ShiftRight:"sprint"};class Ht{constructor(t){a(this,"actions",new Set);a(this,"pressHandlers",new Map);a(this,"mouseDelta",{x:0,y:0});a(this,"pointerLocked",!1);a(this,"canvas");a(this,"requestPointerLock",()=>{this.pointerLocked||this.canvas.requestPointerLock()});a(this,"onKeyDown",t=>{const e=X[t.code];e&&(this.actions.add(e),t.preventDefault());const s=this.pressHandlers.get(t.code);if(s){for(const i of s)i();t.preventDefault()}});a(this,"onKeyUp",t=>{const e=X[t.code];e&&this.actions.delete(e)});a(this,"onMouseMove",t=>{this.pointerLocked&&(this.mouseDelta.x+=t.movementX,this.mouseDelta.y+=t.movementY)});a(this,"onPointerLockChange",()=>{this.pointerLocked=document.pointerLockElement===this.canvas});this.canvas=t,window.addEventListener("keydown",this.onKeyDown),window.addEventListener("keyup",this.onKeyUp),window.addEventListener("mousemove",this.onMouseMove),document.addEventListener("pointerlockchange",this.onPointerLockChange),t.addEventListener("click",this.requestPointerLock)}dispose(){window.removeEventListener("keydown",this.onKeyDown),window.removeEventListener("keyup",this.onKeyUp),window.removeEventListener("mousemove",this.onMouseMove),document.removeEventListener("pointerlockchange",this.onPointerLockChange),this.canvas.removeEventListener("click",this.requestPointerLock)}isActive(t){return this.actions.has(t)}onPress(t,e){let s=this.pressHandlers.get(t);return s||(s=new Set,this.pressHandlers.set(t,s)),s.add(e),()=>s.delete(e)}consumeMouseDelta(){const t={x:this.mouseDelta.x,y:this.mouseDelta.y};return this.mouseDelta.x=0,this.mouseDelta.y=0,t}get isPointerLocked(){return this.pointerLocked}exitPointerLock(){this.pointerLocked&&document.exitPointerLock()}}const Nt=`
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vPos = position;
    vNormal = normal;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`,Bt=`
  precision highp float;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  uniform vec3 uBaseLow;
  uniform vec3 uBaseMid;
  uniform vec3 uBaseHigh;
  uniform vec3 uPolar;
  uniform vec3 uSunDir;
  uniform float uRoughness;
  uniform float uCratering;
  uniform float uBanding;
  uniform float uTime;

  // hash & noise (IQ)
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 n = normalize(vWorldNormal);
    vec3 p = normalize(vPos);

    // terrain fbm — mixes base tones across roughness bands
    float terrain = fbm(p * 2.5);
    float detail = fbm(p * 8.0 + terrain);
    float combined = mix(terrain, detail, uRoughness);

    // horizontal banding (jupiter-like if uBanding high)
    float bands = sin(p.y * 9.0 + fbm(p * 1.5) * 2.0) * 0.5 + 0.5;
    float bandMix = mix(1.0, bands, uBanding);

    vec3 col = mix(uBaseLow, uBaseMid, smoothstep(0.25, 0.55, combined * bandMix));
    col = mix(col, uBaseHigh, smoothstep(0.55, 0.85, combined * bandMix));

    // impact craters (moon / mercury)
    if (uCratering > 0.01) {
      float crater = fbm(p * 14.0);
      float rings = smoothstep(0.72, 0.78, crater) - smoothstep(0.78, 0.82, crater);
      col -= rings * 0.18 * uCratering;
      col += smoothstep(0.82, 0.92, crater) * 0.15 * uCratering;
    }

    // polar caps
    float polar = smoothstep(0.78, 0.94, abs(p.y));
    col = mix(col, uPolar, polar);

    // lambert + rim
    float lambert = max(dot(n, normalize(uSunDir)), 0.0);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
    col *= 0.15 + 0.95 * lambert;
    col += rim * 0.08 * uBaseHigh;

    gl_FragColor = vec4(col, 1.0);
  }
`,Ft=`
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Ot=`
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform vec3 uSunDir;
  void main() {
    float fresnel = pow(1.0 - abs(vNormal.z), 3.0);
    float sun = max(dot(normalize(vPos), normalize(uSunDir)), 0.0);
    vec3 col = uColor * fresnel * (0.4 + 0.6 * sun) * uIntensity;
    gl_FragColor = vec4(col, fresnel);
  }
`,$t=`
  attribute float aSize;
  attribute float aBrightness;
  varying float vBrightness;
  void main() {
    vBrightness = aBrightness;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize;
    gl_Position = projectionMatrix * mv;
  }
`,qt=`
  precision highp float;
  varying float vBrightness;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, r);
    gl_FragColor = vec4(vec3(glow * vBrightness), glow);
  }
`;class J{constructor(t){a(this,"root",new st);a(this,"surface");a(this,"atmosphere",null);a(this,"config");a(this,"surfaceMaterial");a(this,"atmosphereMaterial",null);a(this,"sunDir",new g(1,.35,.6).normalize());this.config=t;const e=new U(t.radius,128,96);if(this.surfaceMaterial=new A({vertexShader:Nt,fragmentShader:Bt,uniforms:{uBaseLow:{value:t.surface.low.clone()},uBaseMid:{value:t.surface.mid.clone()},uBaseHigh:{value:t.surface.high.clone()},uPolar:{value:t.surface.polar.clone()},uSunDir:{value:this.sunDir.clone()},uRoughness:{value:t.surface.roughness},uCratering:{value:t.surface.cratering},uBanding:{value:t.surface.banding},uTime:{value:0}}}),this.surface=new N(e,this.surfaceMaterial),this.root.add(this.surface),t.atmosphereIntensity>.01){const s=new U(t.radius*1.035,96,64);this.atmosphereMaterial=new A({vertexShader:Ft,fragmentShader:Ot,uniforms:{uColor:{value:t.atmosphereColor.clone()},uIntensity:{value:t.atmosphereIntensity},uSunDir:{value:this.sunDir.clone()}},side:at,blending:V,transparent:!0,depthWrite:!1}),this.atmosphere=new N(s,this.atmosphereMaterial),this.root.add(this.atmosphere)}}update(t){this.surface.rotation.y+=t*(2*Math.PI)/Math.max(this.config.rotationPeriod/120,60),this.surfaceMaterial.uniforms.uTime.value+=t}dispose(){this.surface.geometry.dispose(),this.surfaceMaterial.dispose(),this.atmosphere&&(this.atmosphere.geometry.dispose(),this.atmosphereMaterial?.dispose()),this.root.clear()}}function Ut(l=2400,t=2e4){const e=new Float32Array(l*3),s=new Float32Array(l),i=new Float32Array(l);for(let r=0;r<l;r++){const h=Math.random(),p=Math.random(),d=2*Math.PI*h,u=Math.acos(2*p-1),m=t*(.85+Math.random()*.15);e[r*3+0]=m*Math.sin(u)*Math.cos(d),e[r*3+1]=m*Math.sin(u)*Math.sin(d),e[r*3+2]=m*Math.cos(u),s[r]=Math.random()<.02?3+Math.random()*2:.8+Math.random()*1.2,i[r]=.4+Math.random()*.6}const o=new W;o.setAttribute("position",new S(e,3)),o.setAttribute("aSize",new S(s,1)),o.setAttribute("aBrightness",new S(i,1));const n=new A({vertexShader:$t,fragmentShader:qt,transparent:!0,depthWrite:!1});return new G(o,n)}function Wt(l,t){const e=t.sky.top,s=t.sky.horizon;l.style.setProperty("--sky-top",`rgb(${Math.round(e.r*255)}, ${Math.round(e.g*255)}, ${Math.round(e.b*255)})`),l.style.setProperty("--sky-horizon",`rgb(${Math.round(s.r*255)}, ${Math.round(s.g*255)}, ${Math.round(s.b*255)})`);const i=t.atmosphereColor;l.style.setProperty("--accent-planet",`rgb(${Math.round(i.r*255)}, ${Math.round(i.g*255)}, ${Math.round(i.b*255)})`),new k}const c=(l,t,e)=>new k(l/255,t/255,e/255),z=(l,t)=>({palette:l,detailShift:t.detail,heightScale:t.heightScale,sunColor:t.sun,dustColor:t.dust,groundTint:t.ground,nightTop:t.nightTop,nightHorizon:t.nightHorizon,sunsetTint:t.sunset,starVisibility:t.stars,sunIntensity:t.sunI,ambientIntensity:t.ambI}),T=[{id:"terra",name:"TERRA",catalogue:"001 · SOL-III",tagline:"Blue oasis · liquid water · 1.0 g reference",radius:1e3,gravity:9.81,rotationPeriod:86400,atmosphereColor:c(90,150,255),atmosphereIntensity:1.3,surface:{low:c(20,55,110),mid:c(40,120,80),high:c(120,100,70),polar:c(230,238,245),roughness:.55,cratering:0,banding:.05},sky:{top:c(12,22,44),horizon:c(100,140,200)},surfacePalette:z({plain:[.42,.55,.28],crater:[.38,.3,.2],ridge:[.55,.5,.42],highland:[.3,.45,.22],basalt:[.32,.32,.3]},{detail:.05,heightScale:1.1,sun:c(255,248,235),dust:c(220,225,230),ground:c(45,80,50),nightTop:c(3,5,15),nightHorizon:c(14,22,40),sunset:c(255,135,70),stars:.7,sunI:1.4,ambI:.55}),solLabel:"UTC",landingSite:{lat:27.988,lon:86.925,name:"Sagarmatha · Himalaya"},notes:["29% land · 71% hydrosphere","Biosphere active","Magnetic field nominal"]},{id:"mars",name:"MARS",catalogue:"002 · SOL-IV",tagline:"Rust desert · thin CO₂ · Valles Marineris",radius:532,gravity:3.72,rotationPeriod:88642,atmosphereColor:c(210,130,90),atmosphereIntensity:.55,surface:{low:c(82,32,18),mid:c(158,81,48),high:c(210,145,95),polar:c(240,235,225),roughness:.7,cratering:.35,banding:0},sky:{top:c(20,12,10),horizon:c(180,110,80)},surfacePalette:z({plain:[.76,.5,.32],crater:[.55,.35,.22],ridge:[.6,.38,.25],highland:[.72,.48,.3],basalt:[.4,.28,.2]},{detail:.06,heightScale:1.2,sun:c(255,216,175),dust:c(220,150,100),ground:c(90,40,20),nightTop:c(3,2,5),nightHorizon:c(20,14,14),sunset:c(90,130,220),stars:.85,sunI:1.2,ambI:.45}),solLabel:"LMST",landingSite:{lat:-14.502,lon:175.83,name:"Jezero Approach"},notes:["Atm. pressure 0.6 kPa","Olympus Mons +21,229 m","Dust storm cycle · low"]},{id:"luna",name:"LUNA",catalogue:"003 · EARTH-I",tagline:"Silver regolith · no atm · tidally locked",radius:272,gravity:1.62,rotationPeriod:2360591,atmosphereColor:c(120,120,130),atmosphereIntensity:0,surface:{low:c(55,55,58),mid:c(140,138,135),high:c(210,208,200),polar:c(230,230,225),roughness:.85,cratering:.9,banding:0},sky:{top:c(0,0,0),horizon:c(10,10,12)},surfacePalette:z({plain:[.45,.45,.42],crater:[.26,.26,.24],ridge:[.55,.53,.48],highland:[.66,.64,.58],basalt:[.32,.32,.3]},{detail:.08,heightScale:1.5,sun:c(255,255,245),dust:c(180,180,170),ground:c(60,60,60),nightTop:c(0,0,0),nightHorizon:c(3,3,5),sunset:c(80,80,90),stars:1,sunI:1.6,ambI:.12}),solLabel:"UTC",landingSite:{lat:.673,lon:23.473,name:"Mare Tranquillitatis"},notes:["Vacuum surface","Day/night swing 250 K","Crater density · high"]},{id:"venus",name:"VENUS",catalogue:"004 · SOL-II",tagline:"Sulfuric haze · 92 atm · retrograde",radius:950,gravity:8.87,rotationPeriod:20995200,atmosphereColor:c(255,200,120),atmosphereIntensity:2.1,surface:{low:c(110,70,30),mid:c(210,170,100),high:c(245,220,160),polar:c(250,235,200),roughness:.3,cratering:.1,banding:.6},sky:{top:c(120,70,20),horizon:c(255,190,110)},surfacePalette:z({plain:[.78,.58,.3],crater:[.6,.4,.22],ridge:[.7,.5,.26],highland:[.88,.68,.38],basalt:[.4,.25,.12]},{detail:.05,heightScale:.9,sun:c(255,180,90),dust:c(235,185,110),ground:c(120,70,20),nightTop:c(40,20,10),nightHorizon:c(80,45,18),sunset:c(255,110,40),stars:0,sunI:1.1,ambI:.75}),solLabel:"VST",landingSite:{lat:3.2,lon:298,name:"Ishtar Terra · Maxwell"},notes:["Surface 464 °C","96.5% CO₂ atmosphere","Retrograde rotation"]},{id:"europa",name:"EUROPA",catalogue:"005 · JUPITER-II",tagline:"Ice shell · cryosea · chaos terrain",radius:240,gravity:1.31,rotationPeriod:306720,atmosphereColor:c(180,210,240),atmosphereIntensity:.25,surface:{low:c(140,135,150),mid:c(210,220,235),high:c(250,250,255),polar:c(255,255,255),roughness:.15,cratering:.05,banding:.35},sky:{top:c(4,8,18),horizon:c(80,100,140)},surfacePalette:z({plain:[.82,.88,.95],crater:[.55,.62,.72],ridge:[.88,.92,.97],highland:[.94,.96,1],basalt:[.4,.52,.7]},{detail:.06,heightScale:.6,sun:c(215,225,255),dust:c(180,210,245),ground:c(160,190,220),nightTop:c(1,2,10),nightHorizon:c(6,12,28),sunset:c(180,200,240),stars:.95,sunI:.8,ambI:.4}),solLabel:"JST",landingSite:{lat:12.5,lon:180,name:"Conamara Chaos"},notes:["Subsurface ocean suspected","Surface −170 °C","Jupiter radiation · high"]}],Gt="mars",Q=Math.PI/180,Z=180/Math.PI;function Vt(l,t,e,s=new g){const i=l*Q,o=t*Q,n=Math.cos(i);return s.set(e*n*Math.cos(o),e*Math.sin(i),e*n*Math.sin(o)),s}function jt(l){const t=l.length();if(t<1e-6)return{lat:0,lon:0};const e=Math.asin(l.y/t)*Z,s=Math.atan2(l.z,l.x)*Z;return{lat:e,lon:s}}function C(l,t,e){return l<t?t:l>e?e:l}function Yt(l,t,e){return l+(t-l)*e}function $(l,t,e,s){return Yt(l,t,1-Math.exp(-e*s))}function tt(l,t){const e=l>=0?"+":"−",s=Math.abs(l).toFixed(3);return`${e}${s}°`}class Kt{constructor(t,e){a(this,"camera");a(this,"target",new g);a(this,"state");a(this,"desired");a(this,"dragging",!1);a(this,"lastPointer",{x:0,y:0});a(this,"minDistance");a(this,"maxDistance");a(this,"surfaceDistance");a(this,"onPointerDown",t=>{if(t.button!==0||document.pointerLockElement)return;const e=t.target;e&&e.closest("[data-ui]")||(this.dragging=!0,this.lastPointer.x=t.clientX,this.lastPointer.y=t.clientY)});a(this,"onPointerMove",t=>{if(!this.dragging)return;const e=t.clientX-this.lastPointer.x,s=t.clientY-this.lastPointer.y;this.lastPointer.x=t.clientX,this.lastPointer.y=t.clientY,this.desired.azimuth-=e*.005,this.desired.polar=C(this.desired.polar-s*.005,.15,Math.PI-.15)});a(this,"onPointerUp",()=>{this.dragging=!1});a(this,"onWheel",t=>{if(document.pointerLockElement)return;t.preventDefault();const e=Math.exp(t.deltaY*.001);this.desired.distance=C(this.desired.distance*e,this.minDistance,this.maxDistance)});this.camera=t,this.minDistance=e*1.6,this.maxDistance=e*7,this.surfaceDistance=e*1.05,this.state={azimuth:.4,polar:1.2,distance:e*3},this.desired={...this.state},window.addEventListener("pointerdown",this.onPointerDown),window.addEventListener("pointermove",this.onPointerMove),window.addEventListener("pointerup",this.onPointerUp),window.addEventListener("pointercancel",this.onPointerUp),window.addEventListener("wheel",this.onWheel,{passive:!1})}dispose(){window.removeEventListener("pointerdown",this.onPointerDown),window.removeEventListener("pointermove",this.onPointerMove),window.removeEventListener("pointerup",this.onPointerUp),window.removeEventListener("pointercancel",this.onPointerUp),window.removeEventListener("wheel",this.onWheel)}reconfigure(t){this.minDistance=t*1.6,this.maxDistance=t*7,this.surfaceDistance=t*1.05,this.desired.distance=C(this.desired.distance,this.minDistance,this.maxDistance)}getApproachDistance(){return this.surfaceDistance}getState(){return this.state}setDesired(t){t.azimuth!==void 0&&(this.desired.azimuth=t.azimuth),t.polar!==void 0&&(this.desired.polar=C(t.polar,.15,Math.PI-.15)),t.distance!==void 0&&(this.desired.distance=C(t.distance,this.minDistance,this.maxDistance))}update(t){this.state.azimuth=$(this.state.azimuth,this.desired.azimuth,8,t),this.state.polar=$(this.state.polar,this.desired.polar,8,t),this.state.distance=$(this.state.distance,this.desired.distance,6,t);const{azimuth:e,polar:s,distance:i}=this.state,o=Math.sin(s);this.camera.position.set(this.target.x+i*o*Math.cos(e),this.target.y+i*Math.cos(s),this.target.z+i*o*Math.sin(e)),this.camera.up.set(0,1,0),this.camera.lookAt(this.target)}}const et=new g(0,1,0);class Xt{constructor(t,e){a(this,"camera");a(this,"input");a(this,"position",new g);a(this,"velocity",new g);a(this,"up",new g(0,1,0));a(this,"forward",new g(0,0,-1));a(this,"right",new g(1,0,0));a(this,"yaw",0);a(this,"pitch",0);a(this,"headHeight",1.7);a(this,"planetRadius",1e3);a(this,"gravity",9.81);a(this,"onGround",!0);a(this,"config",null);a(this,"mode","orbit");a(this,"surface",null);a(this,"walking",!1);a(this,"sprinting",!1);a(this,"bobPhase",0);this.camera=t,this.input=e}setConfig(t,e){this.config=t,this.planetRadius=t.radius,this.gravity=t.gravity;const s=e??t.landingSite;this.placeAt(s.lat,s.lon),this.yaw=0,this.pitch=0}enterSurface(t){this.surface=t,this.mode="surface";const e=t.getHeightAt(0,0);this.position.set(0,e+this.headHeight,0),this.velocity.set(0,0,0),this.up.set(0,1,0),this.yaw=0,this.pitch=0,this.rebuildPlanarBasis(),this.applyPlanarCamera(),this.onGround=!0}exitSurface(){this.mode="orbit",this.surface=null,this.config&&this.placeAt(this.config.landingSite.lat,this.config.landingSite.lon)}placeAt(t,e){Vt(t,e,this.planetRadius+this.headHeight,this.position),this.up.copy(this.position).normalize(),this.rebuildSphericalBasis(),this.velocity.set(0,0,0),this.applySphericalCamera()}update(t){this.config&&(this.mode==="surface"&&this.surface?this.updateSurface(t,this.surface):this.updateSpherical(t))}snapshot(){if(this.mode==="surface"&&this.surface){const n=this.velocity.length(),r=(-this.yaw*180/Math.PI%360+360)%360;return{position:this.position.clone(),up:new g(0,1,0),lat:this.config?.landingSite.lat??0,lon:this.config?.landingSite.lon??0,altitude:this.position.y,speed:n,heading:r,pitch:this.pitch*180/Math.PI,roll:0,walking:this.walking,sprinting:this.sprinting,onGround:this.onGround}}const{lat:t,lon:e}=jt(this.position),s=this.position.length()-this.planetRadius,i=this.velocity.length(),o=(Math.atan2(this.forward.x,this.forward.z)*180/Math.PI%360+360)%360;return{position:this.position.clone(),up:this.up.clone(),lat:t,lon:e,altitude:s,speed:i,heading:o,pitch:this.pitch*180/Math.PI,roll:0,walking:!1,sprinting:!1,onGround:this.onGround}}updateSurface(t,e){if(this.input.isPointerLocked){const u=this.input.consumeMouseDelta();this.yaw-=u.x*.0022,this.pitch=C(this.pitch-u.y*.0022,-Math.PI/2+.05,Math.PI/2-.05)}this.rebuildPlanarBasis();const s=new g;this.input.isActive("forward")&&s.add(this.forward),this.input.isActive("back")&&s.sub(this.forward),this.input.isActive("right")&&s.add(this.right),this.input.isActive("left")&&s.sub(this.right),s.lengthSq()>0&&s.normalize(),this.sprinting=this.input.isActive("sprint");const o=6*(this.sprinting?2.2:1),n=new g(this.velocity.x,0,this.velocity.z),r=s.multiplyScalar(o);n.lerp(r,this.onGround?.22:.05);let h=this.velocity.y-this.gravity*t;this.onGround&&this.input.isActive("jump")&&(h=Math.sqrt(2*this.gravity*2.2)),this.velocity.set(n.x,h,n.z),this.position.addScaledVector(this.velocity,t);const p=e.getHeightAt(this.position.x,this.position.z)+this.headHeight;this.position.y<=p+.001?(this.position.y=p,this.velocity.y=Math.max(this.velocity.y,0),this.onGround=!0):this.onGround=!1;const d=Math.hypot(n.x,n.z);if(this.walking=d>1.5&&this.onGround,this.walking){const u=this.sprinting?13:9;this.bobPhase+=t*u}else this.bobPhase*=Math.exp(-t*6);this.applyPlanarCamera()}updateSpherical(t){if(this.input.isPointerLocked){const d=this.input.consumeMouseDelta();this.yaw-=d.x*.0022,this.pitch=C(this.pitch-d.y*.0022,-Math.PI/2+.05,Math.PI/2-.05)}this.up.copy(this.position).normalize(),this.rebuildSphericalBasis();const e=new g;this.input.isActive("forward")&&e.add(this.forward),this.input.isActive("back")&&e.sub(this.forward),this.input.isActive("right")&&e.add(this.right),this.input.isActive("left")&&e.sub(this.right),e.lengthSq()>0&&e.normalize();const i=6*(this.input.isActive("sprint")?2.2:1),o=this.velocity.clone().projectOnPlane(this.up),n=e.multiplyScalar(i);o.lerp(n,this.onGround?.22:.03);let h=this.velocity.dot(this.up)-this.gravity*3*t;this.onGround&&this.input.isActive("jump")&&(h=Math.sqrt(2*this.gravity*3*2.2)),this.velocity.copy(o).add(this.up.clone().multiplyScalar(h)),this.position.addScaledVector(this.velocity,t);const p=this.planetRadius+this.headHeight;this.position.length()<=p+.001?(this.position.setLength(p),this.velocity.copy(o),this.onGround=!0):this.onGround=!1,this.applySphericalCamera()}rebuildSphericalBasis(){const t=Math.abs(this.up.dot(et))>.95?new g(0,0,1):et;this.right.copy(t).cross(this.up).normalize(),this.forward.copy(this.up).cross(this.right).normalize();const e=new O().setFromAxisAngle(this.up,this.yaw);this.forward.applyQuaternion(e),this.right.applyQuaternion(e)}rebuildPlanarBasis(){this.forward.set(-Math.sin(this.yaw),0,-Math.cos(this.yaw)),this.right.set(Math.cos(this.yaw),0,-Math.sin(this.yaw)),this.up.set(0,1,0)}applySphericalCamera(){this.camera.position.copy(this.position);const t=this.forward.clone(),e=new O().setFromAxisAngle(this.right,this.pitch);t.applyQuaternion(e),this.camera.up.copy(this.up),this.camera.lookAt(this.position.clone().add(t))}applyPlanarCamera(){if(this.camera.position.copy(this.position),this.walking){const s=this.sprinting?.09:.055,i=this.sprinting?.06:.035;this.camera.position.y+=Math.sin(this.bobPhase)*s,this.camera.position.addScaledVector(this.right,Math.cos(this.bobPhase*.5)*i)}const t=this.forward.clone(),e=new O().setFromAxisAngle(this.right,this.pitch);t.applyQuaternion(e),this.camera.up.set(0,1,0),this.camera.lookAt(this.camera.position.clone().add(t))}}const I=l=>new k(l[0],l[1],l[2]);function lt(l){const t=l.detailShift,e=l.heightScale,s=(i,o)=>new k(Math.max(0,i[0]+o),Math.max(0,i[1]+o),Math.max(0,i[2]+o));return{plain:{id:"plain",baseHeight:0,heightScale:2*e,color:I(l.palette.plain),detail:s(l.palette.plain,-t)},crater:{id:"crater",baseHeight:-3,heightScale:6*e,color:I(l.palette.crater),detail:s(l.palette.crater,-t)},ridge:{id:"ridge",baseHeight:-6,heightScale:10*e,color:I(l.palette.ridge),detail:s(l.palette.ridge,-t)},highland:{id:"highland",baseHeight:3,heightScale:6*e,color:I(l.palette.highland),detail:s(l.palette.highland,-t)},basalt:{id:"basalt",baseHeight:5,heightScale:8*e,color:I(l.palette.basalt),detail:s(l.palette.basalt,-t)}}}function j(l,t,e){const s=l.fbm(t*.002,e*.002,2,2,.5);return l.noise2D(t*.003,e*.003)>.6?"ridge":s<-.3?"crater":s>.4?"basalt":s>.15?"highland":"plain"}function ht(l,t,e,s){const i=j(l,t,e),o=s[i];let n=o.baseHeight;if(n+=l.fbm(t*.01,e*.01,3,2,.5)*o.heightScale,n+=l.noise2D(t*.05,e*.05)*1.2,i==="crater"){const r=l.noise2D(t*.008,e*.008);r>.3&&(n-=(r-.3)*12)}if(i==="ridge"){const r=l.ridge(t*.003,e*.003,2,2,.5);r>.7&&(n-=(r-.7)*26)}return n}class Jt{constructor(t){a(this,"mesh");a(this,"cx");a(this,"cz");a(this,"biomes");this.cx=t.cx,this.cz=t.cz,this.biomes=lt(t.palette);const e=t.cx*t.chunkSize,s=t.cz*t.chunkSize,i=new _t(t.chunkSize,t.chunkSize,t.segments,t.segments);i.rotateX(-Math.PI/2);const o=i.attributes.position,n=new Float32Array(o.count*3),r=new k;for(let p=0;p<o.count;p++){const d=o.getX(p),u=o.getZ(p),m=d+e,f=u+s,y=ht(t.noise,m,f,this.biomes),x=t.extraHeight?t.extraHeight(m,f):0,w=y+x;o.setY(p,w);const _=j(t.noise,m,f),v=this.biomes[_],M=t.noise.noise2D(m*.1,f*.1)*.5+.5;r.r=v.color.r+(v.detail.r-v.color.r)*M,r.g=v.color.g+(v.detail.g-v.color.g)*M,r.b=v.color.b+(v.detail.b-v.color.b)*M;const L=x>1?Math.max(.55,1-x*.008):1,P=Math.max(.75,Math.min(1.25,1+w*.012))*L;n[p*3+0]=r.r*P,n[p*3+1]=r.g*P,n[p*3+2]=r.b*P}i.setAttribute("color",new S(n,3)),i.computeVertexNormals();const h=new ot({vertexColors:!0,flatShading:!1,roughness:.95,metalness:0});this.mesh=new N(i,h),this.mesh.position.set(e+t.chunkSize/2,0,s+t.chunkSize/2),this.mesh.receiveShadow=!0,this.mesh.frustumCulled=!0}dispose(){this.mesh.geometry.dispose(),this.mesh.material.dispose()}}const Qt=.5*(Math.sqrt(3)-1),R=(3-Math.sqrt(3))/6,Zt=[[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];class ct{constructor(t=0){a(this,"perm",new Uint8Array(512));a(this,"permMod8",new Uint8Array(512));const e=new Uint8Array(256);for(let i=0;i<256;i++)e[i]=i;let s=t|0||1;for(let i=255;i>0;i--){s=s*16807%2147483647;const o=s%(i+1),n=e[i];e[i]=e[o],e[o]=n}for(let i=0;i<512;i++)this.perm[i]=e[i&255],this.permMod8[i]=this.perm[i]&7}noise2D(t,e){const{perm:s,permMod8:i}=this,o=(t+e)*Qt,n=Math.floor(t+o),r=Math.floor(e+o),h=(n+r)*R,p=n-h,d=r-h,u=t-p,m=e-d,f=u>m?1:0,y=u>m?0:1,x=u-f+R,w=m-y+R,_=u-1+2*R,v=m-1+2*R,M=n&255,L=r&255,P=(gt,B,F)=>{let D=.5-B*B-F*F;if(D<0)return 0;D*=D;const Y=Zt[gt];return D*D*(Y[0]*B+Y[1]*F)},ut=P(i[M+s[L]],u,m),pt=P(i[M+f+s[L+y]],x,w),mt=P(i[M+1+s[L+1]],_,v);return 70*(ut+pt+mt)}fbm(t,e,s=5,i=2,o=.5){let n=0,r=1,h=1,p=0;for(let d=0;d<s;d++)n+=r*this.noise2D(t*h,e*h),p+=r,r*=o,h*=i;return n/p}ridge(t,e,s=4,i=2,o=.5){let n=0,r=1,h=1,p=0;for(let d=0;d<s;d++){let u=this.noise2D(t*h,e*h);u=1-Math.abs(u),u*=u,n+=r*u,p+=r,r*=o,h*=i}return n/p}}class te{constructor(t){a(this,"root",new nt);a(this,"noise");a(this,"options");a(this,"chunks",new Map);a(this,"lastCx",null);a(this,"lastCz",null);a(this,"biomes");this.options=t,this.noise=new ct(t.seed),this.biomes=lt(t.palette)}key(t,e){return`${t},${e}`}update(t,e,s=2){const{chunkSize:i,viewDistance:o}=this.options,n=Math.floor(t/i),r=Math.floor(e/i);if(n===this.lastCx&&r===this.lastCz)return;this.lastCx=n,this.lastCz=r;const h=new Set;let p=0;for(let d=-o;d<=o;d++)for(let u=-o;u<=o;u++){const m=this.key(n+u,r+d);h.add(m),!this.chunks.has(m)&&p<s&&(this.spawn(n+u,r+d),p++)}p>=s&&(this.lastCx=null,this.lastCz=null);for(const[d,u]of this.chunks)h.has(d)||(this.root.remove(u.mesh),u.dispose(),this.chunks.delete(d))}preload(t,e){const{chunkSize:s,viewDistance:i}=this.options,o=Math.floor(t/s),n=Math.floor(e/s);this.lastCx=o,this.lastCz=n;for(let r=-i;r<=i;r++)for(let h=-i;h<=i;h++){const p=this.key(o+h,n+r);this.chunks.has(p)||this.spawn(o+h,n+r)}}getHeightAt(t,e){let s=ht(this.noise,t,e,this.biomes);return this.options.extraHeight&&(s+=this.options.extraHeight(t,e)),s}dispose(){for(const t of this.chunks.values())this.root.remove(t.mesh),t.dispose();this.chunks.clear(),this.root.clear()}spawn(t,e){const s=new Jt({cx:t,cz:e,chunkSize:this.options.chunkSize,segments:this.options.chunkSegments,noise:this.noise,palette:this.options.palette,extraHeight:this.options.extraHeight});this.chunks.set(this.key(t,e),s),this.root.add(s.mesh)}}const ee=`
  attribute float aSize;
  attribute float aLife;
  varying float vLife;
  void main() {
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (28.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`,ie=`
  precision highp float;
  varying float vLife;
  uniform vec3 uColor;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, r) * vLife;
    gl_FragColor = vec4(uColor, alpha * 0.28);
  }
`;class se{constructor(t){a(this,"points");a(this,"geo");a(this,"material");a(this,"count");a(this,"radius");a(this,"positions");a(this,"velocities");a(this,"lives");a(this,"sizes");a(this,"origin",new g);a(this,"windX",.2);a(this,"windZ",.05);this.count=t.count,this.radius=t.radius,this.positions=new Float32Array(this.count*3),this.velocities=new Float32Array(this.count*3),this.lives=new Float32Array(this.count),this.sizes=new Float32Array(this.count);for(let e=0;e<this.count;e++)this.spawn(e,!0);this.geo=new W,this.geo.setAttribute("position",new S(this.positions,3)),this.geo.setAttribute("aLife",new S(this.lives,1)),this.geo.setAttribute("aSize",new S(this.sizes,1)),this.material=new A({vertexShader:ee,fragmentShader:ie,transparent:!0,depthWrite:!1,blending:V,uniforms:{uColor:{value:t.color.clone()}}}),this.points=new G(this.geo,this.material),this.points.frustumCulled=!1}setOrigin(t){this.origin.copy(t)}setWind(t){this.windX=.1+t*2.2,this.windZ=.05+t*.6}update(t){for(let e=0;e<this.count;e++){const s=e*3;this.positions[s+0]+=this.velocities[s+0]*t+this.windX*t,this.positions[s+1]+=this.velocities[s+1]*t,this.positions[s+2]+=this.velocities[s+2]*t+this.windZ*t,this.lives[e]-=t*.15;const i=this.positions[s+0]-this.origin.x,o=this.positions[s+2]-this.origin.z;(this.lives[e]<=0||i*i+o*o>this.radius*this.radius)&&this.spawn(e,!1)}this.geo.attributes.position.needsUpdate=!0,this.geo.attributes.aLife.needsUpdate=!0}dispose(){this.geo.dispose(),this.material.dispose()}spawn(t,e){const s=t*3,i=Math.random()*Math.PI*2,o=Math.sqrt(Math.random())*this.radius;this.positions[s+0]=this.origin.x+Math.cos(i)*o,this.positions[s+1]=this.origin.y-1.2+Math.random()*7,this.positions[s+2]=this.origin.z+Math.sin(i)*o,this.velocities[s+0]=(Math.random()-.5)*.3,this.velocities[s+1]=(Math.random()-.4)*.15,this.velocities[s+2]=(Math.random()-.5)*.3,this.lives[t]=e?Math.random():.7+Math.random()*.3,this.sizes[t]=1.5+Math.random()*3}}const ae=l=>{switch(l){case"mars":return{distance:360,primary:{offset:new g(0,0,-360),radius:200,height:110,tilt:0,colorScale:.55},secondaries:[{offset:new g(-260,0,-310),radius:60,height:40,tilt:.06,colorScale:.48},{offset:new g(180,0,-330),radius:70,height:52,tilt:-.04,colorScale:.5}],label:"Olympus Mons"};case"terra":return{distance:360,primary:{offset:new g(60,0,-340),radius:220,height:140,tilt:0,colorScale:.6},secondaries:[{offset:new g(-220,0,-300),radius:90,height:76,tilt:.05,colorScale:.5},{offset:new g(280,0,-280),radius:110,height:90,tilt:-.03,colorScale:.55},{offset:new g(-120,0,-380),radius:140,height:100,tilt:.02,colorScale:.58}],label:"Himalayan Ridge"};case"luna":return{distance:340,primary:{offset:new g(20,0,-320),radius:160,height:48,tilt:0,colorScale:.7},secondaries:[{offset:new g(-240,0,-280),radius:100,height:28,tilt:.04,colorScale:.65},{offset:new g(210,0,-300),radius:130,height:40,tilt:-.03,colorScale:.68}],label:"Crater Rim"};case"venus":return{distance:380,primary:{offset:new g(-40,0,-380),radius:240,height:96,tilt:0,colorScale:.5},secondaries:[{offset:new g(200,0,-320),radius:90,height:56,tilt:-.04,colorScale:.48}],label:"Maxwell Montes"};case"europa":return{distance:320,primary:{offset:new g(0,0,-320),radius:180,height:30,tilt:0,colorScale:.7},secondaries:[{offset:new g(-210,0,-280),radius:70,height:18,tilt:.08,colorScale:.66},{offset:new g(180,0,-290),radius:90,height:22,tilt:-.06,colorScale:.72},{offset:new g(40,0,-400),radius:110,height:26,tilt:.02,colorScale:.68}],label:"Conamara Chaos"};default:return{distance:340,primary:{offset:new g(0,0,-340),radius:180,height:70,tilt:0,colorScale:.5},secondaries:[],label:"Distant Ridge"}}};class oe{constructor(t,e){a(this,"root",new nt);a(this,"meshes",[]);a(this,"material");a(this,"specs");a(this,"noise");a(this,"profile");this.profile=ae(t.id),this.specs=[this.profile.primary,...this.profile.secondaries],this.noise=new ct(e+7);const s=t.surface.high.clone().multiplyScalar(this.profile.primary.colorScale);this.material=new ot({color:s,roughness:1,metalness:0,flatShading:!0,emissive:t.surface.low.clone().multiplyScalar(.05)});for(const i of this.specs){const o=this.buildCap(i);this.meshes.push(o),this.root.add(o)}}heightField(t,e){let s=0;for(const i of this.specs){const o=t-i.offset.x,n=e-i.offset.z,r=Math.hypot(o,n);if(r>=i.radius)continue;const h=1-r/i.radius,p=h*h*(3-2*h),d=.88+this.noise.noise2D(t*.02,e*.02)*.12;s+=p*i.height*.82*d}return s}positionCapMeshes(t){for(let e=0;e<this.specs.length;e++){const s=this.specs[e],i=this.meshes[e];if(!i)continue;const o=t(s.offset.x,s.offset.z);i.position.x=s.offset.x,i.position.z=s.offset.z,i.position.y=o-s.height*.18}}dispose(){for(const t of this.meshes)t.geometry.dispose();this.material.dispose(),this.root.clear()}buildCap(t){const e=t.height*.55,s=t.radius*.35,i=new Lt(s,e,12,3,!1),o=i.attributes.position;for(let r=0;r<o.count;r++){const h=o.getX(r),p=o.getY(r),d=o.getZ(r),u=this.noise.fbm(h*.04,d*.04,3,2,.5)*s*.18;o.setX(r,h+u*.6),o.setZ(r,d+u*.6),p>-e*.4&&o.setY(r,p+u*.3)}o.needsUpdate=!0,i.computeVertexNormals();const n=new N(i,this.material);return n.rotation.z=t.tilt,n.rotation.y=Math.random()*Math.PI,n}}const ne=`
  varying vec3 vPos;
  void main() {
    vPos = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,re=`
  precision highp float;
  varying vec3 vPos;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunSize;
  uniform float uStarVisibility;
  // hash for starfield
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  void main() {
    vec3 dir = normalize(vPos);
    float h = smoothstep(-0.15, 0.55, dir.y);
    vec3 col = mix(uHorizon, uTop, h);

    // stars (visible at night and on airless bodies)
    if (uStarVisibility > 0.01 && dir.y > 0.0) {
      vec2 uv = dir.xz * 8.0 + dir.y * 2.0;
      float cell = hash(floor(uv * 30.0));
      float star = smoothstep(0.995, 1.0, cell);
      col += vec3(star) * uStarVisibility * (0.5 + 0.5 * hash(floor(uv * 14.0)));
    }

    // sun disc + glow
    vec3 sd = normalize(uSunDir);
    float sdot = max(dot(dir, sd), 0.0);
    float sun = smoothstep(0.998 - uSunSize, 0.998, sdot);
    float glow = pow(max(sdot, 0.0), 48.0) * 0.6;
    col = mix(col, uSunColor, sun);
    col += uSunColor * glow * 0.45;

    gl_FragColor = vec4(col, 1.0);
  }
`;class le{constructor(t){a(this,"mesh");a(this,"material");const e=new U(t.radius,48,24);this.material=new A({vertexShader:ne,fragmentShader:re,side:at,depthWrite:!1,uniforms:{uTop:{value:t.top.clone()},uHorizon:{value:t.horizon.clone()},uSunColor:{value:t.sunColor.clone()},uSunDir:{value:t.sunDir},uSunSize:{value:.0025},uStarVisibility:{value:0}}}),this.mesh=new N(e,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=-1}setPhase(t){const e=this.material.uniforms;e.uTop.value.copy(t.top),e.uHorizon.value.copy(t.horizon),e.uSunColor.value.copy(t.sunColor),e.uSunDir.value=t.sunDir,e.uSunSize.value=t.sunSize,e.uStarVisibility.value=t.starVisibility}dispose(){this.mesh.geometry.dispose(),this.material.dispose()}}const he=`
  attribute float aSize;
  attribute float aLife;
  varying float vLife;
  void main() {
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (28.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`,ce=`
  precision highp float;
  varying float vLife;
  uniform vec3 uColor;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, r) * vLife;
    gl_FragColor = vec4(uColor, alpha * 0.55);
  }
`;class de{constructor(t){a(this,"points");a(this,"geo");a(this,"material");a(this,"capacity");a(this,"positions");a(this,"velocities");a(this,"lives");a(this,"sizes");a(this,"cursor",0);a(this,"origin",new g);a(this,"emitting",!1);a(this,"emitAccum",0);a(this,"emitRate",32);a(this,"sprintBoost",1);this.capacity=t.capacity,this.positions=new Float32Array(this.capacity*3),this.velocities=new Float32Array(this.capacity*3),this.lives=new Float32Array(this.capacity),this.sizes=new Float32Array(this.capacity);for(let e=0;e<this.capacity;e++)this.lives[e]=0;this.geo=new W,this.geo.setAttribute("position",new S(this.positions,3)),this.geo.setAttribute("aLife",new S(this.lives,1)),this.geo.setAttribute("aSize",new S(this.sizes,1)),this.material=new A({vertexShader:he,fragmentShader:ce,transparent:!0,depthWrite:!1,blending:V,uniforms:{uColor:{value:t.color.clone()}}}),this.points=new G(this.geo,this.material),this.points.frustumCulled=!1}setEmitter(t,e,s){this.origin.copy(t),this.emitting=e,this.sprintBoost=s?1.8:1}update(t){for(let e=0;e<this.capacity;e++){if(this.lives[e]<=0)continue;const s=e*3;this.positions[s+0]+=this.velocities[s+0]*t,this.positions[s+1]+=this.velocities[s+1]*t,this.positions[s+2]+=this.velocities[s+2]*t,this.velocities[s+1]-=4*t,this.lives[e]-=t*1.4,this.lives[e]<0&&(this.lives[e]=0)}if(this.emitting)for(this.emitAccum+=t*this.emitRate*this.sprintBoost;this.emitAccum>=1;)this.emitAccum-=1,this.spawn();else this.emitAccum=0;this.geo.attributes.position.needsUpdate=!0,this.geo.attributes.aLife.needsUpdate=!0,this.geo.attributes.aSize.needsUpdate=!0}dispose(){this.geo.dispose(),this.material.dispose()}spawn(){const t=this.cursor;this.cursor=(this.cursor+1)%this.capacity;const e=t*3,s=Math.random()*Math.PI*2,i=Math.random()*.5;this.positions[e+0]=this.origin.x+Math.cos(s)*i,this.positions[e+1]=this.origin.y-1.5+Math.random()*.3,this.positions[e+2]=this.origin.z+Math.sin(s)*i;const o=Math.random()*Math.PI*2,n=.8+Math.random()*1.2;this.velocities[e+0]=Math.cos(o)*n,this.velocities[e+1]=1.2+Math.random()*1.8,this.velocities[e+2]=Math.sin(o)*n,this.lives[t]=.8+Math.random()*.4,this.sizes[t]=2.5+Math.random()*2.5}}const q=300;class ue{constructor(t,e){a(this,"root",new st);a(this,"scene");a(this,"chunks",null);a(this,"sky",null);a(this,"dust",null);a(this,"walkDust",null);a(this,"landmarks",null);a(this,"sun");a(this,"hemi");a(this,"prevFog");a(this,"prevBg");a(this,"config",null);a(this,"options");a(this,"cycleTime",q*.28);a(this,"fogColorHolder",new k);a(this,"skyTopTmp",new k);a(this,"skyHorizonTmp",new k);a(this,"sunColorTmp",new k);a(this,"viewRadiusWorld");a(this,"dayInfo",{sunAltitude:1,dayFactor:1,nightFactor:0,sunsetFactor:0,phaseLabel:"DAY",localTime:"12:00"});this.scene=t,this.options=e,this.viewRadiusWorld=e.chunkSize*(e.viewDistance+.5),this.sun=new rt(16777215,1.4),this.sun.position.set(50,80,40),this.hemi=new Dt(16777215,0,.55),this.root.add(this.sun,this.hemi),this.prevBg=this.scene.background,this.prevFog=this.scene.fog,this.root.visible=!1}load(t){this.config=t,this.unloadMeshes(),this.landmarks=new oe(t,t.id.charCodeAt(0)*9+11),this.root.add(this.landmarks.root),this.chunks=new te({chunkSize:this.options.chunkSize,chunkSegments:this.options.chunkSegments,viewDistance:this.options.viewDistance,seed:t.id.charCodeAt(0)+t.id.length*13,palette:t.surfacePalette,extraHeight:(e,s)=>this.landmarks?this.landmarks.heightField(e,s):0}),this.chunks.preload(0,0),this.root.add(this.chunks.root),this.landmarks.positionCapMeshes((e,s)=>this.chunks.getHeightAt(e,s)),this.sky=new le({top:t.sky.top.clone(),horizon:t.sky.horizon.clone(),sunColor:t.surfacePalette.sunColor.clone(),sunDir:[.4,.8,.2],radius:this.viewRadiusWorld*2}),this.root.add(this.sky.mesh),this.dust=new se({color:t.surfacePalette.dustColor.clone(),count:240,radius:35}),this.root.add(this.dust.points),this.walkDust=new de({color:t.surfacePalette.dustColor.clone(),capacity:180}),this.root.add(this.walkDust.points),this.hemi.color.copy(t.sky.horizon),this.hemi.groundColor.copy(t.surfacePalette.groundTint),this.hemi.intensity=t.surfacePalette.ambientIntensity,this.sun.color.copy(t.surfacePalette.sunColor),this.sun.intensity=t.surfacePalette.sunIntensity}getHeightAt(t,e){return this.chunks?this.chunks.getHeightAt(t,e):0}getBiomeAt(t,e){return this.chunks?j(this.chunks.noise,t,e):"unknown"}getDayInfo(){return this.dayInfo}activate(){this.config&&(this.prevBg=this.scene.background,this.prevFog=this.scene.fog,this.scene.background=this.config.sky.horizon.clone(),this.scene.fog=new K(this.config.sky.horizon.clone().getHex(),60,this.viewRadiusWorld*.9),this.root.visible=!0)}deactivate(){this.scene.background=this.prevBg,this.scene.fog=this.prevFog??null,this.root.visible=!1}update(t,e){if(!this.root.visible||!this.config)return;this.chunks&&this.chunks.update(e.position.x,e.position.z),this.cycleTime=(this.cycleTime+t)%q;const s=this.cycleTime/q,i=s*Math.PI*2,o=Math.sin(i),n=Math.cos(i),r=Math.max(0,Math.min(1,(o+.15)/.45)),h=1-r,d=Math.max(0,1-Math.abs(o)/.32)*Math.max(0,1-Math.abs(n)*.2),{sky:u,surfacePalette:m}=this.config;this.skyTopTmp.copy(u.top).lerp(m.nightTop,h),this.skyHorizonTmp.copy(u.horizon).lerp(m.nightHorizon,h),d>.01&&(this.skyHorizonTmp.lerp(m.sunsetTint,d*.65),this.skyTopTmp.lerp(m.sunsetTint,d*.35)),this.sunColorTmp.copy(m.sunColor),d>.01&&this.sunColorTmp.lerp(m.sunsetTint,d*.55);const f=[n,Math.max(o,-.05),.25],y=Math.max(0,h-.1)*m.starVisibility,x={top:this.skyTopTmp,horizon:this.skyHorizonTmp,sunDir:f,sunColor:this.sunColorTmp,sunSize:.0025+d*.0015,starVisibility:y};this.sky&&this.sky.setPhase(x),this.sun.color.copy(this.sunColorTmp),this.sun.intensity=m.sunIntensity*(.05+.95*r),this.hemi.color.copy(this.skyHorizonTmp),this.hemi.groundColor.copy(m.groundTint),this.hemi.intensity=m.ambientIntensity*(.2+.8*r);const w=e.position;this.sun.position.set(w.x+n*220,Math.max(o,-.05)*200+40,w.z+120),this.sun.target.position.copy(w),this.sun.target.updateMatrixWorld(),this.sky&&this.sky.mesh.position.set(w.x,0,w.z),this.fogColorHolder.copy(this.skyHorizonTmp),this.scene.background=this.fogColorHolder.clone(),this.scene.fog instanceof K&&this.scene.fog.color.copy(this.fogColorHolder),this.dust&&(this.dust.setOrigin(w),this.dust.update(t)),this.walkDust&&(this.walkDust.setEmitter(w,e.walking,e.sprinting),this.walkDust.update(t));const _=o>.3?"DAY":o>-.1?n>0?"DAWN":"SUNSET":"NIGHT",v=Math.floor((s+.75)%1*24),M=Math.floor((s+.75)%1*24*60%60);this.dayInfo={sunAltitude:o,dayFactor:r,nightFactor:h,sunsetFactor:d,phaseLabel:_,localTime:`${String(v).padStart(2,"0")}:${String(M).padStart(2,"0")}`}}dispose(){this.unloadMeshes(),this.root.remove(this.sun,this.hemi)}unloadMeshes(){this.chunks&&(this.root.remove(this.chunks.root),this.chunks.dispose(),this.chunks=null),this.sky&&(this.root.remove(this.sky.mesh),this.sky.dispose(),this.sky=null),this.dust&&(this.root.remove(this.dust.points),this.dust.dispose(),this.dust=null),this.walkDust&&(this.root.remove(this.walkDust.points),this.walkDust.dispose(),this.walkDust=null),this.landmarks&&(this.root.remove(this.landmarks.root),this.landmarks.dispose(),this.landmarks=null)}getLandmarkLabel(){return this.landmarks?this.landmarks.profile.label:null}}const it=180,E=90,b=48,pe=64;class me{constructor(t){a(this,"root");a(this,"canvas");a(this,"label");a(this,"terrainTile");a(this,"tileOrigin",{x:Number.NaN,z:Number.NaN});a(this,"trail",[]);a(this,"lastSample",0);this.root=document.createElement("section"),this.root.className="minimap",this.root.setAttribute("data-ui","minimap"),this.root.innerHTML=`
      <div class="minimap__label" data-label>LOCAL GRID</div>
      <canvas class="minimap__canvas" width="${it*2}" height="${it*2}"></canvas>
      <div class="minimap__scale">50 m</div>
    `,t.appendChild(this.root),this.canvas=this.root.querySelector("canvas"),this.label=this.root.querySelector("[data-label]"),this.terrainTile=document.createElement("canvas"),this.terrainTile.width=b,this.terrainTile.height=b}setVisible(t){this.root.style.display=t?"block":"none"}setLandmark(t){this.label.textContent=t?`LOCAL GRID · ${t.toUpperCase()}`:"LOCAL GRID"}update(t,e,s,i,o,n){if(t.mode!=="surface"){this.setVisible(!1);return}this.setVisible(!0),s-this.lastSample>.12&&(this.lastSample=s,this.trail.push({x:i,z:o}),this.trail.length>pe&&this.trail.shift()),(Math.abs(this.tileOrigin.x-i)>8||Math.abs(this.tileOrigin.z-o)>8||Number.isNaN(this.tileOrigin.x))&&(this.renderTerrainTile(e,i,o),this.tileOrigin.x=i,this.tileOrigin.z=o),this.renderFrame(i,o,n)}renderTerrainTile(t,e,s){const i=this.terrainTile.getContext("2d");if(!i)return;const o=i.createImageData(b,b),n=new Float32Array(b*b);let r=1/0,h=-1/0;for(let d=0;d<b;d++)for(let u=0;u<b;u++){const m=e+(u/b*2-1)*E,f=s+(d/b*2-1)*E,y=t.getHeightAt(m,f);n[d*b+u]=y,y<r&&(r=y),y>h&&(h=y)}const p=h-r||1;for(let d=0;d<n.length;d++){const u=(n[d]-r)/p,m=d*4,f=Math.round(30+u*180);o.data[m+0]=f*.95,o.data[m+1]=f*.78,o.data[m+2]=f*.65,o.data[m+3]=255}i.putImageData(o,0,0)}renderFrame(t,e,s){const i=this.canvas.getContext("2d");if(!i)return;const o=this.canvas.width,n=this.canvas.height;i.clearRect(0,0,o,n),i.fillStyle="#05070a",i.fillRect(0,0,o,n),i.save(),i.translate(o/2,n/2);const r=s*Math.PI/180;i.rotate(-r);const h={x:(t-this.tileOrigin.x)/E*(o/2),y:(e-this.tileOrigin.z)/E*(n/2)};i.globalAlpha=.85,i.drawImage(this.terrainTile,-o/2-h.x,-n/2-h.y,o,n),i.globalAlpha=1,i.strokeStyle="rgba(0, 214, 143, 0.85)",i.lineWidth=2,i.beginPath();for(let p=0;p<this.trail.length;p++){const d=this.trail[p],u=(d.x-t)/E*(o/2),m=(d.z-e)/E*(n/2);p===0?i.moveTo(u,m):i.lineTo(u,m)}i.stroke(),i.restore(),i.save(),i.translate(o/2,n/2),i.fillStyle="rgb(255, 222, 0)",i.strokeStyle="rgba(0, 0, 0, 0.7)",i.lineWidth=1.5,i.beginPath(),i.moveTo(0,-14),i.lineTo(10,10),i.lineTo(0,4),i.lineTo(-10,10),i.closePath(),i.fill(),i.stroke(),i.restore(),i.strokeStyle="rgba(255, 255, 255, 0.35)",i.lineWidth=2,i.strokeRect(2,2,o-4,n-4),i.fillStyle="rgba(255, 255, 255, 0.6)",i.font="20px ui-monospace, monospace",i.textAlign="center",i.fillText("N",o/2,22),i.fillText("S",o/2,n-8),i.textAlign="left",i.fillText("E",o-20,n/2+6),i.textAlign="right",i.fillText("W",20,n/2+6)}}const ge=[{id:"orbit",label:"ORBIT INSERTION"},{id:"deorbit",label:"DE-ORBIT BURN"},{id:"entry",label:"ATMOSPHERIC ENTRY"},{id:"chute",label:"CHUTE DEPLOY"},{id:"touchdown",label:"TOUCHDOWN"},{id:"walk",label:"SURFACE WALK"},{id:"survey",label:"EXTENDED SURVEY"},{id:"return",label:"RETURN VEHICLE"}];class fe{constructor(t){a(this,"el");a(this,"listEl");a(this,"notesEl");a(this,"samplesEl");this.el=document.createElement("section"),this.el.className="phase",this.el.setAttribute("data-ui","phase"),this.el.innerHTML=`
      <div class="phase__label">FLIGHT PHASE</div>
      <ul class="phase__list" data-phases></ul>
      <div class="notes" data-notes>
        <div class="notes__title">FIELD NOTES</div>
        <ul data-notes-list></ul>
      </div>
      <div class="notes notes--samples" data-samples-wrap style="display:none">
        <div class="notes__title">SAMPLES · [F]</div>
        <ul data-samples-list></ul>
      </div>
    `,t.appendChild(this.el),this.listEl=this.el.querySelector("[data-phases]"),this.notesEl=this.el.querySelector("[data-notes-list]"),this.samplesEl=this.el.querySelector("[data-samples-list]")}setMode(t){const e=t==="orbit"?0:5;this.listEl.innerHTML=ge.map((s,i)=>{const o=i<e?"phase__item phase__item--done":i===e?"phase__item phase__item--active":"phase__item",n=i<e?"✓":i===e?"▸":"·";return`<li class="${o}"><span class="phase__dot"></span>${n} ${s.label}</li>`}).join("")}setConfig(t){this.notesEl.innerHTML=t.notes.map(e=>`<li>${e}</li>`).join("")}setSamples(t){const e=this.el.querySelector("[data-samples-wrap]");e.style.display=t.length>0?"block":"none",this.samplesEl.innerHTML=t.slice(-5).reverse().map(s=>`<li><strong>#${String(s.id).padStart(2,"0")}</strong> ${s.label} <small>${s.detail}</small></li>`).join("")}pulse(){this.samplesEl.classList.remove("notes--pulse"),this.samplesEl.offsetWidth,this.samplesEl.classList.add("notes--pulse")}}class ve{constructor(t){a(this,"root");a(this,"trajectoryCanvas");a(this,"attitudeCanvas");a(this,"trajectoryCaption");a(this,"attitudeCaption");this.root=document.createElement("section"),this.root.className="rightpanel",this.root.setAttribute("data-ui","right"),this.root.innerHTML=`
      <div>
        <div class="rightpanel__label">TRAJECTORY</div>
        <canvas data-trajectory width="280" height="280"></canvas>
        <div class="rightpanel__caption" data-trajectory-caption>APPROACH</div>
      </div>
      <div>
        <div class="rightpanel__label">ATTITUDE</div>
        <canvas data-attitude width="280" height="280"></canvas>
        <div class="rightpanel__caption" data-attitude-caption>PITCH · ROLL</div>
      </div>
    `,t.appendChild(this.root),this.trajectoryCanvas=this.root.querySelector("[data-trajectory]"),this.attitudeCanvas=this.root.querySelector("[data-attitude]"),this.trajectoryCaption=this.root.querySelector("[data-trajectory-caption]"),this.attitudeCaption=this.root.querySelector("[data-attitude-caption]")}update(t,e,s){this.drawTrajectory(t,e,s),this.drawAttitude(t,s),this.trajectoryCaption.textContent=t.mode==="orbit"?`DIST ${(t.altitude/1e3).toFixed(1)} km`:`HEADING ${t.heading.toFixed(1)}°`,this.attitudeCaption.textContent=`PITCH ${t.pitch>=0?"+":""}${t.pitch.toFixed(1)}°  ·  ROLL ${t.roll>=0?"+":""}${t.roll.toFixed(1)}°`}drawTrajectory(t,e,s){const i=this.trajectoryCanvas.getContext("2d");if(!i)return;const o=this.trajectoryCanvas.width,n=this.trajectoryCanvas.height,r=o/2,h=n/2;i.clearRect(0,0,o,n),i.fillStyle=e,i.globalAlpha=.35,i.fillRect(0,0,o,n),i.globalAlpha=1,i.fillStyle=s,i.globalAlpha=.4,i.beginPath(),i.arc(r,h,62,0,Math.PI*2),i.fill(),i.globalAlpha=1,i.strokeStyle="rgba(255,255,255,0.45)",i.lineWidth=.6,i.beginPath(),i.arc(r,h,62,0,Math.PI*2),i.stroke(),i.strokeStyle="rgba(255,255,255,0.45)",i.setLineDash([3,4]),i.beginPath(),i.ellipse(r,h,100,94,0,0,Math.PI*2),i.stroke(),i.setLineDash([]);const p=t.lat*Math.PI/180,d=t.lon*Math.PI/180,u=r+62*Math.cos(p)*Math.cos(d),m=h-62*Math.sin(p);i.strokeStyle="rgba(74,158,255,0.9)",i.lineWidth=1.4,i.beginPath(),i.moveTo(r-100,h-70),i.quadraticCurveTo(r-20,h-20,u,m),i.stroke(),i.fillStyle="rgb(0,214,143)",i.beginPath(),i.arc(u,m,4,0,Math.PI*2),i.fill(),i.strokeStyle="rgba(0,214,143,0.5)",i.lineWidth=.8,i.beginPath(),i.arc(u,m,9,0,Math.PI*2),i.stroke(),i.fillStyle="rgba(255,255,255,0.7)",i.fillRect(r-102,h-72,2,2),i.strokeStyle="rgba(255,255,255,0.15)",i.lineWidth=.5,i.beginPath(),i.moveTo(r,10),i.lineTo(r,o-10),i.moveTo(10,h),i.lineTo(n-10,h),i.stroke()}drawAttitude(t,e){const s=this.attitudeCanvas.getContext("2d");if(!s)return;const i=this.attitudeCanvas.width,o=this.attitudeCanvas.height,n=i/2,r=o/2,h=88;s.clearRect(0,0,i,o),s.save(),s.translate(n,r);const p=t.roll*Math.PI/180;s.rotate(p),s.fillStyle=e,s.globalAlpha=.6,s.beginPath(),s.arc(0,0,h,0,Math.PI*2),s.clip();const d=t.pitch*1.5;s.fillRect(-h,d,h*2,h*2),s.globalAlpha=1,s.strokeStyle="rgba(255,255,255,0.6)",s.lineWidth=1,s.beginPath(),s.moveTo(-h,d),s.lineTo(h,d),s.stroke(),s.restore(),s.strokeStyle="rgba(255,255,255,0.35)",s.lineWidth=.6,s.beginPath(),s.arc(n,r,h,0,Math.PI*2),s.stroke(),s.strokeStyle="rgb(255,222,0)",s.lineWidth=2,s.beginPath(),s.moveTo(n-26,r),s.lineTo(n-10,r),s.moveTo(n+10,r),s.lineTo(n+26,r),s.stroke(),s.fillStyle="rgb(255,222,0)",s.beginPath(),s.arc(n,r,2,0,Math.PI*2),s.fill(),s.fillStyle="rgba(255,255,255,0.5)",s.font="10px ui-monospace, monospace",s.textAlign="center",s.fillText("N",n,r-h-6),s.fillText("S",n,r+h+14),s.textAlign="left",s.fillText("E",n+h+6,r+4),s.textAlign="right",s.fillText("W",n-h-6,r+4)}}class ye{constructor(t){a(this,"el");a(this,"speedEl");a(this,"altEl");a(this,"latEl");a(this,"lonEl");a(this,"solEl");a(this,"localEl");a(this,"gravityEl");a(this,"fpsEl");a(this,"drawEl");a(this,"memEl");a(this,"altUnitEl");this.el=document.createElement("section"),this.el.className="telemetry",this.el.setAttribute("data-ui","telemetry"),this.el.innerHTML=`
      <div class="telemetry__cell">
        <span class="telemetry__label">SPEED</span>
        <span class="telemetry__value" data-speed>0.0</span>
        <span class="telemetry__unit">M · S⁻¹</span>
      </div>
      <div class="telemetry__cell">
        <span class="telemetry__label">ALTITUDE</span>
        <span class="telemetry__value" data-alt>0</span>
        <span class="telemetry__unit" data-alt-unit>METERS · MSL</span>
      </div>
      <div class="telemetry__cell">
        <span class="telemetry__label">COORDINATES</span>
        <span class="telemetry__value telemetry__value--stack">
          <span data-lat>+0.000°<small>LAT</small></span>
          <span data-lon>+0.000°<small>LON</small></span>
        </span>
      </div>
      <div class="telemetry__cell">
        <span class="telemetry__label">MISSION TIME</span>
        <span class="telemetry__value">T+<span data-sol>0</span></span>
        <span class="telemetry__unit"><span data-local>00:00</span> · SOL</span>
      </div>
      <div class="telemetry__cell">
        <span class="telemetry__label">SYSTEM</span>
        <div class="telemetry__system-row"><span>GRAVITY</span><strong data-gravity>— m·s⁻²</strong></div>
        <div class="telemetry__system-row"><span>FPS</span><strong class="good" data-fps>0.0</strong></div>
        <div class="telemetry__system-row"><span>DRAW CALLS</span><strong data-draw>0</strong></div>
        <div class="telemetry__system-row telemetry__system-row--muted"><span>MEM</span><strong data-mem>0 MB</strong></div>
      </div>
    `,t.appendChild(this.el),this.speedEl=this.el.querySelector("[data-speed]"),this.altEl=this.el.querySelector("[data-alt]"),this.altUnitEl=this.el.querySelector("[data-alt-unit]"),this.latEl=this.el.querySelector("[data-lat]"),this.lonEl=this.el.querySelector("[data-lon]"),this.solEl=this.el.querySelector("[data-sol]"),this.localEl=this.el.querySelector("[data-local]"),this.gravityEl=this.el.querySelector("[data-gravity]"),this.fpsEl=this.el.querySelector("[data-fps]"),this.drawEl=this.el.querySelector("[data-draw]"),this.memEl=this.el.querySelector("[data-mem]")}update(t,e){this.speedEl.textContent=t.velocity.toFixed(1),this.altEl.textContent=Math.round(t.altitude).toLocaleString(),this.altUnitEl.textContent=`METERS · DATUM ${e}`,this.latEl.innerHTML=`${tt(t.lat,"lat")}<small>LAT</small>`,this.lonEl.innerHTML=`${tt(t.lon,"lon")}<small>LON</small>`,this.solEl.textContent=String(t.sol),this.localEl.textContent=t.localTime,this.gravityEl.textContent=`${t.gravity.toFixed(2)} m·s⁻²`,this.fpsEl.textContent=t.fps.toFixed(1),this.drawEl.textContent=String(t.drawCalls),this.memEl.textContent=`${t.memoryMB.toFixed(0)} MB`}}class we{constructor(t){a(this,"el");a(this,"missionEl");a(this,"timeEl");a(this,"signalEl");this.el=document.createElement("div"),this.el.className="topbar",this.el.setAttribute("data-ui","topbar"),this.el.innerHTML=`
      <div class="topbar__brand">
        <div class="topbar__brand-name">PLANET · WALK</div>
        <div class="topbar__brand-rev">MISSION CONSOLE · REV 0.2</div>
      </div>
      <div class="topbar__mission">
        <div class="topbar__mission-label">MISSION</div>
        <div class="topbar__mission-value" data-mission></div>
      </div>
      <div class="topbar__time">
        <div class="topbar__live">LIVE</div>
        <div class="topbar__time-value" data-clock></div>
        <div class="topbar__signal" data-signal></div>
      </div>
    `,t.appendChild(this.el),this.missionEl=this.el.querySelector("[data-mission]"),this.timeEl=this.el.querySelector("[data-clock]"),this.signalEl=this.el.querySelector("[data-signal]")}setMission(t){this.missionEl.textContent=`${t.name} · ${t.landingSite.name.toUpperCase()}`}setSignal(t,e){this.signalEl.textContent=`DSN · ${t.toFixed(0)} dBm · LAT ${e.toFixed(0)} ms`}tick(){const e=new Date().toISOString();this.timeEl.textContent=`${e.slice(0,10)} · ${e.slice(11,19)} UTC`}}class be{constructor(t,e){a(this,"root");a(this,"grid");a(this,"activeId","");a(this,"onPick");a(this,"open",!1);this.onPick=e,this.root=document.createElement("div"),this.root.className="worldselect",this.root.setAttribute("data-ui","worldselect"),this.root.innerHTML=`
      <div class="worldselect__panel">
        <div class="worldselect__header">
          <div class="worldselect__title">SELECT WORLD</div>
          <div class="worldselect__hint">[1-5] DIRECT · [M] CLOSE · [ESC] ABORT</div>
        </div>
        <div class="worldselect__grid" data-grid></div>
      </div>
    `,t.appendChild(this.root),this.grid=this.root.querySelector("[data-grid]"),this.render(),this.root.addEventListener("click",s=>{s.target===this.root&&this.close()})}setActive(t){this.activeId=t,this.render()}toggle(){this.open?this.close():this.show()}show(){this.open=!0,this.root.classList.add("is-open")}close(){this.open=!1,this.root.classList.remove("is-open")}isOpen(){return this.open}selectByIndex(t){const e=T[t];e&&(this.onPick(e),this.close())}render(){this.grid.innerHTML=T.map((t,e)=>`
        <button class="worldselect__card${t.id===this.activeId?" worldselect__card--active":""}" data-id="${t.id}" data-index="${e}">
          <div>
            <div class="worldselect__card-id">${t.catalogue}</div>
            <div class="worldselect__card-name">${t.name}</div>
            <div class="worldselect__card-tag">${t.tagline}</div>
          </div>
          <div class="worldselect__card-stats">
            <span class="worldselect__card-grav">${t.gravity.toFixed(2)}</span>
            <span class="worldselect__card-unit">m · s⁻²</span>
          </div>
        </button>
      `).join(""),this.grid.querySelectorAll(".worldselect__card").forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.id,s=T.find(i=>i.id===e);s&&(this.onPick(s),this.close())})})}}function H(l){const t=e=>Math.round(e*255).toString(16).padStart(2,"0");return`#${t(l.r)}${t(l.g)}${t(l.b)}`}class Se{constructor(t,e){a(this,"root");a(this,"topbar");a(this,"phase");a(this,"right");a(this,"telemetry");a(this,"worldSelect");a(this,"viewport");a(this,"targetPin");a(this,"modeBtn");a(this,"descentEl");a(this,"glowEl");a(this,"minimap");a(this,"activeConfig",null);this.root=document.createElement("div"),this.root.id="hud",document.body.appendChild(this.root),this.topbar=new we(this.root),this.phase=new fe(this.root),this.viewport=document.createElement("section"),this.viewport.className="viewport",this.viewport.innerHTML=`
      <div class="viewport__bracket viewport__bracket--tl"></div>
      <div class="viewport__bracket viewport__bracket--tr"></div>
      <div class="viewport__bracket viewport__bracket--bl"></div>
      <div class="viewport__bracket viewport__bracket--br"></div>
      <div class="viewport__cam">
        <span data-cam-mode>CAM · 03 · ORBIT OBSERVER</span>
        <span class="muted">EXPOSURE 1/60 · F 2.8 · ISO 800</span>
      </div>
      <div class="viewport__crosshair"></div>
      <div class="target__pin" data-target>
        <strong data-target-name>TARGET</strong>
        <small data-target-coord>0.0° · 0.0°</small>
        <small data-target-dist>DIST · BEARING</small>
      </div>
      <button class="modebtn modebtn--land" data-ui data-modebtn type="button">
        <span class="modebtn__marker">▾</span><span data-modebtn-label>INITIATE LANDING</span>
      </button>
      <div class="descent" data-descent>
        <div class="descent__label" data-descent-label>DESCENT · ENTRY INTERFACE</div>
      </div>
      <div class="viewport__glow" data-glow></div>
    `,this.root.appendChild(this.viewport),this.targetPin=this.viewport.querySelector("[data-target]"),this.modeBtn=this.viewport.querySelector("[data-modebtn]"),this.descentEl=this.viewport.querySelector("[data-descent]"),this.glowEl=this.viewport.querySelector("[data-glow]"),this.modeBtn.addEventListener("click",i=>{i.stopPropagation(),e()}),this.right=new ve(this.root),this.minimap=new me(this.root),this.telemetry=new ye(this.root);const s=document.createElement("div");s.className="legend",s.innerHTML=`
      <div class="legend__keys">
        <span><kbd>W A S D</kbd>TRANSLATE</span>
        <span><kbd>␣</kbd>JUMP</span>
        <span><kbd>MOUSE</kbd>GAZE</span>
        <span><kbd>TAB</kbd>ORBIT / SURFACE</span>
        <span><kbd>M</kbd>WORLDS</span>
      </div>
      <div>PLANET·WALK / 2026 · S045PD</div>
    `,this.root.appendChild(s),this.worldSelect=new be(document.body,t)}setConfig(t){this.activeConfig=t,Wt(document.body,t),document.body.style.background=`linear-gradient(to bottom, ${H(t.sky.top)}, ${H(t.sky.horizon)} 85%, ${H(t.sky.top)})`,this.topbar.setMission(t),this.phase.setConfig(t),this.worldSelect.setActive(t.id);const e=t.landingSite,s=this.targetPin.querySelector("[data-target-name]"),i=this.targetPin.querySelector("[data-target-coord]"),o=this.targetPin.querySelector("[data-target-dist]");s.textContent=`TARGET · ${e.name.toUpperCase()}`,i.textContent=`${e.lat.toFixed(3)}° · ${e.lon.toFixed(3)}°`,o.textContent="LANDING ZONE"}update(t){if(!this.activeConfig)return;const e=this.activeConfig;this.topbar.tick(),this.topbar.setSignal(-64-Math.random()*2,120+Math.random()*8),this.phase.setMode(t.mode),this.telemetry.update(t,e.solLabel),this.right.update(t,H(e.sky.top),H(e.surface.mid));const s=this.viewport.querySelector("[data-cam-mode]");s.textContent=t.mode==="orbit"?"CAM · 03 · ORBIT OBSERVER":"CAM · 07 · SURFACE WALKER",this.targetPin.style.display=t.mode==="orbit"?"block":"none";const i=this.modeBtn.querySelector("[data-modebtn-label]"),o=this.modeBtn.querySelector(".modebtn__marker");t.mode==="orbit"?(this.modeBtn.classList.remove("modebtn--abort"),this.modeBtn.classList.add("modebtn--land"),i.textContent="INITIATE LANDING",o.textContent="▾"):(this.modeBtn.classList.remove("modebtn--land"),this.modeBtn.classList.add("modebtn--abort"),i.textContent="RETURN TO ORBIT",o.textContent="▴")}setDescent(t,e="DESCENT · ENTRY INTERFACE"){this.descentEl.classList.toggle("is-active",t);const s=this.descentEl.querySelector("[data-descent-label]");s.textContent=e,this.modeBtn.style.visibility=t?"hidden":"visible",this.viewport.classList.toggle("is-shaking",t);const i=e.startsWith("ASCENT");this.glowEl.classList.toggle("is-descent",t&&!i),this.glowEl.classList.toggle("is-ascent",t&&i)}updateMinimap(t,e,s,i,o,n){this.minimap.setLandmark(e.getLandmarkLabel()),this.minimap.update(t,e,s,i,o,n)}}class Me{constructor(t){a(this,"engine");a(this,"input");a(this,"hud");a(this,"orbit");a(this,"player");a(this,"planet");a(this,"starfield");a(this,"sun");a(this,"ambient");a(this,"surface");a(this,"mode","orbit");a(this,"startTime",Date.now());a(this,"transitioning",null);a(this,"transitionTimer",null);a(this,"transitionDuration",1.7);a(this,"transitionElapsed",0);a(this,"baseFov",55);a(this,"samples",[]);a(this,"sampleCounter",0);this.engine=new Rt(t),this.input=new Ht(t),this.starfield=Ut(2400,22e3),this.engine.scene.add(this.starfield),this.sun=new rt(16777215,1.2),this.sun.position.set(1,.4,.6).normalize().multiplyScalar(5e3),this.engine.scene.add(this.sun),this.ambient=new zt(2241348,.4),this.engine.scene.add(this.ambient);const e=T.find(s=>s.id===Gt)??T[0];this.planet=new J(e),this.engine.scene.add(this.planet.root),this.orbit=new Kt(this.engine.camera,e.radius),this.player=new Xt(this.engine.camera,this.input),this.player.setConfig(e),this.surface=new ue(this.engine.scene,{chunkSize:128,chunkSegments:48,viewDistance:3}),this.engine.scene.add(this.surface.root),this.surface.load(e),this.hud=new Se(s=>this.switchPlanet(s),()=>this.toggleMode()),this.hud.setConfig(e),this.bindKeys(),this.engine.register({update:s=>this.update(s)})}start(){this.engine.start()}bindKeys(){this.input.onPress("Tab",()=>this.toggleMode()),this.input.onPress("KeyM",()=>{this.mode==="surface"&&this.input.exitPointerLock(),this.hud.worldSelect.toggle()}),this.input.onPress("Escape",()=>{this.hud.worldSelect.close(),this.mode==="surface"&&this.input.exitPointerLock()}),this.input.onPress("KeyF",()=>this.collectSample()),this.input.onPress("KeyR",()=>this.resetSamples()),["Digit1","Digit2","Digit3","Digit4","Digit5"].forEach((e,s)=>{this.input.onPress(e,()=>{const i=T[s];i&&this.switchPlanet(i)})})}toggleMode(){this.transitioning||(this.mode==="orbit"?this.startLanding():this.startAscent())}startLanding(){this.transitioning="landing",this.transitionElapsed=0,this.transitionDuration=1.7,this.hud.setDescent(!0,"DESCENT · ENTRY INTERFACE");const t=this.planet.config.landingSite,e=this.planet.config.radius;this.orbit.setDesired({azimuth:t.lon*Math.PI/180,polar:Math.PI/2-t.lat*Math.PI/180,distance:e*1.18}),this.transitionTimer=window.setTimeout(()=>{this.transitioning=null,this.hud.setDescent(!1),this.engine.camera.fov=this.baseFov,this.engine.camera.updateProjectionMatrix(),this.mode="surface",this.planet.root.visible=!1,this.starfield.visible=!1,this.surface.activate(),this.player.enterSurface(this.surface),this.input.requestPointerLock()},1700)}startAscent(){this.transitioning="ascent",this.transitionElapsed=0,this.transitionDuration=1.4,this.hud.setDescent(!0,"ASCENT · ORBIT INSERTION"),this.input.exitPointerLock(),this.mode="orbit",this.planet.root.visible=!0,this.starfield.visible=!0,this.surface.deactivate(),this.player.exitSurface();const t=this.planet.config.radius;this.orbit.setDesired({azimuth:this.planet.config.landingSite.lon*Math.PI/180,polar:Math.PI/2-this.planet.config.landingSite.lat*Math.PI/180,distance:t*3}),this.transitionTimer=window.setTimeout(()=>{this.transitioning=null,this.hud.setDescent(!1),this.engine.camera.fov=this.baseFov,this.engine.camera.updateProjectionMatrix()},1400)}collectSample(){if(this.mode!=="surface"||this.transitioning)return;const t=this.player.snapshot(),e=this.surface.getBiomeAt(t.position.x,t.position.z),s=Math.round(t.position.y*10)/10;this.sampleCounter+=1;const i=this.sampleCounter,o=e.charAt(0).toUpperCase()+e.slice(1);this.samples.push({id:i,label:`${o} sample`,detail:`+${s} m · hdg ${t.heading.toFixed(0)}°`}),this.hud.phase.setSamples(this.samples),this.hud.phase.pulse()}resetSamples(){this.samples.length!==0&&(this.samples=[],this.sampleCounter=0,this.hud.phase.setSamples(this.samples))}switchPlanet(t){t.id!==this.planet.config.id&&(this.transitionTimer!==null&&(window.clearTimeout(this.transitionTimer),this.transitionTimer=null),this.transitioning=null,this.hud.setDescent(!1),this.mode="orbit",this.input.exitPointerLock(),this.surface.deactivate(),this.engine.scene.remove(this.planet.root),this.planet.dispose(),this.planet=new J(t),this.engine.scene.add(this.planet.root),this.planet.root.visible=!0,this.starfield.visible=!0,this.orbit.reconfigure(t.radius),this.player.setConfig(t),this.surface.load(t),this.hud.setConfig(t))}update(t){this.planet.root.visible&&this.planet.update(t),this.mode==="orbit"||this.transitioning?this.orbit.update(t):this.player.update(t),this.transitioning&&this.updateCinematic(t);const e=this.player.snapshot();this.surface.update(t,{position:e.position,walking:e.walking,sprinting:e.sprinting});const s=this.collectTelemetry();this.hud.update(s),this.hud.updateMinimap(s,this.surface,performance.now()/1e3,e.position.x,e.position.z,e.heading)}updateCinematic(t){this.transitionElapsed=Math.min(this.transitionDuration,this.transitionElapsed+t);const e=this.transitionElapsed/this.transitionDuration,s=Math.sin(e*Math.PI),i=this.transitioning==="landing"?-11:6;if(this.engine.camera.fov=this.baseFov+s*i,this.engine.camera.updateProjectionMatrix(),this.transitioning==="landing"){const o=s*.6;this.engine.camera.position.x+=(Math.random()-.5)*o,this.engine.camera.position.y+=(Math.random()-.5)*o}}collectTelemetry(){const t=this.planet.config,e=this.player.snapshot(),s=this.orbit.getState(),i=(Date.now()-this.startTime)/1e3,o=i%t.rotationPeriod,n=Math.floor(o/3600)%24,r=Math.floor(o%3600/60),h=`${String(n).padStart(2,"0")}:${String(r).padStart(2,"0")}`,p=Math.floor(i/Math.max(t.rotationPeriod,1))+47,d=performance.memory,u=d?d.usedJSHeapSize/(1024*1024):0,m=this.surface.getDayInfo(),f=this.mode==="surface"?`${m.localTime} ${m.phaseLabel}`:h;return this.mode==="orbit"?{worldId:t.id,worldName:t.name,lat:t.landingSite.lat,lon:t.landingSite.lon,altitude:s.distance-t.radius,velocity:0,gravity:t.gravity,heading:0,pitch:0,roll:0,sol:p,localTime:h,mode:"orbit",fps:this.engine.stats.fps,drawCalls:this.engine.stats.drawCalls,memoryMB:u}:{worldId:t.id,worldName:t.name,lat:e.lat,lon:e.lon,altitude:e.altitude,velocity:e.speed,gravity:t.gravity,heading:e.heading,pitch:e.pitch,roll:e.roll,sol:p,localTime:f,mode:"surface",fps:this.engine.stats.fps,drawCalls:this.engine.stats.drawCalls,memoryMB:u}}}const dt=document.getElementById("app");if(!dt)throw new Error("Canvas #app not found");const ke=new Me(dt);ke.start();
