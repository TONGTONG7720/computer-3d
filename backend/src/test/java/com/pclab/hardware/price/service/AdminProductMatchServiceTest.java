package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.algorithm.ProductMatchingEngine;
import com.pclab.hardware.price.domain.ProductMatch;
import com.pclab.hardware.price.dto.AdminPriceRequests.ConfirmMatchRequest;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.ProductMapper;
import com.pclab.hardware.price.mapper.ProductMatchAuditMapper;
import com.pclab.hardware.service.HardwareQueryService;
import com.pclab.hardware.vo.HardwareView;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
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

    @Test
    void passesPlatformProductImageFingerprintToMatchingEngine() {
        ProductMapper productMapper = mock(ProductMapper.class);
        ProductMatchAuditMapper auditMapper = mock(ProductMatchAuditMapper.class);
        HardwareQueryService hardwareService = mock(HardwareQueryService.class);
        ProductMatchingEngine matchingEngine = mock(ProductMatchingEngine.class);
        ProductEntity product = new ProductEntity();
        product.setId(7L);
        product.setTitle("华硕 RTX 5090");
        product.setImageFingerprint("product-rtx5090-fingerprint");
        HardwareView hardware = HardwareView.builder().databaseId(1L).id("gpu-nvidia-rtx5090").build();
        ProductMatch match = new ProductMatch(
                BigDecimal.ONE,
                ProductMatch.MatchDecision.CONFIRMED,
                Map.of(),
                List.of()
        );
        when(hardwareService.findDetail("1")).thenReturn(hardware);
        when(matchingEngine.match(product.getTitle(), hardware)).thenReturn(match);
        when(matchingEngine.match(eq(product.getTitle()), eq(product.getImageFingerprint()), eq(hardware)))
                .thenReturn(match);
        AdminProductMatchService service = new AdminProductMatchService(
                productMapper,
                auditMapper,
                hardwareService,
                matchingEngine,
                mock(AdminProductViewAssembler.class),
                new ObjectMapper()
        );

        ProductMatch result = service.applyRequestedMatch(product, 1L);

        assertThat(result).isEqualTo(match);
        verify(matchingEngine).match(product.getTitle(), product.getImageFingerprint(), hardware);
    }
}
