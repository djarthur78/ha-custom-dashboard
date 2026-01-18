/**
 * Main App Component
 * Router configuration with MainLayout
 */

import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { CalendarView } from './components/features/calendar/CalendarView';
import { MealsPage } from './pages/MealsPage';
import { GamesRoomPage } from './pages/GamesRoomPage';
import { CamerasPage } from './pages/CamerasPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="meals" element={<MealsPage />} />
        <Route path="games-room" element={<GamesRoomPage />} />
        <Route path="cameras" element={<CamerasPage />} />
      </Route>
    </Routes>
  );
}

export default App;
