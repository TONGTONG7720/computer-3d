import { ArrowUp } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";
import styles from "./AiComposer.module.css";

type AiAssistantComposerProps = {
  readonly busy: boolean;
  readonly draft: string;
  readonly onDraftChange: (draft: string) => void;
  readonly onSubmit: () => void;
};

export function AiAssistantComposer({
  busy,
  draft,
  onDraftChange,
  onSubmit,
}: AiAssistantComposerProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <form className={styles["composer"]} onSubmit={handleSubmit}>
      <label htmlFor="ai-build-message">继续描述或修改配置</label>
      <div>
        <textarea
          id="ai-build-message"
          maxLength={2000}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例如：显卡换成 RTX 5090，预算变化可以接受"
          rows={2}
          value={draft}
        />
        <button aria-label="生成配置" disabled={!draft.trim() || busy} type="submit">
          <ArrowUp size={16} />
        </button>
      </div>
      <small>携带当前配置上下文 · Enter 发送 / Shift+Enter 换行</small>
    </form>
  );
}
