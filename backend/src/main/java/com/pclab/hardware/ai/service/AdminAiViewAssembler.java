package com.pclab.hardware.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.ai.entity.AiKnowledgeDocumentEntity;
import com.pclab.hardware.ai.entity.AiPromptConfigEntity;
import com.pclab.hardware.ai.entity.AiRecommendationRuleEntity;
import com.pclab.hardware.ai.entity.AiRequestLogEntity;
import com.pclab.hardware.ai.vo.AdminAiViews.KnowledgeView;
import com.pclab.hardware.ai.vo.AdminAiViews.PromptView;
import com.pclab.hardware.ai.vo.AdminAiViews.RequestLogView;
import com.pclab.hardware.ai.vo.AdminAiViews.RuleView;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AdminAiViewAssembler {

    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
    };
    private static final TypeReference<Map<String, Object>> OBJECT_MAP = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public AdminAiViewAssembler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public PromptView prompt(AiPromptConfigEntity entity) {
        return new PromptView(
                entity.getId(),
                entity.getPromptKey(),
                entity.getName(),
                entity.getContent(),
                entity.getVersion(),
                entity.getStatus(),
                entity.getCreatedBy(),
                entity.getUpdatedAt()
        );
    }

    public KnowledgeView knowledge(AiKnowledgeDocumentEntity entity) {
        return new KnowledgeView(
                entity.getId(),
                entity.getDocumentKey(),
                entity.getTitle(),
                entity.getCategory(),
                entity.getContent(),
                read(entity.getTagsJson(), STRING_LIST, List.of()),
                entity.getSourceLabel(),
                entity.getVectorStatus(),
                entity.getVersion(),
                entity.getStatus(),
                entity.getUpdatedAt()
        );
    }

    public RuleView rule(AiRecommendationRuleEntity entity) {
        return new RuleView(
                entity.getId(),
                entity.getRuleKey(),
                entity.getName(),
                entity.getPriority(),
                read(entity.getConditionJson(), OBJECT_MAP, Map.of()),
                read(entity.getActionJson(), OBJECT_MAP, Map.of()),
                entity.getExplanation(),
                entity.getVersion(),
                entity.getStatus(),
                entity.getUpdatedAt()
        );
    }

    public RequestLogView log(AiRequestLogEntity entity) {
        return new RequestLogView(
                entity.getRequestId(),
                entity.getSessionId(),
                entity.getRoute(),
                entity.getPurpose(),
                entity.getBudget(),
                entity.getLatencyMs(),
                entity.getInputTokens(),
                entity.getOutputTokens(),
                entity.getOutcome(),
                entity.getFailureCode(),
                entity.getConfigPublicId(),
                entity.getCreatedAt()
        );
    }

    private <T> T read(String json, TypeReference<T> type, T fallback) {
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException exception) {
            return fallback;
        }
    }
}
