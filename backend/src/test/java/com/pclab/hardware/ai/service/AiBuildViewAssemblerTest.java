package com.pclab.hardware.ai.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.domain.AiRequirement.FormFactorPreference;
import com.pclab.hardware.ai.domain.AiRequirement.Purpose;
import com.pclab.hardware.ai.domain.AiRoute;
import com.pclab.hardware.ai.recommendation.AiBuildCandidate;
import com.pclab.hardware.service.BuildMetricsCalculator.BuildMetrics;
import com.pclab.hardware.vo.BuildConfigView;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class AiBuildViewAssemblerTest {

    private final AiBuildViewAssembler assembler = new AiBuildViewAssembler();

    @Test
    void exposesTheBudgetShortfallForTheClosestCompatibleBuild() {
        AiBuildCandidate candidate = new AiBuildCandidate(
                Map.of(),
                new BuildMetrics(new BigDecimal("9000"), 500, 80, "SUCCESS"),
                80,
                true,
                new BigDecimal("1000"),
                List.of(),
                List.of(),
                List.of()
        );
        BuildConfigView build = new BuildConfigView(
                "build-1",
                "Closest compatible build",
                Map.of(),
                List.of(),
                new BigDecimal("9000"),
                80,
                500,
                "SUCCESS",
                LocalDateTime.of(2026, 8, 1, 0, 0)
        );
        AiRequirement requirement = new AiRequirement(
                new BigDecimal("8000"),
                Set.of(Purpose.GAMING),
                Set.of(),
                Set.of(),
                FormFactorPreference.ANY,
                Map.of(),
                1,
                List.of()
        );

        var view = assembler.toView(
                "request-1",
                "session-1",
                new AiResolvedIntent(requirement, AiRoute.RULE, List.of(), 1, 0, 0),
                new AiConfigurationResult(candidate, build, "Closest build", Map.of())
        );

        assertThat(view.budgetShortfall()).isEqualByComparingTo("1000");
        assertThat(view.requiresConfirmation()).isTrue();
    }
}
