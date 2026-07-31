package com.pclab.hardware.ai.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.domain.AiRequirement.FormFactorPreference;
import com.pclab.hardware.ai.domain.AiRoute;
import com.pclab.hardware.ai.model.AiCostRouter;
import com.pclab.hardware.ai.model.AiIntentModelGateway;
import com.pclab.hardware.ai.model.AiModelInput;
import com.pclab.hardware.ai.parser.RuleRequirementParser;
import com.pclab.hardware.ai.rag.AiExternalServiceException;
import com.pclab.hardware.ai.rag.AiKnowledgeEvidence;
import com.pclab.hardware.ai.rag.KnowledgeQuery;
import com.pclab.hardware.ai.rag.KnowledgeRetriever;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class AiIntentServiceTest {

    @Test
    void fallsBackToRulesWhenOptionalModelIsUnavailable() {
        RuleRequirementParser parser = mock(RuleRequirementParser.class);
        AiCostRouter router = mock(AiCostRouter.class);
        KnowledgeRetriever retriever = mock(KnowledgeRetriever.class);
        AiIntentModelGateway gateway = mock(AiIntentModelGateway.class);
        AiPromptService prompts = mock(AiPromptService.class);
        AiRequirement ruleRequirement = ambiguousRequirement();
        AiKnowledgeEvidence evidence = new AiKnowledgeEvidence(
                "WORKLOAD_GAMING_V1", "游戏配置", "优先显卡", 0.91, 1
        );
        when(parser.parse("帮我配一台主机")).thenReturn(ruleRequirement);
        when(router.route(ruleRequirement)).thenReturn(AiRoute.LLM);
        when(retriever.retrieve(new KnowledgeQuery("帮我配一台主机", 5)))
                .thenReturn(List.of(evidence));
        when(prompts.activeIntentPrompt()).thenReturn(new ActiveAiPrompt("system", 3));
        when(gateway.parse(new AiModelInput(
                "帮我配一台主机", "system", 3, List.of(evidence)
        ))).thenThrow(new AiExternalServiceException("MODEL_UNAVAILABLE"));

        AiResolvedIntent result = new AiIntentService(
                parser, router, retriever, gateway, prompts
        ).resolve("帮我配一台主机");

        assertThat(result.route()).isEqualTo(AiRoute.LLM_FALLBACK);
        assertThat(result.requirement()).isSameAs(ruleRequirement);
        assertThat(result.evidence()).containsExactly(evidence);
        assertThat(result.inputTokens()).isZero();
        assertThat(result.outputTokens()).isZero();
    }

    private static AiRequirement ambiguousRequirement() {
        return new AiRequirement(
                null,
                Set.of(),
                Set.of(),
                Set.of(),
                FormFactorPreference.ANY,
                Map.of(),
                0.64,
                List.of("BUDGET", "PURPOSE")
        );
    }
}
