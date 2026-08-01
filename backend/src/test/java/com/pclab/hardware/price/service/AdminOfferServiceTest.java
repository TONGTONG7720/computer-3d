package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.algorithm.PromotionCalculator;
import com.pclab.hardware.price.dto.AdminPriceRequests.UpsertOfferRequest;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.PriceHistoryMapper;
import com.pclab.hardware.price.mapper.ProductMapper;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class AdminOfferServiceTest {

    @Test
    void rejectsOfferCreationForInternalProduct() {
        ProductMapper productMapper = mock(ProductMapper.class);
        when(productMapper.selectById(7L)).thenReturn(internalProduct());
        AdminOfferService service = service(productMapper, mock(ProductPriceMapper.class));

        assertThatThrownBy(() -> service.createOffer(7L, mock(UpsertOfferRequest.class)))
                .isInstanceOfSatisfying(DomainException.class, exception ->
                        org.assertj.core.api.Assertions.assertThat(exception.errorCode())
                                .isEqualTo(ErrorCode.PRICE_RECORD_READ_ONLY)
                );
    }

    @Test
    void rejectsOfferUpdateWhenRecordIsInternal() {
        ProductPriceMapper priceMapper = mock(ProductPriceMapper.class);
        ProductPriceEntity offer = new ProductPriceEntity();
        offer.setId(11L);
        offer.setRecordSource("INTERNAL");
        when(priceMapper.selectById(11L)).thenReturn(offer);
        AdminOfferService service = service(mock(ProductMapper.class), priceMapper);

        assertThatThrownBy(() -> service.updateOffer(11L, mock(UpsertOfferRequest.class)))
                .isInstanceOfSatisfying(DomainException.class, exception ->
                        org.assertj.core.api.Assertions.assertThat(exception.errorCode())
                                .isEqualTo(ErrorCode.PRICE_RECORD_READ_ONLY)
                );
    }

    @Test
    void rejectsOfferDisableWhenRecordIsInternal() {
        ProductPriceMapper priceMapper = mock(ProductPriceMapper.class);
        ProductPriceEntity offer = new ProductPriceEntity();
        offer.setId(11L);
        offer.setRecordSource("INTERNAL");
        when(priceMapper.selectById(11L)).thenReturn(offer);
        AdminOfferService service = service(mock(ProductMapper.class), priceMapper);

        assertThatThrownBy(() -> service.disableOffer(11L))
                .isInstanceOfSatisfying(DomainException.class, exception ->
                        org.assertj.core.api.Assertions.assertThat(exception.errorCode())
                                .isEqualTo(ErrorCode.PRICE_RECORD_READ_ONLY)
                );
    }

    @Test
    void roundTripsDeliveryEvidenceWhenCreatingAnOffer() {
        ProductMapper productMapper = mock(ProductMapper.class);
        ProductEntity product = new ProductEntity();
        product.setId(7L);
        product.setRecordSource("MANUAL");
        when(productMapper.selectById(7L)).thenReturn(product);
        ProductPriceMapper priceMapper = mock(ProductPriceMapper.class);
        when(priceMapper.selectCount(any())).thenReturn(0L);
        when(priceMapper.insert(any(ProductPriceEntity.class))).thenAnswer(invocation -> {
            ProductPriceEntity saved = invocation.getArgument(0);
            saved.setId(17L);
            return 1;
        });
        AdminOfferService service = service(productMapper, priceMapper);

        var saved = service.createOffer(7L, offerRequest());

        assertThat(saved.deliveryScore()).isEqualByComparingTo("92");
        assertThat(saved.deliveryNote()).isEqualTo("京东物流 · 次日达");
    }

    private static AdminOfferService service(
            ProductMapper productMapper,
            ProductPriceMapper priceMapper
    ) {
        return new AdminOfferService(
                productMapper,
                priceMapper,
                mock(PriceHistoryMapper.class),
                mock(PromotionCalculator.class),
                mock(PriceLinkPolicy.class)
        );
    }

    private static ProductEntity internalProduct() {
        ProductEntity product = new ProductEntity();
        product.setId(7L);
        product.setRecordSource("INTERNAL");
        return product;
    }

    private static UpsertOfferRequest offerRequest() {
        return new UpsertOfferRequest(
                "JD",
                "京东自营",
                "SELF_OPERATED",
                new BigDecimal("9299"),
                new BigDecimal("100"),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                3200,
                new BigDecimal("4.9"),
                new BigDecimal("98"),
                new BigDecimal("92"),
                "京东物流 · 次日达",
                "CNY",
                "IN_STOCK",
                "",
                "",
                true,
                false,
                null
        );
    }
}
