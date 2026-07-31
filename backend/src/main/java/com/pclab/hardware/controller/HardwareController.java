package com.pclab.hardware.controller;

import com.pclab.hardware.dto.HardwareQuery;
import com.pclab.hardware.service.HardwareQueryService;
import com.pclab.hardware.vo.ApiResponse;
import com.pclab.hardware.vo.HardwareView;
import com.pclab.hardware.vo.PageView;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hardware")
public class HardwareController {

    private final HardwareQueryService hardwareQueryService;

    public HardwareController(HardwareQueryService hardwareQueryService) {
        this.hardwareQueryService = hardwareQueryService;
    }

    @GetMapping
    ApiResponse<PageView<HardwareView>> list(@Valid @ModelAttribute HardwareQuery query) {
        return ApiResponse.success(hardwareQueryService.findPage(query));
    }

    @GetMapping("/cpu")
    ApiResponse<PageView<HardwareView>> cpu(@Valid @ModelAttribute HardwareQuery query) {
        query.setCategory("CPU");
        return ApiResponse.success(hardwareQueryService.findPage(query));
    }

    @GetMapping("/gpu")
    ApiResponse<PageView<HardwareView>> gpu(@Valid @ModelAttribute HardwareQuery query) {
        query.setCategory("GPU");
        return ApiResponse.success(hardwareQueryService.findPage(query));
    }

    @GetMapping("/{idOrKey}")
    ApiResponse<HardwareView> detail(@PathVariable String idOrKey) {
        return ApiResponse.success(hardwareQueryService.findDetail(idOrKey));
    }
}
