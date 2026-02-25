import * as THREE from 'three';
import type { IDisposable } from '../../core/types';
import { QuadTreeNode, CubeFace } from './QuadTreeNode';
import { TilePool } from './TilePool';
import { FrustumCuller } from '../../core/FrustumCuller';

export interface QuadTreeSphereConfig {
  radius: number;
  maxLevel: number;
  tileResolution: number;
  splitFactor?: number;
  material: THREE.Material;
}

/**
 * 四叉树球体LOD系统：6个立方体面映射到球面，
 * 根据相机距离动态细分/合并地形面片
 */
export class QuadTreeSphere implements IDisposable {
  readonly root: THREE.Group;
  private readonly faces: QuadTreeNode[] = [];
  private readonly tilePool: TilePool;
  private readonly maxLevel: number;
  private readonly splitFactor: number;
  private readonly frustumCuller: FrustumCuller;

  constructor(config: QuadTreeSphereConfig) {
    this.root = new THREE.Group();
    this.root.name = 'quadtree-sphere';
    this.maxLevel = config.maxLevel;
    this.splitFactor = config.splitFactor ?? 2.0;

    this.tilePool = new TilePool(config.material, config.tileResolution);
    this.frustumCuller = new FrustumCuller();

    // 创建6个根面节点
    const allFaces = [
      CubeFace.PosX, CubeFace.NegX,
      CubeFace.PosY, CubeFace.NegY,
      CubeFace.PosZ, CubeFace.NegZ,
    ];

    for (const face of allFaces) {
      const node = new QuadTreeNode(
        face,
        { x: -1, y: -1, size: 2 },
        0,
        config.radius,
        this.root,
        this.tilePool,
        config.tileResolution,
      );
      node.createMesh();
      this.faces.push(node);
    }
  }

  /** 每帧调用：根据相机位置更新四叉树LOD */
  update(camera: THREE.Camera): void {
    this.frustumCuller.update(camera);
    const cameraPosition = camera.position;

    for (const face of this.faces) {
      this.updateNode(face, cameraPosition);
    }
  }

  /** 递归更新节点：决定split或merge */
  private updateNode(node: QuadTreeNode, cameraPos: THREE.Vector3): void {
    // Frustum Culling
    const isVisible = this.frustumCuller.intersectsSphere(
      node.boundingSphere.center,
      node.boundingSphere.radius
    );

    if (node.mesh) {
      node.mesh.visible = isVisible;
    }

    if (!isVisible) {
      // 如果节点不可见，隐藏所有子节点并停止递归更新
      if (node.children) {
        this.setVisibleRecursive(node, false);
      }
      return;
    }

    if (node.isLeaf) {
      if (
        node.level < this.maxLevel &&
        node.shouldSplit(cameraPos, this.splitFactor)
      ) {
        node.split();
        // 递归更新新创建的子节点
        if (node.children) {
          for (const child of node.children) {
            this.updateNode(child, cameraPos);
          }
        }
      }
    } else {
      // 非叶节点：检查是否所有子节点都应该合并
      const allChildrenShouldMerge = node.children!.every(
        (child) => child.isLeaf && child.shouldMerge(cameraPos, this.splitFactor),
      );

      if (allChildrenShouldMerge) {
        node.merge();
      } else {
        // 继续递归更新子节点
        for (const child of node.children!) {
          this.updateNode(child, cameraPos);
        }
      }
    }
  }

  private setVisibleRecursive(node: QuadTreeNode, visible: boolean): void {
    if (node.mesh) {
      node.mesh.visible = visible;
    }
    if (node.children) {
      for (const child of node.children) {
        this.setVisibleRecursive(child, visible);
      }
    }
  }

  /** 获取当前活跃的叶节点数量 */
  get activeNodeCount(): number {
    let count = 0;
    const countLeaves = (node: QuadTreeNode): void => {
      if (node.isLeaf) {
        count++;
      } else if (node.children) {
        for (const child of node.children) {
          countLeaves(child);
        }
      }
    };
    for (const face of this.faces) {
      countLeaves(face);
    }
    return count;
  }

  dispose(): void {
    for (const face of this.faces) {
      face.dispose();
    }
    this.faces.length = 0;
    this.tilePool.dispose();
  }
}
