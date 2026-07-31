package com.pclab.hardware.ai.rag;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Primary
@Component
public class HybridKnowledgeRetriever implements KnowledgeRetriever {

    private static final Logger LOGGER = LoggerFactory.getLogger(HybridKnowledgeRetriever.class);

    private final VectorKnowledgeStore vectorStore;
    private final KnowledgeRetriever mysqlRetriever;

    public HybridKnowledgeRetriever(
            VectorKnowledgeStore vectorStore,
            @Qualifier("mySqlKnowledgeRetriever") KnowledgeRetriever mysqlRetriever
    ) {
        this.vectorStore = vectorStore;
        this.mysqlRetriever = mysqlRetriever;
    }

    @Override
    public List<AiKnowledgeEvidence> retrieve(KnowledgeQuery query) {
        if (!vectorStore.isAvailable()) {
            return mysqlRetriever.retrieve(query);
        }
        try {
            List<AiKnowledgeEvidence> evidence = vectorStore.query(query);
            return evidence.isEmpty() ? mysqlRetriever.retrieve(query) : evidence;
        } catch (AiExternalServiceException exception) {
            LOGGER.warn("AI vector retrieval unavailable; using MySQL knowledge");
            return mysqlRetriever.retrieve(query);
        }
    }
}
