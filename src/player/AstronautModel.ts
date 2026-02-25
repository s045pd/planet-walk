import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import type { PlayerState } from './PlayerState';

/** 简易宇航员模型（程序化摆腿动画） */
export class AstronautModel implements IDisposable {
  readonly root = new THREE.Group();

  private readonly _leftLegPivot = new THREE.Group();
  private readonly _rightLegPivot = new THREE.Group();
  private readonly _forward = new THREE.Vector3();
  private readonly _up = new THREE.Vector3();
  private readonly _lookTarget = new THREE.Vector3();
  private readonly _worldForward = new THREE.Vector3(0, 0, -1);
  private readonly _worldUp = new THREE.Vector3(0, 1, 0);
  private readonly _worldRight = new THREE.Vector3(1, 0, 0);

  private readonly _materials: THREE.Material[] = [];
  private readonly _geometries: THREE.BufferGeometry[] = [];

  private _walkPhase = 0;
  private _lastUpdateTime = performance.now();

  constructor() {
    const suitMaterial = new THREE.MeshStandardMaterial({
      color: 0xe7edf5,
      roughness: 0.55,
      metalness: 0.15,
    });
    const visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x90b6d8,
      roughness: 0.18,
      metalness: 0.75,
      transparent: true,
      opacity: 0.85,
    });
    const bootMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2f36,
      roughness: 0.9,
      metalness: 0.05,
    });

    this._materials.push(suitMaterial, visorMaterial, bootMaterial);

    const bodyGeometry = new THREE.CapsuleGeometry(0.32, 0.95, 6, 12);
    const headGeometry = new THREE.SphereGeometry(0.34, 16, 12);
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.11, 0.82, 10);

    this._geometries.push(bodyGeometry, headGeometry, legGeometry);

    const body = new THREE.Mesh(bodyGeometry, suitMaterial);
    body.position.y = 1.25;
    body.castShadow = true;
    body.receiveShadow = true;

    const head = new THREE.Mesh(headGeometry, visorMaterial);
    head.position.y = 2.05;
    head.castShadow = true;
    head.receiveShadow = true;

    this._leftLegPivot.position.set(-0.16, 0.98, 0);
    this._rightLegPivot.position.set(0.16, 0.98, 0);

    const leftLeg = new THREE.Mesh(legGeometry, bootMaterial);
    leftLeg.position.y = -0.41;
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;

    const rightLeg = new THREE.Mesh(legGeometry, bootMaterial);
    rightLeg.position.y = -0.41;
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;

    this._leftLegPivot.add(leftLeg);
    this._rightLegPivot.add(rightLeg);

    this.root.add(body, head, this._leftLegPivot, this._rightLegPivot);
    this.root.visible = false;
  }

  update(state: PlayerState, isMoving: boolean): void {
    const now = performance.now();
    const delta = Math.min(0.1, Math.max(0, (now - this._lastUpdateTime) / 1000));
    this._lastUpdateTime = now;

    this.root.position.copy(state.position);

    this._up.copy(state.up);
    this._forward
      .copy(this._worldForward)
      .applyQuaternion(state.quaternion)
      .addScaledVector(this._up, -this._forward.dot(this._up));
    if (this._forward.lengthSq() < 1e-8) {
      this._forward.crossVectors(this._worldUp, this._up);
      if (this._forward.lengthSq() < 1e-8) {
        this._forward.crossVectors(this._worldRight, this._up);
      }
      if (this._forward.lengthSq() < 1e-8) {
        this._forward.set(0, 0, -1);
      }
    }
    this._forward.normalize();

    this.root.up.copy(this._up);
    this._lookTarget.copy(this.root.position).add(this._forward);
    this.root.lookAt(this._lookTarget);

    if (isMoving) {
      this._walkPhase += delta * 10;
    }
    const targetSwing = isMoving ? Math.sin(this._walkPhase) * 0.65 : 0;
    const smoothing = Math.min(1, delta * 14);
    this._leftLegPivot.rotation.x += (targetSwing - this._leftLegPivot.rotation.x) * smoothing;
    this._rightLegPivot.rotation.x += (-targetSwing - this._rightLegPivot.rotation.x) * smoothing;
  }

  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  dispose(): void {
    for (const material of this._materials) {
      material.dispose();
    }
    for (const geometry of this._geometries) {
      geometry.dispose();
    }
    this.root.removeFromParent();
  }
}
