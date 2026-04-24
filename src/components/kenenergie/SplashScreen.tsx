import { useState, useRef } from "react";
import { FolderOpen, FolderPlus, Upload, ChevronRight, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParametres } from "@/contexts/ParametresContext";
import type { Dossier } from "@/contexts/ParametresContext";
import logoThePlug from "@/assets/logo-the-plug.png";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function NewDossierPanel({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (nom: string, client: string, description: string) => void;
}) {
  const [nom, setNom] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-[slide-up-fade_0.2s_ease]">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-primary/20">
            <FolderPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Nouveau Dossier</h2>
            <p className="text-xs text-white/50">Créer un nouveau projet financier</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-white/60 block mb-1">Nom du dossier *</label>
            <Input autoFocus value={nom} onChange={e => setNom(e.target.value)}
              placeholder="ex: Mon Projet SARL — BP 2027" className="h-9 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-white/60 block mb-1">Client / Promoteur</label>
            <Input value={client} onChange={e => setClient(e.target.value)}
              placeholder="ex: KENGOUM NGASSA" className="h-9 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-white/60 block mb-1">Description</label>
            <Input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="ex: Business Plan 2027–2031" className="h-9 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button type="button" variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10" onClick={onClose}>Annuler</Button>
          <Button type="button" className="flex-1 gap-2 bg-accent hover:bg-accent/90 text-white" disabled={!nom.trim()}
            onClick={() => onCreate(nom.trim(), client.trim(), description.trim())}>
            <FolderPlus className="w-4 h-4" /> Créer & Charger
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SplashScreenProps {
  onDismiss: () => void;
}

export default function SplashScreen({ onDismiss }: SplashScreenProps) {
  const { allDossiers, loadDossier, createAndLoadDossier, importDossierFile, refreshDossiers } = useParametres();
  const [showNew, setShowNew] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show last 5 dossiers sorted by updatedAt desc
  const recent = [...allDossiers].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 5);

  const handleLoad = (d: Dossier) => {
    loadDossier(d.id);
    onDismiss();
  };

  const handleCreate = (nom: string, client: string, description: string) => {
    createAndLoadDossier(nom, client, description);
    setShowNew(false);
    onDismiss();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importDossierFile(file);
      refreshDossiers();
    } catch {
      alert("Erreur lors de l'importation.");
    }
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-auto py-8"
      style={{ background: "linear-gradient(135deg, hsl(220,60%,10%) 0%, hsl(220,50%,15%) 50%, hsl(186,60%,12%) 100%)" }}>
      {showNew && <NewDossierPanel onClose={() => setShowNew(false)} onCreate={handleCreate} />}
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      <div className="w-full max-w-2xl mx-4 space-y-6 animate-[slide-up-fade_0.35s_ease]">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="relative">
              <img src={logoThePlug} alt="THE PLUG" className="w-20 h-20 object-contain drop-shadow-2xl" />
              <div className="absolute inset-0 rounded-full bg-accent/30 blur-xl scale-150 -z-10" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-widest uppercase">THE PLUG FINANCE CO</h1>
            <p className="text-sm text-white/50 mt-1 tracking-wide">Application de gestion financière professionnelle</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-accent/80 text-xs">
            <Zap className="w-3.5 h-3.5" />
            <span>Sélectionnez ou créez un dossier pour commencer</span>
          </div>
        </div>

        {/* Recent dossiers */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-white">Projets récents</span>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/40">Aucun projet sauvegardé</p>
              <p className="text-xs text-white/25 mt-1">Créez votre premier dossier ci-dessous</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleLoad(d)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 hover:border-accent/40 hover:bg-accent/10 transition-all text-left group"
                >
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-accent/20 transition-colors flex-shrink-0">
                    <FolderOpen className="w-4 h-4 text-white/50 group-hover:text-accent transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{d.nom}</p>
                    <p className="text-xs text-white/40 truncate">
                      {d.client && <span className="mr-2">{d.client}</span>}
                      <span>Modifié le {formatDate(d.updatedAt)}</span>
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="flex flex-col items-center gap-2 px-4 py-5 rounded-xl border border-accent/30 bg-accent/10 hover:bg-accent/20 hover:border-accent/60 transition-all group"
          >
            <FolderPlus className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Nouveau dossier</p>
              <p className="text-xs text-white/40">Créer un projet vierge</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 px-4 py-5 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all group"
          >
            <Upload className="w-6 h-6 text-white/50 group-hover:text-white group-hover:scale-110 transition-all" />
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Importer JSON</p>
              <p className="text-xs text-white/40">Charger un export</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="flex flex-col items-center gap-2 px-4 py-5 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all group"
          >
            <Zap className="w-6 h-6 text-white/50 group-hover:text-white group-hover:scale-110 transition-all" />
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Continuer sans dossier</p>
              <p className="text-xs text-white/40">Mode temporaire</p>
            </div>
          </button>
        </div>

        <p className="text-center text-[10px] text-white/20 tracking-widest uppercase">
          THE PLUG FINANCE CO • Connexion that drives innovation
        </p>
      </div>
    </div>
  );
}
