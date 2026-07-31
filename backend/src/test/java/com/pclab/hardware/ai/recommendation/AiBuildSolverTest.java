package com.pclab.hardware.ai.recommendation;

import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.domain.AiRequirement.FormFactorPreference;
import com.pclab.hardware.ai.domain.AiRequirement.Priority;
import com.pclab.hardware.ai.domain.AiRequirement.Purpose;
import com.pclab.hardware.ai.domain.AiRequirement.Style;
import com.pclab.hardware.ai.parser.RuleRequirementParser;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class AiBuildSolverTest {

    private final AiBuildSolver solver = new AiBuildSolver(new AiCandidateScorer());
    private final RuleRequirementParser parser = new RuleRequirementParser();

    @Test
    void protectsGpuBudgetWhenGamingBuildMustFitEightThousand() {
        AiRequirement requirement = new AiRequirement(
                new BigDecimal("8000"),
                Set.of(Purpose.GAMING),
                Set.of(Priority.GPU),
                Set.of(),
                FormFactorPreference.ANY,
                Map.of(),
                1,
                List.of()
        );

        AiBuildCandidate result = solver.solve(new AiRecommendationInput(
                requirement,
                AiHardwareFixtures.catalogue(),
                Map.of()
        ));

        assertThat(result.metrics().compatibilityStatus()).isNotEqualTo("ERROR");
        assertThat(result.totalPrice()).isLessThanOrEqualTo(new BigDecimal("8000"));
        assertThat(result.components().get("gpu").id()).isEqualTo("gpu-nvidia-rtx5070");
    }

    @Test
    void upgradesPowerSupplyWhenRtx5090WouldExceedCurrentCapacity() {
        Map<String, String> current = Map.of(
                "cpu", "cpu-intel-i9-14900k",
                "gpu", "gpu-nvidia-rtx5070",
                "motherboard", "motherboard-z790-lab",
                "ram", "ram-ddr5-32gb",
                "storage", "storage-nvme-1tb",
                "cooling", "cooling-aio-360",
                "power_supply", "psu-850w-gold",
                "case", "case-future-glass"
        );

        AiBuildCandidate result = solver.solve(new AiRecommendationInput(
                parser.parse("显卡换成 RTX 5090，其他尽量不动"),
                AiHardwareFixtures.catalogue(),
                current
        ));

        assertThat(result.components().get("gpu").id()).isEqualTo("gpu-nvidia-rtx5090");
        assertThat(result.components().get("power_supply").id())
                .isEqualTo("psu-1200w-platinum");
        assertThat(result.changedDependencies())
                .extracting(AiBuildCandidate.ComponentChange::category)
                .containsExactly("power_supply");
    }

    @Test
    void disclosesPreferencesThatCatalogueCannotVerify() {
        AiRequirement requirement = new AiRequirement(
                new BigDecimal("9000"),
                Set.of(Purpose.GAMING),
                Set.of(Priority.GPU, Priority.QUIET),
                Set.of(Style.WHITE),
                FormFactorPreference.ANY,
                Map.of(),
                1,
                List.of()
        );

        AiBuildCandidate result = solver.solve(new AiRecommendationInput(
                requirement,
                AiHardwareFixtures.catalogue(),
                Map.of()
        ));

        assertThat(result.unfulfilledPreferences())
                .anyMatch(reason -> reason.contains("白色"))
                .anyMatch(reason -> reason.contains("静音"));
    }
}
