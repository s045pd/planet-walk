import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import type { WeatherConfig, WeatherType } from '../planet/PlanetConfig';
import { createWeatherEffect } from './WeatherEffects';
import type { IWeatherEffect } from './WeatherEffects';

/** 天气系统配置 */
export interface WeatherSystemConfig {
  scene: THREE.Scene;
  planetRadius: number;
  weather?: WeatherConfig;
}

/**
 * 天气系统主控制器
 * - 管理天气效果的生命周期
 * - 自动随时间切换天气
 * - 支持手动切换天气
 */
export class WeatherSystem implements IDisposable {
  private scene: THREE.Scene;
  private planetRadius: number;
  private config: WeatherConfig | null;

  private currentWeather: WeatherType | null = null;
  private currentEffect: IWeatherEffect | null = null;
  private timer = 0;
  private changeInterval: number;

  constructor(config: WeatherSystemConfig) {
    this.scene = config.scene;
    this.planetRadius = config.planetRadius;
    this.config = config.weather ?? null;
    this.changeInterval = config.weather?.changeInterval ?? 120;

    // 设置默认天气
    if (this.config) {
      this.setWeather(this.config.defaultWeather);
    }
  }

  /** 获取当前天气类型 */
  get weather(): WeatherType | null {
    return this.currentWeather;
  }

  /** 手动切换天气 */
  setWeather(type: WeatherType): void {
    if (type === this.currentWeather) return;

    // 清理旧效果
    if (this.currentEffect) {
      this.currentEffect.detach(this.scene);
      this.currentEffect.dispose();
      this.currentEffect = null;
    }

    this.currentWeather = type;
    this.currentEffect = createWeatherEffect(type, this.planetRadius);
    this.currentEffect.attach(this.scene);
    this.timer = 0;
  }

  /** 切换星球时重新配置天气系统 */
  switchPlanet(scene: THREE.Scene, planetRadius: number, weather?: WeatherConfig): void {
    // 清理旧效果
    if (this.currentEffect) {
      this.currentEffect.detach(this.scene);
      this.currentEffect.dispose();
      this.currentEffect = null;
      this.currentWeather = null;
    }

    this.scene = scene;
    this.planetRadius = planetRadius;
    this.config = weather ?? null;
    this.changeInterval = weather?.changeInterval ?? 120;
    this.timer = 0;

    if (this.config) {
      this.setWeather(this.config.defaultWeather);
    }
  }

  /** 每帧更新天气效果 */
  update(delta: number, cameraPosition: THREE.Vector3): void {
    if (!this.config || !this.currentEffect) return;

    this.currentEffect.update(delta, cameraPosition);

    this.timer += delta;
    if (this.timer >= this.changeInterval && this.config.types.length > 1) {
      const available = this.config.types.filter((t) => t !== this.currentWeather);
      if (available.length > 0) {
        const next = available[Math.floor(Math.random() * available.length)];
        this.setWeather(next);
      }
    }
  }

  dispose(): void {
    if (this.currentEffect) {
      this.currentEffect.detach(this.scene);
      this.currentEffect.dispose();
      this.currentEffect = null;
    }
    this.currentWeather = null;
  }
}
