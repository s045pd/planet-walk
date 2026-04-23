import { AmbientLight, DirectionalLight } from 'three';

import { Engine } from './core/Engine';
import { Input } from './core/Input';
import type { Mode, Telemetry } from './core/types';
import { Planet, createStarfield } from './planet/Planet';
import { DEFAULT_PLANET_ID, PLANET_CONFIGS, type PlanetConfig } from './planet/PlanetConfigs';
import { OrbitCamera } from './player/OrbitCamera';
import { Player } from './player/Player';
import { SurfaceScene } from './surface/SurfaceScene';
import type { SampleEntry } from './ui/Phase';
import { HUD } from './ui/HUD';

export class App {
  private engine: Engine;
  private input: Input;
  private hud: HUD;
  private orbit: OrbitCamera;
  private player: Player;
  private planet: Planet;
  private starfield: ReturnType<typeof createStarfield>;
  private sun: DirectionalLight;
  private ambient: AmbientLight;
  private surface: SurfaceScene;

  private mode: Mode = 'orbit';
  private startTime = Date.now();
  private transitioning: 'landing' | 'ascent' | null = null;
  private transitionTimer: number | null = null;
  private transitionDuration = 1.7;
  private transitionElapsed = 0;
  private baseFov = 55;
  private samples: SampleEntry[] = [];
  private sampleCounter = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas);
    this.input = new Input(canvas);

    this.starfield = createStarfield(2400, 22_000);
    this.engine.scene.add(this.starfield);

    this.sun = new DirectionalLight(0xffffff, 1.2);
    this.sun.position.set(1, 0.4, 0.6).normalize().multiplyScalar(5000);
    this.engine.scene.add(this.sun);
    this.ambient = new AmbientLight(0x223344, 0.4);
    this.engine.scene.add(this.ambient);

    const startConfig = PLANET_CONFIGS.find(p => p.id === DEFAULT_PLANET_ID) ?? PLANET_CONFIGS[0];
    this.planet = new Planet(startConfig);
    this.engine.scene.add(this.planet.root);

    this.orbit = new OrbitCamera(this.engine.camera, startConfig.radius);
    this.player = new Player(this.engine.camera, this.input);
    this.player.setConfig(startConfig);

    this.surface = new SurfaceScene(this.engine.scene, {
      chunkSize: 128,
      chunkSegments: 48,
      viewDistance: 3,
    });
    this.engine.scene.add(this.surface.root);
    this.surface.load(startConfig);

    this.hud = new HUD(
      (config) => this.switchPlanet(config),
      () => this.toggleMode(),
    );
    this.hud.setConfig(startConfig);

    this.bindKeys();

    this.engine.register({ update: (delta) => this.update(delta) });
  }

  start(): void {
    this.engine.start();
  }

  private bindKeys(): void {
    this.input.onPress('Tab', () => this.toggleMode());
    this.input.onPress('KeyM', () => {
      if (this.mode === 'surface') this.input.exitPointerLock();
      this.hud.worldSelect.toggle();
    });
    this.input.onPress('Escape', () => {
      this.hud.worldSelect.close();
      if (this.mode === 'surface') this.input.exitPointerLock();
    });
    this.input.onPress('KeyF', () => this.collectSample());
    this.input.onPress('KeyR', () => this.resetSamples());
    const digits = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'] as const;
    digits.forEach((digit, i) => {
      this.input.onPress(digit, () => {
        const config = PLANET_CONFIGS[i];
        if (config) this.switchPlanet(config);
      });
    });
  }

  private toggleMode(): void {
    if (this.transitioning) return;
    if (this.mode === 'orbit') this.startLanding();
    else this.startAscent();
  }

  private startLanding(): void {
    this.transitioning = 'landing';
    this.transitionElapsed = 0;
    this.transitionDuration = 1.7;
    this.hud.setDescent(true, 'DESCENT · ENTRY INTERFACE');
    const site = this.planet.config.landingSite;
    const radius = this.planet.config.radius;
    this.orbit.setDesired({
      azimuth: (site.lon * Math.PI) / 180,
      polar: Math.PI / 2 - (site.lat * Math.PI) / 180,
      distance: radius * 1.18,
    });
    this.transitionTimer = window.setTimeout(() => {
      this.transitioning = null;
      this.hud.setDescent(false);
      this.engine.camera.fov = this.baseFov;
      this.engine.camera.updateProjectionMatrix();
      this.mode = 'surface';
      this.planet.root.visible = false;
      this.starfield.visible = false;
      this.surface.activate();
      this.player.enterSurface(this.surface);
      this.input.requestPointerLock();
    }, 1700);
  }

  private startAscent(): void {
    this.transitioning = 'ascent';
    this.transitionElapsed = 0;
    this.transitionDuration = 1.4;
    this.hud.setDescent(true, 'ASCENT · ORBIT INSERTION');
    this.input.exitPointerLock();
    this.mode = 'orbit';
    this.planet.root.visible = true;
    this.starfield.visible = true;
    this.surface.deactivate();
    this.player.exitSurface();
    const radius = this.planet.config.radius;
    this.orbit.setDesired({
      azimuth: (this.planet.config.landingSite.lon * Math.PI) / 180,
      polar: Math.PI / 2 - (this.planet.config.landingSite.lat * Math.PI) / 180,
      distance: radius * 3,
    });
    this.transitionTimer = window.setTimeout(() => {
      this.transitioning = null;
      this.hud.setDescent(false);
      this.engine.camera.fov = this.baseFov;
      this.engine.camera.updateProjectionMatrix();
    }, 1400);
  }

  private collectSample(): void {
    if (this.mode !== 'surface' || this.transitioning) return;
    const snap = this.player.snapshot();
    const biome = this.surface.getBiomeAt(snap.position.x, snap.position.z);
    const altitude = Math.round(snap.position.y * 10) / 10;
    this.sampleCounter += 1;
    const id = this.sampleCounter;
    const biomeTitle = biome.charAt(0).toUpperCase() + biome.slice(1);
    this.samples.push({
      id,
      label: `${biomeTitle} sample`,
      detail: `+${altitude} m · hdg ${snap.heading.toFixed(0)}°`,
    });
    this.hud.phase.setSamples(this.samples);
    this.hud.phase.pulse();
  }

  private resetSamples(): void {
    if (this.samples.length === 0) return;
    this.samples = [];
    this.sampleCounter = 0;
    this.hud.phase.setSamples(this.samples);
  }

  private switchPlanet(config: PlanetConfig): void {
    if (config.id === this.planet.config.id) return;
    if (this.transitionTimer !== null) {
      window.clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
    this.transitioning = null;
    this.hud.setDescent(false);
    this.mode = 'orbit';
    this.input.exitPointerLock();
    this.surface.deactivate();
    this.engine.scene.remove(this.planet.root);
    this.planet.dispose();
    this.planet = new Planet(config);
    this.engine.scene.add(this.planet.root);
    this.planet.root.visible = true;
    this.starfield.visible = true;
    this.orbit.reconfigure(config.radius);
    this.player.setConfig(config);
    this.surface.load(config);
    this.hud.setConfig(config);
  }

  private update(delta: number): void {
    if (this.planet.root.visible) this.planet.update(delta);
    if (this.mode === 'orbit' || this.transitioning) {
      this.orbit.update(delta);
    } else {
      this.player.update(delta);
    }
    if (this.transitioning) this.updateCinematic(delta);

    const snap = this.player.snapshot();
    this.surface.update(delta, {
      position: snap.position,
      walking: snap.walking,
      sprinting: snap.sprinting,
    });
    const telemetry = this.collectTelemetry();
    this.hud.update(telemetry);
    this.hud.updateMinimap(
      telemetry,
      this.surface,
      performance.now() / 1000,
      snap.position.x,
      snap.position.z,
      snap.heading,
    );
  }

  private updateCinematic(delta: number): void {
    this.transitionElapsed = Math.min(this.transitionDuration, this.transitionElapsed + delta);
    const t = this.transitionElapsed / this.transitionDuration;
    const ease = Math.sin(t * Math.PI);
    const fovDelta = this.transitioning === 'landing' ? -11 : 6;
    this.engine.camera.fov = this.baseFov + ease * fovDelta;
    this.engine.camera.updateProjectionMatrix();

    if (this.transitioning === 'landing') {
      const intensity = ease * 0.6;
      this.engine.camera.position.x += (Math.random() - 0.5) * intensity;
      this.engine.camera.position.y += (Math.random() - 0.5) * intensity;
    }
  }

  private collectTelemetry(): Telemetry {
    const config = this.planet.config;
    const snap = this.player.snapshot();
    const orbitState = this.orbit.getState();
    const elapsed = (Date.now() - this.startTime) / 1000;
    const solSeconds = elapsed % config.rotationPeriod;
    const hours = Math.floor(solSeconds / 3600) % 24;
    const minutes = Math.floor((solSeconds % 3600) / 60);
    const local = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const sol = Math.floor(elapsed / Math.max(config.rotationPeriod, 1)) + 47;

    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    const memoryMB = memory ? memory.usedJSHeapSize / (1024 * 1024) : 0;

    const dayInfo = this.surface.getDayInfo();
    const surfaceLocal = this.mode === 'surface' ? `${dayInfo.localTime} ${dayInfo.phaseLabel}` : local;

    if (this.mode === 'orbit') {
      return {
        worldId: config.id,
        worldName: config.name,
        lat: config.landingSite.lat,
        lon: config.landingSite.lon,
        altitude: orbitState.distance - config.radius,
        velocity: 0,
        gravity: config.gravity,
        heading: 0,
        pitch: 0,
        roll: 0,
        sol,
        localTime: local,
        mode: 'orbit',
        fps: this.engine.stats.fps,
        drawCalls: this.engine.stats.drawCalls,
        memoryMB,
      };
    }

    return {
      worldId: config.id,
      worldName: config.name,
      lat: snap.lat,
      lon: snap.lon,
      altitude: snap.altitude,
      velocity: snap.speed,
      gravity: config.gravity,
      heading: snap.heading,
      pitch: snap.pitch,
      roll: snap.roll,
      sol,
      localTime: surfaceLocal,
      mode: 'surface',
      fps: this.engine.stats.fps,
      drawCalls: this.engine.stats.drawCalls,
      memoryMB,
    };
  }
}
