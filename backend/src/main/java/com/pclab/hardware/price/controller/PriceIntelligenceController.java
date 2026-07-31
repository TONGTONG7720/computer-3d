package com.pclab.hardware.price.controller;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.domain.PlatformCode;
import com.pclab.hardware.price.dto.BuildQuoteRequest;
import com.pclab.hardware.price.dto.PriceSearchEventRequest;
import com.pclab.hardware.price.service.ClickRedirectService;
import com.pclab.hardware.price.service.ClickRedirectService.ClickContext;
import com.pclab.hardware.price.service.PriceComparisonService;
import com.pclab.hardware.price.service.PriceEventService;
import com.pclab.hardware.price.service.PriceHistoryService;
import com.pclab.hardware.price.vo.BuildQuoteView;
import com.pclab.hardware.price.vo.PriceComparisonView;
import com.pclab.hardware.price.vo.PriceHistoryView;
import com.pclab.hardware.price.vo.PriceHistoryView.HistoryRange;
import com.pclab.hardware.vo.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.Locale;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/price-intelligence")
public class PriceIntelligenceController {

    private final PriceComparisonService comparisonService;
    private final PriceHistoryService historyService;
    private final ClickRedirectService redirectService;
    private final PriceEventService eventService;

    public PriceIntelligenceController(
            PriceComparisonService comparisonService,
            PriceHistoryService historyService,
            ClickRedirectService redirectService,
            PriceEventService eventService
    ) {
        this.comparisonService = comparisonService;
        this.historyService = historyService;
        this.redirectService = redirectService;
        this.eventService = eventService;
    }

    @GetMapping("/hardware/{idOrKey}")
    ApiResponse<PriceComparisonView> compare(@PathVariable String idOrKey) {
        return ApiResponse.success(comparisonService.compareHardware(idOrKey));
    }

    @GetMapping("/hardware/{idOrKey}/history")
    ApiResponse<PriceHistoryView> history(
            @PathVariable String idOrKey,
            @RequestParam(defaultValue = "30D") String range,
            @RequestParam(required = false) String platform
    ) {
        HistoryRange parsedRange;
        try {
            parsedRange = HistoryRange.from(range);
        } catch (IllegalArgumentException exception) {
            throw new DomainException(ErrorCode.PRICE_RANGE_INVALID);
        }
        PlatformCode parsedPlatform;
        try {
            parsedPlatform = platform == null
                    ? null
                    : PlatformCode.from(platform.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "不支持的价格平台");
        }
        return ApiResponse.success(
                historyService.history(idOrKey, parsedRange, parsedPlatform)
        );
    }

    @PostMapping("/build/quote")
    ApiResponse<BuildQuoteView> quote(@Valid @RequestBody BuildQuoteRequest request) {
        return ApiResponse.success(comparisonService.quote(request.hardwareKeys()));
    }

    @PostMapping("/search-events")
    ApiResponse<Void> searchEvent(@Valid @RequestBody PriceSearchEventRequest request) {
        eventService.recordSearch(request);
        return ApiResponse.success(null);
    }

    @GetMapping("/offers/{offerId}/go")
    ResponseEntity<Void> go(
            @PathVariable Long offerId,
            @RequestHeader(value = "X-Session-Id", defaultValue = "")
            @Size(max = 80) String sessionId,
            @RequestParam(required = false)
            @Pattern(regexp = "[0-9a-fA-F-]{36}") String buildId,
            @RequestParam(defaultValue = "BUILDER")
            @Pattern(regexp = "BUILDER|DETAIL|ADMIN_PREVIEW") String source,
            HttpServletRequest request
    ) {
        URI target = redirectService.redirect(
                offerId,
                new ClickContext(
                        sessionId,
                        buildId,
                        source,
                        request.getRemoteAddr(),
                        request.getHeader(HttpHeaders.USER_AGENT)
                )
        );
        return ResponseEntity.status(HttpStatus.FOUND).location(target).build();
    }
}
