# v0.5 调研报告 — 真实星球纹理与环境数据

**日期**: 2026-02-25
**调研人**: OpenClaw (CTO/PM，代替Gemini和Claude Code)

---

## 一、免费星球纹理资源

### 主要来源

| 来源 | 许可证 | 分辨率 | 说明 |
|------|--------|--------|------|
| Solar System Scope | CC BY 4.0 | 2K/8K | 基于NASA数据调色，equirectangular格式，最方便 |
| NASA Visible Earth | Public Domain | 最高21600px | Blue Marble系列，需要自己拼接/缩放 |
| Wikimedia Commons | 同上游许可 | 2K-8K | 托管了Solar System Scope的纹理 |

### 推荐方案：Solar System Scope 2K纹理（Web友好）

所有纹理均为equirectangular投影，可直接映射到Three.js SphereGeometry。

#### 地球纹理
| 类型 | URL | 分辨率 | 大小估算 |
|------|-----|--------|----------|
| Diffuse (日间) | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Solarsystemscope_texture_8k_earth_daymap.jpg/2048px-Solarsystemscope_texture_8k_earth_daymap.jpg` | 2K | ~500KB |
| Night Lights | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Solarsystemscope_texture_2k_earth_nightmap.jpg/2048px-Solarsystemscope_texture_2k_earth_nightmap.jpg` | 2K | ~300KB |
| Clouds | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Solarsystemscope_texture_2k_earth_clouds.jpg/2048px-Solarsystemscope_texture_2k_earth_clouds.jpg` | 2K | ~400KB |
| Normal Map | `https://upload.wikimedia.org/wikipedia/commons/thumb/6/sixty/Solarsystemscope_texture_2k_earth_normal.jpg/2048px-Solarsystemscope_texture_2k_earth_normal.jpg` | 2K | ~500KB |
| Specular/Ocean | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Solarsystemscope_texture_2k_earth_specular.jpg/2048px-Solarsystemscope_texture_2k_earth_specular.jpg` | 2K | ~200KB |

#### 火星纹理
| 类型 | URL | 分辨率 | 大小估算 |
|------|-----|--------|----------|
| Diffuse | `https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Solarsystemscope_texture_8k_mars.jpg/2048px-Solarsystemscope_texture_8k_mars.jpg` | 2K | ~500KB |
| Normal Map | 需从heightmap生成 | - | - |

#### 月球纹理
| 类型 | URL | 分辨率 | 大小估算 |
|------|-----|--------|----------|
| Diffuse | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Solarsystemscope_texture_2k_moon.jpg/2048px-Solarsystemscope_texture_2k_moon.jpg` | 2K | ~400KB |
| Normal Map | 需从heightmap生成 | - | - |

#### Heightmap来源（NASA原始数据）
- **地球**: NASA SRTM — `https://visibleearth.nasa.gov/images/73934` (Blue Marble topo+bathy)
- **火星**: MOLA — `https://astrogeology.usgs.gov/search/map/Mars/Topography/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp`
- **月球**: LRO LOLA — `https://astrogeology.usgs.gov/search/map/Moon/LRO/LOLA/Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014`

> **注意**: Heightmap需要下载后转换为equirectangular JPEG/PNG，缩放到2K。

---

## 二、各星球真实环境数据

### 地球
- **大气**: N2 78% + O2 21%，厚度~100km
- **天空颜色**: 蓝色（瑞利散射），日出日落橙红
- **天气类型**: 晴、多云、阴、小雨、大雨、雷暴、雪、雾、沙尘暴（沙漠地区）
- **云层**: 高度1-12km，覆盖率~67%，移动速度10-50km/h
- **风速**: 地面0-30m/s常见，极端>70m/s
- **温度**: -89°C（南极）到 57°C（沙漠），平均15°C
- **昼夜**: 24h周期，城市夜间有灯光

### 火星
- **大气**: CO2 95.3%，极稀薄（地球1%气压），厚度~11km
- **天空颜色**: 日间粉橙/黄褐色（悬浮尘埃散射），日落时蓝色（前向散射）
- **沙尘暴**: 局部暴频繁（直径几km），全球性大暴每火星年1-2次（持续数月，遮蔽全球）
- **温度**: -143°C（极地冬季）到 35°C（赤道夏季），平均-63°C
- **风速**: 通常2-7m/s，暴风时可达30m/s（但因气压低，体感力很弱）
- **CO2霜**: 极地冬季CO2凝结成干冰覆盖地表，春季升华
- **标志性地形**: 奥林匹斯山(21.9km高)、水手峡谷(4000km长/7km深)、塔尔西斯高原
- **昼夜**: 24h37min（sol）

### 月球
- **大气**: 几乎无（10^-12地球气压），技术上是真空
- **天空颜色**: 纯黑（无大气散射），白天也能看到星星
- **温度**: -173°C（夜间/阴影）到 127°C（日照），昼夜温差300°C
- **微陨石**: 每天约1吨物质撞击月表，大部分微小（<1mm），偶有可见闪光
- **月尘**: 极细（20-100μm），带静电，粘附性强，被脚步扬起后缓慢沉降（无空气阻力但有重力）
- **光照**: 无大气散射，阳光直射区极亮，阴影区极暗（对比度极高）
- **标志性地形**: 环形山（第谷、哥白尼）、月海（宁静海、风暴洋）、辐射纹
- **昼夜**: 29.5天周期（一个朔望月）
- **重力**: 1.62 m/s²（地球1/6）

---

## 三、Three.js技术实现方案

### 3.1 地形顶点位移
- 在vertex shader中采样heightmap，沿法线方向位移顶点
- `displacementMap` + `displacementScale` (MeshStandardMaterial内置支持)
- 球体细分数需足够高（128-256 segments），否则地形锯齿
- LOD方案：近处高细分，远处低细分（或使用自定义QuadTree球面）

### 3.2 Minimap
- 方案A：第二个正交相机从玩家正上方渲染到WebGLRenderTarget，作为HUD纹理
- 方案B：Canvas 2D绘制简化地图（采样diffuse纹理+绘制玩家位置箭头）
- 推荐方案B（性能更好，不需要额外渲染pass）

### 3.3 第三人称相机
- 球坐标跟随：以角色为中心，spherical coordinates控制距离/仰角/方位角
- 鼠标拖拽旋转视角，滚轮调整距离
- 碰撞检测：Raycaster从角色到相机，遇到地形则拉近
- 角色模型：CapsuleGeometry + 简单程序化动画（腿部摆动）

---

## 四、纹理下载脚本（供开发使用）

```bash
# 地球
mkdir -p public/assets/textures/earth
curl -L -o public/assets/textures/earth/diffuse.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Solarsystemscope_texture_8k_earth_daymap.jpg/2048px-Solarsystemscope_texture_8k_earth_daymap.jpg"
curl -L -o public/assets/textures/earth/night.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Solarsystemscope_texture_2k_earth_nightmap.jpg/2048px-Solarsystemscope_texture_2k_earth_nightmap.jpg"
curl -L -o public/assets/textures/earth/clouds.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Solarsystemscope_texture_2k_earth_clouds.jpg/2048px-Solarsystemscope_texture_2k_earth_clouds.jpg"
curl -L -o public/assets/textures/earth/specular.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Solarsystemscope_texture_2k_earth_specular.jpg/2048px-Solarsystemscope_texture_2k_earth_specular.jpg"

# 火星
mkdir -p public/assets/textures/mars
curl -L -o public/assets/textures/mars/diffuse.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Solarsystemscope_texture_8k_mars.jpg/2048px-Solarsystemscope_texture_8k_mars.jpg"

# 月球
mkdir -p public/assets/textures/moon
curl -L -o public/assets/textures/moon/diffuse.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Solarsystemscope_texture_2k_moon.jpg/2048px-Solarsystemscope_texture_2k_moon.jpg"
```

---

## 五、v0.5 Issue优先级建议

1. **#36 NASA纹理集成** — 最高优先级，视觉改善最大，工作量最小
2. **#37 地形系统** — 高优先级，降落体验核心
3. **#40 第三人称** — 中优先级，新视角模式
4. **#39 地图系统** — 中优先级，导航辅助
5. **#38 天气系统** — 较低优先级，工作量最大，可拆分到v0.6
