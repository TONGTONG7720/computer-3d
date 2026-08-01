"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Braces, LoaderCircle, Sparkles, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { applyBuilderSelectionWithScene } from "@/features/builder/sync/BuilderEngineSync";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { useBuilderStore } from "@/store/builderStore";
import { requestAiBuild } from "../api/AiBuilderApiClient";
import { resolveAiProposal } from "../domain/AiProposalResolver";
import type { AiBuild } from "../domain/aiBuild";
import styles from "./AiAssistant.module.css";
import { AiAssistantComposer } from "./AiAssistantComposer";
import headerStyles from "./AiAssistantHeader.module.css";
import conversationStyles from "./AiConversation.module.css";
import { AiProposalCard } from "./AiProposalCard";

const quickPrompts = [
  { label: "8000 游戏主机", value: "8000预算，主要玩3A游戏，优先显卡性能" },
  { label: "静音设计工作站", value: "15000预算，设计与渲染使用，希望安静稳定" },
  { label: "紧凑开发主机", value: "小体积编程电脑，优先编译性能和32GB以上内存" },
  { label: "本地 AI 工作站", value: "用于本地AI训练，优先显卡和显存，预算15000" },
] as const;

type AdvisorStatus = "welcome" | "analysing" | "proposal" | "applying" | "applied" | "error";

const routeLabel = (route: AiBuild["route"]): string => {
  switch (route) {
    case "RULE":
      return "LOCAL RULES";
    case "LLM":
      return "MODEL PARSE";
    case "LLM_FALLBACK":
      return "SAFE FALLBACK";
  }
};

/** @deprecated AI chat is deferred and is not part of the V3 Builder runtime. */
export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [lastMessage, setLastMessage] = useState("");
  const [sessionId, setSessionId] = useState<string>();
  const [proposal, setProposal] = useState<AiBuild | null>(null);
  const [status, setStatus] = useState<AdvisorStatus>("welcome");
  const [error, setError] = useState("");
  const selectedComponents = useBuilderStore((state) => state.selectedComponents);
  const catalogue = useBuilderStore((state) => state.catalogue);
  const layerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeAssistant = useCallback(() => setOpen(false), []);

  useDialogFocus({
    dialogRef: panelRef,
    initialFocusRef: closeButtonRef,
    isolationRootRef: layerRef,
    onClose: closeAssistant,
    open,
  });

  const applyProposal = (nextProposal: AiBuild): boolean => {
    try {
      setStatus("applying");
      const selection = resolveAiProposal(nextProposal.components, catalogue);
      applyBuilderSelectionWithScene(selection);
      setStatus("applied");
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "配置无法映射到当前硬件目录。请刷新后重试。",
      );
      setStatus("error");
      return false;
    }
  };

  const submit = async (): Promise<void> => {
    const message = draft.trim();
    if (message.length === 0 || status === "analysing" || status === "applying") {
      return;
    }
    setLastMessage(message);
    setDraft("");
    setError("");
    setStatus("analysing");
    try {
      const result = await requestAiBuild(message, selectedComponents, sessionId);
      setProposal(result);
      setSessionId(result.sessionId);
      if (result.requiresConfirmation) {
        setStatus("proposal");
      } else {
        applyProposal(result);
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "AI Builder 暂时无法生成配置，请稍后重试。",
      );
      setStatus("error");
    }
  };

  return (
    <div className={styles["assistantRoot"]}>
      <button
        aria-label={open ? "AI 装机顾问已打开" : "打开 AI 装机顾问"}
        className={styles["launcher"]}
        data-state={status}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Sparkles size={20} strokeWidth={1.5} />
        <span />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1 }}
            className={styles["advisorLayer"]}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            ref={layerRef}
          >
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              aria-labelledby="ai-advisor-title"
              aria-modal="true"
              className={styles["advisor"]}
              exit={{ opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
              ref={panelRef}
              role="dialog"
              tabIndex={-1}
              transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <header className={headerStyles["advisorHeader"]}>
                <div className={headerStyles["advisorIdentity"]}>
                  <span>
                    <Bot size={18} />
                  </span>
                  <div>
                    <small>PC LAB / BUILD ADVISOR</small>
                    <h2 id="ai-advisor-title">需求诊断端口</h2>
                  </div>
                </div>
                <div className={headerStyles["headerActions"]}>
                  <span>{proposal ? routeLabel(proposal.route) : "READY"}</span>
                  <button
                    aria-label="关闭 AI 装机顾问"
                    onClick={closeAssistant}
                    ref={closeButtonRef}
                    type="button"
                  >
                    <X size={16} />
                  </button>
                </div>
              </header>

              <div className={styles["advisorBody"]}>
                {lastMessage ? (
                  <div className={conversationStyles["userMessage"]}>{lastMessage}</div>
                ) : null}

                {status === "welcome" ? (
                  <section className={conversationStyles["welcome"]}>
                    <Braces size={24} strokeWidth={1.35} />
                    <strong>描述预算、用途与偏好</strong>
                    <p>兼容性由本地规则裁决；模型只负责理解复杂表达，不直接编造硬件。</p>
                    <div className={conversationStyles["quickPrompts"]}>
                      {quickPrompts.map((prompt) => (
                        <button
                          key={prompt.label}
                          onClick={() => setDraft(prompt.value)}
                          type="button"
                        >
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                {status === "analysing" ? (
                  <div
                    aria-live="polite"
                    className={conversationStyles["analysisState"]}
                    role="status"
                  >
                    <LoaderCircle size={19} />
                    <div>
                      <strong>正在计算兼容组合</strong>
                      <span>需求解析 / 知识检索 / 预算求解</span>
                    </div>
                    <i />
                  </div>
                ) : null}

                {proposal && status !== "analysing" ? (
                  <>
                    <div className={conversationStyles["assistantMessage"]}>
                      {proposal.assistantMessage}
                    </div>
                    <AiProposalCard
                      applied={status === "applied"}
                      applying={status === "applying"}
                      catalogue={catalogue}
                      onApply={() => applyProposal(proposal)}
                      proposal={proposal}
                    />
                  </>
                ) : null}

                {status === "applied" ? (
                  <div aria-live="polite" className={conversationStyles["appliedState"]}>
                    <span>
                      <Sparkles size={14} />
                    </span>
                    <div>
                      <strong>配置已送入 3D 安装队列</strong>
                      <small>零件将按机械安装顺序依次替换。</small>
                    </div>
                  </div>
                ) : null}

                {status === "error" ? (
                  <div className={conversationStyles["errorState"]} role="alert">
                    {error}
                  </div>
                ) : null}
              </div>

              <AiAssistantComposer
                busy={status === "analysing"}
                draft={draft}
                onDraftChange={setDraft}
                onSubmit={() => void submit()}
              />
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
