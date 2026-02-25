import type { IDisposable } from './types';

/** 鼠标移动增量 */
export interface MouseDelta {
  x: number;
  y: number;
}

/** 键盘/鼠标输入状态管理，支持 PointerLock */
export class InputManager implements IDisposable {
  readonly keys = new Set<string>();

  private _mouseDelta: MouseDelta = { x: 0, y: 0 };
  private _pointerLocked = false;
  private _pointerLockEnabled = true;
  private _jumpRequested = false;
  private readonly _canvas: HTMLCanvasElement | null;

  constructor(canvas?: HTMLCanvasElement) {
    this._canvas = canvas ?? null;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    this.bindPointerLockClick();
  }

  isPressed(code: string): boolean {
    return this.keys.has(code);
  }

  /** 获取并清零鼠标增量 */
  consumeMouseDelta(): MouseDelta {
    const delta = { x: this._mouseDelta.x, y: this._mouseDelta.y };
    this._mouseDelta.x = 0;
    this._mouseDelta.y = 0;
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
    this.bindPointerLockClick();
    if (!enabled && this._pointerLocked) {
      document.exitPointerLock();
    }
    this._mouseDelta.x = 0;
    this._mouseDelta.y = 0;
  }

  /** 获取 WASD 移动方向 */
  getMovementAxis(): { forward: number; right: number } {
    let forward = 0;
    let right = 0;
    if (this.keys.has('KeyW')) forward += 1;
    if (this.keys.has('KeyS')) forward -= 1;
    if (this.keys.has('KeyA')) right -= 1;
    if (this.keys.has('KeyD')) right += 1;
    return { forward, right };
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
    if (!this._pointerLocked) return;
    this._mouseDelta.x += e.movementX;
    this._mouseDelta.y += e.movementY;
  };

  private onPointerLockChange = (): void => {
    this._pointerLocked = document.pointerLockElement === this._canvas;
  };

  private requestPointerLock = (): void => {
    if (!this._pointerLockEnabled) return;
    this._canvas?.requestPointerLock();
  };

  private bindPointerLockClick(): void {
    if (!this._canvas) return;
    this._canvas.removeEventListener('click', this.requestPointerLock);
    if (this._pointerLockEnabled) {
      this._canvas.addEventListener('click', this.requestPointerLock);
    }
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this._canvas?.removeEventListener('click', this.requestPointerLock);
  }
}
