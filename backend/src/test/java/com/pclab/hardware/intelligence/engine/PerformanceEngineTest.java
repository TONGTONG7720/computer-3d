package com.pclab.hardware.intelligence.engine;

import static com.pclab.hardware.intelligence.HardwareFactsFixtures.compatibleBuild;
import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.intelligence.domain.IntelligenceCategory;
import com.pclab.hardware.intelligence.domain.PerformanceReport;
import org.junit.jupiter.api.Test;

class PerformanceEngineTest {

    private final PerformanceEngine engine = new PerformanceEngine();

    @Test
    void appliesTheApprovedGamingCreatorAndAiWeights() {
        PerformanceReport report = engine.calculate(compatibleBuild());

        assertThat(report.gaming().score()).isEqualTo(92);
        assertThat(report.creator().score()).isEqualTo(88);
        assertThat(report.ai().score()).isEqualTo(92);
        assertThat(report.overall()).isEqualTo(91);
        assertThat(report.complete()).isTrue();
        assertThat(report.gaming().contributions())
                .extracting(PerformanceReport.Contribution::category)
                .containsExactly(
                        IntelligenceCategory.GPU,
                        IntelligenceCategory.CPU,
                        IntelligenceCategory.RAM,
                        IntelligenceCategory.STORAGE
                );
    }

    @Test
    void marksAProfileIncompleteWhenStorageIsMissing() {
        PerformanceReport report = engine.calculate(
                compatibleBuild().without(IntelligenceCategory.STORAGE)
        );

        assertThat(report.complete()).isFalse();
        assertThat(report.gaming().score()).isEqualTo(85);
    }
}
