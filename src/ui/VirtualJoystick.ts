import type { IDisposable } from '../core/types';
import { TouchManager } from '../core/TouchManager';
import { clamp } from '../utils/math';

export interface MovementVector {
  forward: number;
  right: number;
}

export interface LookDelta {
  x: number;
  y: number;
}

/** 移动端虚拟摇杆：左侧移动，右侧视角 */
export class VirtualJoystick implements IDisposable {
  private readonly isMobileDevice: boolean;
  private readonly root: HTMLDivElement | null;
  private readonly leftPad: HTMLDivElement | null;
  private readonly leftBase: HTMLDivElement | null;
  private readonly leftKnob: HTMLDivElement | null;
  private readonly rightPad: HTMLDivElement | null;

  private active = false;

  private readonly movement: MovementVector = { forward: 0, right: 0 };
  private readonly lookDelta: LookDelta = { x: 0, y: 0 };

  private leftTouchId: number | null = null;
  private rightTouchId: number | null = null;
  private rightLastPoint: { x: number; y: number } | null = null;

  private leftCenter = { x: 0, y: 0 };
  private leftRadius = 1;

  constructor() {
    this.isMobileDevice = TouchManager.isMobile();
    if (!this.isMobileDevice) {
      this.root = null;
      this.leftPad = null;
      this.leftBase = null;
      this.leftKnob = null;
      this.rightPad = null;
      return;
    }

    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.inset = '0';
    this.root.style.zIndex = '30';
    this.root.style.pointerEvents = 'none';
    this.root.style.userSelect = 'none';

    this.leftPad = document.createElement('div');
    this.leftPad.style.position = 'absolute';
    this.leftPad.style.left = '20px';
    this.leftPad.style.bottom = '22px';
    this.leftPad.style.width = '42vw';
    this.leftPad.style.height = '42vw';
    this.leftPad.style.maxWidth = '190px';
    this.leftPad.style.maxHeight = '190px';
    this.leftPad.style.minWidth = '128px';
    this.leftPad.style.minHeight = '128px';
    this.leftPad.style.display = 'flex';
    this.leftPad.style.alignItems = 'center';
    this.leftPad.style.justifyContent = 'center';
    this.leftPad.style.pointerEvents = 'auto';
    this.leftPad.style.touchAction = 'none';

    this.leftBase = document.createElement('div');
    this.leftBase.style.position = 'relative';
    this.leftBase.style.width = '72%';
    this.leftBase.style.height = '72%';
    this.leftBase.style.borderRadius = '999px';
    this.leftBase.style.border = '2px solid rgba(175, 213, 255, 0.45)';
    this.leftBase.style.background =
      'radial-gradient(circle at 35% 30%, rgba(180, 220, 255, 0.28), rgba(10, 22, 40, 0.4) 72%)';
    this.leftBase.style.boxShadow = 'inset 0 0 24px rgba(90, 155, 220, 0.38)';

    this.leftKnob = document.createElement('div');
    this.leftKnob.style.position = 'absolute';
    this.leftKnob.style.left = '50%';
    this.leftKnob.style.top = '50%';
    this.leftKnob.style.width = '42%';
    this.leftKnob.style.height = '42%';
    this.leftKnob.style.borderRadius = '999px';
    this.leftKnob.style.border = '2px solid rgba(220, 242, 255, 0.7)';
    this.leftKnob.style.background =
      'radial-gradient(circle at 35% 35%, rgba(230, 248, 255, 0.9), rgba(125, 175, 235, 0.56))';
    this.leftKnob.style.boxShadow = '0 0 18px rgba(120, 178, 245, 0.48)';
    this.leftKnob.style.transform = 'translate(-50%, -50%)';

    this.rightPad = document.createElement('div');
    this.rightPad.style.position = 'absolute';
    this.rightPad.style.top = '0';
    this.rightPad.style.right = '0';
    this.rightPad.style.width = '50vw';
    this.rightPad.style.height = '100%';
    this.rightPad.style.pointerEvents = 'auto';
    this.rightPad.style.touchAction = 'none';
    this.rightPad.style.background =
      'linear-gradient(90deg, rgba(15, 25, 40, 0), rgba(95, 165, 235, 0.08) 42%, rgba(125, 190, 245, 0.15) 100%)';
    this.rightPad.style.borderLeft = '1px solid rgba(145, 198, 255, 0.2)';

    const rightHint = document.createElement('div');
    rightHint.style.position = 'absolute';
    rightHint.style.right = '22px';
    rightHint.style.bottom = '30px';
    rightHint.style.width = '60px';
    rightHint.style.height = '60px';
    rightHint.style.borderRadius = '999px';
    rightHint.style.border = '1px dashed rgba(170, 214, 255, 0.36)';
    rightHint.style.background = 'rgba(95, 158, 230, 0.1)';
    rightHint.style.pointerEvents = 'none';

    this.leftBase.appendChild(this.leftKnob);
    this.leftPad.appendChild(this.leftBase);
    this.root.append(this.leftPad, this.rightPad, rightHint);
    document.body.appendChild(this.root);

    this.leftPad.addEventListener('touchstart', this.onLeftTouchStart, { passive: false });
    this.rightPad.addEventListener('touchstart', this.onRightTouchStart, { passive: false });
    window.addEventListener('touchmove', this.onWindowTouchMove, { passive: false });
    window.addEventListener('touchend', this.onWindowTouchEnd, { passive: false });
    window.addEventListener('touchcancel', this.onWindowTouchEnd, { passive: false });
    window.addEventListener('resize', this.onResize);

    this.onResize();
    this.setActive(false);
  }

  setActive(active: boolean): void {
    if (!this.isMobileDevice || !this.root) {
      return;
    }
    if (this.active === active) {
      return;
    }
    this.active = active;
    this.root.style.display = active ? 'block' : 'none';
    if (!active) {
      this.resetState();
    }
  }

  getMovementVector(): MovementVector {
    return {
      forward: this.movement.forward,
      right: this.movement.right,
    };
  }

  consumeLookDelta(): LookDelta {
    const delta = {
      x: this.lookDelta.x,
      y: this.lookDelta.y,
    };
    this.lookDelta.x = 0;
    this.lookDelta.y = 0;
    return delta;
  }

  private onResize = (): void => {
    if (!this.leftBase) {
      return;
    }
    const rect = this.leftBase.getBoundingClientRect();
    this.leftCenter.x = rect.left + rect.width * 0.5;
    this.leftCenter.y = rect.top + rect.height * 0.5;
    this.leftRadius = Math.max(24, rect.width * 0.36);
  };

  private onLeftTouchStart = (event: TouchEvent): void => {
    if (!this.active || this.leftTouchId !== null) {
      return;
    }
    const touch = event.changedTouches.item(0);
    if (!touch) {
      return;
    }
    this.leftTouchId = touch.identifier;
    this.updateLeftMovement(touch.clientX, touch.clientY);
    if (event.cancelable) {
      event.preventDefault();
    }
  };

  private onRightTouchStart = (event: TouchEvent): void => {
    if (!this.active || this.rightTouchId !== null) {
      return;
    }
    const touch = event.changedTouches.item(0);
    if (!touch) {
      return;
    }
    this.rightTouchId = touch.identifier;
    this.rightLastPoint = { x: touch.clientX, y: touch.clientY };
    if (event.cancelable) {
      event.preventDefault();
    }
  };

  private onWindowTouchMove = (event: TouchEvent): void => {
    if (!this.active) {
      return;
    }

    let handled = false;
    for (let index = 0; index < event.changedTouches.length; index += 1) {
      const touch = event.changedTouches.item(index);
      if (!touch) {
        continue;
      }

      if (touch.identifier === this.leftTouchId) {
        handled = true;
        this.updateLeftMovement(touch.clientX, touch.clientY);
      }

      if (touch.identifier === this.rightTouchId) {
        handled = true;
        this.updateLookDelta(touch.clientX, touch.clientY);
      }
    }

    if (handled && event.cancelable) {
      event.preventDefault();
    }
  };

  private onWindowTouchEnd = (event: TouchEvent): void => {
    if (!this.active) {
      return;
    }

    let handled = false;
    for (let index = 0; index < event.changedTouches.length; index += 1) {
      const touch = event.changedTouches.item(index);
      if (!touch) {
        continue;
      }

      if (touch.identifier === this.leftTouchId) {
        handled = true;
        this.leftTouchId = null;
        this.resetLeftMovement();
      }

      if (touch.identifier === this.rightTouchId) {
        handled = true;
        this.rightTouchId = null;
        this.rightLastPoint = null;
      }
    }

    if (handled && event.cancelable) {
      event.preventDefault();
    }
  };

  private updateLeftMovement(x: number, y: number): void {
    const dx = x - this.leftCenter.x;
    const dy = y - this.leftCenter.y;
    const distance = Math.hypot(dx, dy);
    const ratio = distance > this.leftRadius ? this.leftRadius / distance : 1;
    const offsetX = dx * ratio;
    const offsetY = dy * ratio;

    this.setKnobPosition(offsetX, offsetY);

    let right = offsetX / this.leftRadius;
    let forward = -offsetY / this.leftRadius;

    const deadZone = 0.08;
    if (Math.abs(right) < deadZone) {
      right = 0;
    }
    if (Math.abs(forward) < deadZone) {
      forward = 0;
    }

    this.movement.right = clamp(right, -1, 1);
    this.movement.forward = clamp(forward, -1, 1);
  }

  private updateLookDelta(x: number, y: number): void {
    if (!this.rightLastPoint) {
      this.rightLastPoint = { x, y };
      return;
    }
    const dx = x - this.rightLastPoint.x;
    const dy = y - this.rightLastPoint.y;
    this.rightLastPoint.x = x;
    this.rightLastPoint.y = y;

    this.lookDelta.x += dx;
    this.lookDelta.y += dy;
  }

  private resetLeftMovement(): void {
    this.movement.forward = 0;
    this.movement.right = 0;
    this.setKnobPosition(0, 0);
  }

  private setKnobPosition(offsetX: number, offsetY: number): void {
    if (!this.leftKnob) {
      return;
    }
    this.leftKnob.style.transform =
      `translate(calc(-50% + ${offsetX.toFixed(2)}px), calc(-50% + ${offsetY.toFixed(2)}px))`;
  }

  private resetState(): void {
    this.leftTouchId = null;
    this.rightTouchId = null;
    this.rightLastPoint = null;
    this.lookDelta.x = 0;
    this.lookDelta.y = 0;
    this.resetLeftMovement();
  }

  dispose(): void {
    if (!this.isMobileDevice || !this.root) {
      return;
    }
    this.leftPad?.removeEventListener('touchstart', this.onLeftTouchStart);
    this.rightPad?.removeEventListener('touchstart', this.onRightTouchStart);
    window.removeEventListener('touchmove', this.onWindowTouchMove);
    window.removeEventListener('touchend', this.onWindowTouchEnd);
    window.removeEventListener('touchcancel', this.onWindowTouchEnd);
    window.removeEventListener('resize', this.onResize);
    this.root.remove();
  }
}
