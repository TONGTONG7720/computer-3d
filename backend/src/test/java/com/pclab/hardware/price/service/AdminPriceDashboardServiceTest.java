package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.pclab.hardware.mapper.HardwareMapper;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.mapper.PriceAlertMapper;
import com.pclab.hardware.price.mapper.PriceClickEventMapper;
import com.pclab.hardware.price.mapper.ProductMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class AdminPriceDashboardServiceTest {

    @Test
    void countsActiveAndTriggeredAlertsForOperationalCoverage() {
        ProductMapper productMapper = mock(ProductMapper.class);
        ProductPriceMapper priceMapper = mock(ProductPriceMapper.class);
        PriceClickEventMapper clickMapper = mock(PriceClickEventMapper.class);
        HardwareMapper hardwareMapper = mock(HardwareMapper.class);
        PriceAlertMapper alertMapper = mock(PriceAlertMapper.class);
        when(productMapper.selectCount(any())).thenReturn(3L);
        when(productMapper.countCoveredHardware()).thenReturn(2L);
        when(priceMapper.selectCount(any())).thenReturn(7L, 1L);
        when(clickMapper.selectCount(any())).thenReturn(14L);
        when(clickMapper.selectTopHardware(any(), anyInt())).thenReturn(List.of());
        when(hardwareMapper.selectCount(any())).thenReturn(4L);
        when(alertMapper.selectCount(any())).thenReturn(5L, 2L);
        AdminPriceDashboardService service = new AdminPriceDashboardService(
                productMapper,
                priceMapper,
                clickMapper,
                hardwareMapper,
                alertMapper
        );

        var dashboard = service.dashboard();

        assertThat(dashboard.activeAlertCount()).isEqualTo(5);
        assertThat(dashboard.triggeredAlertCount()).isEqualTo(2);
    }
}
