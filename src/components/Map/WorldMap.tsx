import React, { useState, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { ZoomIn, ZoomOut, Maximize, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface WorldMapProps {
  guessedCountries: string[];
  currentCountry?: string;
  onCountryClick: (countryName: string) => void;
  disabled?: boolean;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  guessedCountries,
  currentCountry,
  onCountryClick,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

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

  const handleMoveEnd = useCallback((position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  }, []);

  const getCountryFill = (countryName: string) => {
    if (guessedCountries.includes(countryName)) {
      return 'hsl(142 76% 30%)'; // country-guessed
    }
    if (currentCountry === countryName) {
      return 'hsl(357 92% 47%)'; // country-current
    }
    return 'hsl(0 0% 25%)'; // default
  };

  return (
    <div className="relative w-full h-full bg-background rounded-xl overflow-hidden border border-border">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <GameTooltip content={t('zoomIn')} position="left">
          <Button variant="icon" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </GameTooltip>
        
        <GameTooltip content={t('zoomOut')} position="left">
          <Button variant="icon" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </GameTooltip>
        
        <GameTooltip content={t('tooltipRecenter')} position="left">
          <Button variant="icon" size="icon" onClick={handleRecenter}>
            <Maximize className="h-4 w-4" />
          </Button>
        </GameTooltip>
        
        <GameTooltip content={t('tooltipContinent')} position="left">
          <Button variant="icon" size="icon" onClick={() => {}}>
            <Map className="h-4 w-4" />
          </Button>
        </GameTooltip>
      </div>

      {/* Country Tooltip */}
      {hoveredCountry && (
        <div className="absolute top-4 left-4 z-10 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg">
          <span className="text-sm font-medium text-foreground">{hoveredCountry}</span>
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          minZoom={1}
          maxZoom={4}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryName = geo.properties.name;
                const isGuessed = guessedCountries.includes(countryName);
                const isCurrent = currentCountry === countryName;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => !disabled && onCountryClick(countryName)}
                    onMouseEnter={() => setHoveredCountry(countryName)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    style={{
                      default: {
                        fill: getCountryFill(countryName),
                        stroke: 'hsl(0 0% 15%)',
                        strokeWidth: 0.5,
                        outline: 'none',
                        transition: 'all 0.2s ease',
                      },
                      hover: {
                        fill: disabled ? getCountryFill(countryName) : 'hsl(357 92% 55%)',
                        stroke: 'hsl(0 0% 100%)',
                        strokeWidth: 1,
                        outline: 'none',
                        cursor: disabled ? 'default' : 'pointer',
                      },
                      pressed: {
                        fill: 'hsl(357 92% 40%)',
                        outline: 'none',
                      },
                    }}
                    className={`
                      ${isCurrent ? 'map-country-current' : ''}
                      ${isGuessed ? 'map-country-guessed' : ''}
                    `}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};
