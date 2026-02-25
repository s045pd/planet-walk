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

