package com.pclab.hardware.ai.vo;

import com.pclab.hardware.ai.domain.AiRoute;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AiBuildView(
        String requestId,
        String sessionId,
        AiRoute route,
        RequirementView requirement,
        String configId,
        Map<String, String> components,
        BigDecimal totalPrice,
        int performanceScore,
        int powerUsageWatt,
        String compatibilityStatus,
        boolean requiresConfirmation,
        String assistantMessage,
        Map<String, String> componentReasons,
        List<ComponentChangeView> changedDependencies,
        List<AlternativeView> alternatives,
        List<KnowledgeSourceView> knowledgeSources,
        List<String> unfulfilledPreferences
) {

    public AiBuildView {
        components = Map.copyOf(components);
        componentReasons = Map.copyOf(componentReasons);
        changedDependencies = List.copyOf(changedDependencies);
        alternatives = List.copyOf(alternatives);
        knowledgeSources = List.copyOf(knowledgeSources);
        unfulfilledPreferences = List.copyOf(unfulfilledPreferences);
    }

    public record RequirementView(
            BigDecimal budget,
            List<String> purposes,
            List<String> priorities,
            List<String> styles,
            String formFactor,
            Map<String, String> requestedChanges,
            List<String> missingInformation
    ) {
    }

    public record ComponentChangeView(
            String category,
            String previousHardwareId,
            String selectedHardwareId
    ) {
    }

    public record AlternativeView(
            String label,
            BigDecimal totalPrice,
            int purposeScore,
            String tradeoff
    ) {
    }

    public record KnowledgeSourceView(
            String sourceKey,
            String title,
            double score,
            int revision
    ) {
    }
}
