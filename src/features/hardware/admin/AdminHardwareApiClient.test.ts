import ky from "ky";
import { describe, expect, it } from "vitest";
import { fetchAdminHardware } from "./AdminHardwareApiClient";

describe("AdminHardwareApiClient", () => {
  it("keeps the Admin Key in the request header and out of the URL", async () => {
    let requestedUrl = "";
    let receivedKey: string | null = null;
    const client = ky.create({
      prefix: "https://pc-lab.test/api",
      fetch: async (input, init) => {
        const request = new Request(input, init);
        requestedUrl = request.url;
        receivedKey = request.headers.get("X-Admin-Key");
        return new Response(
          JSON.stringify({
            code: "OK",
            data: [
              {
                id: 1,
                hardwareKey: "gpu-nvidia-rtx5090",
                name: "NVIDIA RTX 5090",
                brand: "NVIDIA",
                category: "GPU",
                price: 15999,
                performance: 100,
                power: 575,
                status: "ACTIVE",
                version: 1,
              },
            ],
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    });

    const records = await fetchAdminHardware(
      "session-secret",
      { keyword: "RTX", category: "GPU" },
      client,
    );

    expect(records[0]?.hardwareKey).toBe("gpu-nvidia-rtx5090");
    expect(receivedKey).toBe("session-secret");
    expect(requestedUrl).toContain("keyword=RTX");
    expect(requestedUrl).not.toContain("session-secret");
  });
});
