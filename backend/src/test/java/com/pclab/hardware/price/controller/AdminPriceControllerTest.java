package com.pclab.hardware.price.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.domain.ProductMatch.MatchDecision;
import com.pclab.hardware.price.dto.AdminPriceRequests;
import com.pclab.hardware.price.service.AdminOfferService;
import com.pclab.hardware.price.service.AdminPriceService;
import com.pclab.hardware.price.vo.AdminPriceViews.MatchPreviewView;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
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
        when(adminPriceService.previewMatch(any(AdminPriceRequests.MatchPreviewRequest.class)))
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
