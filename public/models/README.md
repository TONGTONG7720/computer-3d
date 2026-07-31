# PC LAB 3D model contract

The Engine V1.0 demo is fully runnable without binary assets and falls back to
procedural component geometry. Drop optimized GLB files into this directory to
activate the production asset stream:

- `cpu_i9_14900k.glb`
- `cpu_ultra9_285k.glb`
- `gpu_rtx5090.glb`
- `gpu_rtx5090_aurora.glb`

Production models should use Meshopt or Draco geometry compression, KTX2
textures, meter-based scale, centered pivots, and the `CMP_*`, `GEO_*`, and
`RGB_*` naming contract documented in `DESIGN.md`.
