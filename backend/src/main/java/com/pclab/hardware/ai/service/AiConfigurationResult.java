package com.pclab.hardware.ai.service;

import com.pclab.hardware.ai.recommendation.AiBuildCandidate;
import com.pclab.hardware.vo.BuildConfigView;
import java.util.Map;

public record AiConfigurationResult(
        AiBuildCandidate candidate,
        BuildConfigView build,
        String summary,
        Map<String, String> componentReasons
) {

    public AiConfigurationResult {
        componentReasons = Map.copyOf(componentReasons);
    }
}
