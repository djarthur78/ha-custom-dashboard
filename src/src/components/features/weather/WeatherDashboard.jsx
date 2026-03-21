/**
 * WeatherDashboard Component
 * Full viewport weather layout for desktop (1920x1080)
 * Left panel: current conditions hero
 * Right panel: forecast + sensor cards grid
 */

import { CurrentConditions } from './CurrentConditions';
import { ForecastCard } from './ForecastCard';
import { WindCard } from './WindCard';
import { RainCard } from './RainCard';
import { UVSolarCard } from './UVSolarCard';
import { SoilMoistureCard } from './SoilMoistureCard';

export function WeatherDashboard() {
  return (
    <div className="flex gap-3 p-3" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Left: Current Conditions Hero (40%) */}
      <div className="flex-[40] min-h-0">
        <CurrentConditions />
      </div>

      {/* Right: Forecast + Cards Grid (60%) */}
      <div className="flex-[60] min-h-0 flex flex-col gap-3 overflow-y-auto">
        {/* 5-Day Forecast */}
        <ForecastCard />

        {/* 2x2 Grid: Wind, Rain, UV/Solar, empty for now */}
        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          <WindCard />
          <RainCard />
          <UVSolarCard />
          <div className="min-h-0">
            <SoilMoistureCard />
          </div>
        </div>
      </div>
    </div>
  );
}
