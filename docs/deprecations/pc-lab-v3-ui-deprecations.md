# PC LAB 3D V3 UI deprecation map

V3 changes the public runtime entry without deleting earlier work. The modules below stay
compilable and recoverable until their domain logic is migrated into the stable V3 workspace.

| Legacy surface | Status | V3 replacement / boundary |
|---|---|---|
| `src/features/engine/EnginePageClient.tsx` | Deprecated | `/builder` renders `BuilderWorkspace` |
| `src/features/engine/EngineDemo.tsx` | Deprecated | V3 AppShell + later Viewer integration |
| `src/features/builder/components/ComponentSelector.tsx` | Deprecated | `features/hardware/HardwareLibrary` |
| `src/features/builder/components/BuildSummary.tsx` | Deprecated | `features/build/BuildPanel` |
| `src/features/ai/assistant/AiAssistant.tsx` | Deferred from public runtime | No AI chat in V3 Builder |
| `src/features/price/builder/PriceComparisonDialog.tsx` | Deferred from public runtime | Price integration returns in a later phase |
| `/admin/ai` and `/admin/prices` | Retained, unlinked | Operational routes remain available by direct URL |

Community routes are not present in the current frontend and no Community surface is introduced.
Legacy files must not be imported from `src/app/builder/page.tsx` or the V3 workspace tree.
