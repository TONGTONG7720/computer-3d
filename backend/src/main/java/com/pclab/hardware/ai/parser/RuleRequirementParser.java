package com.pclab.hardware.ai.parser;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.domain.AiRequirement.ComponentTarget;
import com.pclab.hardware.ai.domain.AiRequirement.FormFactorPreference;
import com.pclab.hardware.ai.domain.AiRequirement.Priority;
import com.pclab.hardware.ai.domain.AiRequirement.Purpose;
import com.pclab.hardware.ai.domain.AiRequirement.Style;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class RuleRequirementParser {

    private static final Pattern BUDGET_PREFIX = Pattern.compile(
            "(?i)(?:预算|budget)\\s*[:：]?\\s*([1-9]\\d{3,5})"
    );
    private static final Pattern BUDGET_SUFFIX = Pattern.compile(
            "(?i)([1-9]\\d{3,5})\\s*(?:元|块|预算)"
    );
    private static final Pattern GPU_MODEL = Pattern.compile(
            "(?i)(RTX\\s*50(?:70|80|90)|RX\\s*8900\\s*XT)"
    );
    private static final Pattern CPU_MODEL = Pattern.compile(
            "(?i)(i9[-\\s]?14900K|7800X3D)"
    );

    public AiRequirement parse(String message) {
        String normalized = message.strip();
        String lower = normalized.toLowerCase(Locale.ROOT);
        BigDecimal budget = parseBudget(normalized);
        Set<Purpose> purposes = purposes(lower);
        Set<Priority> priorities = priorities(lower, purposes);
        Set<Style> styles = styles(lower);
        FormFactorPreference formFactor = formFactor(lower);
        Map<ComponentTarget, String> requestedChanges = requestedChanges(normalized, lower);
        List<String> missing = missingInformation(budget, purposes);

        return new AiRequirement(
                budget,
                purposes,
                priorities,
                styles,
                formFactor,
                requestedChanges,
                confidence(missing, requestedChanges),
                missing
        );
    }

    private static BigDecimal parseBudget(String message) {
        Matcher prefix = BUDGET_PREFIX.matcher(message);
        if (prefix.find()) {
            return new BigDecimal(prefix.group(1));
        }
        Matcher suffix = BUDGET_SUFFIX.matcher(message);
        return suffix.find() ? new BigDecimal(suffix.group(1)) : null;
    }

    private static Set<Purpose> purposes(String message) {
        EnumSet<Purpose> result = EnumSet.noneOf(Purpose.class);
        addWhen(result, Purpose.GAMING, containsAny(message, "游戏", "3a", "电竞", "gaming"));
        addWhen(result, Purpose.OFFICE, containsAny(message, "办公", "office", "文档"));
        addWhen(result, Purpose.DESIGN, containsAny(message, "设计", "渲染", "剪辑", "design"));
        addWhen(result, Purpose.PROGRAMMING, containsAny(message, "编程", "开发", "编译", "coding"));
        addWhen(result, Purpose.AI_TRAINING, containsAny(
                message,
                "ai训练",
                "ai 训练",
                "大模型",
                "机器学习",
                "深度学习"
        ));
        return result;
    }

    private static Set<Priority> priorities(String message, Set<Purpose> purposes) {
        EnumSet<Priority> result = EnumSet.noneOf(Priority.class);
        if (purposes.contains(Purpose.GAMING) || purposes.contains(Purpose.AI_TRAINING)) {
            result.add(Priority.GPU);
        }
        if (purposes.contains(Purpose.PROGRAMMING) || purposes.contains(Purpose.OFFICE)) {
            result.add(Priority.CPU);
        }
        addWhen(result, Priority.QUIET, containsAny(message, "静音", "安静", "quiet"));
        addWhen(result, Priority.VALUE, containsAny(message, "性价比", "省钱", "划算", "value"));
        return result;
    }

    private static Set<Style> styles(String message) {
        EnumSet<Style> result = EnumSet.noneOf(Style.class);
        addWhen(result, Style.WHITE, containsAny(message, "白色", "纯白", "white"));
        addWhen(result, Style.RGB, containsAny(message, "rgb", "灯效", "灯光"));
        return result;
    }

    private static FormFactorPreference formFactor(String message) {
        return containsAny(message, "小体积", "紧凑", "mini", "itx")
                ? FormFactorPreference.COMPACT
                : FormFactorPreference.ANY;
    }

    private static Map<ComponentTarget, String> requestedChanges(
            String message,
            String lower
    ) {
        EnumMap<ComponentTarget, String> result = new EnumMap<>(ComponentTarget.class);
        if (containsAny(lower, "显卡", "gpu")) {
            findModel(message, GPU_MODEL).ifPresent(model -> result.put(ComponentTarget.GPU, model));
        }
        if (containsAny(lower, "处理器", "cpu")) {
            findModel(message, CPU_MODEL).ifPresent(model -> result.put(ComponentTarget.CPU, model));
        }
        return result;
    }

    private static java.util.Optional<String> findModel(String message, Pattern pattern) {
        Matcher matcher = pattern.matcher(message);
        if (!matcher.find()) {
            return java.util.Optional.empty();
        }
        String value = matcher.group(1).toUpperCase(Locale.ROOT).replaceAll("\\s+", " ");
        return java.util.Optional.of(value);
    }

    private static List<String> missingInformation(
            BigDecimal budget,
            Set<Purpose> purposes
    ) {
        List<String> missing = new ArrayList<>();
        if (budget == null) {
            missing.add("BUDGET");
        }
        if (purposes.isEmpty()) {
            missing.add("PURPOSE");
        }
        return missing;
    }

    private static double confidence(
            List<String> missing,
            Map<ComponentTarget, String> requestedChanges
    ) {
        double base = requestedChanges.isEmpty() ? 1.0 : 0.94;
        return Math.max(0.4, base - missing.size() * 0.18);
    }

    private static boolean containsAny(String message, String... keywords) {
        for (String keyword : keywords) {
            if (message.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private static <T extends Enum<T>> void addWhen(Set<T> target, T value, boolean condition) {
        if (condition) {
            target.add(value);
        }
    }
}
