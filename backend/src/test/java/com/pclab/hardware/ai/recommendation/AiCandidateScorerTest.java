package com.pclab.hardware.ai.recommendation;

import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.ai.domain.AiRequirement.Purpose;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AiCandidateScorerTest {

    private final AiCandidateScorer scorer = new AiCandidateScorer();

    @Test
    void givesGamingMoreWeightToGpuThanCpu() {
        Map<String, Integer> gpuHeavy = Map.of("gpu", 100, "cpu", 70, "ram", 70, "storage", 70);
        Map<String, Integer> cpuHeavy = Map.of("gpu", 70, "cpu", 100, "ram", 70, "storage", 70);

        assertThat(scorer.purposeScore(Purpose.GAMING, gpuHeavy))
                .isGreaterThan(scorer.purposeScore(Purpose.GAMING, cpuHeavy));
    }

    @Test
    void givesProgrammingMoreWeightToCpuThanGpu() {
        Map<String, Integer> gpuHeavy = Map.of("gpu", 100, "cpu", 70, "ram", 70, "storage", 70);
        Map<String, Integer> cpuHeavy = Map.of("gpu", 70, "cpu", 100, "ram", 70, "storage", 70);

        assertThat(scorer.purposeScore(Purpose.PROGRAMMING, cpuHeavy))
                .isGreaterThan(scorer.purposeScore(Purpose.PROGRAMMING, gpuHeavy));
    }
}
