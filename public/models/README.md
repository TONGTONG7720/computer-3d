# PC LAB 3D production asset contract

The Builder is runnable without binary assets. `ModelRegistry` deliberately resolves the current
demo catalogue to procedural placeholders until a descriptor is explicitly registered with
`source: "glb"`. This prevents missing files from creating runtime 404s while keeping the real asset
pipeline ready.

## Directory and filename layout

```text
public/models/
├── cases/case_lianli_o11.glb
├── gpu/gpu_rtx5090_founder.glb
├── cpu/cpu_i9.glb
├── motherboard/motherboard_z790_atx.glb
├── ram/ram_ddr5.glb
├── storage/storage_nvme_4tb.glb
├── cooling/cooling_aio_360.glb
├── psu/psu_1200w.glb
└── decoders/
    ├── draco/
    └── basis/
```

Names are lowercase snake case. The first token is the component category. LOD variants append
`_lod1` and `_lod2` before `.glb`.

## Authoring rules

- glTF 2.0 binary (`.glb`), +Y up and +Z toward the case glass/front.
- Meter-like scale. The root pivot sits at the physical mounting contact point and local position,
  rotation, and scale are identity.
- Root nodes use `CMP_<CATEGORY>`. Renderable meshes use `GEO_*`. User-controlled emissive meshes
  use `RGB_*`.
- Geometry uses Draco or Meshopt. Repeated fans and screws share geometry/material instances.
- Textures use KTX2/Basis, power-of-two dimensions, 2K maximum for hero-visible desktop surfaces,
  and 1K for mobile tiers. Color textures are sRGB; data textures stay linear.
- Desktop hero parts target under 120k triangles each. Secondary parts target under 40k. Each asset
  provides at least one lower-detail LOD when the hero version exceeds 50k triangles.
- Export glass as a separate mesh. Do not bake RGB bloom or environment reflections into textures.

Place matching Three.js Draco and Basis decoder artifacts in `decoders/` for offline deployment.
The runtime paths are `/models/decoders/draco/` and `/models/decoders/basis/`.
