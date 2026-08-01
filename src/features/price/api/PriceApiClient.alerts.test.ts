import ky from "ky";
import { describe, expect, it } from "vitest";
import {
  deletePriceAlert,
  getPriceAlerts,
  parsePriceAlertOwner,
  upsertPriceAlert,
} from "./PriceApiClient";

describe("PriceApiClient alerts", () => {
  it("sends alert ownership only in the required header for create, list, and delete", async () => {
    const owner = parsePriceAlertOwner("7f34d22c-7be0-49e0-bf66-fdf116188756");
    const publicId = "69dce68f-c544-456d-a700-65d9823bde2c";
    const requests: Array<{
      readonly body: string;
      readonly method: string;
      readonly owner: string | null;
      readonly url: string;
    }> = [];
    const alert = {
      publicId,
      hardwareKey: "gpu-nvidia-rtx5090",
      hardwareName: "NVIDIA GeForce RTX 5090",
      targetPrice: 19_999,
      status: "ACTIVE",
      updatedAt: "2026-08-02T08:30:00",
    };
    const envelope = (data: unknown) =>
      JSON.stringify({
        code: "OK",
        message: "success",
        data,
        traceId: "trace-alert",
        timestamp: "2026-08-02T08:30:01Z",
      });
    const client = ky.create({
      prefix: "https://pc-lab.test/api",
      fetch: async (input, init) => {
        const request = new Request(input, init);
        requests.push({
          body: await request.text(),
          method: request.method,
          owner: request.headers.get("X-Price-Alert-Owner"),
          url: request.url,
        });
        const data =
          request.method === "GET" ? [alert] : request.method === "DELETE" ? null : alert;
        return new Response(envelope(data), {
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    const created = await upsertPriceAlert("gpu-nvidia-rtx5090", 19_999, owner, client);
    const listed = await getPriceAlerts(owner, client);
    await deletePriceAlert(publicId, owner, client);

    expect(created).toMatchObject({
      currentBestPrice: null,
      triggeredAt: null,
      checkedAt: null,
    });
    expect(listed[0]).toMatchObject({
      currentBestPrice: null,
      triggeredAt: null,
      checkedAt: null,
    });

    expect(requests).toEqual([
      {
        body: JSON.stringify({ targetPrice: 19_999 }),
        method: "PUT",
        owner,
        url: "https://pc-lab.test/api/price-intelligence/alerts/gpu-nvidia-rtx5090",
      },
      {
        body: "",
        method: "GET",
        owner,
        url: "https://pc-lab.test/api/price-intelligence/alerts",
      },
      {
        body: "",
        method: "DELETE",
        owner,
        url: `https://pc-lab.test/api/price-intelligence/alerts/${publicId}`,
      },
    ]);
    for (const request of requests) {
      expect(request.url).not.toContain(owner);
      expect(request.body).not.toContain(owner);
    }
  });
});
