package com.pclab.hardware.ai.service;

import com.pclab.hardware.dto.HardwareQuery;
import com.pclab.hardware.service.HardwareQueryService;
import com.pclab.hardware.vo.HardwareView;
import com.pclab.hardware.vo.PageView;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AiCatalogueService {

    private static final int PAGE_SIZE = 100;

    private final HardwareQueryService hardwareQueryService;

    public AiCatalogueService(HardwareQueryService hardwareQueryService) {
        this.hardwareQueryService = hardwareQueryService;
    }

    public List<HardwareView> activeCatalogue() {
        List<HardwareView> result = new ArrayList<>();
        int page = 1;
        long totalPages;
        do {
            HardwareQuery query = new HardwareQuery();
            query.setPage(page);
            query.setSize(PAGE_SIZE);
            query.setSort("relevance");
            PageView<HardwareView> current = hardwareQueryService.findPage(query);
            result.addAll(current.items());
            totalPages = current.totalPages();
            page++;
        } while (page <= totalPages);
        return List.copyOf(result);
    }
}
