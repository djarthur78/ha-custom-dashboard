/**
 * MobileApp Component
 * Mobile router with lazy-loaded routes
 */

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MobileLayout } from './components/mobile/MobileLayout';

const MobileHomePage = lazy(() => import('./pages/mobile/MobileHomePage'));
const MobileCalendarPage = lazy(() => import('./pages/mobile/MobileCalendarPage'));
const MobileMealsPage = lazy(() => import('./pages/mobile/MobileMealsPage'));
const MobileGamesRoomPage = lazy(() => import('./pages/mobile/MobileGamesRoomPage'));
const MobileMusicPage = lazy(() => import('./pages/mobile/MobileMusicPage'));
const MobilePeoplePage = lazy(() => import('./pages/mobile/MobilePeoplePage'));
const MobileHealthPage = lazy(() => import('./pages/mobile/MobileHealthPage'));
const MobileCamerasPage = lazy(() => import('./pages/mobile/MobileCamerasPage'));
const MobileColdPlungePage = lazy(() => import('./pages/mobile/MobileColdPlungePage'));
const MobileTodoPage = lazy(() => import('./pages/mobile/MobileTodoPage'));
const MobileWeatherPage = lazy(() => import('./pages/mobile/MobileWeatherPage'));
const MobileHeatingPage = lazy(() => import('./pages/mobile/MobileHeatingPage'));

function MobileApp() {
  return (
    <Routes>
      <Route path="/" element={<MobileLayout />}>
        <Route index element={<Navigate to="/calendar" replace />} />
        <Route path="home" element={<MobileHomePage />} />
        <Route path="calendar" element={<MobileCalendarPage />} />
        <Route path="meals" element={<MobileMealsPage />} />
        <Route path="weather" element={<MobileWeatherPage />} />
        <Route path="games-room" element={<MobileGamesRoomPage />} />
        <Route path="music" element={<MobileMusicPage />} />
        <Route path="people" element={<MobilePeoplePage />} />
        <Route path="health" element={<MobileHealthPage />} />
        <Route path="cameras" element={<MobileCamerasPage />} />
        <Route path="cold-plunge" element={<MobileColdPlungePage />} />
        <Route path="todo" element={<MobileTodoPage />} />
        <Route path="heating" element={<MobileHeatingPage />} />
      </Route>
    </Routes>
  );
}

export default MobileApp;
