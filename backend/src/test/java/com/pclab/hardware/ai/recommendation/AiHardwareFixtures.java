package com.pclab.hardware.ai.recommendation;

import com.pclab.hardware.vo.HardwareView;
import java.math.BigDecimal;
import java.util.List;

final class AiHardwareFixtures {

    private AiHardwareFixtures() {
    }

    static List<HardwareView> catalogue() {
        return List.of(
                cpu("cpu-amd-7800x3d", "AMD Ryzen 7 7800X3D", "AM5", 2200, 90, 120),
                cpu("cpu-intel-i9-14900k", "Intel Core i9-14900K", "LGA1700", 4000, 96, 253),
                gpu("gpu-nvidia-rtx5070", "NVIDIA GeForce RTX 5070", 2800, 70, 250, 242),
                gpu("gpu-nvidia-rtx5080", "NVIDIA GeForce RTX 5080", 5000, 88, 360, 304),
                gpu("gpu-nvidia-rtx5090", "NVIDIA GeForce RTX 5090", 16000, 100, 575, 304),
                motherboard("motherboard-b650-lab", "B650M LAB", "AM5", "Micro-ATX", 700, 72, 45),
                motherboard("motherboard-z790-lab", "Z790 LAB", "LGA1700", "ATX", 2400, 96, 65),
                ram(),
                storage(),
                cooling("cooling-aio-240", "LAB AIO 240", 400, 76, 14, 220, 240),
                cooling("cooling-aio-360", "LAB AIO 360", 900, 96, 22, 320, 360),
                powerSupply("psu-850w-gold", "850W Gold", 450, 71, 850),
                powerSupply("psu-1200w-platinum", "1200W Platinum", 1000, 100, 1200),
                pcCase(
                        "case-compact-lab",
                        "Compact LAB Case",
                        400,
                        66,
                        6,
                        300,
                        List.of("Micro-ATX"),
                        240
                ),
                pcCase(
                        "case-future-glass",
                        "Future Glass Case",
                        1300,
                        94,
                        8,
                        360,
                        List.of("ATX", "Micro-ATX"),
                        360
                )
        );
    }

    static HardwareView require(String id) {
        return catalogue().stream()
                .filter(hardware -> hardware.id().equals(id))
                .findFirst()
                .orElseThrow();
    }

    private static HardwareView cpu(
            String id,
            String name,
            String socket,
            int price,
            int performance,
            int power
    ) {
        return base(id, name, "CPU", "cpu", price, performance, power)
                .socket(socket)
                .cores(socket.equals("AM5") ? 8 : 24)
                .threads(socket.equals("AM5") ? 16 : 32)
                .tdp(power)
                .build();
    }

    private static HardwareView gpu(
            String id,
            String name,
            int price,
            int performance,
            int power,
            int length
    ) {
        return base(id, name, "GPU", "gpu", price, performance, power)
                .vram(id.endsWith("5090") ? 32 : 12)
                .length(length)
                .build();
    }

    private static HardwareView motherboard(
            String id,
            String name,
            String socket,
            String formFactor,
            int price,
            int performance,
            int power
    ) {
        return base(id, name, "MOTHERBOARD", "motherboard", price, performance, power)
                .socket(socket)
                .ramType("DDR5")
                .formFactor(formFactor)
                .build();
    }

    private static HardwareView ram() {
        return base("ram-ddr5-32gb", "Spectral DDR5 32GB", "RAM", "ram", 400, 74, 10)
                .capacity(new BigDecimal("32"))
                .generation("DDR5")
                .frequency(6000)
                .build();
    }

    private static HardwareView storage() {
        return base("storage-nvme-1tb", "Pulse NVMe 1TB", "SSD", "storage", 300, 68, 7)
                .capacity(BigDecimal.ONE)
                .interfaceType("PCIe 4.0")
                .readSpeed(7000)
                .build();
    }

    private static HardwareView cooling(
            String id,
            String name,
            int price,
            int performance,
            int power,
            int maxTdp,
            int radiatorSize
    ) {
        return base(id, name, "COOLING", "cooling", price, performance, power)
                .maxTdp(maxTdp)
                .radiatorSize(radiatorSize)
                .supportedSockets(List.of("LGA1700", "AM5"))
                .build();
    }

    private static HardwareView powerSupply(
            String id,
            String name,
            int price,
            int performance,
            int wattage
    ) {
        return base(id, name, "PSU", "power_supply", price, performance, 0)
                .wattage(wattage)
                .certification(wattage >= 1000 ? "Platinum" : "Gold")
                .build();
    }

    private static HardwareView pcCase(
            String id,
            String name,
            int price,
            int performance,
            int power,
            int gpuMaxLength,
            List<String> motherboardSize,
            int radiatorMaxSize
    ) {
        return base(id, name, "CASE", "case", price, performance, power)
                .gpuMaxLength(gpuMaxLength)
                .motherboardSize(motherboardSize)
                .radiatorMaxSize(radiatorMaxSize)
                .build();
    }

    private static HardwareView.HardwareViewBuilder base(
            String id,
            String name,
            String category,
            String builderCategory,
            int price,
            int performance,
            int power
    ) {
        return HardwareView.builder()
                .id(id)
                .name(name)
                .brand("PC LAB")
                .category(category)
                .builderCategory(builderCategory)
                .price(BigDecimal.valueOf(price))
                .performance(performance)
                .power(power)
                .modelUrl("/models/" + id + ".glb")
                .modelVariant(id);
    }
}
