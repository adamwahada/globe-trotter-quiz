import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ActivityTracker } from "@/components/Auth/ActivityTracker";
import { GameProvider } from "@/contexts/GameContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { ToastContainer } from "@/components/Toast/ToastContainer";
import { AdminRoute } from "@/components/Admin/AdminRoute";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import Index from "./pages/Index";
import WaitingRoom from "./pages/WaitingRoom";
import GamePage from "./pages/GamePage";
import NotFound from "./pages/NotFound";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminFeedback } from "./pages/AdminFeedback";
import { AdminMessagesPage } from "./pages/AdminMessagesPage";
import { AdminBans } from "./pages/AdminBans";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <AdminProvider>
            <ActivityTracker />
            <SoundProvider>
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
                      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="feedback" element={<AdminFeedback />} />
                        <Route path="messages" element={<AdminMessagesPage />} />
                        <Route path="bans" element={<AdminBans />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </GameProvider>
            </SoundProvider>
          </AdminProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
