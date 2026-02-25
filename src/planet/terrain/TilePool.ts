import * as THREE from 'three';
import type { IDisposable } from '../../core/types';

/**
 * 瓦片对象池：复用 PlaneGeometry mesh，避免频繁创建/销毁
 */
export class TilePool implements IDisposable {
  private readonly pool: THREE.Mesh[] = [];
  private readonly material: THREE.Material;
  private readonly segments: number;

  constructor(material: THREE.Material, segments: number = 16) {
    this.material = material;
    this.segments = segments;
  }

  /** 从池中获取一个 tile mesh，池空则新建 */
  acquire(): THREE.Mesh {
    if (this.pool.length > 0) {
      const mesh = this.pool.pop()!;
      mesh.visible = true;
      return mesh;
    }
    return this.createTile();
  }

  /** 归还 tile mesh 到池中 */
  release(mesh: THREE.Mesh): void {
    mesh.visible = false;
    this.pool.push(mesh);
  }

  /** 创建新的 tile mesh */
  private createTile(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(1, 1, this.segments, this.segments);
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.frustumCulled = true;
    return mesh;
  }

  /** 销毁池中所有 mesh */
  dispose(): void {
    for (const mesh of this.pool) {
      mesh.geometry.dispose();
    }
    this.pool.length = 0;
  }
}
