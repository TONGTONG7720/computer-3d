package com.pclab.hardware.ai.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("ai_recommendation_rule")
public class AiRecommendationRuleEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String ruleKey;
    private String name;
    private Integer priority;
    private String conditionJson;
    private String actionJson;
    private String explanation;

    @Version
    private Integer version;

    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
