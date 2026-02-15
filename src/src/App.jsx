/**
 * Main App Component
 * Router configuration with MainLayout
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { CalendarViewList } from './components/features/calendar/CalendarViewList';
import { MealsPage } from './pages/MealsPage';
import { GamesRoomPage } from './pages/GamesRoomPage';
import { CamerasPage } from './pages/CamerasPage';
import { MusicPage } from './pages/MusicPage';
import { PeoplePage } from './pages/PeoplePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/calendar" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="calendar" element={<CalendarViewList />} />
        <Route path="meals" element={<MealsPage />} />
        <Route path="games-room" element={<GamesRoomPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="cameras" element={<CamerasPage />} />
        <Route path="music" element={<MusicPage />} />
      </Route>
    </Routes>
  );
}

export default App;
