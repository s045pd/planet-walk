import type { IDisposable } from './types';

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

export type TouchPhase = 'start' | 'move' | 'end';

export interface NormalizedTouchEvent {
  phase: TouchPhase;
  touches: TouchPoint[];
  changedTouches: TouchPoint[];
  center: { x: number; y: number } | null;
  singleDragDelta: { x: number; y: number };
  pinchScaleDelta: number;
  originalEvent: TouchEvent;
}

export type TouchEventListener = (event: NormalizedTouchEvent) => void;

export interface TouchManagerConfig {
  element: HTMLElement;
  preventDefault?: boolean;
}

/** 触控事件标准化：单指拖拽 + 双指缩放 */
export class TouchManager implements IDisposable {
  readonly element: HTMLElement;
  enabled = true;

  private readonly listeners = new Set<TouchEventListener>();
  private readonly preventDefault: boolean;
  private readonly previousTouchAction: string;

  private lastSinglePoint: TouchPoint | null = null;
  private lastPinchDistance: number | null = null;

  constructor(config: TouchManagerConfig) {
    this.element = config.element;
    this.preventDefault = config.preventDefault ?? true;
    this.previousTouchAction = this.element.style.touchAction;

    if (this.preventDefault) {
      this.element.style.touchAction = 'none';
    }

    this.element.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.onTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
  }

  static isMobile(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    if (navigator.maxTouchPoints > 0) {
      return true;
    }

    if ('ontouchstart' in window) {
      return true;
    }

    return window.matchMedia?.('(pointer: coarse)').matches ?? false;
  }

  addListener(listener: TouchEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private onTouchStart = (event: TouchEvent): void => {
    this.handleNativeTouchEvent('start', event);
  };

  private onTouchMove = (event: TouchEvent): void => {
    this.handleNativeTouchEvent('move', event);
  };

  private onTouchEnd = (event: TouchEvent): void => {
    this.handleNativeTouchEvent('end', event);
  };

  private handleNativeTouchEvent(phase: TouchPhase, event: TouchEvent): void {
    if (!this.enabled) {
      return;
    }

    if (this.preventDefault && event.cancelable) {
      event.preventDefault();
    }

    const touches = this.normalizeTouchList(event.touches);
    const changedTouches = this.normalizeTouchList(event.changedTouches);
    const singleDragDelta = { x: 0, y: 0 };
    let pinchScaleDelta = 1;

    if (phase === 'move') {
      if (touches.length === 1 && this.lastSinglePoint && touches[0].id === this.lastSinglePoint.id) {
        singleDragDelta.x = touches[0].x - this.lastSinglePoint.x;
        singleDragDelta.y = touches[0].y - this.lastSinglePoint.y;
      }

      if (touches.length >= 2 && this.lastPinchDistance !== null) {
        const currentDistance = this.getDistance(touches[0], touches[1]);
        if (this.lastPinchDistance > 1e-6) {
          pinchScaleDelta = currentDistance / this.lastPinchDistance;
        }
      }
    }

    const normalizedEvent: NormalizedTouchEvent = {
      phase,
      touches,
      changedTouches,
      center: this.getCenter(touches),
      singleDragDelta,
      pinchScaleDelta,
      originalEvent: event,
    };

    this.listeners.forEach((listener) => {
      listener(normalizedEvent);
    });

    this.updateTrackingState(touches);
  }

  private normalizeTouchList(list: TouchList): TouchPoint[] {
    const points: TouchPoint[] = [];
    for (let index = 0; index < list.length; index += 1) {
      const touch = list.item(index);
      if (!touch) {
        continue;
      }
      points.push({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
      });
    }
    points.sort((a, b) => a.id - b.id);
    return points;
  }

  private getCenter(points: TouchPoint[]): { x: number; y: number } | null {
    if (points.length === 0) {
      return null;
    }
    let x = 0;
    let y = 0;
    points.forEach((point) => {
      x += point.x;
      y += point.y;
    });
    return {
      x: x / points.length,
      y: y / points.length,
    };
  }

  private getDistance(a: TouchPoint, b: TouchPoint): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  private updateTrackingState(touches: TouchPoint[]): void {
    if (touches.length === 1) {
      this.lastSinglePoint = { ...touches[0] };
      this.lastPinchDistance = null;
      return;
    }

    if (touches.length >= 2) {
      this.lastSinglePoint = null;
      this.lastPinchDistance = this.getDistance(touches[0], touches[1]);
      return;
    }

    this.lastSinglePoint = null;
    this.lastPinchDistance = null;
  }

  dispose(): void {
    this.listeners.clear();
    this.element.removeEventListener('touchstart', this.onTouchStart);
    this.element.removeEventListener('touchmove', this.onTouchMove);
    this.element.removeEventListener('touchend', this.onTouchEnd);
    this.element.removeEventListener('touchcancel', this.onTouchEnd);
    this.element.style.touchAction = this.previousTouchAction;
  }
}
