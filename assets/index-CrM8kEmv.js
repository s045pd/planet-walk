var z=Object.defineProperty;var I=(o,t,e)=>t in o?z(o,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[t]=e;var i=(o,t,e)=>I(o,typeof t!="symbol"?t+"":t,e);import{W as O,S,A as N,a as U,C as g,b as v,c as y,B as k,M as _,d as P,e as B,f as C,g as A,P as H,h as V,D as W,O as j,i as q,F as R,V as h,T as b,j as G,G as F,k as K,l as Y,Q as w,R as $,m as X,n as J}from"./three-C8h-SY3M.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function e(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(n){if(n.ep)return;n.ep=!0;const a=e(n);fetch(n.href,a)}})();class Q{constructor(t){i(this,"renderer");this.renderer=new O({canvas:t.canvas,antialias:t.antialias,logarithmicDepthBuffer:t.logarithmicDepthBuffer}),this.renderer.setPixelRatio(t.pixelRatio),this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.outputColorSpace=S,this.renderer.toneMapping=N}resize(){this.renderer.setSize(window.innerWidth,window.innerHeight)}render(t,e){this.renderer.render(t,e)}dispose(){this.renderer.dispose()}}const p=1e3,Z=532,tt=272,et=9.81,it=3.72,st=1.62,nt=.1,at=1e5,ot=60,M=5e3;class rt{constructor(t){i(this,"scene");i(this,"planet");i(this,"skybox");i(this,"stars");i(this,"sunLight");i(this,"sunTarget");this.planet=t,this.scene=new U,this.scene.background=new g(131850),this.createSkybox(),this.addPlanet(),this.createStars(),this.createLights()}get planetName(){return this.planet.config.name}get planetRadius(){return this.planet.config.radius}replacePlanet(t){this.scene.remove(this.planet.root),this.planet.dispose(),this.planet=t,this.addPlanet()}addPlanet(){this.scene.add(this.planet.root)}createSkybox(){const t=new v(p*120,32,32),e=new y({side:k,depthWrite:!1,uniforms:{topColor:{value:new g(395286)},bottomColor:{value:new g(66053)}},vertexShader:`
        varying vec3 vWorldPosition;

        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:`
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition).y * 0.5 + 0.5;
          vec3 color = mix(bottomColor, topColor, smoothstep(0.0, 1.0, h));
          gl_FragColor = vec4(color, 1.0);
        }
      `});this.skybox=new _(t,e),this.scene.add(this.skybox)}createStars(){const t=new Float32Array(M*3),e=new Float32Array(M),s=new Float32Array(M),n=p*45,a=p*65;for(let c=0;c<M;c++){const u=P.lerp(n,a,Math.random()),f=Math.random()*Math.PI*2,m=Math.acos(P.randFloatSpread(2));t[c*3]=u*Math.sin(m)*Math.cos(f),t[c*3+1]=u*Math.sin(m)*Math.sin(f),t[c*3+2]=u*Math.cos(m),e[c]=P.randFloat(1,4),s[c]=P.randFloat(.35,1)}const r=new B;r.setAttribute("position",new C(t,3)),r.setAttribute("size",new C(e,1)),r.setAttribute("brightness",new C(s,1));const l=new y({transparent:!0,depthWrite:!1,blending:A,vertexShader:`
        attribute float size;
        attribute float brightness;
        varying float vBrightness;

        void main() {
          vBrightness = brightness;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (260.0 / max(-mvPosition.z, 1.0));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,fragmentShader:`
        varying float vBrightness;

        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          float alpha = smoothstep(0.5, 0.0, d) * vBrightness;
          gl_FragColor = vec4(vec3(vBrightness), alpha);
        }
      `});this.stars=new H(r,l),this.stars.frustumCulled=!1,this.scene.add(this.stars)}createLights(){const t=new V(2437183,.35);this.scene.add(t),this.sunLight=new W(16774877,2.2),this.sunLight.position.set(p*30,p*8,-p*18).normalize().multiplyScalar(p*60),this.sunTarget=new j,this.sunTarget.position.set(0,0,0),this.sunLight.target=this.sunTarget,this.scene.add(this.sunLight),this.scene.add(this.sunTarget)}dispose(){this.planet.dispose(),this.skybox.geometry.dispose(),this.skybox.material.dispose(),this.stars.geometry.dispose(),this.stars.material.dispose()}}class ht{constructor(){i(this,"camera");const t=window.innerWidth/window.innerHeight;this.camera=new q(ot,t,nt,at),this.camera.position.set(0,0,p*3),this.camera.lookAt(0,0,0)}resize(){this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix()}dispose(){}}class L{constructor(t){i(this,"element");i(this,"enabled",!0);i(this,"listeners",new Set);i(this,"preventDefault");i(this,"previousTouchAction");i(this,"lastSinglePoint",null);i(this,"lastPinchDistance",null);i(this,"onTouchStart",t=>{this.handleNativeTouchEvent("start",t)});i(this,"onTouchMove",t=>{this.handleNativeTouchEvent("move",t)});i(this,"onTouchEnd",t=>{this.handleNativeTouchEvent("end",t)});this.element=t.element,this.preventDefault=t.preventDefault??!0,this.previousTouchAction=this.element.style.touchAction,this.preventDefault&&(this.element.style.touchAction="none"),this.element.addEventListener("touchstart",this.onTouchStart,{passive:!1}),this.element.addEventListener("touchmove",this.onTouchMove,{passive:!1}),this.element.addEventListener("touchend",this.onTouchEnd,{passive:!1}),this.element.addEventListener("touchcancel",this.onTouchEnd,{passive:!1})}static isMobile(){return typeof window>"u"||typeof navigator>"u"?!1:navigator.maxTouchPoints>0||"ontouchstart"in window?!0:window.matchMedia?.("(pointer: coarse)").matches??!1}addListener(t){return this.listeners.add(t),()=>{this.listeners.delete(t)}}handleNativeTouchEvent(t,e){if(!this.enabled)return;this.preventDefault&&e.cancelable&&e.preventDefault();const s=this.normalizeTouchList(e.touches),n=this.normalizeTouchList(e.changedTouches),a={x:0,y:0};let r=1;if(t==="move"&&(s.length===1&&this.lastSinglePoint&&s[0].id===this.lastSinglePoint.id&&(a.x=s[0].x-this.lastSinglePoint.x,a.y=s[0].y-this.lastSinglePoint.y),s.length>=2&&this.lastPinchDistance!==null)){const c=this.getDistance(s[0],s[1]);this.lastPinchDistance>1e-6&&(r=c/this.lastPinchDistance)}const l={phase:t,touches:s,changedTouches:n,center:this.getCenter(s),singleDragDelta:a,pinchScaleDelta:r,originalEvent:e};this.listeners.forEach(c=>{c(l)}),this.updateTrackingState(s)}normalizeTouchList(t){const e=[];for(let s=0;s<t.length;s+=1){const n=t.item(s);n&&e.push({id:n.identifier,x:n.clientX,y:n.clientY})}return e.sort((s,n)=>s.id-n.id),e}getCenter(t){if(t.length===0)return null;let e=0,s=0;return t.forEach(n=>{e+=n.x,s+=n.y}),{x:e/t.length,y:s/t.length}}getDistance(t,e){const s=t.x-e.x,n=t.y-e.y;return Math.hypot(s,n)}updateTrackingState(t){if(t.length===1){this.lastSinglePoint={...t[0]},this.lastPinchDistance=null;return}if(t.length>=2){this.lastSinglePoint=null,this.lastPinchDistance=this.getDistance(t[0],t[1]);return}this.lastSinglePoint=null,this.lastPinchDistance=null}dispose(){this.listeners.clear(),this.element.removeEventListener("touchstart",this.onTouchStart),this.element.removeEventListener("touchmove",this.onTouchMove),this.element.removeEventListener("touchend",this.onTouchEnd),this.element.removeEventListener("touchcancel",this.onTouchEnd),this.element.style.touchAction=this.previousTouchAction}}function lt(o,t,e){return o.clone().slerp(t,e)}function d(o,t,e){return Math.max(t,Math.min(e,o))}class ct{constructor(){i(this,"isMobileDevice");i(this,"root");i(this,"leftPad");i(this,"leftBase");i(this,"leftKnob");i(this,"rightPad");i(this,"active",!1);i(this,"movement",{forward:0,right:0});i(this,"lookDelta",{x:0,y:0});i(this,"leftTouchId",null);i(this,"rightTouchId",null);i(this,"rightLastPoint",null);i(this,"leftCenter",{x:0,y:0});i(this,"leftRadius",1);i(this,"onResize",()=>{if(!this.leftBase)return;const t=this.leftBase.getBoundingClientRect();this.leftCenter.x=t.left+t.width*.5,this.leftCenter.y=t.top+t.height*.5,this.leftRadius=Math.max(24,t.width*.36)});i(this,"onLeftTouchStart",t=>{if(!this.active||this.leftTouchId!==null)return;const e=t.changedTouches.item(0);e&&(this.leftTouchId=e.identifier,this.updateLeftMovement(e.clientX,e.clientY),t.cancelable&&t.preventDefault())});i(this,"onRightTouchStart",t=>{if(!this.active||this.rightTouchId!==null)return;const e=t.changedTouches.item(0);e&&(this.rightTouchId=e.identifier,this.rightLastPoint={x:e.clientX,y:e.clientY},t.cancelable&&t.preventDefault())});i(this,"onWindowTouchMove",t=>{if(!this.active)return;let e=!1;for(let s=0;s<t.changedTouches.length;s+=1){const n=t.changedTouches.item(s);n&&(n.identifier===this.leftTouchId&&(e=!0,this.updateLeftMovement(n.clientX,n.clientY)),n.identifier===this.rightTouchId&&(e=!0,this.updateLookDelta(n.clientX,n.clientY)))}e&&t.cancelable&&t.preventDefault()});i(this,"onWindowTouchEnd",t=>{if(!this.active)return;let e=!1;for(let s=0;s<t.changedTouches.length;s+=1){const n=t.changedTouches.item(s);n&&(n.identifier===this.leftTouchId&&(e=!0,this.leftTouchId=null,this.resetLeftMovement()),n.identifier===this.rightTouchId&&(e=!0,this.rightTouchId=null,this.rightLastPoint=null))}e&&t.cancelable&&t.preventDefault()});if(this.isMobileDevice=L.isMobile(),!this.isMobileDevice){this.root=null,this.leftPad=null,this.leftBase=null,this.leftKnob=null,this.rightPad=null;return}this.root=document.createElement("div"),this.root.style.position="fixed",this.root.style.inset="0",this.root.style.zIndex="30",this.root.style.pointerEvents="none",this.root.style.userSelect="none",this.leftPad=document.createElement("div"),this.leftPad.style.position="absolute",this.leftPad.style.left="20px",this.leftPad.style.bottom="22px",this.leftPad.style.width="42vw",this.leftPad.style.height="42vw",this.leftPad.style.maxWidth="190px",this.leftPad.style.maxHeight="190px",this.leftPad.style.minWidth="128px",this.leftPad.style.minHeight="128px",this.leftPad.style.display="flex",this.leftPad.style.alignItems="center",this.leftPad.style.justifyContent="center",this.leftPad.style.pointerEvents="auto",this.leftPad.style.touchAction="none",this.leftBase=document.createElement("div"),this.leftBase.style.position="relative",this.leftBase.style.width="72%",this.leftBase.style.height="72%",this.leftBase.style.borderRadius="999px",this.leftBase.style.border="2px solid rgba(175, 213, 255, 0.45)",this.leftBase.style.background="radial-gradient(circle at 35% 30%, rgba(180, 220, 255, 0.28), rgba(10, 22, 40, 0.4) 72%)",this.leftBase.style.boxShadow="inset 0 0 24px rgba(90, 155, 220, 0.38)",this.leftKnob=document.createElement("div"),this.leftKnob.style.position="absolute",this.leftKnob.style.left="50%",this.leftKnob.style.top="50%",this.leftKnob.style.width="42%",this.leftKnob.style.height="42%",this.leftKnob.style.borderRadius="999px",this.leftKnob.style.border="2px solid rgba(220, 242, 255, 0.7)",this.leftKnob.style.background="radial-gradient(circle at 35% 35%, rgba(230, 248, 255, 0.9), rgba(125, 175, 235, 0.56))",this.leftKnob.style.boxShadow="0 0 18px rgba(120, 178, 245, 0.48)",this.leftKnob.style.transform="translate(-50%, -50%)",this.rightPad=document.createElement("div"),this.rightPad.style.position="absolute",this.rightPad.style.top="0",this.rightPad.style.right="0",this.rightPad.style.width="50vw",this.rightPad.style.height="100%",this.rightPad.style.pointerEvents="auto",this.rightPad.style.touchAction="none",this.rightPad.style.background="linear-gradient(90deg, rgba(15, 25, 40, 0), rgba(95, 165, 235, 0.08) 42%, rgba(125, 190, 245, 0.15) 100%)",this.rightPad.style.borderLeft="1px solid rgba(145, 198, 255, 0.2)";const t=document.createElement("div");t.style.position="absolute",t.style.right="22px",t.style.bottom="30px",t.style.width="60px",t.style.height="60px",t.style.borderRadius="999px",t.style.border="1px dashed rgba(170, 214, 255, 0.36)",t.style.background="rgba(95, 158, 230, 0.1)",t.style.pointerEvents="none",this.leftBase.appendChild(this.leftKnob),this.leftPad.appendChild(this.leftBase),this.root.append(this.leftPad,this.rightPad,t),document.body.appendChild(this.root),this.leftPad.addEventListener("touchstart",this.onLeftTouchStart,{passive:!1}),this.rightPad.addEventListener("touchstart",this.onRightTouchStart,{passive:!1}),window.addEventListener("touchmove",this.onWindowTouchMove,{passive:!1}),window.addEventListener("touchend",this.onWindowTouchEnd,{passive:!1}),window.addEventListener("touchcancel",this.onWindowTouchEnd,{passive:!1}),window.addEventListener("resize",this.onResize),this.onResize(),this.setActive(!1)}setActive(t){!this.isMobileDevice||!this.root||this.active!==t&&(this.active=t,this.root.style.display=t?"block":"none",t||this.resetState())}getMovementVector(){return{forward:this.movement.forward,right:this.movement.right}}consumeLookDelta(){const t={x:this.lookDelta.x,y:this.lookDelta.y};return this.lookDelta.x=0,this.lookDelta.y=0,t}updateLeftMovement(t,e){const s=t-this.leftCenter.x,n=e-this.leftCenter.y,a=Math.hypot(s,n),r=a>this.leftRadius?this.leftRadius/a:1,l=s*r,c=n*r;this.setKnobPosition(l,c);let u=l/this.leftRadius,f=-c/this.leftRadius;const m=.08;Math.abs(u)<m&&(u=0),Math.abs(f)<m&&(f=0),this.movement.right=d(u,-1,1),this.movement.forward=d(f,-1,1)}updateLookDelta(t,e){if(!this.rightLastPoint){this.rightLastPoint={x:t,y:e};return}const s=t-this.rightLastPoint.x,n=e-this.rightLastPoint.y;this.rightLastPoint.x=t,this.rightLastPoint.y=e,this.lookDelta.x+=s,this.lookDelta.y+=n}resetLeftMovement(){this.movement.forward=0,this.movement.right=0,this.setKnobPosition(0,0)}setKnobPosition(t,e){this.leftKnob&&(this.leftKnob.style.transform=`translate(calc(-50% + ${t.toFixed(2)}px), calc(-50% + ${e.toFixed(2)}px))`)}resetState(){this.leftTouchId=null,this.rightTouchId=null,this.rightLastPoint=null,this.lookDelta.x=0,this.lookDelta.y=0,this.resetLeftMovement()}dispose(){!this.isMobileDevice||!this.root||(this.leftPad?.removeEventListener("touchstart",this.onLeftTouchStart),this.rightPad?.removeEventListener("touchstart",this.onRightTouchStart),window.removeEventListener("touchmove",this.onWindowTouchMove),window.removeEventListener("touchend",this.onWindowTouchEnd),window.removeEventListener("touchcancel",this.onWindowTouchEnd),window.removeEventListener("resize",this.onResize),this.root.remove())}}class dt{constructor(t){i(this,"keys",new Set);i(this,"_mouseDelta",{x:0,y:0});i(this,"_pointerLocked",!1);i(this,"_pointerLockEnabled");i(this,"_jumpRequested",!1);i(this,"_canvas");i(this,"_isMobile");i(this,"_touchManager");i(this,"_virtualJoystick");i(this,"onKeyDown",t=>{this.keys.add(t.code),t.code==="Space"&&(this._jumpRequested=!0)});i(this,"onKeyUp",t=>{this.keys.delete(t.code)});i(this,"onMouseMove",t=>{this._isMobile||this._pointerLocked&&(this._mouseDelta.x+=t.movementX,this._mouseDelta.y+=t.movementY)});i(this,"onPointerLockChange",()=>{this._isMobile||(this._pointerLocked=document.pointerLockElement===this._canvas)});i(this,"requestPointerLock",()=>{this._isMobile||this._pointerLockEnabled&&this._canvas?.requestPointerLock()});this._canvas=t??null,this._isMobile=L.isMobile(),this._pointerLockEnabled=!this._isMobile,this._touchManager=this._isMobile&&this._canvas?new L({element:this._canvas}):null,this._virtualJoystick=this._isMobile?new ct:null,window.addEventListener("keydown",this.onKeyDown),window.addEventListener("keyup",this.onKeyUp),this._isMobile?this._virtualJoystick?.setActive(!1):(document.addEventListener("mousemove",this.onMouseMove),document.addEventListener("pointerlockchange",this.onPointerLockChange),this.bindPointerLockClick())}isPressed(t){return this.keys.has(t)}get isMobile(){return this._isMobile}get touchManager(){return this._touchManager}consumeMouseDelta(){const t={x:this._mouseDelta.x,y:this._mouseDelta.y};if(this._isMobile){const e=this._virtualJoystick?.consumeLookDelta();e&&(t.x+=e.x,t.y+=e.y)}return this._mouseDelta.x=0,this._mouseDelta.y=0,t}consumeJump(){return this._jumpRequested?(this._jumpRequested=!1,!0):!1}get pointerLocked(){return this._pointerLocked}get pointerLockEnabled(){return this._pointerLockEnabled}setPointerLockEnabled(t){if(this._pointerLockEnabled!==t){if(this._pointerLockEnabled=t,this._isMobile){this._virtualJoystick?.setActive(t),this._mouseDelta.x=0,this._mouseDelta.y=0;return}this.bindPointerLockClick(),!t&&this._pointerLocked&&document.exitPointerLock(),this._mouseDelta.x=0,this._mouseDelta.y=0}}getMovementVector(){let t=0,e=0;if(this.keys.has("KeyW")&&(t+=1),this.keys.has("KeyS")&&(t-=1),this.keys.has("KeyA")&&(e-=1),this.keys.has("KeyD")&&(e+=1),this._isMobile){const s=this._virtualJoystick?.getMovementVector();s&&(t+=s.forward,e+=s.right)}return t=Math.max(-1,Math.min(1,t)),e=Math.max(-1,Math.min(1,e)),{forward:t,right:e}}getMovementAxis(){return this.getMovementVector()}bindPointerLockClick(){this._isMobile||this._canvas&&(this._canvas.removeEventListener("click",this.requestPointerLock),this._pointerLockEnabled&&this._canvas.addEventListener("click",this.requestPointerLock))}dispose(){window.removeEventListener("keydown",this.onKeyDown),window.removeEventListener("keyup",this.onKeyUp),this._isMobile||(document.removeEventListener("mousemove",this.onMouseMove),document.removeEventListener("pointerlockchange",this.onPointerLockChange)),this._canvas?.removeEventListener("click",this.requestPointerLock),this._touchManager?.dispose(),this._virtualJoystick?.dispose()}}const ut=`varying vec2 vUv;
varying vec3 vNormal;
varying float vHeight;

uniform sampler2D heightMap;
uniform float heightScale;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Sample height from texture (using R channel)
  float height = texture2D(heightMap, uv).r;
  vHeight = height;

  // Displace vertex along normal
  vec3 newPosition = position + normal * height * heightScale;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`,mt=`varying vec2 vUv;
varying vec3 vNormal;
varying float vHeight;

uniform sampler2D diffuseMap;
uniform vec3 color;

void main() {
  vec4 texColor = texture2D(diffuseMap, vUv);
  
  // Simple directional lighting approximation
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float diff = max(dot(vNormal, lightDir), 0.0);
  vec3 lighting = vec3(0.2) + vec3(0.8) * diff; // Ambient + Diffuse

  gl_FragColor = vec4(texColor.rgb * color * lighting, texColor.a);
}
`;class pt extends y{constructor(t){super({vertexShader:ut,fragmentShader:mt,uniforms:{diffuseMap:{value:t.diffuseMap},heightMap:{value:t.heightMap},heightScale:{value:t.heightScale??1},color:{value:t.color??new g(16777215)}},side:R})}get heightScale(){return this.uniforms.heightScale.value}set heightScale(t){this.uniforms.heightScale.value=t}}const ft=`// Atmosphere vertex shader — positions vertices for the atmosphere shell
// and passes world-space data to the fragment shader for scattering calculation.

uniform vec3 sunDirection;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vSunDir;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vSunDir = normalize(sunDirection);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`,gt=`// Atmosphere fragment shader — Rayleigh + Mie scattering
// Based on Sean O'Neil's GPU Gems 2 atmospheric scattering model.

precision highp float;

// Planet / atmosphere geometry
uniform float planetRadius;
uniform float atmosphereRadius;
uniform vec3 planetCenter;

// Scattering coefficients
uniform vec3 rayleighCoeff;   // wavelength-dependent Rayleigh scattering
uniform float mieCoeff;       // Mie scattering coefficient
uniform float rayleighScale;  // Rayleigh scale height
uniform float mieScale;       // Mie scale height
uniform float mieDirection;   // Mie preferred scattering direction (g)
uniform float intensity;      // Sun intensity multiplier

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vSunDir;

const int NUM_SAMPLES = 8;
const int NUM_LIGHT_SAMPLES = 4;
const float PI = 3.14159265359;

// Ray-sphere intersection: returns (near, far) distances, or (-1,-1) on miss
vec2 raySphereIntersect(vec3 origin, vec3 dir, vec3 center, float radius) {
  vec3 oc = origin - center;
  float b = dot(oc, dir);
  float c = dot(oc, oc) - radius * radius;
  float disc = b * b - c;
  if (disc < 0.0) return vec2(-1.0);
  float sq = sqrt(disc);
  return vec2(-b - sq, -b + sq);
}

// Optical depth along a ray segment using numerical integration
float opticalDepth(vec3 origin, vec3 dir, float len, float scaleH) {
  float stepSize = len / float(NUM_LIGHT_SAMPLES);
  float depth = 0.0;
  for (int i = 0; i < NUM_LIGHT_SAMPLES; i++) {
    float t = (float(i) + 0.5) * stepSize;
    vec3 pos = origin + dir * t;
    float altitude = length(pos - planetCenter) - planetRadius;
    depth += exp(-altitude / scaleH) * stepSize;
  }
  return depth;
}

void main() {
  vec3 rayOrigin = cameraPosition;
  vec3 rayDir = normalize(vWorldPosition - cameraPosition);

  // Intersect view ray with atmosphere sphere
  vec2 atmoHit = raySphereIntersect(rayOrigin, rayDir, planetCenter, atmosphereRadius);
  if (atmoHit.y < 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Clip near to 0 (camera may be inside atmosphere)
  float tNear = max(atmoHit.x, 0.0);

  // Check if ray hits the planet — if so, stop at planet surface
  vec2 planetHit = raySphereIntersect(rayOrigin, rayDir, planetCenter, planetRadius);
  float tFar = atmoHit.y;
  if (planetHit.x > 0.0) {
    tFar = min(tFar, planetHit.x);
  }

  float pathLength = tFar - tNear;
  if (pathLength <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float stepSize = pathLength / float(NUM_SAMPLES);

  // Accumulate in-scattering
  vec3 rayleighSum = vec3(0.0);
  vec3 mieSum = vec3(0.0);
  float totalRayleighDepth = 0.0;
  float totalMieDepth = 0.0;

  for (int i = 0; i < NUM_SAMPLES; i++) {
    float t = tNear + (float(i) + 0.5) * stepSize;
    vec3 samplePos = rayOrigin + rayDir * t;
    float altitude = length(samplePos - planetCenter) - planetRadius;

    // Local density at this sample
    float rayleighDensity = exp(-altitude / rayleighScale) * stepSize;
    float mieDensity = exp(-altitude / mieScale) * stepSize;

    totalRayleighDepth += rayleighDensity;
    totalMieDepth += mieDensity;

    // Optical depth from sample point toward the sun
    vec2 sunHit = raySphereIntersect(samplePos, vSunDir, planetCenter, atmosphereRadius);
    float sunPathLen = sunHit.y;

    float sunRayleighDepth = opticalDepth(samplePos, vSunDir, sunPathLen, rayleighScale);
    float sunMieDepth = opticalDepth(samplePos, vSunDir, sunPathLen, mieScale);

    // Total optical depth: camera→sample + sample→sun
    vec3 tau = rayleighCoeff * (totalRayleighDepth + sunRayleighDepth)
             + mieCoeff * (totalMieDepth + sunMieDepth);
    vec3 attenuation = exp(-tau);

    rayleighSum += rayleighDensity * attenuation;
    mieSum += mieDensity * attenuation;
  }

  // Phase functions
  float cosTheta = dot(rayDir, vSunDir);
  float cos2 = cosTheta * cosTheta;

  // Rayleigh phase: (3 / 16π) * (1 + cos²θ)
  float rayleighPhase = 3.0 / (16.0 * PI) * (1.0 + cos2);

  // Mie phase (Henyey-Greenstein): avoids strong forward peak blowout
  float g = mieDirection;
  float g2 = g * g;
  float miePhase = 3.0 / (8.0 * PI) * ((1.0 - g2) * (1.0 + cos2))
                 / (pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5) * (2.0 + g2));

  vec3 color = intensity * (rayleighSum * rayleighCoeff * rayleighPhase
             + mieSum * mieCoeff * miePhase);

  // Tone-map to prevent HDR blowout
  color = 1.0 - exp(-color);

  // Alpha based on scattering strength — transparent where no scattering
  float alpha = clamp(length(color) * 2.0, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`;class yt extends y{constructor(t,e,s){super({vertexShader:ft,fragmentShader:gt,uniforms:{planetRadius:{value:t},atmosphereRadius:{value:e},planetCenter:{value:new h(0,0,0)},sunDirection:{value:new h(0,1,0)},rayleighCoeff:{value:s.rayleighCoeff.clone()},mieCoeff:{value:s.mieCoeff},rayleighScale:{value:s.rayleighScale},mieScale:{value:s.mieScale},mieDirection:{value:s.mieDirection},intensity:{value:s.intensity}},side:k,transparent:!0,depthWrite:!1})}setSunDirection(t){this.uniforms.sunDirection.value.copy(t).normalize()}setPlanetCenter(t){this.uniforms.planetCenter.value.copy(t)}}const E={earth:{rayleighCoeff:new h(.0055,.013,.0224),mieCoeff:.021,rayleighScale:8,mieScale:1.2,mieDirection:.758,intensity:20},mars:{rayleighCoeff:new h(.019918,.01357,.00575),mieCoeff:.036,rayleighScale:11.1,mieScale:2,mieDirection:.63,intensity:12}};class vt{constructor(t,e,s,n){i(this,"mesh");i(this,"shader");const a=t*(1+s.thickness),r=this.resolveParams(s,n);this.shader=new yt(t,a,r);const l=new v(a,e,e);this.mesh=new _(l,this.shader),this.mesh.name=`${n??"planet"}-atmosphere`}setSunDirection(t){this.shader.setSunDirection(t)}setPlanetCenter(t){this.shader.setPlanetCenter(t)}dispose(){this.mesh.geometry.dispose(),this.shader.dispose()}resolveParams(t,e){if(t.scattering){const s=t.scattering;return{rayleighCoeff:new h(s.rayleighCoeff.x,s.rayleighCoeff.y,s.rayleighCoeff.z),mieCoeff:s.mieCoeff,rayleighScale:s.rayleighScale,mieScale:s.mieScale,mieDirection:s.mieDirection,intensity:s.intensity}}return e&&e in E?E[e]:this.paramsFromColor(t.color)}paramsFromColor(t){const e=new g(t);return{rayleighCoeff:new h(e.r*.02,e.g*.02,e.b*.02),mieCoeff:.021,rayleighScale:8,mieScale:1.2,mieDirection:.758,intensity:15}}}const _t="/assets/textures/earth/clouds.jpg",wt="/assets/textures/earth/clouds_alpha.jpg";class Pt{constructor(t,e){i(this,"mesh");i(this,"rotationSpeed",.002);const s=t*1.005,n=new v(s,e,e),a=new b,r=new G({transparent:!0,opacity:.4,depthWrite:!1,side:R});a.load(_t,l=>{l.colorSpace=S,l.anisotropy=8,r.map=l,r.needsUpdate=!0},void 0,()=>{}),a.load(wt,l=>{l.anisotropy=8,r.alphaMap=l,r.needsUpdate=!0},void 0,()=>{}),this.mesh=new _(n,r),this.mesh.name="earth-clouds"}update(t){this.mesh.rotation.y+=this.rotationSpeed*t}dispose(){this.mesh.geometry.dispose();const t=this.mesh.material;t.map?.dispose(),t.alphaMap?.dispose(),t.dispose()}}const Mt="/assets/textures/earth/night.jpg",xt=`
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`,St=`
uniform sampler2D nightMap;
uniform vec3 sunDirection;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vec3 normal = normalize(vNormal);
  float dotNL = dot(normal, sunDirection);

  // 暗面过渡：完全背光时全亮，过渡带平滑衰减
  float nightFactor = smoothstep(-0.1, -0.3, dotNL);

  vec4 nightColor = texture2D(nightMap, vUv);
  gl_FragColor = vec4(nightColor.rgb * nightFactor, nightColor.a * nightFactor);
}
`;class bt{constructor(t,e){i(this,"mesh");const s=t*1.001,n=new v(s,e,e),a=new y({vertexShader:xt,fragmentShader:St,uniforms:{nightMap:{value:null},sunDirection:{value:new h(1,0,0)}},transparent:!0,blending:A,depthWrite:!1});new b().load(Mt,l=>{l.colorSpace=S,l.anisotropy=8,a.uniforms.nightMap.value=l},void 0,()=>{}),this.mesh=new _(n,a),this.mesh.name="earth-nightlights"}setSunDirection(t){this.mesh.material.uniforms.sunDirection.value.copy(t)}dispose(){this.mesh.geometry.dispose();const t=this.mesh.material;t.uniforms.nightMap.value?.dispose(),t.dispose()}}const Dt="/assets/textures/earth/ocean_mask.jpg",Ct=`
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`,Lt=`
uniform sampler2D oceanMask;
uniform vec3 sunDirection;
uniform float fresnelPower;
uniform float fresnelIntensity;
uniform vec3 specularColor;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewDir);

  // 海洋 mask：白色=海洋
  float mask = texture2D(oceanMask, vUv).r;

  // Fresnel 反射
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), fresnelPower);
  fresnel *= fresnelIntensity;

  // 高光：基于太阳方向的 Blinn-Phong
  vec3 halfDir = normalize(sunDirection + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);

  // 仅在光照面显示高光
  float sunFacing = max(dot(normal, sunDirection), 0.0);

  vec3 color = specularColor * (fresnel + spec) * sunFacing * mask;
  float alpha = (fresnel + spec) * sunFacing * mask;

  gl_FragColor = vec4(color, alpha * 0.6);
}
`;class Et{constructor(t,e){i(this,"mesh");const s=t*1.002,n=new v(s,e,e),a=new y({vertexShader:Ct,fragmentShader:Lt,uniforms:{oceanMask:{value:null},sunDirection:{value:new h(1,0,0)},fresnelPower:{value:3},fresnelIntensity:{value:.8},specularColor:{value:new g(.8,.9,1)}},transparent:!0,depthWrite:!1});new b().load(Dt,l=>{l.anisotropy=8,a.uniforms.oceanMask.value=l},void 0,()=>{}),this.mesh=new _(n,a),this.mesh.name="earth-ocean"}setSunDirection(t){this.mesh.material.uniforms.sunDirection.value.copy(t)}dispose(){this.mesh.geometry.dispose();const t=this.mesh.material;t.uniforms.oceanMask.value?.dispose(),t.dispose()}}class Tt{constructor(t,e){i(this,"root");i(this,"clouds");i(this,"nightLights");i(this,"ocean");this.root=new F,this.root.name="earth-effects",this.clouds=new Pt(t,e),this.nightLights=new bt(t,e),this.ocean=new Et(t,e),this.root.add(this.clouds.mesh),this.root.add(this.nightLights.mesh),this.root.add(this.ocean.mesh)}update(t,e){this.clouds.update(t),this.nightLights.setSunDirection(e),this.ocean.setSunDirection(e)}dispose(){this.clouds.dispose(),this.nightLights.dispose(),this.ocean.dispose()}}class kt{constructor(t){i(this,"config");i(this,"root");i(this,"mesh");i(this,"atmosphere");i(this,"earthEffects");i(this,"sunDirection",new h(1,.3,.5).normalize());i(this,"textureLoader",new b);this.config=t,this.root=new F,this.root.name=`${t.name}-root`;const e=new v(t.radius,t.segments,t.segments),s=this.loadTexture(t.textures.diffusePath,!0),n=this.loadTexture(t.textures.heightmapPath,!1);let a;if(n&&t.terrain)a=new pt({diffuseMap:s||new K,heightMap:n,heightScale:t.terrain.heightScale,color:new g(t.textures.fallbackColor)});else{const r=new Y({color:t.textures.fallbackColor,roughness:1,metalness:0});s&&(r.map=s,r.color.set(16777215));const l=this.loadTexture(t.textures.normalPath,!1);l&&(r.normalMap=l,r.normalScale.set(1,1));const c=this.loadTexture(t.textures.roughnessPath,!1);c&&(r.roughnessMap=c),a=r}this.mesh=new _(e,a),this.mesh.name=t.name,this.root.add(this.mesh),t.atmosphere?.enabled&&(this.atmosphere=new vt(t.radius,t.segments,t.atmosphere,t.name),this.root.add(this.atmosphere.mesh)),t.name==="earth"&&(this.earthEffects=new Tt(t.radius,t.segments),this.root.add(this.earthEffects.root))}loadTextures(t){const e=[this.config.textures.diffusePath,this.config.textures.normalPath,this.config.textures.roughnessPath,this.config.textures.heightmapPath].filter(r=>!!r);if(e.length===0)return t?.(100),Promise.resolve();let s=0;const n=e.length,a=e.map(r=>new Promise(l=>{this.textureLoader.load(r,()=>{s++,t?.(Math.round(s/n*100)),l()},void 0,()=>{s++,t?.(Math.round(s/n*100)),l()})}));return Promise.all(a).then(()=>{})}loadTexture(t,e){if(!t)return null;const s=this.textureLoader.load(t);return e&&(s.colorSpace=S),s.anisotropy=8,s}update(t){this.earthEffects?.update(t,this.sunDirection)}dispose(){this.mesh.geometry.dispose(),this.mesh.material.dispose(),this.atmosphere&&this.atmosphere.dispose(),this.earthEffects&&this.earthEffects.dispose()}}const At={earth:{name:"earth",radius:p,gravity:et,segments:128,textures:{diffusePath:"/assets/textures/earth/diffuse.jpg",normalPath:"/assets/textures/earth/normal.jpg",roughnessPath:"/assets/textures/earth/roughness.jpg",heightmapPath:"/assets/textures/earth/heightmap.png",fallbackColor:3108008},atmosphere:{enabled:!0,color:6728447,thickness:.02,opacity:.15},terrain:{heightScale:15,maxLodLevel:15,tileResolution:256},landmarks:[{name:"Mount Everest",lat:27.9881,lng:86.925,description:"Earth highest peak"},{name:"Grand Canyon",lat:36.1069,lng:-112.1129,description:"Colorado Plateau canyon system"}]},mars:{name:"mars",radius:Z,gravity:it,segments:128,textures:{diffusePath:"/assets/textures/mars/diffuse.jpg",normalPath:"/assets/textures/mars/normal.jpg",roughnessPath:"/assets/textures/mars/roughness.jpg",heightmapPath:"/assets/textures/mars/heightmap.png",fallbackColor:11886652},atmosphere:{enabled:!0,color:16757370,thickness:.015,opacity:.08},terrain:{heightScale:10,maxLodLevel:12,tileResolution:256},landmarks:[{name:"Olympus Mons",lat:18.65,lng:-133.8,description:"Largest volcano in the Solar System"},{name:"Valles Marineris",lat:-14.6,lng:-59.3,description:"Massive canyon system near equator"},{name:"Gale Crater",lat:-5.4,lng:137.8,description:"Curiosity rover landing site"},{name:"Jezero Crater",lat:18.38,lng:77.58,description:"Perseverance rover landing site"}]},moon:{name:"moon",radius:tt,gravity:st,segments:128,textures:{diffusePath:"/assets/textures/moon/diffuse.jpg",normalPath:"/assets/textures/moon/normal.jpg",roughnessPath:"/assets/textures/moon/roughness.jpg",heightmapPath:"/assets/textures/moon/heightmap.png",fallbackColor:10132122},atmosphere:{enabled:!1,color:16777215,thickness:0,opacity:0},terrain:{heightScale:8,maxLodLevel:12,tileResolution:256},landmarks:[{name:"Apollo 11 Landing Site",lat:.6741,lng:23.4731,description:"Sea of Tranquility"},{name:"Tycho Crater",lat:-43.31,lng:-11.36,description:"Prominent young impact crater"},{name:"Copernicus Crater",lat:9.62,lng:-20.08,description:"Large ray crater"},{name:"Shackleton Crater",lat:-89.9,lng:0,description:"South pole crater with permanent shadow"}]}};class T{static create(t){const e=At[t];return new kt({...e,textures:{...e.textures},atmosphere:e.atmosphere?{...e.atmosphere}:void 0,terrain:e.terrain?{...e.terrain}:void 0,landmarks:e.landmarks.map(s=>({...s}))})}static createEarth(){return this.create("earth")}static createMars(){return this.create("mars")}static createMoon(){return this.create("moon")}}function Rt(o,t,e){const s=(90-o)*(Math.PI/180),n=(t+180)*(Math.PI/180);return new h(-e*Math.sin(s)*Math.cos(n),e*Math.cos(s),e*Math.sin(s)*Math.sin(n))}function Ft(o,t){const e=o.length()-t,s=o.clone().normalize(),n=90-Math.acos(s.y)*(180/Math.PI),a=Math.atan2(s.z,-s.x)*(180/Math.PI)-180;return{lat:n,lng:(a+540)%360-180,alt:e}}class zt{constructor(){i(this,"root");i(this,"planetLine");i(this,"geoLine");i(this,"worldLine");this.root=document.createElement("div"),this.root.style.position="fixed",this.root.style.top="16px",this.root.style.left="16px",this.root.style.padding="10px 12px",this.root.style.background="rgba(6, 12, 22, 0.55)",this.root.style.border="1px solid rgba(155, 188, 255, 0.35)",this.root.style.borderRadius="8px",this.root.style.fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace",this.root.style.fontSize="12px",this.root.style.lineHeight="1.5",this.root.style.color="#e7f1ff",this.root.style.pointerEvents="none",this.root.style.userSelect="none",this.root.style.minWidth="250px",this.root.style.backdropFilter="blur(4px)",this.root.style.zIndex="10",this.planetLine=document.createElement("div"),this.geoLine=document.createElement("div"),this.worldLine=document.createElement("div"),this.root.append(this.planetLine,this.geoLine,this.worldLine),document.body.appendChild(this.root)}update(t){this.planetLine.textContent=`Planet: ${t.planetName.toUpperCase()}`,this.geoLine.textContent=`Lat: ${t.lat.toFixed(2)}°, Lng: ${t.lng.toFixed(2)}°, Alt: ${t.alt.toFixed(1)} m`,this.worldLine.textContent=`X: ${t.position.x.toFixed(1)}  Y: ${t.position.y.toFixed(1)}  Z: ${t.position.z.toFixed(1)}`}dispose(){this.root.remove()}}class It{constructor(t){i(this,"root");i(this,"buttons");i(this,"onPlanetSelect");this.onPlanetSelect=t.onPlanetSelect,this.root=document.createElement("div"),this.root.style.position="fixed",this.root.style.top="16px",this.root.style.right="16px",this.root.style.display="flex",this.root.style.gap="8px",this.root.style.padding="10px",this.root.style.background="rgba(6, 12, 22, 0.65)",this.root.style.border="1px solid rgba(155, 188, 255, 0.35)",this.root.style.borderRadius="10px",this.root.style.backdropFilter="blur(4px)",this.root.style.zIndex="20",this.buttons={earth:this.createButton("地球","earth"),mars:this.createButton("火星","mars"),moon:this.createButton("月球","moon")},this.root.append(this.buttons.earth,this.buttons.mars,this.buttons.moon),document.body.appendChild(this.root),this.setActive(t.initialPlanet)}setActive(t){Object.keys(this.buttons).forEach(e=>{const s=e===t,n=this.buttons[e];n.style.background=s?"#78b7ff":"rgba(14, 26, 46, 0.9)",n.style.color=s?"#051224":"#d9e8ff",n.style.borderColor=s?"#a8d4ff":"rgba(155, 188, 255, 0.45)"})}dispose(){this.root.remove()}createButton(t,e){const s=document.createElement("button");return s.textContent=t,s.type="button",s.style.padding="6px 10px",s.style.border="1px solid rgba(155, 188, 255, 0.45)",s.style.borderRadius="6px",s.style.fontSize="12px",s.style.fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",s.style.cursor="pointer",s.style.transition="background-color 120ms ease, color 120ms ease, border-color 120ms ease",s.addEventListener("click",()=>{this.onPlanetSelect(e)}),s}}const x={earth:{name:"地球",gravity:9.81,radius:1e3},mars:{name:"火星",gravity:3.72,radius:532},moon:{name:"月球",gravity:1.62,radius:272}};class Ot{constructor(t,e="earth"){i(this,"position");i(this,"velocity");i(this,"quaternion");i(this,"up");i(this,"onGround",!1);i(this,"currentPlanet");i(this,"gravityConfig");this.position=t.clone(),this.velocity=new h,this.quaternion=new w,this.up=new h(0,1,0),this.currentPlanet=e,this.gravityConfig=x[e]??x.earth}getGravityConfig(){return this.gravityConfig}switchPlanet(t,e){this.currentPlanet=t,this.gravityConfig=e??x[t]??x.earth}resetVelocity(){this.velocity.set(0,0,0)}}class Nt{constructor(t,e=8){i(this,"_planetCenter");i(this,"_gravityDir",new h);i(this,"_targetUp",new h);i(this,"_targetQuat",new w);i(this,"alignSpeed");this._planetCenter=t.clone(),this.alignSpeed=e}getGravity(t){const e=t.getGravityConfig();return this._gravityDir.copy(this._planetCenter).sub(t.position).normalize(),this._gravityDir.clone().multiplyScalar(e.gravity)}alignToSurface(t,e){this._targetUp.copy(t.position).sub(this._planetCenter).normalize();const s=new w().setFromUnitVectors(t.up,this._targetUp);this._targetQuat.copy(s).multiply(t.quaternion);const n=Math.min(1,this.alignSpeed*e),a=lt(t.quaternion,this._targetQuat,n);t.quaternion.copy(a),t.up.copy(this._targetUp)}setPlanetCenter(t){this._planetCenter.copy(t)}}class Ut{constructor(t=2){i(this,"raycaster",new $);i(this,"_down",new h);i(this,"playerHeight");this.playerHeight=t}detectGround(t,e,s){this._down.copy(e).sub(t.position).normalize(),this.raycaster.set(t.position,this._down),this.raycaster.far=this.playerHeight*2;const n=this.raycaster.intersectObjects(s,!0);return n.length>0?n[0]:null}resolveGroundCollision(t,e,s){const n=this.detectGround(t,e,s);if(n&&n.distance<this.playerHeight){const a=new h().copy(t.position).sub(e).normalize(),r=this.playerHeight-n.distance;t.position.add(a.multiplyScalar(r));const l=t.velocity.dot(this._down);l>0&&t.velocity.sub(this._down.clone().multiplyScalar(l)),t.onGround=!0}else t.onGround=!1}}class Bt{constructor(t){i(this,"camera");i(this,"eyeHeight",1.6);i(this,"sensitivity",.002);i(this,"_pitch",0);i(this,"_yaw",0);i(this,"_forward",new h);i(this,"_right",new h);i(this,"_eyePos",new h);i(this,"_quatYaw",new w);i(this,"_quatPitch",new w);this.camera=t}applyMouseDelta(t,e){this._yaw-=t*this.sensitivity,this._pitch-=e*this.sensitivity,this._pitch=d(this._pitch,-Math.PI*.47,Math.PI*.47)}getForwardOnSurface(t){this.camera.getWorldDirection(this._forward),this._forward.sub(t.clone().multiplyScalar(this._forward.dot(t)));const e=this._forward.length();return e>1e-6&&this._forward.divideScalar(e),this._forward}getRightOnSurface(t){return this.getForwardOnSurface(t),this._right.crossVectors(this._forward,t).normalize(),this._right}update(t){const e=t.up;this._eyePos.copy(e).multiplyScalar(this.eyeHeight).add(t.position),this.camera.position.copy(this._eyePos),this._quatYaw.setFromAxisAngle(e,this._yaw),this._forward.set(0,0,-1).applyQuaternion(this._quatYaw).applyQuaternion(t.quaternion),this._right.crossVectors(this._forward,e).normalize(),this._quatPitch.setFromAxisAngle(this._right,this._pitch);const s=this._forward.applyQuaternion(this._quatPitch),n=this._eyePos.clone().add(s);this.camera.up.copy(e),this.camera.lookAt(n)}dispose(){}}class Ht{constructor(t){i(this,"state");i(this,"firstPerson");i(this,"enabled",!0);i(this,"input");i(this,"gravity");i(this,"collision");i(this,"surfaceMeshes");i(this,"planetCenter");i(this,"moveSpeed");i(this,"jumpForce");i(this,"friction",.88);i(this,"airDrag",.98);i(this,"_moveDir",new h);i(this,"_forward",new h);i(this,"_right",new h);i(this,"_surfaceDir",new h);i(this,"_worldUp",new h(0,1,0));this.input=t.input,this.planetCenter=t.planetCenter.clone(),this.surfaceMeshes=t.surfaceMeshes,this.moveSpeed=t.moveSpeed??5,this.jumpForce=t.jumpForce??4;const e=new h(0,t.planetRadius+2,0);this.state=new Ot(e,t.planetId??"earth"),this.state.switchPlanet(t.planetId??"earth",{name:t.planetId??"earth",gravity:t.gravity??9.81,radius:t.planetRadius}),this.gravity=new Nt(this.planetCenter),this.collision=new Ut(2),this.firstPerson=new Bt(t.camera)}update(t){if(!this.enabled)return;const e=Math.min(t,.05);this.handleMouseLook(),this.handleMovement(e),this.handleJump(),this.applyGravity(e),this.applyVelocity(e),this.resolveCollision(),this.alignToSurface(e),this.firstPerson.update(this.state)}setEnabled(t){this.enabled=t}syncToCamera(t,e){this._surfaceDir.copy(t).sub(e),this._surfaceDir.lengthSq()<1e-8?this._surfaceDir.set(0,1,0):this._surfaceDir.normalize(),this.state.up.copy(this._surfaceDir),this.state.position.copy(t).addScaledVector(this._surfaceDir,-this.firstPerson.eyeHeight),this.state.quaternion.setFromUnitVectors(this._worldUp,this._surfaceDir),this.state.resetVelocity(),this.state.onGround=!1,this.firstPerson.update(this.state)}handleMouseLook(){const t=this.input.consumeMouseDelta();(t.x!==0||t.y!==0)&&this.firstPerson.applyMouseDelta(t.x,t.y)}handleMovement(t){const e=this.input.getMovementAxis();if(e.forward===0&&e.right===0){this.applyFriction();return}const s=this.state.up;this._forward.copy(this.firstPerson.getForwardOnSurface(s)),this._right.copy(this.firstPerson.getRightOnSurface(s)),this._moveDir.set(0,0,0),this._moveDir.addScaledVector(this._forward,e.forward),this._moveDir.addScaledVector(this._right,e.right);const n=this._moveDir.length();n>1e-6&&this._moveDir.divideScalar(n),this.state.velocity.addScaledVector(this._moveDir,this.moveSpeed*t),this.applyFriction()}handleJump(){this.input.consumeJump()&&this.state.onGround&&(this.state.velocity.addScaledVector(this.state.up,this.jumpForce),this.state.onGround=!1)}applyGravity(t){const e=this.gravity.getGravity(this.state);this.state.velocity.addScaledVector(e,t)}applyVelocity(t){this.state.position.addScaledVector(this.state.velocity,t)}applyFriction(){const t=this.state.up,e=this.state.velocity.dot(t),s=this.state.onGround?this.friction:this.airDrag;this.state.velocity.addScaledVector(t,-e),this.state.velocity.multiplyScalar(s),this.state.velocity.addScaledVector(t,e)}resolveCollision(){this.collision.resolveGroundCollision(this.state,this.planetCenter,this.surfaceMeshes)}alignToSurface(t){this.gravity.alignToSurface(this.state,t)}switchPlanet(t){this.surfaceMeshes=t.surfaceMeshes,this.state.switchPlanet(t.planetId,{name:t.planetId,gravity:t.gravity,radius:t.planetRadius}),this.state.resetVelocity(),this.state.onGround=!1,this._surfaceDir.copy(this.state.position).sub(this.planetCenter),this._surfaceDir.lengthSq()<1e-8?this._surfaceDir.set(0,1,0):this._surfaceDir.normalize(),this.state.position.copy(this._surfaceDir).multiplyScalar(t.planetRadius+2),this.state.up.copy(this._surfaceDir),this.state.quaternion.setFromUnitVectors(this._worldUp,this._surfaceDir)}dispose(){this.firstPerson.dispose()}}class Vt{constructor(t){i(this,"camera");i(this,"domElement");i(this,"enabled",!1);i(this,"rotateSpeed");i(this,"zoomSpeed");i(this,"damping");i(this,"minDistance");i(this,"maxDistance");i(this,"_target",new h);i(this,"_spherical",new X);i(this,"_offset",new h);i(this,"_distance",1);i(this,"_phi",Math.PI*.5);i(this,"_theta",0);i(this,"_targetDistance",1);i(this,"_targetPhi",Math.PI*.5);i(this,"_targetTheta",0);i(this,"_isDragging",!1);i(this,"_lastMouseX",0);i(this,"_lastMouseY",0);i(this,"onMouseDown",t=>{!this.enabled||t.button!==0||(this._isDragging=!0,this._lastMouseX=t.clientX,this._lastMouseY=t.clientY)});i(this,"onMouseMove",t=>{if(!this.enabled||!this._isDragging)return;const e=t.clientX-this._lastMouseX,s=t.clientY-this._lastMouseY;this._lastMouseX=t.clientX,this._lastMouseY=t.clientY,this._targetTheta-=e*this.rotateSpeed,this._targetPhi=d(this._targetPhi+s*this.rotateSpeed,.001,Math.PI-.001)});i(this,"onMouseUp",t=>{t.button===0&&(this._isDragging=!1)});i(this,"onWheel",t=>{if(!this.enabled)return;t.preventDefault();const e=Math.exp(t.deltaY*this.zoomSpeed);this._targetDistance=d(this._targetDistance*e,this.minDistance,this.maxDistance)});this.camera=t.camera,this.domElement=t.domElement,this.rotateSpeed=t.rotateSpeed??.005,this.zoomSpeed=t.zoomSpeed??.0018,this.damping=t.damping??10,this.minDistance=t.minDistance??10,this.maxDistance=t.maxDistance??1e4,this._target.copy(t.target??new h(0,0,0)),this.syncFromCamera(),this.domElement.addEventListener("mousedown",this.onMouseDown),window.addEventListener("mousemove",this.onMouseMove),window.addEventListener("mouseup",this.onMouseUp),this.domElement.addEventListener("wheel",this.onWheel,{passive:!1})}setEnabled(t){this.enabled!==t&&(this.enabled=t,this._isDragging=!1,t&&this.syncFromCamera())}setTarget(t){this._target.copy(t),this.syncFromCamera()}setDistanceLimits(t,e){const s=Math.max(.1,t),n=Math.max(s,e);this.minDistance=s,this.maxDistance=n,this._distance=d(this._distance,s,n),this._targetDistance=d(this._targetDistance,s,n)}syncFromCamera(){this._offset.copy(this.camera.position).sub(this._target),this._offset.lengthSq()<1e-8&&this._offset.set(0,0,1),this._spherical.setFromVector3(this._offset),this._distance=d(this._spherical.radius,this.minDistance,this.maxDistance),this._phi=d(this._spherical.phi,.001,Math.PI-.001),this._theta=this._spherical.theta,this._targetDistance=this._distance,this._targetPhi=this._phi,this._targetTheta=this._theta,this.updateCameraTransform()}update(t){if(!this.enabled)return;const e=1-Math.exp(-this.damping*Math.max(t,0));this._distance+=(this._targetDistance-this._distance)*e,this._phi+=(this._targetPhi-this._phi)*e,this._theta+=(this._targetTheta-this._theta)*e,this._phi=d(this._phi,.001,Math.PI-.001),this.updateCameraTransform()}updateCameraTransform(){this._spherical.radius=this._distance,this._spherical.phi=this._phi,this._spherical.theta=this._theta,this._offset.setFromSpherical(this._spherical),this.camera.position.copy(this._target).add(this._offset),this.camera.up.set(0,1,0),this.camera.lookAt(this._target)}dispose(){this.domElement.removeEventListener("mousedown",this.onMouseDown),window.removeEventListener("mousemove",this.onMouseMove),window.removeEventListener("mouseup",this.onMouseUp),this.domElement.removeEventListener("wheel",this.onWheel)}}class Wt{constructor(t){i(this,"camera");i(this,"_planetCenter",new h);i(this,"_getPlanetRadius");i(this,"_atmosphereScale");i(this,"_surfaceOffset");i(this,"_rafId",0);i(this,"_activeResolve",null);i(this,"_start",new h);i(this,"_atmosphere",new h);i(this,"_surface",new h);i(this,"_normal",new h);i(this,"_tmp",new h);this.camera=t.camera,this._planetCenter.copy(t.planetCenter??new h(0,0,0)),this._getPlanetRadius=t.getPlanetRadius,this._atmosphereScale=t.atmosphereScale??1.02,this._surfaceOffset=t.surfaceOffset??2}async animateToSurface(t,e,s=3e3){this.cancelCurrentAnimation();const n=this._getPlanetRadius(),a=Rt(t,e,n).add(this._planetCenter);if(this._normal.copy(a).sub(this._planetCenter).normalize(),this._surface.copy(this._normal).multiplyScalar(n+this._surfaceOffset).add(this._planetCenter),this._atmosphere.copy(this._normal).multiplyScalar(n*this._atmosphereScale).add(this._planetCenter),this._start.copy(this.camera.position),s<=0){this.camera.position.copy(this._surface),this.camera.lookAt(this._planetCenter);return}await new Promise(r=>{this._activeResolve=r;const l=performance.now(),c=.42,u=f=>{const m=d((f-l)/s,0,1),D=this.easeInOutCubic(m);D<c?this._tmp.lerpVectors(this._start,this._atmosphere,D/c):this._tmp.lerpVectors(this._atmosphere,this._surface,(D-c)/(1-c)),this.camera.position.copy(this._tmp),this.camera.lookAt(this._planetCenter),m<1?this._rafId=requestAnimationFrame(u):(this._rafId=0,this._activeResolve=null,this.camera.position.copy(this._surface),this.camera.lookAt(this._planetCenter),r())};this._rafId=requestAnimationFrame(u)})}easeInOutCubic(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}cancelCurrentAnimation(){if(this._rafId!==0&&(cancelAnimationFrame(this._rafId),this._rafId=0),this._activeResolve){const t=this._activeResolve;this._activeResolve=null,t()}}dispose(){this.cancelCurrentAnimation()}}class jt{constructor(t){i(this,"camera");i(this,"orbitMode");i(this,"transitionController");i(this,"_input");i(this,"_playerController");i(this,"_getPlanetRadius");i(this,"_planetCenter",new h);i(this,"_orbitMinAltitude");i(this,"_orbitMaxDistanceScale");i(this,"_autoEnterFirstPersonAltitude");i(this,"_autoEnterOrbitAltitude");i(this,"_mode","orbit");i(this,"_isTransitioning",!1);this.camera=t.camera,this._input=t.input,this._playerController=t.playerController,this._getPlanetRadius=t.getPlanetRadius,this._planetCenter.copy(t.planetCenter??new h(0,0,0)),this._orbitMinAltitude=t.orbitMinAltitude??3.5,this._orbitMaxDistanceScale=t.orbitMaxDistanceScale??8,this._autoEnterFirstPersonAltitude=t.autoEnterFirstPersonAltitude??4.2,this._autoEnterOrbitAltitude=Math.max(t.autoEnterOrbitAltitude??9,this._autoEnterFirstPersonAltitude+.5),this.orbitMode=new Vt({camera:this.camera,domElement:t.domElement,target:this._planetCenter}),this.transitionController=new Wt({camera:this.camera,planetCenter:this._planetCenter,getPlanetRadius:this._getPlanetRadius,atmosphereScale:1.02,surfaceOffset:2}),this.applyOrbitDistanceLimits(),this.switchTo("orbit")}get mode(){return this._mode}switchTo(t){if(!(this._mode===t&&!this._isTransitioning)){if(t==="orbit"){this._mode="orbit",this._playerController.setEnabled(!1),this._input.setPointerLockEnabled(!1),this.orbitMode.syncFromCamera(),this.orbitMode.setEnabled(!0);return}this._mode="firstPerson",this.orbitMode.setEnabled(!1),this._playerController.syncToCamera(this.camera.position,this._planetCenter),this._playerController.setEnabled(!0),this._input.setPointerLockEnabled(!0)}}update(t){this.applyOrbitDistanceLimits(),!this._isTransitioning&&(this._mode==="orbit"?this.orbitMode.update(t):this._playerController.update(t),this.autoSwitchByAltitude())}async animateToSurface(t,e,s=3e3){this.switchTo("orbit"),this._isTransitioning=!0,this._input.setPointerLockEnabled(!1),this.orbitMode.setEnabled(!1);try{await this.transitionController.animateToSurface(t,e,s),this._playerController.syncToCamera(this.camera.position,this._planetCenter),this.switchTo("firstPerson")}finally{this._isTransitioning=!1}}applyOrbitDistanceLimits(){const t=this._getPlanetRadius();this.orbitMode.setDistanceLimits(t+this._orbitMinAltitude,t*this._orbitMaxDistanceScale)}autoSwitchByAltitude(){const t=this.getCameraAltitude();if(this._mode==="orbit"&&t<=this._autoEnterFirstPersonAltitude){this.switchTo("firstPerson");return}this._mode==="firstPerson"&&t>=this._autoEnterOrbitAltitude&&this.switchTo("orbit")}getCameraAltitude(){return this.camera.position.distanceTo(this._planetCenter)-this._getPlanetRadius()}dispose(){this.orbitMode.dispose(),this.transitionController.dispose()}}class qt{constructor(){i(this,"container");i(this,"fpsElement");i(this,"nodesElement");i(this,"memoryElement");this.container=document.createElement("div"),this.container.style.position="absolute",this.container.style.top="10px",this.container.style.right="10px",this.container.style.backgroundColor="rgba(0, 0, 0, 0.7)",this.container.style.color="#0f0",this.container.style.padding="10px",this.container.style.fontFamily="monospace",this.container.style.fontSize="12px",this.container.style.zIndex="1000",this.container.style.pointerEvents="none",this.container.style.borderRadius="4px",this.fpsElement=document.createElement("div"),this.nodesElement=document.createElement("div"),this.memoryElement=document.createElement("div"),this.container.appendChild(this.fpsElement),this.container.appendChild(this.nodesElement),this.container.appendChild(this.memoryElement),document.body.appendChild(this.container)}update(t){this.fpsElement.textContent=`FPS: ${t.fps}`,this.nodesElement.textContent=`Active Nodes: ${t.activeNodes}`,t.memory!==void 0?this.memoryElement.textContent=`Memory: ${t.memory.toFixed(2)} MB`:this.memoryElement.textContent="Memory: N/A"}dispose(){this.container.parentNode&&this.container.parentNode.removeChild(this.container)}}class Gt{constructor(){i(this,"overlay");i(this,"progressBar");i(this,"progressText");i(this,"styleEl");this.styleEl=document.createElement("style"),this.styleEl.textContent=`
      @keyframes ls-fadeOut {
        from { opacity: 1; }
        to   { opacity: 0; }
      }
    `,document.head.appendChild(this.styleEl),this.overlay=document.createElement("div"),Object.assign(this.overlay.style,{position:"fixed",inset:"0",zIndex:"9999",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#000",fontFamily:"system-ui, sans-serif",color:"#fff",userSelect:"none"});const t=document.createElement("div");Object.assign(t.style,{fontSize:"48px",fontWeight:"700",letterSpacing:"8px",marginBottom:"48px"}),t.textContent="星球漫步";const e=document.createElement("div");Object.assign(e.style,{width:"320px",height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.15)",overflow:"hidden"}),this.progressBar=document.createElement("div"),Object.assign(this.progressBar.style,{width:"0%",height:"100%",background:"#fff",borderRadius:"2px",transition:"width 0.3s ease"}),e.appendChild(this.progressBar),this.progressText=document.createElement("div"),Object.assign(this.progressText.style,{marginTop:"16px",fontSize:"14px",opacity:"0.6"}),this.progressText.textContent="0%",this.overlay.append(t,e,this.progressText),document.body.appendChild(this.overlay)}show(){this.overlay.style.display="flex",this.overlay.style.opacity="1",this.overlay.style.animation="none"}setProgress(t){const e=Math.max(0,Math.min(100,Math.round(t)));this.progressBar.style.width=`${e}%`,this.progressText.textContent=`${e}%`}hide(){return new Promise(t=>{this.overlay.style.animation="ls-fadeOut 0.8s ease forwards",this.overlay.addEventListener("animationend",()=>{this.overlay.style.display="none",t()},{once:!0})})}dispose(){this.overlay.remove(),this.styleEl.remove()}}class Kt{constructor(){i(this,"frames",0);i(this,"prevTime");i(this,"fps",0);i(this,"qualityLevel",1);this.prevTime=performance.now()}update(){this.frames++;const t=performance.now();t>=this.prevTime+1e3&&(this.fps=this.frames*1e3/(t-this.prevTime),this.prevTime=t,this.frames=0,this.adjustQuality())}adjustQuality(){this.fps<30?this.qualityLevel=Math.max(.1,this.qualityLevel-.1):this.fps>55&&(this.qualityLevel=Math.min(1,this.qualityLevel+.1))}getFPS(){return Math.round(this.fps)}getQualityLevel(){return this.qualityLevel}}class Yt{constructor(t){i(this,"engine");i(this,"sceneManager");i(this,"cameraSystem");i(this,"inputManager");i(this,"hud");i(this,"planetSelector");i(this,"playerController");i(this,"cameraManager");i(this,"debugPanel");i(this,"loadingScreen");i(this,"performanceMonitor");i(this,"clock",new J);i(this,"animationId",0);i(this,"currentPlanet","earth");i(this,"planet");i(this,"onResize",()=>{this.engine.resize(),this.cameraSystem.resize()});i(this,"switchPlanet",t=>{if(t===this.currentPlanet)return;const e=T.create(t);this.sceneManager.replacePlanet(e),this.playerController.switchPlanet({planetId:t,planetRadius:e.config.radius,gravity:e.config.gravity,surfaceMeshes:[e.mesh]}),this.currentPlanet=t,this.planetSelector.setActive(t)});this.engine=new Q({canvas:t,antialias:!0,logarithmicDepthBuffer:!0,pixelRatio:Math.min(window.devicePixelRatio,2)});const e=T.create(this.currentPlanet);this.planet=e,this.sceneManager=new rt(e),this.cameraSystem=new ht,this.inputManager=new dt(t),this.hud=new zt,this.planetSelector=new It({initialPlanet:this.currentPlanet,onPlanetSelect:this.switchPlanet}),this.playerController=new Ht({camera:this.cameraSystem.camera,input:this.inputManager,planetCenter:new h(0,0,0),planetId:this.currentPlanet,planetRadius:e.config.radius,gravity:e.config.gravity,surfaceMeshes:[e.mesh]}),this.cameraManager=new jt({camera:this.cameraSystem.camera,domElement:t,input:this.inputManager,playerController:this.playerController,getPlanetRadius:()=>this.sceneManager.planetRadius,planetCenter:new h(0,0,0)}),this.debugPanel=new qt,this.loadingScreen=new Gt,this.performanceMonitor=new Kt,window.addEventListener("resize",this.onResize)}async start(){this.loadingScreen.show(),await this.planet.loadTextures(e=>{this.loadingScreen.setProgress(e)}),await this.loadingScreen.hide(),this.cameraManager.switchTo("orbit"),this.clock.start();const t=()=>{this.animationId=requestAnimationFrame(t);const e=this.clock.getDelta();this.cameraManager.update(e);const s=this.cameraSystem.camera.position,n=Ft(s,this.sceneManager.planetRadius);this.hud.update({planetName:this.sceneManager.planetName,lat:n.lat,lng:n.lng,alt:n.alt,position:s}),this.performanceMonitor.update(),this.engine.render(this.sceneManager.scene,this.cameraSystem.camera),this.debugPanel.update({fps:this.performanceMonitor.getFPS(),activeNodes:0})};t()}dispose(){cancelAnimationFrame(this.animationId),window.removeEventListener("resize",this.onResize),this.cameraManager.dispose(),this.playerController.dispose(),this.inputManager.dispose(),this.hud.dispose(),this.debugPanel.dispose(),this.loadingScreen.dispose(),this.planetSelector.dispose(),this.sceneManager.dispose(),this.engine.dispose()}}const $t=document.getElementById("app"),Xt=new Yt($t);Xt.start();
