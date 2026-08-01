package com.pclab.hardware.intelligence.engine;

import com.pclab.hardware.intelligence.domain.BuildSelection;
import com.pclab.hardware.intelligence.domain.CompatibilityReport;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleConfig;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleDefinition;
import com.pclab.hardware.intelligence.domain.CompatibilitySeverity;
import com.pclab.hardware.intelligence.domain.ComponentSpecification;
import com.pclab.hardware.intelligence.domain.HardwareFacts;
import com.pclab.hardware.intelligence.domain.IntelligenceCategory;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class CompatibilityEngine {

    public CompatibilityReport evaluate(
            BuildSelection selection,
            List<CompatibilityRuleDefinition> rules
    ) {
        List<CompatibilityReport.Issue> issues = new ArrayList<>();
        int checked = 0;
        CompatibilityRuleConfig powerConfig = CompatibilityRuleConfig.defaults();

        for (CompatibilityRuleDefinition rule : rules.stream()
                .sorted(Comparator.comparingInt(CompatibilityRuleDefinition::priority))
                .toList()) {
            CompatibilityReport.Issue issue = switch (rule.type()) {
                case SOCKET_MATCH -> socketIssue(selection, rule);
                case MEMORY_GENERATION -> memoryIssue(selection, rule);
                case GPU_CLEARANCE -> gpuClearanceIssue(selection, rule);
                case CPU_COOLING_TDP -> coolingCapacityIssue(selection, rule);
                case COOLER_SOCKET -> coolerSocketIssue(selection, rule);
                case MOTHERBOARD_FORM_FACTOR -> motherboardSizeIssue(selection, rule);
                case RADIATOR_CLEARANCE -> radiatorIssue(selection, rule);
                case PSU_HEADROOM -> psuIssue(selection, rule);
            };
            if (hasRequiredComponents(selection, rule)) {
                checked++;
            }
            if (rule.type() == com.pclab.hardware.intelligence.domain.CompatibilityRuleType.PSU_HEADROOM) {
                powerConfig = rule.config();
            }
            if (issue != null) {
                issues.add(issue);
            }
        }

        List<IntelligenceCategory> missing = selection.missingCategories();
        CompatibilityReport.Status status = status(issues, missing);
        return new CompatibilityReport(
                status,
                issues,
                checked,
                selection.systemPowerWatt(),
                recommendedPsu(selection.systemPowerWatt(), powerConfig),
                missing
        );
    }

    private CompatibilityReport.Issue socketIssue(
            BuildSelection selection,
            CompatibilityRuleDefinition rule
    ) {
        HardwareFacts cpu = selection.get(IntelligenceCategory.CPU).orElse(null);
        HardwareFacts motherboard = selection.get(IntelligenceCategory.MOTHERBOARD).orElse(null);
        if (cpu == null || motherboard == null) {
            return null;
        }
        ComponentSpecification.Cpu cpuSpec = (ComponentSpecification.Cpu) cpu.specification();
        ComponentSpecification.Motherboard boardSpec =
                (ComponentSpecification.Motherboard) motherboard.specification();
        if (same(cpuSpec.socket(), boardSpec.socket())) {
            return null;
        }
        return issue(rule, List.of(cpu.id(), motherboard.id()), cpuSpec.socket(), boardSpec.socket());
    }

    private CompatibilityReport.Issue memoryIssue(
            BuildSelection selection,
            CompatibilityRuleDefinition rule
    ) {
        HardwareFacts memory = selection.get(IntelligenceCategory.RAM).orElse(null);
        HardwareFacts motherboard = selection.get(IntelligenceCategory.MOTHERBOARD).orElse(null);
        if (memory == null || motherboard == null) {
            return null;
        }
        ComponentSpecification.Memory memorySpec =
                (ComponentSpecification.Memory) memory.specification();
        ComponentSpecification.Motherboard boardSpec =
                (ComponentSpecification.Motherboard) motherboard.specification();
        if (same(memorySpec.generation(), boardSpec.ramType())) {
            return null;
        }
        return issue(
                rule,
                List.of(memory.id(), motherboard.id()),
                boardSpec.ramType(),
                memorySpec.generation()
        );
    }

    private CompatibilityReport.Issue gpuClearanceIssue(
            BuildSelection selection,
            CompatibilityRuleDefinition rule
    ) {
        HardwareFacts gpu = selection.get(IntelligenceCategory.GPU).orElse(null);
        HardwareFacts pcCase = selection.get(IntelligenceCategory.CASE).orElse(null);
        if (gpu == null || pcCase == null) {
            return null;
        }
        ComponentSpecification.Gpu gpuSpec = (ComponentSpecification.Gpu) gpu.specification();
        ComponentSpecification.PcCase caseSpec =
                (ComponentSpecification.PcCase) pcCase.specification();
        if (gpuSpec.lengthMm() <= caseSpec.gpuMaxLengthMm()) {
            return null;
        }
        return issue(
                rule,
                List.of(gpu.id(), pcCase.id()),
                "≤ " + caseSpec.gpuMaxLengthMm() + "mm",
                gpuSpec.lengthMm() + "mm"
        );
    }

    private CompatibilityReport.Issue coolingCapacityIssue(
            BuildSelection selection,
            CompatibilityRuleDefinition rule
    ) {
        HardwareFacts cpu = selection.get(IntelligenceCategory.CPU).orElse(null);
        HardwareFacts cooling = selection.get(IntelligenceCategory.COOLING).orElse(null);
        if (cpu == null || cooling == null) {
            return null;
        }
        ComponentSpecification.Cpu cpuSpec = (ComponentSpecification.Cpu) cpu.specification();
        ComponentSpecification.Cooling coolingSpec =
                (ComponentSpecification.Cooling) cooling.specification();
        if (coolingSpec.maxTdpWatt() >= cpuSpec.tdpWatt()) {
            return null;
        }
        return issue(
                rule,
                List.of(cpu.id(), cooling.id()),
                "≥ " + cpuSpec.tdpWatt() + "W",
                coolingSpec.maxTdpWatt() + "W"
        );
    }

    private CompatibilityReport.Issue coolerSocketIssue(
            BuildSelection selection,
            CompatibilityRuleDefinition rule
    ) {
        HardwareFacts cpu = selection.get(IntelligenceCategory.CPU).orElse(null);
        HardwareFacts cooling = selection.get(IntelligenceCategory.COOLING).orElse(null);
        if (cpu == null || cooling == null) {
            return null;
        }
        ComponentSpecification.Cpu cpuSpec = (ComponentSpecification.Cpu) cpu.specification();
        ComponentSpecification.Cooling coolingSpec =
                (ComponentSpecification.Cooling) cooling.specification();
        boolean supported = coolingSpec.supportedSockets().stream()
                .anyMatch(socket -> same(socket, cpuSpec.socket()));
        if (supported) {
            return null;
        }
        return issue(
                rule,
                List.of(cpu.id(), cooling.id()),
                cpuSpec.socket(),
                String.join(", ", coolingSpec.supportedSockets())
        );
    }

    private CompatibilityReport.Issue motherboardSizeIssue(
            BuildSelection selection,
            CompatibilityRuleDefinition rule
    ) {
        HardwareFacts motherboard = selection.get(IntelligenceCategory.MOTHERBOARD).orElse(null);
        HardwareFacts pcCase = selection.get(IntelligenceCategory.CASE).orElse(null);
        if (motherboard == null || pcCase == null) {
            return null;
        }
        ComponentSpecification.Motherboard boardSpec =
                (ComponentSpecification.Motherboard) motherboard.specification();
        ComponentSpecification.PcCase caseSpec =
                (ComponentSpecification.PcCase) pcCase.specification();
        boolean supported = caseSpec.motherboardSizes().stream()
                .anyMatch(size -> same(size, boardSpec.formFactor()));
        if (supported) {
            return null;
        }
        return issue(
                rule,
                List.of(motherboard.id(), pcCase.id()),
                String.join(", ", caseSpec.motherboardSizes()),
                boardSpec.formFactor()
        );
    }

    private CompatibilityReport.Issue radiatorIssue(
            BuildSelection selection,
            CompatibilityRuleDefinition rule
    ) {
        HardwareFacts cooling = selection.get(IntelligenceCategory.COOLING).orElse(null);
        HardwareFacts pcCase = selection.get(IntelligenceCategory.CASE).orElse(null);
        if (cooling == null || pcCase == null) {
            return null;
        }
        ComponentSpecification.Cooling coolingSpec =
                (ComponentSpecification.Cooling) cooling.specification();
        ComponentSpecification.PcCase caseSpec =
                (ComponentSpecification.PcCase) pcCase.specification();
        if (coolingSpec.radiatorSizeMm() <= caseSpec.radiatorMaxSizeMm()) {
            return null;
        }
        return issue(
                rule,
                List.of(cooling.id(), pcCase.id()),
                "≤ " + caseSpec.radiatorMaxSizeMm() + "mm",
                coolingSpec.radiatorSizeMm() + "mm"
        );
    }

    private CompatibilityReport.Issue psuIssue(
            BuildSelection selection,
            CompatibilityRuleDefinition rule
    ) {
        HardwareFacts psu = selection.get(IntelligenceCategory.POWER_SUPPLY).orElse(null);
        if (psu == null) {
            return null;
        }
        ComponentSpecification.PowerSupply psuSpec =
                (ComponentSpecification.PowerSupply) psu.specification();
        int rawDraw = selection.systemPowerWatt();
        int recommended = recommendedPsu(rawDraw, rule.config());
        if (psuSpec.wattage() >= recommended) {
            return null;
        }
        CompatibilitySeverity severity = psuSpec.wattage() < rawDraw
                ? CompatibilitySeverity.ERROR
                : CompatibilitySeverity.WARNING;
        return new CompatibilityReport.Issue(
                rule.code(),
                severity,
                severity == CompatibilitySeverity.ERROR ? "电源容量低于系统峰值功耗" : rule.message(),
                List.of(psu.id()),
                "≥ " + recommended + "W",
                psuSpec.wattage() + "W"
        );
    }

    private boolean hasRequiredComponents(
            BuildSelection selection,
            CompatibilityRuleDefinition rule
    ) {
        return switch (rule.type()) {
            case SOCKET_MATCH -> has(selection, IntelligenceCategory.CPU, IntelligenceCategory.MOTHERBOARD);
            case MEMORY_GENERATION -> has(selection, IntelligenceCategory.RAM, IntelligenceCategory.MOTHERBOARD);
            case GPU_CLEARANCE -> has(selection, IntelligenceCategory.GPU, IntelligenceCategory.CASE);
            case CPU_COOLING_TDP, COOLER_SOCKET ->
                    has(selection, IntelligenceCategory.CPU, IntelligenceCategory.COOLING);
            case MOTHERBOARD_FORM_FACTOR ->
                    has(selection, IntelligenceCategory.MOTHERBOARD, IntelligenceCategory.CASE);
            case RADIATOR_CLEARANCE ->
                    has(selection, IntelligenceCategory.COOLING, IntelligenceCategory.CASE);
            case PSU_HEADROOM -> selection.get(IntelligenceCategory.POWER_SUPPLY).isPresent();
        };
    }

    private boolean has(
            BuildSelection selection,
            IntelligenceCategory first,
            IntelligenceCategory second
    ) {
        return selection.get(first).isPresent() && selection.get(second).isPresent();
    }

    private CompatibilityReport.Issue issue(
            CompatibilityRuleDefinition rule,
            List<String> componentIds,
            String expected,
            String actual
    ) {
        return new CompatibilityReport.Issue(
                rule.code(),
                rule.severity(),
                rule.message(),
                componentIds,
                expected,
                actual
        );
    }

    private CompatibilityReport.Status status(
            List<CompatibilityReport.Issue> issues,
            List<IntelligenceCategory> missing
    ) {
        if (issues.stream().anyMatch(issue -> issue.severity() == CompatibilitySeverity.ERROR)) {
            return CompatibilityReport.Status.ERROR;
        }
        if (issues.stream().anyMatch(issue -> issue.severity() == CompatibilitySeverity.WARNING)) {
            return CompatibilityReport.Status.WARNING;
        }
        if (!missing.isEmpty()) {
            return CompatibilityReport.Status.INCOMPLETE;
        }
        return CompatibilityReport.Status.SUCCESS;
    }

    private int recommendedPsu(int systemPowerWatt, CompatibilityRuleConfig config) {
        BigDecimal target = BigDecimal.valueOf(systemPowerWatt + config.reserveWatt())
                .multiply(config.headroomRatio());
        BigDecimal units = target.divide(
                BigDecimal.valueOf(config.roundingWatt()),
                0,
                RoundingMode.CEILING
        );
        return units.intValueExact() * config.roundingWatt();
    }

    private boolean same(String first, String second) {
        return first != null && second != null
                && first.trim().toUpperCase(Locale.ROOT)
                        .equals(second.trim().toUpperCase(Locale.ROOT));
    }
}
