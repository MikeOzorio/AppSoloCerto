import React, { useState } from 'react';
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

export default function Subscription() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const trialDaysLeft = (() => {
    if (!user?.trialDays || !user?.createdAt) return 0;
    const created = new Date(user.createdAt);
    const now = new Date();
    const diffDays = Math.ceil((now - created) / (1000 * 60 * 60 * 24));
    return Math.max(0, user.trialDays - diffDays);
  })();

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    alert(`Plano "${PLANS.find(p => p.id === planId)?.name}" selecionado!\n\nEm breve a integração com pagamento estará disponível. Por enquanto, entre em contato com o suporte para ativar seu plano.`);
  };

  return (
    <div className="subscription-page container animate-fade-in">
      <div className="sub-header">
        <h2>Gerenciamento de Assinatura</h2>
        <p className="text-muted">Escolha o plano ideal para a sua operação agrícola.</p>
      </div>

      {/* Status Card */}
      <div className="sub-status-card card">
        <div className="sub-status-left">
          <div className="sub-status-icon">
            <CreditCard size={24} />
          </div>
          <div>
            <h3>Plano Atual</h3>
            <p className="text-muted">
              {trialDaysLeft > 0 
                ? `Período de Teste — ${trialDaysLeft} dia(s) restante(s)`
                : 'Nenhum plano ativo. Selecione um plano abaixo.'
              }
            </p>
          </div>
        </div>
        {trialDaysLeft > 0 && (
          <div className="sub-trial-badge">
            <Clock size={16} />
            <span>Trial: {trialDaysLeft}d</span>
          </div>
        )}
      </div>

      {trialDaysLeft > 0 && trialDaysLeft <= 3 && (
        <div className="alert warning" style={{ marginBottom: '2rem' }}>
          <AlertCircle size={18} /> Seu período de teste está acabando! Assine um plano para não perder acesso.
        </div>
      )}

      {/* Plans Grid */}
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
              onClick={() => handleSelectPlan(plan.id)}
            >
              Assinar Agora
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
