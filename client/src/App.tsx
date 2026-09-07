import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SupabaseAuthProvider, useSupabaseAuth } from "./contexts/SupabaseAuthContext";
import AuthPage from "./pages/Auth";
import Home from "./pages/Home";

function AuthGate() {
  const { authUser, loading } = useSupabaseAuth();
  if (loading) return <div className="auth-loading"><Loader2 size={22} className="spin" /><span>Restoring your AERS session…</span></div>;
  return authUser ? <Home /> : <AuthPage />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <SupabaseAuthProvider>
          <TooltipProvider>
            <Toaster />
            <AuthGate />
          </TooltipProvider>
        </SupabaseAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
