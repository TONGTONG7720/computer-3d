package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.algorithm.ProductMatchingEngine;
import com.pclab.hardware.price.dto.AdminPriceRequests.ConfirmMatchRequest;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.ProductMapper;
import com.pclab.hardware.price.mapper.ProductMatchAuditMapper;
import com.pclab.hardware.service.HardwareQueryService;
import org.junit.jupiter.api.Test;

class AdminProductMatchServiceTest {

    @Test
    void rejectsMatchConfirmationWhenRecordIsInternal() {
        ProductMapper productMapper = mock(ProductMapper.class);
        ProductEntity product = new ProductEntity();
        product.setId(7L);
        product.setRecordSource("INTERNAL");
        when(productMapper.selectById(7L)).thenReturn(product);
        AdminProductMatchService service = new AdminProductMatchService(
                productMapper,
                mock(ProductMatchAuditMapper.class),
                mock(HardwareQueryService.class),
                mock(ProductMatchingEngine.class),
                mock(AdminProductViewAssembler.class),
                new ObjectMapper()
        );

        assertThatThrownBy(() -> service.confirmMatch(
                7L,
                mock(ConfirmMatchRequest.class)
        )).isInstanceOfSatisfying(DomainException.class, exception ->
                org.assertj.core.api.Assertions.assertThat(exception.errorCode())
                        .isEqualTo(ErrorCode.PRICE_RECORD_READ_ONLY)
        );
    }
}
