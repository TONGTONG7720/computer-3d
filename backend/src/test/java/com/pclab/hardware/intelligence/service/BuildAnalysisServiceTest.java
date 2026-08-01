package com.pclab.hardware.intelligence.service;

import static com.pclab.hardware.intelligence.HardwareFactsFixtures.compatibleBuild;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.pclab.hardware.intelligence.domain.CompatibilityRuleDefinition;
import com.pclab.hardware.intelligence.dto.BuildAnalysisRequest;
import com.pclab.hardware.intelligence.dto.BuildComponentIds;
import com.pclab.hardware.intelligence.engine.BudgetEngine;
import com.pclab.hardware.intelligence.engine.BuildOptimizer;
import com.pclab.hardware.intelligence.engine.CompatibilityEngine;
import com.pclab.hardware.intelligence.engine.PerformanceEngine;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BuildAnalysisServiceTest {

    @Mock
    private HardwareIntelligenceCatalogue catalogue;

    @Mock
    private CompatibilityRuleProvider ruleProvider;

    private BuildAnalysisService service;

    @BeforeEach
    void setUp() {
        CompatibilityEngine compatibilityEngine = new CompatibilityEngine();
        PerformanceEngine performanceEngine = new PerformanceEngine();
        service = new BuildAnalysisService(
                catalogue,
                ruleProvider,
                compatibilityEngine,
                performanceEngine,
                new BudgetEngine(),
                new BuildOptimizer(compatibilityEngine, performanceEngine)
        );
    }

    @Test
    void echoesRevisionAndReturnsAuthoritativeReports() {
        BuildComponentIds ids = ids();
        when(catalogue.resolve(ids)).thenReturn(compatibleBuild());
        when(ruleProvider.activeRules()).thenReturn(CompatibilityRuleDefinition.standardRules());

        var view = service.analyze(new BuildAnalysisRequest(
                12,
                new BigDecimal("10000"),
                ids
        ));

        assertThat(view.revision()).isEqualTo(12);
        assertThat(view.totalPrice()).isEqualByComparingTo("8000.00");
        assertThat(view.systemPowerWatt()).isEqualTo(564);
        assertThat(view.compatibility().status().name()).isEqualTo("SUCCESS");
        assertThat(view.performance().gaming().score()).isEqualTo(92);
        assertThat(view.budget().remaining()).isEqualByComparingTo("2000.00");
        assertThat(view.priceSource()).isEqualTo("PC_LAB_INTERNAL_REFERENCE");
    }

    private static BuildComponentIds ids() {
        return new BuildComponentIds(
                "cpu-test",
                "gpu-test",
                "motherboard-test",
                "ram-test",
                "storage-test",
                "cooling-test",
                "psu-test-850",
                "case-test"
        );
    }
}
