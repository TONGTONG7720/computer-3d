package com.pclab.hardware.price.domain;

import java.util.Locale;

public enum PlatformCode {
    INTERNAL("PC LAB"),
    JD("京东"),
    TAOBAO("淘宝"),
    PDD("拼多多"),
    TMALL("天猫"),
    AMAZON("Amazon"),
    SUNING("苏宁");

    private final String label;

    PlatformCode(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    public static PlatformCode from(String value) {
        return PlatformCode.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
