package com.pclab.hardware.intelligence.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.intelligence.service.AdminIntelligenceService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = AdminIntelligenceController.class,
        properties = "app.security.admin-key=test-admin-key"
)
class AdminIntelligenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminIntelligenceService service;

    @Test
    void requiresAdminKeyForRuleManagement() throws Exception {
        mockMvc.perform(get("/api/admin/compatibility-rules"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED_ADMIN"));
    }

    @Test
    void returnsVersionedRuleList() throws Exception {
        when(service.listRules()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/compatibility-rules")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void rejectsPerformanceScoresAboveOneHundred() throws Exception {
        mockMvc.perform(put("/api/admin/hardware/9/performance")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "gaming":101,
                                  "creator":84,
                                  "ai":96,
                                  "source":"LAB benchmark",
                                  "version":3
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void mapsStaleRuleUpdateToConflict() throws Exception {
        when(service.updateRule(eq(7L), any())).thenThrow(new DomainException(ErrorCode.CONFLICT));

        mockMvc.perform(put("/api/admin/compatibility-rules/7")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "code":"GPU_CASE_CLEARANCE",
                                  "sourceCategory":"GPU",
                                  "targetCategory":"CASE",
                                  "type":"GPU_CLEARANCE",
                                  "severity":"ERROR",
                                  "message":"显卡长度超过机箱空间",
                                  "config":{},
                                  "priority":30,
                                  "enabled":true,
                                  "version":1
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
    }
}
