package com.pclab.hardware.intelligence.engine;

import static com.pclab.hardware.intelligence.HardwareFactsFixtures.compatibleBuild;
import static com.pclab.hardware.intelligence.HardwareFactsFixtures.cooling;
import static com.pclab.hardware.intelligence.HardwareFactsFixtures.cpu;
import static com.pclab.hardware.intelligence.HardwareFactsFixtures.gpu;
import static com.pclab.hardware.intelligence.HardwareFactsFixtures.motherboard;
import static com.pclab.hardware.intelligence.HardwareFactsFixtures.pcCase;
import static com.pclab.hardware.intelligence.HardwareFactsFixtures.psu;
import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.intelligence.domain.BuildSelection;
import com.pclab.hardware.intelligence.domain.CompatibilityReport;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleDefinition;
import com.pclab.hardware.intelligence.domain.IntelligenceCategory;
import java.util.List;
import org.junit.jupiter.api.Test;

class CompatibilityEngineTest {

    private final CompatibilityEngine engine = new CompatibilityEngine();
    private final List<CompatibilityRuleDefinition> rules =
            CompatibilityRuleDefinition.standardRules();

    @Test
    void returnsSuccessWhenEveryInstalledComponentFits() {
        CompatibilityReport report = engine.evaluate(compatibleBuild(), rules);

        assertThat(report.status()).isEqualTo(CompatibilityReport.Status.SUCCESS);
        assertThat(report.issues()).isEmpty();
        assertThat(report.systemPowerWatt()).isEqualTo(564);
        assertThat(report.recommendedPsuWatt()).isEqualTo(800);
    }

    @Test
    void reportsTheSocketRuleWhenAnAm5CpuIsPlacedOnLga1700() {
        BuildSelection selection = compatibleBuild().with(
                IntelligenceCategory.MOTHERBOARD,
                motherboard("LGA1700", "DDR5", "ATX")
        );

        CompatibilityReport report = engine.evaluate(selection, rules);

        assertThat(report.status()).isEqualTo(CompatibilityReport.Status.ERROR);
        assertThat(report.issues()).extracting(CompatibilityReport.Issue::ruleCode)
                .contains("CPU_MOTHERBOARD_SOCKET");
    }

    @Test
    void reportsGpuClearanceWithExpectedAndActualLengths() {
        BuildSelection selection = compatibleBuild()
                .with(IntelligenceCategory.GPU, gpu(360, 360))
                .with(IntelligenceCategory.CASE, pcCase(340, List.of("ATX"), 360));

        CompatibilityReport.Issue issue = engine.evaluate(selection, rules).issues().stream()
                .filter(candidate -> candidate.ruleCode().equals("GPU_CASE_CLEARANCE"))
                .findFirst()
                .orElseThrow();

        assertThat(issue.expected()).isEqualTo("≤ 340mm");
        assertThat(issue.actual()).isEqualTo("360mm");
    }

    @Test
    void distinguishesPsuHeadroomWarningFromRawCapacityError() {
        BuildSelection highDraw = compatibleBuild()
                .with(IntelligenceCategory.CPU, cpu("AM5", 253))
                .with(IntelligenceCategory.GPU, gpu(304, 575))
                .with(IntelligenceCategory.COOLING, cooling(400, 360, List.of("AM5")))
                .with(IntelligenceCategory.POWER_SUPPLY, psu(1000));

        CompatibilityReport warning = engine.evaluate(highDraw, rules);
        CompatibilityReport error = engine.evaluate(
                highDraw.with(IntelligenceCategory.POWER_SUPPLY, psu(850)),
                rules
        );

        assertThat(warning.status()).isEqualTo(CompatibilityReport.Status.WARNING);
        assertThat(warning.recommendedPsuWatt()).isEqualTo(1200);
        assertThat(error.status()).isEqualTo(CompatibilityReport.Status.ERROR);
    }

    @Test
    void reportsIncompleteWhenARequiredCategoryIsAbsent() {
        BuildSelection selection = compatibleBuild().without(IntelligenceCategory.STORAGE);

        CompatibilityReport report = engine.evaluate(selection, rules);

        assertThat(report.status()).isEqualTo(CompatibilityReport.Status.INCOMPLETE);
        assertThat(report.missingCategories()).containsExactly(IntelligenceCategory.STORAGE);
    }
}
