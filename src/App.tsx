import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ParametresProvider } from "@/contexts/ParametresContext";
import Layout from "@/components/kenenergie/Layout";
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
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ParametresProvider>
    <TooltipProvider>
      <Toaster />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
