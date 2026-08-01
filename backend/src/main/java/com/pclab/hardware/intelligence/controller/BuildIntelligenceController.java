package com.pclab.hardware.intelligence.controller;

import com.pclab.hardware.intelligence.domain.CompatibilityReport;
import com.pclab.hardware.intelligence.dto.BuildAnalysisRequest;
import com.pclab.hardware.intelligence.dto.BuildOptimizationRequest;
import com.pclab.hardware.intelligence.dto.CompatibilityCheckQuery;
import com.pclab.hardware.intelligence.service.BuildAnalysisService;
import com.pclab.hardware.intelligence.vo.BuildAnalysisView;
import com.pclab.hardware.intelligence.vo.BuildOptimizationView;
import com.pclab.hardware.vo.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class BuildIntelligenceController {

    private final BuildAnalysisService buildAnalysisService;

    public BuildIntelligenceController(BuildAnalysisService buildAnalysisService) {
        this.buildAnalysisService = buildAnalysisService;
    }

    @GetMapping("/compatibility/check")
    ApiResponse<CompatibilityReport> check(
            @Valid @ModelAttribute CompatibilityCheckQuery query
    ) {
        return ApiResponse.success(buildAnalysisService.check(query));
    }

    @PostMapping("/build/analyze")
    ApiResponse<BuildAnalysisView> analyze(
            @Valid @RequestBody BuildAnalysisRequest request
    ) {
        return ApiResponse.success(buildAnalysisService.analyze(request));
    }

    @PostMapping("/build/optimize")
    ApiResponse<BuildOptimizationView> optimize(
            @Valid @RequestBody BuildOptimizationRequest request
    ) {
        return ApiResponse.success(buildAnalysisService.optimize(request));
    }
}
