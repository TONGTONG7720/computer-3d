package com.pclab.hardware.intelligence.service;

import com.pclab.hardware.intelligence.domain.BuildOptimizationPlan;
import com.pclab.hardware.intelligence.domain.BuildSelection;
import com.pclab.hardware.intelligence.domain.CompatibilityReport;
import com.pclab.hardware.intelligence.domain.CompatibilityRuleDefinition;
import com.pclab.hardware.intelligence.domain.HardwareFacts;
import com.pclab.hardware.intelligence.domain.IntelligenceCategory;
import com.pclab.hardware.intelligence.domain.OptimizationSuggestion;
import com.pclab.hardware.intelligence.domain.PerformanceReport;
import com.pclab.hardware.intelligence.dto.BuildAnalysisRequest;
import com.pclab.hardware.intelligence.dto.BuildOptimizationRequest;
import com.pclab.hardware.intelligence.dto.CompatibilityCheckQuery;
import com.pclab.hardware.intelligence.engine.BudgetEngine;
import com.pclab.hardware.intelligence.engine.BuildOptimizer;
import com.pclab.hardware.intelligence.engine.CompatibilityEngine;
import com.pclab.hardware.intelligence.engine.PerformanceEngine;
import com.pclab.hardware.intelligence.vo.BuildAnalysisView;
import com.pclab.hardware.intelligence.vo.BuildOptimizationView;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class BuildAnalysisService {

    public static final String PRICE_SOURCE = "PC_LAB_INTERNAL_REFERENCE";

    private final HardwareIntelligenceCatalogue catalogue;
    private final CompatibilityRuleProvider ruleProvider;
    private final CompatibilityEngine compatibilityEngine;
    private final PerformanceEngine performanceEngine;
    private final BudgetEngine budgetEngine;
    private final BuildOptimizer buildOptimizer;

    public BuildAnalysisService(
            HardwareIntelligenceCatalogue catalogue,
            CompatibilityRuleProvider ruleProvider,
            CompatibilityEngine compatibilityEngine,
            PerformanceEngine performanceEngine,
            BudgetEngine budgetEngine,
            BuildOptimizer buildOptimizer
    ) {
        this.catalogue = catalogue;
        this.ruleProvider = ruleProvider;
        this.compatibilityEngine = compatibilityEngine;
        this.performanceEngine = performanceEngine;
        this.budgetEngine = budgetEngine;
        this.buildOptimizer = buildOptimizer;
    }

    public CompatibilityReport check(CompatibilityCheckQuery query) {
        return compatibilityEngine.evaluate(
                catalogue.resolve(query.asIntelligenceMap()),
                ruleProvider.activeRules()
        );
    }

    public BuildAnalysisView analyze(BuildAnalysisRequest request) {
        return analyzeSelection(
                request.revision(),
                request.budget(),
                catalogue.resolve(request.components()),
                ruleProvider.activeRules()
        );
    }

    public BuildOptimizationView optimize(BuildOptimizationRequest request) {
        BuildSelection input = catalogue.resolve(request.components());
        List<CompatibilityRuleDefinition> rules = ruleProvider.activeRules();
        PerformanceReport inputPerformance = performanceEngine.calculate(input);
        BuildOptimizationPlan plan = buildOptimizer.optimize(
                input,
                catalogue.all(),
                request.budget(),
                request.goal(),
                rules
        );
        BuildAnalysisView projected = analyzeSelection(
                request.revision(),
                request.budget(),
                plan.selection(),
                rules
        );
        int profileDelta = request.goal().score(projected.performance())
                - request.goal().score(inputPerformance);
        List<BuildOptimizationView.SuggestionView> suggestions = plan.suggestions().stream()
                .map(this::toSuggestionView)
                .toList();
        String reason = plan.changed()
                ? "已生成 " + suggestions.size() + " 项可应用优化"
                : plan.unresolvedBudget().signum() > 0
                        ? "当前硬件目录无法在预算内生成等价方案"
                        : "当前配置已经满足兼容、性能与预算目标";
        return new BuildOptimizationView(
                request.revision(),
                request.goal(),
                projected.components(),
                projected,
                suggestions,
                projected.totalPrice().subtract(input.totalPrice())
                        .setScale(2, RoundingMode.HALF_UP),
                profileDelta,
                plan.unresolvedBudget(),
                plan.changed(),
                reason
        );
    }

    private BuildAnalysisView analyzeSelection(
            long revision,
            BigDecimal budget,
            BuildSelection selection,
            List<CompatibilityRuleDefinition> rules
    ) {
        BigDecimal totalPrice = selection.totalPrice().setScale(2, RoundingMode.HALF_UP);
        CompatibilityReport compatibility = compatibilityEngine.evaluate(selection, rules);
        return new BuildAnalysisView(
                revision,
                componentIds(selection),
                totalPrice,
                selection.systemPowerWatt(),
                PRICE_SOURCE,
                compatibility,
                performanceEngine.calculate(selection),
                budgetEngine.calculate(budget, totalPrice)
        );
    }

    private BuildOptimizationView.SuggestionView toSuggestionView(
            OptimizationSuggestion suggestion
    ) {
        LinkedHashMap<String, String> changes = new LinkedHashMap<>();
        suggestion.changes().forEach((category, id) ->
                changes.put(category.builderCategory(), id));
        return new BuildOptimizationView.SuggestionView(
                suggestion.code(),
                suggestion.title(),
                suggestion.reason(),
                changes,
                suggestion.priceDelta(),
                suggestion.profileDelta(),
                suggestion.applicable()
        );
    }

    private Map<String, String> componentIds(BuildSelection selection) {
        LinkedHashMap<String, String> ids = new LinkedHashMap<>();
        for (IntelligenceCategory category : IntelligenceCategory.values()) {
            selection.get(category).map(HardwareFacts::id)
                    .ifPresent(id -> ids.put(category.builderCategory(), id));
        }
        return ids;
    }
}
