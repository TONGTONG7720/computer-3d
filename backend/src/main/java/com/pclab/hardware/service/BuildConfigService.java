package com.pclab.hardware.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.dto.SaveBuildRequest;
import com.pclab.hardware.entity.BuildConfigEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.BuildConfigMapper;
import com.pclab.hardware.service.BuildMetricsCalculator.BuildMetrics;
import com.pclab.hardware.vo.BuildConfigView;
import com.pclab.hardware.vo.HardwareView;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BuildConfigService {

    private static final List<String> CATEGORY_ORDER = List.of(
            "cpu",
            "gpu",
            "motherboard",
            "ram",
            "storage",
            "cooling",
            "power_supply",
            "case"
    );
    private static final Set<String> REQUIRED_CATEGORIES = Set.copyOf(CATEGORY_ORDER);
    private static final TypeReference<Map<String, String>> COMPONENT_MAP = new TypeReference<>() {
    };

    private final BuildConfigMapper buildConfigMapper;
    private final HardwareQueryService hardwareQueryService;
    private final ObjectMapper objectMapper;

    public BuildConfigService(
            BuildConfigMapper buildConfigMapper,
            HardwareQueryService hardwareQueryService,
            ObjectMapper objectMapper
    ) {
        this.buildConfigMapper = buildConfigMapper;
        this.hardwareQueryService = hardwareQueryService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    @CachePut(cacheNames = "builds", key = "#result.publicId()")
    public BuildConfigView save(SaveBuildRequest request) {
        Map<String, String> components = orderedComponents(request.components());
        Map<String, HardwareView> hardware = loadHardware(components);
        BuildMetrics metrics = BuildMetricsCalculator.calculate(hardware);
        LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);

        BuildConfigEntity entity = new BuildConfigEntity();
        entity.setPublicId(UUID.randomUUID().toString());
        entity.setName(request.name().trim());
        entity.setComponentsJson(writeComponents(components));
        entity.setTotalPrice(metrics.totalPrice());
        entity.setPerformanceScore(metrics.performanceScore());
        entity.setPowerUsageWatt(metrics.powerUsageWatt());
        entity.setCompatibilityStatus(metrics.compatibilityStatus());
        entity.setCreatedAt(createdAt);
        entity.setUpdatedAt(createdAt);
        buildConfigMapper.insert(entity);

        return toView(entity, components, hardware);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "builds", key = "#publicId")
    public BuildConfigView find(String publicId) {
        BuildConfigEntity entity = buildConfigMapper.selectOne(
                Wrappers.<BuildConfigEntity>lambdaQuery()
                        .eq(BuildConfigEntity::getPublicId, publicId)
        );
        if (entity == null) {
            throw new DomainException(ErrorCode.BUILD_NOT_FOUND);
        }
        Map<String, String> components = readComponents(entity.getComponentsJson());
        return toView(entity, components, loadHardware(components));
    }

    private Map<String, HardwareView> loadHardware(Map<String, String> components) {
        LinkedHashMap<String, HardwareView> hardware = new LinkedHashMap<>();
        for (String category : CATEGORY_ORDER) {
            HardwareView view = hardwareQueryService.findDetail(components.get(category));
            if (!category.equals(view.builderCategory())) {
                throw new DomainException(
                        ErrorCode.VALIDATION_FAILED,
                        view.id() + " 不属于 " + category + " 分类"
                );
            }
            hardware.put(category, view);
        }
        return Map.copyOf(hardware);
    }

    private static Map<String, String> orderedComponents(Map<String, String> components) {
        if (!components.keySet().equals(REQUIRED_CATEGORIES)) {
            throw new DomainException(
                    ErrorCode.VALIDATION_FAILED,
                    "配置必须包含 CPU、GPU、主板、内存、硬盘、散热、电源和机箱"
            );
        }
        LinkedHashMap<String, String> ordered = new LinkedHashMap<>();
        CATEGORY_ORDER.forEach(category -> ordered.put(category, components.get(category)));
        return Map.copyOf(ordered);
    }

    private BuildConfigView toView(
            BuildConfigEntity entity,
            Map<String, String> components,
            Map<String, HardwareView> hardware
    ) {
        List<HardwareView> orderedHardware = CATEGORY_ORDER.stream()
                .map(hardware::get)
                .toList();
        return new BuildConfigView(
                entity.getPublicId(),
                entity.getName(),
                components,
                orderedHardware,
                entity.getTotalPrice(),
                entity.getPerformanceScore(),
                entity.getPowerUsageWatt(),
                entity.getCompatibilityStatus(),
                entity.getCreatedAt()
        );
    }

    private String writeComponents(Map<String, String> components) {
        try {
            return objectMapper.writeValueAsString(components);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Build components could not be serialized", exception);
        }
    }

    private Map<String, String> readComponents(String json) {
        try {
            return Map.copyOf(objectMapper.readValue(json, COMPONENT_MAP));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored build components are invalid", exception);
        }
    }
}
