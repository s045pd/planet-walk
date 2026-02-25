import * as THREE from 'three';

type TextureImageSource = CanvasImageSource & {
  width?: number;
  height?: number;
  videoWidth?: number;
  videoHeight?: number;
};

interface TextureDimensions {
  width: number;
  height: number;
}

/** 从漫反射贴图提取亮度生成灰度高度图 */
export class HeightmapGenerator {
  static fromTexture(diffuseTexture: THREE.Texture): THREE.CanvasTexture | null {
    const source = diffuseTexture.image as TextureImageSource | undefined;
    if (!source) return null;

    const dimensions = this.getDimensions(source);
    if (!dimensions) return null;

    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = dimensions.width;
    srcCanvas.height = dimensions.height;
    const srcCtx = srcCanvas.getContext('2d');
    if (!srcCtx) return null;

    try {
      srcCtx.drawImage(source, 0, 0, dimensions.width, dimensions.height);
    } catch {
      return null;
    }

    const srcData = srcCtx.getImageData(0, 0, dimensions.width, dimensions.height).data;

    const heightCanvas = document.createElement('canvas');
    heightCanvas.width = dimensions.width;
    heightCanvas.height = dimensions.height;
    const heightCtx = heightCanvas.getContext('2d');
    if (!heightCtx) return null;

    const output = heightCtx.createImageData(dimensions.width, dimensions.height);
    for (let i = 0; i < srcData.length; i += 4) {
      const luminance = Math.round(
        srcData[i] * 0.2126 + srcData[i + 1] * 0.7152 + srcData[i + 2] * 0.0722,
      );
      output.data[i] = luminance;
      output.data[i + 1] = luminance;
      output.data[i + 2] = luminance;
      output.data[i + 3] = 255;
    }
    heightCtx.putImageData(output, 0, 0);

    const heightmap = new THREE.CanvasTexture(heightCanvas);
    this.copyTextureTransform(diffuseTexture, heightmap);
    heightmap.colorSpace = THREE.NoColorSpace;
    heightmap.needsUpdate = true;
    return heightmap;
  }

  private static getDimensions(source: TextureImageSource): TextureDimensions | null {
    const width = this.pickDimension(source.videoWidth, source.width);
    const height = this.pickDimension(source.videoHeight, source.height);
    if (width <= 0 || height <= 0) return null;
    return { width, height };
  }

  private static pickDimension(primary?: number, fallback?: number): number {
    if (typeof primary === 'number' && primary > 0) return primary;
    if (typeof fallback === 'number' && fallback > 0) return fallback;
    return 0;
  }

  private static copyTextureTransform(from: THREE.Texture, to: THREE.Texture): void {
    to.wrapS = from.wrapS;
    to.wrapT = from.wrapT;
    to.repeat.copy(from.repeat);
    to.offset.copy(from.offset);
    to.center.copy(from.center);
    to.rotation = from.rotation;
    to.flipY = from.flipY;
    to.minFilter = from.minFilter;
    to.magFilter = from.magFilter;
    to.generateMipmaps = from.generateMipmaps;
    to.anisotropy = from.anisotropy;
  }
}
