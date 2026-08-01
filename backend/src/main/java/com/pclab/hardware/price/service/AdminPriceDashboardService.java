package com.pclab.hardware.price.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.mapper.HardwareMapper;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.entity.PriceAlertEntity;
import com.pclab.hardware.price.entity.PriceClickEventEntity;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.PriceAlertMapper;
import com.pclab.hardware.price.mapper.PriceClickEventMapper;
import com.pclab.hardware.price.mapper.ProductMapper;
import com.pclab.hardware.price.mapper.TopHardwareClickRow;
import com.pclab.hardware.price.vo.AdminPriceViews.AdminDashboardView;
import com.pclab.hardware.price.vo.AdminPriceViews.TopHardwareClickView;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminPriceDashboardService {

    private final ProductMapper productMapper;
    private final ProductPriceMapper priceMapper;
    private final PriceClickEventMapper clickMapper;
    private final HardwareMapper hardwareMapper;
    private final PriceAlertMapper alertMapper;

    public AdminPriceDashboardService(
            ProductMapper productMapper,
            ProductPriceMapper priceMapper,
            PriceClickEventMapper clickMapper,
            HardwareMapper hardwareMapper,
            PriceAlertMapper alertMapper
    ) {
        this.productMapper = productMapper;
        this.priceMapper = priceMapper;
        this.clickMapper = clickMapper;
        this.hardwareMapper = hardwareMapper;
        this.alertMapper = alertMapper;
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
        long activeAlerts = alertMapper.selectCount(
                Wrappers.<PriceAlertEntity>lambdaQuery()
                        .eq(PriceAlertEntity::getStatus, "ACTIVE")
        );
        long triggeredAlerts = alertMapper.selectCount(
                Wrappers.<PriceAlertEntity>lambdaQuery()
                        .eq(PriceAlertEntity::getStatus, "TRIGGERED")
        );
        List<TopHardwareClickView> top = clickMapper.selectTopHardware(now.minusDays(30), 5)
                .stream()
                .map(AdminPriceDashboardService::toTopClick)
                .toList();
        return new AdminDashboardView(
                activeProducts,
                validOffers,
                staleOffers,
                Math.max(0, activeHardware - productMapper.countCoveredHardware()),
                clicks,
                activeAlerts,
                triggeredAlerts,
                top,
                "MANUAL",
                now
        );
    }

    private static TopHardwareClickView toTopClick(TopHardwareClickRow row) {
        return new TopHardwareClickView(
                row.getHardwareKey(),
                row.getHardwareName(),
                row.getClickCount()
        );
    }
}
