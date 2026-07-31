package com.pclab.hardware.ai.service;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.domain.AiRequirement.Purpose;
import com.pclab.hardware.ai.recommendation.AiBuildCandidate;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AiExplanationComposer {

    public AiExplanation explain(AiRequirement requirement, AiBuildCandidate candidate) {
        Map<String, String> reasons = new LinkedHashMap<>();
        reasons.put("cpu", cpuReason(requirement));
        reasons.put("gpu", gpuReason(requirement));
        reasons.put("motherboard", "插槽、内存代际与机箱规格均通过规则校验");
        reasons.put("ram", "容量与平台代际匹配，并参与用途性能评分");
        reasons.put("storage", "在核心性能预算之后平衡容量、速度与总价");
        reasons.put("cooling", "散热能力覆盖处理器 TDP，冷排尺寸适配机箱");
        reasons.put("power_supply", "额定功率覆盖整机功耗并检查安全余量");
        reasons.put("case", "显卡长度、主板规格与散热尺寸均可安装");
        return new AiExplanation(summary(candidate), reasons);
    }

    private static String summary(AiBuildCandidate candidate) {
        if (candidate.overBudget()) {
            return "已找到兼容方案，但当前硬件目录无法完全压入预算；可查看替代项继续优化。";
        }
        if (!candidate.changedDependencies().isEmpty()) {
            return "目标零件可以替换，同时需要联动调整依赖零件；应用前请确认变更。";
        }
        return "配置已通过兼容性、预算与用途性能三重计算，可以直接载入 3D Builder。";
    }

    private static String cpuReason(AiRequirement requirement) {
        if (requirement.purposes().contains(Purpose.PROGRAMMING)
                || requirement.purposes().contains(Purpose.DESIGN)) {
            return "该用途依赖处理器多核与持续负载性能，CPU 权重已提高";
        }
        return "在显卡投入、平台兼容与整机预算之间保持平衡";
    }

    private static String gpuReason(AiRequirement requirement) {
        if (requirement.purposes().contains(Purpose.GAMING)) {
            return "3A 游戏帧率主要受 GPU 影响，因此显卡获得最高预算权重";
        }
        if (requirement.purposes().contains(Purpose.AI_TRAINING)) {
            return "本地 AI 训练优先 GPU 性能与显存能力";
        }
        return "根据用途权重选择，避免挤占处理器、内存与存储预算";
    }

    public record AiExplanation(String summary, Map<String, String> componentReasons) {

        public AiExplanation {
            componentReasons = Map.copyOf(componentReasons);
        }
    }
}
