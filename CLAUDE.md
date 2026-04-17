# Planet Walk — Project Guide

Browser-based 3D planetary walking simulator. Five worlds (Terra / Mars / Luna / Venus / Europa) rendered with Three.js; SpaceX-webcast-style mission console HUD.

## Stack
- **Runtime**: Three.js `r0.183` + TypeScript `5.9` + Vite `7.3`
- **State**: Plain classes, no framework. Dependencies: `three`, `zustand` (loaded, unused).
- **No remote CDN / fonts**: uses system mono + sans stacks.
- **No network textures**: all surfaces procedural (fbm noise + biomes).

## Source layout (`src/`, all files <300 lines)
```
main.ts                       entry
App.ts                        orchestrator
core/{Engine,Input,types}.ts  renderer loop + input + shared types
planet/{Planet,shaders,PlanetConfigs}.ts
                              orbit-view sphere + atmosphere + 5 world defs
player/{Player,OrbitCamera}.ts
                              spherical gravity + first-person + orbit drag
surface/{Noise,Biomes,Terrain,Sky,Dust,SurfaceScene}.ts
                              planar ground scene (fbm terrain + sky dome + fog + particles)
ui/{HUD,TopBar,Phase,RightPanel,Telemetry,WorldSelect,hud.css}.ts
                              SpaceX-style HUD widgets
utils/math.ts                 vector / lat-lon helpers
```

## Local dev
```bash
npm install
npm run dev          # vite, opens /planet-walk/
npm run build        # typecheck + bundle to dist/
```

## GitHub Pages deployment

**Public URL:** https://s045pd.github.io/planet-walk/

**Production branch setup (one-time in GitHub repo settings):**
- Settings → Pages → Source: `Deploy from a branch`
- Branch: `gh-pages` / root

**Auto-deploy (CI):** `.github/workflows/deploy.yml` runs on push to `main` or `dev`, builds, and publishes `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`.

**⚠️ Deploy checklist whenever main/dev moves:**
1. Push/merge to `main` (or `dev`) — the workflow fires automatically.
2. Verify the `Deploy to GitHub Pages` action succeeded in the Actions tab.
3. Hard-reload https://s045pd.github.io/planet-walk/ to confirm the new build ships.
4. If the action failed, fix the cause and either re-run it or merge a follow-up commit. Do **not** skip — the live site lags until this green-lights.

**Manual fallback:** `npm run deploy` (uses `gh-pages` npm package; pushes local `dist/` to the `gh-pages` branch).

Never commit `dist/` to `main`/`dev` — it lives only on the `gh-pages` branch.

## Architecture notes

- **Two scenes in one Three.js Scene graph**: `planet.root` + `starfield` render for orbit mode; `surface.root` (terrain + sky + dust + lights) renders for surface mode. Visibility toggled on mode switch.
- **Player has two coordinate systems**: spherical (orbit) aligns `up` to planet center; planar (surface) fixes `up = (0, 1, 0)` and uses `SurfaceScene.getHeightAt(x, z)` for ground collision. `Player.enterSurface(scene)` / `exitSurface()` switch modes.
- **PlanetConfigs is the single source of truth**: every world defines `radius`, `gravity`, `atmosphereColor`, `surface` (orbit shader palette), `sky` (horizon gradient), `surfacePalette` (biomes + dust + sun + ambient), and `landingSite`. Adding a new world = one entry here + nothing else.
- **Vite `base: '/planet-walk/'`**: required for GitHub Pages subpath — do not remove without updating the Pages URL strategy.

## Gotchas / things future edits should know

- Three `ShaderMaterial` fragment shader does not auto-inject `modelMatrix`. Use `varying vec3 vWorldPos` passed from vertex shader (see `planet/shaders.ts`).
- `SurfaceScene.activate()` sets `scene.fog` and `scene.background` — it stashes the previous values on `deactivate()`, so orbit-view stars stay visible.
- Landing animation is a 1.7s setTimeout in `App.startLanding()`. If you tween the camera differently, keep the timer in sync.
- `HUD` root has `pointer-events: none`; individual widgets opt-in via `data-ui` attribute. OrbitCamera pointer-drag is ignored while mouse is over a `data-ui` element.

## Non-goals (intentionally excluded from current scope)
- NASA-tile streaming / real DEM heightmaps
- Audio, achievements, i18n, weather (previous iteration had these; removed as scope bloat)
- Mobile/touch controls
- Quadtree LOD (single-mesh sphere + single 900×900 terrain plane is enough at current camera range)

## References
- `references/A..D-*.svg` — design-direction mocks from the rebuild brainstorm. `D-spacex-webcast.svg` is the current HUD target.
