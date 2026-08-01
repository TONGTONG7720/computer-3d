package com.pclab.hardware.intelligence.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("compatibility_rule")
public class CompatibilityRuleEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String code;
    private String sourceCategory;
    private String targetCategory;
    private String ruleType;
    private String severity;
    private String messageTemplate;
    private String configJson;
    private Integer priority;
    private Boolean enabled;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
