import PageHeader from "@/components/kenenergie/PageHeader";
import { companyInfo, parametres, formatPct } from "@/lib/kenenergie-data";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="bg-primary px-5 py-3">
        <h2 className="text-primary-foreground font-semibold text-sm uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0 gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-mono font-semibold text-foreground whitespace-nowrap">{value}</span>
    </div>
  );
}

export default function Parametres() {
  const f = parametres.finances;
  const n = parametres.niveauxActivite;
  const c = parametres.couts;
  const o = parametres.operations;
  const v = parametres.variabilitéCharges;

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres du Projet" subtitle="Hypothèses financières, commerciales et opérationnelles" badge="Modèle de base" />

      {/* Identification */}
      <Section title="Identification de l'entreprise">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <Row label="Raison Sociale" value={companyInfo.name} />
          <Row label="Promoteur" value={companyInfo.promoteur} />
          <Row label="Forme juridique" value={companyInfo.formeJuridique} />
          <Row label="Ville" value={`${companyInfo.ville}, ${companyInfo.pays}`} />
          <Row label="Téléphone" value={companyInfo.telephone} />
          <Row label="E-mail" value={companyInfo.email} />
          <Row label="Activité principale" value="Infrastructures Électriques BT/HTA/HTB" />
          <Row label="Date du projet" value={companyInfo.dateProjet} />
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finances */}
        <Section title="Paramètres Financiers">
          <Row label="Capital social initial" value={`${f.capitalSocial.toLocaleString("fr-FR")} FCFA`} />
          <Row label="Augmentation de capital" value={`${f.augmentationCapital.toLocaleString("fr-FR")} FCFA`} />
          <Row label="Endettement à long terme" value={`${f.endettementLT.toLocaleString("fr-FR")} FCFA`} />
          <Row label="Comptes courants associés" value={`${f.comptesCourantsAssocies.toLocaleString("fr-FR")} FCFA`} />
          <Row label="Taux d'intérêt statutaire" value={formatPct(f.txInteretStatutaire)} />
          <Row label="Taux de distribution" value={formatPct(f.txDistributionBenefices)} />
          <Row label="Taux d'intérêt emprunt LT" value={formatPct(f.txInteretEmpruntLT)} />
          <Row label="Taux d'impôt sur les sociétés" value={formatPct(f.tauxImpotSocietes)} />
        </Section>

        {/* Niveaux activité */}
        <Section title="Niveaux d'Activité">
          <Row label="Année N (2027)" value={formatPct(n.n)} />
          <Row label="Année N+1 (2028)" value={formatPct(n.n1)} />
          <Row label="Année N+2 (2029)" value={formatPct(n.n2)} />
          <Row label="Année N+3 (2030)" value={formatPct(n.n3)} />
          <Row label="Année N+4 (2031)" value={formatPct(n.n4)} />
          <div className="mt-3 pt-3 border-t border-border/40">
            <Row label="Taux d'augmentation des salaires" value={formatPct(c.tauxAugmentationSalaires)} />
            <Row label="Taux de matière première" value={formatPct(c.tauxMatierePremiere)} />
            <Row label="Taux des autres achats" value={formatPct(c.tauxAutresAchats)} />
          </div>
        </Section>

        {/* Operations */}
        <Section title="Paramètres Opérationnels">
          <Row label="Durée dette fournisseur" value={`${o.duretteDetteFournisseur} jours`} />
          <Row label="Taux achat cash fournisseur" value={formatPct(o.tauxAchatCashFournisseur)} />
          <Row label="Durée dette client publics" value={`${o.dureeDettClientPublic} jours`} />
          <Row label="Durée dette client privés" value={`${o.dureeDettClientPrive} jours`} />
          <Row label="% ventes clients publics" value={formatPct(o.pctVentesPublics)} />
          <Row label="% ventes clients privés" value={formatPct(o.pctVentesPrives)} />
          <Row label="Durée moyenne encours" value={`${o.dureeMoyenneEncours} jours`} />
          <Row label="Durée stockage matières" value={`${o.dureeMoyenneStockageMatiere} jours`} />
        </Section>

        {/* Variabilité */}
        <Section title="Variabilité des Charges">
          <Row label="Achats matières et équipements" value={formatPct(v.achatsMatieres)} />
          <Row label="Autres achats" value={formatPct(v.autresAchats)} />
          <Row label="Sous-traitance" value={formatPct(v.soustraitance)} />
          <Row label="Transport" value={formatPct(v.transport)} />
          <Row label="Services extérieurs (location)" value={formatPct(v.servicesExterieursLocation)} />
          <Row label="Services extérieurs (assurances)" value={formatPct(v.servicesExterieursAssurance)} />
          <Row label="Impôts et taxes" value={formatPct(v.impotsTaxes)} />
          <Row label="Charges du personnel" value={formatPct(v.chargesPersonnel)} />
          <Row label="Frais financiers" value={formatPct(v.fraisFinanciers)} />
          <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-2 gap-3">
            <div className="bg-secondary/60 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Charges Variables</p>
              <p className="text-lg font-bold text-accent">58%</p>
            </div>
            <div className="bg-secondary/60 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Charges Fixes</p>
              <p className="text-lg font-bold text-primary">42%</p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
