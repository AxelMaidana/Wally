import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import DevPage from './pages/DevPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import { ThemeToggle } from './components/ThemeToggle';
import './App.css';

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
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-500">
      {isLegalPage && (
        <Link
          to="/"
          className="fixed top-6 left-20 z-[101] px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold hover:text-primary transition-all shadow-sm"
        >
          ← Volver
        </Link>
      )}
      {children}
    </div>
  );
};

const AppContent = () => {
  return (
    <Router>
      <ThemeToggle />
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
