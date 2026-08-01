"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { AiAdminAccessGate } from "./AiAdminAccessGate";
import { AiAdminOverview, type AiAdminTab } from "./AiAdminOverview";
import styles from "./AiAdminWorkspace.module.css";
import {
  fetchAiDashboard,
  fetchAiKnowledge,
  fetchAiLogs,
  fetchAiPrompts,
  fetchAiRules,
} from "./api/AdminAiApiClient";
import type {
  AiDashboard,
  AiKnowledge,
  AiPrompt,
  AiRequestLogPage,
  AiRule,
} from "./domain/adminAi";
import { KnowledgeWorkspace } from "./KnowledgeWorkspace";
import { LogWorkspace } from "./LogWorkspace";
import { PromptWorkspace } from "./PromptWorkspace";
import { RuleWorkspace } from "./RuleWorkspace";

const SESSION_KEY = "pc-lab-ai-admin-key";

type LoadStatus = "idle" | "loading" | "ready" | "error";

export function AiAdminWorkspace() {
  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<AiAdminTab>("prompts");
  const [dashboard, setDashboard] = useState<AiDashboard | null>(null);
  const [prompts, setPrompts] = useState<AiPrompt[]>([]);
  const [knowledge, setKnowledge] = useState<AiKnowledge[]>([]);
  const [rules, setRules] = useState<AiRule[]>([]);
  const [logs, setLogs] = useState<AiRequestLogPage | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!adminKey) {
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const [nextDashboard, nextPrompts, nextKnowledge, nextRules, nextLogs] = await Promise.all([
        fetchAiDashboard(adminKey),
        fetchAiPrompts(adminKey),
        fetchAiKnowledge(adminKey),
        fetchAiRules(adminKey),
        fetchAiLogs(adminKey),
      ]);
      setDashboard(nextDashboard);
      setPrompts(nextPrompts);
      setKnowledge(nextKnowledge);
      setRules(nextRules);
      setLogs(nextLogs);
      setStatus("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "无法连接 AI 运营服务");
      setStatus("error");
    }
  }, [adminKey]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      setAdminKey(stored);
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (unlocked && adminKey) {
      void load();
    }
  }, [adminKey, load, unlocked]);

  const unlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = adminKey.trim();
    if (!normalized) {
      return;
    }
    window.sessionStorage.setItem(SESSION_KEY, normalized);
    setAdminKey(normalized);
    setUnlocked(true);
  };

  const lock = () => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setAdminKey("");
    setDashboard(null);
  };

  if (!unlocked) {
    return (
      <AiAdminAccessGate adminKey={adminKey} onAdminKeyChange={setAdminKey} onUnlock={unlock} />
    );
  }

  return (
    <main className={styles["workspace"]}>
      <AiAdminOverview
        activeTab={activeTab}
        dashboard={dashboard}
        onLock={lock}
        onTabChange={setActiveTab}
      />
      <div className={styles["workspaceBody"]}>
        {status === "error" ? (
          <div className={styles["loadError"]} role="alert">
            <TriangleAlert size={17} />
            <span>
              <strong>运营服务连接失败</strong>
              <small>{error}</small>
            </span>
            <button onClick={() => void load()} type="button">
              <RefreshCw size={14} />
              重试
            </button>
          </div>
        ) : null}
        {status === "loading" ? (
          <div className={styles["loadingRail"]}>
            <span />
          </div>
        ) : null}

        {activeTab === "prompts" ? (
          <PromptWorkspace
            adminKey={adminKey}
            onChanged={(next) =>
              setPrompts((current) => [
                next,
                ...current.map((prompt) =>
                  prompt.promptKey === next.promptKey && prompt.status === "ACTIVE"
                    ? { ...prompt, status: "ARCHIVED" as const }
                    : prompt,
                ),
              ])
            }
            prompts={prompts}
          />
        ) : null}
        {activeTab === "knowledge" ? (
          <KnowledgeWorkspace
            adminKey={adminKey}
            documents={knowledge}
            onChanged={(next) =>
              setKnowledge((current) =>
                current.map((document) =>
                  document.documentKey === next.documentKey ? next : document,
                ),
              )
            }
          />
        ) : null}
        {activeTab === "rules" ? (
          <RuleWorkspace
            adminKey={adminKey}
            onChanged={(next) =>
              setRules((current) =>
                current.map((rule) => (rule.ruleKey === next.ruleKey ? next : rule)),
              )
            }
            rules={rules}
          />
        ) : null}
        {activeTab === "logs" ? <LogWorkspace logs={logs} /> : null}
      </div>
    </main>
  );
}
