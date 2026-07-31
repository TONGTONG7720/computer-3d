package com.pclab.hardware.price.algorithm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.domain.PlatformCode;
import com.pclab.hardware.price.domain.PriceRanking;
import com.pclab.hardware.price.domain.PriceRanking.RankableOffer;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;

class BestPriceAlgorithmTest {

    private final BestPriceAlgorithm algorithm = new BestPriceAlgorithm();

    @Test
    void separatesLowestPriceFromReliableRecommendation() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        RankableOffer jd = offer(1L, PlatformCode.JD, "京东自营", "SELF_OPERATED",
                "9299", 12000, "4.90", "98", now);
        RankableOffer taobao = offer(2L, PlatformCode.TAOBAO, "品牌旗舰店", "BRAND_STORE",
                "8999", 6500, "4.80", "91", now);
        RankableOffer pdd = offer(3L, PlatformCode.PDD, "平台补贴店", "MARKETPLACE",
                "8799", 1800, "4.50", "80", now);

        PriceRanking result = algorithm.rank(List.of(jd, taobao, pdd), now);

        assertThat(result.lowest().platform()).isEqualTo(PlatformCode.PDD);
        assertThat(result.recommended().platform()).isEqualTo(PlatformCode.JD);
        assertThat(result.recommendedReason()).contains("自营", "价差");
    }

    @Test
    void rejectsNonPositivePricesAtTheRankingBoundary() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        assertThatThrownBy(() -> algorithm.rank(List.of(
                offer(1L, PlatformCode.JD, "京东自营", "SELF_OPERATED",
                        "0", 12000, "4.90", "98", now)
        ), now)).isInstanceOfSatisfying(DomainException.class, exception ->
                assertThat(exception.errorCode()).isEqualTo(ErrorCode.PRICE_PROMOTION_INVALID)
        );
    }

    private static RankableOffer offer(
            Long id,
            PlatformCode platform,
            String seller,
            String shopType,
            String price,
            int sales,
            String rating,
            String sellerScore,
            LocalDateTime checkedAt
    ) {
        return new RankableOffer(
                id,
                platform,
                seller,
                shopType,
                new BigDecimal(price),
                sales,
                new BigDecimal(rating),
                new BigDecimal(sellerScore),
                checkedAt,
                "MANUAL"
        );
    }
}
