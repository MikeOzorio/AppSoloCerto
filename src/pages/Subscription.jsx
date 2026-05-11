import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Check, Star, Zap, Crown, Clock, AlertCircle } from 'lucide-react';
import './Subscription.css';

const PLANS = [
  {
    id: 'mensal',
    name: 'Mensal',
    price: 49.90,
    period: '/mês',
    icon: <Zap size={28} />,
    color: '#3b82f6',
    features: ['Análise de Solo ilimitada', 'Histórico completo', 'Planejamento de Safra', 'Relatórios Financeiros'],
    highlight: false
  },
  {
    id: 'trimestral',
    name: 'Trimestral',
    price: 129.90,
    period: '/3 meses',
    savings: 'Economia de R$ 19,80',
    icon: <Star size={28} />,
    color: '#8b5a2b',
    features: ['Tudo do Mensal', 'Suporte prioritário', 'Exportação de PDF', 'Desconto de 13%'],
    highlight: true
  },
  {
    id: 'semestral',
    name: 'Semestral',
    price: 239.90,
    period: '/6 meses',
    savings: 'Economia de R$ 59,50',
    icon: <Crown size={28} />,
    color: '#2e8b57',
    features: ['Tudo do Trimestral', 'Consultoria técnica mensal', 'Multi-propriedades', 'Desconto de 20%'],
    highlight: false
  },
  {
    id: 'anual',
    name: 'Anual',
    price: 399.90,
    period: '/ano',
    savings: 'Economia de R$ 198,90',
    icon: <Crown size={28} />,
    color: '#7c3aed',
    features: ['Tudo do Semestral', 'Acesso a novas funcionalidades', 'Backup na nuvem', 'Desconto de 33%'],
    highlight: false
  }
];

function getDaysLeft(dateValue) {
  if (!dateValue) return 0;
  const end = new Date(dateValue).getTime();
  if (Number.isNaN(end)) return 0;
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function Subscription({ onboarding = false }) {
  const { user, startTrial, choosePlan, logout, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const subscription = user?.subscription || null;
  const trialDaysLeft = useMemo(() => getDaysLeft(subscription?.trial_ends_at || subscription?.ends_at), [subscription]);
  const isTrial = subscription?.status === 'trialing' && trialDaysLeft > 0;
  const currentPlan = PLANS.find((plan) => plan.id === subscription?.plan_code);

  const handleStartTrial = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    const result = await startTrial();
    setSaving(false);

    if (!result?.success) {
      setError(result?.error || 'Não foi possível iniciar o teste grátis.');
      return;
    }

    setMessage('Teste grátis ativado por 15 dias. Redirecionando...');
    await refreshCurrentUser?.();
    setTimeout(() => navigate('/', { replace: true }), 500);
  };

  const handleSelectPlan = async (plan) => {
    setSaving(true);
    setError('');
    setMessage('');
    setSelectedPlan(plan.id);

    const result = await choosePlan(plan);
    setSaving(false);

    if (!result?.success) {
      setError(result?.error || 'Não foi possível selecionar o plano.');
      return;
    }

    setMessage(`Plano ${plan.name} selecionado. Em breve conectaremos o pagamento automático; por enquanto, o status fica como pagamento pendente.`);
    await refreshCurrentUser?.();
  };

  return (
    <div className="subscription-page container animate-fade-in">
      <div className="sub-header">
        <h2>{onboarding ? 'Escolha como começar' : 'Gerenciamento de Assinatura'}</h2>
        <p className="text-muted">
          {onboarding ? 'Ative seu teste grátis de 15 dias ou escolha uma assinatura.' : 'Escolha o plano ideal para a sua operação agrícola.'}
        </p>
        {onboarding && (
          <button className="btn btn-secondary" onClick={logout} style={{ marginTop: '1rem' }} disabled={saving}>
            Sair e trocar usuário
          </button>
        )}
      </div>

      {(message || error) && (
        <div className={`alert ${error ? 'danger' : 'success'}`} style={{ marginBottom: '1rem' }}>
          {error || message}
        </div>
      )}

      {onboarding && (
        <div className="sub-status-card card" style={{ border: '2px solid var(--color-primary)' }}>
          <div className="sub-status-left">
            <div className="sub-status-icon"><Clock size={24} /></div>
            <div>
              <h3>Teste grátis de 15 dias</h3>
              <p className="text-muted">Comece agora sem pagamento. Depois você pode escolher um plano.</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleStartTrial} disabled={saving}>
            {saving ? 'Salvando...' : 'Começar teste grátis'}
          </button>
        </div>
      )}

      <div className="sub-status-card card">
        <div className="sub-status-left">
          <div className="sub-status-icon">
            <CreditCard size={24} />
          </div>
          <div>
            <h3>Plano Atual</h3>
            <p className="text-muted">
              {isTrial
                ? `Teste grátis — ${trialDaysLeft} dia(s) restante(s)`
                : currentPlan
                  ? `${currentPlan.name} — ${subscription?.status === 'active' ? 'Ativo' : 'Pagamento pendente'}`
                  : 'Nenhum plano ativo. Selecione um plano abaixo.'}
            </p>
          </div>
        </div>
        {isTrial && (
          <div className="sub-trial-badge">
            <Clock size={16} />
            <span>Trial: {trialDaysLeft}d</span>
          </div>
        )}
      </div>

      {isTrial && trialDaysLeft <= 3 && (
        <div className="alert warning" style={{ marginBottom: '2rem' }}>
          <AlertCircle size={18} /> Seu período de teste está acabando! Assine um plano para não perder acesso.
        </div>
      )}

      <div className="plans-grid">
        {PLANS.map(plan => (
          <div key={plan.id} className={`plan-card card ${plan.highlight ? 'plan-highlighted' : ''}`}>
            {plan.highlight && <div className="plan-badge">Mais Popular</div>}
            <div className="plan-icon" style={{ color: plan.color, backgroundColor: `${plan.color}15` }}>
              {plan.icon}
            </div>
            <h3 className="plan-name">{plan.name}</h3>
            <div className="plan-price">
              <span className="price-currency">R$</span>
              <span className="price-value">{plan.price.toFixed(2).replace('.', ',')}</span>
              <span className="price-period">{plan.period}</span>
            </div>
            {plan.savings && <span className="plan-savings">{plan.savings}</span>}
            <ul className="plan-features">
              {plan.features.map((f, i) => (
                <li key={i}><Check size={16} style={{ color: plan.color }} /> {f}</li>
              ))}
            </ul>
            <button
              className={`btn ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
              style={plan.highlight ? { backgroundColor: plan.color } : {}}
              onClick={() => handleSelectPlan(plan)}
              disabled={saving}
            >
              {selectedPlan === plan.id ? 'Selecionado' : 'Assinar Agora'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
