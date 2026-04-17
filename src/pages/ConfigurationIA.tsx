/**
 * ConfigurationIA.tsx
 * THE PLUG FINANCE CO — Gestion de l'intégration Claude IA
 */

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/kenenergie/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot, Key, CheckCircle2, XCircle, Loader2, Eye, EyeOff,
  Zap, RefreshCw, Terminal, Shield, Cpu, Package,
  ChevronDown, ChevronUp, AlertTriangle, Info, Copy, Check,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConfigData {
  hasKey:       boolean;
  maskedKey:    string | null;
  keyPrefix:    string | null;
  model:        string;
  tokenLimits:  Record<string, number>;
  nodeVersion:  string;
  serverVersion:string;
  envFile:      string;
}

interface TestResult {
  success:   boolean;
  latencyMs?: number;
  model?:    string;
  response?: string;
  error?:    string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`/api/ai/config${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Erreur ${res.status}`);
  return data as T;
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function ConfigurationIA() {
  const [config,        setConfig]        = useState<ConfigData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [serverOnline,  setServerOnline]  = useState<boolean | null>(null);

  // Clé API
  const [newKey,        setNewKey]        = useState("");
  const [showKey,       setShowKey]       = useState(false);
  const [savingKey,     setSavingKey]     = useState(false);
  const [keyMsg,        setKeyMsg]        = useState<{ type: "ok"|"err"; text: string } | null>(null);
  const [keyCopied,     setKeyCopied]     = useState(false);

  // Test connexion
  const [testing,       setTesting]       = useState(false);
  const [testResult,    setTestResult]    = useState<TestResult | null>(null);

  // Install
  const [installing,    setInstalling]    = useState(false);
  const [installLog,    setInstallLog]    = useState<string | null>(null);
  const [showInstall,   setShowInstall]   = useState(false);

  // ── Chargement config ───────────────────────────────────────────────────────
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ConfigData>("/");
      setConfig(data);
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  // ── Test connexion Claude ───────────────────────────────────────────────────
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await apiFetch<TestResult>("/test", { method: "POST" });
      setTestResult(r);
    } catch (err) {
      setTestResult({ success: false, error: (err as Error).message });
    } finally {
      setTesting(false);
    }
  };

  // ── Sauvegarde de la clé ────────────────────────────────────────────────────
  const handleSaveKey = async () => {
    if (!newKey.trim()) return;
    setSavingKey(true);
    setKeyMsg(null);
    try {
      await apiFetch("/key", {
        method: "POST",
        body: JSON.stringify({ apiKey: newKey.trim() }),
      });
      setKeyMsg({ type: "ok", text: "Clé API sauvegardée et rechargée avec succès." });
      setNewKey("");
      await loadConfig();
    } catch (err) {
      setKeyMsg({ type: "err", text: (err as Error).message });
    } finally {
      setSavingKey(false);
    }
  };

  // ── Installation des dépendances ────────────────────────────────────────────
  const handleInstall = async () => {
    setInstalling(true);
    setInstallLog(null);
    try {
      const r = await apiFetch<{ success: boolean; output: string }>("/install", { method: "POST" });
      setInstallLog(r.output || "Installation terminée.");
    } catch (err) {
      setInstallLog(`Erreur : ${(err as Error).message}`);
    } finally {
      setInstalling(false);
    }
  };

  // ── Copier la clé masquée ───────────────────────────────────────────────────
  const handleCopyMasked = () => {
    if (!config?.maskedKey) return;
    navigator.clipboard.writeText(config.maskedKey).catch(() => {});
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 1800);
  };

  // ── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Configuration IA"
        subtitle="Intégration Claude — gestion de la clé API et du serveur"
        badge="Extension"
      />

      {/* ── Statut serveur ── */}
      <div className={`rounded-xl border px-5 py-4 flex items-center gap-4 transition-colors ${
        serverOnline === null ? "border-border bg-muted/20"
        : serverOnline       ? "border-accent/30 bg-accent/5"
                             : "border-red-500/30 bg-red-500/5"
      }`}>
        {loading
          ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          : serverOnline
          ? <CheckCircle2 className="w-5 h-5 text-accent" />
          : <XCircle      className="w-5 h-5 text-red-400" />
        }
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {loading ? "Vérification…" : serverOnline ? "Serveur Express connecté" : "Serveur Express hors ligne"}
          </p>
          <p className="text-xs text-muted-foreground">
            {serverOnline === false
              ? "Démarrez le serveur : cd server && npm install && node index.js"
              : config
              ? `Node ${config.nodeVersion} · v${config.serverVersion} · .env ${config.envFile}`
              : "localhost:3001 · proxy Vite /api"
            }
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
          onClick={loadConfig} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualiser
        </Button>
      </div>

      {/* ── Clé API Claude ── */}
      <section className="kpi-depth rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold">Clé API Anthropic</h2>
          {config?.hasKey && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" /> Configurée
            </span>
          )}
        </div>

        {/* Clé masquée courante */}
        {config?.maskedKey && (
          <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
            <Key className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <code className="flex-1 text-xs font-mono text-muted-foreground tracking-widest truncate">
              {config.maskedKey}
            </code>
            <button type="button" onClick={handleCopyMasked} aria-label="Copier"
              className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors">
              {keyCopied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {!config?.hasKey && !loading && (
          <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Aucune clé API configurée. Les fonctions IA sont désactivées.</span>
          </div>
        )}

        {/* Saisie nouvelle clé */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground block">
            {config?.hasKey ? "Mettre à jour la clé" : "Entrer votre clé API"}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveKey()}
                placeholder="sk-ant-api03-…"
                className="h-9 text-sm font-mono pr-10"
                aria-label="Nouvelle clé API Anthropic"
              />
              <button type="button" onClick={() => setShowKey(v => !v)}
                aria-label={showKey ? "Masquer la clé" : "Afficher la clé"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="button" size="sm" className="h-9 gap-1.5"
              onClick={handleSaveKey}
              disabled={savingKey || !newKey.trim()}>
              {savingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              Sauvegarder
            </Button>
          </div>
          {keyMsg && (
            <p className={`text-xs flex items-center gap-1.5 ${keyMsg.type === "ok" ? "text-accent" : "text-red-400"}`}>
              {keyMsg.type === "ok"
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <XCircle      className="w-3.5 h-3.5" />
              }
              {keyMsg.text}
            </p>
          )}
        </div>

        <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/20 rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            La clé est stockée dans <code className="font-mono">server/.env</code> et n'est jamais exposée côté client.
            Obtenez votre clé sur <span className="underline cursor-pointer">console.anthropic.com</span>.
          </span>
        </div>
      </section>

      {/* ── Test de connexion ── */}
      <section className="kpi-depth rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold">Tester la connexion</h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button type="button" variant="outline" className="gap-2"
            onClick={handleTest} disabled={testing || !serverOnline || !config?.hasKey}>
            {testing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Zap className="w-4 h-4" />
            }
            {testing ? "Test en cours…" : "Tester Claude"}
          </Button>
          {config && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Cpu className="w-3.5 h-3.5" />
              <span>Modèle : <code className="font-mono text-foreground">{config.model}</code></span>
            </div>
          )}
        </div>

        {testResult && (
          <div className={`rounded-lg border px-4 py-3 space-y-1 ${
            testResult.success
              ? "border-accent/30 bg-accent/5"
              : "border-red-500/30 bg-red-500/5"
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success
                ? <CheckCircle2 className="w-4 h-4 text-accent" />
                : <XCircle      className="w-4 h-4 text-red-400" />
              }
              <span className="text-sm font-semibold">
                {testResult.success ? "Connexion réussie" : "Connexion échouée"}
              </span>
              {testResult.latencyMs && (
                <span className="ml-auto text-xs text-muted-foreground">{testResult.latencyMs} ms</span>
              )}
            </div>
            {testResult.success && testResult.response && (
              <p className="text-xs text-muted-foreground pl-6">Réponse : « {testResult.response} »</p>
            )}
            {!testResult.success && testResult.error && (
              <p className="text-xs text-red-400 pl-6">{testResult.error}</p>
            )}
          </div>
        )}

        {/* Limites tokens */}
        {config?.tokenLimits && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(config.tokenLimits).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{k}</p>
                <p className="text-sm font-bold">{v.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">tokens max</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Installation automatique ── */}
      <section className="kpi-depth rounded-xl border border-border p-5 space-y-4">
        <button type="button"
          onClick={() => setShowInstall(v => !v)}
          className="w-full flex items-center gap-2 text-left">
          <Package className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold flex-1">Installation des dépendances</h2>
          {showInstall ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showInstall && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Installe automatiquement les dépendances du serveur Express
              (<code className="font-mono">@anthropic-ai/sdk</code>, <code className="font-mono">express</code>, etc.)
              sans avoir à ouvrir un terminal.
            </p>
            <Button type="button" variant="outline" className="gap-2"
              onClick={handleInstall} disabled={installing || !serverOnline}>
              {installing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Package className="w-4 h-4" />
              }
              {installing ? "Installation en cours…" : "Installer les dépendances serveur"}
            </Button>

            {installLog && (
              <div className="rounded-lg bg-muted/40 border border-border">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
                  <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-semibold text-muted-foreground">Output npm install</span>
                </div>
                <pre className="text-[11px] font-mono text-muted-foreground px-3 py-2 overflow-x-auto max-h-48 whitespace-pre-wrap">
                  {installLog}
                </pre>
              </div>
            )}

            <div className="rounded-lg bg-muted/20 border border-border/50 px-4 py-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Commandes manuelles</p>
              {[
                "cd server && npm install",
                "node server/index.js",
                "# ou en mode watch :",
                "cd server && npm run dev",
              ].map((cmd, i) => (
                <pre key={i} className={`text-xs font-mono ${cmd.startsWith("#") ? "text-muted-foreground/50 italic" : "text-foreground"}`}>
                  {cmd}
                </pre>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Démarrage rapide (si serveur offline) ── */}
      {serverOnline === false && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-400">Serveur hors ligne — démarrage rapide</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Le serveur Express (port 3001) est nécessaire pour utiliser l'IA. Exécutez ces commandes dans un terminal :
          </p>
          <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 space-y-1">
            {["cd server", "npm install", "node index.js"].map((cmd, i) => (
              <pre key={i} className="text-xs font-mono text-foreground">{cmd}</pre>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Ou depuis la racine du projet : <code className="font-mono">npm run start:all</code>
          </p>
        </div>
      )}
    </div>
  );
}
