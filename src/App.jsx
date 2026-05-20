import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import History from './pages/History';
import Properties from './pages/Properties';
import Clones from './pages/Clones';
import Fertilization from './pages/Fertilization';
import Applications from './pages/Applications';
import Recommendations from './pages/Recommendations';
import MonthlyDivision from './pages/MonthlyDivision';
import Classifications from './pages/Classifications';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Subscription from './pages/Subscription';
import SubscriptionPlans from './pages/SubscriptionPlans';
import Support from './pages/Support';
import Login from './pages/Login';
import Tasks from './pages/Tasks';
import LimingGypsum from './pages/LimingGypsum';
import UnitConverter from './pages/UnitConverter';
import { SoilProvider } from './context/SoilContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionAccessProvider } from './context/SubscriptionAccessContext';
import { useSubscriptionAccess } from './context/subscriptionAccessCore';
import { ThemeProvider } from './context/ThemeContext';
import { ACCESS_MODULES } from './constants/subscriptionPlanConfig';

function AccessDenied({ moduleId, adminOnly = false }) {
  const moduleName = ACCESS_MODULES.find((module) => module.id === moduleId)?.label || 'este módulo';

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <div className="card" style={{ maxWidth: 680 }}>
        <h2>{adminOnly ? 'Acesso administrativo' : 'Módulo não liberado'}</h2>
        <p className="text-muted" style={{ marginTop: 8 }}>
          {adminOnly
            ? 'Esta área está disponível apenas para administradores.'
            : `O plano atual não possui acesso a ${moduleName}.`}
        </p>
        {!adminOnly && (
          <Link to="/subscription" className="btn btn-primary" style={{ marginTop: 16 }}>
            Ver assinatura
          </Link>
        )}
      </div>
    </div>
  );
}

function PlanRoute({ moduleId, children }) {
  const access = useSubscriptionAccess();

  if (access?.loading) {
    return <div className="container">Carregando acessos...</div>;
  }

  if (!access?.canAccess(moduleId)) {
    return <AccessDenied moduleId={moduleId} />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <AccessDenied adminOnly />;
}

function AppRoutes() {
  const { isAuthenticated, loading, hasActiveSubscription, authError } = useAuth();

  if (loading) {
    return <div className="container">Carregando...</div>;
  }

  if (authError) {
    return (
      <div className="container" style={{ padding: 24 }}>
        <h2>Não foi possível carregar a sessão</h2>
        <p>{authError}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
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
          <Route path="/" element={<PlanRoute moduleId="dashboard"><Home /></PlanRoute>} />
          <Route path="/analysis" element={<PlanRoute moduleId="analysis"><Analysis /></PlanRoute>} />
          <Route path="/history" element={<PlanRoute moduleId="history"><History /></PlanRoute>} />
          <Route path="/properties" element={<PlanRoute moduleId="properties"><Properties /></PlanRoute>} />
          <Route path="/clones" element={<PlanRoute moduleId="clones"><Clones /></PlanRoute>} />
          <Route path="/classifications" element={<PlanRoute moduleId="classifications"><Classifications /></PlanRoute>} />
          <Route path="/fertilization" element={<PlanRoute moduleId="fertilization"><Fertilization /></PlanRoute>} />
          <Route path="/applications" element={<PlanRoute moduleId="applications"><Applications /></PlanRoute>} />
          <Route path="/recommendations" element={<PlanRoute moduleId="recommendations"><Recommendations /></PlanRoute>} />
          <Route path="/liming-gypsum" element={<PlanRoute moduleId="limingGypsum"><LimingGypsum /></PlanRoute>} />
          <Route path="/tasks" element={<PlanRoute moduleId="tasks"><Tasks /></PlanRoute>} />
          <Route path="/converter" element={<PlanRoute moduleId="converter"><UnitConverter /></PlanRoute>} />
          <Route path="/reports" element={<PlanRoute moduleId="reports"><Reports /></PlanRoute>} />
          <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/settings" element={<PlanRoute moduleId="analysisParameters"><Settings /></PlanRoute>} />
          <Route path="/monthly-division" element={<PlanRoute moduleId="monthlyDivision"><MonthlyDivision /></PlanRoute>} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/subscription-plans" element={<AdminRoute><SubscriptionPlans /></AdminRoute>} />
          <Route path="/support" element={<PlanRoute moduleId="support"><Support /></PlanRoute>} />
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
      <SubscriptionAccessProvider>
      <SoilProvider>
        <BrowserRouter>
          <div className="app-container">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </SoilProvider>
      </SubscriptionAccessProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
