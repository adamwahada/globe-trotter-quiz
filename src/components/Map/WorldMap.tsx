import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { ZoomIn, ZoomOut, Maximize, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getContinent, getMapCountryName, getGameCountryName } from '@/utils/countryData';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Continent zoom presets
const continentZoomPresets: Record<string, { coordinates: [number, number]; zoom: number }> = {
  'Africa': { coordinates: [20, 0], zoom: 1.8 },
  'Asia': { coordinates: [100, 30], zoom: 1.5 },
  'Europe': { coordinates: [15, 50], zoom: 2.5 },
  'North America': { coordinates: [-100, 45], zoom: 1.5 },
  'South America': { coordinates: [-60, -15], zoom: 1.5 },
  'Oceania': { coordinates: [140, -25], zoom: 2 },
};

interface WorldMapProps {
  guessedCountries: string[];
  correctCountries: string[];
  wrongCountries: string[];
  currentCountry?: string;
  onCountryClick: (countryName: string) => void;
  disabled?: boolean;
  isSoloMode?: boolean;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  guessedCountries,
  correctCountries,
  wrongCountries,
  currentCountry,
  onCountryClick,
  disabled = false,
  isSoloMode = false,
}) => {
  const { t } = useLanguage();
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
  const [tooltip, setTooltip] = useState<{ country: string; x: number; y: number } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Track mouse position relative to container
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  // Update tooltip when hovered country or mouse position changes
  useEffect(() => {
    if (hoveredCountry) {
      setTooltip({ country: hoveredCountry, x: mousePos.x, y: mousePos.y });
    } else {
      setTooltip(null);
    }
  }, [hoveredCountry, mousePos]);

  // Auto-zoom to current country's continent when it changes
  useEffect(() => {
    if (currentCountry) {
      const continent = getContinent(currentCountry);
      if (continent && continentZoomPresets[continent]) {
        setPosition(continentZoomPresets[continent]);
      }
    }
  }, [currentCountry]);

  const handleZoomIn = useCallback(() => {
    if (position.zoom >= 4) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  }, [position.zoom]);

  const handleZoomOut = useCallback(() => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  }, [position.zoom]);

  const handleRecenter = useCallback(() => {
    setPosition({ coordinates: [0, 20], zoom: 1 });
  }, []);

  const handleZoomToContinent = useCallback(() => {
    if (currentCountry) {
      const continent = getContinent(currentCountry);
      if (continent && continentZoomPresets[continent]) {
        setPosition(continentZoomPresets[continent]);
        return;
      }
    }
    // Cycle through continents if no current country
    const continents = Object.keys(continentZoomPresets);
    const currentIdx = continents.findIndex(c => {
      const preset = continentZoomPresets[c];
      return preset.coordinates[0] === position.coordinates[0] &&
        preset.coordinates[1] === position.coordinates[1];
    });
    const nextIdx = (currentIdx + 1) % continents.length;
    setPosition(continentZoomPresets[continents[nextIdx]]);
  }, [currentCountry, position.coordinates]);

  const handleMoveEnd = useCallback((pos: { coordinates: [number, number]; zoom: number }) => {
    setPosition(pos);
  }, []);

  const normalizedCurrent = currentCountry ? getMapCountryName(currentCountry) : null;
  const normalizedGuessed = guessedCountries.map(getMapCountryName);
  const normalizedCorrect = correctCountries.map(getMapCountryName);
  const normalizedWrong = wrongCountries.map(getMapCountryName);

  const getCountryFill = (countryName: string) => {
    const normalizedName = getMapCountryName(countryName);
    // Correctly guessed countries - dark green
    if (normalizedCorrect.includes(normalizedName)) {
      return 'hsl(142 60% 25%)'; // Dark green
    }
    // Wrongly guessed countries - dark red
    if (normalizedWrong.includes(normalizedName)) {
      return 'hsl(0 60% 30%)'; // Dark red
    }
    // Current active country - flashing bright yellow until guessed
    if (normalizedCurrent === normalizedName) {
      return 'hsl(60 100% 50%)'; // Vibrant Yellow
    }
    // Default country color
    return 'hsl(0 0% 30%)';
  };

  const getCountryStroke = (countryName: string) => {
    const normalizedName = getMapCountryName(countryName);
    if (normalizedCurrent === normalizedName) {
      return 'hsl(60 100% 60%)';
    }
    if (normalizedCorrect.includes(normalizedName)) {
      return 'hsl(142 60% 35%)'; // Darker green stroke
    }
    if (normalizedWrong.includes(normalizedName)) {
      return 'hsl(0 60% 40%)'; // Darker red stroke
    }
    return 'hsl(0 0% 20%)';
  };

  // Tooltip should NEVER reveal unplayed country names
  const getTooltipContent = (countryName: string) => {
    const normalizedName = getMapCountryName(countryName);
    const isCorrect = normalizedCorrect.includes(normalizedName);
    const isWrong = normalizedWrong.includes(normalizedName);
    const isCurrent = normalizedCurrent === normalizedName;

    if (isCorrect) return `✓ ${countryName}`;
    if (isWrong) return `✗ ${countryName}`;
    if (isCurrent) return disabled ? '🎯 Highlighted' : '🎯 This is the country to guess!';
    return '???';
  };

  const getTooltipType = (countryName: string): 'correct' | 'wrong' | 'current' | 'default' => {
    const normalizedName = getMapCountryName(countryName);
    if (normalizedCorrect.includes(normalizedName)) return 'correct';
    if (normalizedWrong.includes(normalizedName)) return 'wrong';
    if (normalizedCurrent === normalizedName) return 'current';
    return 'default';
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Map Container - Fixed box with scroll isolation */}
      <div
        ref={mapContainerRef}
        className="relative flex-1 h-[450px] md:h-[550px] lg:h-[600px] bg-card rounded-xl overflow-hidden border-2 border-border shadow-lg"
        style={{ touchAction: 'none' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredCountry(null)}
      >
        {/* Country Tooltip - follows cursor inside map box */}
        {tooltip && (() => {
          const tooltipType = getTooltipType(tooltip.country);
          const tooltipClasses = {
            correct: 'bg-[hsl(142,60%,25%)]/80 border-[hsl(142,60%,35%)] text-white',
            wrong: 'bg-[hsl(0,60%,30%)]/80 border-[hsl(0,60%,40%)] text-white',
            current: 'bg-warning/20 border-warning text-warning-foreground',
            default: 'bg-popover/90 border-border text-foreground',
          };
          return (
            <div
              className={`pointer-events-none absolute z-20 px-3 py-2 rounded-lg shadow-lg border backdrop-blur-sm ${tooltipClasses[tooltipType]}`}
              style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
            >
              <span className="text-sm font-semibold">{getTooltipContent(tooltip.country)}</span>
              {tooltipType === 'correct' && (
                <span className="text-xs block text-white/70">Correct!</span>
              )}
              {tooltipType === 'wrong' && (
                <span className="text-xs block text-white/70">Wrong</span>
              )}
              {tooltipType === 'current' && !disabled && (
                <span className="text-xs block">Click to open guess modal</span>
              )}
            </div>
          );
        })()}

        {/* Current Country Indicator - DELETED - NEVER show the country name or selection */}

        {/* Spectator indicator */}
        {disabled && currentCountry && (
          <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-muted/80 border border-border rounded-lg">
            <span className="text-xs text-muted-foreground">👁️ Spectating</span>
          </div>
        )}

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 140,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            minZoom={1}
            maxZoom={6}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  const normalizedGeoName = getMapCountryName(countryName);
                  const isGuessed = normalizedGuessed.includes(normalizedGeoName);
                  const isCorrect = normalizedCorrect.includes(normalizedGeoName);
                  const isWrong = normalizedWrong.includes(normalizedGeoName);
                  const isCurrent = normalizedCurrent === normalizedGeoName;
                  // In solo mode without dice roll, any unguessed country is clickable
                  const isSoloClickable = isSoloMode && !disabled && !isGuessed && !currentCountry;
                  const isClickable = (!disabled && isCurrent && !isGuessed) || isSoloClickable;

                  const getHoverFill = () => {
                    if (isCurrent) return 'hsl(60 100% 60%)';
                    if (isClickable) return 'hsl(38 92% 60%)';
                    if (isCorrect) return 'hsl(142 60% 30%)'; // Slightly lighter dark green
                    if (isWrong) return 'hsl(0 60% 35%)'; // Slightly lighter dark red
                    return 'hsl(0 0% 40%)';
                  };

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => isClickable && onCountryClick(getGameCountryName(countryName))}
                      onMouseEnter={() => setHoveredCountry(countryName)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      style={{
                        default: {
                          fill: getCountryFill(countryName),
                          stroke: getCountryStroke(countryName),
                          strokeWidth: isCurrent ? 1.5 : 0.5,
                          outline: 'none',
                          transition: 'all 0.3s ease',
                          animation: isCurrent ? 'pulse-country 1.5s ease-in-out infinite' : 'none',
                        },
                        hover: {
                          fill: getHoverFill(),
                          stroke: isCurrent || isClickable ? 'hsl(0 0% 100%)' : getCountryStroke(countryName),
                          strokeWidth: isCurrent || isClickable ? 2 : 0.5,
                          outline: 'none',
                          cursor: isClickable ? 'pointer' : 'default',
                          animation: isCurrent ? 'pulse-country 1.5s ease-in-out infinite' : 'none',
                        },
                        pressed: {
                          fill: isCurrent ? 'hsl(60 100% 40%)' : 'hsl(38 92% 45%)',
                          outline: 'none',
                          animation: isCurrent ? 'pulse-country 1.5s ease-in-out infinite' : 'none',
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Map Controls - Right side outside the map */}
      <div className="flex flex-col gap-3 justify-center">
        <GameTooltip content={t('zoomIn')} position="left">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            className="h-12 w-12 rounded-xl border-2 border-border hover:border-primary transition-all"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
        </GameTooltip>

        <GameTooltip content={t('zoomOut')} position="left">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            className="h-12 w-12 rounded-xl border-2 border-border hover:border-primary transition-all"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
        </GameTooltip>

        <div className="h-px bg-border my-2" />

        <GameTooltip content={t('tooltipRecenter')} position="left">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleRecenter}
            className="h-12 w-12 rounded-xl border-2 border-border hover:border-primary transition-all"
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </GameTooltip>

        <GameTooltip content="Zoom to Continent" position="left">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomToContinent}
            className="h-12 w-12 rounded-xl border-2 border-border hover:border-primary transition-all"
          >
            <Globe className="h-5 w-5" />
          </Button>
        </GameTooltip>
      </div>
    </div>
  );
};
