package com.pclab.hardware.intelligence.domain;

import java.util.List;

public sealed interface ComponentSpecification permits
        ComponentSpecification.Cpu,
        ComponentSpecification.Gpu,
        ComponentSpecification.Motherboard,
        ComponentSpecification.Memory,
        ComponentSpecification.Storage,
        ComponentSpecification.Cooling,
        ComponentSpecification.PowerSupply,
        ComponentSpecification.PcCase {

    record Cpu(String socket, int cores, int threads, int tdpWatt)
            implements ComponentSpecification {
    }

    record Gpu(
            int vramGb,
            int lengthMm,
            String interfaceType,
            List<String> resolutionSupport
    ) implements ComponentSpecification {

        public Gpu {
            resolutionSupport = List.copyOf(resolutionSupport);
        }
    }

    record Motherboard(String socket, String ramType, String formFactor, String chipset)
            implements ComponentSpecification {
    }

    record Memory(String generation, int capacityGb, int frequencyMhz)
            implements ComponentSpecification {
    }

    record Storage(int capacityGb, String interfaceType, int readSpeedMbps)
            implements ComponentSpecification {
    }

    record Cooling(int maxTdpWatt, int radiatorSizeMm, List<String> supportedSockets)
            implements ComponentSpecification {

        public Cooling {
            supportedSockets = List.copyOf(supportedSockets);
        }
    }

    record PowerSupply(int wattage, List<String> connectors)
            implements ComponentSpecification {

        public PowerSupply {
            connectors = List.copyOf(connectors);
        }
    }

    record PcCase(
            int gpuMaxLengthMm,
            List<String> motherboardSizes,
            int radiatorMaxSizeMm
    ) implements ComponentSpecification {

        public PcCase {
            motherboardSizes = List.copyOf(motherboardSizes);
        }
    }
}
