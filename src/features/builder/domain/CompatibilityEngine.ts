import type { HardwareId, SelectedComponents } from "./hardware";
import { calculatePowerUsage, calculateRecommendedPsuWattage } from "./PriceCalculator";

export type CompatibilityStatus = "success" | "warning" | "error";
export type CompatibilityRule =
  | "cpu-motherboard"
  | "ram-motherboard"
  | "gpu-case"
  | "cooling-cpu"
  | "motherboard-case"
  | "cooling-case"
  | "psu-power";

export type CompatibilityResult = {
  readonly rule: CompatibilityRule;
  readonly status: CompatibilityStatus;
  readonly message: string;
  readonly components: readonly HardwareId[];
};

export type CompatibilitySummary = {
  readonly status: CompatibilityStatus;
  readonly results: readonly CompatibilityResult[];
};

const missing = (rule: CompatibilityRule, message: string): CompatibilityResult => ({
  rule,
  status: "warning",
  message,
  components: [],
});

const highestStatus = (results: readonly CompatibilityResult[]): CompatibilityStatus => {
  if (results.some((result) => result.status === "error")) {
    return "error";
  }
  if (results.some((result) => result.status === "warning")) {
    return "warning";
  }
  return "success";
};

const checkCpuMotherboard = (selection: SelectedComponents): CompatibilityResult => {
  const { cpu, motherboard } = selection;
  if (cpu === null || motherboard === null) {
    return missing("cpu-motherboard", "选择 CPU 与主板后检测插槽");
  }
  const compatible = cpu.socket === motherboard.socket;
  return {
    rule: "cpu-motherboard",
    status: compatible ? "success" : "error",
    message: compatible
      ? `${cpu.socket} 插槽匹配`
      : `${cpu.socket} CPU 不能安装在 ${motherboard.socket} 主板`,
    components: [cpu.id, motherboard.id],
  };
};

const checkRamMotherboard = (selection: SelectedComponents): CompatibilityResult => {
  const { ram, motherboard } = selection;
  if (ram === null || motherboard === null) {
    return missing("ram-motherboard", "选择内存与主板后检测内存代际");
  }
  const compatible = ram.generation === motherboard.ramType;
  return {
    rule: "ram-motherboard",
    status: compatible ? "success" : "error",
    message: compatible
      ? `${ram.generation} 内存代际匹配`
      : `${ram.generation} 内存不能用于 ${motherboard.ramType} 主板`,
    components: [ram.id, motherboard.id],
  };
};

const checkGpuCase = (selection: SelectedComponents): CompatibilityResult => {
  const { gpu, case: pcCase } = selection;
  if (gpu === null || pcCase === null) {
    return missing("gpu-case", "选择显卡与机箱后检测长度");
  }
  const compatible = gpu.length <= pcCase.gpuMaxLength;
  return {
    rule: "gpu-case",
    status: compatible ? "success" : "error",
    message: compatible
      ? `显卡余量 ${pcCase.gpuMaxLength - gpu.length}mm`
      : `GPU 长度超过机箱限制 ${gpu.length - pcCase.gpuMaxLength}mm`,
    components: [gpu.id, pcCase.id],
  };
};

const checkCoolingCpu = (selection: SelectedComponents): CompatibilityResult => {
  const { cooling, cpu } = selection;
  if (cooling === null || cpu === null) {
    return missing("cooling-cpu", "选择散热与 CPU 后检测热设计功耗");
  }
  const compatible = cooling.maxTdp >= cpu.tdp && cooling.supportedSockets.includes(cpu.socket);
  return {
    rule: "cooling-cpu",
    status: compatible ? "success" : "error",
    message: compatible
      ? `散热能力高于 CPU TDP ${cooling.maxTdp - cpu.tdp}W`
      : `散热器无法覆盖 ${cpu.tdp}W TDP 或 ${cpu.socket} 插槽`,
    components: [cooling.id, cpu.id],
  };
};

const checkMotherboardCase = (selection: SelectedComponents): CompatibilityResult => {
  const { motherboard, case: pcCase } = selection;
  if (motherboard === null || pcCase === null) {
    return missing("motherboard-case", "选择主板与机箱后检测板型");
  }
  const compatible = pcCase.motherboardSize.includes(motherboard.formFactor);
  return {
    rule: "motherboard-case",
    status: compatible ? "success" : "error",
    message: compatible ? `${motherboard.formFactor} 主板尺寸匹配` : "主板尺寸超过机箱支持范围",
    components: [motherboard.id, pcCase.id],
  };
};

const checkCoolingCase = (selection: SelectedComponents): CompatibilityResult => {
  const { cooling, case: pcCase } = selection;
  if (cooling === null || pcCase === null) {
    return missing("cooling-case", "选择散热与机箱后检测冷排尺寸");
  }
  const compatible = cooling.radiatorSize === 0 || cooling.radiatorSize <= pcCase.radiatorMaxSize;
  return {
    rule: "cooling-case",
    status: compatible ? "success" : "error",
    message: compatible ? "散热器尺寸匹配" : "冷排尺寸超过机箱支持范围",
    components: [cooling.id, pcCase.id],
  };
};

const checkPsuPower = (selection: SelectedComponents): CompatibilityResult => {
  const { power_supply: psu } = selection;
  if (psu === null) {
    return missing("psu-power", "选择电源后检测功耗余量");
  }
  const usage = calculatePowerUsage(selection);
  const recommended = calculateRecommendedPsuWattage(usage);
  const status: CompatibilityStatus =
    psu.wattage < usage ? "error" : psu.wattage < recommended ? "warning" : "success";
  const message =
    status === "error"
      ? `峰值功耗 ${usage}W 超过电源 ${psu.wattage}W`
      : status === "warning"
        ? `可运行，但建议至少 ${recommended}W 保留 20% 余量`
        : `电源余量 ${psu.wattage - usage}W`;
  return {
    rule: "psu-power",
    status,
    message,
    components: [psu.id],
  };
};

export const evaluateCompatibility = (selection: SelectedComponents): CompatibilitySummary => {
  const results = [
    checkCpuMotherboard(selection),
    checkRamMotherboard(selection),
    checkGpuCase(selection),
    checkCoolingCpu(selection),
    checkMotherboardCase(selection),
    checkCoolingCase(selection),
    checkPsuPower(selection),
  ];
  return {
    status: highestStatus(results),
    results,
  };
};
