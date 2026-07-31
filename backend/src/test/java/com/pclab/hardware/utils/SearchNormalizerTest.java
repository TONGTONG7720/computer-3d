package com.pclab.hardware.utils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.lang.reflect.Method;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class SearchNormalizerTest {

    @ParameterizedTest
    @CsvSource({
        "' RTX 5090 ',rtx5090",
        "'Intel Core i9-14900K',intelcorei914900k",
        "'主板 Z790 LAB',主板z790lab"
    })
    void createsStableSearchKey(String input, String expected) throws ReflectiveOperationException {
        Class<?> normalizerType;
        try {
            normalizerType = Class.forName("com.pclab.hardware.utils.SearchNormalizer");
        } catch (ClassNotFoundException exception) {
            fail("SearchNormalizer is not implemented", exception);
            return;
        }

        Method normalize = normalizerType.getMethod("normalize", String.class);

        assertThat(normalize.invoke(null, input)).isEqualTo(expected);
    }
}
