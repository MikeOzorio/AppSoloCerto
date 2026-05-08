import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Trash2, Shield, User, Clock } from 'lucide-react';
import './Users.css';

export default function Users() {
  const { users, createUser, user: currentUser } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [trialDays, setTrialDays] = useState(7);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const res = await createUser(name, email, password, role, trialDays);
    if (res.success) {
      setSuccess('Usuário criado com sucesso!');
      setName(''); setEmail(''); setPassword(''); setRole('user'); setTrialDays(7);
      setTimeout(() => setShowForm(false), 2000);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="users-page container animate-fade-in">
      <div className="users-header">
        <div>
          <h2>Gestão de Usuários</h2>
          <p className="text-muted">Acesso restrito para administradores.</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <UserPlus size={18} /> Novo Usuário
          </button>
        )}
      </div>

      {showForm && (
        <div className="user-form-card card animate-fade-in">
          <h3>Criar Nova Conta</h3>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleCreate} className="user-form">
            <div className="input-group">
              <label>Nome Completo</label>
              <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>E-mail</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Senha Provisória</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Nível de Acesso</label>
              <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                <option value="user">Usuário Comum</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="input-group">
              <label><Clock size={14} /> Período de Teste (dias)</label>
              <input type="number" className="input" min="0" value={trialDays} onChange={e => setTrialDays(e.target.value)} placeholder="Ex: 7" />
              <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>0 = sem período de teste (acesso imediato)</span>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setError(''); setSuccess(''); }}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Cadastrar</button>
            </div>
          </form>
        </div>
      )}

      <div className="users-list">
        {users.map(u => (
          <div key={u.id} className="user-card card">
            <div className="user-avatar">
              {u.role === 'admin' ? <Shield size={24} className="text-primary" /> : <User size={24} className="text-muted" />}
            </div>
            <div className="user-info">
              <h4>{u.name} {u.id === currentUser?.id && <span className="you-badge">Você</span>}</h4>
              <p className="text-muted">{u.email}</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.25rem' }}>
                <span className={`role-badge ${u.role}`}>{u.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
                {u.trialDays > 0 && (
                  <span className="role-badge trial"><Clock size={12} /> Teste: {u.trialDays} dias</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
