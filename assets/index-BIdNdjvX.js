var lt=Object.defineProperty;var ht=(o,t,e)=>t in o?lt(o,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[t]=e;var a=(o,t,e)=>ht(o,typeof t!="symbol"?t+"":t,e);import{S as ct,C as dt,W as ut,a as pt,A as mt,P as gt,B as Y,b as w,c as x,d as X,O as H,V as g,e as N,M as L,f as J,g as Q,h as _,Q as R,i as vt,j as q,k as ft,I as yt,l as wt,D as Z,H as bt,F as St,m as Mt}from"./three-DzS5Ogji.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const l of n.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function e(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=e(s);fetch(s.href,n)}})();class Pt{constructor(t){a(this,"renderer");a(this,"scene",new ct);a(this,"camera");a(this,"clock",new dt);a(this,"stats",{fps:0,drawCalls:0});a(this,"systems",[]);a(this,"running",!1);a(this,"frameAccum",0);a(this,"frameCount",0);a(this,"loop",()=>{if(!this.running)return;requestAnimationFrame(this.loop);const t=Math.min(this.clock.getDelta(),.1);for(const e of this.systems)e.update(t);this.renderer.render(this.scene,this.camera),this.frameAccum+=t,this.frameCount++,this.frameAccum>=.5&&(this.stats.fps=this.frameCount/this.frameAccum,this.stats.drawCalls=this.renderer.info.render.calls,this.frameAccum=0,this.frameCount=0)});a(this,"handleResize",()=>{const t=window.innerWidth,e=window.innerHeight;this.renderer.setSize(t,e,!1),this.camera.aspect=t/e,this.camera.updateProjectionMatrix()});this.renderer=new ut({canvas:t,antialias:!0,logarithmicDepthBuffer:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.renderer.setSize(window.innerWidth,window.innerHeight,!1),this.renderer.outputColorSpace=pt,this.renderer.toneMapping=mt,this.renderer.toneMappingExposure=1,this.camera=new gt(55,window.innerWidth/window.innerHeight,.1,5e4),this.camera.position.set(0,0,3e3),window.addEventListener("resize",this.handleResize)}register(t){this.systems.push(t)}start(){this.running||(this.running=!0,this.clock.start(),this.loop())}stop(){this.running=!1}dispose(){this.stop(),window.removeEventListener("resize",this.handleResize),this.renderer.dispose()}}const $={KeyW:"forward",KeyS:"back",KeyA:"left",KeyD:"right",ArrowUp:"forward",ArrowDown:"back",ArrowLeft:"left",ArrowRight:"right",Space:"jump",ShiftLeft:"sprint",ShiftRight:"sprint"};class Et{constructor(t){a(this,"actions",new Set);a(this,"pressHandlers",new Map);a(this,"mouseDelta",{x:0,y:0});a(this,"pointerLocked",!1);a(this,"canvas");a(this,"requestPointerLock",()=>{this.pointerLocked||this.canvas.requestPointerLock()});a(this,"onKeyDown",t=>{const e=$[t.code];e&&(this.actions.add(e),t.preventDefault());const i=this.pressHandlers.get(t.code);if(i){for(const s of i)s();t.preventDefault()}});a(this,"onKeyUp",t=>{const e=$[t.code];e&&this.actions.delete(e)});a(this,"onMouseMove",t=>{this.pointerLocked&&(this.mouseDelta.x+=t.movementX,this.mouseDelta.y+=t.movementY)});a(this,"onPointerLockChange",()=>{this.pointerLocked=document.pointerLockElement===this.canvas});this.canvas=t,window.addEventListener("keydown",this.onKeyDown),window.addEventListener("keyup",this.onKeyUp),window.addEventListener("mousemove",this.onMouseMove),document.addEventListener("pointerlockchange",this.onPointerLockChange),t.addEventListener("click",this.requestPointerLock)}dispose(){window.removeEventListener("keydown",this.onKeyDown),window.removeEventListener("keyup",this.onKeyUp),window.removeEventListener("mousemove",this.onMouseMove),document.removeEventListener("pointerlockchange",this.onPointerLockChange),this.canvas.removeEventListener("click",this.requestPointerLock)}isActive(t){return this.actions.has(t)}onPress(t,e){let i=this.pressHandlers.get(t);return i||(i=new Set,this.pressHandlers.set(t,i)),i.add(e),()=>i.delete(e)}consumeMouseDelta(){const t={x:this.mouseDelta.x,y:this.mouseDelta.y};return this.mouseDelta.x=0,this.mouseDelta.y=0,t}get isPointerLocked(){return this.pointerLocked}exitPointerLock(){this.pointerLocked&&document.exitPointerLock()}}const Ct=`
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
`,xt=`
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
`,_t=`
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Lt=`
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
`,At=`
  attribute float aSize;
  attribute float aBrightness;
  varying float vBrightness;
  void main() {
    vBrightness = aBrightness;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize;
    gl_Position = projectionMatrix * mv;
  }
`,Tt=`
  precision highp float;
  varying float vBrightness;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, r);
    gl_FragColor = vec4(vec3(glow * vBrightness), glow);
  }
`;class U{constructor(t){a(this,"root",new H);a(this,"surface");a(this,"atmosphere",null);a(this,"config");a(this,"surfaceMaterial");a(this,"atmosphereMaterial",null);a(this,"sunDir",new g(1,.35,.6).normalize());this.config=t;const e=new N(t.radius,128,96);if(this.surfaceMaterial=new x({vertexShader:Ct,fragmentShader:xt,uniforms:{uBaseLow:{value:t.surface.low.clone()},uBaseMid:{value:t.surface.mid.clone()},uBaseHigh:{value:t.surface.high.clone()},uPolar:{value:t.surface.polar.clone()},uSunDir:{value:this.sunDir.clone()},uRoughness:{value:t.surface.roughness},uCratering:{value:t.surface.cratering},uBanding:{value:t.surface.banding},uTime:{value:0}}}),this.surface=new L(e,this.surfaceMaterial),this.root.add(this.surface),t.atmosphereIntensity>.01){const i=new N(t.radius*1.035,96,64);this.atmosphereMaterial=new x({vertexShader:_t,fragmentShader:Lt,uniforms:{uColor:{value:t.atmosphereColor.clone()},uIntensity:{value:t.atmosphereIntensity},uSunDir:{value:this.sunDir.clone()}},side:Q,blending:J,transparent:!0,depthWrite:!1}),this.atmosphere=new L(i,this.atmosphereMaterial),this.root.add(this.atmosphere)}}update(t){this.surface.rotation.y+=t*(2*Math.PI)/Math.max(this.config.rotationPeriod/120,60),this.surfaceMaterial.uniforms.uTime.value+=t}dispose(){this.surface.geometry.dispose(),this.surfaceMaterial.dispose(),this.atmosphere&&(this.atmosphere.geometry.dispose(),this.atmosphereMaterial?.dispose()),this.root.clear()}}function kt(o=2400,t=2e4){const e=new Float32Array(o*3),i=new Float32Array(o),s=new Float32Array(o);for(let r=0;r<o;r++){const h=Math.random(),u=Math.random(),d=2*Math.PI*h,p=Math.acos(2*u-1),m=t*(.85+Math.random()*.15);e[r*3+0]=m*Math.sin(p)*Math.cos(d),e[r*3+1]=m*Math.sin(p)*Math.sin(d),e[r*3+2]=m*Math.cos(p),i[r]=Math.random()<.02?3+Math.random()*2:.8+Math.random()*1.2,s[r]=.4+Math.random()*.6}const n=new Y;n.setAttribute("position",new w(e,3)),n.setAttribute("aSize",new w(i,1)),n.setAttribute("aBrightness",new w(s,1));const l=new x({vertexShader:At,fragmentShader:Tt,transparent:!0,depthWrite:!1});return new X(n,l)}function It(o,t){const e=t.sky.top,i=t.sky.horizon;o.style.setProperty("--sky-top",`rgb(${Math.round(e.r*255)}, ${Math.round(e.g*255)}, ${Math.round(e.b*255)})`),o.style.setProperty("--sky-horizon",`rgb(${Math.round(i.r*255)}, ${Math.round(i.g*255)}, ${Math.round(i.b*255)})`);const s=t.atmosphereColor;o.style.setProperty("--accent-planet",`rgb(${Math.round(s.r*255)}, ${Math.round(s.g*255)}, ${Math.round(s.b*255)})`),new _}const c=(o,t,e)=>new _(o/255,t/255,e/255),M=(o,t)=>({palette:o,detailShift:t.detail,heightScale:t.heightScale,sunColor:t.sun,dustColor:t.dust,groundTint:t.ground,sunIntensity:t.sunI,ambientIntensity:t.ambI}),b=[{id:"terra",name:"TERRA",catalogue:"001 · SOL-III",tagline:"Blue oasis · liquid water · 1.0 g reference",radius:1e3,gravity:9.81,rotationPeriod:86400,atmosphereColor:c(90,150,255),atmosphereIntensity:1.3,surface:{low:c(20,55,110),mid:c(40,120,80),high:c(120,100,70),polar:c(230,238,245),roughness:.55,cratering:0,banding:.05},sky:{top:c(12,22,44),horizon:c(100,140,200)},surfacePalette:M({plain:[.42,.55,.28],crater:[.38,.3,.2],ridge:[.55,.5,.42],highland:[.3,.45,.22],basalt:[.32,.32,.3]},{detail:.05,heightScale:1.1,sun:c(255,248,235),dust:c(220,225,230),ground:c(45,80,50),sunI:1.4,ambI:.55}),solLabel:"UTC",landingSite:{lat:27.988,lon:86.925,name:"Sagarmatha · Himalaya"},notes:["29% land · 71% hydrosphere","Biosphere active","Magnetic field nominal"]},{id:"mars",name:"MARS",catalogue:"002 · SOL-IV",tagline:"Rust desert · thin CO₂ · Valles Marineris",radius:532,gravity:3.72,rotationPeriod:88642,atmosphereColor:c(210,130,90),atmosphereIntensity:.55,surface:{low:c(82,32,18),mid:c(158,81,48),high:c(210,145,95),polar:c(240,235,225),roughness:.7,cratering:.35,banding:0},sky:{top:c(20,12,10),horizon:c(180,110,80)},surfacePalette:M({plain:[.76,.5,.32],crater:[.55,.35,.22],ridge:[.6,.38,.25],highland:[.72,.48,.3],basalt:[.4,.28,.2]},{detail:.06,heightScale:1.2,sun:c(255,216,175),dust:c(220,150,100),ground:c(90,40,20),sunI:1.2,ambI:.45}),solLabel:"LMST",landingSite:{lat:-14.502,lon:175.83,name:"Jezero Approach"},notes:["Atm. pressure 0.6 kPa","Olympus Mons +21,229 m","Dust storm cycle · low"]},{id:"luna",name:"LUNA",catalogue:"003 · EARTH-I",tagline:"Silver regolith · no atm · tidally locked",radius:272,gravity:1.62,rotationPeriod:2360591,atmosphereColor:c(120,120,130),atmosphereIntensity:0,surface:{low:c(55,55,58),mid:c(140,138,135),high:c(210,208,200),polar:c(230,230,225),roughness:.85,cratering:.9,banding:0},sky:{top:c(0,0,0),horizon:c(10,10,12)},surfacePalette:M({plain:[.45,.45,.42],crater:[.26,.26,.24],ridge:[.55,.53,.48],highland:[.66,.64,.58],basalt:[.32,.32,.3]},{detail:.08,heightScale:1.5,sun:c(255,255,245),dust:c(180,180,170),ground:c(60,60,60),sunI:1.6,ambI:.12}),solLabel:"UTC",landingSite:{lat:.673,lon:23.473,name:"Mare Tranquillitatis"},notes:["Vacuum surface","Day/night swing 250 K","Crater density · high"]},{id:"venus",name:"VENUS",catalogue:"004 · SOL-II",tagline:"Sulfuric haze · 92 atm · retrograde",radius:950,gravity:8.87,rotationPeriod:20995200,atmosphereColor:c(255,200,120),atmosphereIntensity:2.1,surface:{low:c(110,70,30),mid:c(210,170,100),high:c(245,220,160),polar:c(250,235,200),roughness:.3,cratering:.1,banding:.6},sky:{top:c(120,70,20),horizon:c(255,190,110)},surfacePalette:M({plain:[.78,.58,.3],crater:[.6,.4,.22],ridge:[.7,.5,.26],highland:[.88,.68,.38],basalt:[.4,.25,.12]},{detail:.05,heightScale:.9,sun:c(255,180,90),dust:c(235,185,110),ground:c(120,70,20),sunI:1.1,ambI:.75}),solLabel:"VST",landingSite:{lat:3.2,lon:298,name:"Ishtar Terra · Maxwell"},notes:["Surface 464 °C","96.5% CO₂ atmosphere","Retrograde rotation"]},{id:"europa",name:"EUROPA",catalogue:"005 · JUPITER-II",tagline:"Ice shell · cryosea · chaos terrain",radius:240,gravity:1.31,rotationPeriod:306720,atmosphereColor:c(180,210,240),atmosphereIntensity:.25,surface:{low:c(140,135,150),mid:c(210,220,235),high:c(250,250,255),polar:c(255,255,255),roughness:.15,cratering:.05,banding:.35},sky:{top:c(4,8,18),horizon:c(80,100,140)},surfacePalette:M({plain:[.82,.88,.95],crater:[.55,.62,.72],ridge:[.88,.92,.97],highland:[.94,.96,1],basalt:[.4,.52,.7]},{detail:.06,heightScale:.6,sun:c(215,225,255),dust:c(180,210,245),ground:c(160,190,220),sunI:.8,ambI:.4}),solLabel:"JST",landingSite:{lat:12.5,lon:180,name:"Conamara Chaos"},notes:["Subsurface ocean suspected","Surface −170 °C","Jupiter radiation · high"]}],Dt="mars",W=Math.PI/180,j=180/Math.PI;function zt(o,t,e,i=new g){const s=o*W,n=t*W,l=Math.cos(s);return i.set(e*l*Math.cos(n),e*Math.sin(s),e*l*Math.sin(n)),i}function Rt(o){const t=o.length();if(t<1e-6)return{lat:0,lon:0};const e=Math.asin(o.y/t)*j,i=Math.atan2(o.z,o.x)*j;return{lat:e,lon:i}}function y(o,t,e){return o<t?t:o>e?e:o}function Bt(o,t,e){return o+(t-o)*e}function B(o,t,e,i){return Bt(o,t,1-Math.exp(-e*i))}function G(o,t){const e=o>=0?"+":"−",i=Math.abs(o).toFixed(3);return`${e}${i}°`}class Nt{constructor(t,e){a(this,"camera");a(this,"target",new g);a(this,"state");a(this,"desired");a(this,"dragging",!1);a(this,"lastPointer",{x:0,y:0});a(this,"minDistance");a(this,"maxDistance");a(this,"surfaceDistance");a(this,"onPointerDown",t=>{if(t.button!==0||document.pointerLockElement)return;const e=t.target;e&&e.closest("[data-ui]")||(this.dragging=!0,this.lastPointer.x=t.clientX,this.lastPointer.y=t.clientY)});a(this,"onPointerMove",t=>{if(!this.dragging)return;const e=t.clientX-this.lastPointer.x,i=t.clientY-this.lastPointer.y;this.lastPointer.x=t.clientX,this.lastPointer.y=t.clientY,this.desired.azimuth-=e*.005,this.desired.polar=y(this.desired.polar-i*.005,.15,Math.PI-.15)});a(this,"onPointerUp",()=>{this.dragging=!1});a(this,"onWheel",t=>{if(document.pointerLockElement)return;t.preventDefault();const e=Math.exp(t.deltaY*.001);this.desired.distance=y(this.desired.distance*e,this.minDistance,this.maxDistance)});this.camera=t,this.minDistance=e*1.6,this.maxDistance=e*7,this.surfaceDistance=e*1.05,this.state={azimuth:.4,polar:1.2,distance:e*3},this.desired={...this.state},window.addEventListener("pointerdown",this.onPointerDown),window.addEventListener("pointermove",this.onPointerMove),window.addEventListener("pointerup",this.onPointerUp),window.addEventListener("pointercancel",this.onPointerUp),window.addEventListener("wheel",this.onWheel,{passive:!1})}dispose(){window.removeEventListener("pointerdown",this.onPointerDown),window.removeEventListener("pointermove",this.onPointerMove),window.removeEventListener("pointerup",this.onPointerUp),window.removeEventListener("pointercancel",this.onPointerUp),window.removeEventListener("wheel",this.onWheel)}reconfigure(t){this.minDistance=t*1.6,this.maxDistance=t*7,this.surfaceDistance=t*1.05,this.desired.distance=y(this.desired.distance,this.minDistance,this.maxDistance)}getApproachDistance(){return this.surfaceDistance}getState(){return this.state}setDesired(t){t.azimuth!==void 0&&(this.desired.azimuth=t.azimuth),t.polar!==void 0&&(this.desired.polar=y(t.polar,.15,Math.PI-.15)),t.distance!==void 0&&(this.desired.distance=y(t.distance,this.minDistance,this.maxDistance))}update(t){this.state.azimuth=B(this.state.azimuth,this.desired.azimuth,8,t),this.state.polar=B(this.state.polar,this.desired.polar,8,t),this.state.distance=B(this.state.distance,this.desired.distance,6,t);const{azimuth:e,polar:i,distance:s}=this.state,n=Math.sin(i);this.camera.position.set(this.target.x+s*n*Math.cos(e),this.target.y+s*Math.cos(i),this.target.z+s*n*Math.sin(e)),this.camera.up.set(0,1,0),this.camera.lookAt(this.target)}}const V=new g(0,1,0);class Ot{constructor(t,e){a(this,"camera");a(this,"input");a(this,"position",new g);a(this,"velocity",new g);a(this,"up",new g(0,1,0));a(this,"forward",new g(0,0,-1));a(this,"right",new g(1,0,0));a(this,"yaw",0);a(this,"pitch",0);a(this,"headHeight",1.7);a(this,"planetRadius",1e3);a(this,"gravity",9.81);a(this,"onGround",!0);a(this,"config",null);a(this,"mode","orbit");a(this,"surface",null);this.camera=t,this.input=e}setConfig(t,e){this.config=t,this.planetRadius=t.radius,this.gravity=t.gravity;const i=e??t.landingSite;this.placeAt(i.lat,i.lon),this.yaw=0,this.pitch=0}enterSurface(t){this.surface=t,this.mode="surface";const e=t.getHeightAt(0,0);this.position.set(0,e+this.headHeight,0),this.velocity.set(0,0,0),this.up.set(0,1,0),this.yaw=0,this.pitch=0,this.rebuildPlanarBasis(),this.applyPlanarCamera(),this.onGround=!0}exitSurface(){this.mode="orbit",this.surface=null,this.config&&this.placeAt(this.config.landingSite.lat,this.config.landingSite.lon)}placeAt(t,e){zt(t,e,this.planetRadius+this.headHeight,this.position),this.up.copy(this.position).normalize(),this.rebuildSphericalBasis(),this.velocity.set(0,0,0),this.applySphericalCamera()}update(t){this.config&&(this.mode==="surface"&&this.surface?this.updateSurface(t,this.surface):this.updateSpherical(t))}snapshot(){if(this.mode==="surface"&&this.surface){const l=this.velocity.length(),r=(-this.yaw*180/Math.PI%360+360)%360;return{position:this.position.clone(),up:new g(0,1,0),lat:this.config?.landingSite.lat??0,lon:this.config?.landingSite.lon??0,altitude:this.position.y,speed:l,heading:r,pitch:this.pitch*180/Math.PI,roll:0}}const{lat:t,lon:e}=Rt(this.position),i=this.position.length()-this.planetRadius,s=this.velocity.length(),n=(Math.atan2(this.forward.x,this.forward.z)*180/Math.PI%360+360)%360;return{position:this.position.clone(),up:this.up.clone(),lat:t,lon:e,altitude:i,speed:s,heading:n,pitch:this.pitch*180/Math.PI,roll:0}}updateSurface(t,e){if(this.input.isPointerLocked){const d=this.input.consumeMouseDelta();this.yaw-=d.x*.0022,this.pitch=y(this.pitch-d.y*.0022,-Math.PI/2+.05,Math.PI/2-.05)}this.rebuildPlanarBasis();const i=new g;this.input.isActive("forward")&&i.add(this.forward),this.input.isActive("back")&&i.sub(this.forward),this.input.isActive("right")&&i.add(this.right),this.input.isActive("left")&&i.sub(this.right),i.lengthSq()>0&&i.normalize();const n=6*(this.input.isActive("sprint")?2.2:1),l=new g(this.velocity.x,0,this.velocity.z),r=i.multiplyScalar(n);l.lerp(r,this.onGround?.22:.05);let h=this.velocity.y-this.gravity*t;this.onGround&&this.input.isActive("jump")&&(h=Math.sqrt(2*this.gravity*2.2)),this.velocity.set(l.x,h,l.z),this.position.addScaledVector(this.velocity,t);const u=e.getHeightAt(this.position.x,this.position.z)+this.headHeight;this.position.y<=u+.001?(this.position.y=u,this.velocity.y=Math.max(this.velocity.y,0),this.onGround=!0):this.onGround=!1,this.applyPlanarCamera()}updateSpherical(t){if(this.input.isPointerLocked){const d=this.input.consumeMouseDelta();this.yaw-=d.x*.0022,this.pitch=y(this.pitch-d.y*.0022,-Math.PI/2+.05,Math.PI/2-.05)}this.up.copy(this.position).normalize(),this.rebuildSphericalBasis();const e=new g;this.input.isActive("forward")&&e.add(this.forward),this.input.isActive("back")&&e.sub(this.forward),this.input.isActive("right")&&e.add(this.right),this.input.isActive("left")&&e.sub(this.right),e.lengthSq()>0&&e.normalize();const s=6*(this.input.isActive("sprint")?2.2:1),n=this.velocity.clone().projectOnPlane(this.up),l=e.multiplyScalar(s);n.lerp(l,this.onGround?.22:.03);let h=this.velocity.dot(this.up)-this.gravity*3*t;this.onGround&&this.input.isActive("jump")&&(h=Math.sqrt(2*this.gravity*3*2.2)),this.velocity.copy(n).add(this.up.clone().multiplyScalar(h)),this.position.addScaledVector(this.velocity,t);const u=this.planetRadius+this.headHeight;this.position.length()<=u+.001?(this.position.setLength(u),this.velocity.copy(n),this.onGround=!0):this.onGround=!1,this.applySphericalCamera()}rebuildSphericalBasis(){const t=Math.abs(this.up.dot(V))>.95?new g(0,0,1):V;this.right.copy(t).cross(this.up).normalize(),this.forward.copy(this.up).cross(this.right).normalize();const e=new R().setFromAxisAngle(this.up,this.yaw);this.forward.applyQuaternion(e),this.right.applyQuaternion(e)}rebuildPlanarBasis(){this.forward.set(-Math.sin(this.yaw),0,-Math.cos(this.yaw)),this.right.set(Math.cos(this.yaw),0,-Math.sin(this.yaw)),this.up.set(0,1,0)}applySphericalCamera(){this.camera.position.copy(this.position);const t=this.forward.clone(),e=new R().setFromAxisAngle(this.right,this.pitch);t.applyQuaternion(e),this.camera.up.copy(this.up),this.camera.lookAt(this.position.clone().add(t))}applyPlanarCamera(){this.camera.position.copy(this.position);const t=this.forward.clone(),e=new R().setFromAxisAngle(this.right,this.pitch);t.applyQuaternion(e),this.camera.up.set(0,1,0),this.camera.lookAt(this.position.clone().add(t))}}const Ht=`
  attribute float aSize;
  attribute float aLife;
  varying float vLife;
  void main() {
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (28.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`,Ft=`
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
`;class qt{constructor(t){a(this,"points");a(this,"geo");a(this,"material");a(this,"count");a(this,"radius");a(this,"positions");a(this,"velocities");a(this,"lives");a(this,"sizes");a(this,"origin",new g);a(this,"windX",.2);a(this,"windZ",.05);this.count=t.count,this.radius=t.radius,this.positions=new Float32Array(this.count*3),this.velocities=new Float32Array(this.count*3),this.lives=new Float32Array(this.count),this.sizes=new Float32Array(this.count);for(let e=0;e<this.count;e++)this.spawn(e,!0);this.geo=new Y,this.geo.setAttribute("position",new w(this.positions,3)),this.geo.setAttribute("aLife",new w(this.lives,1)),this.geo.setAttribute("aSize",new w(this.sizes,1)),this.material=new x({vertexShader:Ht,fragmentShader:Ft,transparent:!0,depthWrite:!1,blending:J,uniforms:{uColor:{value:t.color.clone()}}}),this.points=new X(this.geo,this.material),this.points.frustumCulled=!1}setOrigin(t){this.origin.copy(t)}setWind(t){this.windX=.1+t*2.2,this.windZ=.05+t*.6}update(t){for(let e=0;e<this.count;e++){const i=e*3;this.positions[i+0]+=this.velocities[i+0]*t+this.windX*t,this.positions[i+1]+=this.velocities[i+1]*t,this.positions[i+2]+=this.velocities[i+2]*t+this.windZ*t,this.lives[e]-=t*.15;const s=this.positions[i+0]-this.origin.x,n=this.positions[i+2]-this.origin.z;(this.lives[e]<=0||s*s+n*n>this.radius*this.radius)&&this.spawn(e,!1)}this.geo.attributes.position.needsUpdate=!0,this.geo.attributes.aLife.needsUpdate=!0}dispose(){this.geo.dispose(),this.material.dispose()}spawn(t,e){const i=t*3,s=Math.random()*Math.PI*2,n=Math.sqrt(Math.random())*this.radius;this.positions[i+0]=this.origin.x+Math.cos(s)*n,this.positions[i+1]=this.origin.y-1.2+Math.random()*7,this.positions[i+2]=this.origin.z+Math.sin(s)*n,this.velocities[i+0]=(Math.random()-.5)*.3,this.velocities[i+1]=(Math.random()-.4)*.15,this.velocities[i+2]=(Math.random()-.5)*.3,this.lives[t]=e?Math.random():.7+Math.random()*.3,this.sizes[t]=1.5+Math.random()*3}}const $t=`
  varying vec3 vPos;
  void main() {
    vPos = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,Ut=`
  precision highp float;
  varying vec3 vPos;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunSize;
  void main() {
    vec3 dir = normalize(vPos);
    float h = smoothstep(-0.15, 0.55, dir.y);
    vec3 col = mix(uHorizon, uTop, h);

    // sun disc
    vec3 sd = normalize(uSunDir);
    float sdot = max(dot(dir, sd), 0.0);
    float sun = smoothstep(0.998 - uSunSize, 0.998, sdot);
    float glow = pow(max(sdot, 0.0), 48.0) * 0.6;
    col = mix(col, uSunColor, sun);
    col += uSunColor * glow * 0.45;

    gl_FragColor = vec4(col, 1.0);
  }
`;class Wt{constructor(t){a(this,"mesh");a(this,"material");const e=new N(t.radius,48,24);this.material=new x({vertexShader:$t,fragmentShader:Ut,side:Q,depthWrite:!1,uniforms:{uTop:{value:t.top.clone()},uHorizon:{value:t.horizon.clone()},uSunColor:{value:t.sunColor.clone()},uSunDir:{value:t.sunDir},uSunSize:{value:.0025}}}),this.mesh=new L(e,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=-1}setSunDirection(t){this.material.uniforms.uSunDir.value=t}dispose(){this.mesh.geometry.dispose(),this.material.dispose()}}const P=o=>new _(o[0],o[1],o[2]);function jt(o){const t=o.detailShift,e=o.heightScale,i=(s,n)=>new _(Math.max(0,s[0]+n),Math.max(0,s[1]+n),Math.max(0,s[2]+n));return{plain:{id:"plain",baseHeight:0,heightScale:2*e,color:P(o.palette.plain),detail:i(o.palette.plain,-t)},crater:{id:"crater",baseHeight:-3,heightScale:6*e,color:P(o.palette.crater),detail:i(o.palette.crater,-t)},ridge:{id:"ridge",baseHeight:-6,heightScale:10*e,color:P(o.palette.ridge),detail:i(o.palette.ridge,-t)},highland:{id:"highland",baseHeight:3,heightScale:6*e,color:P(o.palette.highland),detail:i(o.palette.highland,-t)},basalt:{id:"basalt",baseHeight:5,heightScale:8*e,color:P(o.palette.basalt),detail:i(o.palette.basalt,-t)}}}function O(o,t,e){const i=o.fbm(t*.002,e*.002,2,2,.5);return o.noise2D(t*.003,e*.003)>.6?"ridge":i<-.3?"crater":i>.4?"basalt":i>.15?"highland":"plain"}function K(o,t,e,i){const s=O(o,t,e),n=i[s];let l=n.baseHeight;if(l+=o.fbm(t*.01,e*.01,3,2,.5)*n.heightScale,l+=o.noise2D(t*.05,e*.05)*1.2,s==="crater"){const r=o.noise2D(t*.008,e*.008);r>.3&&(l-=(r-.3)*12)}if(s==="ridge"){const r=o.ridge(t*.003,e*.003,2,2,.5);r>.7&&(l-=(r-.7)*26)}return l}const Gt=.5*(Math.sqrt(3)-1),E=(3-Math.sqrt(3))/6,Vt=[[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];class Kt{constructor(t=0){a(this,"perm",new Uint8Array(512));a(this,"permMod8",new Uint8Array(512));const e=new Uint8Array(256);for(let s=0;s<256;s++)e[s]=s;let i=t|0||1;for(let s=255;s>0;s--){i=i*16807%2147483647;const n=i%(s+1),l=e[s];e[s]=e[n],e[n]=l}for(let s=0;s<512;s++)this.perm[s]=e[s&255],this.permMod8[s]=this.perm[s]&7}noise2D(t,e){const{perm:i,permMod8:s}=this,n=(t+e)*Gt,l=Math.floor(t+n),r=Math.floor(e+n),h=(l+r)*E,u=l-h,d=r-h,p=t-u,m=e-d,v=p>m?1:0,f=p>m?0:1,A=p-v+E,et=m-f+E,it=p-1+2*E,st=m-1+2*E,T=l&255,k=r&255,I=(rt,D,z)=>{let S=.5-D*D-z*z;if(S<0)return 0;S*=S;const F=Vt[rt];return S*S*(F[0]*D+F[1]*z)},at=I(s[T+i[k]],p,m),ot=I(s[T+v+i[k+f]],A,et),nt=I(s[T+1+i[k+1]],it,st);return 70*(at+ot+nt)}fbm(t,e,i=5,s=2,n=.5){let l=0,r=1,h=1,u=0;for(let d=0;d<i;d++)l+=r*this.noise2D(t*h,e*h),u+=r,r*=n,h*=s;return l/u}ridge(t,e,i=4,s=2,n=.5){let l=0,r=1,h=1,u=0;for(let d=0;d<i;d++){let p=this.noise2D(t*h,e*h);p=1-Math.abs(p),p*=p,l+=r*p,u+=r,r*=n,h*=s}return l/u}}class Yt{constructor(t){a(this,"root",new H);a(this,"mesh");a(this,"noise");a(this,"biomes");a(this,"options");a(this,"rocks",null);this.options=t,this.noise=new Kt(t.seed),this.biomes=jt(t.palette);const e=new vt(t.size,t.size,t.segments,t.segments);e.rotateX(-Math.PI/2);const i=e.attributes.position,s=new Float32Array(i.count*3),n=new _;for(let r=0;r<i.count;r++){const h=i.getX(r),u=i.getZ(r),d=K(this.noise,h,u,this.biomes);i.setY(r,d);const p=O(this.noise,h,u),m=this.biomes[p],v=this.noise.noise2D(h*.1,u*.1)*.5+.5;n.r=m.color.r+(m.detail.r-m.color.r)*v,n.g=m.color.g+(m.detail.g-m.color.g)*v,n.b=m.color.b+(m.detail.b-m.color.b)*v;const f=Math.max(.75,Math.min(1.25,1+d*.012));s[r*3+0]=n.r*f,s[r*3+1]=n.g*f,s[r*3+2]=n.b*f}e.setAttribute("color",new w(s,3)),e.computeVertexNormals();const l=new q({vertexColors:!0,flatShading:!1,roughness:.95,metalness:0});this.mesh=new L(e,l),this.mesh.receiveShadow=!0,this.root.add(this.mesh),this.scatterRocks()}getHeight(t,e){const i=this.options.size/2,s=Math.max(-i,Math.min(i,t)),n=Math.max(-i,Math.min(i,e));return K(this.noise,s,n,this.biomes)}dispose(){this.mesh.geometry.dispose(),this.mesh.material.dispose(),this.rocks&&(this.rocks.geometry.dispose(),this.rocks.material.dispose()),this.root.clear()}scatterRocks(){const e=new ft(1,.7,1),i=new q({color:0,vertexColors:!0,roughness:1,flatShading:!0}),s=new yt(e,i,260);s.receiveShadow=!0,s.castShadow=!1;const n=new wt,l=this.options.size/2-10;let r=0;for(let h=0;h<260*3&&r<260;h++){const u=(Math.random()-.5)*2*l,d=(Math.random()-.5)*2*l,p=this.noise.noise2D(u*.5,d*.5);if(p<-.25){const m=this.getHeight(u,d)-.1,v=.5+(p+1)*.6;n.makeScale(v,v*.55,v),n.setPosition(u,m,d),s.setMatrixAt(r,n);const f=O(this.noise,u,d),A=this.biomes[f].color;s.setColorAt(r,A.clone().multiplyScalar(.65)),r++}}s.count=r,s.instanceMatrix.needsUpdate=!0,s.instanceColor&&(s.instanceColor.needsUpdate=!0),this.rocks=s,this.root.add(s)}}class Xt{constructor(t,e){a(this,"root",new H);a(this,"scene");a(this,"terrain",null);a(this,"sky",null);a(this,"dust",null);a(this,"sun");a(this,"hemi");a(this,"prevFog");a(this,"prevBg");a(this,"config",null);a(this,"options");this.scene=t,this.options=e,this.sun=new Z(16777215,1.4),this.sun.position.set(50,80,40),this.hemi=new bt(16777215,0,.55),this.root.add(this.sun,this.hemi),this.prevBg=this.scene.background,this.prevFog=this.scene.fog,this.root.visible=!1}load(t){this.config=t,this.unloadMeshes(),this.terrain=new Yt({size:this.options.size,segments:this.options.segments,seed:t.id.charCodeAt(0)+t.id.length*13,palette:t.surfacePalette}),this.root.add(this.terrain.root),this.sky=new Wt({top:t.sky.top.clone(),horizon:t.sky.horizon.clone(),sunColor:t.surfacePalette.sunColor.clone(),sunDir:[.4,.8,.2],radius:this.options.size*2.2}),this.root.add(this.sky.mesh),this.dust=new qt({color:t.surfacePalette.dustColor.clone(),count:240,radius:35}),this.root.add(this.dust.points),this.hemi.color.copy(t.sky.horizon),this.hemi.groundColor.copy(t.surfacePalette.groundTint),this.hemi.intensity=t.surfacePalette.ambientIntensity,this.sun.color.copy(t.surfacePalette.sunColor),this.sun.intensity=t.surfacePalette.sunIntensity}getHeightAt(t,e){return this.terrain?this.terrain.getHeight(t,e):0}activate(){this.config&&(this.prevBg=this.scene.background,this.prevFog=this.scene.fog,this.scene.background=this.config.sky.horizon.clone(),this.scene.fog=new St(this.config.sky.horizon.clone().getHex(),60,this.options.size*.95),this.root.visible=!0)}deactivate(){this.scene.background=this.prevBg,this.scene.fog=this.prevFog??null,this.root.visible=!1}update(t,e){this.root.visible&&(this.dust&&(this.dust.setOrigin(e),this.dust.update(t)),this.sun.position.set(e.x+80,120,e.z+60),this.sun.target.position.copy(e),this.sun.target.updateMatrixWorld())}dispose(){this.unloadMeshes(),this.root.remove(this.sun,this.hemi)}unloadMeshes(){this.terrain&&(this.root.remove(this.terrain.root),this.terrain.dispose(),this.terrain=null),this.sky&&(this.root.remove(this.sky.mesh),this.sky.dispose(),this.sky=null),this.dust&&(this.root.remove(this.dust.points),this.dust.dispose(),this.dust=null)}}const Jt=[{id:"orbit",label:"ORBIT INSERTION"},{id:"deorbit",label:"DE-ORBIT BURN"},{id:"entry",label:"ATMOSPHERIC ENTRY"},{id:"chute",label:"CHUTE DEPLOY"},{id:"touchdown",label:"TOUCHDOWN"},{id:"walk",label:"SURFACE WALK"},{id:"survey",label:"EXTENDED SURVEY"},{id:"return",label:"RETURN VEHICLE"}];class Qt{constructor(t){a(this,"el");a(this,"listEl");a(this,"notesEl");this.el=document.createElement("section"),this.el.className="phase",this.el.setAttribute("data-ui","phase"),this.el.innerHTML=`
      <div class="phase__label">FLIGHT PHASE</div>
      <ul class="phase__list" data-phases></ul>
      <div class="notes" data-notes>
        <div class="notes__title">FIELD NOTES</div>
        <ul data-notes-list></ul>
      </div>
    `,t.appendChild(this.el),this.listEl=this.el.querySelector("[data-phases]"),this.notesEl=this.el.querySelector("[data-notes-list]")}setMode(t){const e=t==="orbit"?0:5;this.listEl.innerHTML=Jt.map((i,s)=>{const n=s<e?"phase__item phase__item--done":s===e?"phase__item phase__item--active":"phase__item",l=s<e?"✓":s===e?"▸":"·";return`<li class="${n}"><span class="phase__dot"></span>${l} ${i.label}</li>`}).join("")}setConfig(t){this.notesEl.innerHTML=t.notes.map(e=>`<li>${e}</li>`).join("")}}class Zt{constructor(t){a(this,"root");a(this,"trajectoryCanvas");a(this,"attitudeCanvas");a(this,"trajectoryCaption");a(this,"attitudeCaption");this.root=document.createElement("section"),this.root.className="rightpanel",this.root.setAttribute("data-ui","right"),this.root.innerHTML=`
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
    `,t.appendChild(this.root),this.trajectoryCanvas=this.root.querySelector("[data-trajectory]"),this.attitudeCanvas=this.root.querySelector("[data-attitude]"),this.trajectoryCaption=this.root.querySelector("[data-trajectory-caption]"),this.attitudeCaption=this.root.querySelector("[data-attitude-caption]")}update(t,e,i){this.drawTrajectory(t,e,i),this.drawAttitude(t,i),this.trajectoryCaption.textContent=t.mode==="orbit"?`DIST ${(t.altitude/1e3).toFixed(1)} km`:`HEADING ${t.heading.toFixed(1)}°`,this.attitudeCaption.textContent=`PITCH ${t.pitch>=0?"+":""}${t.pitch.toFixed(1)}°  ·  ROLL ${t.roll>=0?"+":""}${t.roll.toFixed(1)}°`}drawTrajectory(t,e,i){const s=this.trajectoryCanvas.getContext("2d");if(!s)return;const n=this.trajectoryCanvas.width,l=this.trajectoryCanvas.height,r=n/2,h=l/2;s.clearRect(0,0,n,l),s.fillStyle=e,s.globalAlpha=.35,s.fillRect(0,0,n,l),s.globalAlpha=1,s.fillStyle=i,s.globalAlpha=.4,s.beginPath(),s.arc(r,h,62,0,Math.PI*2),s.fill(),s.globalAlpha=1,s.strokeStyle="rgba(255,255,255,0.45)",s.lineWidth=.6,s.beginPath(),s.arc(r,h,62,0,Math.PI*2),s.stroke(),s.strokeStyle="rgba(255,255,255,0.45)",s.setLineDash([3,4]),s.beginPath(),s.ellipse(r,h,100,94,0,0,Math.PI*2),s.stroke(),s.setLineDash([]);const u=t.lat*Math.PI/180,d=t.lon*Math.PI/180,p=r+62*Math.cos(u)*Math.cos(d),m=h-62*Math.sin(u);s.strokeStyle="rgba(74,158,255,0.9)",s.lineWidth=1.4,s.beginPath(),s.moveTo(r-100,h-70),s.quadraticCurveTo(r-20,h-20,p,m),s.stroke(),s.fillStyle="rgb(0,214,143)",s.beginPath(),s.arc(p,m,4,0,Math.PI*2),s.fill(),s.strokeStyle="rgba(0,214,143,0.5)",s.lineWidth=.8,s.beginPath(),s.arc(p,m,9,0,Math.PI*2),s.stroke(),s.fillStyle="rgba(255,255,255,0.7)",s.fillRect(r-102,h-72,2,2),s.strokeStyle="rgba(255,255,255,0.15)",s.lineWidth=.5,s.beginPath(),s.moveTo(r,10),s.lineTo(r,n-10),s.moveTo(10,h),s.lineTo(l-10,h),s.stroke()}drawAttitude(t,e){const i=this.attitudeCanvas.getContext("2d");if(!i)return;const s=this.attitudeCanvas.width,n=this.attitudeCanvas.height,l=s/2,r=n/2,h=88;i.clearRect(0,0,s,n),i.save(),i.translate(l,r);const u=t.roll*Math.PI/180;i.rotate(u),i.fillStyle=e,i.globalAlpha=.6,i.beginPath(),i.arc(0,0,h,0,Math.PI*2),i.clip();const d=t.pitch*1.5;i.fillRect(-h,d,h*2,h*2),i.globalAlpha=1,i.strokeStyle="rgba(255,255,255,0.6)",i.lineWidth=1,i.beginPath(),i.moveTo(-h,d),i.lineTo(h,d),i.stroke(),i.restore(),i.strokeStyle="rgba(255,255,255,0.35)",i.lineWidth=.6,i.beginPath(),i.arc(l,r,h,0,Math.PI*2),i.stroke(),i.strokeStyle="rgb(255,222,0)",i.lineWidth=2,i.beginPath(),i.moveTo(l-26,r),i.lineTo(l-10,r),i.moveTo(l+10,r),i.lineTo(l+26,r),i.stroke(),i.fillStyle="rgb(255,222,0)",i.beginPath(),i.arc(l,r,2,0,Math.PI*2),i.fill(),i.fillStyle="rgba(255,255,255,0.5)",i.font="10px ui-monospace, monospace",i.textAlign="center",i.fillText("N",l,r-h-6),i.fillText("S",l,r+h+14),i.textAlign="left",i.fillText("E",l+h+6,r+4),i.textAlign="right",i.fillText("W",l-h-6,r+4)}}class te{constructor(t){a(this,"el");a(this,"speedEl");a(this,"altEl");a(this,"latEl");a(this,"lonEl");a(this,"solEl");a(this,"localEl");a(this,"gravityEl");a(this,"fpsEl");a(this,"drawEl");a(this,"memEl");a(this,"altUnitEl");this.el=document.createElement("section"),this.el.className="telemetry",this.el.setAttribute("data-ui","telemetry"),this.el.innerHTML=`
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
    `,t.appendChild(this.el),this.speedEl=this.el.querySelector("[data-speed]"),this.altEl=this.el.querySelector("[data-alt]"),this.altUnitEl=this.el.querySelector("[data-alt-unit]"),this.latEl=this.el.querySelector("[data-lat]"),this.lonEl=this.el.querySelector("[data-lon]"),this.solEl=this.el.querySelector("[data-sol]"),this.localEl=this.el.querySelector("[data-local]"),this.gravityEl=this.el.querySelector("[data-gravity]"),this.fpsEl=this.el.querySelector("[data-fps]"),this.drawEl=this.el.querySelector("[data-draw]"),this.memEl=this.el.querySelector("[data-mem]")}update(t,e){this.speedEl.textContent=t.velocity.toFixed(1),this.altEl.textContent=Math.round(t.altitude).toLocaleString(),this.altUnitEl.textContent=`METERS · DATUM ${e}`,this.latEl.innerHTML=`${G(t.lat,"lat")}<small>LAT</small>`,this.lonEl.innerHTML=`${G(t.lon,"lon")}<small>LON</small>`,this.solEl.textContent=String(t.sol),this.localEl.textContent=t.localTime,this.gravityEl.textContent=`${t.gravity.toFixed(2)} m·s⁻²`,this.fpsEl.textContent=t.fps.toFixed(1),this.drawEl.textContent=String(t.drawCalls),this.memEl.textContent=`${t.memoryMB.toFixed(0)} MB`}}class ee{constructor(t){a(this,"el");a(this,"missionEl");a(this,"timeEl");a(this,"signalEl");this.el=document.createElement("div"),this.el.className="topbar",this.el.setAttribute("data-ui","topbar"),this.el.innerHTML=`
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
    `,t.appendChild(this.el),this.missionEl=this.el.querySelector("[data-mission]"),this.timeEl=this.el.querySelector("[data-clock]"),this.signalEl=this.el.querySelector("[data-signal]")}setMission(t){this.missionEl.textContent=`${t.name} · ${t.landingSite.name.toUpperCase()}`}setSignal(t,e){this.signalEl.textContent=`DSN · ${t.toFixed(0)} dBm · LAT ${e.toFixed(0)} ms`}tick(){const e=new Date().toISOString();this.timeEl.textContent=`${e.slice(0,10)} · ${e.slice(11,19)} UTC`}}class ie{constructor(t,e){a(this,"root");a(this,"grid");a(this,"activeId","");a(this,"onPick");a(this,"open",!1);this.onPick=e,this.root=document.createElement("div"),this.root.className="worldselect",this.root.setAttribute("data-ui","worldselect"),this.root.innerHTML=`
      <div class="worldselect__panel">
        <div class="worldselect__header">
          <div class="worldselect__title">SELECT WORLD</div>
          <div class="worldselect__hint">[1-5] DIRECT · [M] CLOSE · [ESC] ABORT</div>
        </div>
        <div class="worldselect__grid" data-grid></div>
      </div>
    `,t.appendChild(this.root),this.grid=this.root.querySelector("[data-grid]"),this.render(),this.root.addEventListener("click",i=>{i.target===this.root&&this.close()})}setActive(t){this.activeId=t,this.render()}toggle(){this.open?this.close():this.show()}show(){this.open=!0,this.root.classList.add("is-open")}close(){this.open=!1,this.root.classList.remove("is-open")}isOpen(){return this.open}selectByIndex(t){const e=b[t];e&&(this.onPick(e),this.close())}render(){this.grid.innerHTML=b.map((t,e)=>`
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
      `).join(""),this.grid.querySelectorAll(".worldselect__card").forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.id,i=b.find(s=>s.id===e);i&&(this.onPick(i),this.close())})})}}function C(o){const t=e=>Math.round(e*255).toString(16).padStart(2,"0");return`#${t(o.r)}${t(o.g)}${t(o.b)}`}class se{constructor(t,e){a(this,"root");a(this,"topbar");a(this,"phase");a(this,"right");a(this,"telemetry");a(this,"worldSelect");a(this,"viewport");a(this,"targetPin");a(this,"modeBtn");a(this,"descentEl");a(this,"activeConfig",null);this.root=document.createElement("div"),this.root.id="hud",document.body.appendChild(this.root),this.topbar=new ee(this.root),this.phase=new Qt(this.root),this.viewport=document.createElement("section"),this.viewport.className="viewport",this.viewport.innerHTML=`
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
    `,this.root.appendChild(this.viewport),this.targetPin=this.viewport.querySelector("[data-target]"),this.modeBtn=this.viewport.querySelector("[data-modebtn]"),this.descentEl=this.viewport.querySelector("[data-descent]"),this.modeBtn.addEventListener("click",s=>{s.stopPropagation(),e()}),this.right=new Zt(this.root),this.telemetry=new te(this.root);const i=document.createElement("div");i.className="legend",i.innerHTML=`
      <div class="legend__keys">
        <span><kbd>W A S D</kbd>TRANSLATE</span>
        <span><kbd>␣</kbd>JUMP</span>
        <span><kbd>MOUSE</kbd>GAZE</span>
        <span><kbd>TAB</kbd>ORBIT / SURFACE</span>
        <span><kbd>M</kbd>WORLDS</span>
      </div>
      <div>PLANET·WALK / 2026 · S045PD</div>
    `,this.root.appendChild(i),this.worldSelect=new ie(document.body,t)}setConfig(t){this.activeConfig=t,It(document.body,t),document.body.style.background=`linear-gradient(to bottom, ${C(t.sky.top)}, ${C(t.sky.horizon)} 85%, ${C(t.sky.top)})`,this.topbar.setMission(t),this.phase.setConfig(t),this.worldSelect.setActive(t.id);const e=t.landingSite,i=this.targetPin.querySelector("[data-target-name]"),s=this.targetPin.querySelector("[data-target-coord]"),n=this.targetPin.querySelector("[data-target-dist]");i.textContent=`TARGET · ${e.name.toUpperCase()}`,s.textContent=`${e.lat.toFixed(3)}° · ${e.lon.toFixed(3)}°`,n.textContent="LANDING ZONE"}update(t){if(!this.activeConfig)return;const e=this.activeConfig;this.topbar.tick(),this.topbar.setSignal(-64-Math.random()*2,120+Math.random()*8),this.phase.setMode(t.mode),this.telemetry.update(t,e.solLabel),this.right.update(t,C(e.sky.top),C(e.surface.mid));const i=this.viewport.querySelector("[data-cam-mode]");i.textContent=t.mode==="orbit"?"CAM · 03 · ORBIT OBSERVER":"CAM · 07 · SURFACE WALKER",this.targetPin.style.display=t.mode==="orbit"?"block":"none";const s=this.modeBtn.querySelector("[data-modebtn-label]"),n=this.modeBtn.querySelector(".modebtn__marker");t.mode==="orbit"?(this.modeBtn.classList.remove("modebtn--abort"),this.modeBtn.classList.add("modebtn--land"),s.textContent="INITIATE LANDING",n.textContent="▾"):(this.modeBtn.classList.remove("modebtn--land"),this.modeBtn.classList.add("modebtn--abort"),s.textContent="RETURN TO ORBIT",n.textContent="▴")}setDescent(t,e="DESCENT · ENTRY INTERFACE"){this.descentEl.classList.toggle("is-active",t);const i=this.descentEl.querySelector("[data-descent-label]");i.textContent=e,this.modeBtn.style.visibility=t?"hidden":"visible"}}class ae{constructor(t){a(this,"engine");a(this,"input");a(this,"hud");a(this,"orbit");a(this,"player");a(this,"planet");a(this,"starfield");a(this,"sun");a(this,"ambient");a(this,"surface");a(this,"mode","orbit");a(this,"startTime",Date.now());a(this,"transitioning",null);a(this,"transitionTimer",null);this.engine=new Pt(t),this.input=new Et(t),this.starfield=kt(2400,22e3),this.engine.scene.add(this.starfield),this.sun=new Z(16777215,1.2),this.sun.position.set(1,.4,.6).normalize().multiplyScalar(5e3),this.engine.scene.add(this.sun),this.ambient=new Mt(2241348,.4),this.engine.scene.add(this.ambient);const e=b.find(i=>i.id===Dt)??b[0];this.planet=new U(e),this.engine.scene.add(this.planet.root),this.orbit=new Nt(this.engine.camera,e.radius),this.player=new Ot(this.engine.camera,this.input),this.player.setConfig(e),this.surface=new Xt(this.engine.scene,{size:900,segments:192}),this.engine.scene.add(this.surface.root),this.surface.load(e),this.hud=new se(i=>this.switchPlanet(i),()=>this.toggleMode()),this.hud.setConfig(e),this.bindKeys(),this.engine.register({update:i=>this.update(i)})}start(){this.engine.start()}bindKeys(){this.input.onPress("Tab",()=>this.toggleMode()),this.input.onPress("KeyM",()=>{this.mode==="surface"&&this.input.exitPointerLock(),this.hud.worldSelect.toggle()}),this.input.onPress("Escape",()=>{this.hud.worldSelect.close(),this.mode==="surface"&&this.input.exitPointerLock()}),["Digit1","Digit2","Digit3","Digit4","Digit5"].forEach((e,i)=>{this.input.onPress(e,()=>{const s=b[i];s&&this.switchPlanet(s)})})}toggleMode(){this.transitioning||(this.mode==="orbit"?this.startLanding():this.startAscent())}startLanding(){this.transitioning="landing",this.hud.setDescent(!0,"DESCENT · ENTRY INTERFACE");const t=this.planet.config.landingSite,e=this.planet.config.radius;this.orbit.setDesired({azimuth:t.lon*Math.PI/180,polar:Math.PI/2-t.lat*Math.PI/180,distance:e*1.18}),this.transitionTimer=window.setTimeout(()=>{this.transitioning=null,this.hud.setDescent(!1),this.mode="surface",this.planet.root.visible=!1,this.starfield.visible=!1,this.surface.activate(),this.player.enterSurface(this.surface),this.input.requestPointerLock()},1700)}startAscent(){this.transitioning="ascent",this.hud.setDescent(!0,"ASCENT · ORBIT INSERTION"),this.input.exitPointerLock(),this.mode="orbit",this.planet.root.visible=!0,this.starfield.visible=!0,this.surface.deactivate(),this.player.exitSurface();const t=this.planet.config.radius;this.orbit.setDesired({azimuth:this.planet.config.landingSite.lon*Math.PI/180,polar:Math.PI/2-this.planet.config.landingSite.lat*Math.PI/180,distance:t*3}),this.transitionTimer=window.setTimeout(()=>{this.transitioning=null,this.hud.setDescent(!1)},1400)}switchPlanet(t){t.id!==this.planet.config.id&&(this.transitionTimer!==null&&(window.clearTimeout(this.transitionTimer),this.transitionTimer=null),this.transitioning=null,this.hud.setDescent(!1),this.mode="orbit",this.input.exitPointerLock(),this.surface.deactivate(),this.engine.scene.remove(this.planet.root),this.planet.dispose(),this.planet=new U(t),this.engine.scene.add(this.planet.root),this.planet.root.visible=!0,this.starfield.visible=!0,this.orbit.reconfigure(t.radius),this.player.setConfig(t),this.surface.load(t),this.hud.setConfig(t))}update(t){this.planet.root.visible&&this.planet.update(t),this.mode==="orbit"||this.transitioning?this.orbit.update(t):this.player.update(t),this.surface.update(t,this.player.snapshot().position),this.hud.update(this.collectTelemetry())}collectTelemetry(){const t=this.planet.config,e=this.player.snapshot(),i=this.orbit.getState(),s=(Date.now()-this.startTime)/1e3,n=s%t.rotationPeriod,l=Math.floor(n/3600)%24,r=Math.floor(n%3600/60),h=`${String(l).padStart(2,"0")}:${String(r).padStart(2,"0")}`,u=Math.floor(s/Math.max(t.rotationPeriod,1))+47,d=performance.memory,p=d?d.usedJSHeapSize/(1024*1024):0;return this.mode==="orbit"?{worldId:t.id,worldName:t.name,lat:t.landingSite.lat,lon:t.landingSite.lon,altitude:i.distance-t.radius,velocity:0,gravity:t.gravity,heading:0,pitch:0,roll:0,sol:u,localTime:h,mode:"orbit",fps:this.engine.stats.fps,drawCalls:this.engine.stats.drawCalls,memoryMB:p}:{worldId:t.id,worldName:t.name,lat:e.lat,lon:e.lon,altitude:e.altitude,velocity:e.speed,gravity:t.gravity,heading:e.heading,pitch:e.pitch,roll:e.roll,sol:u,localTime:h,mode:"surface",fps:this.engine.stats.fps,drawCalls:this.engine.stats.drawCalls,memoryMB:p}}}const tt=document.getElementById("app");if(!tt)throw new Error("Canvas #app not found");const oe=new ae(tt);oe.start();
