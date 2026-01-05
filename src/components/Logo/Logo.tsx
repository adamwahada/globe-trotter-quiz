import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import worldMapBg from "../public/world-map-bg.webp";

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

  return (
    <Link to="/" onClick={handleClick} className="flex items-center transition-transform duration-300 hover:scale-105">
      <img
        src={worldQuizLogo}
        alt="World Quiz"
        className={`${sizeClasses[size]} w-auto object-contain animate-logo-glow hover:drop-shadow-[0_0_30px_rgba(220,38,38,0.8)] transition-all duration-300`}
      />
    </Link>
  );
};
