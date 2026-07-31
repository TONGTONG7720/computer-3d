package com.pclab.hardware.ai.model;

import com.pclab.hardware.ai.config.AiProperties;
import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.domain.AiRoute;
import org.springframework.stereotype.Component;

@Component
public class AiCostRouter {

    private static final double RULE_CONFIDENCE = 0.85;

    private final AiProperties properties;
    private final AiUsageBudget usageBudget;

    public AiCostRouter(AiProperties properties, AiUsageBudget usageBudget) {
        this.properties = properties;
        this.usageBudget = usageBudget;
    }

    public AiRoute route(AiRequirement requirement) {
        if (!properties.getModel().isEnabled()
                || !requirement.requestedChanges().isEmpty()
                || requirement.confidence() >= RULE_CONFIDENCE) {
            return AiRoute.RULE;
        }
        int estimatedTokens = properties.getModel().getEstimatedTokensPerRequest();
        return usageBudget.reserve(estimatedTokens) ? AiRoute.LLM : AiRoute.RULE;
    }
}
