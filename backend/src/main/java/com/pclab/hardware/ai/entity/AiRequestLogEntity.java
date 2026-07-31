package com.pclab.hardware.ai.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("ai_request_log")
public class AiRequestLogEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String requestId;
    private String sessionId;
    private String route;
    private String purpose;
    private BigDecimal budget;
    private String inputHash;
    private Integer promptVersion;
    private String knowledgeKeysJson;
    private String configPublicId;
    private Integer latencyMs;
    private Integer inputTokens;
    private Integer outputTokens;
    private BigDecimal estimatedCost;
    private String outcome;
    private String failureCode;
    private LocalDateTime createdAt;
}
