import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (...segments: readonly string[]): string =>
  readFileSync(join(process.cwd(), ...segments), "utf8");

describe("V3 Builder route boundary", () => {
  it("keeps legacy AI and Three.js outside the shell while loading prices on demand", () => {
    const pageSource = readSource("src", "app", "builder", "page.tsx");
    const workspaceSource = readSource(
      "src",
      "features",
      "builder",
      "workspace",
      "BuilderWorkspace.tsx",
    );
    const routeSource = `${pageSource}\n${workspaceSource}`;

    expect(routeSource).not.toContain("AiAssistant");
    expect(routeSource).not.toContain("import { PriceComparisonDialog }");
    expect(workspaceSource).toContain('import("@/features/price/builder/PriceComparisonDialog")');
    expect(routeSource).not.toContain("PCViewer");
    expect(routeSource).not.toContain("@react-three/fiber");
    expect(routeSource).not.toContain("three/");
  });
});
