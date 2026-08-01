package com.pclab.hardware.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pclab.hardware.dto.SpecificationPayloads;
import com.pclab.hardware.entity.CaseSpecEntity;
import com.pclab.hardware.entity.CoolingSpecEntity;
import com.pclab.hardware.entity.CpuSpecEntity;
import com.pclab.hardware.entity.GpuSpecEntity;
import com.pclab.hardware.entity.MemorySpecEntity;
import com.pclab.hardware.entity.MotherboardSpecEntity;
import com.pclab.hardware.entity.PsuSpecEntity;
import com.pclab.hardware.entity.StorageSpecEntity;
import com.pclab.hardware.exception.DomainException;
import com.pclab.hardware.exception.ErrorCode;
import com.pclab.hardware.mapper.CaseSpecMapper;
import com.pclab.hardware.mapper.CoolingSpecMapper;
import com.pclab.hardware.mapper.CpuSpecMapper;
import com.pclab.hardware.mapper.GpuSpecMapper;
import com.pclab.hardware.mapper.MemorySpecMapper;
import com.pclab.hardware.mapper.MotherboardSpecMapper;
import com.pclab.hardware.mapper.PsuSpecMapper;
import com.pclab.hardware.mapper.StorageSpecMapper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class HardwareSpecificationService {

    private final CpuSpecMapper cpuMapper;
    private final GpuSpecMapper gpuMapper;
    private final MotherboardSpecMapper motherboardMapper;
    private final MemorySpecMapper memoryMapper;
    private final StorageSpecMapper storageMapper;
    private final CoolingSpecMapper coolingMapper;
    private final PsuSpecMapper psuMapper;
    private final CaseSpecMapper caseMapper;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    public HardwareSpecificationService(
            CpuSpecMapper cpuMapper,
            GpuSpecMapper gpuMapper,
            MotherboardSpecMapper motherboardMapper,
            MemorySpecMapper memoryMapper,
            StorageSpecMapper storageMapper,
            CoolingSpecMapper coolingMapper,
            PsuSpecMapper psuMapper,
            CaseSpecMapper caseMapper,
            ObjectMapper objectMapper,
            Validator validator
    ) {
        this.cpuMapper = cpuMapper;
        this.gpuMapper = gpuMapper;
        this.motherboardMapper = motherboardMapper;
        this.memoryMapper = memoryMapper;
        this.storageMapper = storageMapper;
        this.coolingMapper = coolingMapper;
        this.psuMapper = psuMapper;
        this.caseMapper = caseMapper;
        this.objectMapper = objectMapper;
        this.validator = validator;
    }

    public void replace(
            String previousCategory,
            String category,
            Long hardwareId,
            JsonNode payload
    ) {
        delete(previousCategory, hardwareId);
        insert(category, hardwareId, payload);
    }

    public void insert(String category, Long hardwareId, JsonNode payload) {
        switch (category) {
            case "CPU" -> insertCpu(hardwareId, parse(payload, SpecificationPayloads.Cpu.class));
            case "GPU" -> insertGpu(hardwareId, parse(payload, SpecificationPayloads.Gpu.class));
            case "MOTHERBOARD" ->
                    insertMotherboard(
                            hardwareId,
                            parse(payload, SpecificationPayloads.Motherboard.class)
                    );
            case "RAM" ->
                    insertMemory(hardwareId, parse(payload, SpecificationPayloads.Memory.class));
            case "SSD", "HDD" ->
                    insertStorage(hardwareId, parse(payload, SpecificationPayloads.Storage.class));
            case "COOLING" ->
                    insertCooling(hardwareId, parse(payload, SpecificationPayloads.Cooling.class));
            case "PSU" -> insertPsu(hardwareId, parse(payload, SpecificationPayloads.Psu.class));
            case "CASE" ->
                    insertCase(hardwareId, parse(payload, SpecificationPayloads.PcCase.class));
            default -> {
                // Custom categories can carry base data before a dedicated specification table exists.
            }
        }
    }

    public void delete(String category, Long hardwareId) {
        switch (category) {
            case "CPU" -> cpuMapper.deleteById(hardwareId);
            case "GPU" -> gpuMapper.deleteById(hardwareId);
            case "MOTHERBOARD" -> motherboardMapper.deleteById(hardwareId);
            case "RAM" -> memoryMapper.deleteById(hardwareId);
            case "SSD", "HDD" -> storageMapper.deleteById(hardwareId);
            case "COOLING" -> coolingMapper.deleteById(hardwareId);
            case "PSU" -> psuMapper.deleteById(hardwareId);
            case "CASE" -> caseMapper.deleteById(hardwareId);
            default -> {
                // Custom categories do not own a known specification table.
            }
        }
    }

    public JsonNode read(String category, Long hardwareId) {
        Object payload = switch (category) {
            case "CPU" -> toCpuPayload(cpuMapper.selectById(hardwareId));
            case "GPU" -> toGpuPayload(gpuMapper.selectById(hardwareId));
            case "MOTHERBOARD" -> toMotherboardPayload(motherboardMapper.selectById(hardwareId));
            case "RAM" -> toMemoryPayload(memoryMapper.selectById(hardwareId));
            case "SSD", "HDD" -> toStoragePayload(storageMapper.selectById(hardwareId));
            case "COOLING" -> toCoolingPayload(coolingMapper.selectById(hardwareId));
            case "PSU" -> toPsuPayload(psuMapper.selectById(hardwareId));
            case "CASE" -> toCasePayload(caseMapper.selectById(hardwareId));
            default -> objectMapper.createObjectNode();
        };
        return objectMapper.valueToTree(payload);
    }

    private void insertCpu(Long hardwareId, SpecificationPayloads.Cpu payload) {
        CpuSpecEntity entity = new CpuSpecEntity();
        entity.setHardwareId(hardwareId);
        entity.setSocket(payload.socket());
        entity.setCores(payload.cores());
        entity.setThreads(payload.threads());
        entity.setBaseClockGhz(payload.baseClockGhz());
        entity.setBoostClockGhz(payload.boostClockGhz());
        entity.setTdpWatt(payload.tdp());
        entity.setGeneration(payload.generation());
        cpuMapper.insert(entity);
    }

    private void insertGpu(Long hardwareId, SpecificationPayloads.Gpu payload) {
        GpuSpecEntity entity = new GpuSpecEntity();
        entity.setHardwareId(hardwareId);
        entity.setChipset(payload.chipset());
        entity.setVramGb(payload.vram());
        entity.setVramType(payload.vramType());
        entity.setLengthMm(payload.length());
        entity.setTdpWatt(payload.tdp());
        entity.setInterfaceType(payload.interfaceType());
        entity.setResolutionSupport(writeJson(Objects.requireNonNullElse(payload.resolutionSupport(), List.of())));
        gpuMapper.insert(entity);
    }

    private void insertMotherboard(
            Long hardwareId,
            SpecificationPayloads.Motherboard payload
    ) {
        MotherboardSpecEntity entity = new MotherboardSpecEntity();
        entity.setHardwareId(hardwareId);
        entity.setSocket(payload.socket());
        entity.setRamType(payload.ramType());
        entity.setFormFactor(payload.formFactor());
        entity.setMemorySlots(payload.memorySlots());
        entity.setMaxMemoryGb(payload.maxMemoryGb());
        entity.setPcieVersion(payload.pcieVersion());
        entity.setChipset(payload.chipset());
        motherboardMapper.insert(entity);
    }

    private void insertMemory(Long hardwareId, SpecificationPayloads.Memory payload) {
        MemorySpecEntity entity = new MemorySpecEntity();
        entity.setHardwareId(hardwareId);
        entity.setCapacityGb(payload.capacity());
        entity.setGeneration(payload.generation());
        entity.setFrequencyMhz(payload.frequency());
        entity.setModuleCount(payload.moduleCount());
        entity.setLatency(payload.latency());
        memoryMapper.insert(entity);
    }

    private void insertStorage(Long hardwareId, SpecificationPayloads.Storage payload) {
        StorageSpecEntity entity = new StorageSpecEntity();
        entity.setHardwareId(hardwareId);
        entity.setStorageType(payload.storageType());
        entity.setCapacityGb(payload.capacityGb());
        entity.setInterfaceType(payload.interfaceType());
        entity.setReadSpeedMbps(payload.readSpeed());
        entity.setWriteSpeedMbps(payload.writeSpeed());
        storageMapper.insert(entity);
    }

    private void insertCooling(Long hardwareId, SpecificationPayloads.Cooling payload) {
        CoolingSpecEntity entity = new CoolingSpecEntity();
        entity.setHardwareId(hardwareId);
        entity.setCoolingType(payload.coolingType());
        entity.setMaxTdpWatt(payload.maxTdp());
        entity.setRadiatorSizeMm(payload.radiatorSize());
        entity.setSupportedSockets(writeJson(payload.supportedSockets()));
        coolingMapper.insert(entity);
    }

    private void insertPsu(Long hardwareId, SpecificationPayloads.Psu payload) {
        PsuSpecEntity entity = new PsuSpecEntity();
        entity.setHardwareId(hardwareId);
        entity.setWattage(payload.wattage());
        entity.setCertification(payload.certification());
        entity.setModularType(payload.modularType());
        entity.setConnectors(writeJson(Objects.requireNonNullElse(payload.connectors(), List.of())));
        psuMapper.insert(entity);
    }

    private void insertCase(Long hardwareId, SpecificationPayloads.PcCase payload) {
        CaseSpecEntity entity = new CaseSpecEntity();
        entity.setHardwareId(hardwareId);
        entity.setGpuMaxLengthMm(payload.gpuMaxLength());
        entity.setMotherboardSizes(writeJson(payload.motherboardSize()));
        entity.setRadiatorMaxSizeMm(payload.radiatorMaxSize());
        entity.setCoolerMaxHeightMm(payload.coolerMaxHeight());
        caseMapper.insert(entity);
    }

    private <T> T parse(JsonNode payload, Class<T> type) {
        try {
            T value = objectMapper.treeToValue(payload, type);
            validate(value);
            return value;
        } catch (JsonProcessingException exception) {
            throw new DomainException(
                    ErrorCode.VALIDATION_FAILED,
                    "硬件规格格式不正确"
            );
        }
    }

    private <T> void validate(T value) {
        Set<ConstraintViolation<T>> violations = validator.validate(value);
        violations.stream()
                .findFirst()
                .ifPresent(violation -> {
                    throw new DomainException(
                            ErrorCode.VALIDATION_FAILED,
                            "硬件规格不合法：" + violation.getMessage()
                    );
                });
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Hardware specification could not be serialized", exception);
        }
    }

    private SpecificationPayloads.Cpu toCpuPayload(CpuSpecEntity spec) {
        requireStoredSpec(spec, "CPU");
        return new SpecificationPayloads.Cpu(
                spec.getSocket(),
                spec.getCores(),
                spec.getThreads(),
                spec.getBaseClockGhz(),
                spec.getBoostClockGhz(),
                spec.getTdpWatt(),
                spec.getGeneration()
        );
    }

    private SpecificationPayloads.Gpu toGpuPayload(GpuSpecEntity spec) {
        requireStoredSpec(spec, "GPU");
        return new SpecificationPayloads.Gpu(
                spec.getChipset(),
                spec.getVramGb(),
                spec.getVramType(),
                spec.getLengthMm(),
                spec.getTdpWatt(),
                spec.getInterfaceType(),
                parseOptionalStringList(spec.getResolutionSupport())
        );
    }

    private SpecificationPayloads.Motherboard toMotherboardPayload(MotherboardSpecEntity spec) {
        requireStoredSpec(spec, "MOTHERBOARD");
        return new SpecificationPayloads.Motherboard(
                spec.getSocket(),
                spec.getRamType(),
                spec.getFormFactor(),
                spec.getMemorySlots(),
                spec.getMaxMemoryGb(),
                spec.getPcieVersion(),
                spec.getChipset()
        );
    }

    private static SpecificationPayloads.Memory toMemoryPayload(MemorySpecEntity spec) {
        requireStoredSpec(spec, "RAM");
        return new SpecificationPayloads.Memory(
                spec.getCapacityGb(),
                spec.getGeneration(),
                spec.getFrequencyMhz(),
                spec.getModuleCount(),
                spec.getLatency()
        );
    }

    private static SpecificationPayloads.Storage toStoragePayload(StorageSpecEntity spec) {
        requireStoredSpec(spec, "STORAGE");
        return new SpecificationPayloads.Storage(
                spec.getStorageType(),
                spec.getCapacityGb(),
                spec.getInterfaceType(),
                spec.getReadSpeedMbps(),
                spec.getWriteSpeedMbps()
        );
    }

    private SpecificationPayloads.Cooling toCoolingPayload(CoolingSpecEntity spec) {
        requireStoredSpec(spec, "COOLING");
        return new SpecificationPayloads.Cooling(
                spec.getCoolingType(),
                spec.getMaxTdpWatt(),
                spec.getRadiatorSizeMm(),
                parseStringList(spec.getSupportedSockets())
        );
    }

    private SpecificationPayloads.Psu toPsuPayload(PsuSpecEntity spec) {
        requireStoredSpec(spec, "PSU");
        return new SpecificationPayloads.Psu(
                spec.getWattage(),
                spec.getCertification(),
                spec.getModularType(),
                parseOptionalStringList(spec.getConnectors())
        );
    }

    private SpecificationPayloads.PcCase toCasePayload(CaseSpecEntity spec) {
        requireStoredSpec(spec, "CASE");
        return new SpecificationPayloads.PcCase(
                spec.getGpuMaxLengthMm(),
                parseStringList(spec.getMotherboardSizes()),
                spec.getRadiatorMaxSizeMm(),
                spec.getCoolerMaxHeightMm()
        );
    }

    private List<String> parseStringList(String json) {
        try {
            return List.copyOf(objectMapper.readValue(json, objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, String.class)));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored hardware specification JSON is invalid", exception);
        }
    }

    private List<String> parseOptionalStringList(String json) {
        return json == null || json.isBlank() ? List.of() : parseStringList(json);
    }

    private static void requireStoredSpec(Object spec, String category) {
        if (spec == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, category + " 规格不存在");
        }
    }
}
