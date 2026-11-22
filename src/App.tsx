import { useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppShell from "@/components/AppShell";
import Dashboard from "@/pages/Dashboard";
import Practice from "@/pages/Practice";
import PracticeQueue from "@/pages/PracticeQueue";
import Camera from "@/pages/Camera";
import Review from "@/pages/Review";
import Library from "@/pages/Library";
import Settings from "@/pages/Settings";
import { useStore } from "@/store/useStore";

function AppShellWithGame() {
  const location = useLocation();
  if (location.pathname.startsWith("/game")) {
    return <GameRedirect />;
  }
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/practice" element={<PracticeQueue />} />
        <Route path="/practice/:char" element={<Practice />} />
        <Route path="/camera" element={<Camera />} />
        <Route path="/review" element={<Review />} />
        <Route path="/library" element={<Library />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

function GameRedirect() {
  return <Navigate to="/game/index.html" replace />;
}

export default function App() {
  const init = useStore((s) => s.init);
  const ready = useStore((s) => s.ready);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <Router>
      {ready ? <AppShellWithGame /> : (
        <div className="grid h-[60vh] place-items-center text-sm text-ink-faint">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-cinnabar" />
        </div>
      )}
    </Router>
  );
}
