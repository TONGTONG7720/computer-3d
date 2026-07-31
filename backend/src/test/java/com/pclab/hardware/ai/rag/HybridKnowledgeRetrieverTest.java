package com.pclab.hardware.ai.rag;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class HybridKnowledgeRetrieverTest {

    @Test
    void usesMysqlEvidenceWhenVectorQueryFails() {
        AiKnowledgeEvidence fallbackEvidence = new AiKnowledgeEvidence(
                "COMPAT_POWER_V1",
                "整机功耗",
                "建议保留百分之二十余量",
                0.82,
                1
        );
        VectorKnowledgeStore vector = new VectorKnowledgeStore() {
            @Override
            public boolean isAvailable() {
                return true;
            }

            @Override
            public List<AiKnowledgeEvidence> query(KnowledgeQuery query) {
                throw new AiExternalServiceException("VECTOR_UNAVAILABLE");
            }

            @Override
            public void upsert(VectorKnowledgeDocument document) {
                throw new AssertionError("upsert is not part of retrieval");
            }
        };
        KnowledgeRetriever mysql = query -> List.of(fallbackEvidence);
        HybridKnowledgeRetriever retriever = new HybridKnowledgeRetriever(vector, mysql);

        List<AiKnowledgeEvidence> result = retriever.retrieve(new KnowledgeQuery(
                "AI_TRAINING GPU POWER",
                5
        ));

        assertThat(result).containsExactly(fallbackEvidence);
    }
}
