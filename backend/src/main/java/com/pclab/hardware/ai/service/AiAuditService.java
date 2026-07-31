package com.pclab.hardware.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.ai.entity.AiRequestLogEntity;
import com.pclab.hardware.ai.mapper.AiRequestLogMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AiAuditService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AiAuditService.class);

    private final AiRequestLogMapper mapper;
    private final AiMessageHasher hasher;
    private final ObjectMapper objectMapper;

    public AiAuditService(
            AiRequestLogMapper mapper,
            AiMessageHasher hasher,
            ObjectMapper objectMapper
    ) {
        this.mapper = mapper;
        this.hasher = hasher;
        this.objectMapper = objectMapper;
    }

    public void record(AiAuditRecord record) {
        try {
            mapper.insert(toEntity(record));
        } catch (RuntimeException exception) {
            LOGGER.warn("AI audit persistence failed for request {}", record.requestId());
        }
    }

    private AiRequestLogEntity toEntity(AiAuditRecord record) {
        AiRequestLogEntity entity = new AiRequestLogEntity();
        entity.setRequestId(record.requestId());
        entity.setSessionId(record.sessionId());
        entity.setRoute(record.route().name());
        entity.setPurpose(record.requirement() == null ? null : record.requirement().purposes()
                .stream().findFirst().map(Enum::name).orElse(null));
        entity.setBudget(record.requirement() == null ? null : record.requirement().budget());
        entity.setInputHash(hasher.hash(record.message()));
        entity.setPromptVersion(record.promptVersion() == 0 ? null : record.promptVersion());
        entity.setKnowledgeKeysJson(writeKeys(record));
        entity.setConfigPublicId(record.configId());
        entity.setLatencyMs(Math.toIntExact(Math.min(record.latencyMillis(), Integer.MAX_VALUE)));
        entity.setInputTokens(record.inputTokens());
        entity.setOutputTokens(record.outputTokens());
        entity.setEstimatedCost(BigDecimal.ZERO);
        entity.setOutcome(record.outcome());
        entity.setFailureCode(record.failureCode() == null ? "" : record.failureCode());
        entity.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        return entity;
    }

    private String writeKeys(AiAuditRecord record) {
        try {
            return objectMapper.writeValueAsString(record.knowledgeKeys());
        } catch (JsonProcessingException exception) {
            return "[]";
        }
    }
}
