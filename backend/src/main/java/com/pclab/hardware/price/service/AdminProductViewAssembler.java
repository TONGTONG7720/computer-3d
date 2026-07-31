package com.pclab.hardware.price.service;

import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.vo.AdminPriceViews.ProductAdminView;
import org.springframework.stereotype.Component;

@Component
public class AdminProductViewAssembler {

    private final AdminOfferService offerService;

    public AdminProductViewAssembler(AdminOfferService offerService) {
        this.offerService = offerService;
    }

    ProductAdminView toView(ProductEntity product) {
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
}
