package com.pclab.hardware.intelligence.engine;

import com.pclab.hardware.intelligence.domain.BuildOptimizationPlan;
import com.pclab.hardware.intelligence.domain.BuildSelection;
import com.pclab.hardware.intelligence.domain.CompatibilityReport;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleDefinition;
import com.pclab.hardware.intelligence.domain.ComponentSpecification;
import com.pclab.hardware.intelligence.domain.HardwareFacts;
import com.pclab.hardware.intelligence.domain.IntelligenceCategory;
import com.pclab.hardware.intelligence.domain.OptimizationGoal;
import com.pclab.hardware.intelligence.domain.OptimizationSuggestion;
import com.pclab.hardware.intelligence.domain.PerformanceReport;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class BuildOptimizer {

    private final CompatibilityEngine compatibilityEngine;
    private final PerformanceEngine performanceEngine;

    public BuildOptimizer(
            CompatibilityEngine compatibilityEngine,
            PerformanceEngine performanceEngine
    ) {
        this.compatibilityEngine = compatibilityEngine;
        this.performanceEngine = performanceEngine;
    }

    public BuildOptimizationPlan optimize(
            BuildSelection input,
            Map<IntelligenceCategory, List<HardwareFacts>> catalogue,
            BigDecimal budget,
            OptimizationGoal goal,
            List<CompatibilityRuleDefinition> rules
    ) {
        requireBudget(budget);
        BuildSelection current = input;
        List<OptimizationSuggestion> suggestions = new ArrayList<>();

        RepairResult compatibilityRepair = repairCompatibility(current, catalogue, goal, rules);
        current = compatibilityRepair.selection();
        suggestions.addAll(compatibilityRepair.suggestions());

        UpgradeResult memoryUpgrade = upgradeMemoryBottleneck(
                current,
                catalogue.getOrDefault(IntelligenceCategory.RAM, List.of()),
                budget,
                goal,
                rules
        );
        current = memoryUpgrade.selection();
        if (memoryUpgrade.suggestion() != null) {
            suggestions.add(memoryUpgrade.suggestion());
        }

        if (current.totalPrice().compareTo(budget) > 0) {
            Set<IntelligenceCategory> preferredCategories = EnumSet.allOf(IntelligenceCategory.class);
            if (goal == OptimizationGoal.GAMING || goal == OptimizationGoal.AI) {
                preferredCategories.remove(IntelligenceCategory.GPU);
            }
            BudgetResult preferred = reduceBudget(
                    current,
                    catalogue,
                    budget,
                    goal,
                    rules,
                    preferredCategories
            );
            current = preferred.selection();
            suggestions.addAll(preferred.suggestions());
        }

        if (current.totalPrice().compareTo(budget) > 0
                && (goal == OptimizationGoal.GAMING || goal == OptimizationGoal.AI)) {
            BudgetResult gpuFallback = reduceBudget(
                    current,
                    catalogue,
                    budget,
                    goal,
                    rules,
                    EnumSet.of(IntelligenceCategory.GPU)
            );
            current = gpuFallback.selection();
            suggestions.addAll(gpuFallback.suggestions());
        }

        BigDecimal unresolved = current.totalPrice().subtract(budget)
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
        return new BuildOptimizationPlan(
                current,
                suggestions,
                unresolved,
                !sameSelection(input, current)
        );
    }

    private RepairResult repairCompatibility(
            BuildSelection input,
            Map<IntelligenceCategory, List<HardwareFacts>> catalogue,
            OptimizationGoal goal,
            List<CompatibilityRuleDefinition> rules
    ) {
        BuildSelection current = input;
        List<OptimizationSuggestion> suggestions = new ArrayList<>();
        while (true) {
            int currentErrors = errorCount(current, rules);
            if (currentErrors == 0) {
                break;
            }
            ReplacementOption best = allOptions(current, catalogue, goal, catalogue.keySet())
                    .stream()
                    .filter(option -> errorCount(option.selection(), rules) < currentErrors)
                    .min(Comparator
                            .comparingInt((ReplacementOption option) ->
                                    errorCount(option.selection(), rules))
                            .thenComparing(ReplacementOption::priceDelta)
                            .thenComparingInt(option -> option.category().ordinal())
                            .thenComparing(option -> option.replacement().id()))
                    .orElse(null);
            if (best == null) {
                break;
            }
            suggestions.add(suggestion(
                    "COMPATIBILITY_REPAIR",
                    "修复兼容冲突",
                    "替换 " + best.category().builderCategory() + " 后减少兼容错误",
                    current,
                    best,
                    goal
            ));
            current = best.selection();
        }
        return new RepairResult(current, suggestions);
    }

    private UpgradeResult upgradeMemoryBottleneck(
            BuildSelection input,
            List<HardwareFacts> memoryCatalogue,
            BigDecimal budget,
            OptimizationGoal goal,
            List<CompatibilityRuleDefinition> rules
    ) {
        HardwareFacts cpu = input.get(IntelligenceCategory.CPU).orElse(null);
        HardwareFacts gpu = input.get(IntelligenceCategory.GPU).orElse(null);
        HardwareFacts memory = input.get(IntelligenceCategory.RAM).orElse(null);
        if (cpu == null || gpu == null || memory == null
                || !(memory.specification() instanceof ComponentSpecification.Memory memorySpec)
                || memorySpec.capacityGb() >= 32
                || goal.score(performanceEngine.calculate(input)) < 80
                || cpu.performance().creator() < 85
                || gpu.performance().gaming() < 90) {
            return new UpgradeResult(input, null);
        }

        ReplacementOption best = memoryCatalogue.stream()
                .filter(candidate -> !candidate.id().equals(memory.id()))
                .filter(candidate -> candidate.specification() instanceof ComponentSpecification.Memory)
                .filter(candidate -> ((ComponentSpecification.Memory) candidate.specification())
                        .capacityGb() >= 32)
                .map(candidate -> option(input, IntelligenceCategory.RAM, candidate, goal))
                .filter(option -> option.selection().totalPrice().compareTo(budget) <= 0)
                .filter(option -> errorCount(option.selection(), rules) == 0)
                .min(Comparator
                        .comparing((ReplacementOption option) -> option.replacement().price())
                        .thenComparing(
                                option -> option.replacement().id()
                        ))
                .orElse(null);
        if (best == null) {
            return new UpgradeResult(input, null);
        }
        return new UpgradeResult(
                best.selection(),
                suggestion(
                        "RAM_CAPACITY_BOTTLENECK",
                        "升级至至少 32GB 内存",
                        "高性能 CPU/GPU 配合 16GB 内存会限制大型游戏、创作和 AI 工作负载",
                        input,
                        best,
                        goal
                )
        );
    }

    private BudgetResult reduceBudget(
            BuildSelection input,
            Map<IntelligenceCategory, List<HardwareFacts>> catalogue,
            BigDecimal budget,
            OptimizationGoal goal,
            List<CompatibilityRuleDefinition> rules,
            Set<IntelligenceCategory> allowedCategories
    ) {
        BuildSelection current = input;
        List<OptimizationSuggestion> suggestions = new ArrayList<>();
        while (current.totalPrice().compareTo(budget) > 0) {
            ReplacementOption best = allOptions(
                    current,
                    catalogue,
                    goal,
                    allowedCategories
            ).stream()
                    .filter(option -> option.savings().signum() > 0)
                    .filter(option -> errorCount(option.selection(), rules) == 0)
                    .min(budgetComparator())
                    .orElse(null);
            if (best == null) {
                break;
            }
            suggestions.add(suggestion(
                    "BUDGET_REBALANCE",
                    "降低 " + best.category().builderCategory() + " 成本",
                    "以较低性能损失释放预算，保留配置的主要性能方向",
                    current,
                    best,
                    goal
            ));
            current = best.selection();
        }
        return new BudgetResult(current, suggestions);
    }

    private List<ReplacementOption> allOptions(
            BuildSelection selection,
            Map<IntelligenceCategory, List<HardwareFacts>> catalogue,
            OptimizationGoal goal,
            Set<IntelligenceCategory> allowedCategories
    ) {
        List<ReplacementOption> options = new ArrayList<>();
        for (IntelligenceCategory category : IntelligenceCategory.values()) {
            if (!allowedCategories.contains(category) || selection.get(category).isEmpty()) {
                continue;
            }
            HardwareFacts installed = selection.get(category).orElseThrow();
            for (HardwareFacts candidate : catalogue.getOrDefault(category, List.of())) {
                if (candidate.id().equals(installed.id())) {
                    continue;
                }
                options.add(option(selection, category, candidate, goal));
            }
        }
        return options;
    }

    private ReplacementOption option(
            BuildSelection selection,
            IntelligenceCategory category,
            HardwareFacts replacement,
            OptimizationGoal goal
    ) {
        HardwareFacts current = selection.get(category).orElseThrow();
        BuildSelection candidate = selection.with(category, replacement);
        int before = goal.score(performanceEngine.calculate(selection));
        int after = goal.score(performanceEngine.calculate(candidate));
        BigDecimal delta = replacement.price().subtract(current.price());
        return new ReplacementOption(
                category,
                replacement,
                candidate,
                delta,
                delta.negate(),
                Math.max(0, before - after)
        );
    }

    private Comparator<ReplacementOption> budgetComparator() {
        return Comparator
                .comparingDouble((ReplacementOption option) ->
                        option.performanceLoss() / option.savings().doubleValue())
                .thenComparing(ReplacementOption::savings, Comparator.reverseOrder())
                .thenComparingInt(option -> option.category().ordinal())
                .thenComparing(option -> option.replacement().id());
    }

    private OptimizationSuggestion suggestion(
            String code,
            String title,
            String reason,
            BuildSelection before,
            ReplacementOption option,
            OptimizationGoal goal
    ) {
        int beforeScore = goal.score(performanceEngine.calculate(before));
        int afterScore = goal.score(performanceEngine.calculate(option.selection()));
        return new OptimizationSuggestion(
                code,
                title,
                reason,
                Map.of(option.category(), option.replacement().id()),
                option.priceDelta().setScale(2, RoundingMode.HALF_UP),
                afterScore - beforeScore,
                true
        );
    }

    private int errorCount(
            BuildSelection selection,
            List<CompatibilityRuleDefinition> rules
    ) {
        CompatibilityReport report = compatibilityEngine.evaluate(selection, rules);
        return (int) report.issues().stream()
                .filter(issue -> issue.severity()
                        == com.pclab.hardware.intelligence.domain.CompatibilitySeverity.ERROR)
                .count();
    }

    private boolean sameSelection(BuildSelection first, BuildSelection second) {
        return java.util.Arrays.stream(IntelligenceCategory.values()).allMatch(category ->
                first.get(category).map(HardwareFacts::id)
                        .equals(second.get(category).map(HardwareFacts::id)));
    }

    private static void requireBudget(BigDecimal budget) {
        if (budget == null || budget.signum() < 0) {
            throw new IllegalArgumentException("budget must be non-negative");
        }
    }

    private record ReplacementOption(
            IntelligenceCategory category,
            HardwareFacts replacement,
            BuildSelection selection,
            BigDecimal priceDelta,
            BigDecimal savings,
            int performanceLoss
    ) {
    }

    private record RepairResult(
            BuildSelection selection,
            List<OptimizationSuggestion> suggestions
    ) {
    }

    private record UpgradeResult(
            BuildSelection selection,
            OptimizationSuggestion suggestion
    ) {
    }

    private record BudgetResult(
            BuildSelection selection,
            List<OptimizationSuggestion> suggestions
    ) {
    }
}
