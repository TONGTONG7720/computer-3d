package com.pclab.hardware.ai.controller;

import com.pclab.hardware.ai.dto.AiBuildRequest;
import com.pclab.hardware.ai.service.AiBuilderService;
import com.pclab.hardware.ai.vo.AiBuildView;
import com.pclab.hardware.vo.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiBuilderController {

    private final AiBuilderService aiBuilderService;

    public AiBuilderController(AiBuilderService aiBuilderService) {
        this.aiBuilderService = aiBuilderService;
    }

    @PostMapping("/build")
    ApiResponse<AiBuildView> build(@Valid @RequestBody AiBuildRequest request) {
        return ApiResponse.success(aiBuilderService.build(request));
    }
}
