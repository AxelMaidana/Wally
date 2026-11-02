import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import DevPage from './pages/DevPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import DataDemo from './pages/DataDemo';
// import SettingsPage from './pages/SettingsPage';
import DebugApiPage from './pages/DebugApiPage';
import { ThemeToggle } from './components/ThemeToggle';
import { BootShell } from './components/BootShell';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  return children;
};

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isLegalPage = location.pathname === '/terms' || location.pathname === '/privacy';

  if (user && !isLegalPage) {
    return <Layout>{children}</Layout>;
  }

  return (
    <div className="relative min-h-dvh text-ink">
      <div className="ambient" aria-hidden="true" />
      <ThemeToggle className="fixed top-5 right-5 z-[101]" />
      {isLegalPage && (
        <Link
          to="/"
          className="pill-ghost fixed top-5 left-5 z-[101] backdrop-blur-xl"
        >
          Volver
        </Link>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) return <BootShell />;

  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* Public Legal Routes */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Auth Route */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Main Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/dev" element={
            <ProtectedRoute>
              <DevPage />
            </ProtectedRoute>
          } />

          <Route path="/data" element={
            <ProtectedRoute>
              <DataDemo />
            </ProtectedRoute>
          } />

          {/* <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } /> */}

          <Route path="/api" element={
            <ProtectedRoute>
              <DebugApiPage />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;
