package com.pclab.hardware.intelligence.domain;

import java.util.Comparator;
import java.util.List;

public record CompatibilityRuleDefinition(
        String code,
        CompatibilityRuleType type,
        CompatibilitySeverity severity,
        String message,
        int priority,
        CompatibilityRuleConfig config
) {

    public static List<CompatibilityRuleDefinition> standardRules() {
        CompatibilityRuleConfig defaults = CompatibilityRuleConfig.defaults();
        return List.of(
                rule("CPU_MOTHERBOARD_SOCKET", CompatibilityRuleType.SOCKET_MATCH,
                        CompatibilitySeverity.ERROR, "CPU 与主板插槽不一致", 10, defaults),
                rule("RAM_MOTHERBOARD_GENERATION", CompatibilityRuleType.MEMORY_GENERATION,
                        CompatibilitySeverity.ERROR, "内存代际与主板不一致", 20, defaults),
                rule("GPU_CASE_CLEARANCE", CompatibilityRuleType.GPU_CLEARANCE,
                        CompatibilitySeverity.ERROR, "显卡长度超过机箱空间", 30, defaults),
                rule("CPU_COOLER_CAPACITY", CompatibilityRuleType.CPU_COOLING_TDP,
                        CompatibilitySeverity.ERROR, "散热能力低于处理器 TDP", 40, defaults),
                rule("CPU_COOLER_SOCKET", CompatibilityRuleType.COOLER_SOCKET,
                        CompatibilitySeverity.ERROR, "散热器不支持处理器插槽", 50, defaults),
                rule("MOTHERBOARD_CASE_FORM_FACTOR", CompatibilityRuleType.MOTHERBOARD_FORM_FACTOR,
                        CompatibilitySeverity.ERROR, "主板尺寸不受机箱支持", 60, defaults),
                rule("COOLER_CASE_RADIATOR", CompatibilityRuleType.RADIATOR_CLEARANCE,
                        CompatibilitySeverity.ERROR, "冷排尺寸超过机箱上限", 70, defaults),
                rule("SYSTEM_PSU_HEADROOM", CompatibilityRuleType.PSU_HEADROOM,
                        CompatibilitySeverity.WARNING, "电源余量低于建议值", 80, defaults)
        ).stream().sorted(Comparator.comparingInt(CompatibilityRuleDefinition::priority)).toList();
    }

    private static CompatibilityRuleDefinition rule(
            String code,
            CompatibilityRuleType type,
            CompatibilitySeverity severity,
            String message,
            int priority,
            CompatibilityRuleConfig config
    ) {
        return new CompatibilityRuleDefinition(code, type, severity, message, priority, config);
    }
}
