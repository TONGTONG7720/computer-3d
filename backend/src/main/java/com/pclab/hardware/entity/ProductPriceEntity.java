package com.pclab.hardware.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("product_price")
public class ProductPriceEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long productId;
    private String platform;
    private String seller;
    private String shopType;
    private BigDecimal salePrice;
    private BigDecimal couponAmount;
    private BigDecimal fullReductionAmount;
    private BigDecimal memberDiscountAmount;
    private BigDecimal platformSubsidyAmount;
    private BigDecimal shippingFee;
    private BigDecimal finalPrice;
    private Integer salesCount;
    private BigDecimal rating;
    private BigDecimal sellerScore;
    private String currency;
    private String stockStatus;
    private String promotionJson;
    private String productUrl;
    private String affiliateUrl;
    private String recordSource;
    private Integer isEnabled;
    private Integer isReviewed;
    private LocalDateTime checkedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
