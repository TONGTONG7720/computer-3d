package com.pclab.hardware.intelligence.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleConfig;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleDefinition;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleType;
import com.pclab.hardware.intelligence.domain.CompatibilitySeverity;
import com.pclab.hardware.intelligence.entity.CompatibilityRuleEntity;
import com.pclab.hardware.intelligence.mapper.CompatibilityRuleMapper;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CompatibilityRuleProvider {

    private final CompatibilityRuleMapper ruleMapper;
    private final ObjectMapper objectMapper;

    public CompatibilityRuleProvider(
            CompatibilityRuleMapper ruleMapper,
            ObjectMapper objectMapper
    ) {
        this.ruleMapper = ruleMapper;
        this.objectMapper = objectMapper;
    }

    public List<CompatibilityRuleDefinition> activeRules() {
        List<CompatibilityRuleEntity> entities = ruleMapper.selectList(
                Wrappers.<CompatibilityRuleEntity>lambdaQuery()
                        .eq(CompatibilityRuleEntity::getEnabled, 1)
                        .orderByAsc(CompatibilityRuleEntity::getPriority)
        );
        return entities.stream().map(this::toDefinition).toList();
    }

    private CompatibilityRuleDefinition toDefinition(CompatibilityRuleEntity entity) {
        return new CompatibilityRuleDefinition(
                entity.getCode(),
                CompatibilityRuleType.valueOf(entity.getRuleType()),
                CompatibilitySeverity.valueOf(entity.getSeverity()),
                entity.getMessageTemplate(),
                entity.getPriority(),
                parseConfig(entity.getConfigJson())
        );
    }

    private CompatibilityRuleConfig parseConfig(String json) {
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
            throw new IllegalStateException("Stored compatibility rule config is invalid", exception);
        }
    }
}
