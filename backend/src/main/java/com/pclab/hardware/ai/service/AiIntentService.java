package com.pclab.hardware.ai.service;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.domain.AiRoute;
import com.pclab.hardware.ai.model.AiCostRouter;
import com.pclab.hardware.ai.model.AiIntentModelGateway;
import com.pclab.hardware.ai.model.AiModelInput;
import com.pclab.hardware.ai.model.AiModelResult;
import com.pclab.hardware.ai.parser.RuleRequirementParser;
import com.pclab.hardware.ai.rag.AiExternalServiceException;
import com.pclab.hardware.ai.rag.AiKnowledgeEvidence;
import com.pclab.hardware.ai.rag.KnowledgeQuery;
import com.pclab.hardware.ai.rag.KnowledgeRetriever;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AiIntentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AiIntentService.class);

    private final RuleRequirementParser parser;
    private final AiCostRouter router;
    private final KnowledgeRetriever retriever;
    private final AiIntentModelGateway modelGateway;
    private final AiPromptService promptService;

    public AiIntentService(
            RuleRequirementParser parser,
            AiCostRouter router,
            KnowledgeRetriever retriever,
            AiIntentModelGateway modelGateway,
            AiPromptService promptService
    ) {
        this.parser = parser;
        this.router = router;
        this.retriever = retriever;
        this.modelGateway = modelGateway;
        this.promptService = promptService;
    }

    public AiResolvedIntent resolve(String message) {
        AiRequirement ruleRequirement = parser.parse(message);
        List<AiKnowledgeEvidence> evidence = retriever.retrieve(
                new KnowledgeQuery(knowledgeTerms(message, ruleRequirement), 5)
        );
        AiRoute route = router.route(ruleRequirement);
        if (route == AiRoute.RULE) {
            return new AiResolvedIntent(ruleRequirement, route, evidence, 0, 0, 0);
        }
        ActiveAiPrompt prompt = promptService.activeIntentPrompt();
        try {
            AiModelResult result = modelGateway.parse(new AiModelInput(
                    message, prompt.content(), prompt.version(), evidence
            ));
            return new AiResolvedIntent(
                    result.requirement(),
                    AiRoute.LLM,
                    evidence,
                    prompt.version(),
                    result.inputTokens(),
                    result.outputTokens()
            );
        } catch (AiExternalServiceException exception) {
            LOGGER.warn("Optional intent model unavailable; using deterministic requirement parser");
            return new AiResolvedIntent(
                    ruleRequirement,
                    AiRoute.LLM_FALLBACK,
                    evidence,
                    prompt.version(),
                    0,
                    0
            );
        }
    }

    private static String knowledgeTerms(String message, AiRequirement requirement) {
        List<String> terms = new ArrayList<>();
        requirement.purposes().forEach(purpose -> terms.add(purpose.name()));
        requirement.priorities().forEach(priority -> terms.add(priority.name()));
        requirement.styles().forEach(style -> terms.add(style.name()));
        if (requirement.formFactor() != AiRequirement.FormFactorPreference.ANY) {
            terms.add(requirement.formFactor().name());
        }
        return terms.isEmpty() ? message : String.join(" ", terms);
    }
}
