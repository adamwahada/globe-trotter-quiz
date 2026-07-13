import { useEffect, lazy, Suspense } from "react";
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
import { GuestTimerBanner } from "@/components/Guest/GuestTimerBanner";

// Lazy-loaded routes for code splitting
const Index = lazy(() => import("./pages/Index"));
const WaitingRoom = lazy(() => import("./pages/WaitingRoom"));
const GamePage = lazy(() => import("./pages/GamePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProjectStory = lazy(() => import("./pages/ProjectStory"));
const AdminRoute = lazy(() => import("@/components/Admin/AdminRoute").then(m => ({ default: m.AdminRoute })));
const AdminLayout = lazy(() => import("@/components/Admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AdminFeedback = lazy(() => import("./pages/AdminFeedback").then(m => ({ default: m.AdminFeedback })));
const AdminMessagesPage = lazy(() => import("./pages/AdminMessagesPage").then(m => ({ default: m.AdminMessagesPage })));
const AdminBans = lazy(() => import("./pages/AdminBans").then(m => ({ default: m.AdminBans })));

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[App] Unhandled rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
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
                  <GuestTimerBanner />
                  <BrowserRouter>
                    <Suspense fallback={null}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/waiting-room" element={<WaitingRoom />} />
                        <Route path="/game" element={<GamePage />} />
                        <Route path="/project-story" element={<ProjectStory />} />
                        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                          <Route index element={<AdminDashboard />} />
                          <Route path="feedback" element={<AdminFeedback />} />
                          <Route path="messages" element={<AdminMessagesPage />} />
                          <Route path="bans" element={<AdminBans />} />
                        </Route>
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
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
};

export default App;