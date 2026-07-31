package com.pclab.hardware.ai.model;

import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.ai.config.AiProperties;
import com.pclab.hardware.ai.domain.AiRoute;
import com.pclab.hardware.ai.parser.RuleRequirementParser;
import org.junit.jupiter.api.Test;

class AiCostRouterTest {

    private final RuleRequirementParser parser = new RuleRequirementParser();

    @Test
    void keepsExactComponentChangesOnRulesRoute() {
        AiProperties properties = enabledProperties();
        AiCostRouter router = new AiCostRouter(properties, tokens -> true);

        AiRoute route = router.route(parser.parse("显卡换成 RTX 5090"));

        assertThat(route).isEqualTo(AiRoute.RULE);
    }

    @Test
    void routesAmbiguousNarrativeToModelWhenQuotaIsAvailable() {
        AiProperties properties = enabledProperties();
        AiCostRouter router = new AiCostRouter(properties, tokens -> true);

        AiRoute route = router.route(parser.parse("我想配一台以后也方便升级的电脑"));

        assertThat(route).isEqualTo(AiRoute.LLM);
    }

    @Test
    void fallsBackToRulesWhenDailyQuotaCannotBeReserved() {
        AiProperties properties = enabledProperties();
        AiCostRouter router = new AiCostRouter(properties, tokens -> false);

        AiRoute route = router.route(parser.parse("我想配一台以后也方便升级的电脑"));

        assertThat(route).isEqualTo(AiRoute.RULE);
    }

    private static AiProperties enabledProperties() {
        AiProperties properties = new AiProperties();
        properties.getModel().setEnabled(true);
        properties.getModel().setEstimatedTokensPerRequest(1200);
        return properties;
    }
}
