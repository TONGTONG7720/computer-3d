package com.pclab.hardware.intelligence.controller;

import com.pclab.hardware.intelligence.dto.CompatibilityRuleMutationRequest;
import com.pclab.hardware.intelligence.dto.HardwarePerformanceUpdateRequest;
import com.pclab.hardware.intelligence.service.AdminIntelligenceService;
import com.pclab.hardware.intelligence.vo.CompatibilityRuleView;
import com.pclab.hardware.intelligence.vo.HardwarePerformanceView;
import com.pclab.hardware.vo.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminIntelligenceController {

    private final AdminIntelligenceService service;

    public AdminIntelligenceController(AdminIntelligenceService service) {
        this.service = service;
    }

    @GetMapping("/compatibility-rules")
    ApiResponse<List<CompatibilityRuleView>> listRules() {
        return ApiResponse.success(service.listRules());
    }

    @PostMapping("/compatibility-rules")
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<CompatibilityRuleView> createRule(
            @Valid @RequestBody CompatibilityRuleMutationRequest request
    ) {
        return ApiResponse.success(service.createRule(request));
    }

    @PutMapping("/compatibility-rules/{id}")
    ApiResponse<CompatibilityRuleView> updateRule(
            @PathVariable Long id,
            @Valid @RequestBody CompatibilityRuleMutationRequest request
    ) {
        return ApiResponse.success(service.updateRule(id, request));
    }

    @PutMapping("/hardware/{id}/performance")
    ApiResponse<HardwarePerformanceView> updatePerformance(
            @PathVariable Long id,
            @Valid @RequestBody HardwarePerformanceUpdateRequest request
    ) {
        return ApiResponse.success(service.updatePerformance(id, request));
    }
}
