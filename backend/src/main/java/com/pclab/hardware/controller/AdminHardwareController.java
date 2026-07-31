package com.pclab.hardware.controller;

import com.pclab.hardware.dto.CategoryMutationRequest;
import com.pclab.hardware.dto.HardwareMutationRequest;
import com.pclab.hardware.dto.ModelTransformRequest;
import com.pclab.hardware.dto.ModelUploadRequest;
import com.pclab.hardware.dto.PriceUpdateRequest;
import com.pclab.hardware.service.AdminHardwareService;
import com.pclab.hardware.vo.ApiResponse;
import com.pclab.hardware.vo.CategoryView;
import com.pclab.hardware.vo.HardwareAdminView;
import com.pclab.hardware.vo.ModelAdminView;
import com.pclab.hardware.vo.PriceView;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminHardwareController {

    private final AdminHardwareService adminHardwareService;

    public AdminHardwareController(AdminHardwareService adminHardwareService) {
        this.adminHardwareService = adminHardwareService;
    }

    @PostMapping("/hardware")
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<HardwareAdminView> create(@Valid @RequestBody HardwareMutationRequest request) {
        return ApiResponse.success(adminHardwareService.create(request));
    }

    @PutMapping("/hardware/{id}")
    ApiResponse<HardwareAdminView> update(
            @PathVariable Long id,
            @Valid @RequestBody HardwareMutationRequest request
    ) {
        return ApiResponse.success(adminHardwareService.update(id, request));
    }

    @DeleteMapping("/hardware/{id}")
    ApiResponse<Void> delete(@PathVariable Long id) {
        adminHardwareService.delete(id);
        return ApiResponse.success(null);
    }

    @PutMapping("/hardware/{id}/price")
    ApiResponse<PriceView> updatePrice(
            @PathVariable Long id,
            @Valid @RequestBody PriceUpdateRequest request
    ) {
        return ApiResponse.success(adminHardwareService.updatePrice(id, request));
    }

    @PostMapping(
            value = "/hardware/{id}/models",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<ModelAdminView> uploadModel(
            @PathVariable Long id,
            @Valid @ModelAttribute ModelUploadRequest request
    ) {
        return ApiResponse.success(adminHardwareService.uploadModel(id, request));
    }

    @PutMapping("/models/{id}")
    ApiResponse<ModelAdminView> updateModel(
            @PathVariable Long id,
            @Valid @RequestBody ModelTransformRequest request
    ) {
        return ApiResponse.success(adminHardwareService.updateModel(id, request));
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<CategoryView> createCategory(
            @Valid @RequestBody CategoryMutationRequest request
    ) {
        return ApiResponse.success(adminHardwareService.createCategory(request));
    }
}
