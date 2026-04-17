import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/kenenergie/PageHeader";
import { useParametres } from "@/contexts/ParametresContext";
import type { Dossier } from "@/contexts/ParametresContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderOpen, FolderPlus, Trash2, Download, Upload, Copy,
  Check, Clock, User, FileText, ChevronRight, Save,
  Sparkles, Loader2, AlertTriangle, X, FileUp,
  Cloud, CloudOff, CloudUpload, CloudDownload, Search,
  LayoutGrid, List, SortAsc, SortDesc, Package,
  HardDrive, RefreshCw, Shield, Info,
} from "lucide-react";
import { analyzeDocument } from "@/lib/ai-service";
import type { AnalysisResult } from "@/lib/ai-service";
import {
  exportAllDossiers, searchDossiers, getStorageStats,
  importBundle, markSynced,
} from "@/lib/dossier-storage";
import {
  listCloud, pushToCloud, fetchFromCloud, deleteFromCloud,
  downloadCloudBackup, importBundleToCloud, checkCloudAvailable,
  getSyncStatus,
} from "@/lib/dossier-cloud";
import type { CloudMeta, CloudStatus } from "@/lib/dossier-cloud";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatSize(kb: number) {
  return kb < 1024 ? `${kb} Ko` : `${(kb / 1024).toFixed(1)} Mo`;
}

type SortKey = "updatedAt" | "createdAt" | "nom" | "client";
type ViewMode = "grid" | "list";

// ── Statut cloud badge ────────────────────────────────────────────────────────
function CloudBadge({ status, loading }: { status: CloudStatus | null; loading?: boolean }) {
  if (loading) return <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />;
  if (!status) return null;
  const cfg = {
    synced:       { icon: Cloud,         cls: "text-emerald-400", label: "Sync" },
    "local-only": { icon: HardDrive,     cls: "text-muted-foreground", label: "Local" },
    "cloud-only": { icon: CloudDownload, cls: "text-blue-400",    label: "Cloud" },
    conflict:     { icon: AlertTriangle, cls: "text-amber-400",   label: "Modifié" },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium ${cfg.cls}`} title={cfg.label}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

// ── Dialog Nouveau Dossier ────────────────────────────────────────────────────
function NewDossierDialog({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (nom: string, client: string, description: string) => void;
}) {
  const [nom, setNom]               = useState("");
  const [client, setClient]         = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-[slide-up-fade_0.2s_ease]">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <FolderPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold">Nouveau Dossier</h2>
            <p className="text-xs text-muted-foreground">Créer un nouveau projet financier</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Nom du dossier *</label>
            <Input autoFocus value={nom} onChange={e => setNom(e.target.value)}
              placeholder="ex: KENENERGIE SARL — BP 2027" className="h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Client / Promoteur</label>
            <Input value={client} onChange={e => setClient(e.target.value)}
              placeholder="ex: KENGOUM NGASSA" className="h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
            <Input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="ex: Business Plan 2027–2031, secteur énergie" className="h-9" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button type="button" className="flex-1 gap-2" disabled={!nom.trim()}
            onClick={() => onCreate(nom.trim(), client.trim(), description.trim())}>
            <FolderPlus className="w-4 h-4" /> Créer & Charger
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Carte dossier (grid) ──────────────────────────────────────────────────────
function DossierCard({
  dossier, isActive, cloudStatus, syncLoading,
  onLoad, onDelete, onDuplicate, onExport, onPushCloud, onPullCloud,
}: {
  dossier: Dossier;
  isActive: boolean;
  cloudStatus: CloudStatus | null;
  syncLoading: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onPushCloud: () => void;
  onPullCloud: () => void;
}) {
  return (
    <div className={`kpi-depth rounded-xl border p-4 flex flex-col gap-3 transition-all ${
      isActive ? "border-accent/50 ring-2 ring-accent/20" : "border-border hover:border-border/80"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2 rounded-lg flex-shrink-0 ${isActive ? "bg-accent/15" : "bg-muted/50"}`}>
            <FolderOpen className={`w-4 h-4 ${isActive ? "text-accent" : "text-muted-foreground"}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{dossier.nom}</h3>
            {dossier.client && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{dossier.client}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isActive && (
            <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" /> Actif
            </span>
          )}
          <CloudBadge status={cloudStatus} loading={syncLoading} />
        </div>
      </div>

      {/* Description */}
      {dossier.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 flex gap-1.5">
          <FileText className="w-3 h-3 flex-shrink-0 mt-0.5" />
          {dossier.description}
        </p>
      )}

      {/* Dates */}
      <div className="space-y-0.5 text-[10px] text-muted-foreground">
        <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Créé {formatDate(dossier.createdAt)}</p>
        <p className="flex items-center gap-1.5"><Save className="w-3 h-3" /> Modifié {formatDate(dossier.updatedAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 flex-wrap mt-auto pt-1 border-t border-border/30">
        {!isActive && (
          <Button type="button" size="sm" className="gap-1.5 flex-1 text-xs h-7" onClick={onLoad}>
            <ChevronRight className="w-3 h-3" /> Ouvrir
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" className="text-xs px-2 h-7" onClick={onDuplicate} title="Dupliquer">
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" size="sm" variant="outline" className="text-xs px-2 h-7" onClick={onExport} title="Exporter JSON local">
          <Download className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" size="sm" variant="outline"
          className={`text-xs px-2 h-7 ${cloudStatus === "conflict" ? "border-amber-400/50 text-amber-400" : ""}`}
          onClick={onPushCloud} title="Sauvegarder dans le cloud" disabled={syncLoading}>
          <CloudUpload className="w-3.5 h-3.5" />
        </Button>
        {cloudStatus && cloudStatus !== "local-only" && (
          <Button type="button" size="sm" variant="outline" className="text-xs px-2 h-7"
            onClick={onPullCloud} title="Récupérer depuis le cloud" disabled={syncLoading}>
            <CloudDownload className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost"
          className="text-xs px-2 h-7 text-destructive hover:text-destructive" onClick={onDelete} title="Supprimer">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Ligne dossier (list view) ─────────────────────────────────────────────────
function DossierRow({
  dossier, isActive, cloudStatus, syncLoading,
  onLoad, onDelete, onDuplicate, onExport, onPushCloud,
}: {
  dossier: Dossier;
  isActive: boolean;
  cloudStatus: CloudStatus | null;
  syncLoading: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onPushCloud: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
      isActive ? "border-accent/40 bg-accent/5" : "border-border hover:bg-muted/20"
    }`}>
      <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-accent" : "text-muted-foreground"}`} />
      <div className="flex-1 min-w-0 grid grid-cols-3 gap-3 items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{dossier.nom}</p>
          {dossier.client && <p className="text-[10px] text-muted-foreground truncate">{dossier.client}</p>}
        </div>
        <p className="text-[11px] text-muted-foreground truncate hidden md:block">{dossier.description}</p>
        <p className="text-[10px] text-muted-foreground text-right hidden lg:block">{formatDate(dossier.updatedAt)}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <CloudBadge status={cloudStatus} loading={syncLoading} />
        {isActive && <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">Actif</span>}
        {!isActive && (
          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={onLoad}>Ouvrir</Button>
        )}
        <Button type="button" size="sm" variant="ghost" className="h-7 px-1.5" onClick={onDuplicate} title="Dupliquer"><Copy className="w-3.5 h-3.5" /></Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-1.5" onClick={onExport} title="Exporter JSON"><Download className="w-3.5 h-3.5" /></Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-1.5" onClick={onPushCloud} disabled={syncLoading} title="Sauvegarder dans le cloud">
          <CloudUpload className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-1.5 text-destructive hover:text-destructive" onClick={onDelete} title="Supprimer">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function Dossiers() {
  const navigate = useNavigate();
  const {
    activeDossier, isDirty, allDossiers,
    createAndLoadDossier, saveCurrentDossier, loadDossier,
    removeDossier, duplicateDossier, exportDossier, importDossierFile, refreshDossiers,
  } = useParametres();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showNew, setShowNew]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [query, setQuery]               = useState("");
  const [sortKey, setSortKey]           = useState<SortKey>("updatedAt");
  const [sortAsc, setSortAsc]           = useState(false);
  const [viewMode, setViewMode]         = useState<ViewMode>("grid");
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  // ── Cloud state ───────────────────────────────────────────────────────────
  const [cloudAvailable, setCloudAvailable] = useState<boolean | null>(null);
  const [cloudMetas, setCloudMetas]         = useState<CloudMeta[]>([]);
  const [cloudLoading, setCloudLoading]     = useState(false);
  const [cloudError, setCloudError]         = useState<string | null>(null);
  const [syncingIds, setSyncingIds]         = useState<Set<string>>(new Set());
  const [lastSync, setLastSync]             = useState<Date | null>(null);

  // ── AI doc analysis state ─────────────────────────────────────────────────
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiResult, setAiResult]     = useState<{ fileName: string; analysis: AnalysisResult } | null>(null);
  const [aiError, setAiError]       = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ── Storage stats ─────────────────────────────────────────────────────────
  const stats = getStorageStats();

  // ── Cloud init ────────────────────────────────────────────────────────────
  const refreshCloud = useCallback(async () => {
    setCloudLoading(true);
    setCloudError(null);
    try {
      const available = await checkCloudAvailable();
      setCloudAvailable(available);
      if (available) {
        const metas = await listCloud();
        setCloudMetas(metas);
        setLastSync(new Date());
      }
    } catch (e) {
      setCloudError(e instanceof Error ? e.message : "Erreur cloud");
    } finally {
      setCloudLoading(false);
    }
  }, []);

  useEffect(() => { refreshCloud(); }, [refreshCloud]);

  // ── Filtrage & tri ────────────────────────────────────────────────────────
  const filtered = (query.trim() ? searchDossiers(query) : allDossiers)
    .slice()
    .sort((a, b) => {
      let va = a[sortKey] ?? ""; let vb = b[sortKey] ?? "";
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  // ── Handlers locaux ───────────────────────────────────────────────────────
  const handleCreate = (nom: string, client: string, desc: string) => {
    createAndLoadDossier(nom, client, desc);
    setShowNew(false);
    navigate("/");
  };

  const handleLoad = (id: string) => { loadDossier(id); navigate("/"); };

  const handleDelete = (id: string) => { removeDossier(id); setConfirmDelete(null); };

  const handleDuplicate = (id: string) => {
    const src = allDossiers.find(d => d.id === id);
    if (src) duplicateDossier(id, `${src.nom} (copie)`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      try {
        if (file.name.endsWith(".json")) {
          const text = await file.text();
          const parsed = JSON.parse(text);
          // Bundle multi-dossiers
          if (parsed.dossiers && Array.isArray(parsed.dossiers)) {
            const { added, updated } = importBundle(parsed.dossiers);
            refreshDossiers();
            alert(`Import bundle : ${added} ajouté(s), ${updated} mis à jour.`);
          } else {
            // Dossier unique
            await importDossierFile(file);
            refreshDossiers();
          }
        }
      } catch { alert(`Erreur import : ${file.name}`); }
    }
    e.target.value = "";
  };

  // ── Handlers cloud ────────────────────────────────────────────────────────
  const setSyncing = (id: string, v: boolean) =>
    setSyncingIds(s => { const n = new Set(s); v ? n.add(id) : n.delete(id); return n; });

  const handlePushCloud = async (dossier: Dossier) => {
    setSyncing(dossier.id, true);
    setCloudError(null);
    try {
      const res = await pushToCloud(dossier);
      markSynced(dossier.id, res.syncedAt);
      await refreshCloud();
    } catch (e) {
      setCloudError(e instanceof Error ? e.message : "Erreur push cloud");
    } finally {
      setSyncing(dossier.id, false);
    }
  };

  const handlePullCloud = async (id: string) => {
    setSyncing(id, true);
    setCloudError(null);
    try {
      const remote = await fetchFromCloud(id);
      importBundle([remote], true);
      refreshDossiers();
    } catch (e) {
      setCloudError(e instanceof Error ? e.message : "Erreur pull cloud");
    } finally {
      setSyncing(id, false);
    }
  };

  const handleSyncAll = async () => {
    setCloudLoading(true);
    setCloudError(null);
    try {
      await importBundleToCloud(allDossiers);
      allDossiers.forEach(d => markSynced(d.id, new Date().toISOString()));
      await refreshCloud();
    } catch (e) {
      setCloudError(e instanceof Error ? e.message : "Erreur sync globale");
    } finally {
      setCloudLoading(false);
    }
  };

  // ── AI analysis ───────────────────────────────────────────────────────────
  const handleAiAnalyze = async (file: File) => {
    setAiLoading(true); setAiError(null); setAiResult(null);
    try {
      const res = await analyzeDocument(file);
      setAiResult({ fileName: res.fileName, analysis: res.analysis });
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Erreur analyse");
    } finally { setAiLoading(false); }
  };

  const cloudStatusOf = (id: string): CloudStatus | null => {
    if (cloudAvailable === false) return null;
    const d = allDossiers.find(d => d.id === id);
    if (!d) return null;
    const meta = cloudMetas.find(m => m.id === id);
    return getSyncStatus(d, meta);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {showNew && <NewDossierDialog onClose={() => setShowNew(false)} onCreate={handleCreate} />}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-bold mb-2">Supprimer ce dossier ?</h2>
            <p className="text-sm text-muted-foreground mb-4">Cette action est irréversible.</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Annuler</Button>
              <Button type="button" variant="destructive" className="flex-1" onClick={() => handleDelete(confirmDelete)}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageHeader
          title="Mes Dossiers"
          subtitle="Gestion locale et cloud de vos projets financiers"
          badge={`${allDossiers.length} dossier${allDossiers.length !== 1 ? "s" : ""}`}
        />
        <div className="flex gap-2 flex-wrap">
          <input ref={fileInputRef} type="file" accept=".json" multiple className="hidden" onChange={handleImport} aria-label="Importer des dossiers JSON" />
          <Button type="button" variant="outline" size="sm" className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5" /> Importer
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={exportAllDossiers}>
            <Package className="w-3.5 h-3.5" /> Exporter tout
          </Button>
          {isDirty && (
            <Button type="button" variant="outline" size="sm"
              className="gap-1.5 border-warning text-warning hover:text-warning"
              onClick={saveCurrentDossier}>
              <Save className="w-3.5 h-3.5" /> Sauvegarder
            </Button>
          )}
          <Button type="button" size="sm" className="gap-1.5" onClick={() => setShowNew(true)}>
            <FolderPlus className="w-3.5 h-3.5" /> Nouveau
          </Button>
        </div>
      </div>

      {/* Storage + Cloud stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Stockage local */}
        <div className="kpi-depth rounded-xl border border-border px-4 py-3 flex items-center gap-4">
          <HardDrive className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-foreground">Stockage local</p>
              <p className="text-[10px] text-muted-foreground">{formatSize(stats.sizeKb)} / {formatSize(stats.maxKb)}</p>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${stats.pct > 80 ? "bg-red-500" : stats.pct > 60 ? "bg-amber-400" : "bg-accent"}`}
                style={{ width: `${stats.pct}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{stats.count} dossier{stats.count !== 1 ? "s" : ""} · {stats.pct}% utilisé</p>
          </div>
        </div>

        {/* Cloud */}
        <div className={`kpi-depth rounded-xl border px-4 py-3 flex items-center gap-4 ${
          cloudAvailable === false ? "border-border/50 opacity-60" : "border-border"
        }`}>
          {cloudAvailable === null
            ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0" />
            : cloudAvailable
            ? <Cloud className="w-5 h-5 text-accent flex-shrink-0" />
            : <CloudOff className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">
                {cloudAvailable === false ? "Cloud indisponible" : cloudAvailable ? "Cloud connecté" : "Connexion…"}
              </p>
              {cloudAvailable && (
                <button type="button" onClick={refreshCloud} disabled={cloudLoading}
                  aria-label="Actualiser le cloud"
                  className="p-0.5 rounded hover:bg-muted text-muted-foreground">
                  <RefreshCw className={`w-3.5 h-3.5 ${cloudLoading ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
            {cloudAvailable === false && (
              <p className="text-[10px] text-muted-foreground">Démarrez le serveur Express (port 3001)</p>
            )}
            {cloudAvailable && (
              <p className="text-[10px] text-muted-foreground">
                {cloudMetas.length} dossier{cloudMetas.length !== 1 ? "s" : ""} cloud
                {lastSync && ` · sync ${lastSync.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
              </p>
            )}
          </div>
          {cloudAvailable && (
            <div className="flex gap-1.5 flex-shrink-0">
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1 px-2"
                onClick={handleSyncAll} disabled={cloudLoading} title="Synchroniser tous les dossiers">
                <CloudUpload className="w-3.5 h-3.5" /> Sync tout
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1 px-2"
                onClick={downloadCloudBackup} title="Télécharger le backup cloud">
                <CloudDownload className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Erreur cloud */}
      {cloudError && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {cloudError}
          <button type="button" onClick={() => setCloudError(null)} aria-label="Fermer" className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Dossier actif banner */}
      {activeDossier && (
        <div className={`rounded-xl border px-4 py-3 flex items-center justify-between flex-wrap gap-3 ${
          isDirty ? "bg-warning/5 border-warning/30" : "bg-accent/5 border-accent/25"
        }`}>
          <div className="flex items-center gap-3">
            <FolderOpen className={`w-5 h-5 flex-shrink-0 ${isDirty ? "text-warning" : "text-accent"}`} />
            <div>
              <p className="text-sm font-semibold">{activeDossier.nom}</p>
              <p className="text-xs text-muted-foreground">
                {isDirty ? "Modifications non sauvegardées" : `Sauvegardé ${formatDate(activeDossier.updatedAt)}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
              onClick={saveCurrentDossier}>
              <Save className="w-3.5 h-3.5" /> Sauvegarder
            </Button>
            {cloudAvailable && (
              <Button type="button" size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
                onClick={() => handlePushCloud(activeDossier)}
                disabled={syncingIds.has(activeDossier.id)}>
                {syncingIds.has(activeDossier.id)
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <CloudUpload className="w-3.5 h-3.5" />
                }
                Cloud
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Barre de recherche & contrôles */}
      {allDossiers.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher par nom, client, description…"
              className="pl-9 h-8 text-xs"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Tri */}
          <div className="flex items-center gap-1">
            {(["nom", "client", "updatedAt"] as SortKey[]).map(k => (
              <button key={k} type="button"
                onClick={() => toggleSort(k)}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors ${
                  sortKey === k ? "bg-accent/10 border-accent/30 text-accent" : "border-border text-muted-foreground hover:border-accent/30"
                }`}>
                {k === "nom" ? "Nom" : k === "client" ? "Client" : "Date"}
                {sortKey === k && (sortAsc ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
              </button>
            ))}
          </div>
          {/* Vue */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button type="button" onClick={() => setViewMode("grid")} aria-label="Vue grille"
              className={`p-1.5 ${viewMode === "grid" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted/50"}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setViewMode("list")} aria-label="Vue liste"
              className={`p-1.5 ${viewMode === "list" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted/50"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Résultat de recherche vide */}
      {query && filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Aucun dossier pour « {query} »
        </div>
      )}

      {/* Pas de dossier du tout */}
      {allDossiers.length === 0 && (
        <div className="kpi-depth rounded-xl border border-dashed border-border p-12 text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-base font-semibold mb-2">Aucun dossier sauvegardé</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Créez votre premier dossier pour sauvegarder l'état actuel du projet.
          </p>
          <Button type="button" className="gap-2" onClick={() => setShowNew(true)}>
            <FolderPlus className="w-4 h-4" /> Créer le premier dossier
          </Button>
        </div>
      )}

      {/* Grille ou liste */}
      {filtered.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(d => (
            <DossierCard
              key={d.id}
              dossier={d}
              isActive={d.id === activeDossier?.id}
              cloudStatus={cloudStatusOf(d.id)}
              syncLoading={syncingIds.has(d.id)}
              onLoad={() => handleLoad(d.id)}
              onDelete={() => setConfirmDelete(d.id)}
              onDuplicate={() => handleDuplicate(d.id)}
              onExport={() => exportDossier(d.id)}
              onPushCloud={() => handlePushCloud(d)}
              onPullCloud={() => handlePullCloud(d.id)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && viewMode === "list" && (
        <div className="space-y-1.5">
          {/* En-têtes */}
          <div className="hidden lg:grid grid-cols-3 gap-3 px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Dossier</span><span>Description</span><span className="text-right">Modifié</span>
          </div>
          {filtered.map(d => (
            <DossierRow
              key={d.id}
              dossier={d}
              isActive={d.id === activeDossier?.id}
              cloudStatus={cloudStatusOf(d.id)}
              syncLoading={syncingIds.has(d.id)}
              onLoad={() => handleLoad(d.id)}
              onDelete={() => setConfirmDelete(d.id)}
              onDuplicate={() => handleDuplicate(d.id)}
              onExport={() => exportDossier(d.id)}
              onPushCloud={() => handlePushCloud(d)}
            />
          ))}
        </div>
      )}

      {/* ── Analyse Document IA ── */}
      <div className="kpi-depth rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold">Analyse Document IA</h3>
          <span className="ml-auto text-[10px] text-muted-foreground">PDF · XLSX · XLS · CSV</span>
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleAiAnalyze(f); }}
          onClick={() => aiFileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 py-8 ${
            isDragging ? "border-accent/70 bg-accent/5" : "border-border/50 hover:border-accent/40"
          }`}
        >
          <input ref={aiFileInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv" className="hidden"
            aria-label="Sélectionner un document financier pour analyse IA"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleAiAnalyze(f); e.target.value = ""; }} />
          {aiLoading
            ? <><Loader2 className="w-8 h-8 text-accent animate-spin" /><p className="text-xs text-muted-foreground">Analyse en cours…</p></>
            : <><FileUp className="w-8 h-8 text-muted-foreground/40" />
               <p className="text-sm font-medium">Déposez un document financier</p>
               <p className="text-xs text-muted-foreground">ou cliquez pour sélectionner</p></>
          }
        </div>
        {aiError && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {aiError}
          </div>
        )}
        {aiResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-accent" /> {aiResult.fileName}
              </span>
              <button type="button" onClick={() => setAiResult(null)}
                className="p-1 rounded hover:bg-muted text-muted-foreground" aria-label="Fermer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Résumé</p>
              <p className="text-xs leading-relaxed">{aiResult.analysis.summary}</p>
            </div>
            {aiResult.analysis.alerts.length > 0 && (
              <div className="space-y-1.5">
                {aiResult.analysis.alerts.map((a, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs border ${
                    a.type === "critique" ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : a.type === "avertissement" ? "bg-amber-400/10 border-amber-400/20 text-amber-300"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {a.message}
                  </div>
                ))}
              </div>
            )}
            {Object.keys(aiResult.analysis.keyRatios).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(aiResult.analysis.keyRatios).slice(0, 6).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-muted/30 border border-border/30 px-3 py-2">
                    <p className="text-[9px] text-muted-foreground truncate">{k}</p>
                    <p className="text-xs font-bold truncate">{String(v)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
