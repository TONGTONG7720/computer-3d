package com.pclab.hardware.ai.model;

import com.pclab.hardware.ai.config.AiProperties;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnBean(StringRedisTemplate.class)
public class RedisAiUsageBudget implements AiUsageBudget {

    private static final Logger LOGGER = LoggerFactory.getLogger(RedisAiUsageBudget.class);
    private static final Duration COUNTER_TTL = Duration.ofDays(2);

    private final StringRedisTemplate redisTemplate;
    private final AiProperties properties;
    private final Clock clock;

    @Autowired
    public RedisAiUsageBudget(
            StringRedisTemplate redisTemplate,
            AiProperties properties
    ) {
        this(redisTemplate, properties, Clock.systemUTC());
    }

    RedisAiUsageBudget(
            StringRedisTemplate redisTemplate,
            AiProperties properties,
            Clock clock
    ) {
        this.redisTemplate = redisTemplate;
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    public boolean reserve(int estimatedTokens) {
        String date = LocalDate.now(clock.withZone(ZoneOffset.UTC)).toString();
        String key = "pclab:v1:ai:tokens:" + date;
        try {
            Long total = redisTemplate.opsForValue().increment(key, estimatedTokens);
            if (total != null && total == estimatedTokens) {
                redisTemplate.expire(key, COUNTER_TTL);
            }
            return total != null && total <= properties.getModel().getDailyTokenBudget();
        } catch (DataAccessException exception) {
            LOGGER.warn("AI token budget unavailable; using rules route");
            return false;
        }
    }
}
