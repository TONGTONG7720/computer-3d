package com.pclab.hardware.price.vo;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BuildQuoteView(
        List<ComponentQuote> components,
        BigDecimal internalTotal,
        BigDecimal lowestTotal,
        BigDecimal recommendedTotal,
        BigDecimal savings,
        int pricedComponentCount,
        int componentCount,
        boolean complete,
        String disclosure,
        LocalDateTime updatedAt
) implements Serializable {

    public BuildQuoteView {
        components = List.copyOf(components);
    }

    public record ComponentQuote(
            String hardwareKey,
            String hardwareName,
            BigDecimal internalReferencePrice,
            BigDecimal lowestPrice,
            BigDecimal recommendedPrice,
            Long recommendedOfferId
    ) implements Serializable {
    }
}
