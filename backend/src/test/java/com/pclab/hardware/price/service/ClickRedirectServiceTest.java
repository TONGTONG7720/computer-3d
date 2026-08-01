package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pclab.hardware.entity.ProductPriceEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.ProductPriceMapper;
import com.pclab.hardware.price.config.PriceProperties;
import com.pclab.hardware.price.entity.PriceClickEventEntity;
import com.pclab.hardware.price.entity.ProductEntity;
import com.pclab.hardware.price.mapper.PriceClickEventMapper;
import com.pclab.hardware.price.mapper.ProductMapper;
import com.pclab.hardware.price.service.ClickRedirectService.ClickContext;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ClickRedirectServiceTest {

    @Test
    void recordsClickAndReturnsReviewedHttpsTarget() {
        Fixture fixture = fixture("https://item.jd.com/100.html", true, "IN_STOCK");

        URI result = fixture.service().redirect(
                7L,
                new ClickContext("session-1", null, "BUILDER", "127.0.0.1", "test-agent")
        );

        assertThat(result).isEqualTo(URI.create("https://item.jd.com/100.html"));
        verify(fixture.eventMapper()).insert(any(PriceClickEventEntity.class));
    }

    @Test
    void recordsSessionOnlyInTheSaltedSessionHashField() {
        Fixture fixture = fixture("https://item.jd.com/100.html", true, "IN_STOCK");

        fixture.service().redirect(
                7L,
                new ClickContext("session-1", null, "BUILDER", "127.0.0.1", "test-agent")
        );

        ArgumentCaptor<PriceClickEventEntity> event = ArgumentCaptor.forClass(PriceClickEventEntity.class);
        verify(fixture.eventMapper()).insert(event.capture());
        assertThat(event.getValue())
                .hasFieldOrPropertyWithValue("sessionHash", fixture.hasher().hash("session-1"));
        assertThat(event.getValue().getClass().getDeclaredFields())
                .extracting(java.lang.reflect.Field::getName)
                .contains("eventId")
                .doesNotContain("sessionId");
        Object eventId = new org.springframework.beans.BeanWrapperImpl(event.getValue())
                .getPropertyValue("eventId");
        assertThat(eventId).isInstanceOf(String.class)
                .asString()
                .matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
    }

    @Test
    void blocksUnknownMarketplaceHostWithoutWritingEvent() {
        Fixture fixture = fixture("https://evil.example/item", true, "IN_STOCK");

        assertThatThrownBy(() -> fixture.service().redirect(7L, ClickContext.anonymous()))
                .isInstanceOf(DomainException.class)
                .extracting(error -> ((DomainException) error).errorCode())
                .isEqualTo(ErrorCode.PRICE_REDIRECT_BLOCKED);
        verify(fixture.eventMapper(), never()).insert(any(PriceClickEventEntity.class));
    }

    @Test
    void blocksDisabledOrOutOfStockOffer() {
        Fixture fixture = fixture("https://item.jd.com/100.html", false, "OUT_OF_STOCK");

        assertThatThrownBy(() -> fixture.service().redirect(7L, ClickContext.anonymous()))
                .isInstanceOf(DomainException.class)
                .extracting(error -> ((DomainException) error).errorCode())
                .isEqualTo(ErrorCode.PRICE_REDIRECT_BLOCKED);
    }

    private static Fixture fixture(String url, boolean enabled, String stockStatus) {
        ProductPriceMapper priceMapper = mock(ProductPriceMapper.class);
        ProductMapper productMapper = mock(ProductMapper.class);
        PriceClickEventMapper eventMapper = mock(PriceClickEventMapper.class);
        ProductPriceEntity offer = new ProductPriceEntity();
        offer.setId(7L);
        offer.setProductId(8L);
        offer.setPlatform("JD");
        offer.setProductUrl(url);
        offer.setAffiliateUrl("");
        offer.setIsEnabled(enabled ? 1 : 0);
        offer.setIsReviewed(1);
        offer.setStockStatus(stockStatus);
        when(priceMapper.selectById(7L)).thenReturn(offer);
        ProductEntity product = new ProductEntity();
        product.setId(8L);
        product.setHardwareId(9L);
        when(productMapper.selectById(8L)).thenReturn(product);
        PriceProperties properties = new PriceProperties();
        properties.setAnalyticsHashKey("test-hash-key");
        properties.setRedirectHosts(Map.of("JD", List.of("jd.com")));
        AnalyticsHasher hasher = new AnalyticsHasher(properties);
        ClickRedirectService service = new ClickRedirectService(
                priceMapper,
                productMapper,
                eventMapper,
                hasher,
                new PriceLinkPolicy(properties)
        );
        return new Fixture(service, eventMapper, hasher);
    }

    private record Fixture(
            ClickRedirectService service,
            PriceClickEventMapper eventMapper,
            AnalyticsHasher hasher
    ) {
    }
}
