## Contexte

Le fichier Excel `KENENERGIE_THEPLUG_Dossier_Banque_v3_fixed.xlsx` contient 26 feuilles avec un modèle financier OHADA/SYSCOHADA complet (PARAMETRES, VENTES, CHARGES, PAIE, PRODUCTION, INVESTISSEMENTS, AMORTISSEMENTS, EMPRUNT, FINANCEMENT, BILANS, CEP, SYNTHESES, TABLEAU DE BORD, ALERTES, COVENANTS). Le logiciel actuel implémente déjà un `ParametresContext` réactif et la plupart des pages, mais :

- La feuille **PARAMETRES** Excel expose ~20 hypothèses (taux USD, capital, CC associés, taux d'intérêt LT/CC/Fournisseur, IS, douanes, risque, distribution bénéfices) dont seulement quelques-unes sont éditables actuellement.
- Le **catalogue des prix de vente** (16 produits/services) et les **quantités vendues annuelles** (VENTES!C/D/E/F/G14:34) ne sont pas éditables ligne par ligne.
- Les formules de **CEP** (Compte d'Exploitation Prévisionnel : VA, EBE, RE, marges, CAF) et de **BILAN** (FRN, BFR, trésorerie, équilibre) ne suivent pas exactement la nomenclature SYSCOHADA du fichier.
- Le **TABLEAU DE BORD** Excel (51 lignes : CR / Bilan / Ratios / Liquidité / DSCR / TIR-VAN) sert de référence visuelle mais le Dashboard actuel diverge.
- L'identité du projet (raison sociale, forme juridique, secteur, capital, dates) est codée en dur sur "KENENERGIE" au lieu d'être un objet `project` éditable.

Les valeurs courantes du logiciel sont conservées (pas de migration des chiffres KENENERGIE).

## Plan d'implémentation (3 phases)

### Phase 1 — Infrastructure projet & PARAMETRES complets
1. Créer `src/lib/project-config.ts` : type `ProjectConfig` (id, raisonSociale, formeJuridique, secteur, promoteur, adresse, dateProjet, devise, logoUrl).
2. Étendre `ParametresContext` avec :
   - `project: ProjectConfig` + setter
   - Hypothèses Excel manquantes : `tauxUsd`, `augmentationCapital`, `ccCaptal` (multiplicateur), `compteCourantAssocie`, `tauxInteretStatutaire`, `tauxDistributionBenef`, `tauxInteretCC`, `tauxInteretFournImmo`, `tauxDouanes`, `tauxRisque`.
3. Refondre la page **Paramètres** en 3 onglets : Identité projet · Hypothèses financières · Hypothèses opérationnelles. Tout éditable, persistance localStorage (clé `kenenergie:project:v2`), bouton « Réinitialiser » et « Exporter/Importer JSON ».
4. Afficher dynamiquement `project.raisonSociale` et le logo dans le `Layout` (sidebar) et le splash, à la place du label codé en dur.

### Phase 2 — Catalogue produits éditable & moteur conforme Excel
1. Créer `productsCatalog: Product[]` dans le contexte (id, label, unite, categorie [Construction/Solaire/Maintenance/Conseil/Négoce], prixUnitaire, quantites: Record<year, number>). Initialiser avec les 16 lignes VENTES du fichier mais valeurs gardées des actuelles si présentes.
2. Refondre `src/pages/Ventes.tsx` : tableau éditable (ajouter/supprimer ligne, modifier prix et quantité par année), totaux par catégorie, total CA = `Σ prix × quantité`.
3. Réécrire `computeModel` pour exposer le **CEP SYSCOHADA** exact :
   ```text
   CA → Production → Marge brute → Valeur Ajoutée (VA = CA − conso. ext.)
        → EBE = VA − charges personnel − impôts/taxes
        → RE  = EBE − dot. amortissements
        → RAO = RE − charges financières
        → RN  = RAO × (1 − tauxIS)
        → CAF = RN + dot. amortissements
   ```
4. Mettre à jour **BILAN** : FRN = (CP + Dettes LT) − Immo nettes ; BFR = AC − PC ; Trésorerie nette = FRN − BFR ; check équilibre Actif=Passif.
5. Recalculer ratios bancaires dans `banking` : Autonomie, Levier, ROE, ROA, Dettes/CAF, DSCR (EBE / service dette), Liquidité = (AC + Trésor) / PC.

### Phase 3 — Tableau de bord conforme + restitution Excel
1. Refondre `src/pages/Dashboard.tsx` pour reproduire les 6 blocs du TABLEAU DE BORD Excel :
   - En-tête « {raisonSociale} · TABLEAU DE BORD FINANCIER BANQUIER » + bandeau THE PLUG
   - Bloc Compte de Résultat (CA, VA, taux VA/CA, EBE, taux EBE/CA, Amort., RE, taux RE/CA, Charges fin., RN, Marge nette, CAF)
   - Bloc Bilan (Immo, AC, Tréso A, Total A, CP, Dettes Fin, PC, Total P, ✅/❌ équilibre)
   - Bloc Ratios bancaires (Autonomie, Levier, ROE, ROA, Dettes/CAF)
   - Bloc Liquidité & BFR (FRN, BFR, Tréso nette, Liquidité générale)
   - Bloc DSCR par année (N+1…N+5)
   - Bloc Rentabilité projet (TRI, VAN @10%, Investissement initial)
   - Note méthodologique OHADA + lien Alertes Bancaires
2. Mettre à jour `ExportPdfButton` pour générer la même structure que la feuille Excel (1 page par bloc).
3. Vérification end-to-end : modifier un prix unitaire → CA, VA, EBE, RN, CAF, ratios, DSCR, TIR/VAN, Dashboard et PDF se mettent tous à jour.

## Détails techniques

- Pas de backend requis ; tout reste dans `ParametresContext` + localStorage versionné.
- `computeModel` reste pure et memoizée ; les nouveaux champs sont ajoutés au type `ComputedModel` exporté.
- Migration douce : si `localStorage` contient l'ancien schéma, fusionner avec defaults et sauvegarder en v2.
- Les pages existantes (Charges, Salaires, Emprunt, Bilan, Résultats, PlanFinancement, SeuilRentabilite, Sensibilité, Alertes, Covenants) consomment les nouveaux champs sans changement majeur ; seuls les libellés sont alignés sur la nomenclature Excel (VA, EBE, RAO, RN, CAF).
- Aucune logique backend / formule fiscale n'est inventée : tout est repris du fichier Excel.

## Hors périmètre

- Multi-utilisateurs / synchronisation cloud (le mode multi-projet reste local).
- Import direct du fichier .xlsx (pourra venir dans une itération suivante via `xlsx` lib).
- Refonte visuelle du thème (les tokens de design restent inchangés).
