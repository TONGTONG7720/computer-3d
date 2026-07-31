"use client";

import { BookMarked, Database, RefreshCw, Save } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./AiAdmin.module.css";
import { saveKnowledge, syncKnowledgeVector } from "./api/AdminAiApiClient";
import type { AiKnowledge } from "./domain/adminAi";

type KnowledgeWorkspaceProps = {
  readonly adminKey: string;
  readonly documents: readonly AiKnowledge[];
  readonly onChanged: (document: AiKnowledge) => void;
};

export function KnowledgeWorkspace({ adminKey, documents, onChanged }: KnowledgeWorkspaceProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = useMemo(
    () =>
      documents.find((document) => document.documentKey === selectedKey) ?? documents[0] ?? null,
    [documents, selectedKey],
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [category, setCategory] = useState<AiKnowledge["category"]>("WORKLOAD");
  const [status, setStatus] = useState<AiKnowledge["status"]>("DRAFT");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (selected) {
      setTitle(selected.title);
      setContent(selected.content);
      setTags(selected.tags.join(", "));
      setSourceLabel(selected.sourceLabel);
      setCategory(selected.category);
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
      const next = await saveKnowledge(adminKey, selected, {
        title: title.trim(),
        category,
        content: content.trim(),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        sourceLabel: sourceLabel.trim(),
        status,
      });
      onChanged(next);
      setMessage(`R${next.version} 已保存，向量状态 ${next.vectorStatus}`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "知识条目保存失败");
    } finally {
      setSaving(false);
    }
  };

  const sync = async () => {
    if (!selected || saving) {
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const next = await syncKnowledgeVector(adminKey, selected.documentKey);
      onChanged(next);
      setMessage("向量索引已同步");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "向量服务未启用");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles["workbench"]}>
      <aside className={styles["registry"]}>
        <header>
          <Database size={16} />
          <div>
            <strong>Knowledge Base</strong>
            <span>审核来源 / 向量状态</span>
          </div>
        </header>
        <div>
          {documents.map((document) => (
            <button
              data-selected={selected?.documentKey === document.documentKey}
              key={document.documentKey}
              onClick={() => setSelectedKey(document.documentKey)}
              type="button"
            >
              <span>{document.category}</span>
              <strong>{document.title}</strong>
              <small data-status={document.vectorStatus}>{document.vectorStatus}</small>
            </button>
          ))}
        </div>
      </aside>

      <form className={styles["editor"]} onSubmit={save}>
        <header className={styles["editorHeader"]}>
          <div>
            <BookMarked size={16} />
            <span>
              <small>REVIEWED DOCUMENT</small>
              <strong>{selected?.documentKey ?? "NO DOCUMENT"}</strong>
            </span>
          </div>
          {selected ? <em>R{selected.version}</em> : null}
        </header>
        {selected ? (
          <div className={`${styles["editorBody"]} ${styles["knowledgeFields"]}`}>
            <label>
              <span>标题</span>
              <input
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                required
                value={title}
              />
            </label>
            <label>
              <span>分类</span>
              <select
                onChange={(event) => setCategory(event.target.value as AiKnowledge["category"])}
                value={category}
              >
                <option>COMPATIBILITY</option>
                <option>POWER</option>
                <option>WORKLOAD</option>
                <option>PREFERENCE</option>
                <option>PERFORMANCE</option>
              </select>
            </label>
            <label>
              <span>来源</span>
              <input
                maxLength={160}
                onChange={(event) => setSourceLabel(event.target.value)}
                required
                value={sourceLabel}
              />
            </label>
            <label>
              <span>状态</span>
              <select
                onChange={(event) => setStatus(event.target.value as AiKnowledge["status"])}
                value={status}
              >
                <option>ACTIVE</option>
                <option>DRAFT</option>
                <option>ARCHIVED</option>
              </select>
            </label>
            <label className={styles["wideField"]}>
              <span>标签（逗号分隔）</span>
              <input onChange={(event) => setTags(event.target.value)} required value={tags} />
            </label>
            <label className={`${styles["wideField"]} ${styles["codeField"]}`}>
              <span>知识正文</span>
              <textarea
                maxLength={16000}
                onChange={(event) => setContent(event.target.value)}
                required
                rows={12}
                value={content}
              />
            </label>
          </div>
        ) : (
          <div className={styles["emptyWorkspace"]}>没有可维护的知识条目。</div>
        )}
        <footer className={styles["editorFooter"]}>
          <span aria-live="polite">{message}</span>
          <div>
            <button
              className={styles["secondaryAction"]}
              disabled={!selected || saving}
              onClick={() => void sync()}
              type="button"
            >
              <RefreshCw size={14} />
              同步向量
            </button>
            <button disabled={!selected || saving} type="submit">
              <Save size={14} />
              保存条目
            </button>
          </div>
        </footer>
      </form>
    </section>
  );
}
