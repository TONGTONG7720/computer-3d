package com.pclab.hardware.controller;

import com.pclab.hardware.dto.SaveBuildRequest;
import com.pclab.hardware.service.BuildConfigService;
import com.pclab.hardware.vo.ApiResponse;
import com.pclab.hardware.vo.BuildConfigView;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/build")
public class BuildController {

    private final BuildConfigService buildConfigService;

    public BuildController(BuildConfigService buildConfigService) {
        this.buildConfigService = buildConfigService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<BuildConfigView> save(@Valid @RequestBody SaveBuildRequest request) {
        return ApiResponse.success(buildConfigService.save(request));
    }

    @GetMapping("/{publicId}")
    ApiResponse<BuildConfigView> find(@PathVariable String publicId) {
        return ApiResponse.success(buildConfigService.find(publicId));
    }
}
