package com.pclab.hardware.ai.recommendation;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.vo.HardwareView;
import java.util.List;
import java.util.Map;

public record AiRecommendationInput(
        AiRequirement requirement,
        List<HardwareView> catalogue,
        Map<String, String> currentComponents
) {

    public AiRecommendationInput {
        catalogue = List.copyOf(catalogue);
        currentComponents = Map.copyOf(currentComponents);
    }
}
