import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loading } from './components/common/Loading';
import { useAuth } from './hooks/useAuth';

// 樣式導入
import './styles/global.css';
import './styles/auth.css';
import './styles/header.css';
import './styles/feed.css';

// Lazy loading 頁面
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const MainApp = lazy(() => import('./App').then(m => ({ default: m.default })));

function AppRouter() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? <MainApp /> : <Navigate to="/auth" replace />
            }
          />
          <Route
            path="/auth"
            element={
              !isAuthenticated ? <AuthPage onAuthSuccess={() => {}} /> : <Navigate to="/" replace />
            }
          />
          <Route path="/u/:username" element={<MainApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRouter;
