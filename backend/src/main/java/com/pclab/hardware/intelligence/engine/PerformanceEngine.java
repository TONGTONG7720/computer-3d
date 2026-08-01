package com.pclab.hardware.intelligence.engine;

import com.pclab.hardware.intelligence.domain.BuildSelection;
import com.pclab.hardware.intelligence.domain.HardwareFacts;
import com.pclab.hardware.intelligence.domain.IntelligenceCategory;
import com.pclab.hardware.intelligence.domain.PerformanceProfile;
import com.pclab.hardware.intelligence.domain.PerformanceReport;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.ToIntFunction;
import org.springframework.stereotype.Component;

@Component
public class PerformanceEngine {

    private static final Map<IntelligenceCategory, Double> GAMING_WEIGHTS = weights(
            IntelligenceCategory.GPU, 0.50,
            IntelligenceCategory.CPU, 0.30,
            IntelligenceCategory.RAM, 0.10,
            IntelligenceCategory.STORAGE, 0.10
    );
    private static final Map<IntelligenceCategory, Double> CREATOR_WEIGHTS = weights(
            IntelligenceCategory.CPU, 0.40,
            IntelligenceCategory.GPU, 0.30,
            IntelligenceCategory.RAM, 0.15,
            IntelligenceCategory.STORAGE, 0.15
    );
    private static final Map<IntelligenceCategory, Double> AI_WEIGHTS = weights(
            IntelligenceCategory.GPU, 0.60,
            IntelligenceCategory.CPU, 0.20,
            IntelligenceCategory.RAM, 0.15,
            IntelligenceCategory.STORAGE, 0.05
    );

    public PerformanceReport calculate(BuildSelection selection) {
        PerformanceReport.Profile gaming = profile(
                selection,
                GAMING_WEIGHTS,
                PerformanceProfile::gaming
        );
        PerformanceReport.Profile creator = profile(
                selection,
                CREATOR_WEIGHTS,
                PerformanceProfile::creator
        );
        PerformanceReport.Profile ai = profile(selection, AI_WEIGHTS, PerformanceProfile::ai);
        int overall = (int) Math.round((gaming.score() + creator.score() + ai.score()) / 3.0);
        boolean complete = GAMING_WEIGHTS.keySet().stream()
                .allMatch(category -> selection.get(category).isPresent());
        return new PerformanceReport(gaming, creator, ai, overall, complete);
    }

    private PerformanceReport.Profile profile(
            BuildSelection selection,
            Map<IntelligenceCategory, Double> weights,
            ToIntFunction<PerformanceProfile> scoreReader
    ) {
        List<PerformanceReport.Contribution> contributions = new ArrayList<>();
        double total = 0;
        for (Map.Entry<IntelligenceCategory, Double> entry : weights.entrySet()) {
            HardwareFacts facts = selection.get(entry.getKey()).orElse(null);
            int input = facts == null ? 0 : scoreReader.applyAsInt(facts.performance());
            double weighted = input * entry.getValue();
            total += weighted;
            contributions.add(new PerformanceReport.Contribution(
                    entry.getKey(),
                    input,
                    entry.getValue(),
                    weighted
            ));
        }
        return new PerformanceReport.Profile((int) Math.round(total), contributions);
    }

    private static Map<IntelligenceCategory, Double> weights(Object... values) {
        Map<IntelligenceCategory, Double> weights = new LinkedHashMap<>();
        for (int index = 0; index < values.length; index += 2) {
            weights.put(
                    (IntelligenceCategory) values[index],
                    (Double) values[index + 1]
            );
        }
        return Collections.unmodifiableMap(weights);
    }
}
