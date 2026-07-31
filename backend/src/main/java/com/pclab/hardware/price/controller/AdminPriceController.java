package com.pclab.hardware.price.controller;

import com.pclab.hardware.price.dto.AdminPriceRequests.ConfirmMatchRequest;
import com.pclab.hardware.price.dto.AdminPriceRequests.MatchPreviewRequest;
import com.pclab.hardware.price.dto.AdminPriceRequests.ProductListQuery;
import com.pclab.hardware.price.dto.AdminPriceRequests.UpsertOfferRequest;
import com.pclab.hardware.price.dto.AdminPriceRequests.UpsertProductRequest;
import com.pclab.hardware.price.service.AdminOfferService;
import com.pclab.hardware.price.service.AdminPriceDashboardService;
import com.pclab.hardware.price.service.AdminPriceService;
import com.pclab.hardware.price.service.AdminProductMatchService;
import com.pclab.hardware.price.vo.AdminPriceViews.AdminDashboardView;
import com.pclab.hardware.price.vo.AdminPriceViews.MatchPreviewView;
import com.pclab.hardware.price.vo.AdminPriceViews.OfferAdminView;
import com.pclab.hardware.price.vo.AdminPriceViews.ProductAdminView;
import com.pclab.hardware.vo.ApiResponse;
import com.pclab.hardware.vo.PageView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/admin")
public class AdminPriceController {

    private final AdminPriceService productService;
    private final AdminProductMatchService matchService;
    private final AdminPriceDashboardService dashboardService;
    private final AdminOfferService offerService;

    public AdminPriceController(
            AdminPriceService productService,
            AdminProductMatchService matchService,
            AdminPriceDashboardService dashboardService,
            AdminOfferService offerService
    ) {
        this.productService = productService;
        this.matchService = matchService;
        this.dashboardService = dashboardService;
        this.offerService = offerService;
    }

    @GetMapping("/products")
    ApiResponse<PageView<ProductAdminView>> listProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false)
            @Pattern(regexp = "JD|TAOBAO|PDD|TMALL|AMAZON|SUNING") String platform,
            @RequestParam(required = false)
            @Pattern(regexp = "ACTIVE|DRAFT|DISABLED") String status,
            @RequestParam(required = false)
            @Pattern(regexp = "CPU|GPU|MOTHERBOARD|RAM|SSD|HDD|COOLING|PSU|CASE") String category,
            @RequestParam(required = false)
            @Pattern(regexp = "UNMATCHED|CONFIRMED|REVIEW_REQUIRED|REJECTED") String matchStatus,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size
    ) {
        return ApiResponse.success(productService.list(
                new ProductListQuery(keyword, platform, status, category, matchStatus, page, size)
        ));
    }

    @PostMapping("/products")
    ApiResponse<ProductAdminView> createProduct(
            @Valid @RequestBody UpsertProductRequest request
    ) {
        return ApiResponse.success(productService.createProduct(request));
    }

    @PutMapping("/products/{productId}")
    ApiResponse<ProductAdminView> updateProduct(
            @PathVariable Long productId,
            @Valid @RequestBody UpsertProductRequest request
    ) {
        return ApiResponse.success(productService.updateProduct(productId, request));
    }

    @DeleteMapping("/products/{productId}")
    ApiResponse<Void> deleteProduct(@PathVariable Long productId) {
        productService.deleteProduct(productId);
        return ApiResponse.success(null);
    }

    @PostMapping("/products/match-preview")
    ApiResponse<MatchPreviewView> previewMatch(
            @Valid @RequestBody MatchPreviewRequest request
    ) {
        return ApiResponse.success(matchService.previewMatch(request));
    }

    @PostMapping("/products/{productId}/match")
    ApiResponse<ProductAdminView> confirmMatch(
            @PathVariable Long productId,
            @Valid @RequestBody ConfirmMatchRequest request
    ) {
        return ApiResponse.success(matchService.confirmMatch(productId, request));
    }

    @PostMapping("/products/{productId}/offers")
    ApiResponse<OfferAdminView> createOffer(
            @PathVariable Long productId,
            @Valid @RequestBody UpsertOfferRequest request
    ) {
        return ApiResponse.success(offerService.createOffer(productId, request));
    }

    @PutMapping("/offers/{offerId}")
    ApiResponse<OfferAdminView> updateOffer(
            @PathVariable Long offerId,
            @Valid @RequestBody UpsertOfferRequest request
    ) {
        return ApiResponse.success(offerService.updateOffer(offerId, request));
    }

    @DeleteMapping("/offers/{offerId}")
    ApiResponse<Void> disableOffer(@PathVariable Long offerId) {
        offerService.disableOffer(offerId);
        return ApiResponse.success(null);
    }

    @GetMapping("/price-dashboard")
    ApiResponse<AdminDashboardView> dashboard() {
        return ApiResponse.success(dashboardService.dashboard());
    }
}
