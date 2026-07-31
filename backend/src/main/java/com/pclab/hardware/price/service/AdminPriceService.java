package com.pclab.hardware.price.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.domain.PriceRecordPolicy;
import com.pclab.hardware.price.domain.ProductMatch;
import com.pclab.hardware.price.dto.AdminPriceRequests.ProductListQuery;
import com.pclab.hardware.price.dto.AdminPriceRequests.UpsertProductRequest;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.ProductMapper;
import com.pclab.hardware.price.vo.AdminPriceViews.ProductAdminView;
import com.pclab.hardware.utils.SearchNormalizer;
import com.pclab.hardware.vo.PageView;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminPriceService {

    private final ProductMapper productMapper;
    private final ProductPriceMapper priceMapper;
    private final AdminProductMatchService matchService;
    private final AdminProductViewAssembler viewAssembler;

    public AdminPriceService(
            ProductMapper productMapper,
            ProductPriceMapper priceMapper,
            AdminProductMatchService matchService,
            AdminProductViewAssembler viewAssembler
    ) {
        this.productMapper = productMapper;
        this.priceMapper = priceMapper;
        this.matchService = matchService;
        this.viewAssembler = viewAssembler;
    }

    @Transactional(readOnly = true)
    public PageView<ProductAdminView> list(ProductListQuery query) {
        var wrapper = Wrappers.<ProductEntity>lambdaQuery()
                .like(query.keyword() != null && !query.keyword().isBlank(),
                        ProductEntity::getNormalizedTitle,
                        SearchNormalizer.normalize(query.keyword()))
                .eq(query.status() != null && !query.status().isBlank(),
                        ProductEntity::getStatus, query.status())
                .eq(query.category() != null && !query.category().isBlank(),
                        ProductEntity::getCategory, query.category())
                .eq(query.matchStatus() != null && !query.matchStatus().isBlank(),
                        ProductEntity::getMatchStatus, query.matchStatus())
                .apply(query.platform() != null && !query.platform().isBlank(),
                        "EXISTS (SELECT 1 FROM product_price pp "
                                + "WHERE pp.product_id = product.id AND pp.platform = {0})",
                        query.platform())
                .orderByDesc(ProductEntity::getUpdatedAt);
        Page<ProductEntity> page = productMapper.selectPage(
                Page.of(query.page(), query.size()),
                wrapper
        );
        List<ProductAdminView> items = page.getRecords().stream()
                .map(viewAssembler::toView)
                .toList();
        return new PageView<>(
                page.getCurrent(),
                page.getSize(),
                page.getTotal(),
                page.getPages(),
                items
        );
    }

    @Transactional
    @PriceCacheEviction
    public ProductAdminView createProduct(UpsertProductRequest request) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        ProductEntity product = new ProductEntity();
        product.setProductKey("manual-" + UUID.randomUUID());
        product.setVersion(1);
        product.setRecordSource("MANUAL");
        product.setCreatedAt(now);
        product.setDeleted(0);
        applyProductRequest(product, request, now);
        ProductMatch match = matchService.applyRequestedMatch(product, request.hardwareId());
        productMapper.insert(product);
        if (match != null) {
            matchService.recordPreview(product, match);
        }
        return viewAssembler.toView(product);
    }

    @Transactional
    @PriceCacheEviction
    public ProductAdminView updateProduct(Long productId, UpsertProductRequest request) {
        ProductEntity product = requireProduct(productId);
        PriceRecordPolicy.requireWritable(product.getRecordSource());
        if (request.version() == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "更新商品必须提交 version");
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        product.setVersion(request.version());
        applyProductRequest(product, request, now);
        ProductMatch match = matchService.applyRequestedMatch(product, request.hardwareId());
        if (productMapper.updateById(product) == 0) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
        if (match != null) {
            matchService.recordPreview(product, match);
        }
        return viewAssembler.toView(product);
    }

    @Transactional
    @PriceCacheEviction
    public void deleteProduct(Long productId) {
        ProductEntity product = requireProduct(productId);
        PriceRecordPolicy.requireWritable(product.getRecordSource());
        productMapper.deleteById(product);
        priceMapper.update(
                Wrappers.<ProductPriceEntity>lambdaUpdate()
                        .set(ProductPriceEntity::getIsEnabled, 0)
                        .eq(ProductPriceEntity::getProductId, productId)
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

    private ProductEntity requireProduct(Long productId) {
        ProductEntity product = productMapper.selectById(productId);
        if (product == null) {
            throw new DomainException(ErrorCode.PRICE_PRODUCT_NOT_FOUND);
        }
        return product;
    }

    private static String emptyIfNull(String value) {
        return value == null ? "" : value.trim();
    }

}
