package com.pclab.hardware.vo;

import com.fasterxml.jackson.databind.JsonNode;
import com.pclab.hardware.intelligence.vo.HardwarePerformanceView;
import java.math.BigDecimal;
import java.util.List;

public record HardwareAdminDetailView(
        Long id,
        String hardwareKey,
        String name,
        String brand,
        String category,
        String description,
        BigDecimal price,
        int performance,
        int power,
        String modelUrl,
        String modelVariant,
        String coverUrl,
        int sortOrder,
        String status,
        int version,
        JsonNode specification,
        HardwarePerformanceView performanceProfile,
        List<ModelAdminView> models
) {
}
