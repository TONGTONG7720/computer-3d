package com.pclab.hardware.ai.recommendation;

import com.pclab.hardware.ai.domain.AiRequirement.Purpose;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AiCandidateScorer {

    private static final Map<Purpose, Weights> WEIGHTS = Map.of(
            Purpose.GAMING, new Weights(55, 30, 10, 5),
            Purpose.OFFICE, new Weights(15, 35, 25, 25),
            Purpose.DESIGN, new Weights(35, 35, 15, 15),
            Purpose.PROGRAMMING, new Weights(15, 45, 25, 15),
            Purpose.AI_TRAINING, new Weights(65, 15, 15, 5)
    );

    public int purposeScore(Purpose purpose, Map<String, Integer> scores) {
        Weights weights = WEIGHTS.get(purpose);
        int weighted = score(scores, "gpu") * weights.gpu()
                + score(scores, "cpu") * weights.cpu()
                + score(scores, "ram") * weights.ram()
                + score(scores, "storage") * weights.storage();
        return Math.round(weighted / 100.0f);
    }

    public int balancedScore(Map<String, Integer> scores) {
        int total = score(scores, "gpu")
                + score(scores, "cpu")
                + score(scores, "ram")
                + score(scores, "storage");
        return Math.round(total / 4.0f);
    }

    private static int score(Map<String, Integer> scores, String category) {
        return scores.getOrDefault(category, 0);
    }

    private record Weights(int gpu, int cpu, int ram, int storage) {
    }
}
