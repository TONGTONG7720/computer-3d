package com.pclab.hardware.price.service;

import com.pclab.hardware.price.dto.PriceSearchEventRequest;
import com.pclab.hardware.price.entity.PriceSearchEventEntity;
import com.pclab.hardware.price.mapper.PriceSearchEventMapper;
import com.pclab.hardware.utils.SearchNormalizer;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.springframework.stereotype.Service;

@Service
public class PriceEventService {

    private final PriceSearchEventMapper eventMapper;
    private final AnalyticsHasher hasher;

    public PriceEventService(
            PriceSearchEventMapper eventMapper,
            AnalyticsHasher hasher
    ) {
        this.eventMapper = eventMapper;
        this.hasher = hasher;
    }

    public void recordSearch(PriceSearchEventRequest request) {
        PriceSearchEventEntity event = new PriceSearchEventEntity();
        event.setKeyword(request.keyword().trim());
        event.setNormalizedKeyword(SearchNormalizer.normalize(request.keyword()));
        event.setCategoryCode(request.categoryCode());
        event.setResultCount(request.resultCount());
        event.setSessionId(hasher.hash(request.sessionId()));
        event.setSourceSurface(request.sourceSurface());
        event.setSearchedAt(LocalDateTime.now(ZoneOffset.UTC));
        eventMapper.insert(event);
    }
}
