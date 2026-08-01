package com.pclab.hardware.price.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.domain.ProductMatch.MatchDecision;
import com.pclab.hardware.price.dto.AdminPriceRequests;
import com.pclab.hardware.price.service.AdminOfferService;
import com.pclab.hardware.price.service.AdminPriceDashboardService;
import com.pclab.hardware.price.service.AdminPriceService;
import com.pclab.hardware.price.service.AdminProductMatchService;
import com.pclab.hardware.price.vo.AdminPriceViews.AdminDashboardView;
import com.pclab.hardware.price.vo.AdminPriceViews.MatchPreviewView;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = AdminPriceController.class,
        properties = "app.security.admin-key=test-admin-key"
)
class AdminPriceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminPriceService adminPriceService;

    @MockitoBean
    private AdminOfferService adminOfferService;

    @MockitoBean
    private AdminProductMatchService adminProductMatchService;

    @MockitoBean
    private AdminPriceDashboardService adminPriceDashboardService;

    @Test
    void validatesProductTitleBeforeServiceCall() throws Exception {
        mockMvc.perform(post("/api/admin/products")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"","brand":"ASUS","model":"RTX5090","category":"GPU"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void returnsExplainableMatchPreview() throws Exception {
        when(adminProductMatchService.previewMatch(
                any(AdminPriceRequests.MatchPreviewRequest.class)
        ))
                .thenReturn(new MatchPreviewView(
                        7L,
                        "gpu-nvidia-rtx5090",
                        "RTX 5090",
                        new BigDecimal("0.98"),
                        MatchDecision.CONFIRMED,
                        Map.of("model", BigDecimal.ONE),
                        List.of("型号一致")
                ));

        mockMvc.perform(post("/api/admin/products/match-preview")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"华硕 RTX5090 32G",
                                  "brand":"ASUS",
                                  "model":"RTX5090",
                                  "category":"GPU",
                                  "hardwareId":7
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.confidence").value(0.98))
                .andExpect(jsonPath("$.data.dimensionScores.model").value(1));
    }

    @Test
    void mapsInvalidPromotionToStableErrorCode() throws Exception {
        when(adminOfferService.createOffer(
                eq(7L),
                any(AdminPriceRequests.UpsertOfferRequest.class)
        )).thenThrow(new DomainException(ErrorCode.PRICE_PROMOTION_INVALID));

        mockMvc.perform(post("/api/admin/products/7/offers")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validOfferJson()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PRICE_PROMOTION_INVALID"));
    }

    @Test
    void rejectsOfferWhenDeliveryScoreIsMissing() throws Exception {
        mockMvc.perform(post("/api/admin/products/7/offers")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validOfferJson().replace("\"deliveryScore\":92,", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void rejectsOfferWhenDeliveryScoreIsOutsideTrustedRange() throws Exception {
        mockMvc.perform(post("/api/admin/products/7/offers")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validOfferJson().replace(
                                "\"deliveryScore\":92",
                                "\"deliveryScore\":100.01"
                        )))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void rejectsOfferWhenDeliveryNoteExceeds160Characters() throws Exception {
        mockMvc.perform(post("/api/admin/products/7/offers")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validOfferJson().replace(
                                "京东物流 · 次日达",
                                "物".repeat(161)
                        )))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void returnsAlertCoverageInTheAdminDashboard() throws Exception {
        when(adminPriceDashboardService.dashboard()).thenReturn(new AdminDashboardView(
                3,
                7,
                1,
                2,
                14,
                5,
                2,
                List.of(),
                "MANUAL",
                LocalDateTime.parse("2026-08-02T08:30:00")
        ));

        mockMvc.perform(get("/api/admin/price-dashboard")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activeAlertCount").value(5))
                .andExpect(jsonPath("$.data.triggeredAlertCount").value(2));
    }

    @Test
    void forwardsCategoryAndMatchStatusFilters() throws Exception {
        mockMvc.perform(get("/api/admin/products")
                        .header("X-Admin-Key", "test-admin-key")
                        .param("category", "GPU")
                        .param("matchStatus", "CONFIRMED")
                        .param("page", "2"))
                .andExpect(status().isOk());

        ArgumentCaptor<AdminPriceRequests.ProductListQuery> queryCaptor =
                ArgumentCaptor.forClass(AdminPriceRequests.ProductListQuery.class);
        verify(adminPriceService).list(queryCaptor.capture());
        AdminPriceRequests.ProductListQuery query = queryCaptor.getValue();
        org.assertj.core.api.Assertions.assertThat(
                query.category()
        ).isEqualTo("GPU");
        org.assertj.core.api.Assertions.assertThat(
                query.matchStatus()
        ).isEqualTo("CONFIRMED");
    }

    private static String validOfferJson() {
        return """
                {
                  "platform":"JD",
                  "seller":"京东自营",
                  "shopType":"SELF_OPERATED",
                  "salePrice":9299,
                  "couponAmount":100,
                  "fullReductionAmount":0,
                  "memberDiscountAmount":0,
                  "platformSubsidyAmount":0,
                  "shippingFee":0,
                  "salesCount":3200,
                  "rating":4.9,
                  "sellerScore":98,
                  "deliveryScore":92,
                  "deliveryNote":"京东物流 · 次日达",
                  "currency":"CNY",
                  "stockStatus":"IN_STOCK",
                  "productUrl":"https://item.jd.com/100.html",
                  "affiliateUrl":"",
                  "enabled":true,
                  "reviewed":true,
                  "version":1
                }
                """;
    }
}
