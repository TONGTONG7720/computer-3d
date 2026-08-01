"use client";

import { Box, Check, FileUp, LoaderCircle, Save, TriangleAlert } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { updateAdminModel, uploadAdminModel } from "./AdminHardwareApiClient";
import type { AdminHardwareDetail, AdminHardwareModel } from "./adminHardware";
import styles from "./HardwareAdmin.module.css";

type HardwareModelManagerProps = {
  readonly adminKey: string;
  readonly detail: AdminHardwareDetail | null;
  readonly onChanged: () => Promise<void> | void;
};

const vectorFields = [
  ["scaleX", "Scale X"],
  ["scaleY", "Scale Y"],
  ["scaleZ", "Scale Z"],
  ["positionX", "Position X"],
  ["positionY", "Position Y"],
  ["positionZ", "Position Z"],
  ["rotationX", "Rotation X"],
  ["rotationY", "Rotation Y"],
  ["rotationZ", "Rotation Z"],
] as const;

export function HardwareModelManager({ adminKey, detail, onChanged }: HardwareModelManagerProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<AdminHardwareModel | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const selected =
      detail?.models.find((model) => model.id === selectedId) ?? detail?.models[0] ?? null;
    setSelectedId(selected?.id ?? null);
    setDraft(selected);
    setStatus("idle");
    setMessage("");
  }, [detail, selectedId]);

  if (detail === null) {
    return (
      <div className={styles["emptyWorkspace"]}>
        <Box size={24} />
        <strong>先从左侧选择一个硬件记录</strong>
        <small>Model Manager 将读取该记录的主模型和全部 LOD。</small>
      </div>
    );
  }

  const upload = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      await uploadAdminModel(adminKey, detail.id, form);
      setStatus("saved");
      setMessage("GLB 已校验并写入模型注册表。");
      event.currentTarget.reset();
      await onChanged();
    } catch {
      setStatus("error");
      setMessage("上传失败，请确认文件为 GLB、LOD 未冲突且大小符合限制。");
    }
  };

  const saveTransform = async (): Promise<void> => {
    if (draft === null) return;
    setStatus("saving");
    setMessage("");
    try {
      await updateAdminModel(adminKey, draft.id, {
        name: draft.name,
        scaleX: draft.scaleX,
        scaleY: draft.scaleY,
        scaleZ: draft.scaleZ,
        positionX: draft.positionX,
        positionY: draft.positionY,
        positionZ: draft.positionZ,
        rotationX: draft.rotationX,
        rotationY: draft.rotationY,
        rotationZ: draft.rotationZ,
        animationConfig: draft.animationConfig,
        lodLevel: draft.lodLevel,
        primary: draft.primary,
        status: draft.status,
      });
      setStatus("saved");
      setMessage("模型变换与运行状态已更新。");
      await onChanged();
    } catch {
      setStatus("error");
      setMessage("模型更新失败，当前表单输入已保留。");
    }
  };

  const setNumber = (key: (typeof vectorFields)[number][0], value: string): void => {
    const number = Number(value);
    if (draft !== null && Number.isFinite(number)) setDraft({ ...draft, [key]: number });
  };

  return (
    <div className={styles["modelWorkspace"]}>
      <section className={styles["modelRegistry"]}>
        <div className={styles["sectionHeader"]}>
          <span>
            <small>MODEL REGISTRY</small>
            <h2>{detail.name}</h2>
          </span>
          <b>{detail.models.length} ASSETS</b>
        </div>
        <div className={styles["modelList"]}>
          {detail.models.length === 0 ? (
            <p>当前没有 GLB 记录，Builder 将使用程序化占位模型。</p>
          ) : (
            detail.models.map((model) => (
              <button
                aria-pressed={selectedId === model.id}
                key={model.id}
                onClick={() => {
                  setSelectedId(model.id);
                  setDraft(model);
                }}
                type="button"
              >
                <Box size={16} />
                <span className={styles["modelCopy"]}>
                  <strong>{model.name}</strong>
                  <small>
                    LOD {model.lodLevel} · {(model.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                  </small>
                </span>
                <b data-status={model.status}>{model.primary ? "PRIMARY" : model.status}</b>
              </button>
            ))
          )}
        </div>
        <form className={styles["uploadForm"]} onSubmit={(event) => void upload(event)}>
          <h3>上传 GLB / LOD</h3>
          <label className={styles["wideField"]}>
            <span>GLB 文件</span>
            <input accept=".glb,model/gltf-binary" name="file" required type="file" />
          </label>
          <label>
            <span>资源名称</span>
            <input name="name" required />
          </label>
          <label>
            <span>LOD Level</span>
            <input defaultValue="0" min="0" name="lodLevel" required type="number" />
          </label>
          <label>
            <span>主模型</span>
            <select defaultValue="true" name="primary">
              <option value="true">是</option>
              <option value="false">否</option>
            </select>
          </label>
          {vectorFields.map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <input
                defaultValue={key.startsWith("scale") ? "1" : "0"}
                name={key}
                required
                step="0.001"
                type="number"
              />
            </label>
          ))}
          <label className={styles["wideField"]}>
            <span>Animation Config</span>
            <textarea defaultValue="{}" name="animationConfig" />
          </label>
          <button
            className={styles["secondaryButton"]}
            disabled={status === "saving"}
            type="submit"
          >
            <FileUp size={15} />
            上传并注册
          </button>
        </form>
      </section>

      <section className={styles["modelEditor"]}>
        <div className={styles["sectionHeader"]}>
          <span>
            <small>TRANSFORM INSPECTOR</small>
            <h2>{draft?.name ?? "未选择模型"}</h2>
          </span>
          {draft ? <b data-status={draft.status}>{draft.status}</b> : null}
        </div>
        {draft ? (
          <>
            <div className={styles["formGrid"]}>
              <label className={styles["wideField"]}>
                <span>名称</span>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </label>
              {vectorFields.map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  <input
                    step="0.001"
                    type="number"
                    value={draft[key]}
                    onChange={(event) => setNumber(key, event.target.value)}
                  />
                </label>
              ))}
              <label>
                <span>LOD Level</span>
                <input
                  min="0"
                  type="number"
                  value={draft.lodLevel}
                  onChange={(event) => setDraft({ ...draft, lodLevel: Number(event.target.value) })}
                />
              </label>
              <label>
                <span>状态</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      status: event.target.value as AdminHardwareModel["status"],
                    })
                  }
                >
                  <option>PROCESSING</option>
                  <option>READY</option>
                  <option>FAILED</option>
                </select>
              </label>
              <label>
                <span>主模型</span>
                <select
                  value={String(draft.primary)}
                  onChange={(event) =>
                    setDraft({ ...draft, primary: event.target.value === "true" })
                  }
                >
                  <option value="true">是</option>
                  <option value="false">否</option>
                </select>
              </label>
              <label className={styles["wideField"]}>
                <span>Animation Config</span>
                <textarea
                  spellCheck={false}
                  value={draft.animationConfig}
                  onChange={(event) => setDraft({ ...draft, animationConfig: event.target.value })}
                />
              </label>
            </div>
            <button
              className={styles["primaryButton"]}
              disabled={status === "saving"}
              onClick={() => void saveTransform()}
              type="button"
            >
              <Save size={15} />
              保存模型变换
            </button>
          </>
        ) : (
          <p className={styles["emptyCopy"]}>上传模型后可校准位置、旋转、缩放、LOD 与动画配置。</p>
        )}
        {message ? (
          <p className={styles["formMessage"]} data-status={status}>
            {status === "saving" ? (
              <LoaderCircle className={styles["spin"]} size={13} />
            ) : status === "error" ? (
              <TriangleAlert size={13} />
            ) : (
              <Check size={13} />
            )}
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
