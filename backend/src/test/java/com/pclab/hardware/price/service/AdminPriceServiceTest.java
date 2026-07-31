package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.dto.AdminPriceRequests.UpsertProductRequest;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.ProductMapper;
import org.junit.jupiter.api.Test;

class AdminPriceServiceTest {

    @Test
    void rejectsProductUpdateWhenRecordIsInternal() {
        ProductMapper productMapper = mock(ProductMapper.class);
        ProductEntity product = internalProduct();
        when(productMapper.selectById(7L)).thenReturn(product);
        AdminPriceService service = service(productMapper);

        assertThatThrownBy(() -> service.updateProduct(
                7L,
                mock(UpsertProductRequest.class)
        )).isInstanceOfSatisfying(DomainException.class, exception ->
                org.assertj.core.api.Assertions.assertThat(exception.errorCode())
                        .isEqualTo(ErrorCode.PRICE_RECORD_READ_ONLY)
        );
    }

    @Test
    void rejectsProductDeletionWhenRecordIsInternal() {
        ProductMapper productMapper = mock(ProductMapper.class);
        ProductEntity product = internalProduct();
        when(productMapper.selectById(7L)).thenReturn(product);
        AdminPriceService service = service(productMapper);

        assertThatThrownBy(() -> service.deleteProduct(7L))
                .isInstanceOfSatisfying(DomainException.class, exception ->
                        org.assertj.core.api.Assertions.assertThat(exception.errorCode())
                                .isEqualTo(ErrorCode.PRICE_RECORD_READ_ONLY)
                );
    }

    private static AdminPriceService service(ProductMapper productMapper) {
        return new AdminPriceService(
                productMapper,
                mock(ProductPriceMapper.class),
                mock(AdminProductMatchService.class),
                mock(AdminProductViewAssembler.class)
        );
    }

    private static ProductEntity internalProduct() {
        ProductEntity product = new ProductEntity();
        product.setId(7L);
        product.setRecordSource("INTERNAL");
        return product;
    }
}
