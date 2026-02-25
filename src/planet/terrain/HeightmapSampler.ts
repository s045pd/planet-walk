
export class HeightmapSampler {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private data: Uint8ClampedArray | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.context = ctx;
  }

  async load(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        this.width = img.width;
        this.height = img.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context.drawImage(img, 0, 0);
        this.data = this.context.getImageData(0, 0, this.width, this.height).data;
        resolve();
      };
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  }

  /**
   * Sample height at UV coordinates
   * @param u U coordinate (0-1)
   * @param v V coordinate (0-1)
   * @returns Height value (0-1)
   */
  sample(u: number, v: number): number {
    if (!this.data || this.width === 0 || this.height === 0) {
      return 0;
    }

    // Wrap UVs
    const x = Math.floor((u % 1 + 1) % 1 * (this.width - 1));
    const y = Math.floor((v % 1 + 1) % 1 * (this.height - 1));

    // Calculate index (R channel is enough for grayscale heightmaps)
    const index = (y * this.width + x) * 4;
    
    // Normalize to 0-1
    return this.data[index] / 255;
  }

  /**
   * Get the underlying image data
   */
  getImageData(): ImageData | null {
    if (!this.data) return null;
    return new ImageData(this.data as any, this.width, this.height);
  }
}
