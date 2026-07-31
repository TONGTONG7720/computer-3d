package com.pclab.hardware.ai.service;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.domain.AiRoute;
import com.pclab.hardware.ai.rag.AiKnowledgeEvidence;
import java.util.List;

public record AiResolvedIntent(
        AiRequirement requirement,
        AiRoute route,
        List<AiKnowledgeEvidence> evidence,
        int promptVersion,
        int inputTokens,
        int outputTokens
) {

    public AiResolvedIntent {
        evidence = List.copyOf(evidence);
    }
}
