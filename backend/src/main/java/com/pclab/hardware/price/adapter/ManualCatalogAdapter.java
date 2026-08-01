package com.pclab.hardware.price.adapter;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.domain.PlatformCode;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.ProductMapper;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ManualCatalogAdapter implements PlatformAdapter {

    private final ProductMapper productMapper;
    private final ProductPriceMapper priceMapper;
    private final boolean enabled;

    public ManualCatalogAdapter(
            ProductMapper productMapper,
            ProductPriceMapper priceMapper,
            @Value("${app.price.manual-adapter-enabled:true}") boolean enabled
    ) {
        this.productMapper = productMapper;
        this.priceMapper = priceMapper;
        this.enabled = enabled;
    }

    @Override
    public String adapterCode() {
        return "manual-catalog";
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public Set<PlatformCode> supportedPlatforms() {
        return EnumSet.allOf(PlatformCode.class);
    }

    @Override
    public List<PlatformProductCandidate> searchProduct(PlatformSearchRequest request) {
        var query = Wrappers.<ProductEntity>lambdaQuery()
                .eq(ProductEntity::getStatus, "ACTIVE")
                .eq(request.hardwareId() != null, ProductEntity::getHardwareId, request.hardwareId())
                .eq(request.category() != null && !request.category().isBlank(),
                        ProductEntity::getCategory, request.category())
                .like(request.keyword() != null && !request.keyword().isBlank(),
                        ProductEntity::getNormalizedTitle, request.keyword())
                .orderByDesc(ProductEntity::getMatchConfidence)
                .last("LIMIT 50");
        return productMapper.selectList(query).stream()
                .map(this::toCandidate)
                .toList();
    }

    @Override
    public PlatformPriceSnapshot getPrice(PlatformProductRef reference) {
        ProductPriceEntity offer = priceMapper.selectById(reference.offerId());
        if (offer == null || !offer.getProductId().equals(reference.productId())) {
            throw new DomainException(ErrorCode.PRICE_OFFER_NOT_FOUND);
        }
        return new PlatformPriceSnapshot(
                offer.getId(),
                PlatformCode.from(offer.getPlatform()),
                offer.getSalePrice(),
                offer.getFinalPrice(),
                offer.getStockStatus(),
                offer.getCheckedAt()
        );
    }

    @Override
    public PlatformProductDetail getDetail(PlatformProductRef reference) {
        ProductEntity product = productMapper.selectById(reference.productId());
        if (product == null) {
            throw new DomainException(ErrorCode.PRICE_OFFER_NOT_FOUND, "商品不存在");
        }
        return new PlatformProductDetail(
                product.getId(),
                product.getProductKey(),
                product.getTitle(),
                product.getDescription(),
                product.getImageUrl(),
                product.getRecordSource()
        );
    }

    @Override
    public String getSeller(PlatformProductRef reference) {
        return requireOffer(reference).getSeller();
    }

    @Override
    public String getLink(PlatformProductRef reference) {
        ProductPriceEntity offer = requireOffer(reference);
        if (offer.getAffiliateUrl() != null && !offer.getAffiliateUrl().isBlank()) {
            return offer.getAffiliateUrl();
        }
        return offer.getProductUrl();
    }

    private ProductPriceEntity requireOffer(PlatformProductRef reference) {
        ProductPriceEntity offer = priceMapper.selectById(reference.offerId());
        if (offer == null || !offer.getProductId().equals(reference.productId())) {
            throw new DomainException(ErrorCode.PRICE_OFFER_NOT_FOUND);
        }
        return offer;
    }

    private PlatformProductCandidate toCandidate(ProductEntity product) {
        return new PlatformProductCandidate(
                product.getId(),
                product.getHardwareId(),
                product.getTitle(),
                product.getBrand(),
                product.getModel(),
                product.getCategory(),
                product.getMatchConfidence()
        );
    }
}
