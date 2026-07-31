package com.pclab.hardware.ai.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.ai.dto.AdminAiRequests.UpsertKnowledgeRequest;
import com.pclab.hardware.ai.entity.AiKnowledgeDocumentEntity;
import com.pclab.hardware.ai.mapper.AiKnowledgeDocumentMapper;
import com.pclab.hardware.ai.mapper.AiPromptConfigMapper;
import com.pclab.hardware.ai.mapper.AiRecommendationRuleMapper;
import com.pclab.hardware.ai.rag.VectorKnowledgeStore;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import java.util.List;
import org.junit.jupiter.api.Test;

class AdminAiMutationServiceTest {

    @Test
    void createsReviewableKnowledgeWithoutPretendingVectorSync() {
        AiKnowledgeDocumentMapper knowledgeMapper = mock(AiKnowledgeDocumentMapper.class);
        VectorKnowledgeStore vectorStore = mock(VectorKnowledgeStore.class);
        when(vectorStore.isAvailable()).thenReturn(false);
        when(knowledgeMapper.insert(
                org.mockito.ArgumentMatchers.any(AiKnowledgeDocumentEntity.class)
        )).thenReturn(1);
        AdminAiMutationService service = service(knowledgeMapper, vectorStore);

        var result = service.upsertKnowledge("GAMING_FRAME_RATE_V1", new UpsertKnowledgeRequest(
                "3A 游戏帧率原则",
                "WORKLOAD",
                "优先保证 GPU 性能，再平衡 CPU。",
                List.of("gaming", "gpu", "gaming"),
                "PC LAB 编辑部",
                "ACTIVE",
                null
        ));

        assertThat(result.vectorStatus()).isEqualTo("DISABLED");
        assertThat(result.tags()).containsExactly("GAMING", "GPU");
        verify(knowledgeMapper).insert(org.mockito.ArgumentMatchers.any(AiKnowledgeDocumentEntity.class));
    }

    @Test
    void refusesVectorSyncWhenAdapterIsDisabled() {
        AiKnowledgeDocumentMapper knowledgeMapper = mock(AiKnowledgeDocumentMapper.class);
        VectorKnowledgeStore vectorStore = mock(VectorKnowledgeStore.class);
        AiKnowledgeDocumentEntity document = new AiKnowledgeDocumentEntity();
        document.setDocumentKey("COMPAT_POWER_V1");
        when(knowledgeMapper.selectOne(org.mockito.ArgumentMatchers.any())).thenReturn(document);
        when(vectorStore.isAvailable()).thenReturn(false);

        assertThatThrownBy(() -> service(knowledgeMapper, vectorStore)
                .syncKnowledge("COMPAT_POWER_V1"))
                .isInstanceOfSatisfying(DomainException.class, exception ->
                        assertThat(exception.errorCode()).isEqualTo(ErrorCode.AI_VECTOR_UNAVAILABLE));
    }

    private static AdminAiMutationService service(
            AiKnowledgeDocumentMapper knowledgeMapper,
            VectorKnowledgeStore vectorStore
    ) {
        ObjectMapper mapper = new ObjectMapper();
        return new AdminAiMutationService(
                mock(AiPromptConfigMapper.class),
                knowledgeMapper,
                mock(AiRecommendationRuleMapper.class),
                vectorStore,
                mapper,
                new AdminAiViewAssembler(mapper)
        );
    }
}
