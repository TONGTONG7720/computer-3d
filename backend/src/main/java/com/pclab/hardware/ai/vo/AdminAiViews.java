package com.pclab.hardware.ai.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class AdminAiViews {

    private AdminAiViews() {
    }

    public record AiDashboardView(
            long activePrompts,
            long activeKnowledgeDocuments,
            long activeRules,
            long requestsLast24Hours,
            long failedRequestsLast24Hours,
            int averageLatencyMillis,
            long tokensLast24Hours,
            double fallbackRate,
            LocalDateTime generatedAt
    ) {
    }

    public record PromptView(
            Long id,
            String promptKey,
            String name,
            String content,
            int version,
            String status,
            String createdBy,
            LocalDateTime updatedAt
    ) {
    }

    public record KnowledgeView(
            Long id,
            String documentKey,
            String title,
            String category,
            String content,
            List<String> tags,
            String sourceLabel,
            String vectorStatus,
            int version,
            String status,
            LocalDateTime updatedAt
    ) {

        public KnowledgeView {
            tags = List.copyOf(tags);
        }
    }

    public record RuleView(
            Long id,
            String ruleKey,
            String name,
            int priority,
            Map<String, Object> condition,
            Map<String, Object> action,
            String explanation,
            int version,
            String status,
            LocalDateTime updatedAt
    ) {

        public RuleView {
            condition = Map.copyOf(condition);
            action = Map.copyOf(action);
        }
    }

    public record RequestLogView(
            String requestId,
            String sessionId,
            String route,
            String purpose,
            BigDecimal budget,
            int latencyMillis,
            int inputTokens,
            int outputTokens,
            String outcome,
            String failureCode,
            String configId,
            LocalDateTime createdAt
    ) {
    }
}
