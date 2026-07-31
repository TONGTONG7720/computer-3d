package com.pclab.hardware.ai.model;

import com.pclab.hardware.ai.domain.AiRequirement;

public record AiModelResult(
        AiRequirement requirement,
        int inputTokens,
        int outputTokens
) {
}
