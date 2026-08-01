package com.pclab.hardware.price.algorithm;

import com.pclab.hardware.price.domain.ProductMatch;
import com.pclab.hardware.price.domain.ProductMatch.MatchDecision;
import com.pclab.hardware.vo.HardwareView;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class ProductMatchingEngine {

    private static final Pattern GRAPHICS_MODEL = Pattern.compile(
            "(RTX|GTX|RX)\\s*-?\\s*\\d{3,4}(?:\\s*(?:TI|SUPER|XT|XTX))?"
    );
    private static final Pattern CPU_MODEL = Pattern.compile(
            "(?:I[3579]\\s*-?\\s*\\d{4,5}[A-Z]{0,2}|RYZEN\\s*[3579]\\s*\\d{4,5}[A-Z0-9]*)"
    );
    private static final Pattern CAPACITY = Pattern.compile("(\\d{1,3})\\s*(?:GB|G)(?:\\b|$)");
    private static final List<String> ACCESSORY_TERMS = List.of(
            "支架", "水冷头", "背板", "转接线", "延长线", "散热垫", "BRACKET", "CABLE"
    );
    private static final List<String> USED_TERMS = List.of("二手", "拆机", "翻新", "USED", "REFURBISHED");
    private static final Map<String, String> BRAND_ALIASES = Map.ofEntries(
            Map.entry("华硕", "ASUS"),
            Map.entry("英特尔", "INTEL"),
            Map.entry("英伟达", "NVIDIA"),
            Map.entry("微星", "MSI"),
            Map.entry("技嘉", "GIGABYTE"),
            Map.entry("七彩虹", "COLORFUL"),
            Map.entry("西部数据", "WESTERNDIGITAL")
    );

    public ProductMatch match(String title, HardwareView candidate) {
        return match(title, null, candidate);
    }

    public ProductMatch match(String title, String imageFingerprint, HardwareView candidate) {
        String normalizedTitle = normalize(title);
        if (containsAny(normalizedTitle, ACCESSORY_TERMS)) {
            return rejectedAccessory();
        }

        String normalizedCandidate = normalize(
                candidate.name() + " " + candidate.id() + " " + candidate.brand()
        );
        BigDecimal brand = brandScore(normalizedTitle, candidate.brand());
        BigDecimal model = modelScore(normalizedTitle, normalizedCandidate);
        SpecScore spec = specificationScore(normalizedTitle, candidate);
        BigDecimal keyword = model.signum() > 0 && brand.signum() > 0
                ? BigDecimal.ONE
                : new BigDecimal("0.40");
        boolean hasImageEvidence = hasImageEvidence(imageFingerprint);
        BigDecimal image = imageMatchScore(imageFingerprint, candidate);

        Map<String, BigDecimal> dimensions = new LinkedHashMap<>();
        dimensions.put("model", model);
        dimensions.put("brand", brand);
        dimensions.put("spec", spec.score());
        dimensions.put("keyword", keyword);
        dimensions.put("image", image);

        BigDecimal confidence = weightedConfidence(dimensions, hasImageEvidence);
        List<String> explanations = new ArrayList<>();
        explanations.add("型号匹配 " + percentage(model));
        explanations.add("品牌匹配 " + percentage(brand));
        explanations.add(spec.explanation());
        explanations.add(imageExplanation(hasImageEvidence, image));
        if (spec.conflict()) {
            confidence = confidence.multiply(new BigDecimal("0.50"));
            explanations.add("检测到显式规格冲突");
        }
        if (containsAny(normalizedTitle, USED_TERMS)) {
            confidence = confidence.subtract(new BigDecimal("0.25")).max(BigDecimal.ZERO);
            explanations.add("检测到二手或翻新关键词");
        }
        confidence = confidence.setScale(4, RoundingMode.HALF_UP);
        MatchDecision decision = decision(confidence, spec.conflict());
        return new ProductMatch(confidence, decision, dimensions, explanations);
    }

    private static ProductMatch rejectedAccessory() {
        return new ProductMatch(
                BigDecimal.ZERO.setScale(4),
                MatchDecision.REJECTED,
                Map.of(
                        "model", BigDecimal.ZERO,
                        "brand", BigDecimal.ZERO,
                        "spec", BigDecimal.ZERO,
                        "keyword", BigDecimal.ZERO,
                        "image", BigDecimal.ZERO
                ),
                List.of("标题包含支架、线材或散热附件等配件关键词")
        );
    }

    private static BigDecimal weightedConfidence(
            Map<String, BigDecimal> dimensions,
            boolean hasImageEvidence
    ) {
        BigDecimal total = dimensions.get("model").multiply(new BigDecimal("0.45"))
                .add(dimensions.get("brand").multiply(new BigDecimal("0.20")))
                .add(dimensions.get("spec").multiply(new BigDecimal("0.20")))
                .add(dimensions.get("keyword").multiply(new BigDecimal("0.10")));
        BigDecimal weight = new BigDecimal("0.95");
        if (hasImageEvidence) {
            total = total.add(dimensions.get("image").multiply(new BigDecimal("0.05")));
            weight = BigDecimal.ONE;
        }
        return total.divide(weight, 8, RoundingMode.HALF_UP);
    }

    private static BigDecimal brandScore(String title, String brand) {
        String normalizedBrand = normalize(brand);
        return normalizedBrand.isBlank() || !compact(title).contains(compact(normalizedBrand))
                ? BigDecimal.ZERO
                : BigDecimal.ONE;
    }

    private static BigDecimal modelScore(String title, String candidate) {
        String model = extractModel(candidate);
        return !model.isBlank() && compact(title).contains(compact(model))
                ? BigDecimal.ONE
                : BigDecimal.ZERO;
    }

    private static SpecScore specificationScore(String title, HardwareView candidate) {
        Integer expected = candidate.vram();
        if (expected == null) {
            return new SpecScore(new BigDecimal("0.60"), false, "暂无可比对的容量规格");
        }
        Matcher matcher = CAPACITY.matcher(title);
        if (!matcher.find()) {
            return new SpecScore(new BigDecimal("0.60"), false, "标题未明确显存容量");
        }
        int actual = Integer.parseInt(matcher.group(1));
        boolean conflict = actual != expected;
        return new SpecScore(
                conflict ? BigDecimal.ZERO : BigDecimal.ONE,
                conflict,
                conflict ? "显存容量与标准硬件不一致" : "显存容量一致"
        );
    }

    private static boolean hasImageEvidence(String imageFingerprint) {
        return imageFingerprint != null && !imageFingerprint.isBlank();
    }

    private static BigDecimal imageMatchScore(String imageFingerprint, HardwareView candidate) {
        if (!hasImageEvidence(imageFingerprint)) {
            return BigDecimal.ZERO;
        }
        String candidateModel = extractModel(normalize(candidate.name() + " " + candidate.id()));
        String compactFingerprint = compact(normalize(imageFingerprint));
        return !candidateModel.isBlank() && compactFingerprint.contains(compact(candidateModel))
                ? BigDecimal.ONE
                : BigDecimal.ZERO;
    }

    private static String imageExplanation(boolean hasImageEvidence, BigDecimal imageScore) {
        if (!hasImageEvidence) {
            return "无可核验的图片指纹证据";
        }
        return imageScore.signum() > 0
                ? "图片指纹与候选型号一致"
                : "图片指纹与候选型号不匹配";
    }

    private static MatchDecision decision(BigDecimal confidence, boolean conflict) {
        if (conflict || confidence.compareTo(new BigDecimal("0.65")) < 0) {
            return MatchDecision.REJECTED;
        }
        if (confidence.compareTo(new BigDecimal("0.88")) >= 0) {
            return MatchDecision.CONFIRMED;
        }
        return MatchDecision.REVIEW_REQUIRED;
    }

    private static String extractModel(String value) {
        Matcher graphics = GRAPHICS_MODEL.matcher(value);
        if (graphics.find()) {
            return graphics.group();
        }
        Matcher cpu = CPU_MODEL.matcher(value);
        return cpu.find() ? cpu.group() : "";
    }

    private static String normalize(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFKC)
                .toUpperCase(Locale.ROOT);
        for (Map.Entry<String, String> alias : BRAND_ALIASES.entrySet()) {
            normalized = normalized.replace(alias.getKey(), alias.getValue());
        }
        return normalized.replace("GEFORCE", " ");
    }

    private static String compact(String value) {
        return value.replaceAll("[^\\p{L}\\p{N}]+", "");
    }

    private static boolean containsAny(String value, List<String> terms) {
        return terms.stream().anyMatch(value::contains);
    }

    private static String percentage(BigDecimal value) {
        return value.multiply(new BigDecimal("100")).setScale(0) + "%";
    }

    private record SpecScore(BigDecimal score, boolean conflict, String explanation) {
    }
}
