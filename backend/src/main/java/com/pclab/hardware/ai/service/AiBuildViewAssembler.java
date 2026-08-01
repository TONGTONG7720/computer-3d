package com.pclab.hardware.ai.service;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.rag.AiKnowledgeEvidence;
import com.pclab.hardware.ai.recommendation.AiBuildCandidate;
import com.pclab.hardware.ai.vo.AiBuildView;
import com.pclab.hardware.ai.vo.AiBuildView.AlternativeView;
import com.pclab.hardware.ai.vo.AiBuildView.ComponentChangeView;
import com.pclab.hardware.ai.vo.AiBuildView.KnowledgeSourceView;
import com.pclab.hardware.ai.vo.AiBuildView.RequirementView;
import java.math.BigDecimal;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class AiBuildViewAssembler {

    public AiBuildView toView(
            String requestId,
            String sessionId,
            AiResolvedIntent intent,
            AiConfigurationResult configuration
    ) {
        AiBuildCandidate candidate = configuration.candidate();
        return new AiBuildView(
                requestId,
                sessionId,
                intent.route(),
                requirementView(intent.requirement()),
                configuration.build().publicId(),
                configuration.build().components(),
                candidate.totalPrice(),
                candidate.overBudget() ? candidate.budgetVariance() : BigDecimal.ZERO,
                candidate.purposeScore(),
                candidate.metrics().powerUsageWatt(),
                candidate.metrics().compatibilityStatus(),
                candidate.overBudget() || !candidate.changedDependencies().isEmpty(),
                configuration.summary(),
                configuration.componentReasons(),
                candidate.changedDependencies().stream()
                        .map(change -> new ComponentChangeView(
                                change.category(),
                                change.previousHardwareId(),
                                change.selectedHardwareId()
                        ))
                        .toList(),
                candidate.alternatives().stream()
                        .map(alternative -> new AlternativeView(
                                alternative.label(),
                                alternative.totalPrice(),
                                alternative.purposeScore(),
                                alternative.tradeoff()
                        ))
                        .toList(),
                intent.evidence().stream().map(AiBuildViewAssembler::sourceView).toList(),
                candidate.unfulfilledPreferences()
        );
    }

    private static RequirementView requirementView(AiRequirement requirement) {
        Map<String, String> changes = requirement.requestedChanges().entrySet().stream()
                .collect(Collectors.toUnmodifiableMap(
                        entry -> entry.getKey().name(),
                        Map.Entry::getValue
                ));
        return new RequirementView(
                requirement.budget(),
                requirement.purposes().stream().map(Enum::name).sorted().toList(),
                requirement.priorities().stream().map(Enum::name).sorted().toList(),
                requirement.styles().stream().map(Enum::name).sorted().toList(),
                requirement.formFactor().name(),
                changes,
                requirement.missingInformation()
        );
    }

    private static KnowledgeSourceView sourceView(AiKnowledgeEvidence evidence) {
        return new KnowledgeSourceView(
                evidence.sourceKey(),
                evidence.title(),
                evidence.score(),
                evidence.revision()
        );
    }
}
