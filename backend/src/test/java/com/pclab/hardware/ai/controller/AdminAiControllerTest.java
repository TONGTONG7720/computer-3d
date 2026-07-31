package com.pclab.hardware.ai.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pclab.hardware.ai.service.AdminAiMutationService;
import com.pclab.hardware.ai.service.AdminAiQueryService;
import com.pclab.hardware.ai.vo.AdminAiViews.AiDashboardView;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = AdminAiController.class,
        properties = "app.security.admin-key=test-admin-key"
)
class AdminAiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminAiQueryService queryService;

    @MockitoBean
    private AdminAiMutationService mutationService;

    @Test
    void returnsOperationalDashboard() throws Exception {
        when(queryService.dashboard()).thenReturn(new AiDashboardView(
                1, 6, 5, 18, 2, 134, 3200, 0.11, LocalDateTime.now()
        ));

        mockMvc.perform(get("/api/admin/ai/dashboard")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activeKnowledgeDocuments").value(6))
                .andExpect(jsonPath("$.data.fallbackRate").value(0.11));
    }

    @Test
    void rejectsUnsafePromptPayloadBeforeMutation() throws Exception {
        mockMvc.perform(post("/api/admin/ai/prompts/INTENT_SYSTEM_V1/versions")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"content\":\"\",\"activate\":true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void requiresAdminKeyForKnowledgeManagement() throws Exception {
        mockMvc.perform(get("/api/admin/ai/knowledge"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED_ADMIN"));
    }
}
