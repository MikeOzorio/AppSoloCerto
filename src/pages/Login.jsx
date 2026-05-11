import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, UserPlus, CheckCircle } from 'lucide-react';
import './Login.css';

const initialSignup = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  birthDate: '',
  cpf: '',
  password: '',
  confirmPassword: '',
};

export default function Login() {
  const { login, signup, authError, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupForm, setSignupForm] = useState(initialSignup);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    const result = await login(email, password);
    if (!result.success) setError(result.error);
  };

  const handleSignupChange = (field, value) => {
    setSignupForm(prev => ({ ...prev, [field]: value }));
  };

  const validateSignup = () => {
    const required = ['firstName', 'lastName', 'phone', 'email', 'birthDate', 'cpf', 'password'];
    const missing = required.find(field => !String(signupForm[field] || '').trim());
    if (missing) return 'Preencha todos os campos do cadastro.';
    if (signupForm.password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (signupForm.password !== signupForm.confirmPassword) return 'A confirmação de senha não confere.';
    if (signupForm.cpf.replace(/\D/g, '').length !== 11) return 'Informe um CPF com 11 dígitos.';
    return '';
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const validation = validateSignup();
    if (validation) {
      setError(validation);
      return;
    }
    const result = await signup(signupForm);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(result.message);
    setSignupForm(initialSignup);
    if (result.needsEmailConfirmation) setMode('login');
  };

  return (
    <div className="login-page">
      <div className="login-card animate-fade-in login-card-wide">
        <div className="login-logo">
          <img src="/favicon.png" alt="Solo Certo" className="login-icon" />
          <h1>Solo Certo</h1>
          <p className="text-muted">Gestão Inteligente do Solo para Café Conilon</p>
        </div>

        <div className="login-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>Entrar</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}>Criar conta</button>
        </div>
        
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="login-form">
            {(authError || error) && <div className="login-error"><AlertCircle size={16} /> {authError || error}</div>}
            {success && <div className="login-success"><CheckCircle size={16} /> {success}</div>}
            <div className="input-group">
              <label>E-mail</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" autoFocus />
            </div>
            <div className="input-group">
              <label>Senha</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              <LogIn size={18} /> {loading ? 'Carregando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="login-form">
            {error && <div className="login-error"><AlertCircle size={16} /> {error}</div>}
            {success && <div className="login-success"><CheckCircle size={16} /> {success}</div>}
            <div className="form-row-2">
              <div className="input-group">
                <label>Nome</label>
                <input className="input" value={signupForm.firstName} onChange={e => handleSignupChange('firstName', e.target.value)} placeholder="Nome" />
              </div>
              <div className="input-group">
                <label>Sobrenome</label>
                <input className="input" value={signupForm.lastName} onChange={e => handleSignupChange('lastName', e.target.value)} placeholder="Sobrenome" />
              </div>
            </div>
            <div className="form-row-2">
              <div className="input-group">
                <label>Telefone</label>
                <input className="input" value={signupForm.phone} onChange={e => handleSignupChange('phone', e.target.value)} placeholder="(27) 99999-9999" />
              </div>
              <div className="input-group">
                <label>CPF</label>
                <input className="input" value={signupForm.cpf} onChange={e => handleSignupChange('cpf', e.target.value)} placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="form-row-2">
              <div className="input-group">
                <label>E-mail</label>
                <input type="email" className="input" value={signupForm.email} onChange={e => handleSignupChange('email', e.target.value)} placeholder="seu@email.com" />
              </div>
              <div className="input-group">
                <label>Data de nascimento</label>
                <input type="date" className="input" value={signupForm.birthDate} onChange={e => handleSignupChange('birthDate', e.target.value)} />
              </div>
            </div>
            <div className="form-row-2">
              <div className="input-group">
                <label>Senha</label>
                <input type="password" className="input" value={signupForm.password} onChange={e => handleSignupChange('password', e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="input-group">
                <label>Confirmar senha</label>
                <input type="password" className="input" value={signupForm.confirmPassword} onChange={e => handleSignupChange('confirmPassword', e.target.value)} placeholder="Repita a senha" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              <UserPlus size={18} /> Criar conta
            </button>
          </form>
        )}

        <p className="login-footer text-muted">
          Após validar o e-mail, o usuário escolhe teste grátis de 15 dias ou assinatura.
        </p>
      </div>
    </div>
  );
}
