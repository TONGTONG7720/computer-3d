package com.pclab.hardware.price.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.pclab.hardware.price.config.PriceProperties;
import com.pclab.hardware.price.dto.PriceSearchEventRequest;
import com.pclab.hardware.price.entity.PriceSearchEventEntity;
import com.pclab.hardware.price.mapper.PriceSearchEventMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class PriceEventServiceTest {

    @Test
    void recordsSearchSessionOnlyInTheSaltedSessionHashField() {
        PriceSearchEventMapper eventMapper = mock(PriceSearchEventMapper.class);
        PriceProperties properties = new PriceProperties();
        properties.setAnalyticsHashKey("test-hash-key");
        AnalyticsHasher hasher = new AnalyticsHasher(properties);
        PriceEventService service = new PriceEventService(eventMapper, hasher);

        service.recordSearch(new PriceSearchEventRequest(
                "RTX 5090", "GPU", 3, "session-1", "BUILDER"
        ));

        ArgumentCaptor<PriceSearchEventEntity> event = ArgumentCaptor.forClass(PriceSearchEventEntity.class);
        verify(eventMapper).insert(event.capture());
        assertThat(event.getValue())
                .hasFieldOrPropertyWithValue("sessionHash", hasher.hash("session-1"));
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
}
