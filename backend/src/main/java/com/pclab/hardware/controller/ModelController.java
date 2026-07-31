package com.pclab.hardware.controller;

import com.pclab.hardware.service.HardwareQueryService;
import com.pclab.hardware.vo.ApiResponse;
import com.pclab.hardware.vo.HardwareModelView;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/model")
public class ModelController {

    private final HardwareQueryService hardwareQueryService;

    public ModelController(HardwareQueryService hardwareQueryService) {
        this.hardwareQueryService = hardwareQueryService;
    }

    @GetMapping("/{idOrKey}")
    ApiResponse<List<HardwareModelView>> find(@PathVariable String idOrKey) {
        return ApiResponse.success(hardwareQueryService.findModels(idOrKey));
    }
}
