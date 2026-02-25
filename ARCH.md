# 星球漫步 (Planet Walk) — 技术架构设计文档

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈选型](#2-技术栈选型)
3. [目录结构](#3-目录结构)
4. [核心模块设计](#4-核心模块设计)
5. [数据流架构](#5-数据流架构)
6. [星球数据方案](#6-星球数据方案)
7. [性能优化策略](#7-性能优化策略)
8. [开发路线图](#8-开发路线图)

---

## 1. 项目概述

"星球漫步"是一个基于 Web 的 3D 星球探索应用，用户可以在地球、火星、月球的真实地形上进行第一人称漫步。项目使用 NASA 真实数据驱动地形渲染，结合球体引力系统和 LOD 地形细分，在浏览器中实现沉浸式的星球探索体验。

### 1.1 核心体验目标

- 从太空视角无缝过渡到地表第一人称漫步
- 基于 NASA 真实高程数据的地形渲染
- 符合物理直觉的球体引力行走
- 多星球自由切换（地球 / 火星 / 月球）

---

## 2. 技术栈选型

| 层级 | 技术 | 版本要求 | 选型理由 |
| :--- | :--- | :--- | :--- |
| 渲染引擎 | Three.js | r160+ | WebGL 生态最成熟，社区资源丰富 |
| 开发语言 | TypeScript | 5.x | 类型安全，大型项目可维护性 |
| 构建工具 | Vite | 5.x | HMR 快速，原生 ESM，大资源处理优秀 |
| 物理引擎 | Rapier (dimforge/rapier) | 0.12+ | WASM 性能优于 Cannon-es，支持自定义重力 |
| 状态管理 | Zustand | 4.x | 轻量，与 Three.js 生态（R3F）兼容好 |
| Shader 语言 | GLSL 3.0 (ES) | — | Three.js 原生支持，自定义地形/大气着色器 |
| 资源加载 | Three.js Loaders + Custom Tile Loader | — | 支持渐进式纹理加载 |

### 2.1 未选方案说明

| 备选方案 | 未选原因 |
| :--- | :--- |
| Babylon.js | 包体积更大，社区生态不如 Three.js 丰富 |
| Cannon-es | 纯 JS 实现，大量碰撞检测时性能不足 |
| React Three Fiber | 增加抽象层，对底层 Shader 和渲染管线控制不够直接 |
| Ammo.js (Bullet) | API 复杂，WASM 编译体积大，球体重力需大量自定义 |

---

## 3. 目录结构

```
planet-walk/
├── public/
│   └── assets/
│       ├── textures/              # 星球纹理资源（构建时不处理）
│       │   ├── earth/
│       │   │   ├── diffuse/       # Blue Marble 漫反射贴图（分瓦片）
│       │   │   ├── normal/        # 法线贴图
│       │   │   ├── specular/      # 高光贴图（海洋反射）
│       │   │   ├── heightmap/     # DEM 高程瓦片
│       │   │   ├── night/         # 夜景灯光贴图
│       │   │   └── clouds.png     # 云层贴图
│       │   ├── mars/
│       │   │   ├── diffuse/
│       │   │   ├── normal/
│       │   │   └── heightmap/
│       │   └── moon/
│       │       ├── diffuse/
│       │       ├── normal/
│       │       └── heightmap/
│       ├── skybox/                # 星空天空盒
│       └── models/                # 地表装饰模型（岩石、探测器等）
├── src/
│   ├── main.ts                    # 应用入口
│   ├── App.ts                     # 应用主控制器
│   ├── core/                      # 核心引擎层
│   │   ├── Engine.ts              # Three.js 渲染器封装
│   │   ├── Scene.ts               # 场景管理
│   │   ├── Camera.ts              # 相机系统（轨道 + 第一人称）
│   │   ├── Clock.ts               # 帧时钟与 delta 管理
│   │   └── InputManager.ts        # 键鼠/触屏输入统一抽象
│   ├── planet/                    # 星球系统
│   │   ├── Planet.ts              # 星球基类
│   │   ├── PlanetConfig.ts        # 星球配置（半径、重力、纹理路径等）
│   │   ├── PlanetFactory.ts       # 星球工厂，按配置创建实例
│   │   ├── terrain/
│   │   │   ├── QuadTreeSphere.ts  # 四叉树球体 LOD 核心
│   │   │   ├── TerrainChunk.ts    # 地形块（单个四叉树节点的 Mesh）
│   │   │   ├── TerrainMaterial.ts # 地形着色器材质
│   │   │   └── HeightmapSampler.ts# 高程数据采样器
│   │   ├── atmosphere/
│   │   │   ├── Atmosphere.ts      # 大气层管理
│   │   │   └── AtmosphereShader.ts# 瑞利/米氏散射 Shader
│   │   └── surface/
│   │       ├── SurfaceDecorator.ts# 地表装饰物生成（岩石、陨石坑）
│   │       └── ProceduralDetail.ts# 近距离程序化细节填充
│   ├── player/                    # 玩家系统
│   │   ├── PlayerController.ts    # 第一人称控制器主逻辑
│   │   ├── SphericalGravity.ts    # 球体引力计算
│   │   ├── CollisionDetector.ts   # 地形碰撞检测
│   │   └── PlayerState.ts         # 玩家状态（位置、朝向、速度）
│   ├── camera/                    # 相机控制
│   │   ├── OrbitMode.ts           # 轨道观察模式
│   │   ├── FirstPersonMode.ts     # 第一人称漫步模式
│   │   └── TransitionController.ts# 太空→地表相机过渡动画
│   ├── loader/                    # 资源加载
│   │   ├── AssetManager.ts        # 统一资源管理器
│   │   ├── TileLoader.ts          # 瓦片式纹理/高程加载
│   │   ├── TexturePool.ts         # 纹理缓存池（LRU）
│   │   └── WorkerPool.ts          # Web Worker 池（高程解码）
│   ├── ui/                        # 2D UI 层
│   │   ├── HUD.ts                 # 抬头显示（坐标、海拔、星球名）
│   │   ├── PlanetSelector.ts      # 星球切换面板
│   │   ├── LoadingScreen.ts       # 加载进度界面
│   │   └── MiniMap.ts             # 小地图
│   ├── store/                     # 状态管理
│   │   └── useStore.ts            # Zustand 全局状态
│   ├── utils/                     # 工具函数
│   │   ├── math.ts                # 球面坐标转换、四元数工具
│   │   ├── geo.ts                 # 经纬度 ↔ 3D 坐标转换
│   │   └── constants.ts           # 全局常量（星球参数、物理常数）
│   ├── workers/                   # Web Workers
│   │   ├── heightmapDecoder.worker.ts  # 高程图解码
│   │   └── terrainMesh.worker.ts       # 地形网格生成
│   └── shaders/                   # GLSL 着色器
│       ├── terrain.vert           # 地形顶点着色器（高程位移）
│       ├── terrain.frag           # 地形片元着色器（多纹理混合）
│       ├── atmosphere.vert        # 大气顶点着色器
│       └── atmosphere.frag        # 大气片元着色器（散射计算）
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. 核心模块设计

### 4.1 渲染引擎层 (`core/`)

`Engine.ts` 是整个应用的渲染基座，负责 Three.js 渲染器的初始化和主循环管理。

```typescript
// Engine.ts 核心接口
interface EngineConfig {
  canvas: HTMLCanvasElement;
  antialias: boolean;
  logarithmicDepthBuffer: true;  // 必须开启，解决星球尺度 Z-fighting
  pixelRatio: number;
}

class Engine {
  renderer: THREE.WebGLRenderer;
  private systems: IUpdatable[];  // 所有需要每帧更新的子系统

  // 主循环：requestAnimationFrame 驱动
  tick(delta: number): void {
    for (const system of this.systems) {
      system.update(delta);
    }
    this.renderer.render(scene, camera);
  }
}
```

关键设计决策：
- 开启 `logarithmicDepthBuffer`：解决星球尺度（数百km）与人物尺度（~2m）共存时的深度精度问题
- 渲染器使用 `WebGLRenderer`，不使用 `WebGPURenderer`（兼容性优先）
- 主循环采用 ECS-like 的 `IUpdatable` 接口，所有子系统注册后统一调度

### 4.2 四叉树球体 LOD 系统 (`planet/terrain/`)

这是整个项目最核心的模块，决定了渲染质量和性能的平衡。

#### 原理

将球体的 6 个面（Cube Sphere 映射）各自作为一棵四叉树的根节点。根据相机距离动态细分/合并节点，近处高精度、远处低精度。

```
        ┌─────────────┐
        │  CubeFace    │  × 6 个面
        │  (根节点)     │
        └──────┬──────┘
               │ 细分条件：distance < threshold
        ┌──────┼──────┐
        │      │      │
       ┌┴┐   ┌┴┐   ┌┴┐   ┌┐
       │ │   │ │   │ │   ││  ← 4 个子节点
       └┬┘   └─┘   └─┘   └┘
        │ 继续细分...
     ┌──┼──┐
     │  │  │
    ┌┴┐┌┴┐┌┴┐┌┐
    │ ││ ││ │││   ← 最大深度 MAX_LOD_LEVEL
    └─┘└─┘└─┘└┘
```

#### 核心类设计

```typescript
// QuadTreeSphere.ts
class QuadTreeSphere {
  private faces: QuadTreeNode[];  // 6 个根面
  readonly maxLevel: number = 15; // 最大细分层级
  readonly splitDistance: number; // 细分触发距离系数

  // 每帧调用：根据相机位置更新四叉树
  update(cameraPosition: THREE.Vector3): void {
    for (const face of this.faces) {
      this.updateNode(face, cameraPosition);
    }
  }

  private updateNode(node: QuadTreeNode, cam: THREE.Vector3): void {
    const dist = node.boundingSphere.distanceToPoint(cam);
    if (dist < this.splitDistance * node.size && node.level < this.maxLevel) {
      node.split();       // 细分为 4 个子节点
      node.children.forEach(c => this.updateNode(c, cam));
    } else if (dist > this.splitDistance * node.size * 1.5) {
      node.merge();       // 合并回父节点
    }
  }
}

// TerrainChunk.ts — 单个四叉树叶节点对应的可渲染 Mesh
class TerrainChunk {
  mesh: THREE.Mesh;
  readonly gridResolution: number = 33; // 每块 33×33 顶点网格

  // 从 Cube 坐标映射到球面坐标（归一化后投影到球面）
  buildGeometry(face: CubeFace, bounds: AABB2D, heightData: Float32Array): void;

  // 应用高程位移
  applyHeightmap(sampler: HeightmapSampler): void;
}
```

#### Cube-to-Sphere 映射

使用 Normalized Cube 方法将立方体面投影到球面，避免极点处的纹理拉伸：

```
Cube坐标 (u, v, face) → 归一化立方体点 → 球面投影 → 乘以 (radius + height)
```

### 4.3 球体引力系统 (`player/SphericalGravity.ts`)

传统 FPS 游戏的重力是固定的 `(0, -9.8, 0)` 向下。在球体表面，"下"的方向随位置变化，始终指向球心。

#### 核心算法

```typescript
class SphericalGravity {
  private planetCenter: THREE.Vector3;
  private gravityStrength: number;  // 各星球不同：地球 9.8, 火星 3.72, 月球 1.62

  // 计算当前位置的重力方向和大小
  getGravity(playerPosition: THREE.Vector3): THREE.Vector3 {
    const direction = new THREE.Vector3()
      .subVectors(this.planetCenter, playerPosition)
      .normalize();
    return direction.multiplyScalar(this.gravityStrength);
  }

  // 对齐玩家的 "up" 向量到球面法线
  alignToSurface(player: THREE.Object3D): void {
    const surfaceNormal = new THREE.Vector3()
      .subVectors(player.position, this.planetCenter)
      .normalize();

    // 使用四元数平滑旋转，避免万向锁
    const targetQuat = new THREE.Quaternion()
      .setFromUnitVectors(player.up, surfaceNormal);
    player.quaternion.slerp(
      player.quaternion.clone().premultiply(targetQuat),
      0.1  // 平滑因子，防止突变
    );
    player.up.copy(surfaceNormal);
  }
}
```

#### 各星球引力参数

| 星球 | 表面重力 (m/s²) | 模型半径 (单位) | 逃逸速度比 |
| :--- | :--- | :--- | :--- |
| 地球 | 9.81 | 1000 | 1.0 |
| 火星 | 3.72 | 532 | 0.38 |
| 月球 | 1.62 | 272 | 0.17 |

> 注：模型半径非真实比例，按视觉体验和性能平衡缩放。

### 4.4 第一人称控制器 (`player/PlayerController.ts`)

球面上的第一人称控制不能直接使用 Three.js 的 `PointerLockControls`，因为它假设 Y 轴永远朝上。需要自定义控制器，在局部坐标系中处理移动和视角旋转。

```typescript
class PlayerController implements IUpdatable {
  private gravity: SphericalGravity;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private onGround: boolean = false;
  private moveSpeed: number = 5;    // m/s
  private jumpForce: number = 4;

  update(delta: number): void {
    // 1. 读取输入（WASD + 鼠标）
    const input = InputManager.getMovement();

    // 2. 将输入转换到玩家局部坐标系（相对于球面法线）
    const forward = this.camera.getWorldDirection(new THREE.Vector3());
    const right = forward.clone().cross(this.player.up).normalize();
    const localForward = forward.projectOnPlane(this.player.up).normalize();

    // 3. 施加移动力
    this.velocity.add(localForward.multiplyScalar(input.z * this.moveSpeed));
    this.velocity.add(right.multiplyScalar(input.x * this.moveSpeed));

    // 4. 施加引力
    this.velocity.add(this.gravity.getGravity(this.player.position).multiplyScalar(delta));

    // 5. 碰撞检测 & 地面约束
    this.resolveCollision();

    // 6. 更新位置
    this.player.position.add(this.velocity.clone().multiplyScalar(delta));

    // 7. 对齐到球面
    this.gravity.alignToSurface(this.player);
  }
}
```

### 4.5 相机系统 (`camera/`)

支持两种模式无缝切换：

| 模式 | 触发条件 | 行为 |
| :--- | :--- | :--- |
| OrbitMode | 太空视角（距地表 > 阈值） | 围绕星球旋转，鼠标滚轮缩放 |
| FirstPersonMode | 着陆后（距地表 < 阈值） | 锁定鼠标，WASD 移动，视角跟随玩家 |

```typescript
// TransitionController.ts — 太空→地表的过渡
class TransitionController {
  // 从轨道模式平滑过渡到第一人称
  async transitionToSurface(
    targetLatLng: { lat: number; lng: number },
    duration: number = 3000
  ): Promise<void> {
    // 1. 计算目标点的球面 3D 坐标
    const targetPos = geoToCartesian(targetLatLng, planet.radius);

    // 2. 使用 GSAP 或自定义 tween 插值相机位置
    //    轨迹：当前位置 → 大气层边缘 → 地表上方 2m
    await this.animateAlongPath([
      this.camera.position.clone(),
      targetPos.clone().multiplyScalar(1.02),  // 大气层
      targetPos.clone().add(surfaceNormal.multiplyScalar(2)), // 地表 2m
    ]);

    // 3. 切换控制模式
    this.cameraManager.switchTo('firstPerson');
  }
}
```

### 4.6 多星球系统 (`planet/`)

通过配置驱动的工厂模式支持多星球切换，新增星球只需添加配置文件和资源。

```typescript
// PlanetConfig.ts
interface PlanetConfig {
  id: string;                    // 'earth' | 'mars' | 'moon'
  name: string;                  // 显示名称
  radius: number;                // 模型半径（单位）
  gravity: number;               // 表面重力加速度
  hasAtmosphere: boolean;        // 是否渲染大气层
  atmosphereColor?: THREE.Color; // 大气散射主色调
  rotationSpeed: number;         // 自转速度 (rad/s)
  textures: {
    diffuse: string;             // 漫反射贴图路径模板
    normal: string;
    heightmap: string;
    specular?: string;           // 地球特有：海洋高光
    night?: string;              // 地球特有：夜景
    clouds?: string;             // 地球特有：云层
  };
  terrain: {
    heightScale: number;         // 高程缩放系数
    maxLodLevel: number;         // 最大 LOD 层级
    tileResolution: number;      // 瓦片分辨率
  };
  landmarks: LandmarkDef[];      // 预设兴趣点（着陆点）
}
```

#### 预设星球配置

```typescript
// 地球配置示例
const EARTH_CONFIG: PlanetConfig = {
  id: 'earth',
  name: '地球',
  radius: 1000,
  gravity: 9.81,
  hasAtmosphere: true,
  atmosphereColor: new THREE.Color(0.3, 0.6, 1.0),
  rotationSpeed: 0.0001,
  textures: {
    diffuse: '/assets/textures/earth/diffuse/{z}/{x}_{y}.jpg',
    normal: '/assets/textures/earth/normal/{z}/{x}_{y}.jpg',
    heightmap: '/assets/textures/earth/heightmap/{z}/{x}_{y}.png',
    specular: '/assets/textures/earth/specular.jpg',
    night: '/assets/textures/earth/night/{z}/{x}_{y}.jpg',
    clouds: '/assets/textures/earth/clouds.png',
  },
  terrain: { heightScale: 15, maxLodLevel: 15, tileResolution: 256 },
  landmarks: [
    { name: '珠穆朗玛峰', lat: 27.9881, lng: 86.9250 },
    { name: '大峡谷', lat: 36.1069, lng: -112.1129 },
  ],
};
```
