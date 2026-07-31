package com.pclab.hardware.price.domain;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;

public final class PriceRecordPolicy {

    private PriceRecordPolicy() {
    }

    public static void requireWritable(String recordSource) {
        if ("INTERNAL".equals(recordSource)) {
            throw new DomainException(ErrorCode.PRICE_RECORD_READ_ONLY);
        }
    }
}
