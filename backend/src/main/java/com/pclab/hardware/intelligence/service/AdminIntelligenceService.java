package com.pclab.hardware.intelligence.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleConfig;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleType;
import com.pclab.hardware.intelligence.domain.CompatibilitySeverity;
import com.pclab.hardware.intelligence.dto.CompatibilityRuleMutationRequest;
import com.pclab.hardware.intelligence.dto.HardwarePerformanceUpdateRequest;
import com.pclab.hardware.intelligence.entity.CompatibilityRuleEntity;
import com.pclab.hardware.intelligence.entity.HardwarePerformanceEntity;
import com.pclab.hardware.intelligence.mapper.CompatibilityRuleMapper;
import com.pclab.hardware.intelligence.mapper.HardwarePerformanceMapper;
import com.pclab.hardware.intelligence.vo.CompatibilityRuleView;
import com.pclab.hardware.intelligence.vo.HardwarePerformanceView;
import com.pclab.hardware.mapper.HardwareMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminIntelligenceService {

    private final CompatibilityRuleMapper ruleMapper;
    private final HardwarePerformanceMapper performanceMapper;
    private final HardwareMapper hardwareMapper;
    private final ObjectMapper objectMapper;

    public AdminIntelligenceService(
            CompatibilityRuleMapper ruleMapper,
            HardwarePerformanceMapper performanceMapper,
            HardwareMapper hardwareMapper,
            ObjectMapper objectMapper
    ) {
        this.ruleMapper = ruleMapper;
        this.performanceMapper = performanceMapper;
        this.hardwareMapper = hardwareMapper;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<CompatibilityRuleView> listRules() {
        return ruleMapper.selectList(
                        Wrappers.<CompatibilityRuleEntity>lambdaQuery()
                                .orderByAsc(CompatibilityRuleEntity::getPriority)
                                .orderByAsc(CompatibilityRuleEntity::getCode)
                ).stream()
                .map(this::toRuleView)
                .toList();
    }

    @Transactional
    public CompatibilityRuleView createRule(CompatibilityRuleMutationRequest request) {
        requireUniqueCode(request.code(), null);
        CompatibilityRuleEntity entity = toRuleEntity(request);
        entity.setVersion(1);
        entity.setCreatedAt(now());
        entity.setUpdatedAt(entity.getCreatedAt());
        ruleMapper.insert(entity);
        return toRuleView(entity);
    }

    @Transactional
    public CompatibilityRuleView updateRule(
            Long id,
            CompatibilityRuleMutationRequest request
    ) {
        CompatibilityRuleEntity existing = requireRule(id);
        if (request.version() == null || !request.version().equals(existing.getVersion())) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
        requireUniqueCode(request.code(), id);
        CompatibilityRuleEntity updated = toRuleEntity(request);
        updated.setId(id);
        updated.setVersion(request.version() + 1);
        updated.setCreatedAt(existing.getCreatedAt());
        updated.setUpdatedAt(now());
        int changed = ruleMapper.update(
                updated,
                Wrappers.<CompatibilityRuleEntity>lambdaUpdate()
                        .eq(CompatibilityRuleEntity::getId, id)
                        .eq(CompatibilityRuleEntity::getVersion, request.version())
        );
        if (changed == 0) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
        return toRuleView(updated);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "hardware-list", allEntries = true),
        @CacheEvict(cacheNames = "hardware-detail", allEntries = true)
    })
    public HardwarePerformanceView updatePerformance(
            Long hardwareId,
            HardwarePerformanceUpdateRequest request
    ) {
        HardwareEntity hardware = hardwareMapper.selectById(hardwareId);
        if (hardware == null) {
            throw new DomainException(ErrorCode.HARDWARE_NOT_FOUND);
        }
        HardwarePerformanceEntity existing = performanceMapper.selectById(hardwareId);
        HardwarePerformanceEntity updated = new HardwarePerformanceEntity();
        updated.setHardwareId(hardwareId);
        updated.setGamingScore(request.gaming());
        updated.setCreatorScore(request.creator());
        updated.setAiScore(request.ai());
        updated.setSource(request.source().trim());
        updated.setMeasuredAt(now());
        updated.setUpdatedAt(updated.getMeasuredAt());

        if (existing == null) {
            if (request.version() != 0) {
                throw new DomainException(ErrorCode.CONFLICT);
            }
            updated.setProfileVersion(1);
            updated.setCreatedAt(updated.getMeasuredAt());
            performanceMapper.insert(updated);
        } else {
            if (!Integer.valueOf(request.version()).equals(existing.getProfileVersion())) {
                throw new DomainException(ErrorCode.CONFLICT);
            }
            updated.setProfileVersion(existing.getProfileVersion() + 1);
            updated.setCreatedAt(existing.getCreatedAt());
            int changed = performanceMapper.update(
                    updated,
                    Wrappers.<HardwarePerformanceEntity>lambdaUpdate()
                            .eq(HardwarePerformanceEntity::getHardwareId, hardwareId)
                            .eq(HardwarePerformanceEntity::getProfileVersion, request.version())
            );
            if (changed == 0) {
                throw new DomainException(ErrorCode.CONFLICT);
            }
        }

        int baseScore = BigDecimal.valueOf(
                        (long) request.gaming() + request.creator() + request.ai()
                )
                .divide(BigDecimal.valueOf(3), 0, RoundingMode.HALF_UP)
                .intValueExact();
        hardware.setPerformanceScore(baseScore);
        if (hardwareMapper.updateById(hardware) == 0) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
        return toPerformanceView(updated);
    }

    private CompatibilityRuleEntity requireRule(Long id) {
        CompatibilityRuleEntity entity = ruleMapper.selectById(id);
        if (entity == null) {
            throw new DomainException(ErrorCode.INTELLIGENCE_RULE_NOT_FOUND);
        }
        return entity;
    }

    private void requireUniqueCode(String code, Long excludedId) {
        var query = Wrappers.<CompatibilityRuleEntity>lambdaQuery()
                .eq(CompatibilityRuleEntity::getCode, code);
        if (excludedId != null) {
            query.ne(CompatibilityRuleEntity::getId, excludedId);
        }
        Long count = ruleMapper.selectCount(query);
        if (count != null && count > 0) {
            throw new DomainException(ErrorCode.CONFLICT, "兼容规则 code 已存在");
        }
    }

    private CompatibilityRuleEntity toRuleEntity(CompatibilityRuleMutationRequest request) {
        CompatibilityRuleEntity entity = new CompatibilityRuleEntity();
        entity.setCode(request.code());
        entity.setSourceCategory(request.sourceCategory());
        entity.setTargetCategory(request.targetCategory());
        entity.setRuleType(request.type().name());
        entity.setSeverity(request.severity().name());
        entity.setMessageTemplate(request.message().trim());
        entity.setConfigJson(writeConfig(request.config().toDomain()));
        entity.setPriority(request.priority());
        entity.setEnabled(request.enabled());
        return entity;
    }

    private CompatibilityRuleView toRuleView(CompatibilityRuleEntity entity) {
        return new CompatibilityRuleView(
                entity.getId(),
                entity.getCode(),
                entity.getSourceCategory(),
                entity.getTargetCategory(),
                CompatibilityRuleType.valueOf(entity.getRuleType()),
                CompatibilitySeverity.valueOf(entity.getSeverity()),
                entity.getMessageTemplate(),
                readConfig(entity.getConfigJson()),
                entity.getPriority(),
                Boolean.TRUE.equals(entity.getEnabled()),
                entity.getVersion(),
                entity.getUpdatedAt()
        );
    }

    private HardwarePerformanceView toPerformanceView(HardwarePerformanceEntity entity) {
        return new HardwarePerformanceView(
                entity.getHardwareId(),
                entity.getGamingScore(),
                entity.getCreatorScore(),
                entity.getAiScore(),
                entity.getSource(),
                entity.getProfileVersion(),
                entity.getMeasuredAt()
        );
    }

    private String writeConfig(CompatibilityRuleConfig config) {
        try {
            return objectMapper.writeValueAsString(config);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Compatibility config could not be serialized", exception);
        }
    }

    private CompatibilityRuleConfig readConfig(String json) {
        CompatibilityRuleConfig defaults = CompatibilityRuleConfig.defaults();
        if (json == null || json.isBlank()) {
            return defaults;
        }
        try {
            JsonNode node = objectMapper.readTree(json);
            return new CompatibilityRuleConfig(
                    node.path("reserveWatt").asInt(defaults.reserveWatt()),
                    node.has("headroomRatio")
                            ? node.get("headroomRatio").decimalValue()
                            : defaults.headroomRatio(),
                    node.path("roundingWatt").asInt(defaults.roundingWatt())
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored compatibility config is invalid", exception);
        }
    }

    private static LocalDateTime now() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }
}
