package com.pclab.hardware.price.algorithm;

import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.price.domain.ProductMatch;
import com.pclab.hardware.vo.HardwareView;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class ProductMatchingEngineTest {

    private final ProductMatchingEngine engine = new ProductMatchingEngine();

    @Test
    void matchesChineseAndEnglishRtx5090Title() {
        HardwareView candidate = HardwareView.builder()
                .id("gpu-nvidia-rtx5090")
                .name("NVIDIA GeForce RTX 5090")
                .brand("ASUS")
                .category("GPU")
                .vram(32)
                .build();

        ProductMatch result = engine.match("华硕 RTX5090 OC 32G", null, candidate);

        assertThat(result.confidence()).isGreaterThanOrEqualTo(new BigDecimal("0.8800"));
        assertThat(result.decision()).isEqualTo(ProductMatch.MatchDecision.CONFIRMED);
        assertThat(result.dimensionScores()).containsKeys("model", "brand", "spec", "keyword", "image");
        assertThat(result.dimensionScores().get("image")).isEqualByComparingTo("0");
    }

    @Test
    void rejectsGpuBracketAccessory() {
        HardwareView candidate = HardwareView.builder()
                .id("gpu-nvidia-rtx5090")
                .name("NVIDIA GeForce RTX 5090")
                .brand("NVIDIA")
                .category("GPU")
                .vram(32)
                .build();

        ProductMatch result = engine.match("RTX5090 显卡支架", "same-image", candidate);

        assertThat(result.decision()).isEqualTo(ProductMatch.MatchDecision.REJECTED);
        assertThat(result.explanations()).anyMatch(item -> item.contains("配件"));
    }
}
