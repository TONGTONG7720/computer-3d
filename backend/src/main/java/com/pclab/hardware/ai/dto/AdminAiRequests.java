package com.pclab.hardware.ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public final class AdminAiRequests {

    private AdminAiRequests() {
    }

    public record CreatePromptVersionRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(max = 12000) String content,
            boolean activate,
            @NotBlank @Size(max = 80) String createdBy
    ) {
    }

    public record UpsertKnowledgeRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank
            @Pattern(regexp = "COMPATIBILITY|POWER|WORKLOAD|PREFERENCE|PERFORMANCE")
            String category,
            @NotBlank @Size(max = 16000) String content,
            @NotNull @Size(max = 20) List<@NotBlank @Size(max = 40) String> tags,
            @NotBlank @Size(max = 160) String sourceLabel,
            @Pattern(regexp = "ACTIVE|DRAFT|ARCHIVED") String status,
            @Min(1) Integer version
    ) {
    }

    public record UpsertRuleRequest(
            @NotBlank @Size(max = 160) String name,
            @Min(0) @Max(10000) int priority,
            @NotNull Map<@Size(max = 80) String, Object> condition,
            @NotNull Map<@Size(max = 80) String, Object> action,
            @NotBlank @Size(max = 1000) String explanation,
            @Pattern(regexp = "ACTIVE|DRAFT|DISABLED") String status,
            @Min(1) Integer version
    ) {
    }
}
