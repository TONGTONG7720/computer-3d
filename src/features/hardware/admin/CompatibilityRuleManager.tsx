"use client";

import { AlertTriangle, Check, GitCompareArrows, Plus, Save } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { createCompatibilityRule, updateCompatibilityRule } from "./AdminHardwareApiClient";
import {
  type CompatibilityRule,
  type CompatibilityRuleMutationInput,
  compatibilityRuleTypes,
} from "./adminHardware";
import styles from "./HardwareAdmin.module.css";

const ruleCategories = [
  "CPU",
  "GPU",
  "MOTHERBOARD",
  "RAM",
  "STORAGE",
  "COOLING",
  "PSU",
  "POWER_SUPPLY",
  "CASE",
  "BUILD",
] as const;

type RuleForm = {
  code: string;
  sourceCategory: string;
  targetCategory: string;
  type: CompatibilityRule["type"];
  severity: CompatibilityRule["severity"];
  message: string;
  reserveWatt: string;
  headroomRatio: string;
  roundingWatt: string;
  priority: string;
  enabled: boolean;
  version: number;
};

const blankRule = (): RuleForm => ({
  code: "",
  sourceCategory: "CPU",
  targetCategory: "MOTHERBOARD",
  type: "SOCKET_MATCH",
  severity: "ERROR",
  message: "",
  reserveWatt: "75",
  headroomRatio: "1.2",
  roundingWatt: "50",
  priority: "100",
  enabled: true,
  version: 1,
});

const toForm = (rule: CompatibilityRule): RuleForm => ({
  code: rule.code,
  sourceCategory: rule.sourceCategory,
  targetCategory: rule.targetCategory,
  type: rule.type,
  severity: rule.severity,
  message: rule.message,
  reserveWatt: String(rule.config.reserveWatt),
  headroomRatio: String(rule.config.headroomRatio),
  roundingWatt: String(rule.config.roundingWatt),
  priority: String(rule.priority),
  enabled: rule.enabled,
  version: rule.version,
});

type CompatibilityRuleManagerProps = {
  readonly adminKey: string;
  readonly rules: readonly CompatibilityRule[];
  readonly onChanged: () => Promise<void> | void;
};

export function CompatibilityRuleManager({
  adminKey,
  onChanged,
  rules,
}: CompatibilityRuleManagerProps) {
  const [selectedId, setSelectedId] = useState<number | null>(rules[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const selected = rules.find((rule) => rule.id === selectedId) ?? null;
  const [form, setForm] = useState<RuleForm>(() => (selected ? toForm(selected) : blankRule()));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!creating) setForm(selected ? toForm(selected) : blankRule());
  }, [creating, selected]);

  const set = <Key extends keyof RuleForm>(key: Key, value: RuleForm[Key]): void =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    const input: CompatibilityRuleMutationInput = {
      code: form.code.trim().toUpperCase(),
      sourceCategory: form.sourceCategory,
      targetCategory: form.targetCategory,
      type: form.type,
      severity: form.severity,
      message: form.message.trim(),
      config: {
        reserveWatt: Number(form.reserveWatt),
        headroomRatio: Number(form.headroomRatio),
        roundingWatt: Number(form.roundingWatt),
      },
      priority: Number(form.priority),
      enabled: form.enabled,
      version: form.version,
    };
    try {
      const saved = creating
        ? await createCompatibilityRule(adminKey, input)
        : selected === null
          ? null
          : await updateCompatibilityRule(adminKey, selected.id, input);
      setStatus("saved");
      setMessage("规则已保存并清除兼容性缓存。");
      setCreating(false);
      if (saved !== null) setSelectedId(saved.id);
      await onChanged();
    } catch {
      setStatus("error");
      setMessage("规则保存失败；可能存在代码重复或版本冲突，输入已保留。");
    }
  };

  return (
    <div className={styles["ruleWorkspace"]}>
      <section className={styles["ruleRegistry"]}>
        <div className={styles["sectionHeader"]}>
          <span>
            <small>COMPATIBILITY REGISTRY</small>
            <h2>规则优先级</h2>
          </span>
          <button
            onClick={() => {
              setCreating(true);
              setSelectedId(null);
              setForm(blankRule());
            }}
            type="button"
          >
            <Plus size={14} />
            新建
          </button>
        </div>
        <div className={styles["ruleList"]}>
          {rules.map((rule) => (
            <button
              aria-pressed={!creating && selectedId === rule.id}
              key={rule.id}
              onClick={() => {
                setCreating(false);
                setSelectedId(rule.id);
              }}
              type="button"
            >
              <GitCompareArrows size={15} />
              <span className={styles["ruleCopy"]}>
                <strong>{rule.code}</strong>
                <small>
                  {rule.sourceCategory} → {rule.targetCategory}
                </small>
              </span>
              <b data-enabled={rule.enabled}>{rule.priority}</b>
            </button>
          ))}
        </div>
      </section>

      <form className={styles["ruleEditor"]} onSubmit={(event) => void save(event)}>
        <div className={styles["sectionHeader"]}>
          <span>
            <small>{creating ? "NEW RULE" : `RULE #${selected?.id ?? "—"}`}</small>
            <h2>{creating ? "创建兼容规则" : (selected?.code ?? "选择规则")}</h2>
          </span>
          <b data-status={form.enabled ? "READY" : "PROCESSING"}>
            {form.enabled ? "ENABLED" : "DISABLED"}
          </b>
        </div>
        <div className={styles["formGrid"]}>
          <label className={styles["wideField"]}>
            <span>规则代码</span>
            <input
              pattern="[A-Z][A-Z0-9_]{2,63}"
              required
              value={form.code}
              onChange={(event) => set("code", event.target.value.toUpperCase())}
            />
          </label>
          <label>
            <span>来源分类</span>
            <select
              value={form.sourceCategory}
              onChange={(event) => set("sourceCategory", event.target.value)}
            >
              {ruleCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            <span>目标分类</span>
            <select
              value={form.targetCategory}
              onChange={(event) => set("targetCategory", event.target.value)}
            >
              {ruleCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            <span>规则类型</span>
            <select
              value={form.type}
              onChange={(event) => set("type", event.target.value as CompatibilityRule["type"])}
            >
              {compatibilityRuleTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span>严重等级</span>
            <select
              value={form.severity}
              onChange={(event) =>
                set("severity", event.target.value as CompatibilityRule["severity"])
              }
            >
              <option>ERROR</option>
              <option>WARNING</option>
            </select>
          </label>
          <label>
            <span>优先级</span>
            <input
              min="0"
              required
              type="number"
              value={form.priority}
              onChange={(event) => set("priority", event.target.value)}
            />
          </label>
          <label>
            <span>启用</span>
            <select
              value={String(form.enabled)}
              onChange={(event) => set("enabled", event.target.value === "true")}
            >
              <option value="true">是</option>
              <option value="false">否</option>
            </select>
          </label>
          <label>
            <span>PSU 预留 W</span>
            <input
              min="0"
              type="number"
              value={form.reserveWatt}
              onChange={(event) => set("reserveWatt", event.target.value)}
            />
          </label>
          <label>
            <span>功耗余量倍率</span>
            <input
              min="1"
              step="0.01"
              type="number"
              value={form.headroomRatio}
              onChange={(event) => set("headroomRatio", event.target.value)}
            />
          </label>
          <label>
            <span>电源取整 W</span>
            <input
              min="1"
              type="number"
              value={form.roundingWatt}
              onChange={(event) => set("roundingWatt", event.target.value)}
            />
          </label>
          <label className={styles["wideField"]}>
            <span>用户提示</span>
            <textarea
              required
              value={form.message}
              onChange={(event) => set("message", event.target.value)}
            />
          </label>
        </div>
        {message ? (
          <p className={styles["formMessage"]} data-status={status}>
            {status === "error" ? <AlertTriangle size={13} /> : <Check size={13} />}
            {message}
          </p>
        ) : null}
        <button
          className={styles["primaryButton"]}
          disabled={status === "saving" || (!creating && selected === null)}
          type="submit"
        >
          <Save size={15} />
          保存兼容规则
        </button>
      </form>
    </div>
  );
}
