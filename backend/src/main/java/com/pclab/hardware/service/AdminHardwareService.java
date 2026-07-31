package com.pclab.hardware.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.pclab.hardware.dto.CategoryMutationRequest;
import com.pclab.hardware.dto.HardwareMutationRequest;
import com.pclab.hardware.dto.ModelTransformRequest;
import com.pclab.hardware.dto.ModelUploadRequest;
import com.pclab.hardware.dto.PriceUpdateRequest;
import com.pclab.hardware.entity.HardwareCategoryEntity;
import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.entity.HardwareModelEntity;
import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.HardwareCategoryMapper;
import com.pclab.hardware.mapper.HardwareMapper;
import com.pclab.hardware.mapper.HardwareModelMapper;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.storage.ModelStorageService;
import com.pclab.hardware.storage.ModelStorageService.StoredModel;
import com.pclab.hardware.utils.SearchNormalizer;
import com.pclab.hardware.vo.CategoryView;
import com.pclab.hardware.vo.HardwareAdminView;
import com.pclab.hardware.vo.ModelAdminView;
import com.pclab.hardware.vo.PriceView;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Objects;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminHardwareService {

    private final HardwareMapper hardwareMapper;
    private final HardwareCategoryMapper categoryMapper;
    private final HardwareModelMapper modelMapper;
    private final ProductPriceMapper priceMapper;
    private final HardwareSpecificationService specificationService;
    private final ModelStorageService modelStorageService;

    public AdminHardwareService(
            HardwareMapper hardwareMapper,
            HardwareCategoryMapper categoryMapper,
            HardwareModelMapper modelMapper,
            ProductPriceMapper priceMapper,
            HardwareSpecificationService specificationService,
            ModelStorageService modelStorageService
    ) {
        this.hardwareMapper = hardwareMapper;
        this.categoryMapper = categoryMapper;
        this.modelMapper = modelMapper;
        this.priceMapper = priceMapper;
        this.specificationService = specificationService;
        this.modelStorageService = modelStorageService;
    }

    @Transactional
    @HardwareCacheEviction
    public HardwareAdminView create(HardwareMutationRequest request) {
        requireCategory(request.category());
        Long duplicateCount = hardwareMapper.selectCount(
                Wrappers.<HardwareEntity>lambdaQuery()
                        .eq(HardwareEntity::getHardwareKey, request.hardwareKey())
        );
        if (duplicateCount > 0) {
            throw new DomainException(ErrorCode.CONFLICT, "hardwareKey 已存在");
        }
        HardwareEntity entity = toEntity(request);
        entity.setVersion(1);
        entity.setDeleted(0);
        hardwareMapper.insert(entity);
        specificationService.insert(request.category(), entity.getId(), request.specification());
        upsertInternalPrice(entity, request.price(), true, "PC LAB");
        return toAdminView(entity);
    }

    @Transactional
    @HardwareCacheEviction
    public HardwareAdminView update(Long id, HardwareMutationRequest request) {
        HardwareEntity existing = requireHardware(id);
        if (request.version() == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "更新硬件必须提交 version");
        }
        requireCategory(request.category());
        HardwareEntity updated = toEntity(request);
        updated.setId(existing.getId());
        updated.setVersion(request.version());
        updated.setDeleted(existing.getDeleted());
        if (hardwareMapper.updateById(updated) == 0) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
        specificationService.replace(
                existing.getCategoryCode(),
                request.category(),
                id,
                request.specification()
        );
        upsertInternalPrice(updated, request.price(), true, "PC LAB");
        return toAdminView(updated);
    }

    @Transactional
    @HardwareCacheEviction
    public void delete(Long id) {
        HardwareEntity existing = requireHardware(id);
        if (hardwareMapper.deleteById(existing.getId()) == 0) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
    }

    @Transactional
    @HardwareCacheEviction
    public PriceView updatePrice(Long hardwareId, PriceUpdateRequest request) {
        HardwareEntity hardware = requireHardware(hardwareId);
        hardware.setBasePrice(request.price());
        hardwareMapper.updateById(hardware);
        ProductPriceEntity price = upsertInternalPrice(
                hardware,
                request.price(),
                request.inStock(),
                request.seller()
        );
        return toPriceView(price);
    }

    @Transactional
    @HardwareCacheEviction
    public CategoryView createCategory(CategoryMutationRequest request) {
        Long duplicateCount = categoryMapper.selectCount(
                Wrappers.<HardwareCategoryEntity>lambdaQuery()
                        .eq(HardwareCategoryEntity::getCode, request.code())
        );
        if (duplicateCount > 0) {
            throw new DomainException(ErrorCode.CONFLICT, "分类代码已存在");
        }
        HardwareCategoryEntity category = new HardwareCategoryEntity();
        category.setCode(request.code());
        category.setName(request.name().trim());
        category.setBuilderCategory(request.builderCategory());
        category.setSortOrder(request.sortOrder());
        category.setEnabled(1);
        categoryMapper.insert(category);
        return new CategoryView(
                category.getCode(),
                category.getName(),
                category.getBuilderCategory(),
                category.getSortOrder()
        );
    }

    @Transactional
    @HardwareCacheEviction
    public ModelAdminView uploadModel(Long hardwareId, ModelUploadRequest request) {
        HardwareEntity hardware = requireHardware(hardwareId);
        StoredModel stored = modelStorageService.store(request.getFile());
        HardwareModelEntity model = modelMapper.selectOne(
                Wrappers.<HardwareModelEntity>lambdaQuery()
                        .eq(HardwareModelEntity::getHardwareId, hardwareId)
                        .eq(HardwareModelEntity::getLodLevel, request.getLodLevel())
        );
        if (model == null) {
            model = new HardwareModelEntity();
            model.setHardwareId(hardwareId);
            model.setLodLevel(request.getLodLevel());
        }
        model.setName(request.getName().trim());
        model.setGlbUrl(stored.publicUrl());
        model.setTextureUrl("");
        model.setPreviewUrl("");
        model.setScaleX(request.getScaleX());
        model.setScaleY(request.getScaleY());
        model.setScaleZ(request.getScaleZ());
        model.setPositionX(request.getPositionX());
        model.setPositionY(request.getPositionY());
        model.setPositionZ(request.getPositionZ());
        model.setRotationX(request.getRotationX());
        model.setRotationY(request.getRotationY());
        model.setRotationZ(request.getRotationZ());
        model.setFileSizeBytes(stored.fileSizeBytes());
        model.setChecksumSha256(stored.checksumSha256());
        model.setIsPrimary(Boolean.TRUE.equals(request.getPrimary()) ? 1 : 0);
        model.setStatus("READY");
        if (model.getId() == null) {
            modelMapper.insert(model);
        } else {
            modelMapper.updateById(model);
        }
        if (model.getIsPrimary() == 1) {
            clearOtherPrimaryModels(hardwareId, model.getId());
            hardware.setModelUrl(model.getGlbUrl());
            hardwareMapper.updateById(hardware);
        }
        return toModelView(model);
    }

    @Transactional
    @HardwareCacheEviction
    public ModelAdminView updateModel(Long modelId, ModelTransformRequest request) {
        HardwareModelEntity model = modelMapper.selectById(modelId);
        if (model == null) {
            throw new DomainException(ErrorCode.HARDWARE_NOT_FOUND, "3D 模型不存在");
        }
        model.setName(request.name().trim());
        model.setScaleX(request.scaleX());
        model.setScaleY(request.scaleY());
        model.setScaleZ(request.scaleZ());
        model.setPositionX(request.positionX());
        model.setPositionY(request.positionY());
        model.setPositionZ(request.positionZ());
        model.setRotationX(request.rotationX());
        model.setRotationY(request.rotationY());
        model.setRotationZ(request.rotationZ());
        model.setLodLevel(request.lodLevel());
        model.setIsPrimary(request.primary() ? 1 : 0);
        model.setStatus(request.status());
        modelMapper.updateById(model);
        if (model.getIsPrimary() == 1) {
            clearOtherPrimaryModels(model.getHardwareId(), model.getId());
            HardwareEntity hardware = requireHardware(model.getHardwareId());
            hardware.setModelUrl(model.getGlbUrl());
            hardwareMapper.updateById(hardware);
        }
        return toModelView(model);
    }

    private ProductPriceEntity upsertInternalPrice(
            HardwareEntity hardware,
            java.math.BigDecimal value,
            boolean inStock,
            String seller
    ) {
        ProductPriceEntity price = priceMapper.selectOne(
                Wrappers.<ProductPriceEntity>lambdaQuery()
                        .eq(ProductPriceEntity::getHardwareId, hardware.getId())
                        .eq(ProductPriceEntity::getSource, "INTERNAL")
                        .eq(ProductPriceEntity::getSeller, seller)
        );
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (price == null) {
            price = new ProductPriceEntity();
            price.setHardwareId(hardware.getId());
            price.setSource("INTERNAL");
            price.setSeller(seller);
            price.setCurrency("CNY");
            price.setProductUrl("");
            price.setCreatedAt(now);
        }
        price.setPrice(value);
        price.setInStock(inStock ? 1 : 0);
        price.setCheckedAt(now);
        price.setUpdatedAt(now);
        if (price.getId() == null) {
            priceMapper.insert(price);
        } else {
            priceMapper.updateById(price);
        }
        return price;
    }

    private void clearOtherPrimaryModels(Long hardwareId, Long currentModelId) {
        modelMapper.update(
                Wrappers.<HardwareModelEntity>lambdaUpdate()
                        .set(HardwareModelEntity::getIsPrimary, 0)
                        .eq(HardwareModelEntity::getHardwareId, hardwareId)
                        .ne(HardwareModelEntity::getId, currentModelId)
        );
    }

    private HardwareCategoryEntity requireCategory(String categoryCode) {
        HardwareCategoryEntity category = categoryMapper.selectOne(
                Wrappers.<HardwareCategoryEntity>lambdaQuery()
                        .eq(HardwareCategoryEntity::getCode, categoryCode)
                        .eq(HardwareCategoryEntity::getEnabled, 1)
        );
        if (category == null) {
            throw new DomainException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        return category;
    }

    private HardwareEntity requireHardware(Long id) {
        HardwareEntity hardware = hardwareMapper.selectById(id);
        if (hardware == null) {
            throw new DomainException(ErrorCode.HARDWARE_NOT_FOUND);
        }
        return hardware;
    }

    private static HardwareEntity toEntity(HardwareMutationRequest request) {
        HardwareEntity entity = new HardwareEntity();
        entity.setHardwareKey(request.hardwareKey());
        entity.setName(request.name().trim());
        entity.setBrand(request.brand().trim());
        entity.setCategoryCode(request.category());
        entity.setDescription(Objects.requireNonNullElse(request.description(), "").trim());
        entity.setBasePrice(request.price());
        entity.setPerformanceScore(request.performance());
        entity.setPowerWatt(request.power());
        entity.setModelUrl(Objects.requireNonNullElse(request.modelUrl(), ""));
        entity.setModelVariant(Objects.requireNonNullElse(request.modelVariant(), ""));
        entity.setCoverUrl(Objects.requireNonNullElse(request.coverUrl(), ""));
        entity.setSearchKey(SearchNormalizer.normalize(
                request.hardwareKey() + request.name() + request.brand()
        ));
        entity.setSortOrder(request.sortOrder());
        entity.setStatus(request.status());
        return entity;
    }

    private static HardwareAdminView toAdminView(HardwareEntity entity) {
        return new HardwareAdminView(
                entity.getId(),
                entity.getHardwareKey(),
                entity.getName(),
                entity.getBrand(),
                entity.getCategoryCode(),
                entity.getBasePrice(),
                entity.getPerformanceScore(),
                entity.getPowerWatt(),
                entity.getStatus(),
                entity.getVersion()
        );
    }

    private static ModelAdminView toModelView(HardwareModelEntity model) {
        return new ModelAdminView(
                model.getId(),
                model.getHardwareId(),
                model.getGlbUrl(),
                model.getLodLevel(),
                model.getIsPrimary() == 1,
                model.getStatus(),
                model.getFileSizeBytes(),
                model.getChecksumSha256()
        );
    }

    private static PriceView toPriceView(ProductPriceEntity price) {
        return new PriceView(
                price.getId(),
                price.getSource(),
                price.getSeller(),
                price.getPrice(),
                price.getCurrency(),
                price.getInStock() == 1,
                price.getProductUrl(),
                price.getCheckedAt()
        );
    }

    @Caching(evict = {
        @CacheEvict(cacheNames = "hardware-list", allEntries = true),
        @CacheEvict(cacheNames = "hardware-detail", allEntries = true),
        @CacheEvict(cacheNames = "categories", allEntries = true),
        @CacheEvict(cacheNames = "hardware-models", allEntries = true),
        @CacheEvict(cacheNames = "prices", allEntries = true)
    })
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    private @interface HardwareCacheEviction {
    }
}
