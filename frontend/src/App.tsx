import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { I18nProvider } from "./lib/i18n";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { RiskLookup } from "./pages/RiskLookup";
import { AskRights } from "./pages/AskRights";
import { Resources } from "./pages/Resources";
import { LocalLedger } from "./pages/LocalLedger";
import { LedgerImport } from "./pages/LedgerImport";

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
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/risk" element={<RiskLookup />} />
              <Route path="/rights" element={<AskRights />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/ledger" element={<LocalLedger />} />
              <Route path="/ledger/import" element={<LedgerImport />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </I18nProvider>
    </BrowserRouter>
  );
}
