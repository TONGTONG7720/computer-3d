package com.pclab.hardware.ai.rag;

public record VectorKnowledgeDocument(
        String sourceKey,
        String title,
        String content,
        int revision
) {
}
