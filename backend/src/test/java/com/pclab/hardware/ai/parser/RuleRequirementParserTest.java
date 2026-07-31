package com.pclab.hardware.ai.parser;

import static org.assertj.core.api.Assertions.assertThat;

import com.pclab.hardware.ai.domain.AiRequirement;
import com.pclab.hardware.ai.domain.AiRequirement.ComponentTarget;
import com.pclab.hardware.ai.domain.AiRequirement.FormFactorPreference;
import com.pclab.hardware.ai.domain.AiRequirement.Priority;
import com.pclab.hardware.ai.domain.AiRequirement.Purpose;
import com.pclab.hardware.ai.domain.AiRequirement.Style;
import org.junit.jupiter.api.Test;

class RuleRequirementParserTest {

    private final RuleRequirementParser parser = new RuleRequirementParser();

    @Test
    void parsesGamingBudgetAndPreferencesWhenChineseRequestIsComplete() {
        AiRequirement result = parser.parse("8000预算玩3A，希望白色RGB并且安静");

        assertThat(result.budget()).isEqualByComparingTo("8000");
        assertThat(result.purposes()).containsExactly(Purpose.GAMING);
        assertThat(result.styles()).containsExactlyInAnyOrder(Style.WHITE, Style.RGB);
        assertThat(result.priorities()).contains(Priority.GPU, Priority.QUIET);
        assertThat(result.missingInformation()).isEmpty();
    }

    @Test
    void extractsExactGpuChangeWithoutInventingSpecifications() {
        AiRequirement result = parser.parse("显卡换成 RTX 5090，其他尽量不动");

        assertThat(result.requestedChanges())
                .containsEntry(ComponentTarget.GPU, "RTX 5090");
        assertThat(result.budget()).isNull();
        assertThat(result.missingInformation()).contains("BUDGET", "PURPOSE");
    }

    @Test
    void recognisesProgrammingAndCompactFormFactor() {
        AiRequirement result = parser.parse("预算 12000，编程和编译为主，想要小体积主机");

        assertThat(result.budget()).isEqualByComparingTo("12000");
        assertThat(result.purposes()).containsExactly(Purpose.PROGRAMMING);
        assertThat(result.formFactor()).isEqualTo(FormFactorPreference.COMPACT);
        assertThat(result.priorities()).contains(Priority.CPU);
    }
}
