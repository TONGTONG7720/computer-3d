package com.pclab.hardware.intelligence.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleType;
import com.pclab.hardware.intelligence.domain.CompatibilitySeverity;
import com.pclab.hardware.intelligence.dto.CompatibilityRuleMutationRequest;
import com.pclab.hardware.intelligence.dto.HardwarePerformanceUpdateRequest;
import com.pclab.hardware.intelligence.entity.CompatibilityRuleEntity;
import com.pclab.hardware.intelligence.entity.HardwarePerformanceEntity;
import com.pclab.hardware.intelligence.mapper.CompatibilityRuleMapper;
import com.pclab.hardware.intelligence.mapper.HardwarePerformanceMapper;
import com.pclab.hardware.mapper.HardwareMapper;
import org.junit.jupiter.api.Test;

class AdminIntelligenceServiceTest {

    private final CompatibilityRuleMapper ruleMapper = mock(CompatibilityRuleMapper.class);
    private final HardwarePerformanceMapper performanceMapper =
            mock(HardwarePerformanceMapper.class);
    private final HardwareMapper hardwareMapper = mock(HardwareMapper.class);
    private final AdminIntelligenceService service = new AdminIntelligenceService(
            ruleMapper,
            performanceMapper,
            hardwareMapper,
            new ObjectMapper()
    );

    @Test
    void rejectsStaleCompatibilityRuleVersion() {
        CompatibilityRuleEntity existing = ruleEntity(7L, 2);
        when(ruleMapper.selectById(7L)).thenReturn(existing);

        assertThatThrownBy(() -> service.updateRule(7L, ruleRequest(1)))
                .isInstanceOfSatisfying(DomainException.class, exception ->
                        assertThat(exception.errorCode()).isEqualTo(ErrorCode.CONFLICT));
    }

    @Test
    void incrementsPerformanceProfileVersionAndSynchronizesBaseScore() {
        HardwareEntity hardware = new HardwareEntity();
        hardware.setId(9L);
        hardware.setVersion(1);
        HardwarePerformanceEntity existing = new HardwarePerformanceEntity();
        existing.setHardwareId(9L);
        existing.setProfileVersion(3);
        when(hardwareMapper.selectById(9L)).thenReturn(hardware);
        when(performanceMapper.selectById(9L)).thenReturn(existing);
        when(performanceMapper.update(any(), any())).thenReturn(1);
        when(hardwareMapper.updateById(any(HardwareEntity.class))).thenReturn(1);

        var view = service.updatePerformance(
                9L,
                new HardwarePerformanceUpdateRequest(90, 84, 96, "LAB benchmark", 3)
        );

        assertThat(view.version()).isEqualTo(4);
        assertThat(view.gaming()).isEqualTo(90);
        verify(hardwareMapper).updateById(hardware);
        assertThat(hardware.getPerformanceScore()).isEqualTo(90);
    }

    private static CompatibilityRuleMutationRequest ruleRequest(int version) {
        return new CompatibilityRuleMutationRequest(
                "GPU_CASE_CLEARANCE",
                "GPU",
                "CASE",
                CompatibilityRuleType.GPU_CLEARANCE,
                CompatibilitySeverity.ERROR,
                "显卡长度超过机箱空间",
                new CompatibilityRuleMutationRequest.RuleConfig(null, null, null),
                30,
                true,
                version
        );
    }

    private static CompatibilityRuleEntity ruleEntity(Long id, int version) {
        CompatibilityRuleEntity entity = new CompatibilityRuleEntity();
        entity.setId(id);
        entity.setCode("GPU_CASE_CLEARANCE");
        entity.setSourceCategory("GPU");
        entity.setTargetCategory("CASE");
        entity.setRuleType("GPU_CLEARANCE");
        entity.setSeverity("ERROR");
        entity.setMessageTemplate("显卡长度超过机箱空间");
        entity.setConfigJson("{}");
        entity.setPriority(30);
        entity.setEnabled(true);
        entity.setVersion(version);
        return entity;
    }
}
