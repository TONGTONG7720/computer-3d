package com.pclab.hardware.intelligence.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.intelligence.domain.BudgetReport;
import com.pclab.hardware.intelligence.domain.CompatibilityReport;
import com.pclab.hardware.intelligence.domain.OptimizationGoal;
import com.pclab.hardware.intelligence.domain.PerformanceReport;
import com.pclab.hardware.intelligence.service.BuildAnalysisService;
import com.pclab.hardware.intelligence.vo.BuildAnalysisView;
import com.pclab.hardware.intelligence.vo.BuildOptimizationView;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(BuildIntelligenceController.class)
class BuildIntelligenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BuildAnalysisService service;

    @Test
    void rejectsNegativeBuildBudget() throws Exception {
        mockMvc.perform(post("/api/build/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson("-1", false)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void mapsUnknownCompatibilityHardwareToStableError() throws Exception {
        when(service.check(any())).thenThrow(new DomainException(ErrorCode.HARDWARE_NOT_FOUND));

        mockMvc.perform(get("/api/compatibility/check").param("cpu", "missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("HARDWARE_NOT_FOUND"));
    }

    @Test
    void returnsRevisionAndStructuredAnalysis() throws Exception {
        when(service.analyze(any())).thenReturn(analysis());

        mockMvc.perform(post("/api/build/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson("10000", false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.revision").value(12))
                .andExpect(jsonPath("$.data.compatibility.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.performance.gaming.score").value(92))
                .andExpect(jsonPath("$.data.budget.status").value("WITHIN"));
    }

    @Test
    void returnsExplicitOptimizationProposalWithoutApplyingIt() throws Exception {
        BuildOptimizationView view = new BuildOptimizationView(
                12,
                OptimizationGoal.GAMING,
                components(),
                analysis(),
                List.of(new BuildOptimizationView.SuggestionView(
                        "BUDGET_REBALANCE",
                        "降低 storage 成本",
                        "释放预算",
                        Map.of("storage", "storage-value"),
                        new BigDecimal("-600.00"),
                        -1,
                        true
                )),
                new BigDecimal("-600.00"),
                -1,
                BigDecimal.ZERO.setScale(2),
                true,
                "已生成 1 项可应用优化"
        );
        when(service.optimize(any())).thenReturn(view);

        mockMvc.perform(post("/api/build/optimize")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson("10000", true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.goal").value("gaming"))
                .andExpect(jsonPath("$.data.recommendedComponents.gpu").value("gpu-test"))
                .andExpect(jsonPath("$.data.suggestions[0].applicable").value(true))
                .andExpect(jsonPath("$.data.changed").value(true));
    }

    private static BuildAnalysisView analysis() {
        List<PerformanceReport.Contribution> contributions = List.of();
        return new BuildAnalysisView(
                12,
                components(),
                new BigDecimal("8000.00"),
                564,
                "PC_LAB_INTERNAL_REFERENCE",
                new CompatibilityReport(
                        CompatibilityReport.Status.SUCCESS,
                        List.of(),
                        8,
                        564,
                        800,
                        List.of()
                ),
                new PerformanceReport(
                        new PerformanceReport.Profile(92, contributions),
                        new PerformanceReport.Profile(88, contributions),
                        new PerformanceReport.Profile(92, contributions),
                        91,
                        true
                ),
                new BudgetReport(
                        BudgetReport.Status.WITHIN,
                        new BigDecimal("10000.00"),
                        new BigDecimal("8000.00"),
                        new BigDecimal("2000.00"),
                        new BigDecimal("0.00"),
                        new BigDecimal("80.00")
                )
        );
    }

    private static Map<String, String> components() {
        return Map.of(
                "cpu", "cpu-test",
                "gpu", "gpu-test",
                "motherboard", "motherboard-test",
                "ram", "ram-test",
                "storage", "storage-test",
                "cooling", "cooling-test",
                "power_supply", "psu-test-850",
                "case", "case-test"
        );
    }

    private static String requestJson(String budget, boolean optimize) {
        return """
                {
                  "revision": 12,
                  "budget": %s,
                  "components": {
                    "cpu": "cpu-test",
                    "gpu": "gpu-test",
                    "motherboard": "motherboard-test",
                    "ram": "ram-test",
                    "storage": "storage-test",
                    "cooling": "cooling-test",
                    "power_supply": "psu-test-850",
                    "case": "case-test"
                  }%s
                }
                """.formatted(budget, optimize ? ",\n  \"goal\": \"gaming\"" : "");
    }
}
