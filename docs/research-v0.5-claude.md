# v0.5 纹理与环境数据调研报告

> 调研人：Claude (首席架构师)
> 日期：2026-02-25
> 项目：planet-walk

---

## 目录

1. [免费星球纹理资源](#1-免费星球纹理资源)
2. [各星球真实环境数据](#2-各星球真实环境数据)
3. [Three.js 技术方案](#3-threejs-技术方案)
4. [总结与建议](#4-总结与建议)

---

## 1. 免费星球纹理资源

### 1.1 资源来源概览

| 来源 | 许可证 | 分辨率 | 特点 |
|------|--------|--------|------|
| [Solar System Scope](https://www.solarsystemscope.com/textures/) | CC BY 4.0 | 2K / 8K | 最全面，含 diffuse/normal/specular/night/clouds |
| [NASA Visible Earth](https://visibleearth.nasa.gov/) | 公共领域 (Public Domain) | 最高 43200×21600 | 地球专用，科学级精度 |
| [NASA SVS](https://svs.gsfc.nasa.gov/) | 公共领域 | 多种分辨率 | 月球 CGI Kit、地球 Black Marble |
| [USGS Astrogeology](https://astrogeology.usgs.gov/) | 公共领域 | 科学级 | 火星 MOLA DEM、月球 LOLA DEM |
| [Wikimedia Commons](https://commons.wikimedia.org/) | CC BY 4.0 | 2K / 8K | Solar System Scope 纹理镜像 |
| [Gumroad (downloadforfree)](https://downloadforfree.gumroad.com/) | CC BY 4.0 | 2K / 8K | Solar System Scope 打包下载 |

---

### 1.2 地球 (Earth) 纹理

#### Diffuse（漫反射/日间贴图）

| 资源 | 分辨率 | 格式 | 大小(约) | 许可证 | URL |
|------|--------|------|----------|--------|-----|
| Solar System Scope 2K | 2048×1024 | JPG | ~1.5 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg` |
| Solar System Scope 8K | 8192×4096 | JPG | ~15 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/8k_earth_daymap.jpg` |
| NASA Blue Marble (Next Gen) | 21600×10800 | JPG/TIFF | ~40 MB (JPG) | 公共领域 | [visibleearth.nasa.gov/images/57723](https://visibleearth.nasa.gov/images/57723/the-blue-marble) |
| NASA Blue Marble 超高分辨率 | 43200×21600 | JPG (分块) | ~数百 MB | 公共领域 | [h-schmidt.net/map](https://h-schmidt.net/map/) (拼接工具) |
| Wikimedia Commons | 8192×4096 | JPG | ~15 MB | CC BY 4.0 | [commons.wikimedia.org](https://commons.wikimedia.org/wiki/File:Whole_world_-_land_and_oceans.jpg) |

**推荐**: 开发阶段用 Solar System Scope 2K，发布版用 8K 或 NASA Blue Marble。

#### Clouds（云层贴图）

| 资源 | 分辨率 | 格式 | 大小(约) | 许可证 | URL |
|------|--------|------|----------|--------|-----|
| Solar System Scope 2K | 2048×1024 | JPG | ~0.8 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg` |
| Solar System Scope 8K | 8192×4096 | JPG | ~8 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/8k_earth_clouds.jpg` |

**说明**: 白色云层贴图，透明区域为黑色。在 Three.js 中作为独立球体层叠加，使用 `AdditiveBlending` 或 alpha 通道混合。

#### Night Lights（夜间灯光贴图）

| 资源 | 分辨率 | 格式 | 大小(约) | 许可证 | URL |
|------|--------|------|----------|--------|-----|
| Solar System Scope 2K | 2048×1024 | JPG | ~0.5 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg` |
| Solar System Scope 8K | 8192×4096 | JPG | ~5 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/8k_earth_nightmap.jpg` |
| NASA Black Marble 2016 | 13500×6750 (3km) | JPG/GeoTIFF | ~30 MB | 公共领域 | [visibleearth.nasa.gov/images/144898](https://www.visibleearth.nasa.gov/images/144898/earth-at-night-black-marble-2016-color-maps) |
| Wikimedia Commons 2K | 2048×1024 | JPG | ~0.5 MB | CC BY 4.0 | [commons.wikimedia.org](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_earth_nightmap.jpg) |

**说明**: 在着色器中根据太阳方向混合日间/夜间贴图。项目已有 `NightLights.ts` 模块。

#### Normal / Bump（法线/凹凸贴图）

| 资源 | 分辨率 | 格式 | 大小(约) | 许可证 | URL |
|------|--------|------|----------|--------|-----|
| Solar System Scope 2K | 2048×1024 | JPG | ~2 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/2k_earth_normal_map.tif` |
| Solar System Scope 8K | 8192×4096 | TIF | ~50 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/8k_earth_normal_map.tif` |
| Natural Earth III Bump | 16200×8100 | TIF | ~25 MB | 公共领域 | [shadedrelief.com/natural3/pages/extra.html](https://www.shadedrelief.com/natural3/pages/extra.html) |

**说明**: Normal map 提供表面微细节（山脉、海沟），不改变几何体。TIF 格式需转换为 JPG/PNG 供 Web 使用。

#### Specular / Ocean Mask（镜面反射/海洋遮罩）

| 资源 | 分辨率 | 格式 | 大小(约) | 许可证 | URL |
|------|--------|------|----------|--------|-----|
| Solar System Scope 2K | 2048×1024 | JPG | ~0.3 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/2k_earth_specular_map.tif` |
| Solar System Scope 8K | 8192×4096 | TIF | ~8 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/8k_earth_specular_map.tif` |

**说明**: 灰度图，白色=海洋（高反射），黑色=陆地（低反射）。用于 `MeshStandardMaterial.metalnessMap` 或自定义着色器中控制菲涅尔反射强度。项目已有 `OceanEffect.ts` 模块。

#### Heightmap（高度图）

| 资源 | 分辨率 | 格式 | 大小(约) | 许可证 | URL |
|------|--------|------|----------|--------|-----|
| NASA SRTM DEM | 21600×10800 | GeoTIFF | ~1.2 GB | 公共领域 | [earthdata.nasa.gov](https://www.earthdata.nasa.gov/) (需注册) |
| Natural Earth III DEM | 10800×5400 | TIF | ~55 MB | 公共领域 | [shadedrelief.com/natural3/pages/extra.html](https://www.shadedrelief.com/natural3/pages/extra.html) |
| Natural Earth III DEM (小) | 8640×4320 | TIF | ~35 MB | 公共领域 | 同上 |

**说明**: 灰度高度图用于顶点位移。NASA SRTM 数据精度最高但文件巨大，建议使用 Natural Earth III 的 DEM 并降采样到 4K/8K。需要从 GeoTIFF 转换为 16-bit PNG 供 WebGL 使用。

---

### 1.3 火星 (Mars) 纹理

#### Diffuse（漫反射贴图）

| 资源 | 分辨率 | 格式 | 大小(约) | 许可证 | URL |
|------|--------|------|----------|--------|-----|
| Solar System Scope 2K | 2048×1024 | JPG | ~1.2 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/2k_mars.jpg` |
| Solar System Scope 8K | 8192×4096 | JPG | ~12 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/8k_mars.jpg` |
| Wikimedia Commons 8K | 8192×4096 | JPG | ~12 MB | CC BY 4.0 | [commons.wikimedia.org](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_8k_mars.jpg) |

**推荐**: Solar System Scope 的火星纹理基于 Viking 探测器数据调色，色彩还原度高。

#### Normal / Bump（法线/凹凸贴图）

| 资源 | 分辨率 | 格式 | 大小(约) | 许可证 | URL |
|------|--------|------|----------|--------|-----|
| Solar System Scope 2K | 2048×1024 | TIF | ~3 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/2k_mars_normal_map.tif` |
| Solar System Scope 8K | 8192×4096 | TIF | ~50 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/8k_mars_normal_map.tif` |

**说明**: 火星表面细节丰富（环形山、峡谷），normal map 对视觉效果提升显著。

#### Heightmap（高度图 - MOLA 数据）

| 资源 | 分辨率 | 格式 | 大小(约) | 许可证 | URL |
|------|--------|------|----------|--------|-----|
| USGS MOLA DEM 463m | 23040×11520 | GeoTIFF | ~1 GB | 公共领域 | [astrogeology.usgs.gov](https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m) |
| MOLA Shaded Relief 463m | 23040×11520 | GeoTIFF | ~500 MB | 公共领域 | [astrogeology.usgs.gov](https://astrogeology.usgs.gov/search/map/mars_mgs_mola_global_color_shaded_relief_463m) |
| GMT Mars Relief 多分辨率 | 1080×540 ~ 4320×2160 | NetCDF/GeoTIFF | 373KB ~ 7.5MB | 公共领域 | [generic-mapping-tools.org](https://www.generic-mapping-tools.org/remote-datasets/mars-relief.html) |

**推荐**: GMT Mars Relief 提供多种分辨率选择，适合 Web 使用。建议下载 10 arc-minute 版本（3600×1800，~2.8 MB），转换为 16-bit PNG。MOLA 数据高程范围约 -8.2km 到 +21.2km（奥林匹斯山）。

---

### 1.4 月球 (Moon) 纹理

#### Diffuse（漫反射/颜色贴图）

| 资源 | 分辨率 | 格式 | 大小(约) | 许可证 | URL |
|------|--------|------|----------|--------|-----|
| Solar System Scope 2K | 2048×1024 | JPG | ~0.8 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/2k_moon.jpg` |
| Solar System Scope 8K | 8192×4096 | JPG | ~10 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/8k_moon.jpg` |
| NASA CGI Moon Kit 颜色图 | 多种 (最高 27360×13680) | TIFF/EXR | 数百 MB | 公共领域 | [svs.gsfc.nasa.gov/4720](https://svs.gsfc.nasa.gov/4720) |

**推荐**: NASA CGI Moon Kit 是目前最权威的月球纹理资源，基于 LRO 相机数据。开发阶段用 Solar System Scope 2K，发布版可用 CGI Moon Kit 的 4K TIFF。

#### Normal / Bump（法线/凹凸贴图）

| 资源 | 分辨率 | 格式 | 大小(约) | 许可证 | URL |
|------|--------|------|----------|--------|-----|
| Solar System Scope 2K | 2048×1024 | TIF | ~3 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/2k_moon_normal_map.tif` |
| Solar System Scope 8K | 8192×4096 | TIF | ~50 MB | CC BY 4.0 | `https://www.solarsystemscope.com/textures/download/8k_moon_normal_map.tif` |

**说明**: 月球环形山密布，normal map 对渲染效果至关重要。

#### Heightmap（高度图 - LRO LOLA 数据）

| 资源 | 分辨率 | 格式 | 大小(约) | 许可证 | URL |
|------|--------|------|----------|--------|-----|
| USGS LRO LOLA DEM 118m | 30720×15360 | GeoTIFF | ~1.8 GB | 公共领域 | [astrogeology.usgs.gov](https://astrogeology.usgs.gov/search/map/moon_lro_lola_dem_118m) |
| NASA CGI Moon Kit 位移图 | 多种 (最高 27360×13680) | TIFF/EXR | 数百 MB | 公共领域 | [svs.gsfc.nasa.gov/4720](https://svs.gsfc.nasa.gov/4720) |

**推荐**: NASA CGI Moon Kit 的位移图已经过处理，可直接用于 3D 渲染。LOLA 数据覆盖 70°N 到 70°S，极区因阴影缺失数据。建议下载 CGI Moon Kit 的中等分辨率 TIFF 并转换为 PNG。

---

### 1.5 纹理集成建议

#### 项目目录结构

```
public/assets/textures/
├── earth/
│   ├── diffuse.jpg          # 2K 日间贴图 (开发) / 8K (发布)
│   ├── clouds.jpg           # 2K 云层
│   ├── night.jpg            # 2K 夜间灯光
│   ├── normal.jpg           # 2K 法线图 (从 TIF 转换)
│   ├── specular.jpg         # 2K 海洋遮罩 (从 TIF 转换)
│   └── heightmap.png        # 4K 高度图 (16-bit PNG)
├── mars/
│   ├── diffuse.jpg          # 2K 漫反射
│   ├── normal.jpg           # 2K 法线图
│   └── heightmap.png        # 4K MOLA 高度图
└── moon/
    ├── diffuse.jpg          # 2K 漫反射
    ├── normal.jpg           # 2K 法线图
    └── heightmap.png        # 4K LOLA 高度图
```

#### 纹理格式转换工具链

```bash
# TIF → JPG (法线图/镜面图)
magick input.tif -quality 90 output.jpg

# GeoTIFF DEM → 16-bit PNG (高度图)
gdal_translate -of PNG -ot UInt16 -scale input.tif output.png

# 降采样到 4K
magick input.png -resize 4096x2048 output_4k.png
```

#### PlanetFactory 配置更新要点

当前项目 `PlanetFactory.ts` 已定义了纹理路径，但实际文件缺失（火星/月球目录仅有 `.gitkeep`）。需要：
1. 下载上述纹理并放入对应目录
2. 地球需新增 `cloudsPath`、`nightPath`、`specularPath` 到 `PlanetTextureConfig` 接口
3. 高度图建议统一使用 16-bit PNG 格式以获得更好的精度

---

## 2. 各星球真实环境数据

### 2.1 地球 (Earth)

#### 基本参数

| 参数 | 值 |
|------|-----|
| 赤道半径 | 6,371 km |
| 表面重力 | 9.81 m/s² (1g) |
| 自转周期 | 23h 56m 4s |
| 大气压 | 101.325 kPa (海平面) |
| 大气成分 | N₂ 78%, O₂ 21%, Ar 0.93%, CO₂ 0.04% |

#### 天空颜色

| 条件 | 颜色 (RGB 近似) | 原理 |
|------|-----------------|------|
| 晴天正午 | `#87CEEB` (天蓝) | Rayleigh 散射，短波长蓝光散射更强 |
| 日出/日落 | `#FF6B35` → `#FF4500` (橙红) | 光线穿过更厚大气层，蓝光被散射殆尽 |
| 阴天 | `#B0B0B0` (灰白) | 云层 Mie 散射，各波长均匀散射 |
| 夜晚 | `#0A0A2E` (深蓝黑) | 无直射阳光，仅星光和月光 |

#### 天气类型（可视化参考）

| 天气类型 | 视觉特征 | 粒子效果 | 能见度 |
|----------|----------|----------|--------|
| 晴天 | 蓝天白云，阳光明亮 | 无 | >10 km |
| 多云 | 灰白天空，光线柔和 | 无 | 5-10 km |
| 小雨 | 灰暗天空，雨滴粒子 | 雨滴下落 | 2-5 km |
| 暴风雨 | 深灰天空，闪电 | 密集雨滴+风 | <1 km |
| 雪 | 白灰天空，雪花飘落 | 雪花粒子 | 1-3 km |
| 雾 | 白色弥漫 | 体积雾 | <0.5 km |

#### 云层数据

| 云类型 | 高度 | 视觉特征 | 渲染建议 |
|--------|------|----------|----------|
| 积云 (Cumulus) | 2-6 km | 蓬松白色团状 | 体积云或 billboard 粒子 |
| 层云 (Stratus) | 0-2 km | 灰色均匀薄层 | 平面纹理层 |
| 卷云 (Cirrus) | 6-12 km | 白色丝状/羽毛状 | 高层半透明纹理 |
| 积雨云 (Cumulonimbus) | 2-16 km | 巨大塔状，暗底 | 体积云+闪电效果 |

**全球云量**: 平均约 67% 的地球表面被云覆盖。

#### 风速数据（蒲福风级参考）

| 等级 | 名称 | 风速 (m/s) | 视觉效果 |
|------|------|-----------|----------|
| 0-1 | 无风/软风 | 0-1.5 | 烟直上，树叶不动 |
| 2-3 | 轻风/微风 | 1.6-5.4 | 树叶沙沙，旗帜微展 |
| 4-5 | 和风/清风 | 5.5-10.7 | 小树摇摆，尘土飞扬 |
| 6-7 | 强风/疾风 | 10.8-17.1 | 大树摇动，行走困难 |
| 8-9 | 大风/烈风 | 17.2-24.4 | 树枝折断，屋瓦飞落 |
| 10-12 | 暴风/飓风 | >24.5 | 树木拔起，严重破坏 |

**渲染建议**: 云层贴图可通过缓慢旋转模拟风场效果，旋转速度约为地球自转的 1/3-1/2。项目已有 `CloudLayer.ts` 模块。

---

### 2.2 火星 (Mars)

#### 基本参数

| 参数 | 值 |
|------|-----|
| 赤道半径 | 3,389.5 km (地球的 53%) |
| 表面重力 | 3.72 m/s² (0.38g) |
| 自转周期 | 24h 37m 22s (sol) |
| 大气压 | 0.636 kPa (地球的 0.6%) |
| 大气成分 | CO₂ 95.3%, N₂ 2.7%, Ar 1.6%, O₂ 0.13% |
| 表面温度 | -143°C ~ +35°C (平均 -63°C) |

#### 大气与天空颜色

| 条件 | 颜色 (RGB 近似) | 原理 |
|------|-----------------|------|
| 白天晴朗 | `#C4A882` (奶油黄/焦糖色) | 悬浮氧化铁尘埃粒子 (~1.5-2μm) 的 Mie 散射，散射红/黄光 |
| 日出/日落 | `#4A6FA5` → `#6B8FC7` (蓝色光晕) | 尘埃粒子前向散射蓝光，与地球日落相反 |
| 沙尘暴期间 | `#8B6914` (暗黄褐) | 大量尘埃遮蔽阳光，能见度极低 |
| 天顶方向 | `#1A1A3E` (深蓝紫) | 大气极薄，接近太空黑色 |

**蓝色日落原理详解**:
火星大气中的尘埃粒子直径约 1.5-2 微米，恰好与可见光波长相当。这种尺寸的粒子产生 Mie 散射（而非地球大气分子的 Rayleigh 散射）。Mie 散射的特点是：
- 红光被均匀散射到各个方向
- 蓝光主要沿前向散射（小角度）
- 当太阳接近地平线时，蓝光在太阳周围形成光晕，而红光已被散射殆尽

#### 沙尘暴

| 类型 | 规模 | 持续时间 | 视觉效果 |
|------|------|----------|----------|
| 局部尘暴 | 数十~数百 km | 数天 | 局部能见度降低，天空变暗 |
| 区域尘暴 | 数千 km | 数周 | 大范围遮蔽，温度变化 |
| 全球尘暴 | 覆盖全球 | 数月 | 整个星球被尘埃笼罩，太阳几乎不可见 |

**关键数据**:
- 沙尘暴季节：南半球春/夏季（近日点附近）
- 尘埃粒子大小：~1.5 μm（氧化铁 Fe₂O₃）
- 全球尘暴约每 3 个火星年发生一次
- 尘暴期间光照可降低 99%

#### 风速

| 条件 | 风速 (m/s) | 说明 |
|------|-----------|------|
| 平静 | 2-7 | 日常微风，可扬起细尘 |
| 中等 | 7-15 | 尘卷风 (dust devil) 常见 |
| 强风 | 15-30 | 局部尘暴触发 |
| 极端 | 30-60 | 全球尘暴期间峰值 |

**注意**: 由于火星大气密度仅为地球的 ~1%，即使 60 m/s 的风速，其动压也仅相当于地球上 ~6 m/s 的微风。视觉上应表现为尘埃飘动而非猛烈吹袭。

#### 渲染建议

- **大气着色器**: 项目已有 `AtmosphereShader.ts`，需调整散射参数：Rayleigh 系数极低，Mie 系数较高，散射颜色偏红/橙
- **沙尘暴**: 项目已有 `DustStorm.ts`，可用粒子系统+后处理雾效实现
- **蓝色日落**: 在大气着色器中，当太阳角度低时增强蓝色前向散射分量
- **天空渐变**: 从地平线的奶油黄渐变到天顶的深蓝紫

---

### 2.3 月球 (Moon)

#### 基本参数

| 参数 | 值 |
|------|-----|
| 赤道半径 | 1,737.4 km (地球的 27%) |
| 表面重力 | 1.62 m/s² (0.165g) |
| 自转周期 | 27.3 天 (潮汐锁定) |
| 大气压 | ~3×10⁻¹⁵ kPa (近乎真空) |
| 大气成分 | 极微量 He, Ne, Ar, Na, K |

#### 温度

| 条件 | 温度 | 说明 |
|------|------|------|
| 白天赤道 | +127°C (~400K) | 太阳直射，无大气缓冲 |
| 夜晚赤道 | -173°C (~100K) | 无大气保温，热量快速辐射 |
| 极区永久阴影坑 | -248°C (~25K) | 太阳系最冷区域之一 |
| 日出/日落过渡 | 急剧变化 | 数分钟内温差可达 200°C+ |

**昼夜周期**: 约 14 个地球日的白天 + 14 个地球日的黑夜。

#### 微陨石 (Micrometeorites)

| 参数 | 值 |
|------|-----|
| 撞击速率 | ~1 吨/天（整个月球表面） |
| 典型速度 | 10-72 km/s |
| 典型大小 | 微米级 ~ 毫米级 |
| 撞击效果 | 产生闪光、溅射月尘、形成微型环形山 |
| 可视化建议 | 随机闪光粒子效果，项目已有 `MicroImpact.ts` |

#### 月尘 (Lunar Regolith)

| 参数 | 值 |
|------|-----|
| 表层厚度 | 2-15 m（月海较薄，高地较厚） |
| 粒径 | 中位数 ~60-80 μm（极细粉末） |
| 颜色 | 深灰色（月海）/ 浅灰色（高地） |
| 特性 | 高度磨蚀性、静电吸附、低热导率 |
| 反照率 | 0.07-0.12（非常暗，类似沥青） |

**渲染要点**:
- 月球表面比照片看起来暗得多，反照率仅 7-12%
- 月尘在阳光下呈现微妙的棕灰色调
- 脚印效果：月尘无水分但因静电可保持形状数百万年

#### 光照条件

| 条件 | 特征 | 渲染参考 |
|------|------|----------|
| 直射阳光 | 极强烈，无大气散射衰减 | 高对比度硬阴影，无环境光遮蔽 |
| 阴影区 | 完全漆黑（无大气散射补光） | 阴影内仅有地球反照微光 |
| 地球照 | 地球反射光照亮月球夜面 | 微弱蓝色调补光 |
| 天空 | 永远漆黑，可见星星和太阳 | 背景纯黑 `#000000`，无天空渐变 |

#### 渲染建议

- **光照模型**: 纯方向光（太阳），无环境光或极微弱环境光。阴影边缘锐利无过渡
- **天空盒**: 纯黑背景+星空纹理，无大气散射效果
- **表面材质**: 低反照率（0.07-0.12），高粗糙度，无金属感
- **对冲效应 (Opposition Effect)**: 月球表面在太阳正对面方向（零相角）亮度突增，可在着色器中模拟
- **地球可见**: 月球表面可看到地球悬挂在天空中（潮汐锁定，位置固定）

---

## 3. Three.js 技术方案

### 3.1 地形顶点位移最佳实践

