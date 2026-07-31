package com.pclab.hardware.price.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("price_click_event")
public class PriceClickEventEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long offerId;
    private Long hardwareId;
    private String platform;
    private String sessionId;
    private String buildPublicId;
    private String sourceSurface;
    private String redirectHost;
    private String ipHash;
    private String userAgentHash;
    private LocalDateTime clickedAt;
}
