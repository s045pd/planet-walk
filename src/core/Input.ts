export type InputAction = 'forward' | 'back' | 'left' | 'right' | 'jump' | 'sprint';

const KEY_MAP: Record<string, InputAction> = {
  KeyW: 'forward',
  KeyS: 'back',
  KeyA: 'left',
  KeyD: 'right',
  ArrowUp: 'forward',
  ArrowDown: 'back',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Space: 'jump',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
};

export type BindableKey =
  | 'Tab'
  | 'KeyM'
  | 'KeyF'
  | 'KeyR'
  | 'KeyK'
  | 'Space'
  | 'Digit1'
  | 'Digit2'
  | 'Digit3'
  | 'Digit4'
  | 'Digit5'
  | 'Escape';

export class Input {
  private actions = new Set<InputAction>();
  private pressHandlers = new Map<BindableKey, Set<() => void>>();
  private mouseDelta = { x: 0, y: 0 };
  private pointerLocked = false;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    canvas.addEventListener('click', this.requestPointerLock);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.canvas.removeEventListener('click', this.requestPointerLock);
  }

  isActive(action: InputAction): boolean {
    return this.actions.has(action);
  }

  onPress(key: BindableKey, handler: () => void): () => void {
    let set = this.pressHandlers.get(key);
    if (!set) {
      set = new Set();
      this.pressHandlers.set(key, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  consumeMouseDelta(): { x: number; y: number } {
    const out = { x: this.mouseDelta.x, y: this.mouseDelta.y };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return out;
  }

  injectMouseDelta(dx: number, dy: number): void {
    this.mouseDelta.x += dx;
    this.mouseDelta.y += dy;
  }

  setVirtualAction(action: InputAction, active: boolean): void {
    if (active) this.actions.add(action);
    else this.actions.delete(action);
  }

  get isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  requestPointerLock = (): void => {
    if (this.pointerLocked) return;
    if (typeof this.canvas.requestPointerLock === 'function') {
      try { void this.canvas.requestPointerLock(); } catch { /* unsupported on touch devices */ }
    }
  };

  exitPointerLock(): void {
    if (this.pointerLocked) document.exitPointerLock();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const action = KEY_MAP[event.code];
    if (action) {
      this.actions.add(action);
      event.preventDefault();
    }
    const handlers = this.pressHandlers.get(event.code as BindableKey);
    if (handlers) {
      for (const handler of handlers) handler();
      event.preventDefault();
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const action = KEY_MAP[event.code];
    if (action) this.actions.delete(action);
  };

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.pointerLocked) return;
    this.mouseDelta.x += event.movementX;
    this.mouseDelta.y += event.movementY;
  };

  private onPointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.canvas;
  };
}
