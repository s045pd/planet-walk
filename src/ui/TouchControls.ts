import type { Input, InputAction } from '../core/Input';

export interface TouchControlsCallbacks {
  onToggleMode: () => void;
  onSample: () => void;
  onOpenWorlds: () => void;
}

export class TouchControls {
  private input: Input;
  private callbacks: TouchControlsCallbacks;
  private root: HTMLElement;
  private joystickBase: HTMLElement;
  private joystickKnob: HTMLElement;
  private lookZone: HTMLElement;

  private joystickActive = false;
  private joystickCenter = { x: 0, y: 0 };
  private joystickRadius = 48;
  private joystickPointerId = -1;
  private joystickActions: InputAction[] = [];

  private lookPointerId = -1;
  private lookLast = { x: 0, y: 0 };

  constructor(parent: HTMLElement, input: Input, callbacks: TouchControlsCallbacks) {
    this.input = input;
    this.callbacks = callbacks;

    this.root = document.createElement('div');
    this.root.className = 'touchctrl';
    this.root.setAttribute('data-ui', 'touchctrl');
    this.root.innerHTML = `
      <div class="touchctrl__look" data-ui data-look></div>
      <div class="touchctrl__joystick" data-ui data-joy>
        <div class="touchctrl__joystick-ring"></div>
        <div class="touchctrl__joystick-knob" data-knob></div>
      </div>
      <div class="touchctrl__buttons" data-ui>
        <button class="touchctrl__btn touchctrl__btn--jump" data-jump>JUMP</button>
        <button class="touchctrl__btn touchctrl__btn--sprint" data-sprint>RUN</button>
        <button class="touchctrl__btn touchctrl__btn--sample" data-sample>F · SAMPLE</button>
      </div>
    `;
    parent.appendChild(this.root);

    this.joystickBase = this.root.querySelector('[data-joy]') as HTMLElement;
    this.joystickKnob = this.root.querySelector('[data-knob]') as HTMLElement;
    this.lookZone = this.root.querySelector('[data-look]') as HTMLElement;

    this.joystickBase.addEventListener('pointerdown', this.onJoystickDown, { passive: false });
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);

    this.lookZone.addEventListener('pointerdown', this.onLookDown, { passive: false });

    const jump = this.root.querySelector('[data-jump]') as HTMLElement;
    const sprint = this.root.querySelector('[data-sprint]') as HTMLElement;
    const sample = this.root.querySelector('[data-sample]') as HTMLElement;

    this.bindHold(jump, 'jump');
    this.bindHold(sprint, 'sprint');
    sample.addEventListener('click', (e) => { e.stopPropagation(); this.callbacks.onSample(); });
  }

  setVisible(v: boolean): void {
    this.root.style.display = v ? '' : 'none';
  }

  dispose(): void {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    this.root.remove();
  }

  private bindHold(el: HTMLElement, action: InputAction): void {
    const down = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.input.setVirtualAction(action, true);
      el.classList.add('is-held');
    };
    const up = () => {
      this.input.setVirtualAction(action, false);
      el.classList.remove('is-held');
    };
    el.addEventListener('pointerdown', down, { passive: false });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  }

  private onJoystickDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = this.joystickBase.getBoundingClientRect();
    this.joystickCenter.x = rect.left + rect.width / 2;
    this.joystickCenter.y = rect.top + rect.height / 2;
    this.joystickActive = true;
    this.joystickPointerId = event.pointerId;
    this.updateJoystick(event.clientX, event.clientY);
  };

  private onLookDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (this.lookPointerId !== -1) return;
    const target = event.target as HTMLElement;
    if (target.closest('[data-joy], [data-jump], [data-sprint], [data-sample]')) return;
    event.preventDefault();
    this.lookPointerId = event.pointerId;
    this.lookLast.x = event.clientX;
    this.lookLast.y = event.clientY;
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId === this.joystickPointerId && this.joystickActive) {
      event.preventDefault();
      this.updateJoystick(event.clientX, event.clientY);
    } else if (event.pointerId === this.lookPointerId) {
      const dx = event.clientX - this.lookLast.x;
      const dy = event.clientY - this.lookLast.y;
      this.lookLast.x = event.clientX;
      this.lookLast.y = event.clientY;
      this.input.injectMouseDelta(dx * 1.1, dy * 1.1);
    }
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId === this.joystickPointerId) {
      this.joystickActive = false;
      this.joystickPointerId = -1;
      this.resetJoystick();
    }
    if (event.pointerId === this.lookPointerId) {
      this.lookPointerId = -1;
    }
  };

  private updateJoystick(px: number, py: number): void {
    const dx = px - this.joystickCenter.x;
    const dy = py - this.joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, this.joystickRadius);
    const nx = dist > 0 ? (dx / dist) * clampedDist : 0;
    const ny = dist > 0 ? (dy / dist) * clampedDist : 0;
    this.joystickKnob.style.transform = `translate(${nx}px, ${ny}px)`;

    const normX = nx / this.joystickRadius;
    const normY = ny / this.joystickRadius;
    const dead = 0.22;

    const newActions: InputAction[] = [];
    if (normY < -dead) newActions.push('forward');
    if (normY > dead) newActions.push('back');
    if (normX < -dead) newActions.push('left');
    if (normX > dead) newActions.push('right');

    for (const a of this.joystickActions) {
      if (!newActions.includes(a)) this.input.setVirtualAction(a, false);
    }
    for (const a of newActions) {
      if (!this.joystickActions.includes(a)) this.input.setVirtualAction(a, true);
    }
    this.joystickActions = newActions;
  }

  private resetJoystick(): void {
    this.joystickKnob.style.transform = '';
    for (const a of this.joystickActions) this.input.setVirtualAction(a, false);
    this.joystickActions = [];
  }
}
