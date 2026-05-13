import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Coffee, Settings, FileText, History as HistoryIcon, MapPin, Leaf, LogOut, Tags, 
  Calculator, Users as UsersIcon, ChevronDown, Target, Moon, Sun, 
  CreditCard, HeadphonesIcon, Home, Menu, X, BarChart3, CalendarDays
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSection = (section) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  const isActive = (path) => location.pathname === path;
  const isSectionActive = (paths) => paths.some(p => location.pathname === p);

  const handleNavClick = () => {
    if (window.innerWidth <= 900) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <img src="/favicon.png" alt="SoloCerto" className="sidebar-logo-img" />
          {!collapsed && <span className="sidebar-logo-text">SoloCerto</span>}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <Link to="/" className={`sidebar-item ${isActive('/') ? 'active' : ''}`} onClick={handleNavClick}>
            <Home size={20} />
            {!collapsed && <span>Início</span>}
          </Link>

          {/* Cadastros */}
          <div className="sidebar-section">
            <button 
              className={`sidebar-item section-toggle ${isSectionActive(['/properties', '/clones', '/classifications']) ? 'active' : ''}`}
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
                <Link to="/properties" className={`sidebar-subitem ${isActive('/properties') ? 'active' : ''}`} onClick={handleNavClick}>
                  <MapPin size={16} /> Propriedades
                </Link>
                <Link to="/clones" className={`sidebar-subitem ${isActive('/clones') ? 'active' : ''}`} onClick={handleNavClick}>
                  <Leaf size={16} /> Clones
                </Link>
                <Link to="/classifications" className={`sidebar-subitem ${isActive('/classifications') ? 'active' : ''}`} onClick={handleNavClick}>
                  <Tags size={16} /> Classificações
                </Link>
              </div>
            )}
          </div>

          {/* Agronomia */}
          <div className="sidebar-section">
            <button 
              className={`sidebar-item section-toggle ${isSectionActive(['/analysis', '/history', '/fertilization', '/reports']) ? 'active' : ''}`}
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
                <Link to="/analysis" className={`sidebar-subitem ${isActive('/analysis') ? 'active' : ''}`} onClick={handleNavClick}>
                  <FileText size={16} /> Análise de Solo
                </Link>
                <Link to="/history" className={`sidebar-subitem ${isActive('/history') ? 'active' : ''}`} onClick={handleNavClick}>
                  <HistoryIcon size={16} /> Histórico
                </Link>
                <Link to="/fertilization" className={`sidebar-subitem ${isActive('/fertilization') ? 'active' : ''}`} onClick={handleNavClick}>
                  <Calculator size={16} /> Planejamento Safra
                </Link>
                <Link to="/reports" className={`sidebar-subitem ${isActive('/reports') ? 'active' : ''}`} onClick={handleNavClick}>
                  <BarChart3 size={16} /> Relatórios
                </Link>
              </div>
            )}
          </div>

          {/* Configurações */}
          <div className="sidebar-section">
            <button 
              className={`sidebar-item section-toggle ${isSectionActive(['/settings', '/recommendations', '/monthly-division']) ? 'active' : ''}`}
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
                <Link to="/settings" className={`sidebar-subitem ${isActive('/settings') ? 'active' : ''}`} onClick={handleNavClick}>
                  <Settings size={16} /> Parâmetros da Análise
                </Link>
                <Link to="/recommendations" className={`sidebar-subitem ${isActive('/recommendations') ? 'active' : ''}`} onClick={handleNavClick}>
                  <Target size={16} /> Tabelas Produtividade
                </Link>
                <Link to="/monthly-division" className={`sidebar-subitem ${isActive('/monthly-division') ? 'active' : ''}`} onClick={handleNavClick}>
                  <CalendarDays size={16} /> Divisão Mensal Global
                </Link>
              </div>
            )}
          </div>

          {isAdmin && (
            <Link to="/users" className={`sidebar-item ${isActive('/users') ? 'active' : ''}`} onClick={handleNavClick}>
              <UsersIcon size={20} />
              {!collapsed && <span>Usuários</span>}
            </Link>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <Link to="/subscription" className={`sidebar-item ${isActive('/subscription') ? 'active' : ''}`} onClick={handleNavClick}>
            <CreditCard size={20} />
            {!collapsed && <span>Assinatura</span>}
          </Link>
          <Link to="/support" className={`sidebar-item ${isActive('/support') ? 'active' : ''}`} onClick={handleNavClick}>
            <HeadphonesIcon size={20} />
            {!collapsed && <span>Suporte</span>}
          </Link>

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
