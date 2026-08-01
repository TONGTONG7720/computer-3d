package com.pclab.hardware.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pclab.hardware.dto.HardwareQuery;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.service.HardwareQueryService;
import com.pclab.hardware.vo.PageView;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(HardwareController.class)
class HardwareControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private HardwareQueryService hardwareQueryService;

    @Test
    void rejectsPageSizeAbovePublicLimit() throws Exception {
        mockMvc.perform(get("/api/hardware").param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void exposesGpuShortcutAsPagedEnvelope() throws Exception {
        when(hardwareQueryService.findPage(any(HardwareQuery.class)))
                .thenReturn(new PageView<>(1, 24, 0, 0, List.of()));

        mockMvc.perform(get("/api/hardware/gpu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("OK"))
                .andExpect(jsonPath("$.data.page").value(1))
                .andExpect(jsonPath("$.data.items").isArray());
    }

    @Test
    void mapsMissingHardwareToStableErrorCode() throws Exception {
        when(hardwareQueryService.findDetail("missing"))
                .thenThrow(new DomainException(ErrorCode.HARDWARE_NOT_FOUND));

        mockMvc.perform(get("/api/hardware/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("HARDWARE_NOT_FOUND"));
    }

    @Test
    void forwardsMaximumPowerAndPopularitySortToTheCatalogue() throws Exception {
        when(hardwareQueryService.findPage(any(HardwareQuery.class)))
                .thenReturn(new PageView<>(1, 24, 0, 0, List.of()));

        mockMvc.perform(get("/api/hardware")
                        .param("maxPower", "450")
                        .param("sort", "popularity_desc"))
                .andExpect(status().isOk());

        ArgumentCaptor<HardwareQuery> query = ArgumentCaptor.forClass(HardwareQuery.class);
        verify(hardwareQueryService).findPage(query.capture());
        org.assertj.core.api.Assertions.assertThat(query.getValue().getMaxPower()).isEqualTo(450);
        org.assertj.core.api.Assertions.assertThat(query.getValue().getSort())
                .isEqualTo("popularity_desc");
    }

    @Test
    void rejectsNegativeMaximumPower() throws Exception {
        mockMvc.perform(get("/api/hardware").param("maxPower", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }
}
