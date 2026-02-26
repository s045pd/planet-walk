import * as THREE from 'three';

export type TimeScale = 0 | 1 | 10 | 100;

interface DayNightCycleOptions {
  planetRadius: number;
  sunLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  skyboxMaterial: THREE.ShaderMaterial;
  starsMaterial: THREE.ShaderMaterial;
  onSunDirectionChange: (dir: THREE.Vector3) => void;
  onAtmosphereUpdate?: (daylight: number, twilight: number) => void;
  initialTimeHours?: number;
  baseDayDurationSeconds?: number;
}

const HOURS_PER_DAY = 24;
const TIME_SCALE_STEPS: TimeScale[] = [1, 10, 100, 0];

/**
 * 日夜循环系统：管理时间流逝、太阳方向、环境光和天空表现。
 */
export class DayNightCycle {
  private readonly sunLight: THREE.DirectionalLight;
  private readonly ambientLight: THREE.AmbientLight;
  private readonly skyboxMaterial: THREE.ShaderMaterial;
  private readonly starsMaterial: THREE.ShaderMaterial;
  private readonly onSunDirectionChange: (dir: THREE.Vector3) => void;
  private readonly onAtmosphereUpdate?: (daylight: number, twilight: number) => void;

  private readonly skyboxUniforms: Record<string, THREE.IUniform<unknown>>;
  private readonly starsUniforms: Record<string, THREE.IUniform<unknown>>;

  private readonly sunDirection = new THREE.Vector3(1, 0, 0);
  private readonly observerUp = new THREE.Vector3(0, 0, 1);
  private readonly orbitAxis = new THREE.Vector3(0, 0, 1);

  private readonly dayTopColor = new THREE.Color(0x67b4ff);
  private readonly dayBottomColor = new THREE.Color(0xd7ecff);
  private readonly twilightTopColor = new THREE.Color(0xff8f57);
  private readonly twilightBottomColor = new THREE.Color(0xffc892);
  private readonly nightTopColor = new THREE.Color(0x0b1432);
  private readonly nightBottomColor = new THREE.Color(0x050916);

  private readonly sunDayColor = new THREE.Color(0xfff6dd);
  private readonly sunTwilightColor = new THREE.Color(0xffa86f);
  private readonly sunNightColor = new THREE.Color(0x7f8fb0);

  private readonly ambientDayColor = new THREE.Color(0xb9d2ff);
  private readonly ambientTwilightColor = new THREE.Color(0x8f7898);
  private readonly ambientNightColor = new THREE.Color(0x2a3750);

  private readonly scratchColor = new THREE.Color();

  private planetRadius: number;
  private readonly axialTiltRad: number;
  private readonly simHoursPerSecond: number;
  private observerDistance = 0;

  private utcTimeHours: number;
  private timeScaleIndex = 0;
  private subsolarLongitude = 0;

  constructor(options: DayNightCycleOptions) {
    this.planetRadius = options.planetRadius;
    this.sunLight = options.sunLight;
    this.ambientLight = options.ambientLight;
    this.skyboxMaterial = options.skyboxMaterial;
    this.starsMaterial = options.starsMaterial;
    this.onSunDirectionChange = options.onSunDirectionChange;
    this.onAtmosphereUpdate = options.onAtmosphereUpdate;

    this.skyboxUniforms = this.skyboxMaterial.uniforms as Record<string, THREE.IUniform<unknown>>;
    this.starsUniforms = this.starsMaterial.uniforms as Record<string, THREE.IUniform<unknown>>;

    this.axialTiltRad = THREE.MathUtils.degToRad(23.5);
    const baseDayDurationSeconds = options.baseDayDurationSeconds ?? 600;
    this.simHoursPerSecond = HOURS_PER_DAY / Math.max(baseDayDurationSeconds, 1);
    // Align default local noon with the startup orbit camera (camera starts on +Z).
    this.utcTimeHours = this.normalizeHours(options.initialTimeHours ?? 18.0);

    this.updateSunDirection();
    this.applyEnvironment(new THREE.Vector3(0, 0, 1));
    this.onSunDirectionChange(this.sunDirection);
  }

  setPlanetRadius(radius: number): void {
    this.planetRadius = radius;
    this.updateSunDirection();
  }

  getTimeScale(): TimeScale {
    return TIME_SCALE_STEPS[this.timeScaleIndex];
  }

  getTimeScaleLabel(): string {
    const scale = this.getTimeScale();
    return scale === 0 ? 'Paused' : `${scale}x`;
  }

  cycleTimeScale(): TimeScale {
    this.timeScaleIndex = (this.timeScaleIndex + 1) % TIME_SCALE_STEPS.length;
    return this.getTimeScale();
  }

  update(delta: number, observerPosition: THREE.Vector3): void {
    const scale = this.getTimeScale();
    if (scale > 0) {
      const advancedHours = delta * this.simHoursPerSecond * scale;
      this.utcTimeHours = this.normalizeHours(this.utcTimeHours + advancedHours);
    }

    this.updateSunDirection();
    this.applyEnvironment(observerPosition);
    this.onSunDirectionChange(this.sunDirection);
  }

  getLocalTimeHours(longitude: number): number {
    return this.normalizeHours(12 + (longitude - this.subsolarLongitude) / 15);
  }

  getLocalTimeString(longitude: number): string {
    return this.formatHours(this.getLocalTimeHours(longitude));
  }

  private updateSunDirection(): void {
    const theta = ((this.utcTimeHours - 12) / HOURS_PER_DAY) * Math.PI * 2;
    this.sunDirection.set(Math.cos(theta), 0, Math.sin(theta));
    this.sunDirection.applyAxisAngle(this.orbitAxis, this.axialTiltRad).normalize();

    const distance = this.planetRadius * 60;
    this.sunLight.position.copy(this.sunDirection).multiplyScalar(distance);
    this.sunLight.target.position.set(0, 0, 0);

    const longitude = Math.atan2(this.sunDirection.z, -this.sunDirection.x) * THREE.MathUtils.RAD2DEG - 180;
    this.subsolarLongitude = this.normalizeLongitude(longitude);
  }

  private applyEnvironment(observerPosition: THREE.Vector3): void {
    if (observerPosition.lengthSq() > 1e-6) {
      this.observerUp.copy(observerPosition).normalize();
      this.observerDistance = observerPosition.length();
    }

    const sunDot = this.observerUp.dot(this.sunDirection);
    const daylight = THREE.MathUtils.smoothstep(sunDot, -0.16, 0.22);
    const twilight = 1 - THREE.MathUtils.smoothstep(Math.abs(sunDot), 0.04, 0.55);
    const warmTwilight = twilight * (1 - daylight * 0.55);

    this.sunLight.intensity = THREE.MathUtils.lerp(0.08, 2.2, daylight) + warmTwilight * 0.35;
    this.scratchColor.copy(this.sunNightColor)
      .lerp(this.sunTwilightColor, warmTwilight)
      .lerp(this.sunDayColor, daylight);
    this.sunLight.color.copy(this.scratchColor);

    this.ambientLight.intensity = THREE.MathUtils.lerp(0.14, 0.42, daylight) + warmTwilight * 0.08;
    this.scratchColor.copy(this.ambientNightColor)
      .lerp(this.ambientTwilightColor, warmTwilight)
      .lerp(this.ambientDayColor, daylight);
    this.ambientLight.color.copy(this.scratchColor);

    this.updateSkybox(daylight, warmTwilight);
    this.updateStars(daylight, warmTwilight);

    this.onAtmosphereUpdate?.(daylight, warmTwilight);
  }

  private updateSkybox(daylight: number, twilight: number): void {
    const top = this.skyboxUniforms.topColor?.value;
    if (top instanceof THREE.Color) {
      top.copy(this.nightTopColor)
        .lerp(this.twilightTopColor, twilight)
        .lerp(this.dayTopColor, daylight);
    }

    const bottom = this.skyboxUniforms.bottomColor?.value;
    if (bottom instanceof THREE.Color) {
      bottom.copy(this.nightBottomColor)
        .lerp(this.twilightBottomColor, twilight)
        .lerp(this.dayBottomColor, daylight);
    }

    // skybox 只在地表附近可见（相机靠近星球时），轨道模式下完全透明
    const altitudeFactor = this.getAltitudeFactor();
    const brightnessUniform = this.skyboxUniforms.brightness;
    if (brightnessUniform) {
      const baseBrightness = THREE.MathUtils.lerp(0.0, 1.0, daylight) + twilight * 0.22;
      brightnessUniform.value = baseBrightness * altitudeFactor;
    }
  }

  /** skybox 只在地表附近可见，轨道高度时淡出到0 */
  private getAltitudeFactor(): number {
    if (this.observerDistance <= 0) return 0;
    const surfaceAlt = this.observerDistance / this.planetRadius;
    // 1.0 = 地表，1.5 = 开始淡出，3.0 = 完全消失
    return 1 - THREE.MathUtils.smoothstep(surfaceAlt, 1.5, 3.0);
  }

  private updateStars(daylight: number, twilight: number): void {
    const visibilityUniform = this.starsUniforms.visibility;
    if (!visibilityUniform) return;

    const visibility = THREE.MathUtils.clamp(1.15 - daylight * 0.98 + twilight * 0.22, 0.12, 1.25);
    visibilityUniform.value = visibility;
  }

  private formatHours(hours: number): string {
    const wrapped = this.normalizeHours(hours);
    const h = Math.floor(wrapped);
    const mFloat = (wrapped - h) * 60;
    const m = Math.floor(mFloat);
    const s = Math.floor((mFloat - m) * 60);
    return `${this.pad2(h)}:${this.pad2(m)}:${this.pad2(s)}`;
  }

  private normalizeHours(hours: number): number {
    const wrapped = hours % HOURS_PER_DAY;
    return wrapped < 0 ? wrapped + HOURS_PER_DAY : wrapped;
  }

  private normalizeLongitude(longitude: number): number {
    return ((longitude + 540) % 360) - 180;
  }

  private pad2(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
