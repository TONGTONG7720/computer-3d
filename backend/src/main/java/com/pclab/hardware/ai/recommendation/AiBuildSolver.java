package com.pclab.hardware.ai.recommendation;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.domain.AiRequirement.ComponentTarget;
import com.pclab.hardware.ai.domain.AiRequirement.Priority;
import com.pclab.hardware.ai.domain.AiRequirement.Purpose;
import com.pclab.hardware.ai.domain.AiRequirement.Style;
import com.pclab.hardware.ai.recommendation.AiBuildCandidate.Alternative;
import com.pclab.hardware.ai.recommendation.AiBuildCandidate.ComponentChange;
import com.pclab.hardware.service.BuildMetricsCalculator;
import com.pclab.hardware.service.BuildMetricsCalculator.BuildMetrics;
import com.pclab.hardware.vo.HardwareView;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class AiBuildSolver {

    private static final List<String> CATEGORY_ORDER = List.of(
            "cpu",
            "gpu",
            "motherboard",
            "ram",
            "storage",
            "cooling",
            "power_supply",
            "case"
    );

    private final AiCandidateScorer scorer;

    public AiBuildSolver(AiCandidateScorer scorer) {
        this.scorer = scorer;
    }

    public AiBuildCandidate solve(AiRecommendationInput input) {
        Map<String, List<HardwareView>> options = options(input);
        List<EvaluatedCandidate> candidates = new ArrayList<>();
        enumerate(options, 0, new LinkedHashMap<>(), input, candidates);
        if (candidates.isEmpty()) {
            throw new AiRecommendationUnavailableException(
                    "No compatible hardware combination satisfies the request"
            );
        }

        candidates.sort((left, right) -> compare(left, right, input));
        EvaluatedCandidate selected = candidates.getFirst();
        return toBuildCandidate(selected, candidates, input);
    }

    private static Map<String, List<HardwareView>> options(AiRecommendationInput input) {
        Map<String, List<HardwareView>> grouped = input.catalogue().stream()
                .filter(hardware -> hardware.builderCategory() != null)
                .collect(Collectors.groupingBy(HardwareView::builderCategory));
        Map<String, List<HardwareView>> result = new LinkedHashMap<>();
        for (String category : CATEGORY_ORDER) {
            List<HardwareView> categoryOptions = grouped.getOrDefault(category, List.of());
            categoryOptions = requestedOptions(category, categoryOptions, input.requirement());
            if (categoryOptions.isEmpty()) {
                throw new AiRecommendationUnavailableException(
                        "No active hardware is available for " + category
                );
            }
            result.put(category, categoryOptions);
        }
        return result;
    }

    private static List<HardwareView> requestedOptions(
            String category,
            List<HardwareView> options,
            AiRequirement requirement
    ) {
        ComponentTarget target = switch (category) {
            case "cpu" -> ComponentTarget.CPU;
            case "gpu" -> ComponentTarget.GPU;
            default -> null;
        };
        String requested = target == null ? null : requirement.requestedChanges().get(target);
        if (requested == null) {
            return options;
        }
        String model = normalize(requested);
        return options.stream()
                .filter(option -> normalize(option.name()).contains(model)
                        || normalize(option.id()).contains(model))
                .toList();
    }

    private void enumerate(
            Map<String, List<HardwareView>> options,
            int index,
            LinkedHashMap<String, HardwareView> components,
            AiRecommendationInput input,
            List<EvaluatedCandidate> candidates
    ) {
        if (index == CATEGORY_ORDER.size()) {
            evaluate(components, input).ifPresent(candidates::add);
            return;
        }
        String category = CATEGORY_ORDER.get(index);
        for (HardwareView hardware : options.get(category)) {
            components.put(category, hardware);
            enumerate(options, index + 1, components, input, candidates);
        }
        components.remove(category);
    }

    private java.util.Optional<EvaluatedCandidate> evaluate(
            Map<String, HardwareView> components,
            AiRecommendationInput input
    ) {
        Map<String, HardwareView> immutable = Map.copyOf(components);
        BuildMetrics metrics = BuildMetricsCalculator.calculate(immutable);
        if (metrics.compatibilityStatus().equals("ERROR")) {
            return java.util.Optional.empty();
        }
        Map<String, Integer> performance = immutable.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue().performance()));
        Purpose purpose = input.requirement().purposes().stream()
                .min(Enum::compareTo)
                .orElse(null);
        int purposeScore = purpose == null
                ? scorer.balancedScore(performance)
                : scorer.purposeScore(purpose, performance);
        return java.util.Optional.of(new EvaluatedCandidate(
                immutable,
                metrics,
                purposeScore,
                dependencyChanges(immutable, input).size()
        ));
    }

    private static int compare(
            EvaluatedCandidate left,
            EvaluatedCandidate right,
            AiRecommendationInput input
    ) {
        BigDecimal budget = input.requirement().budget();
        if (budget != null) {
            int budgetResult = Boolean.compare(isOverBudget(left, budget), isOverBudget(right, budget));
            if (budgetResult != 0) {
                return budgetResult;
            }
        }
        if (!input.currentComponents().isEmpty()) {
            int changeResult = Integer.compare(left.dependencyChangeCount(), right.dependencyChangeCount());
            if (changeResult != 0) {
                return changeResult;
            }
        }
        if (budget != null && isOverBudget(left, budget)) {
            return left.metrics().totalPrice().compareTo(right.metrics().totalPrice());
        }
        int scoreResult = Integer.compare(right.purposeScore(), left.purposeScore());
        if (scoreResult != 0) {
            return scoreResult;
        }
        return right.metrics().totalPrice().compareTo(left.metrics().totalPrice());
    }

    private static boolean isOverBudget(EvaluatedCandidate candidate, BigDecimal budget) {
        return candidate.metrics().totalPrice().compareTo(budget) > 0;
    }

    private static AiBuildCandidate toBuildCandidate(
            EvaluatedCandidate selected,
            List<EvaluatedCandidate> candidates,
            AiRecommendationInput input
    ) {
        BigDecimal budget = input.requirement().budget();
        boolean overBudget = budget != null && isOverBudget(selected, budget);
        BigDecimal variance = budget == null
                ? BigDecimal.ZERO
                : selected.metrics().totalPrice().subtract(budget);
        return new AiBuildCandidate(
                selected.components(),
                selected.metrics(),
                selected.purposeScore(),
                overBudget,
                variance,
                dependencyChanges(selected.components(), input),
                alternatives(selected, candidates),
                unfulfilledPreferences(input.requirement())
        );
    }

    private static List<ComponentChange> dependencyChanges(
            Map<String, HardwareView> selected,
            AiRecommendationInput input
    ) {
        Set<String> requestedCategories = input.requirement().requestedChanges().keySet().stream()
                .map(target -> target == ComponentTarget.CPU ? "cpu" : "gpu")
                .collect(Collectors.toUnmodifiableSet());
        List<ComponentChange> changes = new ArrayList<>();
        for (Map.Entry<String, String> current : input.currentComponents().entrySet()) {
            HardwareView chosen = selected.get(current.getKey());
            if (chosen != null
                    && !requestedCategories.contains(current.getKey())
                    && !chosen.id().equals(current.getValue())) {
                changes.add(new ComponentChange(current.getKey(), current.getValue(), chosen.id()));
            }
        }
        return changes;
    }

    private static List<Alternative> alternatives(
            EvaluatedCandidate selected,
            List<EvaluatedCandidate> candidates
    ) {
        return candidates.stream()
                .filter(candidate -> candidate != selected)
                .filter(candidate -> !candidate.components().get("gpu").id()
                        .equals(selected.components().get("gpu").id()))
                .limit(2)
                .map(candidate -> new Alternative(
                        candidate.components().get("gpu").name(),
                        candidate.metrics().totalPrice(),
                        candidate.purposeScore(),
                        candidate.purposeScore() < selected.purposeScore()
                                ? "目的性能评分较低"
                                : "整机价格更高"
                ))
                .toList();
    }

    private static List<String> unfulfilledPreferences(AiRequirement requirement) {
        List<String> reasons = new ArrayList<>();
        if (requirement.styles().contains(Style.WHITE)) {
            reasons.add("当前目录缺少经过验证的白色外观属性");
        }
        if (requirement.styles().contains(Style.RGB)) {
            reasons.add("当前目录缺少经过验证的 RGB 灯效属性");
        }
        if (requirement.priorities().contains(Priority.QUIET)) {
            reasons.add("当前目录缺少经过验证的静音分贝数据");
        }
        return reasons;
    }

    private static String normalize(String value) {
        return value.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
    }

    private record EvaluatedCandidate(
            Map<String, HardwareView> components,
            BuildMetrics metrics,
            int purposeScore,
            int dependencyChangeCount
    ) {
    }
}
