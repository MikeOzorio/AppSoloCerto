import { Link, useLocation } from 'react-router-dom';
import { Coffee, Settings, FileText, History as HistoryIcon, MapPin, Leaf, LogOut, Calculator, Users as UsersIcon, ChevronDown, Target, Moon, Sun, CreditCard, HeadphonesIcon, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-logo">
          <img src="/favicon.svg" alt="SoloCerto" className="nav-logo-img" />
          <span>SoloCerto</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <Coffee size={20} /> <span className="nav-label">Início</span>
          </Link>

          <div className="nav-dropdown">
            <div className={`nav-link ${(location.pathname === '/properties' || location.pathname === '/clones') ? 'active' : ''}`}>
              <MapPin size={20} /> <span className="nav-label">Cadastros</span> <ChevronDown size={14} className="dropdown-arrow" />
            </div>
            <div className="dropdown-menu">
              <Link to="/properties" className="dropdown-item"><MapPin size={16} /> Propriedades</Link>
              <Link to="/clones" className="dropdown-item"><Leaf size={16} /> Clones</Link>
            </div>
          </div>

          <div className="nav-dropdown">
            <div className={`nav-link ${(location.pathname === '/analysis' || location.pathname === '/history' || location.pathname === '/fertilization' || location.pathname === '/applications' || location.pathname === '/reports') ? 'active' : ''}`}>
              <FileText size={20} /> <span className="nav-label">Agronomia</span> <ChevronDown size={14} className="dropdown-arrow" />
            </div>
            <div className="dropdown-menu">
              <Link to="/analysis" className="dropdown-item"><FileText size={16} /> Análise de Solo</Link>
              <Link to="/history" className="dropdown-item"><HistoryIcon size={16} /> Histórico</Link>
              <Link to="/fertilization" className="dropdown-item"><Calculator size={16} /> Planejamento de Safra</Link>
              <Link to="/applications" className="dropdown-item"><CheckSquare size={16} /> Aplica&ccedil;&otilde;es da Safra</Link>
              <Link to="/reports" className="dropdown-item"><FileText size={16} /> Relatórios Financeiros</Link>
            </div>
          </div>

          <div className="nav-dropdown">
            <div className={`nav-link ${(location.pathname === '/settings' || location.pathname === '/recommendations' || location.pathname === '/subscription-plans') ? 'active' : ''}`}>
              <Settings size={20} /> <span className="nav-label">Config</span> <ChevronDown size={14} className="dropdown-arrow" />
            </div>
            <div className="dropdown-menu">
              <Link to="/settings" className="dropdown-item"><Settings size={16} /> Parâmetros da Análise</Link>
              <Link to="/recommendations" className="dropdown-item"><Target size={16} /> Tabelas Produt.</Link>
              {isAdmin && <Link to="/subscription-plans" className="dropdown-item"><CreditCard size={16} /> Planos de Assinatura</Link>}
            </div>
          </div>

          {isAdmin && (
            <Link to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}>
              <UsersIcon size={20} /> <span className="nav-label">Usuários</span>
            </Link>
          )}

          <div className="nav-divider" />

          <button className="nav-link logout-btn" onClick={toggleTheme} title="Alternar Tema Escuro/Claro">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="nav-dropdown">
            <div className={`nav-link ${(location.pathname === '/subscription' || location.pathname === '/support') ? 'active' : ''}`}>
              <span className="nav-user">{user?.name}</span> <ChevronDown size={14} className="dropdown-arrow" />
            </div>
            <div className="dropdown-menu" style={{ right: 0, left: 'auto' }}>
              <Link to="/subscription" className="dropdown-item"><CreditCard size={16} /> Minha Assinatura</Link>
              <Link to="/support" className="dropdown-item"><HeadphonesIcon size={16} /> Suporte / Contato</Link>
              <button className="dropdown-item logout-btn" onClick={logout} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--color-danger)' }}>
                <LogOut size={16} /> Sair do Sistema
              </button>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}
