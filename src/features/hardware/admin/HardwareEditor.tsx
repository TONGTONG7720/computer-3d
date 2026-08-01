"use client";

import { AlertTriangle, Check, LoaderCircle, Save } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import {
  createAdminHardware,
  updateAdminHardware,
  updateAdminPerformance,
} from "./AdminHardwareApiClient";
import {
  type AdminHardwareCategory,
  type AdminHardwareDetail,
  adminHardwareCategories,
  type HardwareMutationInput,
} from "./adminHardware";
import styles from "./HardwareAdmin.module.css";

const defaultSpecifications: Readonly<Record<AdminHardwareCategory, Record<string, unknown>>> = {
  CPU: {
    socket: "LGA1700",
    cores: 8,
    threads: 16,
    baseClockGhz: 3.4,
    boostClockGhz: 5.2,
    tdp: 125,
    generation: "",
  },
  GPU: {
    chipset: "",
    vram: 16,
    vramType: "GDDR7",
    length: 300,
    tdp: 320,
    interfaceType: "PCIe 5.0",
    resolutionSupport: ["4K"],
  },
  MOTHERBOARD: {
    socket: "LGA1700",
    ramType: "DDR5",
    formFactor: "ATX",
    memorySlots: 4,
    maxMemoryGb: 192,
    pcieVersion: "5.0",
    chipset: "",
  },
  RAM: { capacity: 32, generation: "DDR5", frequency: 6000, moduleCount: 2, latency: "CL30" },
  SSD: {
    storageType: "NVME",
    capacityGb: 1024,
    interfaceType: "PCIe 4.0",
    readSpeed: 7000,
    writeSpeed: 6000,
  },
  COOLING: {
    coolingType: "AIO",
    maxTdp: 250,
    radiatorSize: 360,
    supportedSockets: ["LGA1700", "AM5"],
  },
  PSU: {
    wattage: 850,
    certification: "Gold",
    modularType: "FULL",
    connectors: ["ATX_24PIN", "12V_2X6"],
  },
  CASE: {
    gpuMaxLength: 400,
    motherboardSize: ["ATX", "Micro-ATX"],
    radiatorMaxSize: 360,
    coolerMaxHeight: 170,
  },
};

type EditorForm = {
  hardwareKey: string;
  name: string;
  brand: string;
  category: AdminHardwareCategory;
  description: string;
  price: string;
  performance: string;
  power: string;
  modelUrl: string;
  modelVariant: string;
  coverUrl: string;
  sortOrder: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  specification: string;
  gaming: string;
  creator: string;
  ai: string;
  performanceSource: string;
};

const blankForm = (): EditorForm => ({
  hardwareKey: "",
  name: "",
  brand: "",
  category: "CPU",
  description: "",
  price: "0",
  performance: "50",
  power: "0",
  modelUrl: "",
  modelVariant: "",
  coverUrl: "",
  sortOrder: "100",
  status: "DRAFT",
  specification: JSON.stringify(defaultSpecifications.CPU, null, 2),
  gaming: "50",
  creator: "50",
  ai: "50",
  performanceSource: "PC LAB operator review",
});

const detailToForm = (detail: AdminHardwareDetail): EditorForm => ({
  hardwareKey: detail.hardwareKey,
  name: detail.name,
  brand: detail.brand,
  category: detail.category as AdminHardwareCategory,
  description: detail.description,
  price: String(detail.price),
  performance: String(detail.performance),
  power: String(detail.power),
  modelUrl: detail.modelUrl,
  modelVariant: detail.modelVariant,
  coverUrl: detail.coverUrl,
  sortOrder: String(detail.sortOrder),
  status: detail.status,
  specification: JSON.stringify(detail.specification, null, 2),
  gaming: String(detail.performanceProfile?.gaming ?? detail.performance),
  creator: String(detail.performanceProfile?.creator ?? detail.performance),
  ai: String(detail.performanceProfile?.ai ?? detail.performance),
  performanceSource: detail.performanceProfile?.source ?? "PC LAB operator review",
});

type HardwareEditorProps = {
  readonly adminKey: string;
  readonly detail: AdminHardwareDetail | null;
  readonly creating: boolean;
  readonly onSaved: (hardwareId: number) => Promise<void> | void;
};

export function HardwareEditor({ adminKey, creating, detail, onSaved }: HardwareEditorProps) {
  const [form, setForm] = useState<EditorForm>(blankForm);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm(detail === null ? blankForm() : detailToForm(detail));
    setStatus("idle");
    setMessage("");
  }, [detail]);

  const set = (key: keyof EditorForm, value: string): void =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      const specification = JSON.parse(form.specification) as Record<string, unknown>;
      const input: HardwareMutationInput = {
        hardwareKey: form.hardwareKey.trim(),
        name: form.name.trim(),
        brand: form.brand.trim(),
        category: form.category,
        description: form.description.trim(),
        price: Number(form.price),
        performance: Number(form.performance),
        power: Number(form.power),
        modelUrl: form.modelUrl.trim(),
        modelVariant: form.modelVariant.trim(),
        coverUrl: form.coverUrl.trim(),
        sortOrder: Number(form.sortOrder),
        status: form.status,
        ...(detail === null ? {} : { version: detail.version }),
        specification,
      };
      const saved =
        detail === null
          ? await createAdminHardware(adminKey, input)
          : await updateAdminHardware(adminKey, detail.id, input);
      await updateAdminPerformance(adminKey, saved.id, {
        gaming: Number(form.gaming),
        creator: Number(form.creator),
        ai: Number(form.ai),
        source: form.performanceSource.trim(),
        version: detail?.performanceProfile?.version ?? 0,
      });
      setStatus("saved");
      setMessage("硬件、规格与性能档案已写入数据中心。");
      await onSaved(saved.id);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof SyntaxError
          ? "规格 JSON 格式不正确，已保留当前输入。"
          : "保存失败；若记录已被其他管理员修改，请重新加载后合并变更。",
      );
    }
  };

  return (
    <form className={styles["editor"]} onSubmit={(event) => void save(event)}>
      <div className={styles["editorHeader"]}>
        <span>
          <small>{creating ? "NEW HARDWARE" : `RECORD #${detail?.id ?? "—"}`}</small>
          <h2>{creating ? "创建硬件记录" : "编辑硬件记录"}</h2>
        </span>
        <span data-status={status}>
          {status === "saving" ? (
            <LoaderCircle className={styles["spin"]} size={13} />
          ) : status === "error" ? (
            <AlertTriangle size={13} />
          ) : (
            <Check size={13} />
          )}
          {status === "saving"
            ? "保存中"
            : status === "saved"
              ? "已保存"
              : status === "error"
                ? "需处理"
                : "未修改"}
        </span>
      </div>

      <fieldset className={styles["formGrid"]}>
        <legend>基础身份</legend>
        <label>
          <span>Hardware Key</span>
          <input
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
            value={form.hardwareKey}
            onChange={(event) => set("hardwareKey", event.target.value)}
          />
        </label>
        <label>
          <span>名称</span>
          <input required value={form.name} onChange={(event) => set("name", event.target.value)} />
        </label>
        <label>
          <span>品牌</span>
          <input
            required
            value={form.brand}
            onChange={(event) => set("brand", event.target.value)}
          />
        </label>
        <label>
          <span>分类</span>
          <select
            value={form.category}
            onChange={(event) => {
              const category = event.target.value as AdminHardwareCategory;
              setForm((current) => ({
                ...current,
                category,
                specification: JSON.stringify(defaultSpecifications[category], null, 2),
              }));
            }}
          >
            {adminHardwareCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          <span>发布状态</span>
          <select value={form.status} onChange={(event) => set("status", event.target.value)}>
            <option>DRAFT</option>
            <option>ACTIVE</option>
            <option>ARCHIVED</option>
          </select>
        </label>
        <label>
          <span>排序权重</span>
          <input
            min={0}
            required
            type="number"
            value={form.sortOrder}
            onChange={(event) => set("sortOrder", event.target.value)}
          />
        </label>
        <label className={styles["wideField"]}>
          <span>说明</span>
          <textarea
            maxLength={1000}
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
          />
        </label>
      </fieldset>

      <fieldset className={styles["formGrid"]}>
        <legend>参考数据</legend>
        <label>
          <span>内部参考价 / ¥</span>
          <input
            min={0}
            required
            step="0.01"
            type="number"
            value={form.price}
            onChange={(event) => set("price", event.target.value)}
          />
        </label>
        <label>
          <span>基础性能 / 100</span>
          <input
            max={100}
            min={0}
            required
            type="number"
            value={form.performance}
            onChange={(event) => set("performance", event.target.value)}
          />
        </label>
        <label>
          <span>功耗 / W</span>
          <input
            min={0}
            required
            type="number"
            value={form.power}
            onChange={(event) => set("power", event.target.value)}
          />
        </label>
        <label>
          <span>游戏分</span>
          <input
            max={100}
            min={0}
            required
            type="number"
            value={form.gaming}
            onChange={(event) => set("gaming", event.target.value)}
          />
        </label>
        <label>
          <span>创作分</span>
          <input
            max={100}
            min={0}
            required
            type="number"
            value={form.creator}
            onChange={(event) => set("creator", event.target.value)}
          />
        </label>
        <label>
          <span>AI 分</span>
          <input
            max={100}
            min={0}
            required
            type="number"
            value={form.ai}
            onChange={(event) => set("ai", event.target.value)}
          />
        </label>
        <label className={styles["wideField"]}>
          <span>性能数据来源</span>
          <input
            required
            value={form.performanceSource}
            onChange={(event) => set("performanceSource", event.target.value)}
          />
        </label>
      </fieldset>

      <fieldset className={styles["formGrid"]}>
        <legend>3D 绑定</legend>
        <label className={styles["wideField"]}>
          <span>Model URL</span>
          <input value={form.modelUrl} onChange={(event) => set("modelUrl", event.target.value)} />
        </label>
        <label>
          <span>Model Variant</span>
          <input
            value={form.modelVariant}
            onChange={(event) => set("modelVariant", event.target.value)}
          />
        </label>
        <label>
          <span>Cover URL</span>
          <input value={form.coverUrl} onChange={(event) => set("coverUrl", event.target.value)} />
        </label>
      </fieldset>

      <fieldset className={styles["specField"]}>
        <legend>分类规格 JSON</legend>
        <textarea
          aria-label="分类规格 JSON"
          spellCheck={false}
          value={form.specification}
          onChange={(event) => set("specification", event.target.value)}
        />
        <small>字段由分类规格 DTO 校验；保存失败时输入不会丢失。</small>
      </fieldset>

      {message ? (
        <p className={styles["formMessage"]} data-status={status}>
          {message}
        </p>
      ) : null}
      <button className={styles["primaryButton"]} disabled={status === "saving"} type="submit">
        <Save size={15} />
        {creating ? "创建并保存" : "保存硬件记录"}
      </button>
    </form>
  );
}
