package com.pclab.hardware.ai.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pclab.hardware.ai.domain.AiRoute;
import com.pclab.hardware.ai.dto.AiBuildRequest;
import com.pclab.hardware.ai.service.AiBuilderService;
import com.pclab.hardware.ai.vo.AiBuildView;
import com.pclab.hardware.ai.vo.AiBuildView.RequirementView;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AiBuilderController.class)
class AiBuilderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AiBuilderService aiBuilderService;

    @Test
    void rejectsBlankUserMessage() throws Exception {
        mockMvc.perform(post("/api/ai/build")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"   \",\"currentComponents\":{}}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void acceptsMessageAtDocumentedCharacterLimit() throws Exception {
        when(aiBuilderService.build(any(AiBuildRequest.class))).thenReturn(sampleView());

        mockMvc.perform(post("/api/ai/build")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"" + "x".repeat(2000) + "\",\"currentComponents\":{}}"))
                .andExpect(status().isOk());
    }

    @Test
    void rejectsMessageBeyondDocumentedCharacterLimit() throws Exception {
        mockMvc.perform(post("/api/ai/build")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"" + "x".repeat(2001) + "\",\"currentComponents\":{}}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void returnsExplainableStructuredBuild() throws Exception {
        when(aiBuilderService.build(any(AiBuildRequest.class))).thenReturn(sampleView());

        mockMvc.perform(post("/api/ai/build")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"8000预算游戏电脑\",\"currentComponents\":{}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.route").value("RULE"))
                .andExpect(jsonPath("$.data.configId").value("build-1"))
                .andExpect(jsonPath("$.data.components.gpu").value("gpu-rtx5070"))
                .andExpect(jsonPath("$.data.budgetShortfall").value(1))
                .andExpect(jsonPath("$.data.componentReasons.gpu").isNotEmpty())
                .andExpect(jsonPath("$.data.knowledgeSources").isArray());
    }

    private static AiBuildView sampleView() {
        return new AiBuildView(
                "request-1",
                "session-1",
                AiRoute.RULE,
                new RequirementView(
                        new BigDecimal("8000"),
                        List.of("GAMING"),
                        List.of("GPU"),
                        List.of(),
                        "ANY",
                        Map.of(),
                        List.of()
                ),
                "build-1",
                Map.of("gpu", "gpu-rtx5070"),
                new BigDecimal("8001"),
                BigDecimal.ONE,
                88,
                620,
                "SUCCESS",
                false,
                "配置已生成",
                Map.of("gpu", "游戏用途优先显卡性能"),
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );
    }
}
