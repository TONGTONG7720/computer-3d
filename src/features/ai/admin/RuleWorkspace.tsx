"use client";

import { Braces, Network, Save } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./AiAdmin.module.css";
import { saveRule } from "./api/AdminAiApiClient";
import type { AiRule } from "./domain/adminAi";

type RuleWorkspaceProps = {
  readonly adminKey: string;
  readonly onChanged: (rule: AiRule) => void;
  readonly rules: readonly AiRule[];
};

const stringify = (value: Readonly<Record<string, unknown>>): string =>
  JSON.stringify(value, null, 2);

export function RuleWorkspace({ adminKey, onChanged, rules }: RuleWorkspaceProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = useMemo(
    () => rules.find((rule) => rule.ruleKey === selectedKey) ?? rules[0] ?? null,
    [rules, selectedKey],
  );
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(100);
  const [condition, setCondition] = useState("{}");
  const [action, setAction] = useState("{}");
  const [explanation, setExplanation] = useState("");
  const [status, setStatus] = useState<AiRule["status"]>("DRAFT");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (selected) {
      setName(selected.name);
      setPriority(selected.priority);
      setCondition(stringify(selected.condition));
      setAction(stringify(selected.action));
      setExplanation(selected.explanation);
      setStatus(selected.status);
    }
  }, [selected]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || saving) {
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const parsedCondition: unknown = JSON.parse(condition);
      const parsedAction: unknown = JSON.parse(action);
      if (!isObject(parsedCondition) || !isObject(parsedAction)) {
        throw new Error("Condition 与 Action 必须是 JSON Object");
      }
      const next = await saveRule(adminKey, selected, {
        name: name.trim(),
        priority,
        condition: parsedCondition,
        action: parsedAction,
        explanation: explanation.trim(),
        status,
      });
      onChanged(next);
      setMessage(`规则 R${next.version} 已保存`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "规则保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles["workbench"]}>
      <aside className={styles["registry"]}>
        <header>
          <Network size={16} />
          <div>
            <strong>Rule Matrix</strong>
            <span>优先级 / 条件 / 动作</span>
          </div>
        </header>
        <div>
          {rules.map((rule) => (
            <button
              data-selected={selected?.ruleKey === rule.ruleKey}
              key={rule.ruleKey}
              onClick={() => setSelectedKey(rule.ruleKey)}
              type="button"
            >
              <span>P{rule.priority}</span>
              <strong>{rule.name}</strong>
              <small data-status={rule.status}>{rule.status}</small>
            </button>
          ))}
        </div>
      </aside>

      <form className={styles["editor"]} onSubmit={save}>
        <header className={styles["editorHeader"]}>
          <div>
            <Braces size={16} />
            <span>
              <small>DETERMINISTIC RULE</small>
              <strong>{selected?.ruleKey ?? "NO RULE"}</strong>
            </span>
          </div>
          {selected ? <em>R{selected.version}</em> : null}
        </header>
        {selected ? (
          <div className={`${styles["editorBody"]} ${styles["ruleFields"]}`}>
            <label>
              <span>规则名称</span>
              <input
                maxLength={160}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
            <label>
              <span>优先级</span>
              <input
                max={10000}
                min={0}
                onChange={(event) => setPriority(event.target.valueAsNumber)}
                required
                type="number"
                value={priority}
              />
            </label>
            <label>
              <span>状态</span>
              <select
                onChange={(event) => setStatus(event.target.value as AiRule["status"])}
                value={status}
              >
                <option>ACTIVE</option>
                <option>DRAFT</option>
                <option>DISABLED</option>
              </select>
            </label>
            <label className={styles["wideField"]}>
              <span>解释文案</span>
              <input
                maxLength={1000}
                onChange={(event) => setExplanation(event.target.value)}
                required
                value={explanation}
              />
            </label>
            <label className={styles["codeField"]}>
              <span>Condition JSON</span>
              <textarea
                onChange={(event) => setCondition(event.target.value)}
                rows={10}
                value={condition}
              />
            </label>
            <label className={styles["codeField"]}>
              <span>Action JSON</span>
              <textarea
                onChange={(event) => setAction(event.target.value)}
                rows={10}
                value={action}
              />
            </label>
          </div>
        ) : (
          <div className={styles["emptyWorkspace"]}>没有可维护的推荐规则。</div>
        )}
        <footer className={styles["editorFooter"]}>
          <span aria-live="polite">{message}</span>
          <button disabled={!selected || saving} type="submit">
            <Save size={14} />
            保存规则
          </button>
        </footer>
      </form>
    </section>
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
