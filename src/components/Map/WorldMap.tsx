import React, { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSound } from '@/contexts/SoundContext';
import { ZoomIn, ZoomOut, Maximize, Globe, MapPin, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getContinent, getMapCountryName, getGameCountryName, getCountryCoordinates } from '@/utils/countryData';
import { getLocalizedCountryName } from '@/i18n/countryNames';

/** Bundled locally — avoids CDN latency on every session */
const geoUrl = '/maps/countries-110m.json';

const continentZoomPresets: Record<string, { coordinates: [number, number]; zoom: number }> = {
  Africa: { coordinates: [20, 0], zoom: 1.8 },
  Asia: { coordinates: [100, 30], zoom: 1.5 },
  Europe: { coordinates: [15, 50], zoom: 2.5 },
  'North America': { coordinates: [-100, 45], zoom: 1.5 },
  'South America': { coordinates: [-60, -15], zoom: 1.5 },
  Oceania: { coordinates: [140, -25], zoom: 2 },
};

const FILL_CORRECT = 'hsl(142 60% 25%)';
const FILL_WRONG = 'hsl(0 60% 30%)';
const FILL_CURRENT = 'hsl(60 100% 50%)';
const FILL_DEFAULT = 'hsl(0 0% 30%)';
const FILL_HOVER_CLICKABLE = 'hsl(38 92% 60%)';
const FILL_HOVER_CORRECT = 'hsl(142 60% 30%)';
const FILL_HOVER_WRONG = 'hsl(0 60% 35%)';
const FILL_HOVER_DEFAULT = 'hsl(0 0% 40%)';
const FILL_HOVER_CURRENT = 'hsl(60 100% 60%)';
const FILL_PRESSED_CURRENT = 'hsl(60 100% 40%)';
const FILL_PRESSED_CLICKABLE = 'hsl(38 92% 45%)';

const STROKE_CURRENT = 'hsl(60 100% 60%)';
const STROKE_CORRECT = 'hsl(142 60% 35%)';
const STROKE_WRONG = 'hsl(0 60% 40%)';
const STROKE_DEFAULT = 'hsl(0 0% 20%)';
const STROKE_HOVER_HIGHLIGHT = 'hsl(0 0% 100%)';

type TooltipType = 'correct' | 'wrong' | 'current' | 'default';

const TOOLTIP_CLASS: Record<TooltipType, string> = {
  correct: 'bg-[hsl(142,60%,25%)] border-[hsl(142,60%,35%)] text-white',
  wrong: 'bg-[hsl(0,60%,30%)] border-[hsl(0,60%,40%)] text-white',
  current: 'bg-warning/90 border-warning text-warning-foreground',
  default: 'bg-popover border-border text-foreground',
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
  speedRaceMode?: boolean;
  resetKey?: number | string;
}

interface MapCountryProps {
  geography: { rsmKey: string; properties: { name: string } };
  isGuessed: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  isCurrent: boolean;
  isClickable: boolean;
  gameCountryName: string;
  geoDisplayName: string;
  onSelect: (gameCountryName: string) => void;
  onHoverStart: (geoDisplayName: string, clientX: number, clientY: number) => void;
  onHoverEnd: () => void;
}

function buildStyle(
  fill: string,
  stroke: string,
  strokeWidth: number,
  hoverFill: string,
  hoverStroke: string,
  hoverStrokeWidth: number,
  pressedFill: string,
  isCurrent: boolean,
  isClickable: boolean,
) {
  return {
    default: {
      fill,
      stroke,
      strokeWidth,
      outline: 'none' as const,
      animation: isCurrent ? 'pulse-country 1.5s ease-in-out infinite' : 'none',
    },
    hover: {
      fill: hoverFill,
      stroke: hoverStroke,
      strokeWidth: hoverStrokeWidth,
      outline: 'none' as const,
      cursor: isClickable ? ('pointer' as const) : ('default' as const),
      animation: isCurrent ? 'pulse-country 1.5s ease-in-out infinite' : 'none',
    },
    pressed: {
      fill: pressedFill,
      outline: 'none' as const,
      animation: isCurrent ? 'pulse-country 1.5s ease-in-out infinite' : 'none',
    },
  };
}

const MapCountry = memo(function MapCountry({
  geography,
  isCorrect,
  isWrong,
  isCurrent,
  isClickable,
  gameCountryName,
  geoDisplayName,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: MapCountryProps) {
  const fill = isCorrect ? FILL_CORRECT : isWrong ? FILL_WRONG : isCurrent ? FILL_CURRENT : FILL_DEFAULT;
  const stroke = isCurrent ? STROKE_CURRENT : isCorrect ? STROKE_CORRECT : isWrong ? STROKE_WRONG : STROKE_DEFAULT;
  const strokeWidth = isCurrent ? 1.5 : 0.5;

  const hoverFill = isCurrent
    ? FILL_HOVER_CURRENT
    : isClickable
      ? FILL_HOVER_CLICKABLE
      : isCorrect
        ? FILL_HOVER_CORRECT
        : isWrong
          ? FILL_HOVER_WRONG
          : FILL_HOVER_DEFAULT;

  const hoverStroke = isCurrent || isClickable ? STROKE_HOVER_HIGHLIGHT : stroke;
  const hoverStrokeWidth = isCurrent || isClickable ? 2 : strokeWidth;
  const pressedFill = isCurrent ? FILL_PRESSED_CURRENT : FILL_PRESSED_CLICKABLE;

  const style = useMemo(
    () => buildStyle(fill, stroke, strokeWidth, hoverFill, hoverStroke, hoverStrokeWidth, pressedFill, isCurrent, isClickable),
    [fill, stroke, strokeWidth, hoverFill, hoverStroke, hoverStrokeWidth, pressedFill, isCurrent, isClickable],
  );

  const handleClick = useCallback(() => {
    if (isClickable) onSelect(gameCountryName);
  }, [isClickable, gameCountryName, onSelect]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      onHoverStart(geoDisplayName, e.clientX, e.clientY);
    },
    [geoDisplayName, onHoverStart],
  );

  return (
    <Geography
      geography={geography}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter as unknown as () => void}
      onMouseLeave={onHoverEnd}
      style={style}
    />
  );
}, (prev, next) =>
  prev.geography.rsmKey === next.geography.rsmKey &&
  prev.isGuessed === next.isGuessed &&
  prev.isCorrect === next.isCorrect &&
  prev.isWrong === next.isWrong &&
  prev.isCurrent === next.isCurrent &&
  prev.isClickable === next.isClickable &&
  prev.gameCountryName === next.gameCountryName,
);

function toNormalizedSet(countries: string[]): Set<string> {
  const set = new Set<string>();
  for (const c of countries) set.add(getMapCountryName(c));
  return set;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const WorldMapInner: React.FC<WorldMapProps> = ({
  guessedCountries,
  correctCountries,
  wrongCountries,
  currentCountry,
  onCountryClick,
  disabled = false,
  isSoloMode = false,
  countrySelectionMode = false,
  speedRaceMode = false,
  resetKey,
}) => {
  const { t, language } = useLanguage();
  const { soundEnabled, toggleSound } = useSound();
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipLabelRef = useRef<HTMLSpanElement>(null);
  const tooltipSubRef = useRef<HTMLSpanElement>(null);
  const hoveredCountryRef = useRef<string | null>(null);
  const isMovingRef = useRef(false);
  const ignoreMoveEndUntilRef = useRef(0);
  const positionRef = useRef(position);

  const guessedSet = useMemo(() => toNormalizedSet(guessedCountries), [guessedCountries]);
  const correctSet = useMemo(() => toNormalizedSet(correctCountries), [correctCountries]);
  const wrongSet = useMemo(() => toNormalizedSet(wrongCountries), [wrongCountries]);
  const normalizedCurrent = useMemo(
    () => (currentCountry ? getMapCountryName(currentCountry) : null),
    [currentCountry],
  );

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (resetKey !== undefined) {
      setPosition({ coordinates: [0, 20], zoom: 1 });
    }
  }, [resetKey]);

  const resolveTooltip = useCallback(
    (geoDisplayName: string): { text: string; type: TooltipType; sub?: string } => {
      const normalizedName = getMapCountryName(geoDisplayName);
      const isCorrect = correctSet.has(normalizedName);
      const isWrong = wrongSet.has(normalizedName);
      const isCurrent = normalizedCurrent === normalizedName;
      const gameName = getGameCountryName(geoDisplayName);
      const localizedName = getLocalizedCountryName(gameName, language);

      if (speedRaceMode) {
        if (isCorrect) return { text: `✓ ${localizedName}`, type: 'correct', sub: 'Correct!' };
        return { text: '📍 Click to select', type: 'default' };
      }
      if (isCorrect) return { text: `✓ ${localizedName}`, type: 'correct', sub: 'Correct!' };
      if (isWrong) return { text: `✗ ${localizedName}`, type: 'wrong', sub: 'Wrong' };
      if (isCurrent) {
        return {
          text: disabled ? `🎯 ${t('mapTooltipHighlighted')}` : `🎯 ${t('mapTooltipCountryToGuess')}`,
          type: 'current',
          sub: disabled ? undefined : 'Click to open guess modal',
        };
      }
      if (countrySelectionMode && !guessedSet.has(normalizedName)) {
        return { text: `📍 ${localizedName}`, type: 'default' };
      }
      return { text: '???', type: 'default' };
    },
    [correctSet, wrongSet, normalizedCurrent, language, speedRaceMode, disabled, countrySelectionMode, guessedSet, t],
  );

  const positionTooltip = useCallback((clientX: number, clientY: number) => {
    const el = tooltipRef.current;
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!el || !rect) return;
    el.style.left = `${clientX - rect.left + 12}px`;
    el.style.top = `${clientY - rect.top + 12}px`;
  }, []);

  const showTooltip = useCallback(
    (geoDisplayName: string, clientX: number, clientY: number) => {
      hoveredCountryRef.current = geoDisplayName;
      const { text, type, sub } = resolveTooltip(geoDisplayName);
      const el = tooltipRef.current;
      const label = tooltipLabelRef.current;
      const subEl = tooltipSubRef.current;
      if (!el || !label) return;

      label.textContent = text;
      el.className = `pointer-events-none absolute z-20 px-3 py-2 rounded-lg shadow-lg border ${TOOLTIP_CLASS[type]}`;
      if (subEl) {
        if (sub) {
          subEl.textContent = sub;
          subEl.style.display = 'block';
        } else {
          subEl.style.display = 'none';
        }
      }
      el.style.display = 'block';
      positionTooltip(clientX, clientY);
    },
    [resolveTooltip, positionTooltip],
  );

  const hideTooltip = useCallback(() => {
    hoveredCountryRef.current = null;
    if (tooltipRef.current) tooltipRef.current.style.display = 'none';
  }, []);

  const handleMapMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hoveredCountryRef.current || isMovingRef.current) return;
      positionTooltip(e.clientX, e.clientY);
    },
    [positionTooltip],
  );

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
    if (currentCountry) {
      const continent = getContinent(currentCountry);
      if (continent && continentZoomPresets[continent]) {
        setPosition(continentZoomPresets[continent]);
        return;
      }
    }
    setPosition((pos) => {
      const continents = Object.keys(continentZoomPresets);
      const currentIdx = continents.findIndex((c) => {
        const preset = continentZoomPresets[c];
        return preset.coordinates[0] === pos.coordinates[0] && preset.coordinates[1] === pos.coordinates[1];
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

  const handleMoveEnd = useCallback((raw: { coordinates?: number[]; center?: number[]; zoom?: number }) => {
    isMovingRef.current = false;
    if (Date.now() < ignoreMoveEndUntilRef.current) return;

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

  const handleCountrySelect = useCallback(
    (gameCountryName: string) => {
      onCountryClick(gameCountryName);
    },
    [onCountryClick],
  );

  const renderCountries = useCallback(
    (geographies: Array<{ rsmKey: string; properties: { name: string } }>) =>
      geographies.map((geo) => {
        const geoDisplayName = geo.properties.name;
        const normalizedGeoName = getMapCountryName(geoDisplayName);
        const isGuessed = guessedSet.has(normalizedGeoName);
        const isCorrect = correctSet.has(normalizedGeoName);
        const isWrong = wrongSet.has(normalizedGeoName);
        const isCurrent = normalizedCurrent === normalizedGeoName;
        const isCountrySelectionClickable = countrySelectionMode && !isGuessed;
        const isSoloClickable = isSoloMode && !disabled && !isGuessed && !currentCountry;
        const isSpeedRaceClickable = speedRaceMode && !disabled;
        const isClickable =
          isSpeedRaceClickable ||
          (!disabled && isCurrent && !isGuessed) ||
          isSoloClickable ||
          isCountrySelectionClickable;

        return (
          <MapCountry
            key={geo.rsmKey}
            geography={geo}
            isGuessed={isGuessed}
            isCorrect={isCorrect}
            isWrong={isWrong}
            isCurrent={isCurrent}
            isClickable={isClickable}
            gameCountryName={getGameCountryName(geoDisplayName)}
            geoDisplayName={geoDisplayName}
            onSelect={handleCountrySelect}
            onHoverStart={showTooltip}
            onHoverEnd={hideTooltip}
          />
        );
      }),
    [
      guessedSet,
      correctSet,
      wrongSet,
      normalizedCurrent,
      countrySelectionMode,
      isSoloMode,
      disabled,
      currentCountry,
      speedRaceMode,
      handleCountrySelect,
      showTooltip,
      hideTooltip,
    ],
  );

  return (
    <div className={`flex h-full ${speedRaceMode ? 'flex-row gap-2' : 'gap-4'}`}>
      <div
        ref={mapContainerRef}
        className={`relative flex-1 bg-card overflow-hidden border-2 border-border shadow-lg ${
          speedRaceMode ? 'h-full rounded-xl' : 'h-[450px] md:h-[550px] lg:h-[600px] rounded-xl'
        }`}
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
        onMouseMove={handleMapMouseMove}
        onWheelCapture={(e) => e.stopPropagation()}
        onPointerDownCapture={(e) => {
          if ((e.target as HTMLElement)?.closest?.('svg')) {
            isMovingRef.current = true;
            hideTooltip();
          }
        }}
        onPointerUpCapture={() => {
          isMovingRef.current = false;
        }}
        onPointerCancelCapture={() => {
          isMovingRef.current = false;
        }}
        onPointerLeave={hideTooltip}
      >
        {/* Tooltip — position/content updated via refs (no React re-render on mousemove) */}
        <div ref={tooltipRef} style={{ display: 'none' }} className="pointer-events-none absolute z-20 px-3 py-2 rounded-lg shadow-lg border">
          <span ref={tooltipLabelRef} className="text-sm font-semibold" />
          <span ref={tooltipSubRef} className="text-xs block opacity-70" style={{ display: 'none' }} />
        </div>

        {countrySelectionMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-primary/90 border border-primary rounded-lg">
            <span className="text-sm text-primary-foreground font-bold">📍 Click a country to select it</span>
          </div>
        )}

        {disabled && currentCountry && !countrySelectionMode && (
          <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-muted/80 border border-border rounded-lg">
            <span className="text-xs text-muted-foreground">👁️ Spectating</span>
          </div>
        )}

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 140 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            minZoom={0.8}
            maxZoom={6}
          >
            <Geographies geography={geoUrl}>{({ geographies }) => renderCountries(geographies)}</Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div className="flex flex-col gap-2 justify-center pr-1">
        <GameTooltip content={t('zoomIn')} position="left">
          <Button variant="secondary" size="icon" onClick={handleZoomIn} className="h-10 w-10 rounded-xl border-2 border-border hover:border-primary transition-all">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </GameTooltip>

        <GameTooltip content={t('zoomOut')} position="left">
          <Button variant="secondary" size="icon" onClick={handleZoomOut} className="h-10 w-10 rounded-xl border-2 border-border hover:border-primary transition-all">
            <ZoomOut className="h-4 w-4" />
          </Button>
        </GameTooltip>

        <div className="h-px bg-border my-1" />

        <GameTooltip content={t('tooltipRecenter')} position="left">
          <Button variant="secondary" size="icon" onClick={handleRecenter} className="h-10 w-10 rounded-xl border-2 border-border hover:border-primary transition-all">
            <Maximize className="h-4 w-4" />
          </Button>
        </GameTooltip>

        {speedRaceMode && (
          <>
            <div className="h-px bg-border my-1" />
            <GameTooltip content={soundEnabled ? t('soundOn') : t('soundOff')} position="left">
              <Button variant="secondary" size="icon" onClick={toggleSound} className="h-10 w-10 rounded-xl border-2 border-border hover:border-primary transition-all">
                {soundEnabled ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </GameTooltip>
          </>
        )}

        {!speedRaceMode && (
          <>
            <GameTooltip content={t('tooltipLocate')} position="left">
              <Button variant="secondary" size="icon" onClick={handleLocateCountry} disabled={!currentCountry} className="h-10 w-10 rounded-xl border-2 border-border hover:border-primary transition-all disabled:opacity-50">
                <MapPin className="h-4 w-4" />
              </Button>
            </GameTooltip>

            <GameTooltip content="Zoom to Continent" position="left">
              <Button variant="secondary" size="icon" onClick={handleZoomToContinent} className="h-10 w-10 rounded-xl border-2 border-border hover:border-primary transition-all">
                <Globe className="h-4 w-4" />
              </Button>
            </GameTooltip>
          </>
        )}
      </div>
    </div>
  );
};

function worldMapPropsEqual(prev: WorldMapProps, next: WorldMapProps): boolean {
  return (
    prev.currentCountry === next.currentCountry &&
    prev.disabled === next.disabled &&
    prev.isSoloMode === next.isSoloMode &&
    prev.countrySelectionMode === next.countrySelectionMode &&
    prev.speedRaceMode === next.speedRaceMode &&
    prev.resetKey === next.resetKey &&
    prev.onCountryClick === next.onCountryClick &&
    arraysEqual(prev.guessedCountries, next.guessedCountries) &&
    arraysEqual(prev.correctCountries, next.correctCountries) &&
    arraysEqual(prev.wrongCountries, next.wrongCountries)
  );
}

export const WorldMap = memo(WorldMapInner, worldMapPropsEqual);

// Preload geo JSON as soon as this module is imported
if (typeof window !== 'undefined') {
  fetch(geoUrl).catch(() => {
    /* ignore — Geographies will retry */
  });
}
