import { describe, expect, it } from "vitest";
import { parseAiDashboard, parseAiLogs } from "./AdminAiApiClient";

const envelope = (data: unknown) => ({
  code: "OK",
  message: "success",
  data,
  traceId: "trace-admin-ai",
  timestamp: "2026-08-01T03:00:00Z",
});

describe("AdminAiApiClient", () => {
  it("parses AI operational telemetry", () => {
    const result = parseAiDashboard(
      envelope({
        activePrompts: 1,
        activeKnowledgeDocuments: 6,
        activeRules: 5,
        requestsLast24Hours: 18,
        failedRequestsLast24Hours: 2,
        averageLatencyMillis: 134,
        tokensLast24Hours: 3200,
        fallbackRate: 0.11,
        generatedAt: "2026-08-01T03:00:00",
      }),
    );

    expect(result.activeKnowledgeDocuments).toBe(6);
    expect(result.fallbackRate).toBe(0.11);
  });

  it("rejects any accidental raw-message field in request logs", () => {
    expect(() =>
      parseAiLogs(
        envelope({
          page: 1,
          size: 20,
          total: 1,
          totalPages: 1,
          items: [
            {
              requestId: "request-1",
              sessionId: "session-1",
              route: "RULE",
              purpose: "GAMING",
              budget: 8000,
              latencyMillis: 42,
              inputTokens: 0,
              outputTokens: 0,
              outcome: "SUCCESS",
              failureCode: "",
              configId: "build-1",
              createdAt: "2026-08-01T03:00:00",
              rawMessage: "绝不应返回原始输入",
            },
          ],
        }),
      ),
    ).toThrow();
  });

  it("normalizes omitted nullable log dimensions", () => {
    const result = parseAiLogs(
      envelope({
        page: 1,
        size: 20,
        total: 1,
        totalPages: 1,
        items: [
          {
            requestId: "request-2",
            sessionId: "session-2",
            route: "RULE",
            latencyMillis: 25,
            inputTokens: 0,
            outputTokens: 0,
            outcome: "SUCCESS",
            failureCode: "",
            createdAt: "2026-08-01T03:00:00",
          },
        ],
      }),
    );

    expect(result.items[0]?.purpose).toBeNull();
    expect(result.items[0]?.budget).toBeNull();
    expect(result.items[0]?.configId).toBeNull();
  });
});
