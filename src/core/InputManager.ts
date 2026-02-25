import type { IDisposable } from './types';
import { TouchManager } from './TouchManager';
import { VirtualJoystick } from '../ui/VirtualJoystick';

/** 鼠标移动增量 */
export interface MouseDelta {
  x: number;
  y: number;
}

export interface MovementVector {
  forward: number;
  right: number;
}

/** 键盘/鼠标输入状态管理，支持 PointerLock */
export class InputManager implements IDisposable {
  readonly keys = new Set<string>();

  private _mouseDelta: MouseDelta = { x: 0, y: 0 };
  private _wheelDelta = 0;
  private _pointerLocked = false;
  private _pointerLockEnabled: boolean;
  private _jumpRequested = false;
  private readonly _canvas: HTMLCanvasElement | null;
  private readonly _isMobile: boolean;
  private readonly _touchManager: TouchManager | null;
  private readonly _virtualJoystick: VirtualJoystick | null;

  constructor(canvas?: HTMLCanvasElement) {
    this._canvas = canvas ?? null;
    this._isMobile = TouchManager.isMobile();
    this._pointerLockEnabled = !this._isMobile;
    this._touchManager = this._isMobile && this._canvas
      ? new TouchManager({ element: this._canvas })
      : null;
    this._virtualJoystick = this._isMobile ? new VirtualJoystick() : null;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    if (!this._isMobile) {
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('pointerlockchange', this.onPointerLockChange);
      window.addEventListener('wheel', this.onWheel, { passive: false });
      this.bindPointerLockClick();
    } else {
      this._virtualJoystick?.setActive(false);
    }
  }

  isPressed(code: string): boolean {
    return this.keys.has(code);
  }

  get isMobile(): boolean {
    return this._isMobile;
  }

  get touchManager(): TouchManager | null {
    return this._touchManager;
  }

  /** 获取并清零鼠标增量 */
  consumeMouseDelta(): MouseDelta {
    const delta = { x: this._mouseDelta.x, y: this._mouseDelta.y };
    if (this._isMobile) {
      const touchDelta = this._virtualJoystick?.consumeLookDelta();
      if (touchDelta) {
        delta.x += touchDelta.x;
        delta.y += touchDelta.y;
      }
    }
    this._mouseDelta.x = 0;
    this._mouseDelta.y = 0;
    return delta;
  }

  /** 获取并清零滚轮增量 */
  consumeWheel(): number {
    const delta = this._wheelDelta;
    this._wheelDelta = 0;
    return delta;
  }

  /** 获取并清除跳跃请求 */
  consumeJump(): boolean {
    if (this._jumpRequested) {
      this._jumpRequested = false;
      return true;
    }
    return false;
  }

  get pointerLocked(): boolean {
    return this._pointerLocked;
  }

  get pointerLockEnabled(): boolean {
    return this._pointerLockEnabled;
  }

  setPointerLockEnabled(enabled: boolean): void {
    if (this._pointerLockEnabled === enabled) {
      return;
    }
    this._pointerLockEnabled = enabled;

    if (this._isMobile) {
      this._virtualJoystick?.setActive(enabled);
      this._mouseDelta.x = 0;
      this._mouseDelta.y = 0;
      return;
    }

    this.bindPointerLockClick();
    if (!enabled && this._pointerLocked) {
      document.exitPointerLock();
    }
    this._mouseDelta.x = 0;
    this._mouseDelta.y = 0;
    this._wheelDelta = 0;
  }

  /** 获取键盘+触控综合后的移动向量 */
  getMovementVector(): MovementVector {
    let forward = 0;
    let right = 0;
    if (this.keys.has('KeyW')) forward += 1;
    if (this.keys.has('KeyS')) forward -= 1;
    if (this.keys.has('KeyA')) right -= 1;
    if (this.keys.has('KeyD')) right += 1;

    if (this._isMobile) {
      const joystick = this._virtualJoystick?.getMovementVector();
      if (joystick) {
        forward += joystick.forward;
        right += joystick.right;
      }
    }

    forward = Math.max(-1, Math.min(1, forward));
    right = Math.max(-1, Math.min(1, right));

    return { forward, right };
  }

  /** 兼容旧接口 */
  getMovementAxis(): MovementVector {
    return this.getMovementVector();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
    if (e.code === 'Space') {
      this._jumpRequested = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this._isMobile) return;
    if (!this._pointerLocked) return;
    this._mouseDelta.x += e.movementX;
    this._mouseDelta.y += e.movementY;
  };

  private onPointerLockChange = (): void => {
    if (this._isMobile) return;
    this._pointerLocked = document.pointerLockElement === this._canvas;
  };

  private onWheel = (e: WheelEvent): void => {
    if (this._isMobile) return;
    this._wheelDelta += e.deltaY;
    if (this._pointerLockEnabled) {
      e.preventDefault();
    }
  };

  private requestPointerLock = (): void => {
    if (this._isMobile) return;
    if (!this._pointerLockEnabled) return;
    this._canvas?.requestPointerLock();
  };

  private bindPointerLockClick(): void {
    if (this._isMobile) return;
    if (!this._canvas) return;
    this._canvas.removeEventListener('click', this.requestPointerLock);
    if (this._pointerLockEnabled) {
      this._canvas.addEventListener('click', this.requestPointerLock);
    }
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    if (!this._isMobile) {
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('pointerlockchange', this.onPointerLockChange);
      window.removeEventListener('wheel', this.onWheel);
    }
    this._canvas?.removeEventListener('click', this.requestPointerLock);
    this._touchManager?.dispose();
    this._virtualJoystick?.dispose();
  }
}
