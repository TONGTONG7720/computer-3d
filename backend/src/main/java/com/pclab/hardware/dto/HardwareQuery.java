package com.pclab.hardware.dto;

import com.pclab.hardware.utils.SearchNormalizer;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import lombok.Data;

@Data
public class HardwareQuery implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Size(max = 80)
    private String keyword;

    @Pattern(regexp = "(?i)CPU|GPU|MOTHERBOARD|RAM|SSD|HDD|COOLING|PSU|CASE")
    private String category;

    @Size(max = 10)
    private List<@Size(max = 80) String> brand = List.of();

    @DecimalMin("0")
    private BigDecimal minPrice;

    @DecimalMin("0")
    private BigDecimal maxPrice;

    @Min(0)
    @Max(100)
    private Integer minPerformance;

    @Min(1)
    private Integer page = 1;

    @Min(1)
    @Max(100)
    private Integer size = 24;

    @Pattern(regexp = "relevance|price_asc|price_desc|performance_desc|newest")
    private String sort = "relevance";

    public String normalizedKeyword() {
        return SearchNormalizer.normalize(keyword);
    }

    public String normalizedCategory() {
        return category == null ? null : category.toUpperCase(Locale.ROOT);
    }

    @AssertTrue(message = "minPrice 不能大于 maxPrice")
    public boolean isPriceRangeValid() {
        return minPrice == null || maxPrice == null || minPrice.compareTo(maxPrice) <= 0;
    }
}
