import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { GameProvider } from "@/contexts/GameContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { ToastContainer } from "@/components/Toast/ToastContainer";
import Index from "./pages/Index";
import WaitingRoom from "./pages/WaitingRoom";
import GamePage from "./pages/GamePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <SoundProvider>
          <ToastProvider>
            <GameProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <ToastContainer />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/waiting-room" element={<WaitingRoom />} />
                    <Route path="/game" element={<GamePage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </GameProvider>
          </ToastProvider>
        </SoundProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
