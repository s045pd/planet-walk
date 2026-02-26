import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import type { PlayerState } from './PlayerState';

/** 宇航员模型（PBR 材质 + 骨骼层级 + 程序化步行动画） */
export class AstronautModel implements IDisposable {
  readonly root = new THREE.Group();

  private readonly _hipsBone = new THREE.Bone();
  private readonly _spineBone = new THREE.Bone();
  private readonly _chestBone = new THREE.Bone();
  private readonly _neckBone = new THREE.Bone();
  private readonly _headBone = new THREE.Bone();
  private readonly _leftShoulderBone = new THREE.Bone();
  private readonly _leftElbowBone = new THREE.Bone();
  private readonly _leftWristBone = new THREE.Bone();
  private readonly _rightShoulderBone = new THREE.Bone();
  private readonly _rightElbowBone = new THREE.Bone();
  private readonly _rightWristBone = new THREE.Bone();
  private readonly _leftUpperLegBone = new THREE.Bone();
  private readonly _leftKneeBone = new THREE.Bone();
  private readonly _leftAnkleBone = new THREE.Bone();
  private readonly _rightUpperLegBone = new THREE.Bone();
  private readonly _rightKneeBone = new THREE.Bone();
  private readonly _rightAnkleBone = new THREE.Bone();
  private readonly _skeleton: THREE.Skeleton;

  private readonly _forward = new THREE.Vector3();
  private readonly _up = new THREE.Vector3();
  private readonly _lookTarget = new THREE.Vector3();
  private readonly _worldForward = new THREE.Vector3(0, 0, -1);
  private readonly _worldUp = new THREE.Vector3(0, 1, 0);
  private readonly _worldRight = new THREE.Vector3(1, 0, 0);

  private readonly _materials: THREE.Material[] = [];
  private readonly _geometries: THREE.BufferGeometry[] = [];
  private readonly _textures: THREE.Texture[] = [];

  private _walkPhase = 0;
  private _walkBlend = 0;
  private _lastUpdateTime = performance.now();

  constructor() {
    const visorEnvMap = this.createVisorEnvMap();
    this._textures.push(visorEnvMap);

    const suitMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3f6fb,
      roughness: 0.3,
      metalness: 0.6,
    });
    const suitTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a313e,
      roughness: 0.42,
      metalness: 0.62,
    });
    const helmetShellMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8d4e7,
      roughness: 0.3,
      metalness: 0.6,
    });
    const visorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x95c6ee,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.54,
      envMap: visorEnvMap,
      envMapIntensity: 1.9,
    });
    const backpackMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8edf6,
      roughness: 0.35,
      metalness: 0.62,
    });
    const oxygenTankMaterial = new THREE.MeshStandardMaterial({
      color: 0xbecbdd,
      roughness: 0.3,
      metalness: 0.6,
    });
    const bootMaterial = new THREE.MeshStandardMaterial({
      color: 0x252a33,
      roughness: 0.4,
      metalness: 0.58,
    });
    const skeletonAnchorMaterial = new THREE.MeshBasicMaterial({
      visible: false,
    });

    this._materials.push(
      suitMaterial,
      suitTrimMaterial,
      helmetShellMaterial,
      visorMaterial,
      backpackMaterial,
      oxygenTankMaterial,
      bootMaterial,
      skeletonAnchorMaterial,
    );

    const upperTorsoGeometry = new THREE.CapsuleGeometry(0.29, 0.5, 10, 20);
    const lowerTorsoGeometry = new THREE.CapsuleGeometry(0.245, 0.24, 8, 16);
    const beltGeometry = new THREE.TorusGeometry(0.26, 0.03, 10, 24);
    const helmetGeometry = new THREE.SphereGeometry(0.32, 28, 22);
    const visorGeometry = new THREE.SphereGeometry(
      0.28,
      30,
      20,
      Math.PI * 0.87,
      Math.PI * 0.26,
      Math.PI * 0.28,
      Math.PI * 0.42,
    );
    const armSegmentGeometry = new THREE.CapsuleGeometry(0.078, 0.3, 8, 16);
    const forearmGeometry = new THREE.CapsuleGeometry(0.07, 0.28, 8, 16);
    const handGeometry = new THREE.SphereGeometry(0.07, 12, 10);
    const upperLegGeometry = new THREE.CapsuleGeometry(0.1, 0.33, 8, 16);
    const lowerLegGeometry = new THREE.CapsuleGeometry(0.09, 0.31, 8, 16);
    const bootGeometry = new THREE.BoxGeometry(0.19, 0.14, 0.28);
    const backpackGeometry = new THREE.BoxGeometry(0.44, 0.54, 0.2);
    const tankGeometry = new THREE.CylinderGeometry(0.055, 0.055, 0.44, 14);
    const chestPlateGeometry = new THREE.BoxGeometry(0.26, 0.2, 0.08);
    const skeletonAnchorGeometry = this.createSkeletonAnchorGeometry();

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
      skeletonAnchorGeometry,
    );

    this._buildSkeletonHierarchy();
    this._skeleton = new THREE.Skeleton([
      this._hipsBone,
      this._spineBone,
      this._chestBone,
      this._neckBone,
      this._headBone,
      this._leftShoulderBone,
      this._leftElbowBone,
      this._leftWristBone,
      this._rightShoulderBone,
      this._rightElbowBone,
      this._rightWristBone,
      this._leftUpperLegBone,
      this._leftKneeBone,
      this._leftAnkleBone,
      this._rightUpperLegBone,
      this._rightKneeBone,
      this._rightAnkleBone,
    ]);

    const skeletonAnchor = new THREE.SkinnedMesh(skeletonAnchorGeometry, skeletonAnchorMaterial);
    skeletonAnchor.add(this._hipsBone);
    skeletonAnchor.bind(this._skeleton);
    skeletonAnchor.visible = false;
    skeletonAnchor.frustumCulled = false;
    this.root.add(skeletonAnchor);

    const upperTorso = this.createPart(upperTorsoGeometry, suitMaterial);
    upperTorso.position.y = 0.08;
    this._chestBone.add(upperTorso);

    const lowerTorso = this.createPart(lowerTorsoGeometry, suitMaterial);
    lowerTorso.position.y = 0.18;
    this._spineBone.add(lowerTorso);

    const belt = this.createPart(beltGeometry, suitTrimMaterial);
    belt.position.y = 0.03;
    belt.rotation.x = Math.PI * 0.5;
    this._hipsBone.add(belt);

    const chestPlate = this.createPart(chestPlateGeometry, suitTrimMaterial);
    chestPlate.position.set(0, 0.07, -0.24);
    this._chestBone.add(chestPlate);

    const helmetShell = this.createPart(helmetGeometry, helmetShellMaterial);
    helmetShell.position.y = 0.14;
    this._headBone.add(helmetShell);

    const visor = this.createPart(visorGeometry, visorMaterial);
    visor.position.set(0, 0.14, -0.01);
    this._headBone.add(visor);

    const backpack = this.createPart(backpackGeometry, backpackMaterial);
    backpack.position.set(0, 0.04, 0.26);
    this._chestBone.add(backpack);

    const leftTank = this.createPart(tankGeometry, oxygenTankMaterial);
    leftTank.position.set(-0.13, 0.04, 0.27);
    this._chestBone.add(leftTank);

    const rightTank = this.createPart(tankGeometry, oxygenTankMaterial);
    rightTank.position.set(0.13, 0.04, 0.27);
    this._chestBone.add(rightTank);

    const leftUpperArm = this.createPart(armSegmentGeometry, suitMaterial);
    leftUpperArm.position.y = -0.18;
    this._leftShoulderBone.add(leftUpperArm);

    const rightUpperArm = this.createPart(armSegmentGeometry, suitMaterial);
    rightUpperArm.position.y = -0.18;
    this._rightShoulderBone.add(rightUpperArm);

    const leftForearm = this.createPart(forearmGeometry, suitMaterial);
    leftForearm.position.y = -0.16;
    this._leftElbowBone.add(leftForearm);

    const rightForearm = this.createPart(forearmGeometry, suitMaterial);
    rightForearm.position.y = -0.16;
    this._rightElbowBone.add(rightForearm);

    const leftHand = this.createPart(handGeometry, suitTrimMaterial);
    leftHand.position.y = -0.07;
    this._leftWristBone.add(leftHand);

    const rightHand = this.createPart(handGeometry, suitTrimMaterial);
    rightHand.position.y = -0.07;
    this._rightWristBone.add(rightHand);

    const leftUpperLeg = this.createPart(upperLegGeometry, suitMaterial);
    leftUpperLeg.position.y = -0.2;
    this._leftUpperLegBone.add(leftUpperLeg);

    const rightUpperLeg = this.createPart(upperLegGeometry, suitMaterial);
    rightUpperLeg.position.y = -0.2;
    this._rightUpperLegBone.add(rightUpperLeg);

    const leftLowerLeg = this.createPart(lowerLegGeometry, suitMaterial);
    leftLowerLeg.position.y = -0.18;
    this._leftKneeBone.add(leftLowerLeg);

    const rightLowerLeg = this.createPart(lowerLegGeometry, suitMaterial);
    rightLowerLeg.position.y = -0.18;
    this._rightKneeBone.add(rightLowerLeg);

    const leftBoot = this.createPart(bootGeometry, bootMaterial);
    leftBoot.position.set(0, -0.07, -0.05);
    this._leftAnkleBone.add(leftBoot);

    const rightBoot = this.createPart(bootGeometry, bootMaterial);
    rightBoot.position.set(0, -0.07, -0.05);
    this._rightAnkleBone.add(rightBoot);

    this._skeleton.pose();
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
      this._walkPhase += delta * 8;
    }
    const blendTarget = isMoving ? 1 : 0;
    const blendSmoothing = Math.min(1, delta * 8);
    this._walkBlend += (blendTarget - this._walkBlend) * blendSmoothing;

    const gait = Math.sin(this._walkPhase);
    const gaitAbs = Math.abs(gait);
    const legSwing = gait * 0.62 * this._walkBlend;
    const armSwing = legSwing * 0.76;
    const leftKneeTarget = Math.max(0, -gait) * 0.84 * this._walkBlend;
    const rightKneeTarget = Math.max(0, gait) * 0.84 * this._walkBlend;

    const smoothing = Math.min(1, delta * 15);
    this._leftUpperLegBone.rotation.x += (legSwing - this._leftUpperLegBone.rotation.x) * smoothing;
    this._rightUpperLegBone.rotation.x += (-legSwing - this._rightUpperLegBone.rotation.x) * smoothing;
    this._leftKneeBone.rotation.x += (leftKneeTarget - this._leftKneeBone.rotation.x) * smoothing;
    this._rightKneeBone.rotation.x += (rightKneeTarget - this._rightKneeBone.rotation.x) * smoothing;

    const armBase = -0.1;
    this._leftShoulderBone.rotation.x +=
      ((armBase - armSwing) - this._leftShoulderBone.rotation.x) * smoothing;
    this._rightShoulderBone.rotation.x +=
      ((armBase + armSwing) - this._rightShoulderBone.rotation.x) * smoothing;

    const elbowTarget = 0.14 + gaitAbs * 0.12 * this._walkBlend;
    this._leftElbowBone.rotation.x += (elbowTarget - this._leftElbowBone.rotation.x) * smoothing;
    this._rightElbowBone.rotation.x += (elbowTarget - this._rightElbowBone.rotation.x) * smoothing;

    this._spineBone.rotation.x +=
      ((-0.04 * gaitAbs * this._walkBlend) - this._spineBone.rotation.x) * smoothing;
    this._chestBone.rotation.y += ((legSwing * 0.12) - this._chestBone.rotation.y) * smoothing;
  }

  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  private _buildSkeletonHierarchy(): void {
    this._hipsBone.position.set(0, 1.02, 0);
    this._spineBone.position.set(0, 0.36, 0);
    this._chestBone.position.set(0, 0.32, 0);
    this._neckBone.position.set(0, 0.2, 0);
    this._headBone.position.set(0, 0.16, 0);

    this._leftShoulderBone.position.set(-0.31, 0.21, 0);
    this._leftElbowBone.position.set(0, -0.34, 0);
    this._leftWristBone.position.set(0, -0.3, 0);

    this._rightShoulderBone.position.set(0.31, 0.21, 0);
    this._rightElbowBone.position.set(0, -0.34, 0);
    this._rightWristBone.position.set(0, -0.3, 0);

    this._leftUpperLegBone.position.set(-0.16, -0.02, 0);
    this._leftKneeBone.position.set(0, -0.45, 0);
    this._leftAnkleBone.position.set(0, -0.42, 0.01);

    this._rightUpperLegBone.position.set(0.16, -0.02, 0);
    this._rightKneeBone.position.set(0, -0.45, 0);
    this._rightAnkleBone.position.set(0, -0.42, 0.01);

    this._hipsBone.add(this._spineBone, this._leftUpperLegBone, this._rightUpperLegBone);
    this._spineBone.add(this._chestBone);
    this._chestBone.add(this._neckBone, this._leftShoulderBone, this._rightShoulderBone);
    this._neckBone.add(this._headBone);

    this._leftShoulderBone.add(this._leftElbowBone);
    this._leftElbowBone.add(this._leftWristBone);
    this._rightShoulderBone.add(this._rightElbowBone);
    this._rightElbowBone.add(this._rightWristBone);

    this._leftUpperLegBone.add(this._leftKneeBone);
    this._leftKneeBone.add(this._leftAnkleBone);
    this._rightUpperLegBone.add(this._rightKneeBone);
    this._rightKneeBone.add(this._rightAnkleBone);
  }

  private createSkeletonAnchorGeometry(): THREE.BoxGeometry {
    const geometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
    const vertexCount = geometry.attributes.position.count;
    const skinIndices = new Uint16Array(vertexCount * 4);
    const skinWeights = new Float32Array(vertexCount * 4);
    for (let i = 0; i < vertexCount; i += 1) {
      skinWeights[i * 4] = 1;
    }
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
    return geometry;
  }

  private createVisorEnvMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#d8e8ff');
      gradient.addColorStop(0.45, '#5a7aa0');
      gradient.addColorStop(1, '#0a1322');
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.globalAlpha = 0.42;
      for (let i = 0; i < 18; i += 1) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.7;
        const radius = 3 + Math.random() * 18;
        const glow = context.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, '#f8fbff');
        glow.addColorStop(1, 'rgba(178, 209, 244, 0)');
        context.fillStyle = glow;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }

      context.globalAlpha = 0.24;
      context.fillStyle = '#dbeeff';
      context.fillRect(0, canvas.height * 0.72, canvas.width, canvas.height * 0.08);
      context.globalAlpha = 1;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.needsUpdate = true;
    return texture;
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
    for (const texture of this._textures) {
      texture.dispose();
    }
    this.root.removeFromParent();
  }
}
