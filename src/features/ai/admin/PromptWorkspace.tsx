"use client";

import { CheckCircle2, FileCode2, GitBranch, Upload } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import editorStyles from "./AiAdminEditor.module.css";
import registryStyles from "./AiAdminRegistry.module.css";
import { createPromptVersion } from "./api/AdminAiApiClient";
import type { AiPrompt } from "./domain/adminAi";

const styles = { ...registryStyles, ...editorStyles };

type PromptWorkspaceProps = {
  readonly adminKey: string;
  readonly onChanged: (prompt: AiPrompt) => void;
  readonly prompts: readonly AiPrompt[];
};

export function PromptWorkspace({ adminKey, onChanged, prompts }: PromptWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(
    () => prompts.find((prompt) => prompt.id === selectedId) ?? prompts[0] ?? null,
    [prompts, selectedId],
  );
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (selected) {
      setName(selected.name);
      setContent(selected.content);
    }
  }, [selected]);

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || publishing) {
      return;
    }
    setPublishing(true);
    setMessage("");
    try {
      const next = await createPromptVersion(adminKey, selected.promptKey, {
        name: name.trim(),
        content: content.trim(),
        activate: true,
      });
      setSelectedId(next.id);
      onChanged(next);
      setMessage(`R${next.version} 已发布并设为活动版本`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Prompt 发布失败");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section className={styles["workbench"]}>
      <aside className={styles["registry"]}>
        <header>
          <FileCode2 size={16} />
          <div>
            <strong>Prompt Registry</strong>
            <span>不可变版本记录</span>
          </div>
        </header>
        <div>
          {prompts.map((prompt) => (
            <button
              data-selected={selected?.id === prompt.id}
              key={prompt.id}
              onClick={() => setSelectedId(prompt.id)}
              type="button"
            >
              <span>R{prompt.version}</span>
              <strong>{prompt.name}</strong>
              <small data-status={prompt.status}>{prompt.status}</small>
            </button>
          ))}
        </div>
      </aside>

      <form className={styles["editor"]} onSubmit={publish}>
        <header className={styles["editorHeader"]}>
          <div>
            <GitBranch size={16} />
            <span>
              <small>ACTIVE PROMPT</small>
              <strong>{selected?.promptKey ?? "NO PROMPT"}</strong>
            </span>
          </div>
          {selected ? <em>BASE R{selected.version}</em> : null}
        </header>
        {selected ? (
          <div className={styles["editorBody"]}>
            <label>
              <span>版本名称</span>
              <input
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
            <label className={styles["codeField"]}>
              <span>System Prompt</span>
              <textarea
                maxLength={12000}
                onChange={(event) => setContent(event.target.value)}
                required
                rows={18}
                value={content}
              />
            </label>
            <div className={styles["editorNote"]}>
              <CheckCircle2 size={14} />
              <span>发布会归档当前活动版本；兼容性仍由确定性规则引擎裁决。</span>
            </div>
          </div>
        ) : (
          <div className={styles["emptyWorkspace"]}>数据库中没有 Prompt 版本。</div>
        )}
        <footer className={styles["editorFooter"]}>
          <span aria-live="polite">{message}</span>
          <button disabled={!selected || publishing} type="submit">
            <Upload size={14} />
            {publishing ? "发布中" : "发布新版本"}
          </button>
        </footer>
      </form>
    </section>
  );
}
