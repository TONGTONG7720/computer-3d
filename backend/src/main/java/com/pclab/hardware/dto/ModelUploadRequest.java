package com.pclab.hardware.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ModelUploadRequest {

    @NotNull
    private MultipartFile file;

    @NotBlank
    @Size(max = 120)
    private String name;

    @Min(0)
    private Integer lodLevel = 0;

    @NotNull
    private Boolean primary = true;

    @DecimalMin("0.00001")
    @DecimalMax("1000")
    private BigDecimal scaleX = BigDecimal.ONE;

    @DecimalMin("0.00001")
    @DecimalMax("1000")
    private BigDecimal scaleY = BigDecimal.ONE;

    @DecimalMin("0.00001")
    @DecimalMax("1000")
    private BigDecimal scaleZ = BigDecimal.ONE;

    @NotNull
    private BigDecimal positionX = BigDecimal.ZERO;

    @NotNull
    private BigDecimal positionY = BigDecimal.ZERO;

    @NotNull
    private BigDecimal positionZ = BigDecimal.ZERO;

    @NotNull
    private BigDecimal rotationX = BigDecimal.ZERO;

    @NotNull
    private BigDecimal rotationY = BigDecimal.ZERO;

    @NotNull
    private BigDecimal rotationZ = BigDecimal.ZERO;
}
