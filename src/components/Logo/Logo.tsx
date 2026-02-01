import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

// Use public path for preloaded image - matches index.html preload
const worldQuizLogo = "/world-quiz-logo.webp";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export const Logo: React.FC<LogoProps> = ({ size = "md" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const sizeClasses = {
    sm: "h-14",
    md: "h-20",
    lg: "h-28",
  };

  const handleClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  // Intrinsic dimensions for proper aspect ratio hints
  const dimensions = {
    sm: { height: 56, width: 168 },
    md: { height: 80, width: 240 },
    lg: { height: 112, width: 336 },
  };

  return (
    <Link to="/" onClick={handleClick} className="flex items-center transition-transform duration-300 hover:scale-105">
      <img
        src={worldQuizLogo}
        alt="World Quiz"
        width={dimensions[size].width}
        height={dimensions[size].height}
        sizes={`(max-width: 640px) ${dimensions.sm.width}px, ${dimensions[size].width}px`}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className={`${sizeClasses[size]} w-auto object-contain animate-logo-glow hover:drop-shadow-[0_0_30px_rgba(220,38,38,0.8)] transition-all duration-300`}
      />
    </Link>
  );
};
