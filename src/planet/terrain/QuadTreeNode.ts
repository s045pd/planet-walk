import * as THREE from 'three';
import type { TilePool } from './TilePool';

/** 立方体面枚举 */
export enum CubeFace {
  PosX = 0, // +X
  NegX = 1, // -X
  PosY = 2, // +Y
  NegY = 3, // -Y
  PosZ = 4, // +Z
  NegZ = 5, // -Z
}

/** 四叉树节点在立方体面上的2D边界 */
export interface NodeBounds {
  x: number;      // 左下角 u (范围 -1 到 1)
  y: number;      // 左下角 v (范围 -1 到 1)
  size: number;   // 边长
}

/** 四叉树节点：LOD地形细分的基本单元 */
export class QuadTreeNode {
  readonly face: CubeFace;
  readonly bounds: NodeBounds;
  readonly level: number;
  readonly radius: number;

  children: QuadTreeNode[] | null = null;
  mesh: THREE.Mesh | null = null;

  private readonly parent: THREE.Object3D;
  private readonly tilePool: TilePool;
  private readonly tileResolution: number;

  /** 节点中心在球面上的3D坐标（缓存） */
  private _center: THREE.Vector3 | null = null;
  private _boundingSphere: THREE.Sphere | null = null;

  constructor(
    face: CubeFace,
    bounds: NodeBounds,
    level: number,
    radius: number,
    parent: THREE.Object3D,
    tilePool: TilePool,
    tileResolution: number,
  ) {
    this.face = face;
    this.bounds = bounds;
    this.level = level;
    this.radius = radius;
    this.parent = parent;
    this.tilePool = tilePool;
    this.tileResolution = tileResolution;
  }

  /** 获取节点中心的球面坐标 */
  get center(): THREE.Vector3 {
    if (!this._center) {
      const cx = this.bounds.x + this.bounds.size * 0.5;
      const cy = this.bounds.y + this.bounds.size * 0.5;
      this._center = cubeToSphere(this.face, cx, cy, this.radius);
    }
    return this._center;
  }

  /** 获取节点的包围球 */
  get boundingSphere(): THREE.Sphere {
    if (!this._boundingSphere) {
      // 粗略估算包围球半径：节点在球面上的弧长
      const radius = this.bounds.size * this.radius; 
      this._boundingSphere = new THREE.Sphere(this.center, radius);
    }
    return this._boundingSphere;
  }

  /** 判断是否为叶节点 */
  get isLeaf(): boolean {
    return this.children === null;
  }

  /** 根据相机距离判断是否应该细分 */
  shouldSplit(cameraPos: THREE.Vector3, splitFactor: number): boolean {
    const dist = this.center.distanceTo(cameraPos);
    // 节点在球面上的近似弧长
    const nodeArc = this.bounds.size * this.radius;
    return dist < nodeArc * splitFactor;
  }

  /** 根据相机距离判断是否应该合并 */
  shouldMerge(cameraPos: THREE.Vector3, splitFactor: number): boolean {
    const dist = this.center.distanceTo(cameraPos);
    const nodeArc = this.bounds.size * this.radius;
    // 使用 1.5 倍滞后因子防止频繁 split/merge 抖动
    return dist > nodeArc * splitFactor * 1.5;
  }

  /** 细分为4个子节点 */
  split(): void {
    if (this.children) return;

    // 移除当前叶节点的 mesh
    this.removeMesh();

    const half = this.bounds.size / 2;
    const { x, y } = this.bounds;
    const nextLevel = this.level + 1;

    const offsets: [number, number][] = [
      [x, y],                 // 左下
      [x + half, y],          // 右下
      [x, y + half],          // 左上
      [x + half, y + half],   // 右上
    ];

    this.children = offsets.map(
      ([ox, oy]) =>
        new QuadTreeNode(
          this.face,
          { x: ox, y: oy, size: half },
          nextLevel,
          this.radius,
          this.parent,
          this.tilePool,
          this.tileResolution,
        ),
    );

    // 为每个子节点创建 mesh
    for (const child of this.children) {
      child.createMesh();
    }
  }

  /** 合并：销毁所有子节点，恢复为叶节点 */
  merge(): void {
    if (!this.children) return;

    for (const child of this.children) {
      child.dispose();
    }
    this.children = null;

    // 恢复自身 mesh
    this.createMesh();
  }

  /** 创建该节点对应的地形 mesh */
  createMesh(): void {
    if (this.mesh) return;

    const tile = this.tilePool.acquire();
    const geometry = tile.geometry as THREE.BufferGeometry;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const uvAttr = geometry.getAttribute('uv') as THREE.BufferAttribute;
    const seg = this.tileResolution;

    for (let iy = 0; iy <= seg; iy++) {
      for (let ix = 0; ix <= seg; ix++) {
        const u = this.bounds.x + (ix / seg) * this.bounds.size;
        const v = this.bounds.y + (iy / seg) * this.bounds.size;
        const pos = cubeToSphere(this.face, u, v, this.radius);

        const idx = iy * (seg + 1) + ix;
        posAttr.setXYZ(idx, pos.x, pos.y, pos.z);

        // UV: 将 cube face 坐标映射到 0-1
        const uvx = (u + 1) / 2;
        const uvy = (v + 1) / 2;
        uvAttr.setXY(idx, uvx, uvy);
      }
    }

    posAttr.needsUpdate = true;
    uvAttr.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    this.mesh = tile;
    this.parent.add(tile);
  }

  /** 移除并回收 mesh */
  removeMesh(): void {
    if (!this.mesh) return;
    this.parent.remove(this.mesh);
    this.tilePool.release(this.mesh);
    this.mesh = null;
  }

  /** 递归销毁 */
  dispose(): void {
    if (this.children) {
      for (const child of this.children) {
        child.dispose();
      }
      this.children = null;
    }
    this.removeMesh();
  }
}

/** 将立方体面上的 (u, v) 坐标映射到球面 3D 坐标 */
export function cubeToSphere(
  face: CubeFace,
  u: number,
  v: number,
  radius: number,
): THREE.Vector3 {
  let x: number, y: number, z: number;

  switch (face) {
    case CubeFace.PosX: x =  1; y =  v; z = -u; break;
    case CubeFace.NegX: x = -1; y =  v; z =  u; break;
    case CubeFace.PosY: x =  u; y =  1; z = -v; break;
    case CubeFace.NegY: x =  u; y = -1; z =  v; break;
    case CubeFace.PosZ: x =  u; y =  v; z =  1; break;
    case CubeFace.NegZ: x = -u; y =  v; z = -1; break;
  }

  // Normalized cube → sphere 投影
  const x2 = x * x;
  const y2 = y * y;
  const z2 = z * z;
  const sx = x * Math.sqrt(1 - y2 / 2 - z2 / 2 + (y2 * z2) / 3);
  const sy = y * Math.sqrt(1 - z2 / 2 - x2 / 2 + (z2 * x2) / 3);
  const sz = z * Math.sqrt(1 - x2 / 2 - y2 / 2 + (x2 * y2) / 3);

  return new THREE.Vector3(sx * radius, sy * radius, sz * radius);
}
