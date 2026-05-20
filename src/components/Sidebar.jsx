import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRightLeft,
  BarChart3,
  Calculator,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  CreditCard,
  FileText,
  HeadphonesIcon,
  History as HistoryIcon,
  Home,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  Tags,
  Target,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscriptionAccess } from '../context/subscriptionAccessCore';
import { useTheme } from '../context/ThemeContext';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const access = useSubscriptionAccess();
  const { isDarkMode, toggleTheme } = useTheme();
  const [collapsed] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSection = (section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const isActive = (path) => location.pathname === path;
  const isSectionActive = (paths) => paths.some((path) => location.pathname === path);
  const canUse = (moduleId) => isAdmin || Boolean(access?.canAccess?.(moduleId));

  const cadastrosPaths = [
    canUse('properties') && '/properties',
    canUse('clones') && '/clones',
    canUse('classifications') && '/classifications',
  ].filter(Boolean);

  const agronomiaPaths = [
    canUse('analysis') && '/analysis',
    canUse('history') && '/history',
    canUse('fertilization') && '/fertilization',
    canUse('applications') && '/applications',
    canUse('reports') && '/reports',
    canUse('limingGypsum') && '/liming-gypsum',
    canUse('converter') && '/converter',
  ].filter(Boolean);

  const configPaths = [
    canUse('analysisParameters') && '/settings',
    canUse('recommendations') && '/recommendations',
    canUse('monthlyDivision') && '/monthly-division',
    isAdmin && '/subscription-plans',
  ].filter(Boolean);

  const handleNavClick = () => {
    if (window.innerWidth <= 900) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/favicon.svg" alt="SoloCerto" className="sidebar-logo-img" />
          {!collapsed && <span className="sidebar-logo-text">SoloCerto</span>}
        </div>

        <nav className="sidebar-nav">
          {canUse('dashboard') && (
            <Link to="/" className={`sidebar-item ${isActive('/') ? 'active' : ''}`} onClick={handleNavClick}>
              <Home size={20} />
              {!collapsed && <span>Início</span>}
            </Link>
          )}

          {canUse('tasks') && (
            <Link to="/tasks" className={`sidebar-item ${isActive('/tasks') ? 'active' : ''}`} onClick={handleNavClick}>
              <CheckSquare size={20} />
              {!collapsed && <span>Tarefas</span>}
            </Link>
          )}

          {cadastrosPaths.length > 0 && (
            <div className="sidebar-section">
              <button
                className={`sidebar-item section-toggle ${isSectionActive(cadastrosPaths) ? 'active' : ''}`}
                onClick={() => toggleSection('cadastros')}
              >
                <MapPin size={20} />
                {!collapsed && (
                  <>
                    <span>Cadastros</span>
                    <ChevronDown size={14} className={`section-arrow ${openSection === 'cadastros' ? 'open' : ''}`} />
                  </>
                )}
              </button>
              {openSection === 'cadastros' && !collapsed && (
                <div className="sidebar-submenu">
                  {canUse('properties') && (
                    <Link to="/properties" className={`sidebar-subitem ${isActive('/properties') ? 'active' : ''}`} onClick={handleNavClick}>
                      <MapPin size={16} /> Propriedades
                    </Link>
                  )}
                  {canUse('clones') && (
                    <Link to="/clones" className={`sidebar-subitem ${isActive('/clones') ? 'active' : ''}`} onClick={handleNavClick}>
                      <Leaf size={16} /> Clones
                    </Link>
                  )}
                  {canUse('classifications') && (
                    <Link to="/classifications" className={`sidebar-subitem ${isActive('/classifications') ? 'active' : ''}`} onClick={handleNavClick}>
                      <Tags size={16} /> Classificações
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {agronomiaPaths.length > 0 && (
            <div className="sidebar-section">
              <button
                className={`sidebar-item section-toggle ${isSectionActive(agronomiaPaths) ? 'active' : ''}`}
                onClick={() => toggleSection('agronomia')}
              >
                <FileText size={20} />
                {!collapsed && (
                  <>
                    <span>Agronomia</span>
                    <ChevronDown size={14} className={`section-arrow ${openSection === 'agronomia' ? 'open' : ''}`} />
                  </>
                )}
              </button>
              {openSection === 'agronomia' && !collapsed && (
                <div className="sidebar-submenu">
                  {canUse('analysis') && (
                    <Link to="/analysis" className={`sidebar-subitem ${isActive('/analysis') ? 'active' : ''}`} onClick={handleNavClick}>
                      <FileText size={16} /> Análise de Solo
                    </Link>
                  )}
                  {canUse('history') && (
                    <Link to="/history" className={`sidebar-subitem ${isActive('/history') ? 'active' : ''}`} onClick={handleNavClick}>
                      <HistoryIcon size={16} /> Histórico
                    </Link>
                  )}
                  {canUse('fertilization') && (
                    <Link to="/fertilization" className={`sidebar-subitem ${isActive('/fertilization') ? 'active' : ''}`} onClick={handleNavClick}>
                      <Calculator size={16} /> Planejamento Safra
                    </Link>
                  )}
                  {canUse('applications') && (
                    <Link to="/applications" className={`sidebar-subitem ${isActive('/applications') ? 'active' : ''}`} onClick={handleNavClick}>
                      <CheckSquare size={16} /> Aplicações da Safra
                    </Link>
                  )}
                  {canUse('limingGypsum') && (
                    <Link to="/liming-gypsum" className={`sidebar-subitem ${isActive('/liming-gypsum') ? 'active' : ''}`} onClick={handleNavClick}>
                      <RefreshCw size={16} /> Calagem e Gessagem
                    </Link>
                  )}
                  {canUse('converter') && (
                    <Link to="/converter" className={`sidebar-subitem ${isActive('/converter') ? 'active' : ''}`} onClick={handleNavClick}>
                      <ArrowRightLeft size={16} /> Conversão de Unidades
                    </Link>
                  )}
                  {canUse('reports') && (
                    <Link to="/reports" className={`sidebar-subitem ${isActive('/reports') ? 'active' : ''}`} onClick={handleNavClick}>
                      <BarChart3 size={16} /> Relatórios
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {configPaths.length > 0 && (
            <div className="sidebar-section">
              <button
                className={`sidebar-item section-toggle ${isSectionActive(configPaths) ? 'active' : ''}`}
                onClick={() => toggleSection('config')}
              >
                <Settings size={20} />
                {!collapsed && (
                  <>
                    <span>Configurações</span>
                    <ChevronDown size={14} className={`section-arrow ${openSection === 'config' ? 'open' : ''}`} />
                  </>
                )}
              </button>
              {openSection === 'config' && !collapsed && (
                <div className="sidebar-submenu">
                  {canUse('analysisParameters') && (
                    <Link to="/settings" className={`sidebar-subitem ${isActive('/settings') ? 'active' : ''}`} onClick={handleNavClick}>
                      <Settings size={16} /> Parâmetros da Análise
                    </Link>
                  )}
                  {canUse('recommendations') && (
                    <Link to="/recommendations" className={`sidebar-subitem ${isActive('/recommendations') ? 'active' : ''}`} onClick={handleNavClick}>
                      <Target size={16} /> Tabelas Produtividade
                    </Link>
                  )}
                  {canUse('monthlyDivision') && (
                    <Link to="/monthly-division" className={`sidebar-subitem ${isActive('/monthly-division') ? 'active' : ''}`} onClick={handleNavClick}>
                      <CalendarDays size={16} /> Divisão Mensal Global
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/subscription-plans" className={`sidebar-subitem ${isActive('/subscription-plans') ? 'active' : ''}`} onClick={handleNavClick}>
                      <CreditCard size={16} /> Planos de Assinatura
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <Link to="/users" className={`sidebar-item ${isActive('/users') ? 'active' : ''}`} onClick={handleNavClick}>
              <UsersIcon size={20} />
              {!collapsed && <span>Usuários</span>}
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <Link to="/subscription" className={`sidebar-item ${isActive('/subscription') ? 'active' : ''}`} onClick={handleNavClick}>
            <CreditCard size={20} />
            {!collapsed && <span>Assinatura</span>}
          </Link>

          {canUse('support') && (
            <Link to="/support" className={`sidebar-item ${isActive('/support') ? 'active' : ''}`} onClick={handleNavClick}>
              <HeadphonesIcon size={20} />
              {!collapsed && <span>Suporte</span>}
            </Link>
          )}

          <button className="sidebar-item" onClick={toggleTheme}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!collapsed && <span>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </button>

          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.name}</span>
                <span className="sidebar-user-role">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
              </div>
            )}
            <button className="sidebar-logout" onClick={logout} title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
