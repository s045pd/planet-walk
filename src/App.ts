import { AmbientLight, DirectionalLight } from 'three';

import { Engine } from './core/Engine';
import { Input } from './core/Input';
import type { Mode, Telemetry } from './core/types';
import { Planet, createStarfield } from './planet/Planet';
import { DEFAULT_PLANET_ID, PLANET_CONFIGS, type PlanetConfig } from './planet/PlanetConfigs';
import { OrbitCamera } from './player/OrbitCamera';
import { Player } from './player/Player';
import { SurfaceScene } from './surface/SurfaceScene';
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

    this.surface = new SurfaceScene(this.engine.scene, { size: 900, segments: 192 });
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
    }, 1400);
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
    this.surface.update(delta, this.player.snapshot().position);
    this.hud.update(this.collectTelemetry());
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
      localTime: local,
      mode: 'surface',
      fps: this.engine.stats.fps,
      drawCalls: this.engine.stats.drawCalls,
      memoryMB,
    };
  }
}
