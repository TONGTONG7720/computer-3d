package com.pclab.hardware.utils;

import java.text.Normalizer;
import java.util.Locale;

public final class SearchNormalizer {

    private SearchNormalizer() {
    }

    public static String normalize(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        return Normalizer.normalize(input, Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N}]+", "");
    }
}
