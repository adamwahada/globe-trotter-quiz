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
import { getContinent } from '@/utils/countryData';

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
  currentCountry?: string;
  onCountryClick: (countryName: string) => void;
  disabled?: boolean;
  showCountryNames?: boolean;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  guessedCountries,
  currentCountry,
  onCountryClick,
  disabled = false,
  showCountryNames = false,
}) => {
  const { t } = useLanguage();
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  const getCountryFill = (countryName: string) => {
    // Guessed countries - permanent green
    if (guessedCountries.includes(countryName)) {
      return 'hsl(142 76% 36%)'; // success color - bright green
    }
    // Current active country - pulsing gold/orange
    if (currentCountry === countryName) {
      return 'hsl(38 92% 50%)'; // warning/gold color for active selection
    }
    // Default country color
    return 'hsl(0 0% 30%)';
  };

  const getCountryStroke = (countryName: string) => {
    if (currentCountry === countryName) {
      return 'hsl(38 92% 60%)';
    }
    if (guessedCountries.includes(countryName)) {
      return 'hsl(142 76% 45%)';
    }
    return 'hsl(0 0% 20%)';
  };

  // Determine what to show in tooltip
  const getTooltipContent = (countryName: string) => {
    const isGuessed = guessedCountries.includes(countryName);
    const isCurrent = currentCountry === countryName;
    
    if (isGuessed) {
      return `✓ ${countryName}`;
    }
    if (isCurrent) {
      return showCountryNames ? countryName : '🎯 Click to guess!';
    }
    return showCountryNames ? countryName : '???';
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Map Container - Fixed box with scroll isolation */}
      <div 
        ref={mapContainerRef}
        className="relative flex-1 h-[450px] md:h-[550px] lg:h-[600px] bg-card rounded-xl overflow-hidden border-2 border-border shadow-lg"
        style={{ touchAction: 'none' }} // Prevent page scroll when interacting with map
      >
        {/* Country Tooltip */}
        {hoveredCountry && (
          <div className={`absolute top-4 left-4 z-20 px-4 py-2 rounded-lg shadow-lg border ${
            guessedCountries.includes(hoveredCountry) 
              ? 'bg-success/20 border-success text-success-foreground' 
              : currentCountry === hoveredCountry
                ? 'bg-warning/20 border-warning text-warning-foreground'
                : 'bg-popover border-border text-foreground'
          }`}>
            <span className="text-sm font-semibold">
              {getTooltipContent(hoveredCountry)}
            </span>
            {guessedCountries.includes(hoveredCountry) && (
              <span className="text-xs block text-muted-foreground">Already guessed</span>
            )}
            {currentCountry === hoveredCountry && !guessedCountries.includes(hoveredCountry) && !disabled && (
              <span className="text-xs block">Click to open guess modal</span>
            )}
          </div>
        )}

        {/* Current Country Indicator - Only show when there's a current country */}
        {currentCountry && (
          <div className="absolute bottom-4 left-4 z-20 px-4 py-2 bg-warning/20 border border-warning rounded-lg animate-pulse">
            <span className="text-sm font-semibold text-warning">
              🎯 {showCountryNames ? `Find: ${currentCountry}` : 'Find the highlighted country!'}
            </span>
          </div>
        )}

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
                  const isGuessed = guessedCountries.includes(countryName);
                  const isCurrent = currentCountry === countryName;
                  const isClickable = !disabled && isCurrent && !isGuessed;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => isClickable && onCountryClick(countryName)}
                      onMouseEnter={() => setHoveredCountry(countryName)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      style={{
                        default: {
                          fill: getCountryFill(countryName),
                          stroke: getCountryStroke(countryName),
                          strokeWidth: isCurrent ? 1.5 : 0.5,
                          outline: 'none',
                          transition: 'all 0.3s ease',
                        },
                        hover: {
                          fill: isClickable 
                            ? 'hsl(38 92% 60%)' 
                            : isGuessed 
                              ? 'hsl(142 76% 40%)' 
                              : 'hsl(0 0% 40%)',
                          stroke: isClickable ? 'hsl(0 0% 100%)' : getCountryStroke(countryName),
                          strokeWidth: isClickable ? 2 : 0.5,
                          outline: 'none',
                          cursor: isClickable ? 'pointer' : 'default',
                        },
                        pressed: {
                          fill: 'hsl(38 92% 45%)',
                          outline: 'none',
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
