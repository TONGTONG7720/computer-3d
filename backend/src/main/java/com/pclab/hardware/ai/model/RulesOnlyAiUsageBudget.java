package com.pclab.hardware.ai.model;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(StringRedisTemplate.class)
public class RulesOnlyAiUsageBudget implements AiUsageBudget {

    @Override
    public boolean reserve(int estimatedTokens) {
        return false;
    }
}
