package com.pclab.hardware.price.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class PlatformAdapterRegistryTest {

    @Test
    void exposesOnlyEnabledAdapters() {
        PlatformAdapter enabled = new StubAdapter("manual", true);
        PlatformAdapter disabled = new StubAdapter("jd-live", false);

        PlatformAdapterRegistry registry = new PlatformAdapterRegistry(List.of(enabled, disabled));

        assertThat(registry.enabledAdapters()).extracting(PlatformAdapter::adapterCode)
                .containsExactly("manual");
    }

    @Test
    void keepsAllianceAdaptersDisabledWithoutCredentialsAndFailsClosed() {
        List<PlatformAdapter> adapters = List.of(
                new JdAllianceAdapter(false, "", ""),
                new TaobaoAllianceAdapter(false, "", ""),
                new PddOpenPlatformAdapter(false, "", "")
        );

        assertThat(adapters).allMatch(adapter -> !adapter.isEnabled());
        assertThatThrownBy(() -> adapters.getFirst().getPrice(new PlatformAdapter.PlatformProductRef(1L, 1L)))
                .isInstanceOfSatisfying(DomainException.class, exception ->
                        assertThat(exception.errorCode()).isEqualTo(ErrorCode.PRICE_ADAPTER_UNAVAILABLE)
                );
    }

    private record StubAdapter(String adapterCode, boolean isEnabled) implements PlatformAdapter {

        @Override
        public Set<com.pclab.hardware.price.domain.PlatformCode> supportedPlatforms() {
            return Set.of();
        }

        @Override
        public List<PlatformProductCandidate> searchProduct(PlatformSearchRequest request) {
            return List.of();
        }

        @Override
        public PlatformPriceSnapshot getPrice(PlatformProductRef reference) {
            throw new UnsupportedOperationException();
        }

        @Override
        public PlatformProductDetail getDetail(PlatformProductRef reference) {
            throw new UnsupportedOperationException();
        }

        @Override
        public String getSeller(PlatformProductRef reference) {
            return "stub";
        }

        @Override
        public String getLink(PlatformProductRef reference) {
            return "https://example.invalid/stub";
        }
    }
}
