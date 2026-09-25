/**
 * App shell — routing lives here.
 * See .agents/workflows/05-build-frontend.md for the four pages to build:
 * Home, RiskLookup, AskRights, Resources.
 */
export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="border-3 border-ink bg-surface shadow-brutal p-8 max-w-md text-center">
        <h1 className="font-heading text-2xl mb-2">WageGuard India</h1>
        <p className="text-sm">
          वेतन रक्षक — Know your risk. Know your rights.
        </p>
        <p className="text-xs mt-4 text-ink/70">
          Scaffold ready. Build pages per .agents/workflows/05-build-frontend.md.
        </p>
      </div>
    </main>
  );
}
