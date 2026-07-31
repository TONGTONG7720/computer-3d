package com.pclab.hardware.ai.rag;

public record KnowledgeQuery(String text, int limit) {

    public KnowledgeQuery {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("knowledge query text is required");
        }
        if (limit < 1 || limit > 10) {
            throw new IllegalArgumentException("knowledge query limit must be between 1 and 10");
        }
    }
}
