package com.pclab.hardware.controller;

import com.pclab.hardware.service.HardwareQueryService;
import com.pclab.hardware.vo.ApiResponse;
import com.pclab.hardware.vo.CategoryView;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final HardwareQueryService hardwareQueryService;

    public CategoryController(HardwareQueryService hardwareQueryService) {
        this.hardwareQueryService = hardwareQueryService;
    }

    @GetMapping
    ApiResponse<List<CategoryView>> list() {
        return ApiResponse.success(hardwareQueryService.findCategories());
    }
}
