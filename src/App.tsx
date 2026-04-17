import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ParametresProvider } from "@/contexts/ParametresContext";
import { AiPanelProvider }   from "@/contexts/AiPanelContext";
import Layout from "@/components/kenenergie/Layout";
import SplashScreen from "@/components/kenenergie/SplashScreen";
import Dashboard from "@/pages/Dashboard";
import Parametres from "@/pages/Parametres";
import Ventes from "@/pages/Ventes";
import Salaires from "@/pages/Salaires";
import Amortissements from "@/pages/Amortissements";
import Charges from "@/pages/Charges";
import Investissements from "@/pages/Investissements";
import Resultats from "@/pages/Resultats";
import Bilan from "@/pages/Bilan";
import Emprunt from "@/pages/Emprunt";
import PlanFinancement from "@/pages/PlanFinancement";
import SeuilRentabilite from "@/pages/SeuilRentabilite";
import SensibiliteScenarios from "@/pages/SensibiliteScenarios";
import SyntheseBancaire from "@/pages/SyntheseBancaire";
import AlertesBancaires from "@/pages/AlertesBancaires";
import Covenants from "@/pages/Covenants";
import RecommandationsAjustements from "@/pages/RecommandationsAjustements";
import Dossiers from "@/pages/Dossiers";
import ConfigurationIA from "@/pages/ConfigurationIA";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function AppInner() {
  const [splashDone, setSplashDone] = useState(false);
  return (
    <>
      {!splashDone && <SplashScreen onDismiss={() => setSplashDone(true)} />}
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/parametres" element={<Parametres />} />
            <Route path="/ventes" element={<Ventes />} />
            <Route path="/salaires" element={<Salaires />} />
            <Route path="/amortissements" element={<Amortissements />} />
            <Route path="/charges" element={<Charges />} />
            <Route path="/investissements" element={<Investissements />} />
            <Route path="/resultats" element={<Resultats />} />
            <Route path="/bilan" element={<Bilan />} />
            <Route path="/emprunt" element={<Emprunt />} />
            <Route path="/plan-financement" element={<PlanFinancement />} />
            <Route path="/seuil-rentabilite" element={<SeuilRentabilite />} />
            <Route path="/sensibilite-scenarios" element={<SensibiliteScenarios />} />
            <Route path="/synthese-bancaire" element={<SyntheseBancaire />} />
            <Route path="/alertes-bancaires" element={<AlertesBancaires />} />
            <Route path="/covenants" element={<Covenants />} />
            <Route path="/recommandations-ajustements" element={<RecommandationsAjustements />} />
            <Route path="/dossiers" element={<Dossiers />} />
            <Route path="/configuration-ia" element={<ConfigurationIA />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ParametresProvider>
      <AiPanelProvider>
        <TooltipProvider>
          <Toaster />
          <AppInner />
        </TooltipProvider>
      </AiPanelProvider>
    </ParametresProvider>
  </QueryClientProvider>
);

export default App;
