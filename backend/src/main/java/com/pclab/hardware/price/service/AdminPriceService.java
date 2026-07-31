package com.pclab.hardware.price.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.HardwareMapper;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.algorithm.ProductMatchingEngine;
import com.pclab.hardware.price.domain.ProductMatch;
import com.pclab.hardware.price.dto.AdminPriceRequests.ConfirmMatchRequest;
import com.pclab.hardware.price.dto.AdminPriceRequests.MatchPreviewRequest;
import com.pclab.hardware.price.dto.AdminPriceRequests.ProductListQuery;
import com.pclab.hardware.price.dto.AdminPriceRequests.UpsertProductRequest;
import com.pclab.hardware.price.entity.PriceClickEventEntity;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.entity.ProductMatchAuditEntity;
import com.pclab.hardware.price.mapper.PriceClickEventMapper;
import com.pclab.hardware.price.mapper.ProductMapper;
import com.pclab.hardware.price.mapper.ProductMatchAuditMapper;
import com.pclab.hardware.price.mapper.TopHardwareClickRow;
import com.pclab.hardware.price.vo.AdminPriceViews.AdminDashboardView;
import com.pclab.hardware.price.vo.AdminPriceViews.MatchPreviewView;
import com.pclab.hardware.price.vo.AdminPriceViews.ProductAdminView;
import com.pclab.hardware.price.vo.AdminPriceViews.TopHardwareClickView;
import com.pclab.hardware.service.HardwareQueryService;
import com.pclab.hardware.utils.SearchNormalizer;
import com.pclab.hardware.vo.HardwareView;
import com.pclab.hardware.vo.PageView;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminPriceService {

    private final ProductMapper productMapper;
    private final ProductPriceMapper priceMapper;
    private final ProductMatchAuditMapper auditMapper;
    private final PriceClickEventMapper clickMapper;
    private final HardwareMapper hardwareMapper;
    private final HardwareQueryService hardwareService;
    private final ProductMatchingEngine matchingEngine;
    private final AdminOfferService offerService;
    private final ObjectMapper objectMapper;

    public AdminPriceService(
            ProductMapper productMapper,
            ProductPriceMapper priceMapper,
            ProductMatchAuditMapper auditMapper,
            PriceClickEventMapper clickMapper,
            HardwareMapper hardwareMapper,
            HardwareQueryService hardwareService,
            ProductMatchingEngine matchingEngine,
            AdminOfferService offerService,
            ObjectMapper objectMapper
    ) {
        this.productMapper = productMapper;
        this.priceMapper = priceMapper;
        this.auditMapper = auditMapper;
        this.clickMapper = clickMapper;
        this.hardwareMapper = hardwareMapper;
        this.hardwareService = hardwareService;
        this.matchingEngine = matchingEngine;
        this.offerService = offerService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public PageView<ProductAdminView> list(ProductListQuery query) {
        var wrapper = Wrappers.<ProductEntity>lambdaQuery()
                .like(query.keyword() != null && !query.keyword().isBlank(),
                        ProductEntity::getNormalizedTitle,
                        SearchNormalizer.normalize(query.keyword()))
                .eq(query.status() != null && !query.status().isBlank(),
                        ProductEntity::getStatus, query.status())
                .apply(query.platform() != null && !query.platform().isBlank(),
                        "EXISTS (SELECT 1 FROM product_price pp "
                                + "WHERE pp.product_id = product.id AND pp.platform = {0})",
                        query.platform())
                .orderByDesc(ProductEntity::getUpdatedAt);
        Page<ProductEntity> page = productMapper.selectPage(
                Page.of(query.page(), query.size()),
                wrapper
        );
        List<ProductAdminView> items = page.getRecords().stream().map(this::toView).toList();
        return new PageView<>(
                page.getCurrent(),
                page.getSize(),
                page.getTotal(),
                page.getPages(),
                items
        );
    }

    @Transactional
    @ProductCacheEviction
    public ProductAdminView createProduct(UpsertProductRequest request) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        ProductEntity product = new ProductEntity();
        product.setProductKey("manual-" + UUID.randomUUID());
        product.setVersion(1);
        product.setRecordSource("MANUAL");
        product.setCreatedAt(now);
        product.setDeleted(0);
        applyProductRequest(product, request, now);
        ProductMatch match = matchIfRequested(product, request.hardwareId());
        applyMatch(product, match, request.hardwareId());
        productMapper.insert(product);
        if (match != null) {
            insertAudit(product, match, "SYSTEM_PREVIEW", null);
        }
        return toView(product);
    }

    @Transactional
    @ProductCacheEviction
    public ProductAdminView updateProduct(Long productId, UpsertProductRequest request) {
        ProductEntity product = requireProduct(productId);
        if (request.version() == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "更新商品必须提交 version");
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        product.setVersion(request.version());
        applyProductRequest(product, request, now);
        ProductMatch match = matchIfRequested(product, request.hardwareId());
        applyMatch(product, match, request.hardwareId());
        if (productMapper.updateById(product) == 0) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
        if (match != null) {
            insertAudit(product, match, "SYSTEM_PREVIEW", null);
        }
        return toView(product);
    }

    @Transactional
    @ProductCacheEviction
    public void deleteProduct(Long productId) {
        ProductEntity product = requireProduct(productId);
        productMapper.deleteById(product);
        priceMapper.update(
                Wrappers.<ProductPriceEntity>lambdaUpdate()
                        .set(ProductPriceEntity::getIsEnabled, 0)
                        .eq(ProductPriceEntity::getProductId, productId)
        );
    }

    @Transactional(readOnly = true)
    public MatchPreviewView previewMatch(MatchPreviewRequest request) {
        HardwareView hardware = hardwareService.findDetail(request.hardwareId().toString());
        ProductMatch match = matchingEngine.match(
                request.title() + " " + request.brand() + " " + request.model(),
                hardware
        );
        return toPreview(hardware, match);
    }

    @Transactional
    @ProductCacheEviction
    public ProductAdminView confirmMatch(Long productId, ConfirmMatchRequest request) {
        ProductEntity product = requireProduct(productId);
        if (request.version() == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "确认匹配必须提交 version");
        }
        HardwareView hardware = hardwareService.findDetail(request.hardwareId().toString());
        ProductMatch match = matchingEngine.match(product.getTitle(), hardware);
        product.setHardwareId(request.hardwareId());
        product.setMatchConfidence(match.confidence());
        product.setMatchStatus("CONFIRMED");
        product.setVersion(request.version());
        product.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        if (productMapper.updateById(product) == 0) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
        insertAudit(product, match, "ADMIN_CONFIRMED", request.reviewedBy());
        return toView(product);
    }

    @Cacheable(cacheNames = "price-admin", key = "'dashboard'")
    @Transactional(readOnly = true)
    public AdminDashboardView dashboard() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        long activeProducts = productMapper.selectCount(
                Wrappers.<ProductEntity>lambdaQuery().eq(ProductEntity::getStatus, "ACTIVE")
        );
        long validOffers = priceMapper.selectCount(
                Wrappers.<ProductPriceEntity>lambdaQuery()
                        .eq(ProductPriceEntity::getIsEnabled, 1)
                        .eq(ProductPriceEntity::getIsReviewed, 1)
                        .eq(ProductPriceEntity::getStockStatus, "IN_STOCK")
        );
        long staleOffers = priceMapper.selectCount(
                Wrappers.<ProductPriceEntity>lambdaQuery()
                        .eq(ProductPriceEntity::getIsEnabled, 1)
                        .lt(ProductPriceEntity::getCheckedAt, now.minusHours(24))
        );
        long activeHardware = hardwareMapper.selectCount(
                Wrappers.<HardwareEntity>lambdaQuery().eq(HardwareEntity::getStatus, "ACTIVE")
        );
        long clicks = clickMapper.selectCount(
                Wrappers.<PriceClickEventEntity>lambdaQuery()
                        .ge(PriceClickEventEntity::getClickedAt, now.minusHours(24))
        );
        List<TopHardwareClickView> top = clickMapper.selectTopHardware(now.minusDays(30), 5)
                .stream()
                .map(this::toTopClick)
                .toList();
        return new AdminDashboardView(
                activeProducts,
                validOffers,
                staleOffers,
                Math.max(0, activeHardware - productMapper.countCoveredHardware()),
                clicks,
                top,
                "MANUAL",
                now
        );
    }

    private void applyProductRequest(
            ProductEntity product,
            UpsertProductRequest request,
            LocalDateTime now
    ) {
        product.setTitle(request.title().trim());
        product.setBrand(request.brand().trim());
        product.setModel(request.model().trim());
        product.setCategory(request.category().trim());
        product.setImageUrl(emptyIfNull(request.imageUrl()));
        product.setDescription(emptyIfNull(request.description()));
        product.setNormalizedTitle(SearchNormalizer.normalize(request.title()));
        product.setSpecJson("{}");
        product.setStatus(request.status() == null ? "ACTIVE" : request.status());
        product.setUpdatedAt(now);
    }

    private ProductMatch matchIfRequested(ProductEntity product, Long hardwareId) {
        if (hardwareId == null) {
            return null;
        }
        HardwareView hardware = hardwareService.findDetail(hardwareId.toString());
        return matchingEngine.match(product.getTitle(), hardware);
    }

    private static void applyMatch(
            ProductEntity product,
            ProductMatch match,
            Long hardwareId
    ) {
        if (match == null) {
            product.setHardwareId(null);
            product.setMatchConfidence(BigDecimal.ZERO);
            product.setMatchStatus("UNMATCHED");
            return;
        }
        product.setHardwareId(hardwareId);
        product.setMatchConfidence(match.confidence());
        product.setMatchStatus(match.decision().name());
        if (match.confidence().compareTo(new BigDecimal("0.65")) < 0) {
            product.setStatus("DRAFT");
        }
    }

    private void insertAudit(
            ProductEntity product,
            ProductMatch match,
            String decision,
            String reviewedBy
    ) {
        ProductMatchAuditEntity audit = new ProductMatchAuditEntity();
        audit.setProductId(product.getId());
        audit.setHardwareId(product.getHardwareId());
        audit.setConfidence(match.confidence());
        audit.setDecision(decision);
        try {
            audit.setDimensionScoresJson(objectMapper.writeValueAsString(match.dimensionScores()));
        } catch (JsonProcessingException exception) {
            throw new DomainException(ErrorCode.INTERNAL_ERROR);
        }
        audit.setExplanation(String.join("；", match.explanations()));
        audit.setReviewedBy(reviewedBy == null ? "" : reviewedBy);
        audit.setReviewedAt(reviewedBy == null ? null : LocalDateTime.now(ZoneOffset.UTC));
        audit.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        auditMapper.insert(audit);
    }

    private ProductEntity requireProduct(Long productId) {
        ProductEntity product = productMapper.selectById(productId);
        if (product == null) {
            throw new DomainException(ErrorCode.PRICE_PRODUCT_NOT_FOUND);
        }
        return product;
    }

    private ProductAdminView toView(ProductEntity product) {
        return new ProductAdminView(
                product.getId(),
                product.getProductKey(),
                product.getHardwareId(),
                product.getTitle(),
                product.getBrand(),
                product.getModel(),
                product.getCategory(),
                product.getImageUrl(),
                product.getDescription(),
                product.getMatchConfidence(),
                product.getMatchStatus(),
                product.getStatus(),
                product.getRecordSource(),
                product.getVersion(),
                offerService.offersForProduct(product.getId()),
                product.getUpdatedAt()
        );
    }

    private static MatchPreviewView toPreview(HardwareView hardware, ProductMatch match) {
        return new MatchPreviewView(
                hardware.databaseId(),
                hardware.id(),
                hardware.name(),
                match.confidence(),
                match.decision(),
                match.dimensionScores(),
                match.explanations()
        );
    }

    private TopHardwareClickView toTopClick(TopHardwareClickRow row) {
        return new TopHardwareClickView(
                row.getHardwareKey(),
                row.getHardwareName(),
                row.getClickCount()
        );
    }

    private static String emptyIfNull(String value) {
        return value == null ? "" : value.trim();
    }

    @CacheEvict(
            cacheNames = {
                    "prices",
                    "price-comparison",
                    "price-history",
                    "price-build",
                    "price-admin"
            },
            allEntries = true
    )
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    private @interface ProductCacheEviction {
    }
}
