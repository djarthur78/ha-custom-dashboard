/**
 * Main App Component
 * Router configuration with MainLayout
 * Routes are lazy-loaded for performance
 */

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';

const HomePage = lazy(() => import('./pages/HomePage'));
const CalendarViewList = lazy(() => import('./pages/CalendarViewList'));
const MealsPage = lazy(() => import('./pages/MealsPage'));
const GamesRoomPage = lazy(() => import('./pages/GamesRoomPage'));
const CamerasPage = lazy(() => import('./pages/CamerasPage'));
const MusicPage = lazy(() => import('./pages/MusicPage'));
const PeoplePage = lazy(() => import('./pages/PeoplePage'));
const HealthPage = lazy(() => import('./pages/HealthPage'));
const ColdPlungePage = lazy(() => import('./pages/ColdPlungePage'));
const TodoPage = lazy(() => import('./pages/TodoPage'));
const WeatherPage = lazy(() => import('./pages/WeatherPage'));
const HeatingPage = lazy(() => import('./pages/HeatingPage'));

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/calendar" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="calendar" element={<CalendarViewList />} />
        <Route path="meals" element={<MealsPage />} />
        <Route path="weather" element={<WeatherPage />} />
        <Route path="games-room" element={<GamesRoomPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="cameras" element={<CamerasPage />} />
        <Route path="music" element={<MusicPage />} />
        <Route path="health" element={<HealthPage />} />
        <Route path="cold-plunge" element={<ColdPlungePage />} />
        <Route path="todo" element={<TodoPage />} />
        <Route path="heating" element={<HeatingPage />} />
      </Route>
    </Routes>
  );
}

export default App;
