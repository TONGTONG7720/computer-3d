package com.pclab.hardware.price.mapper;

import lombok.Data;

@Data
public class TopHardwareClickRow {

    private String hardwareKey;
    private String hardwareName;
    private Long clickCount;
}
