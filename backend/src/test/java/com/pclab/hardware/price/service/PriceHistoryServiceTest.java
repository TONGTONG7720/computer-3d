package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.price.domain.PlatformCode;
import com.pclab.hardware.price.entity.PriceHistoryEntity;
import com.pclab.hardware.price.mapper.PriceHistoryMapper;
import com.pclab.hardware.price.vo.PriceHistoryView;
import com.pclab.hardware.price.vo.PriceHistoryView.HistoryRange;
import com.pclab.hardware.service.HardwareQueryService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class PriceHistoryServiceTest {

    @Test
    void aggregatesDailyMinimumAcrossMarketplaceOffers() {
        HardwareQueryService hardwareService = mock(HardwareQueryService.class);
        PriceHistoryMapper historyMapper = mock(PriceHistoryMapper.class);
        HardwareEntity hardware = new HardwareEntity();
        hardware.setId(1L);
        hardware.setHardwareKey("gpu-nvidia-rtx5090");
        when(hardwareService.requireHardware("gpu-nvidia-rtx5090")).thenReturn(hardware);
        when(historyMapper.selectByHardwareAndRange(
                org.mockito.ArgumentMatchers.eq(1L),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.isNull()
        )).thenReturn(List.of(
                point(10L, "JD", "9299", LocalDateTime.of(2026, 7, 30, 8, 0)),
                point(10L, "PDD", "8799", LocalDateTime.of(2026, 7, 30, 9, 0)),
                point(10L, "JD", "9199", LocalDateTime.of(2026, 7, 31, 8, 0))
        ));
        PriceHistoryService service = new PriceHistoryService(
                hardwareService,
                historyMapper
        );

        PriceHistoryView result = service.history(
                "gpu-nvidia-rtx5090",
                HistoryRange.THIRTY_DAYS,
                null
        );

        assertThat(result.points()).extracting(PriceHistoryView.DailyPoint::minimumPrice)
                .containsExactly(new BigDecimal("8799"), new BigDecimal("9199"));
        assertThat(result.platform()).isNull();
        assertThat(result.range()).isEqualTo(HistoryRange.THIRTY_DAYS);
    }

    private static PriceHistoryEntity point(
            Long productId,
            String platform,
            String price,
            LocalDateTime time
    ) {
        PriceHistoryEntity history = new PriceHistoryEntity();
        history.setProductId(productId);
        history.setPlatform(PlatformCode.from(platform).name());
        history.setFinalPrice(new BigDecimal(price));
        history.setRecordedAt(time);
        return history;
    }
}
