package com.pclab.hardware.ai.service;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.recommendation.AiBuildCandidate;
import com.pclab.hardware.ai.recommendation.AiBuildSolver;
import com.pclab.hardware.ai.recommendation.AiRecommendationInput;
import com.pclab.hardware.dto.SaveBuildRequest;
import com.pclab.hardware.service.BuildConfigService;
import com.pclab.hardware.vo.BuildConfigView;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AiConfigurationService {

    private final AiCatalogueService catalogueService;
    private final AiBuildSolver solver;
    private final BuildConfigService buildConfigService;
    private final AiExplanationComposer explanationComposer;

    public AiConfigurationService(
            AiCatalogueService catalogueService,
            AiBuildSolver solver,
            BuildConfigService buildConfigService,
            AiExplanationComposer explanationComposer
    ) {
        this.catalogueService = catalogueService;
        this.solver = solver;
        this.buildConfigService = buildConfigService;
        this.explanationComposer = explanationComposer;
    }

    public AiConfigurationResult generate(
            AiRequirement requirement,
            Map<String, String> currentComponents
    ) {
        AiBuildCandidate candidate = solver.solve(new AiRecommendationInput(
                requirement,
                catalogueService.activeCatalogue(),
                currentComponents
        ));
        Map<String, String> componentIds = new LinkedHashMap<>();
        candidate.components().forEach((category, hardware) ->
                componentIds.put(category, hardware.id()));
        BuildConfigView build = buildConfigService.save(new SaveBuildRequest(
                buildName(requirement),
                componentIds
        ));
        AiExplanationComposer.AiExplanation explanation = explanationComposer.explain(
                requirement,
                candidate
        );
        return new AiConfigurationResult(
                candidate,
                build,
                explanation.summary(),
                explanation.componentReasons()
        );
    }

    private static String buildName(AiRequirement requirement) {
        String purpose = requirement.purposes().stream()
                .findFirst()
                .map(Enum::name)
                .orElse("BALANCED");
        return "AI · " + purpose + " MACHINE";
    }
}
