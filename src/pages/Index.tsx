import React, { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar/Navbar";
import { GameSettingsModal } from "@/components/Modal/GameSettingsModal";
import { GameStartSignInModal } from "@/components/Modal/GameStartSignInModal";
import { Button } from "@/components/ui/button";
import { GameRuleCard } from "@/components/RuleCards/GameRuleCard";
import { GameModesSection } from "@/components/LandingPage/GameModesSection";
import { CardSystemSection } from "@/components/LandingPage/CardSystemSection";
import { FeedbackSection } from "@/components/Feedback/FeedbackSection";
import { FAQSection } from "@/components/LandingPage/FAQSection";
import { AuthModal } from "@/components/Auth/AuthModal";
import { GuestJoinModal } from "@/components/Auth/GuestJoinModal";
import { PendingJoinRequestModal } from "@/components/Modal/PendingJoinRequestModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useGame } from "@/contexts/GameContext";
import { useToastContext } from "@/contexts/ToastContext";
import { GameTooltip } from "@/components/Tooltip/GameTooltip";
import { checkUserBan, formatBanMessage } from "@/utils/banUtils";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Play,
  BookOpen,
  Trophy,
  Users,
  Target,
  Lightbulb,
  ChevronDown,
  Dice5,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  User,
  Flag,
  Send,
  SkipForward,
  ZoomIn,
  Volume2,
  LogOut,
  BarChart3,
  Type,
  UserCircle,
  Building,
  Music2,
  Shield,
  Github,
  Linkedin,
  BookHeart,
} from "lucide-react";
import { FloatingContactIcons } from "@/components/Contact/FloatingContactIcons";
import { ProjectStoryModal } from "@/components/Contact/ProjectStoryModal";

// Use public path for preloaded image - matches index.html preload
const worldMapBg = "/world-map-bg.webp";

const Index = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { isAdmin } = useAdmin();
  const { hasActiveSession, session, resumeSession, checkActiveSession, error: gameError, joinSessionAsGuest, restoreApprovedSession } = useGame();
  const { addToast } = useToastContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const carouselRef = useRef<HTMLDivElement>(null);


  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [feedbackAuthOpen, setFeedbackAuthOpen] = useState(false);
  const [guestJoinOpen, setGuestJoinOpen] = useState(false);
  const [pendingGuestCode, setPendingGuestCode] = useState<string | null>(null);
  const [authForInviteOpen, setAuthForInviteOpen] = useState(false);
  const [gameAuthOpen, setGameAuthOpen] = useState(false);
  const [gameAuthMode, setGameAuthMode] = useState<'signin' | 'signup'>('signin');
  const [gameStartSignInOpen, setGameStartSignInOpen] = useState(false);
  const [inviteChoiceOpen, setInviteChoiceOpen] = useState(false);
  const [projectStoryOpen, setProjectStoryOpen] = useState(false);
  const [pendingJoinInfo, setPendingJoinInfo] = useState<{
    code: string;
    playerId: string;
    username: string;
    avatar: string;
    color: string;
    isGuest: boolean;
  } | null>(null);

  const { isLoading: authLoading } = useAuth();

  // Check for active session on mount and auto-redirect if one exists
  useEffect(() => {
    // Wait for auth to finish loading before checking sessions
    if (authLoading) return;

    const check = async () => {
      const hasSession = await checkActiveSession();
      setIsCheckingSession(false);

      // Auto-redirect to the active session if one exists
      if (hasSession && isAuthenticated) {
        try {
          const sessionStatus = await resumeSession();
          if (sessionStatus) {
            if (sessionStatus === 'waiting' || sessionStatus === 'countdown') {
              navigate('/waiting-room');
            } else if (sessionStatus === 'playing') {
              navigate('/game');
            }
          }
        } catch (err) {
          console.error('[Index] Auto-redirect failed:', err);
        }
      }
    };
    check();
  }, [checkActiveSession, isAuthenticated, resumeSession, navigate, authLoading]);

  // Handle invite link with ?join=CODE parameter
  useEffect(() => {
    const joinCode = searchParams.get("join");
    if (joinCode && !isCheckingSession) {
      const code = joinCode.toUpperCase();
      setInviteCode(code);
      setSearchParams({});

      // Always allow invite links to proceed — the join functions
      // already check capacity internally. If there's stale recovery
      // data from a previous session, don't let it silently block
      // the invite flow.
      if (isAuthenticated) {
        // Authenticated users get to choose: join with account or as guest
        setPendingGuestCode(code);
        setInviteChoiceOpen(true);
      } else {
        // Non-authenticated users get the guest join modal
        setPendingGuestCode(code);
        setGuestJoinOpen(true);
      }
    }
  }, [searchParams, setSearchParams, isCheckingSession, isAuthenticated, addToast]);

  const handleGuestJoin = async (username: string) => {
    if (!pendingGuestCode) return;
    const success = await joinSessionAsGuest(pendingGuestCode, username);
    if (success) {
      setGuestJoinOpen(false);
      navigate('/waiting-room');
      return;
    }
    // Check if a join request was submitted (closed room)
    const pendingRaw = localStorage.getItem('pendingJoinRequest');
    if (pendingRaw) {
      try {
        const pending = JSON.parse(pendingRaw);
        if (pending.code === pendingGuestCode) {
          setGuestJoinOpen(false);
          setPendingJoinInfo(pending);
          return;
        }
      } catch { /* ignore */ }
    }
    throw new Error('Could not join session. Please try again.');
  };



  const handleStartGame = async () => {
    if (!isAuthenticated) {
      setGameStartSignInOpen(true);
      return;
    } else if (hasActiveSession) {
      addToast("info", "You have an active session. Resume or leave it first.");
    } else {
      // Check for active ban before opening modal (non-blocking on failure)
      if (user?.id) {
        try {
          const ban = await checkUserBan(user.id);
          if (ban) {
            addToast("error", formatBanMessage(ban), 6000);
            return;
          }
        } catch {
          // Ban check failed — allow play to continue
          console.warn('[handleStartGame] Ban check failed, allowing play');
        }
      }
      setGameModalOpen(true);
    }
  };


  const handleResumeGame = async () => {
    if (!isAuthenticated) {
      setGameStartSignInOpen(true);
      return;
    }

    const sessionStatus = await resumeSession();
    if (sessionStatus) {
      // Navigate based on the returned session status (avoids stale closure)
      if (sessionStatus === "waiting" || sessionStatus === "countdown") {
        navigate("/waiting-room");
      } else if (sessionStatus === "playing") {
        navigate("/game");
      }
    } else {
      // resumeSession already cleared zombie state — UI will update
      addToast("error", "Session expired or no longer available");
    }
  };

  const ruleCards = [
    { step: 1, title: t("ruleStep1Title"), description: t("ruleStep1Desc"), icon: Dice5 },
    { step: 2, title: t("ruleStep2Title"), description: t("ruleStep2Desc"), icon: MapPin },
    { step: 3, title: t("ruleStep3Title"), description: t("ruleStep3Desc"), icon: Trophy },
    { step: 4, title: t("ruleStep4Title"), description: t("ruleStep4Desc"), icon: Lightbulb },
  ];

  const hints = [
    {
      icon: Type,
      title: t("hintLetter"),
      description: t("hintLetterDesc"),
      cost: t("hintLetterCost"),
      color: "text-warning",
    },
    {
      icon: User,
      title: t("hintPerson"),
      description: t("hintPersonDesc"),
      cost: t("hintPersonCost"),
      color: "text-info",
    },
    {
      icon: Flag,
      title: t("hintFlag"),
      description: t("hintFlagDesc"),
      cost: t("hintFlagCost"),
      color: "text-destructive",
    },
    {
      icon: Building,
      title: t("hintCapitalTitle"),
      description: t("hintCapitalDesc"),
      cost: t("hintCapitalCost"),
      color: "text-purple-400",
    },
    {
      icon: Trophy,
      title: t("hintPlayerTitle"),
      description: t("hintPlayerDesc"),
      cost: t("hintPlayerCost"),
      color: "text-green-400",
    },
    {
      icon: Music2,
      title: t("hintSingerTitle"),
      description: t("hintSingerDesc"),
      cost: t("hintSingerCost"),
      color: "text-pink-400",
    },
  ];

  const scoring = [
    { points: "3", label: t("pointsCorrect"), description: t("pointsCorrectDesc"), color: "text-success" },
    { points: "2", label: t("pointsClose"), description: t("pointsCloseDesc"), color: "text-info" },
    { points: "0", label: t("pointsSkip"), description: t("pointsSkipDesc"), color: "text-muted-foreground" },
    { points: "-1", label: t("pointsHint"), description: t("pointsHintDesc"), color: "text-warning" },
  ];

  const buttonGuide = [
    { icon: Dice5, title: t("buttonDice"), description: t("buttonDiceDesc"), color: "bg-primary/20 text-primary" },
    { icon: Send, title: t("buttonSubmit"), description: t("buttonSubmitDesc"), color: "bg-success/20 text-success" },
    {
      icon: SkipForward,
      title: t("buttonSkip"),
      description: t("buttonSkipDesc"),
      color: "bg-muted text-muted-foreground",
    },
    {
      icon: Type,
      title: t("buttonHintLetter"),
      description: t("buttonHintLetterDesc"),
      color: "bg-warning/20 text-warning",
    },
    { icon: User, title: t("buttonHintPerson"), description: t("buttonHintPersonDesc"), color: "bg-info/20 text-info" },
    {
      icon: Flag,
      title: t("buttonHintFlag"),
      description: t("buttonHintFlagDesc"),
      color: "bg-destructive/20 text-destructive",
    },
    {
      icon: Target,
      title: t("buttonRecenter"),
      description: t("buttonRecenterDesc"),
      color: "bg-accent text-accent-foreground",
    },
    { icon: MapPin, title: t("buttonLocate"), description: t("buttonLocateDesc"), color: "bg-primary/20 text-primary" },
    {
      icon: ZoomIn,
      title: t("buttonZoom"),
      description: t("buttonZoomDesc"),
      color: "bg-accent text-accent-foreground",
    },
    {
      icon: BarChart3,
      title: t("buttonLeaderboard"),
      description: t("buttonLeaderboardDesc"),
      color: "bg-primary/20 text-primary",
    },
    {
      icon: Volume2,
      title: t("buttonSound"),
      description: t("buttonSoundDesc"),
      color: "bg-muted text-muted-foreground",
    },
    {
      icon: LogOut,
      title: t("buttonQuit"),
      description: t("buttonQuitDesc"),
      color: "bg-destructive/20 text-destructive",
    },
  ];

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 320;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden custom-scrollbar-slim">
      {/* Background World Map Image */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${worldMapBg})`,
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />

      {/* Navigation */}
      <Navbar />

      {/* Hero Section - No animation delay for instant first paint */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display text-foreground mb-4 tracking-wider animate-fade-in" style={{ animationDelay: '0.05s', animationFillMode: 'backwards' }}>
            {t("heroTitle")}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">{t("heroSubtitle")}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Resume Play Button - Show if has active session */}
            {hasActiveSession && !isCheckingSession && (
              <GameTooltip content="Resume your active game session" position="bottom">
                <Button variant="hero" size="xl" onClick={handleResumeGame} className="glow-red pulse-glow gap-2">
                  <RotateCcw className="h-6 w-6" />
                  Resume Play
                </Button>
              </GameTooltip>
            )}

            {/* Start New Game Button */}
            <GameTooltip
              content={hasActiveSession ? "Leave current session to start new" : "Start a new game session"}
              position="bottom"
            >
              <Button
                variant={hasActiveSession ? "outline" : "hero"}
                size="xl"
                onClick={handleStartGame}
                className={!hasActiveSession ? "glow-red pulse-glow" : ""}
                disabled={hasActiveSession}
              >
                <Play className="h-6 w-6" />
                {t("startGame")}
              </Button>
            </GameTooltip>

            <Button
              variant="outline"
              size="xl"
              onClick={() => document.getElementById("rules")?.scrollIntoView({ behavior: "smooth" })}
            >
              <BookOpen className="h-5 w-5" />
              {t("howToPlay")}
            </Button>

            {isAdmin && (
              <Button
                variant="outline"
                size="xl"
                onClick={() => navigate("/admin")}
                className="border-primary/60 text-primary hover:bg-primary/10"
              >
                <Shield className="h-5 w-5" />
                Admin Dashboard
              </Button>
            )}
          </div>

          {/* Active Session Indicator */}
          {hasActiveSession && !isCheckingSession && (
            <div className="mt-6 p-4 bg-primary/20 border border-primary/30 rounded-xl inline-block">
              <p className="text-primary text-sm">
                🎮 You have an active game session. Click "Resume Play" to continue.
              </p>
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-muted-foreground" />
        </div>
      </section>

      {/* Rules Section - Horizontal Carousel */}
      <section id="rules" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display text-foreground text-center mb-4 px-4">{t("rulesTitle")}</h2>
          <p className="text-center text-muted-foreground mb-10 px-4">{t("rulesSubtitle")}</p>

          {/* Carousel Navigation */}
          <div className="relative">
            <button
              onClick={() => scrollCarousel("left")}
              aria-label="Scroll left"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/80 backdrop-blur border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors md:left-4"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              onClick={() => scrollCarousel("right")}
              aria-label="Scroll right"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/80 backdrop-blur border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors md:right-4"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Scrollable Carousel */}
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide px-12 md:px-20 py-4 snap-x snap-mandatory"
            >
              {ruleCards.map((card, index) => (
                <div key={index} className="snap-center" style={{ animationDelay: `${index * 150}ms` }}>
                  <GameRuleCard step={card.step} title={card.title} description={card.description} icon={card.icon} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <GameModesSection />

      {/* Features Section - moved up */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <UserCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-display text-foreground">{t("featureSoloMode")}</h3>
              <p className="text-muted-foreground">{t("featureSoloModeDesc")}</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-display text-foreground">{t("featureMultiplayer")}</h3>
              <p className="text-muted-foreground">{t("featureMultiplayerDesc")}</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-display text-foreground">{t("featureInteractiveMap")}</h3>
              <p className="text-muted-foreground">{t("featureInteractiveMapDesc")}</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-display text-foreground">{t("featureLeaderboard")}</h3>
              <p className="text-muted-foreground">{t("featureLeaderboardDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Hints Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display text-foreground text-center mb-4">{t("hintsTitle")}</h2>
          <p className="text-center text-muted-foreground mb-12">{t("hintsSubtitle")}</p>

          <div className="grid md:grid-cols-3 gap-6">
            {hints.map((hint, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl rounded-2xl p-6 border border-primary/30 text-center transition-all duration-300 hover:scale-105 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div
                  className={`w-16 h-16 rounded-full bg-card/80 border border-primary/30 flex items-center justify-center mx-auto mb-4 ${hint.color}`}
                >
                  <hint.icon className="h-8 w-8" />
                </div>

                <h3 className="relative text-xl font-display text-foreground mb-2">{hint.title}</h3>
                <p className="relative text-sm text-muted-foreground mb-4">{hint.description}</p>
                <p className={`relative text-lg font-bold ${hint.color}`}>{hint.cost}</p>

                <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display text-foreground text-center mb-4">{t("scoringTitle")}</h2>
          <p className="text-center text-muted-foreground mb-12">{t("scoringSubtitle")}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {scoring.map((item, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl rounded-2xl p-6 border border-primary/30 text-center transition-all duration-300 hover:scale-105 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Points with neon glow */}
                <p className={`relative text-5xl font-display mb-2 ${item.color} drop-shadow-[0_0_15px_currentColor]`}>
                  {item.points}
                </p>

                {/* Label */}
                <p className="relative text-base font-semibold text-foreground mb-2">{item.label}</p>

                {/* Description */}
                <p className="relative text-sm text-muted-foreground">{item.description}</p>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Button Guide Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display text-foreground text-center mb-4">
            {t("buttonGuideTitle")}
          </h2>
          <p className="text-center text-muted-foreground mb-12">{t("buttonGuideSubtitle")}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {buttonGuide.map((button, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl rounded-xl p-4 border border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${button.color} flex items-center justify-center shrink-0`}>
                    <button.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm mb-1">{button.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{button.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Card System Section */}
      <CardSystemSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Feedback Section */}
      <FeedbackSection onLoginRequest={() => setFeedbackAuthOpen(true)} />

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display text-foreground mb-6">{t("ctaTitle")}</h2>
          <p className="text-muted-foreground mb-8">{t("ctaSubtitle")}</p>
          <Button
            variant="hero"
            size="xl"
            onClick={hasActiveSession ? handleResumeGame : handleStartGame}
            className="glow-red"
          >
            <Play className="h-6 w-6" />
            {hasActiveSession ? "Resume Play" : t("startGame")}
          </Button>
        </div>
      </section>

      {/* Floating Contact Icons */}
      <FloatingContactIcons onProjectStoryClick={() => setProjectStoryOpen(true)} />
      <ProjectStoryModal isOpen={projectStoryOpen} onClose={() => setProjectStoryOpen(false)} />

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6">
            <GameTooltip content="Contact me on: LinkedIn" position="top">
              <a
                href="https://www.linkedin.com/in/adam-wahada-1828aa266/"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-10 h-10 rounded-full border border-border bg-card/60 flex items-center justify-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:scale-110 hover:shadow-[0_0_20px_hsl(357_92%_47%/0.3)]"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
              </a>
            </GameTooltip>
            <GameTooltip content="Contact me on: GitHub" position="top">
              <a
                href="https://github.com/adamwahada"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-10 h-10 rounded-full border border-border bg-card/60 flex items-center justify-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:scale-110 hover:shadow-[0_0_20px_hsl(357_92%_47%/0.3)]"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
              </a>
            </GameTooltip>
            <GameTooltip content="The story behind this project" position="top">
              <button
                onClick={() => setProjectStoryOpen(true)}
                className="group w-10 h-10 rounded-full border border-border bg-card/60 flex items-center justify-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:scale-110 hover:shadow-[0_0_20px_hsl(357_92%_47%/0.3)]"
                aria-label="Project Story"
              >
                <BookHeart className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
              </button>
            </GameTooltip>
        </div>
      </footer>

      <GameSettingsModal
        isOpen={gameModalOpen}
        onClose={() => {
          setGameModalOpen(false);
          setInviteCode(null);
        }}
        initialJoinCode={inviteCode}
      />

      <AuthModal
        isOpen={feedbackAuthOpen}
        onClose={() => setFeedbackAuthOpen(false)}
        initialMode="signin"
      />

      {/* Welcome modal for unauthenticated users - Game Start */}
      <GameStartSignInModal
        isOpen={gameStartSignInOpen}
        onClose={() => setGameStartSignInOpen(false)}
        onSignIn={() => {
          setGameStartSignInOpen(false);
          setGameAuthMode('signin');
          setGameAuthOpen(true);
        }}
        onJoin={() => {
          setGameStartSignInOpen(false);
          setGameAuthMode('signup');
          setGameAuthOpen(true);
        }}
      />

      {/* Auth modal triggered from Game Start modal */}
      <AuthModal
        isOpen={gameAuthOpen}
        onClose={() => setGameAuthOpen(false)}
        initialMode={gameAuthMode}
      />

      {/* Auth modal triggered from guest modal "sign in" button */}
      <AuthModal
        isOpen={authForInviteOpen}
        onClose={() => setAuthForInviteOpen(false)}
        initialMode="signin"
      />

      {/* Guest join modal — shown for non-authenticated users with an invite link */}
      <GuestJoinModal
        isOpen={guestJoinOpen}
        sessionCode={pendingGuestCode || ''}
        onJoin={handleGuestJoin}
        onClose={() => setGuestJoinOpen(false)}
        onSignIn={() => {
          setGuestJoinOpen(false);
          setAuthForInviteOpen(true);
        }}
      />

      {/* Invite link choice modal — shown for authenticated users to choose account vs guest */}
      {inviteChoiceOpen && pendingGuestCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setInviteChoiceOpen(false); setPendingGuestCode(null); }} />
          <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display text-foreground">Join Session</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Session <span className="text-primary font-display tracking-wider">{pendingGuestCode}</span>
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="netflix"
                className="w-full py-6 gap-3"
                onClick={() => {
                  setInviteChoiceOpen(false);
                  setInviteCode(pendingGuestCode);
                  setGameModalOpen(true);
                }}
              >
                <UserCircle className="h-5 w-5" />
                Join with my account ({user?.username})
              </Button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-sm">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button
                variant="outline"
                className="w-full py-6 gap-3"
                onClick={() => {
                  setInviteChoiceOpen(false);
                  setGuestJoinOpen(true);
                }}
              >
                <User className="h-5 w-5" />
                Join as guest
              </Button>
            </div>

            <button
              onClick={() => { setInviteChoiceOpen(false); setPendingGuestCode(null); }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <span className="text-muted-foreground text-lg">✕</span>
            </button>
          </div>
        </div>
      )}

      {/* Pending join request modal — shown when a join request was submitted to a closed room */}
      {pendingJoinInfo && (
        <PendingJoinRequestModal
          sessionCode={pendingJoinInfo.code}
          playerId={pendingJoinInfo.playerId}
          username={pendingJoinInfo.username}
          avatar={pendingJoinInfo.avatar}
          color={pendingJoinInfo.color}
          isGuest={pendingJoinInfo.isGuest}
          onApproved={async () => {
            const info = pendingJoinInfo;
            localStorage.removeItem('pendingJoinRequest');
            const restored = await restoreApprovedSession(info.code, info.playerId);
            setPendingJoinInfo(null);
            if (restored) {
              navigate('/waiting-room');
            } else {
              addToast('error', 'Failed to join after approval. Please try again.');
            }
          }}
          onCancel={() => {
            localStorage.removeItem('pendingJoinRequest');
            setPendingJoinInfo(null);
          }}
        />
      )}
    </div>
  );
};

export default Index;
