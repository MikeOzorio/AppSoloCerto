import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Coffee, LogIn, AlertCircle } from 'lucide-react';
import './Login.css';

export default function Login() {
  const { login, authError, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card animate-fade-in">
        <div className="login-logo">
          <img src="/favicon.png" alt="CoffeTI" className="login-icon" />
          <h1>CoffeTI - Pro</h1>
          <p className="text-muted">Gestão Inteligente do Solo para Café Conilon</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {(authError || error) && (
            <div className="login-error">
              <AlertCircle size={16} /> {authError || error}
            </div>
          )}
          
          <div className="input-group">
            <label>E-mail</label>
            <input 
              type="email" 
              className="input" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoFocus
            />
          </div>
          
          <div className="input-group">
            <label>Senha</label>
            <input 
              type="password" 
              className="input" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            <LogIn size={18} /> {loading ? 'Carregando...' : 'Entrar'}
          </button>
        </form>

        <p className="login-footer text-muted">
          Acesso pelo Supabase Auth. Crie o primeiro usuário no painel do Supabase.
        </p>
      </div>
    </div>
  );
}
