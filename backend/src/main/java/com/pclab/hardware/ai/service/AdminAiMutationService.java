package com.pclab.hardware.ai.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.ai.dto.AdminAiRequests.CreatePromptVersionRequest;
import com.pclab.hardware.ai.dto.AdminAiRequests.UpsertKnowledgeRequest;
import com.pclab.hardware.ai.dto.AdminAiRequests.UpsertRuleRequest;
import com.pclab.hardware.ai.entity.AiKnowledgeDocumentEntity;
import com.pclab.hardware.ai.entity.AiPromptConfigEntity;
import com.pclab.hardware.ai.entity.AiRecommendationRuleEntity;
import com.pclab.hardware.ai.mapper.AiKnowledgeDocumentMapper;
import com.pclab.hardware.ai.mapper.AiPromptConfigMapper;
import com.pclab.hardware.ai.mapper.AiRecommendationRuleMapper;
import com.pclab.hardware.ai.rag.AiExternalServiceException;
import com.pclab.hardware.ai.rag.VectorKnowledgeDocument;
import com.pclab.hardware.ai.rag.VectorKnowledgeStore;
import com.pclab.hardware.ai.vo.AdminAiViews.KnowledgeView;
import com.pclab.hardware.ai.vo.AdminAiViews.PromptView;
import com.pclab.hardware.ai.vo.AdminAiViews.RuleView;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAiMutationService {

    private final AiPromptConfigMapper promptMapper;
    private final AiKnowledgeDocumentMapper knowledgeMapper;
    private final AiRecommendationRuleMapper ruleMapper;
    private final VectorKnowledgeStore vectorStore;
    private final ObjectMapper objectMapper;
    private final AdminAiViewAssembler assembler;

    public AdminAiMutationService(
            AiPromptConfigMapper promptMapper,
            AiKnowledgeDocumentMapper knowledgeMapper,
            AiRecommendationRuleMapper ruleMapper,
            VectorKnowledgeStore vectorStore,
            ObjectMapper objectMapper,
            AdminAiViewAssembler assembler
    ) {
        this.promptMapper = promptMapper;
        this.knowledgeMapper = knowledgeMapper;
        this.ruleMapper = ruleMapper;
        this.vectorStore = vectorStore;
        this.objectMapper = objectMapper;
        this.assembler = assembler;
    }

    @Transactional
    public PromptView createPromptVersion(
            String promptKey,
            CreatePromptVersionRequest request
    ) {
        AiPromptConfigEntity latest = promptMapper.selectOne(
                Wrappers.<AiPromptConfigEntity>lambdaQuery()
                        .eq(AiPromptConfigEntity::getPromptKey, promptKey)
                        .orderByDesc(AiPromptConfigEntity::getVersion)
                        .last("LIMIT 1")
        );
        if (request.activate()) {
            promptMapper.update(null, Wrappers.<AiPromptConfigEntity>lambdaUpdate()
                    .eq(AiPromptConfigEntity::getPromptKey, promptKey)
                    .eq(AiPromptConfigEntity::getStatus, "ACTIVE")
                    .set(AiPromptConfigEntity::getStatus, "ARCHIVED"));
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        AiPromptConfigEntity entity = new AiPromptConfigEntity();
        entity.setPromptKey(promptKey);
        entity.setName(request.name().trim());
        entity.setContent(request.content().trim());
        entity.setVersion(latest == null ? 1 : latest.getVersion() + 1);
        entity.setStatus(request.activate() ? "ACTIVE" : "DRAFT");
        entity.setCreatedBy(request.createdBy().trim());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        promptMapper.insert(entity);
        return assembler.prompt(entity);
    }

    @Transactional
    public KnowledgeView upsertKnowledge(
            String documentKey,
            UpsertKnowledgeRequest request
    ) {
        AiKnowledgeDocumentEntity entity = findKnowledge(documentKey);
        boolean create = entity == null;
        if (create) {
            entity = new AiKnowledgeDocumentEntity();
            entity.setDocumentKey(documentKey);
            entity.setVersion(1);
            entity.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        } else {
            verifyVersion(entity.getVersion(), request.version());
        }
        entity.setTitle(request.title().trim());
        entity.setCategory(request.category());
        entity.setContent(request.content().trim());
        entity.setTagsJson(writeJson(normalizedTags(request.tags())));
        entity.setSourceLabel(request.sourceLabel().trim());
        entity.setVectorStatus(vectorStore.isAvailable() ? "PENDING" : "DISABLED");
        entity.setStatus(request.status() == null ? "DRAFT" : request.status());
        entity.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        int changed = create ? knowledgeMapper.insert(entity) : knowledgeMapper.updateById(entity);
        if (changed == 0) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
        return assembler.knowledge(entity);
    }

    @Transactional
    public KnowledgeView syncKnowledge(String documentKey) {
        AiKnowledgeDocumentEntity entity = requireKnowledge(documentKey);
        if (!vectorStore.isAvailable()) {
            throw new DomainException(ErrorCode.AI_VECTOR_UNAVAILABLE);
        }
        try {
            vectorStore.upsert(new VectorKnowledgeDocument(
                    entity.getDocumentKey(),
                    entity.getTitle(),
                    entity.getContent(),
                    entity.getVersion()
            ));
            entity.setVectorStatus("SYNCED");
        } catch (AiExternalServiceException exception) {
            entity.setVectorStatus("FAILED");
            knowledgeMapper.updateById(entity);
            throw new DomainException(ErrorCode.AI_VECTOR_UNAVAILABLE);
        }
        entity.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        knowledgeMapper.updateById(entity);
        return assembler.knowledge(entity);
    }

    @Transactional
    public RuleView upsertRule(String ruleKey, UpsertRuleRequest request) {
        AiRecommendationRuleEntity entity = ruleMapper.selectOne(
                Wrappers.<AiRecommendationRuleEntity>lambdaQuery()
                        .eq(AiRecommendationRuleEntity::getRuleKey, ruleKey)
        );
        boolean create = entity == null;
        if (create) {
            entity = new AiRecommendationRuleEntity();
            entity.setRuleKey(ruleKey);
            entity.setVersion(1);
            entity.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        } else {
            verifyVersion(entity.getVersion(), request.version());
        }
        entity.setName(request.name().trim());
        entity.setPriority(request.priority());
        entity.setConditionJson(writeJson(request.condition()));
        entity.setActionJson(writeJson(request.action()));
        entity.setExplanation(request.explanation().trim());
        entity.setStatus(request.status() == null ? "DRAFT" : request.status());
        entity.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        int changed = create ? ruleMapper.insert(entity) : ruleMapper.updateById(entity);
        if (changed == 0) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
        return assembler.rule(entity);
    }

    private AiKnowledgeDocumentEntity findKnowledge(String key) {
        return knowledgeMapper.selectOne(Wrappers.<AiKnowledgeDocumentEntity>lambdaQuery()
                .eq(AiKnowledgeDocumentEntity::getDocumentKey, key));
    }

    private AiKnowledgeDocumentEntity requireKnowledge(String key) {
        AiKnowledgeDocumentEntity entity = findKnowledge(key);
        if (entity == null) {
            throw new DomainException(ErrorCode.AI_RESOURCE_NOT_FOUND);
        }
        return entity;
    }

    private static void verifyVersion(Integer stored, Integer submitted) {
        if (submitted == null || !stored.equals(submitted)) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
    }

    private static List<String> normalizedTags(List<String> tags) {
        return tags.stream()
                .map(tag -> tag.trim().toUpperCase(Locale.ROOT))
                .distinct()
                .toList();
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("AI admin JSON payload is invalid", exception);
        }
    }
}
