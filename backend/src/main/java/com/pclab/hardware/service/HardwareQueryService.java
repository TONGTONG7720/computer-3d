package com.pclab.hardware.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.pclab.hardware.dto.HardwareQuery;
import com.pclab.hardware.entity.CaseSpecEntity;
import com.pclab.hardware.entity.CoolingSpecEntity;
import com.pclab.hardware.entity.CpuSpecEntity;
import com.pclab.hardware.entity.GpuSpecEntity;
import com.pclab.hardware.entity.HardwareCategoryEntity;
import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.entity.HardwareModelEntity;
import com.pclab.hardware.entity.MemorySpecEntity;
import com.pclab.hardware.entity.MotherboardSpecEntity;
import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.entity.PsuSpecEntity;
import com.pclab.hardware.entity.StorageSpecEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.CaseSpecMapper;
import com.pclab.hardware.mapper.CoolingSpecMapper;
import com.pclab.hardware.mapper.CpuSpecMapper;
import com.pclab.hardware.mapper.GpuSpecMapper;
import com.pclab.hardware.mapper.HardwareCategoryMapper;
import com.pclab.hardware.mapper.HardwareMapper;
import com.pclab.hardware.mapper.HardwareModelMapper;
import com.pclab.hardware.mapper.MemorySpecMapper;
import com.pclab.hardware.mapper.MotherboardSpecMapper;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.mapper.PsuSpecMapper;
import com.pclab.hardware.mapper.StorageSpecMapper;
import com.pclab.hardware.intelligence.mapper.HardwarePerformanceMapper;
import com.pclab.hardware.vo.CategoryView;
import com.pclab.hardware.vo.HardwareModelView;
import com.pclab.hardware.vo.HardwareView;
import com.pclab.hardware.vo.PageView;
import com.pclab.hardware.vo.PriceView;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class HardwareQueryService {

    private final HardwareMapper hardwareMapper;
    private final HardwareCategoryMapper categoryMapper;
    private final CpuSpecMapper cpuSpecMapper;
    private final GpuSpecMapper gpuSpecMapper;
    private final MotherboardSpecMapper motherboardSpecMapper;
    private final MemorySpecMapper memorySpecMapper;
    private final StorageSpecMapper storageSpecMapper;
    private final CoolingSpecMapper coolingSpecMapper;
    private final PsuSpecMapper psuSpecMapper;
    private final CaseSpecMapper caseSpecMapper;
    private final HardwareModelMapper modelMapper;
    private final ProductPriceMapper priceMapper;
    private final HardwarePerformanceMapper performanceMapper;
    private final HardwareViewAssembler viewAssembler;

    public HardwareQueryService(
            HardwareMapper hardwareMapper,
            HardwareCategoryMapper categoryMapper,
            CpuSpecMapper cpuSpecMapper,
            GpuSpecMapper gpuSpecMapper,
            MotherboardSpecMapper motherboardSpecMapper,
            MemorySpecMapper memorySpecMapper,
            StorageSpecMapper storageSpecMapper,
            CoolingSpecMapper coolingSpecMapper,
            PsuSpecMapper psuSpecMapper,
            CaseSpecMapper caseSpecMapper,
            HardwareModelMapper modelMapper,
            ProductPriceMapper priceMapper,
            HardwarePerformanceMapper performanceMapper,
            HardwareViewAssembler viewAssembler
    ) {
        this.hardwareMapper = hardwareMapper;
        this.categoryMapper = categoryMapper;
        this.cpuSpecMapper = cpuSpecMapper;
        this.gpuSpecMapper = gpuSpecMapper;
        this.motherboardSpecMapper = motherboardSpecMapper;
        this.memorySpecMapper = memorySpecMapper;
        this.storageSpecMapper = storageSpecMapper;
        this.coolingSpecMapper = coolingSpecMapper;
        this.psuSpecMapper = psuSpecMapper;
        this.caseSpecMapper = caseSpecMapper;
        this.modelMapper = modelMapper;
        this.priceMapper = priceMapper;
        this.performanceMapper = performanceMapper;
        this.viewAssembler = viewAssembler;
    }

    @Cacheable(cacheNames = "hardware-list", key = "#query.cacheKey()")
    public PageView<HardwareView> findPage(HardwareQuery query) {
        LambdaQueryWrapper<HardwareEntity> wrapper = buildQuery(query);
        Page<HardwareEntity> result = hardwareMapper.selectPage(
                Page.of(query.getPage(), query.getSize()),
                wrapper
        );
        Map<String, HardwareCategoryEntity> categories = categoryMap();
        List<HardwareView> items = result.getRecords().stream()
                .map(hardware -> toView(hardware, categories))
                .toList();
        return new PageView<>(
                result.getCurrent(),
                result.getSize(),
                result.getTotal(),
                result.getPages(),
                items
        );
    }

    @Cacheable(cacheNames = "hardware-detail", key = "#idOrKey")
    public HardwareView findDetail(String idOrKey) {
        HardwareEntity hardware = requireHardware(idOrKey);
        return toView(hardware, categoryMap());
    }

    @Cacheable(cacheNames = "categories", key = "'all'")
    public List<CategoryView> findCategories() {
        return categoryMapper.selectList(
                        Wrappers.<HardwareCategoryEntity>lambdaQuery()
                                .eq(HardwareCategoryEntity::getEnabled, 1)
                                .orderByAsc(HardwareCategoryEntity::getSortOrder)
                ).stream()
                .map(category -> new CategoryView(
                        category.getCode(),
                        category.getName(),
                        category.getBuilderCategory(),
                        category.getSortOrder()
                ))
                .toList();
    }

    @Cacheable(cacheNames = "hardware-models", key = "#idOrKey")
    public List<HardwareModelView> findModels(String idOrKey) {
        HardwareEntity hardware = requireHardware(idOrKey);
        return modelMapper.selectList(
                        Wrappers.<HardwareModelEntity>lambdaQuery()
                                .eq(HardwareModelEntity::getHardwareId, hardware.getId())
                                .eq(HardwareModelEntity::getStatus, "READY")
                                .orderByAsc(HardwareModelEntity::getLodLevel)
                ).stream()
                .map(this::toModelView)
                .toList();
    }

    @Cacheable(cacheNames = "prices", key = "#idOrKey")
    public List<PriceView> findPrices(String idOrKey) {
        HardwareEntity hardware = requireHardware(idOrKey);
        return priceMapper.selectByHardwareId(hardware.getId()).stream()
                .map(this::toPriceView)
                .toList();
    }

    public HardwareEntity requireHardware(String idOrKey) {
        LambdaQueryWrapper<HardwareEntity> wrapper = Wrappers.lambdaQuery();
        if (idOrKey.chars().allMatch(Character::isDigit)) {
            wrapper.eq(HardwareEntity::getId, Long.parseLong(idOrKey));
        } else {
            wrapper.eq(HardwareEntity::getHardwareKey, idOrKey);
        }
        wrapper.eq(HardwareEntity::getStatus, "ACTIVE");
        HardwareEntity hardware = hardwareMapper.selectOne(wrapper);
        if (hardware == null) {
            throw new DomainException(ErrorCode.HARDWARE_NOT_FOUND);
        }
        return hardware;
    }

    private LambdaQueryWrapper<HardwareEntity> buildQuery(HardwareQuery query) {
        LambdaQueryWrapper<HardwareEntity> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(HardwareEntity::getStatus, "ACTIVE");
        if (!query.normalizedKeyword().isEmpty()) {
            wrapper.like(HardwareEntity::getSearchKey, query.normalizedKeyword());
        }
        if (query.normalizedCategory() != null) {
            wrapper.eq(HardwareEntity::getCategoryCode, query.normalizedCategory());
        }
        if (query.getBrand() != null && !query.getBrand().isEmpty()) {
            wrapper.in(HardwareEntity::getBrand, query.getBrand());
        }
        if (query.getMinPrice() != null) {
            wrapper.ge(HardwareEntity::getBasePrice, query.getMinPrice());
        }
        if (query.getMaxPrice() != null) {
            wrapper.le(HardwareEntity::getBasePrice, query.getMaxPrice());
        }
        if (query.getMinPerformance() != null) {
            wrapper.ge(HardwareEntity::getPerformanceScore, query.getMinPerformance());
        }
        applySort(wrapper, query.getSort());
        return wrapper;
    }

    private static void applySort(
            LambdaQueryWrapper<HardwareEntity> wrapper,
            String sort
    ) {
        switch (sort) {
            case "price_asc" ->
                    wrapper.orderByAsc(HardwareEntity::getBasePrice)
                            .orderByDesc(HardwareEntity::getPerformanceScore);
            case "price_desc" ->
                    wrapper.orderByDesc(HardwareEntity::getBasePrice)
                            .orderByDesc(HardwareEntity::getPerformanceScore);
            case "newest" -> wrapper.orderByDesc(HardwareEntity::getCreatedAt);
            case "performance_desc" ->
                    wrapper.orderByDesc(HardwareEntity::getPerformanceScore)
                            .orderByAsc(HardwareEntity::getBasePrice);
            case "relevance" ->
                    wrapper.orderByAsc(HardwareEntity::getSortOrder)
                            .orderByDesc(HardwareEntity::getPerformanceScore);
            default -> throw new IllegalArgumentException("Unsupported sort: " + sort);
        }
    }

    private Map<String, HardwareCategoryEntity> categoryMap() {
        return categoryMapper.selectList(null).stream()
                .collect(Collectors.toUnmodifiableMap(
                        HardwareCategoryEntity::getCode,
                        Function.identity()
                ));
    }

    private HardwareView toView(
            HardwareEntity hardware,
            Map<String, HardwareCategoryEntity> categories
    ) {
        HardwareCategoryEntity category = categories.get(hardware.getCategoryCode());
        if (category == null) {
            throw new DomainException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        return viewAssembler.toView(
                hardware,
                category,
                findSpecification(hardware),
                performanceMapper.selectById(hardware.getId()),
                findPrimaryModel(hardware.getId())
        );
    }

    private HardwareModelView findPrimaryModel(Long hardwareId) {
        return modelMapper.selectList(
                        Wrappers.<HardwareModelEntity>lambdaQuery()
                                .eq(HardwareModelEntity::getHardwareId, hardwareId)
                                .eq(HardwareModelEntity::getIsPrimary, 1)
                                .eq(HardwareModelEntity::getStatus, "READY")
                                .orderByAsc(HardwareModelEntity::getLodLevel)
                ).stream()
                .findFirst()
                .map(this::toModelView)
                .orElse(null);
    }

    private Object findSpecification(HardwareEntity hardware) {
        return switch (hardware.getCategoryCode()) {
            case "CPU" -> cpuSpecMapper.selectById(hardware.getId());
            case "GPU" -> gpuSpecMapper.selectById(hardware.getId());
            case "MOTHERBOARD" -> motherboardSpecMapper.selectById(hardware.getId());
            case "RAM" -> memorySpecMapper.selectById(hardware.getId());
            case "SSD", "HDD" -> storageSpecMapper.selectById(hardware.getId());
            case "COOLING" -> coolingSpecMapper.selectById(hardware.getId());
            case "PSU" -> psuSpecMapper.selectById(hardware.getId());
            case "CASE" -> caseSpecMapper.selectById(hardware.getId());
            default -> null;
        };
    }

    private HardwareModelView toModelView(HardwareModelEntity model) {
        return new HardwareModelView(
                model.getId(),
                model.getName(),
                model.getGlbUrl(),
                model.getTextureUrl(),
                model.getPreviewUrl(),
                new HardwareModelView.Vector3(model.getScaleX(), model.getScaleY(), model.getScaleZ()),
                new HardwareModelView.Vector3(
                        model.getPositionX(),
                        model.getPositionY(),
                        model.getPositionZ()
                ),
                new HardwareModelView.Vector3(
                        model.getRotationX(),
                        model.getRotationY(),
                        model.getRotationZ()
                ),
                model.getAnimationConfig(),
                model.getLodLevel(),
                model.getFileSizeBytes(),
                model.getChecksumSha256(),
                model.getIsPrimary() == 1,
                model.getStatus()
        );
    }

    private PriceView toPriceView(ProductPriceEntity price) {
        return new PriceView(
                price.getId(),
                price.getPlatform(),
                price.getSeller(),
                price.getFinalPrice(),
                price.getCurrency(),
                "IN_STOCK".equals(price.getStockStatus()),
                price.getProductUrl(),
                price.getCheckedAt()
        );
    }
}
