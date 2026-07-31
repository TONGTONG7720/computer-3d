package com.pclab.hardware.ai.model;

import com.pclab.hardware.ai.rag.AiKnowledgeEvidence;
import java.util.List;

public record AiModelInput(
        String message,
        String systemPrompt,
        int promptVersion,
        List<AiKnowledgeEvidence> evidence
) {

    public AiModelInput {
        evidence = List.copyOf(evidence);
    }
}
