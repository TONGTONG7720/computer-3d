package com.pclab.hardware.ai.service;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.domain.AiRoute;
import java.util.List;

public record AiAuditRecord(
        String requestId,
        String sessionId,
        String message,
        AiRoute route,
        AiRequirement requirement,
        int promptVersion,
        List<String> knowledgeKeys,
        String configId,
        long latencyMillis,
        int inputTokens,
        int outputTokens,
        String outcome,
        String failureCode
) {

    public AiAuditRecord {
        knowledgeKeys = List.copyOf(knowledgeKeys);
    }
}
