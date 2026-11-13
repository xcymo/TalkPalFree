import { ErrorBoundary } from './components/ErrorBoundary';
import { BottomNav } from './components/BottomNav';
import { ToastProvider } from './components/Toast';
import { SettingsProvider } from './hooks/useSettings';
import { PracticeProvider } from './hooks/usePractice';
import { useHashRoute } from './hooks/useHashRoute';
import { TodayPage } from './pages/TodayPage';
import { PracticePage } from './pages/PracticePage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const { route, navigate } = useHashRoute();

  return (
    <SettingsProvider>
      <ToastProvider>
        <ErrorBoundary>
          <PracticeProvider>
            <div className="app-pattern mx-auto min-h-dvh w-full max-w-[520px] px-4 pb-28 pt-safe">
              {route === 'today' && <TodayPage navigate={navigate} />}
              {route === 'practice' && <PracticePage navigate={navigate} />}
              {route === 'history' && <HistoryPage navigate={navigate} />}
              {route === 'settings' && <SettingsPage />}
            </div>
            <BottomNav route={route} navigate={navigate} />
          </PracticeProvider>
        </ErrorBoundary>
      </ToastProvider>
    </SettingsProvider>
  );
}
