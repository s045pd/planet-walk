import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import type { PlayerState } from './PlayerState';

/** 宇航员模型（PBR 材质 + 分段肢体 + 程序化步行动画） */
export class AstronautModel implements IDisposable {
  readonly root = new THREE.Group();

  private readonly _leftLegPivot = new THREE.Group();
  private readonly _rightLegPivot = new THREE.Group();
  private readonly _leftKneePivot = new THREE.Group();
  private readonly _rightKneePivot = new THREE.Group();
  private readonly _leftArmPivot = new THREE.Group();
  private readonly _rightArmPivot = new THREE.Group();
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
      color: 0xf3f6fb,
      roughness: 0.5,
      metalness: 0.1,
    });
    const suitTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a313e,
      roughness: 0.76,
      metalness: 0.2,
    });
    const helmetShellMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8d4e7,
      roughness: 0.2,
      metalness: 0.8,
    });
    const visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x84c0ec,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.46,
      envMapIntensity: 1.2,
    });
    const backpackMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8edf6,
      roughness: 0.42,
      metalness: 0.35,
    });
    const oxygenTankMaterial = new THREE.MeshStandardMaterial({
      color: 0xbecbdd,
      roughness: 0.28,
      metalness: 0.7,
    });
    const bootMaterial = new THREE.MeshStandardMaterial({
      color: 0x252a33,
      roughness: 0.88,
      metalness: 0.08,
    });

    this._materials.push(
      suitMaterial,
      suitTrimMaterial,
      helmetShellMaterial,
      visorMaterial,
      backpackMaterial,
      oxygenTankMaterial,
      bootMaterial,
    );

    const upperTorsoGeometry = new THREE.CapsuleGeometry(0.3, 0.44, 8, 18);
    const lowerTorsoGeometry = new THREE.CylinderGeometry(0.25, 0.27, 0.36, 18);
    const beltGeometry = new THREE.TorusGeometry(0.26, 0.03, 10, 24);
    const helmetGeometry = new THREE.SphereGeometry(0.34, 28, 22);
    const visorGeometry = new THREE.SphereGeometry(
      0.29,
      28,
      18,
      Math.PI * 0.88,
      Math.PI * 0.24,
      Math.PI * 0.3,
      Math.PI * 0.38,
    );
    const armSegmentGeometry = new THREE.CapsuleGeometry(0.075, 0.34, 6, 12);
    const forearmGeometry = new THREE.CapsuleGeometry(0.068, 0.29, 6, 12);
    const handGeometry = new THREE.SphereGeometry(0.07, 12, 10);
    const upperLegGeometry = new THREE.CapsuleGeometry(0.095, 0.36, 6, 12);
    const lowerLegGeometry = new THREE.CapsuleGeometry(0.085, 0.35, 6, 12);
    const bootGeometry = new THREE.BoxGeometry(0.19, 0.14, 0.28);
    const backpackGeometry = new THREE.BoxGeometry(0.44, 0.54, 0.2);
    const tankGeometry = new THREE.CylinderGeometry(0.055, 0.055, 0.44, 14);
    const chestPlateGeometry = new THREE.BoxGeometry(0.26, 0.2, 0.08);

    this._geometries.push(
      upperTorsoGeometry,
      lowerTorsoGeometry,
      beltGeometry,
      helmetGeometry,
      visorGeometry,
      armSegmentGeometry,
      forearmGeometry,
      handGeometry,
      upperLegGeometry,
      lowerLegGeometry,
      bootGeometry,
      backpackGeometry,
      tankGeometry,
      chestPlateGeometry,
    );

    const upperTorso = this.createPart(upperTorsoGeometry, suitMaterial);
    upperTorso.position.y = 1.48;
    const lowerTorso = this.createPart(lowerTorsoGeometry, suitMaterial);
    lowerTorso.position.y = 1.16;
    const belt = this.createPart(beltGeometry, suitTrimMaterial);
    belt.position.y = 1.02;
    belt.rotation.x = Math.PI * 0.5;
    const chestPlate = this.createPart(chestPlateGeometry, suitTrimMaterial);
    chestPlate.position.set(0, 1.48, -0.22);

    const helmetShell = this.createPart(helmetGeometry, helmetShellMaterial);
    helmetShell.position.y = 2.02;
    const visor = this.createPart(visorGeometry, visorMaterial);
    visor.position.set(0, 2.02, -0.015);

    const backpack = this.createPart(backpackGeometry, backpackMaterial);
    backpack.position.set(0, 1.43, 0.24);
    const leftTank = this.createPart(tankGeometry, oxygenTankMaterial);
    leftTank.position.set(-0.13, 1.43, 0.26);
    const rightTank = this.createPart(tankGeometry, oxygenTankMaterial);
    rightTank.position.set(0.13, 1.43, 0.26);

    this._leftArmPivot.position.set(-0.34, 1.58, -0.02);
    this._rightArmPivot.position.set(0.34, 1.58, -0.02);
    const leftUpperArm = this.createPart(armSegmentGeometry, suitMaterial);
    leftUpperArm.position.y = -0.19;
    const rightUpperArm = this.createPart(armSegmentGeometry, suitMaterial);
    rightUpperArm.position.y = -0.19;

    const leftForearm = this.createPart(forearmGeometry, suitMaterial);
    leftForearm.position.y = -0.49;
    const rightForearm = this.createPart(forearmGeometry, suitMaterial);
    rightForearm.position.y = -0.49;
    const leftHand = this.createPart(handGeometry, suitTrimMaterial);
    leftHand.position.y = -0.7;
    const rightHand = this.createPart(handGeometry, suitTrimMaterial);
    rightHand.position.y = -0.7;
    this._leftArmPivot.add(leftUpperArm, leftForearm, leftHand);
    this._rightArmPivot.add(rightUpperArm, rightForearm, rightHand);

    this._leftLegPivot.position.set(-0.16, 0.98, 0);
    this._rightLegPivot.position.set(0.16, 0.98, 0);
    const leftUpperLeg = this.createPart(upperLegGeometry, suitMaterial);
    leftUpperLeg.position.y = -0.24;
    const rightUpperLeg = this.createPart(upperLegGeometry, suitMaterial);
    rightUpperLeg.position.y = -0.24;
    this._leftLegPivot.add(leftUpperLeg);
    this._rightLegPivot.add(rightUpperLeg);

    this._leftKneePivot.position.y = -0.5;
    this._rightKneePivot.position.y = -0.5;
    const leftLowerLeg = this.createPart(lowerLegGeometry, suitMaterial);
    leftLowerLeg.position.y = -0.22;
    const rightLowerLeg = this.createPart(lowerLegGeometry, suitMaterial);
    rightLowerLeg.position.y = -0.22;
    const leftBoot = this.createPart(bootGeometry, bootMaterial);
    leftBoot.position.set(0, -0.49, -0.05);
    const rightBoot = this.createPart(bootGeometry, bootMaterial);
    rightBoot.position.set(0, -0.49, -0.05);
    this._leftKneePivot.add(leftLowerLeg, leftBoot);
    this._rightKneePivot.add(rightLowerLeg, rightBoot);
    this._leftLegPivot.add(this._leftKneePivot);
    this._rightLegPivot.add(this._rightKneePivot);

    this.root.add(
      upperTorso,
      lowerTorso,
      belt,
      chestPlate,
      helmetShell,
      visor,
      backpack,
      leftTank,
      rightTank,
      this._leftArmPivot,
      this._rightArmPivot,
      this._leftLegPivot,
      this._rightLegPivot,
    );
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
      this._walkPhase += delta * 8.5;
    }
    const targetSwing = isMoving ? Math.sin(this._walkPhase) * 0.55 : 0;
    const smoothing = Math.min(1, delta * 14);
    this._leftLegPivot.rotation.x += (targetSwing - this._leftLegPivot.rotation.x) * smoothing;
    this._rightLegPivot.rotation.x += (-targetSwing - this._rightLegPivot.rotation.x) * smoothing;
    const leftKneeTarget = isMoving ? Math.max(0, -targetSwing) * 0.75 : 0;
    const rightKneeTarget = isMoving ? Math.max(0, targetSwing) * 0.75 : 0;
    this._leftKneePivot.rotation.x += (leftKneeTarget - this._leftKneePivot.rotation.x) * smoothing;
    this._rightKneePivot.rotation.x += (rightKneeTarget - this._rightKneePivot.rotation.x) * smoothing;
    this._leftArmPivot.rotation.x += ((-targetSwing * 0.65) - this._leftArmPivot.rotation.x) * smoothing;
    this._rightArmPivot.rotation.x += ((targetSwing * 0.65) - this._rightArmPivot.rotation.x) * smoothing;
  }

  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  private createPart(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
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
