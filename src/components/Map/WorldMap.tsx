import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { ZoomIn, ZoomOut, Maximize, Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getContinent, getMapCountryName, getGameCountryName, getCountryCoordinates } from '@/utils/countryData';
import { getLocalizedCountryName } from '@/i18n/countryNames';

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
  countrySelectionMode?: boolean;
  /** Speed Race mode: all countries clickable, minimal controls (zoom + recenter only), full-height */
  speedRaceMode?: boolean;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  guessedCountries,
  correctCountries,
  wrongCountries,
  currentCountry,
  onCountryClick,
  disabled = false,
  isSoloMode = false,
  countrySelectionMode = false,
  speedRaceMode = false,
}) => {
  const { t, language } = useLanguage();
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
  const [tooltip, setTooltip] = useState<{ country: string; x: number; y: number } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Prevent tooltip re-renders from interfering with pan/zoom gestures.
  const isMovingRef = useRef(false);
  const tooltipRafRef = useRef<number | null>(null);

  // Some versions of react-simple-maps/d3-zoom can emit a stray onMoveEnd shortly
  // after programmatic zoom changes; ignore that small window.
  const ignoreMoveEndUntilRef = useRef(0);

  const positionRef = useRef(position);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const updateTooltipPosition = useCallback((country: string, e: React.MouseEvent) => {
    if (isMovingRef.current) return;

    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (tooltipRafRef.current) {
      cancelAnimationFrame(tooltipRafRef.current);
    }

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    tooltipRafRef.current = requestAnimationFrame(() => {
      setTooltip({ country, x, y });
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hoveredCountry) return;
    updateTooltipPosition(hoveredCountry, e);
  }, [hoveredCountry, updateTooltipPosition]);

  // IMPORTANT: Map zoom/position must NEVER be auto-overridden.
  // Only user actions (buttons/gestures) should change it.

  const handleZoomIn = useCallback(() => {
    ignoreMoveEndUntilRef.current = Date.now() + 200;
    setPosition((pos) => {
      const nextZoom = Math.min(pos.zoom * 1.5, 6);
      return nextZoom === pos.zoom ? pos : { ...pos, zoom: nextZoom };
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    ignoreMoveEndUntilRef.current = Date.now() + 200;
    setPosition((pos) => {
      const nextZoom = Math.max(pos.zoom / 1.5, 0.8);
      return nextZoom === pos.zoom ? pos : { ...pos, zoom: nextZoom };
    });
  }, []);

  const handleRecenter = useCallback(() => {
    ignoreMoveEndUntilRef.current = Date.now() + 200;
    setPosition({ coordinates: [0, 20], zoom: 1 });
  }, []);

  const handleZoomToContinent = useCallback(() => {
    ignoreMoveEndUntilRef.current = Date.now() + 200;
    // Manual action only: zoom to the active country's continent (if available)
    if (currentCountry) {
      const continent = getContinent(currentCountry);
      if (continent && continentZoomPresets[continent]) {
        setPosition(continentZoomPresets[continent]);
        return;
      }
    }

    // Otherwise: cycle through continent presets
    setPosition((pos) => {
      const continents = Object.keys(continentZoomPresets);
      const currentIdx = continents.findIndex((c) => {
        const preset = continentZoomPresets[c];
        return (
          preset.coordinates[0] === pos.coordinates[0] &&
          preset.coordinates[1] === pos.coordinates[1]
        );
      });
      const nextIdx = (currentIdx + 1) % continents.length;
      return continentZoomPresets[continents[nextIdx]];
    });
  }, [currentCountry]);

  const handleLocateCountry = useCallback(() => {
    if (currentCountry) {
      const countryPos = getCountryCoordinates(currentCountry);
      if (countryPos) {
        ignoreMoveEndUntilRef.current = Date.now() + 200;
        setPosition(countryPos);
      }
    }
  }, [currentCountry]);

  const handleMoveEnd = useCallback((raw: any) => {
    isMovingRef.current = false;

    // Ignore any stray move-end caused by our own zoom buttons.
    if (Date.now() < ignoreMoveEndUntilRef.current) return;

    // react-simple-maps can provide different shapes depending on version:
    // - { coordinates: [lng, lat], zoom }
    // - { center: [lng, lat], zoom }
    const coordsRaw =
      raw && Array.isArray(raw.coordinates) && raw.coordinates.length >= 2
        ? raw.coordinates
        : raw && Array.isArray(raw.center) && raw.center.length >= 2
          ? raw.center
          : null;
    const zoomRaw = raw && typeof raw.zoom === 'number' ? raw.zoom : null;
    if (!coordsRaw || zoomRaw === null) return;

    const next = {
      coordinates: [coordsRaw[0], coordsRaw[1]] as [number, number],
      zoom: zoomRaw,
    };

    // Avoid pointless state churn.
    const prev = positionRef.current;
    if (
      prev.zoom === next.zoom &&
      prev.coordinates[0] === next.coordinates[0] &&
      prev.coordinates[1] === next.coordinates[1]
    ) {
      return;
    }

    setPosition(next);
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

  // Tooltip should NEVER reveal unplayed country names (except in country selection mode)
  // For guessed countries, show the localized name
  const getTooltipContent = (countryName: string) => {
    const normalizedName = getMapCountryName(countryName);
    const isCorrect = normalizedCorrect.includes(normalizedName);
    const isWrong = normalizedWrong.includes(normalizedName);
    const isCurrent = normalizedCurrent === normalizedName;

    // Get the game name (canonical English name) for localization lookup
    const gameName = getGameCountryName(countryName);
    // Get the localized name based on current language
    const localizedName = getLocalizedCountryName(gameName, language);

    if (isCorrect) return `✓ ${localizedName}`;
    if (isWrong) return `✗ ${localizedName}`;
    if (isCurrent) return disabled ? `🎯 ${t('mapTooltipHighlighted')}` : `🎯 ${t('mapTooltipCountryToGuess')}`;
    // In country selection mode, show country names for unguessed countries
    if (countrySelectionMode && !normalizedGuessed.includes(normalizedName)) {
      return `📍 ${localizedName}`;
    }
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
    <div className={`flex h-full ${speedRaceMode ? 'flex-row gap-2' : 'gap-4'}`}>
      {/* Map Container - Fixed box with scroll isolation */}
      <div
        ref={mapContainerRef}
        className={`relative flex-1 bg-card overflow-hidden border-2 border-border shadow-lg ${
          speedRaceMode ? 'h-full rounded-xl' : 'h-[450px] md:h-[550px] lg:h-[600px] rounded-xl'
        }`}
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
        onMouseMove={handleMouseMove}
        onWheelCapture={(e) => {
          // Allow the page to scroll normally while preventing d3-zoom from treating
          // wheel/touchpad scroll as map zoom (which feels like "auto de-zooming").
          e.stopPropagation();
        }}
        onPointerDownCapture={(e) => {
          // Only treat pointer interactions inside the map box as panning/zooming.
          // (Controls are outside this container.)
          if ((e.target as HTMLElement)?.closest?.('svg')) {
            isMovingRef.current = true;
            setTooltip(null);
          }
        }}
        onPointerUpCapture={() => {
          isMovingRef.current = false;
        }}
        onPointerCancelCapture={() => {
          isMovingRef.current = false;
        }}
        onPointerLeave={() => {
          setHoveredCountry(null);
          setTooltip(null);
        }}
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

        {/* Country Selection Mode indicator */}
        {countrySelectionMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-primary/90 border border-primary rounded-lg">
            <span className="text-sm text-primary-foreground font-bold">📍 Click a country to select it</span>
          </div>
        )}

        {/* Spectator indicator */}
        {disabled && currentCountry && !countrySelectionMode && (
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
            minZoom={0.8}
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
                  // In country selection mode, any unguessed country is clickable
                  const isCountrySelectionClickable = countrySelectionMode && !isGuessed;
                  // In solo mode without dice roll, any unguessed country is clickable
                  const isSoloClickable = isSoloMode && !disabled && !isGuessed && !currentCountry;
                  // In Speed Race, every country is clickable when not disabled
                  const isSpeedRaceClickable = speedRaceMode && !disabled;
                  const isClickable = isSpeedRaceClickable || (!disabled && isCurrent && !isGuessed) || isSoloClickable || isCountrySelectionClickable;

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
                      onClick={() => {
                        if (speedRaceMode && !disabled) {
                          onCountryClick(getGameCountryName(countryName));
                        } else if (isClickable) {
                          onCountryClick(getGameCountryName(countryName));
                        }
                      }}
                      onMouseEnter={() => {
                        setHoveredCountry(countryName);
                      }}
                      onMouseLeave={() => {
                        setHoveredCountry(null);
                        setTooltip(null);
                      }}
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
      <div className="flex flex-col gap-2 justify-center pr-1">
        <GameTooltip content={t('zoomIn')} position="left">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            className="h-10 w-10 rounded-xl border-2 border-border hover:border-primary transition-all"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </GameTooltip>

        <GameTooltip content={t('zoomOut')} position="left">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            className="h-10 w-10 rounded-xl border-2 border-border hover:border-primary transition-all"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </GameTooltip>

        <div className="h-px bg-border my-1" />

        <GameTooltip content={t('tooltipRecenter')} position="left">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleRecenter}
            className="h-10 w-10 rounded-xl border-2 border-border hover:border-primary transition-all"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </GameTooltip>

        {/* Only show these extra controls when NOT in speed race mode */}
        {!speedRaceMode && (
          <>
            <GameTooltip content={t('tooltipLocate')} position="left">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleLocateCountry}
                disabled={!currentCountry}
                className="h-10 w-10 rounded-xl border-2 border-border hover:border-primary transition-all disabled:opacity-50"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </GameTooltip>

            <GameTooltip content="Zoom to Continent" position="left">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleZoomToContinent}
                className="h-10 w-10 rounded-xl border-2 border-border hover:border-primary transition-all"
              >
                <Globe className="h-4 w-4" />
              </Button>
            </GameTooltip>
          </>
        )}
      </div>
    </div>
  );
};
