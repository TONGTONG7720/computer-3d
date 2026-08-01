package com.pclab.hardware.intelligence.dto;

import com.pclab.hardware.intelligence.domain.CompatibilityRuleConfig;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleType;
import com.pclab.hardware.intelligence.domain.CompatibilitySeverity;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CompatibilityRuleMutationRequest(
        @NotBlank @Pattern(regexp = "[A-Z][A-Z0-9_]{2,63}") String code,
        @NotBlank
        @Pattern(regexp = "CPU|GPU|MOTHERBOARD|RAM|STORAGE|COOLING|PSU|POWER_SUPPLY|CASE|BUILD")
        String sourceCategory,
        @NotBlank
        @Pattern(regexp = "CPU|GPU|MOTHERBOARD|RAM|STORAGE|COOLING|PSU|POWER_SUPPLY|CASE|BUILD")
        String targetCategory,
        @NotNull CompatibilityRuleType type,
        @NotNull CompatibilitySeverity severity,
        @NotBlank @Size(max = 300) String message,
        @NotNull @Valid RuleConfig config,
        @Min(0) int priority,
        @NotNull Boolean enabled,
        @Min(1) Integer version
) {

    public record RuleConfig(
            @Min(0) Integer reserveWatt,
            @DecimalMin("1.0") BigDecimal headroomRatio,
            @Min(1) Integer roundingWatt
    ) {

        public CompatibilityRuleConfig toDomain() {
            CompatibilityRuleConfig defaults = CompatibilityRuleConfig.defaults();
            return new CompatibilityRuleConfig(
                    reserveWatt == null ? defaults.reserveWatt() : reserveWatt,
                    headroomRatio == null ? defaults.headroomRatio() : headroomRatio,
                    roundingWatt == null ? defaults.roundingWatt() : roundingWatt
            );
        }
    }
}
