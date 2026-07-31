package com.pclab.hardware.ai.controller;

import com.pclab.hardware.ai.dto.AdminAiRequests.CreatePromptVersionRequest;
import com.pclab.hardware.ai.dto.AdminAiRequests.UpsertKnowledgeRequest;
import com.pclab.hardware.ai.dto.AdminAiRequests.UpsertRuleRequest;
import com.pclab.hardware.ai.service.AdminAiMutationService;
import com.pclab.hardware.ai.service.AdminAiQueryService;
import com.pclab.hardware.ai.vo.AdminAiViews.AiDashboardView;
import com.pclab.hardware.ai.vo.AdminAiViews.KnowledgeView;
import com.pclab.hardware.ai.vo.AdminAiViews.PromptView;
import com.pclab.hardware.ai.vo.AdminAiViews.RequestLogView;
import com.pclab.hardware.ai.vo.AdminAiViews.RuleView;
import com.pclab.hardware.vo.ApiResponse;
import com.pclab.hardware.vo.PageView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/admin/ai")
public class AdminAiController {

    private final AdminAiQueryService queryService;
    private final AdminAiMutationService mutationService;

    public AdminAiController(
            AdminAiQueryService queryService,
            AdminAiMutationService mutationService
    ) {
        this.queryService = queryService;
        this.mutationService = mutationService;
    }

    @GetMapping("/dashboard")
    ApiResponse<AiDashboardView> dashboard() {
        return ApiResponse.success(queryService.dashboard());
    }

    @GetMapping("/prompts")
    ApiResponse<List<PromptView>> prompts() {
        return ApiResponse.success(queryService.prompts());
    }

    @PostMapping("/prompts/{promptKey}/versions")
    ApiResponse<PromptView> createPromptVersion(
            @PathVariable @Pattern(regexp = "[A-Z0-9_]{3,80}") String promptKey,
            @Valid @RequestBody CreatePromptVersionRequest request
    ) {
        return ApiResponse.success(mutationService.createPromptVersion(promptKey, request));
    }

    @GetMapping("/knowledge")
    ApiResponse<List<KnowledgeView>> knowledge() {
        return ApiResponse.success(queryService.knowledge());
    }

    @PutMapping("/knowledge/{documentKey}")
    ApiResponse<KnowledgeView> upsertKnowledge(
            @PathVariable @Pattern(regexp = "[A-Z0-9_]{3,100}") String documentKey,
            @Valid @RequestBody UpsertKnowledgeRequest request
    ) {
        return ApiResponse.success(mutationService.upsertKnowledge(documentKey, request));
    }

    @PostMapping("/knowledge/{documentKey}/sync")
    ApiResponse<KnowledgeView> syncKnowledge(
            @PathVariable @Pattern(regexp = "[A-Z0-9_]{3,100}") String documentKey
    ) {
        return ApiResponse.success(mutationService.syncKnowledge(documentKey));
    }

    @GetMapping("/rules")
    ApiResponse<List<RuleView>> rules() {
        return ApiResponse.success(queryService.rules());
    }

    @PutMapping("/rules/{ruleKey}")
    ApiResponse<RuleView> upsertRule(
            @PathVariable @Pattern(regexp = "[A-Z0-9_]{3,100}") String ruleKey,
            @Valid @RequestBody UpsertRuleRequest request
    ) {
        return ApiResponse.success(mutationService.upsertRule(ruleKey, request));
    }

    @GetMapping("/logs")
    ApiResponse<PageView<RequestLogView>> logs(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false)
            @Pattern(regexp = "SUCCESS|FALLBACK|REJECTED|FAILED") String outcome,
            @RequestParam(required = false)
            @Pattern(regexp = "RULE|LLM|LLM_FALLBACK") String route
    ) {
        return ApiResponse.success(queryService.logs(page, size, outcome, route));
    }
}
