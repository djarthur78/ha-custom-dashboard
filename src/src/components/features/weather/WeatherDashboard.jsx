/**
 * WeatherDashboard Component
 * Full viewport weather layout for desktop (1920x1080)
 * Left panel (35%): current conditions hero
 * Right panel (65%): forecast, insights, sensor cards, soil moisture (scrollable)
 */

import { CurrentConditions } from './CurrentConditions';
import { ForecastCard } from './ForecastCard';
import { WeatherInsightsCard } from './WeatherInsightsCard';
import { WindCard } from './WindCard';
import { RainCard } from './RainCard';
import { UVSolarCard } from './UVSolarCard';
import { PressureCard } from './PressureCard';


export function WeatherDashboard() {
  return (
    <div className="flex gap-2 p-2" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Left: Current Conditions Hero (35%) */}
      <div className="flex-[35] min-h-0">
        <CurrentConditions />
      </div>

      {/* Right: column (65%) — designed to fit 1080p without scrolling */}
      <div className="flex-[65] min-h-0 flex flex-col gap-2 overflow-y-auto">
        <ForecastCard />
        <WeatherInsightsCard />
        <div className="grid grid-cols-2 gap-2">
          <WindCard />
          <RainCard />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <UVSolarCard />
          <PressureCard />
        </div>
      </div>
    </div>
  );
}
