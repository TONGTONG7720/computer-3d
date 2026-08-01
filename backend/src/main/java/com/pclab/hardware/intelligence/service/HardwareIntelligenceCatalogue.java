package com.pclab.hardware.intelligence.service;

import com.pclab.hardware.dto.HardwareQuery;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.intelligence.domain.BuildSelection;
import com.pclab.hardware.intelligence.domain.HardwareFacts;
import com.pclab.hardware.intelligence.domain.IntelligenceCategory;
import com.pclab.hardware.intelligence.dto.BuildComponentIds;
import com.pclab.hardware.service.HardwareQueryService;
import com.pclab.hardware.vo.HardwareView;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class HardwareIntelligenceCatalogue {

    private final HardwareQueryService hardwareQueryService;
    private final HardwareFactsAssembler factsAssembler;

    public HardwareIntelligenceCatalogue(
            HardwareQueryService hardwareQueryService,
            HardwareFactsAssembler factsAssembler
    ) {
        this.hardwareQueryService = hardwareQueryService;
        this.factsAssembler = factsAssembler;
    }

    public BuildSelection resolve(BuildComponentIds ids) {
        return resolve(ids.asIntelligenceMap());
    }

    public BuildSelection resolve(Map<IntelligenceCategory, String> ids) {
        EnumMap<IntelligenceCategory, HardwareFacts> selection =
                new EnumMap<>(IntelligenceCategory.class);
        ids.forEach((category, id) -> {
            HardwareFacts facts = factsAssembler.from(hardwareQueryService.findDetail(id));
            if (facts.category() != category) {
                throw new DomainException(
                        ErrorCode.VALIDATION_FAILED,
                        id + " 不属于 " + category.builderCategory() + " 分类"
                );
            }
            selection.put(category, facts);
        });
        return BuildSelection.of(selection);
    }

    public Map<IntelligenceCategory, List<HardwareFacts>> all() {
        EnumMap<IntelligenceCategory, List<HardwareFacts>> catalogue =
                new EnumMap<>(IntelligenceCategory.class);
        for (IntelligenceCategory category : IntelligenceCategory.values()) {
            catalogue.put(category, available(category));
        }
        return Map.copyOf(catalogue);
    }

    public List<HardwareFacts> available(IntelligenceCategory category) {
        List<HardwareView> views = new ArrayList<>();
        for (String queryCategory : queryCategories(category)) {
            HardwareQuery query = new HardwareQuery();
            query.setCategory(queryCategory);
            query.setPage(1);
            query.setSize(100);
            query.setSort("performance_desc");
            views.addAll(hardwareQueryService.findPage(query).items());
        }
        return views.stream().map(factsAssembler::from).toList();
    }

    private static List<String> queryCategories(IntelligenceCategory category) {
        return switch (category) {
            case CPU -> List.of("CPU");
            case GPU -> List.of("GPU");
            case MOTHERBOARD -> List.of("MOTHERBOARD");
            case RAM -> List.of("RAM");
            case STORAGE -> List.of("SSD", "HDD");
            case COOLING -> List.of("COOLING");
            case POWER_SUPPLY -> List.of("PSU");
            case CASE -> List.of("CASE");
        };
    }
}
