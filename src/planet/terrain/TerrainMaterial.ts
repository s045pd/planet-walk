import * as THREE from 'three';
import terrainVert from '../../shaders/terrain.vert?raw';
import terrainFrag from '../../shaders/terrain.frag?raw';

export interface TerrainMaterialParameters {
  diffuseMap: THREE.Texture;
  heightMap: THREE.Texture;
  heightScale?: number;
  color?: THREE.Color;
}

export class TerrainMaterial extends THREE.ShaderMaterial {
  constructor(params: TerrainMaterialParameters) {
    super({
      vertexShader: terrainVert,
      fragmentShader: terrainFrag,
      uniforms: {
        diffuseMap: { value: params.diffuseMap },
        heightMap: { value: params.heightMap },
        heightScale: { value: params.heightScale ?? 1.0 },
        color: { value: params.color ?? new THREE.Color(0xffffff) },
      },
      side: THREE.FrontSide,
    });
  }

  get heightScale(): number {
    return this.uniforms.heightScale.value;
  }

  set heightScale(value: number) {
    this.uniforms.heightScale.value = value;
  }
}
