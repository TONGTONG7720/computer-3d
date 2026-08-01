package com.pclab.hardware.price.controller;

import static org.mockito.Mockito.when;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pclab.hardware.price.service.ClickRedirectService;
import com.pclab.hardware.price.service.PriceComparisonService;
import com.pclab.hardware.price.service.PriceAlertService;
import com.pclab.hardware.price.service.PriceEventService;
import com.pclab.hardware.price.service.PriceHistoryService;
import com.pclab.hardware.price.vo.PriceComparisonView;
import com.pclab.hardware.price.vo.PriceAlertView;
import com.pclab.hardware.price.vo.PriceComparisonView.OfferView;
import com.pclab.hardware.price.vo.PriceHistoryView;
import com.pclab.hardware.price.vo.PriceHistoryView.DailyPoint;
import com.pclab.hardware.price.vo.PriceHistoryView.HistoryRange;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PriceIntelligenceController.class)
class PriceIntelligenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PriceComparisonService comparisonService;

    @MockitoBean
    private PriceHistoryService historyService;

    @MockitoBean
    private ClickRedirectService redirectService;

    @MockitoBean
    private PriceEventService eventService;

    @MockitoBean
    private PriceAlertService alertService;

    @Test
    void returnsComparisonWithoutRawMarketplaceUrl() throws Exception {
        when(comparisonService.compareHardware("gpu-nvidia-rtx5090"))
                .thenReturn(comparison());

        mockMvc.perform(get("/api/price-intelligence/hardware/gpu-nvidia-rtx5090"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lowestOfferId").value(12))
                .andExpect(jsonPath("$.data.offers[0].redirectPath")
                        .value("/api/price-intelligence/offers/12/go"))
                .andExpect(jsonPath("$.data.offers[0].deliveryScore").value(96.25))
                .andExpect(jsonPath("$.data.offers[0].deliveryNote")
                        .value("  京东物流 · 次日达  "))
                .andExpect(jsonPath("$.data.offers[0].affiliateUrl").doesNotExist())
                .andExpect(jsonPath("$.data.offers[0].productUrl").doesNotExist());
    }

    @Test
    void acceptsTheExactNinetyDayHistoryRange() throws Exception {
        when(historyService.history("gpu", HistoryRange.NINETY_DAYS, null))
                .thenReturn(history(HistoryRange.NINETY_DAYS));

        mockMvc.perform(get("/api/price-intelligence/hardware/gpu/history")
                        .param("range", "90D"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.range").value("90D"));
    }

    @Test
    void stillRejectsUnsupportedHistoryRange() throws Exception {
        mockMvc.perform(get("/api/price-intelligence/hardware/gpu/history")
                        .param("range", "365D"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PRICE_RANGE_INVALID"));
    }

    @Test
    void returnsThePublicHistoryRangeValue() throws Exception {
        when(historyService.history("gpu", HistoryRange.SEVEN_DAYS, null))
                .thenReturn(new PriceHistoryView(
                        "gpu",
                        HistoryRange.SEVEN_DAYS,
                        null,
                        List.of(new DailyPoint(
                                LocalDate.of(2026, 7, 31),
                                new BigDecimal("22299"),
                                3
                        )),
                        List.of(),
                        new BigDecimal("22299"),
                        new BigDecimal("22299"),
                        BigDecimal.ZERO,
                        LocalDateTime.of(2026, 7, 31, 8, 0)
                ));

        mockMvc.perform(get("/api/price-intelligence/hardware/gpu/history")
                        .param("range", "7D"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.range").value("7D"));
    }

    @Test
    void rejectsBuildQuoteAboveEightComponents() throws Exception {
        String body = """
                {"hardwareKeys":["a","b","c","d","e","f","g","h","i"]}
                """;

        mockMvc.perform(post("/api/price-intelligence/build/quote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void createsAndListsAnAlertUsingOnlyTheUuidOwnerHeader() throws Exception {
        String owner = UUID.randomUUID().toString();
        PriceAlertView alert = alert();
        when(alertService.upsert(owner, "gpu-nvidia-rtx5090", new BigDecimal("20000")))
                .thenReturn(alert);
        when(alertService.list(owner)).thenReturn(List.of(alert));

        mockMvc.perform(put("/api/price-intelligence/alerts/gpu-nvidia-rtx5090")
                        .header("X-Price-Alert-Owner", owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetPrice\":20000}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.publicId").value(alert.publicId()))
                .andExpect(jsonPath("$.data.ownerHash").doesNotExist())
                .andExpect(jsonPath("$.data.ownerToken").doesNotExist());

        mockMvc.perform(get("/api/price-intelligence/alerts")
                        .header("X-Price-Alert-Owner", owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].hardwareKey")
                        .value("gpu-nvidia-rtx5090"));
    }

    @Test
    void rejectsAlertOwnerOutsideCanonicalUuidSyntax() throws Exception {
        mockMvc.perform(put("/api/price-intelligence/alerts/gpu-nvidia-rtx5090")
                        .header("X-Price-Alert-Owner", "not-a-uuid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetPrice\":20000}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void doesNotAcceptAnAlertOwnerFromTheUrl() throws Exception {
        mockMvc.perform(put("/api/price-intelligence/alerts/gpu-nvidia-rtx5090")
                        .param("owner", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetPrice\":20000}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cancelsAnAlertWithTheOwnerHeader() throws Exception {
        String owner = UUID.randomUUID().toString();
        String publicId = UUID.randomUUID().toString();

        mockMvc.perform(delete("/api/price-intelligence/alerts/{publicId}", publicId)
                        .header("X-Price-Alert-Owner", owner))
                .andExpect(status().isOk());

        org.mockito.Mockito.verify(alertService).cancel(owner, publicId);
    }

    @Test
    void allowsTheAlertOwnerHeaderInCorsPreflight() throws Exception {
        mockMvc.perform(options("/api/price-intelligence/alerts/gpu-nvidia-rtx5090")
                        .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PUT")
                        .header(
                                HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS,
                                "X-Price-Alert-Owner"
                        ))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                        containsString("X-Price-Alert-Owner")
                ));
    }

    private static PriceComparisonView comparison() {
        OfferView offer = new OfferView(
                12L,
                "JD",
                "京东",
                "京东自营",
                "SELF_OPERATED",
                new BigDecimal("9299"),
                new BigDecimal("200"),
                BigDecimal.ZERO,
                new BigDecimal("9099"),
                new BigDecimal("4.9"),
                3200,
                new BigDecimal("98"),
                new BigDecimal("96.25"),
                "  京东物流 · 次日达  ",
                new BigDecimal("94.7"),
                new BigDecimal("0.99"),
                false,
                List.of("自营"),
                "/api/price-intelligence/offers/12/go",
                "MANUAL"
        );
        return new PriceComparisonView(
                "gpu-nvidia-rtx5090",
                "RTX 5090",
                new BigDecimal("13999"),
                new BigDecimal("9099"),
                12L,
                12L,
                "综合最低价",
                new PriceComparisonView.PriceRange(
                        new BigDecimal("9099"),
                        new BigDecimal("9099")
                ),
                List.of(offer),
                "MANUAL",
                "人工维护",
                LocalDateTime.of(2026, 7, 31, 8, 0)
        );
    }

    private static PriceHistoryView history(HistoryRange range) {
        return new PriceHistoryView(
                "gpu",
                range,
                null,
                List.of(),
                List.of(),
                null,
                null,
                BigDecimal.ZERO,
                LocalDateTime.of(2026, 7, 31, 8, 0)
        );
    }

    private static PriceAlertView alert() {
        return new PriceAlertView(
                UUID.randomUUID().toString(),
                "gpu-nvidia-rtx5090",
                "NVIDIA GeForce RTX 5090",
                new BigDecimal("20000"),
                new BigDecimal("25000"),
                "ACTIVE",
                null,
                LocalDateTime.of(2026, 8, 2, 8, 0),
                LocalDateTime.of(2026, 8, 2, 8, 0)
        );
    }
}
