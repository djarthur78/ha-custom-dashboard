/**
 * MobileWeatherPage
 * Single-column vertical scroll weather display
 */

import { MobilePageContainer } from '../../components/mobile/MobilePageContainer';
import { CurrentConditions } from '../../components/features/weather/CurrentConditions';
import { ForecastCard } from '../../components/features/weather/ForecastCard';
import { WindCard } from '../../components/features/weather/WindCard';
import { RainCard } from '../../components/features/weather/RainCard';
import { UVSolarCard } from '../../components/features/weather/UVSolarCard';
import { PressureCard } from '../../components/features/weather/PressureCard';
import { SoilMoistureCard } from '../../components/features/weather/SoilMoistureCard';

export function MobileWeatherPage() {
  return (
    <MobilePageContainer>
      <div className="space-y-3">
        {/* Current conditions - compact */}
        <CurrentConditions compact />

        {/* 5-day forecast - horizontal scroll */}
        <ForecastCard compact />

        {/* Wind + Rain side by side */}
        <div className="grid grid-cols-2 gap-3">
          <WindCard />
          <RainCard />
        </div>

        {/* UV/Solar + Pressure side by side */}
        <div className="grid grid-cols-2 gap-3">
          <UVSolarCard />
          <PressureCard />
        </div>

        {/* Soil moisture */}
        <SoilMoistureCard />
      </div>
    </MobilePageContainer>
  );
}

export default MobileWeatherPage;
