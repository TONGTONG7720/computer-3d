package com.pclab.hardware.ai.rag;

import java.util.List;

public interface VectorKnowledgeStore {

    boolean isAvailable();

    List<AiKnowledgeEvidence> query(KnowledgeQuery query);

    void upsert(VectorKnowledgeDocument document);
}
