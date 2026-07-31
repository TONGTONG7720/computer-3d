package com.pclab.hardware.ai.rag;

import java.util.List;

@FunctionalInterface
public interface KnowledgeRetriever {

    List<AiKnowledgeEvidence> retrieve(KnowledgeQuery query);
}
