package com.pclab.hardware.price.scheduler;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.pclab.hardware.entity.HardwareEntity;
import com.pclab.hardware.mapper.HardwareMapper;
import com.pclab.hardware.price.service.PriceComparisonService;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        name = "app.price.scheduler-enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class PriceRefreshScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(PriceRefreshScheduler.class);

    private final HardwareMapper hardwareMapper;
    private final PriceComparisonService comparisonService;

    public PriceRefreshScheduler(
            HardwareMapper hardwareMapper,
            PriceComparisonService comparisonService
    ) {
        this.hardwareMapper = hardwareMapper;
        this.comparisonService = comparisonService;
    }

    @Scheduled(cron = "${app.price.hot-refresh-cron}")
    public void refreshHotHardwareCoverage() {
        auditCoverage("HOT", 8);
    }

    @Scheduled(cron = "${app.price.normal-refresh-cron}")
    public void refreshNormalHardwareCoverage() {
        auditCoverage("NORMAL", 100);
    }

    private void auditCoverage(String scope, int limit) {
        List<HardwareEntity> hardware = hardwareMapper.selectList(
                Wrappers.<HardwareEntity>lambdaQuery()
                        .eq(HardwareEntity::getStatus, "ACTIVE")
                        .orderByAsc(HardwareEntity::getSortOrder)
                        .last("LIMIT " + limit)
        );
        long missingCount = hardware.stream()
                .map(item -> comparisonService.compareHardware(item.getHardwareKey()))
                .filter(comparison -> comparison.offers().isEmpty())
                .count();
        if (missingCount > 0) {
            LOGGER.warn(
                    "price.coverage.missing scope={} missingCount={} totalCount={}",
                    scope,
                    missingCount,
                    hardware.size()
            );
        }
    }
}
