package com.pclab.hardware.ai.rag;

public record AiKnowledgeEvidence(
        String sourceKey,
        String title,
        String excerpt,
        double score,
        int revision
) {
}
