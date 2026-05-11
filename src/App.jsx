import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import History from './pages/History';
import Properties from './pages/Properties';
import Clones from './pages/Clones';
import Fertilization from './pages/Fertilization';
import Recommendations from './pages/Recommendations';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Subscription from './pages/Subscription';
import Support from './pages/Support';
import Login from './pages/Login';
import { SoilProvider } from './context/SoilContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, hasActiveSubscription } = useAuth();
  if (loading) return <div className="container">Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated, loading, hasActiveSubscription } = useAuth();

  if (loading) {
    return <div className="container">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="app-layout">
        <main className="main-content" style={{ marginLeft: 0 }}>
          <Routes>
            <Route path="/subscription" element={<Subscription onboarding />} />
            <Route path="*" element={<Navigate to="/subscription" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/history" element={<History />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/clones" element={<Clones />} />
          <Route path="/fertilization" element={<Fertilization />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/support" element={<Support />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <SoilProvider>
        <BrowserRouter>
          <div className="app-container">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </SoilProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
