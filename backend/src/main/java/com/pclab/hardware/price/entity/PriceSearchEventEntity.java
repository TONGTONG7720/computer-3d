package com.pclab.hardware.price.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("price_search_event")
public class PriceSearchEventEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String eventId;
    private String keyword;
    private String normalizedKeyword;
    private String categoryCode;
    private Integer resultCount;
    private String sessionHash;
    private String sourceSurface;
    private LocalDateTime searchedAt;
}
