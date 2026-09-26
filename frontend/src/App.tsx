import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { I18nProvider } from "./lib/i18n";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

// Code-split page components loaded on demand to minimize initial homepage bundle
const Home = lazy(() => import("./pages/Home").then((m) => ({ default: m.Home })));
const RiskLookup = lazy(() => import("./pages/RiskLookup").then((m) => ({ default: m.RiskLookup })));
const AskRights = lazy(() => import("./pages/AskRights").then((m) => ({ default: m.AskRights })));
const Resources = lazy(() => import("./pages/Resources").then((m) => ({ default: m.Resources })));
const LocalLedger = lazy(() => import("./pages/LocalLedger").then((m) => ({ default: m.LocalLedger })));
const LedgerImport = lazy(() => import("./pages/LedgerImport").then((m) => ({ default: m.LedgerImport })));

/**
 * Neo-brutalist loading fallback rendered while lazy routes download.
 */
function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-[250px]" role="status" aria-label="Loading page">
      <div className="border-3 border-ink bg-card p-6 shadow-brutal text-center">
        <p className="font-mono text-sm uppercase tracking-wider font-bold">
          Loading WageGuard...
        </p>
      </div>
    </div>
  );
}

/**
 * Main application shell wiring routing, bilingual i18n context,
 * responsive layout, and neo-brutalist theme.
 */
export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <div className="min-h-screen flex flex-col bg-bg text-ink selection:bg-accent selection:text-ink font-body">
          <Header />
          <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8">
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/risk" element={<RiskLookup />} />
                <Route path="/rights" element={<AskRights />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/ledger" element={<LocalLedger />} />
                <Route path="/ledger/import" element={<LedgerImport />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </I18nProvider>
    </BrowserRouter>
  );
}
