"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  LoaderCircle,
  PanelLeft,
  PanelRight,
  Save,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { CompatibilityStatus } from "@/features/builder/domain/CompatibilityEngine";
import styles from "./BuilderToolbar.module.css";
import type { BuildSaveState } from "./useBuildDraft";

type BuilderToolbarProps = {
  readonly buildName: string;
  readonly budget: number;
  readonly compatibility: CompatibilityStatus;
  readonly performance: number;
  readonly saveState: BuildSaveState;
  readonly onBuildNameChange: (name: string) => void;
  readonly onBudgetChange: (budget: number) => void;
  readonly onOpenComponents?: (() => void) | undefined;
  readonly onOpenSummary?: (() => void) | undefined;
  readonly onSave: () => void;
};

const saveLabels = {
  clean: "已同步",
  dirty: "未保存",
  saving: "正在保存",
  saved: "已保存",
  error: "保存失败",
} as const satisfies Readonly<Record<BuildSaveState, string>>;

const compatibilityLabels = {
  success: "兼容",
  warning: "需注意",
  error: "有冲突",
} as const satisfies Readonly<Record<CompatibilityStatus, string>>;

export function BuilderToolbar({
  budget,
  buildName,
  compatibility,
  onBudgetChange,
  onBuildNameChange,
  onOpenComponents,
  onOpenSummary,
  onSave,
  performance,
  saveState,
}: BuilderToolbarProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(buildName);
  const [budgetDraft, setBudgetDraft] = useState(String(budget));
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraftName(buildName);
    }
  }, [buildName, editing]);

  useEffect(() => {
    setBudgetDraft(String(budget));
  }, [budget]);

  useEffect(() => {
    if (editing) {
      nameInputRef.current?.focus();
    }
  }, [editing]);

  const commitName = (): void => {
    const nextName = draftName.trim();
    if (nextName.length > 0 && nextName !== buildName) {
      onBuildNameChange(nextName);
    } else {
      setDraftName(buildName);
    }
    setEditing(false);
  };

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") {
      commitName();
    }
    if (event.key === "Escape") {
      setDraftName(buildName);
      setEditing(false);
    }
  };

  const commitBudget = (): void => {
    const nextBudget = Number(budgetDraft);
    if (Number.isFinite(nextBudget) && nextBudget >= 0) {
      if (nextBudget !== budget) {
        onBudgetChange(nextBudget);
      }
      setBudgetDraft(String(nextBudget));
      return;
    }
    setBudgetDraft(String(budget));
  };

  const handleBudgetKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      setBudgetDraft(String(budget));
      event.currentTarget.blur();
    }
  };

  const SaveStateIcon =
    saveState === "saving" ? LoaderCircle : saveState === "error" ? AlertTriangle : Check;

  return (
    <div className={styles["toolbar"]}>
      <Link aria-label="PC LAB Builder 首页" className={styles["brand"]} href="/builder">
        <span aria-hidden="true" className={styles["brandMark"]}>
          <span />
        </span>
        <span className={styles["brandCopy"]}>
          <strong>PC LAB</strong>
          <small>3D BUILDER</small>
        </span>
      </Link>

      <div className={styles["identity"]}>
        {editing ? (
          <input
            aria-label="配置名称"
            className={styles["nameInput"]}
            maxLength={60}
            onBlur={commitName}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={handleNameKeyDown}
            ref={nameInputRef}
            value={draftName}
          />
        ) : (
          <button
            aria-label="重命名配置"
            className={styles["nameButton"]}
            onClick={() => setEditing(true)}
            type="button"
          >
            {buildName}
          </button>
        )}
        <span aria-live="polite" className={styles["saveStatus"]} data-state={saveState}>
          <SaveStateIcon aria-hidden="true" size={13} strokeWidth={1.8} />
          {saveLabels[saveState]}
        </span>
      </div>

      <fieldset className={styles["health"]}>
        <legend className={styles["visuallyHidden"]}>配置健康状态</legend>
        <span className={styles["budgetControl"]} data-numeric="true">
          <label htmlFor="builder-budget">预算 ¥</label>
          <input
            aria-label="预算上限"
            id="builder-budget"
            inputMode="numeric"
            min={0}
            onBlur={commitBudget}
            onChange={(event) => setBudgetDraft(event.target.value)}
            onKeyDown={handleBudgetKeyDown}
            step={100}
            type="number"
            value={budgetDraft}
          />
        </span>
        <span data-numeric="true">性能 {performance}</span>
        <span data-status={compatibility}>
          <CheckCircle2 aria-hidden="true" size={14} strokeWidth={1.8} />
          {compatibilityLabels[compatibility]}
        </span>
      </fieldset>

      {onOpenComponents !== undefined && onOpenSummary !== undefined ? (
        <div className={styles["compactActions"]}>
          <button aria-label="打开组件库" onClick={onOpenComponents} type="button">
            <PanelLeft aria-hidden="true" size={18} strokeWidth={1.6} />
          </button>
          <button aria-label="打开配置分析" onClick={onOpenSummary} type="button">
            <PanelRight aria-hidden="true" size={18} strokeWidth={1.6} />
          </button>
        </div>
      ) : null}

      <div className={styles["actions"]}>
        <button
          aria-label="保存配置"
          className={styles["saveButton"]}
          data-primary={saveState === "dirty" || saveState === "error"}
          disabled={saveState === "saving"}
          onClick={onSave}
          type="button"
        >
          <Save aria-hidden="true" size={17} strokeWidth={1.7} />
          <span>保存</span>
        </button>
        <button
          aria-label="分享配置"
          className={styles["shareButton"]}
          disabled
          title="Build 分享将在后续阶段恢复"
          type="button"
        >
          <Share2 aria-hidden="true" size={17} strokeWidth={1.7} />
          <span>分享</span>
        </button>
      </div>
    </div>
  );
}
