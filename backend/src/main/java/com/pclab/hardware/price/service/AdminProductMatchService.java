package com.pclab.hardware.price.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.price.algorithm.ProductMatchingEngine;
import com.pclab.hardware.price.domain.PriceRecordPolicy;
import com.pclab.hardware.price.domain.ProductMatch;
import com.pclab.hardware.price.dto.AdminPriceRequests.ConfirmMatchRequest;
import com.pclab.hardware.price.dto.AdminPriceRequests.MatchPreviewRequest;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.entity.ProductMatchAuditEntity;
import com.pclab.hardware.price.mapper.ProductMapper;
import com.pclab.hardware.price.mapper.ProductMatchAuditMapper;
import com.pclab.hardware.price.vo.AdminPriceViews.MatchPreviewView;
import com.pclab.hardware.price.vo.AdminPriceViews.ProductAdminView;
import com.pclab.hardware.service.HardwareQueryService;
import com.pclab.hardware.vo.HardwareView;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminProductMatchService {

    private static final BigDecimal REVIEW_THRESHOLD = new BigDecimal("0.65");

    private final ProductMapper productMapper;
    private final ProductMatchAuditMapper auditMapper;
    private final HardwareQueryService hardwareService;
    private final ProductMatchingEngine matchingEngine;
    private final AdminProductViewAssembler viewAssembler;
    private final ObjectMapper objectMapper;

    public AdminProductMatchService(
            ProductMapper productMapper,
            ProductMatchAuditMapper auditMapper,
            HardwareQueryService hardwareService,
            ProductMatchingEngine matchingEngine,
            AdminProductViewAssembler viewAssembler,
            ObjectMapper objectMapper
    ) {
        this.productMapper = productMapper;
        this.auditMapper = auditMapper;
        this.hardwareService = hardwareService;
        this.matchingEngine = matchingEngine;
        this.viewAssembler = viewAssembler;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public MatchPreviewView previewMatch(MatchPreviewRequest request) {
        HardwareView hardware = hardwareService.findDetail(request.hardwareId().toString());
        ProductMatch match = matchingEngine.match(
                request.title() + " " + request.brand() + " " + request.model(),
                hardware
        );
        return toPreview(hardware, match);
    }

    @Transactional
    @PriceCacheEviction
    public ProductAdminView confirmMatch(Long productId, ConfirmMatchRequest request) {
        ProductEntity product = requireProduct(productId);
        PriceRecordPolicy.requireWritable(product.getRecordSource());
        if (request.version() == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "确认匹配必须提交 version");
        }
        HardwareView hardware = hardwareService.findDetail(request.hardwareId().toString());
        ProductMatch match = matchingEngine.match(product.getTitle(), hardware);
        product.setHardwareId(request.hardwareId());
        product.setMatchConfidence(match.confidence());
        product.setMatchStatus("CONFIRMED");
        product.setVersion(request.version());
        product.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        if (productMapper.updateById(product) == 0) {
            throw new DomainException(ErrorCode.CONFLICT);
        }
        insertAudit(product, match, "ADMIN_CONFIRMED", request.reviewedBy());
        return viewAssembler.toView(product);
    }

    ProductMatch applyRequestedMatch(ProductEntity product, Long hardwareId) {
        if (hardwareId == null) {
            product.setHardwareId(null);
            product.setMatchConfidence(BigDecimal.ZERO);
            product.setMatchStatus("UNMATCHED");
            return null;
        }
        HardwareView hardware = hardwareService.findDetail(hardwareId.toString());
        ProductMatch match = matchingEngine.match(product.getTitle(), hardware);
        product.setHardwareId(hardwareId);
        product.setMatchConfidence(match.confidence());
        product.setMatchStatus(match.decision().name());
        if (match.confidence().compareTo(REVIEW_THRESHOLD) < 0) {
            product.setStatus("DRAFT");
        }
        return match;
    }

    void recordPreview(ProductEntity product, ProductMatch match) {
        insertAudit(product, match, "SYSTEM_PREVIEW", null);
    }

    private void insertAudit(
            ProductEntity product,
            ProductMatch match,
            String decision,
            String reviewedBy
    ) {
        ProductMatchAuditEntity audit = new ProductMatchAuditEntity();
        audit.setProductId(product.getId());
        audit.setHardwareId(product.getHardwareId());
        audit.setConfidence(match.confidence());
        audit.setDecision(decision);
        try {
            audit.setDimensionScoresJson(objectMapper.writeValueAsString(match.dimensionScores()));
        } catch (JsonProcessingException exception) {
            throw new DomainException(ErrorCode.INTERNAL_ERROR);
        }
        audit.setExplanation(String.join("；", match.explanations()));
        audit.setReviewedBy(reviewedBy == null ? "" : reviewedBy);
        audit.setReviewedAt(reviewedBy == null ? null : LocalDateTime.now(ZoneOffset.UTC));
        audit.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        auditMapper.insert(audit);
    }

    private ProductEntity requireProduct(Long productId) {
        ProductEntity product = productMapper.selectById(productId);
        if (product == null) {
            throw new DomainException(ErrorCode.PRICE_PRODUCT_NOT_FOUND);
        }
        return product;
    }

    private static MatchPreviewView toPreview(HardwareView hardware, ProductMatch match) {
        return new MatchPreviewView(
                hardware.databaseId(),
                hardware.id(),
                hardware.name(),
                match.confidence(),
                match.decision(),
                match.dimensionScores(),
                match.explanations()
        );
    }

}
