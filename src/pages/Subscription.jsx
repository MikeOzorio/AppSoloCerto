import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  ACCESS_MODULES,
  BILLING_CYCLES,
  SUBSCRIPTION_TIERS,
  mergeSubscriptionPlanConfig,
} from '../constants/subscriptionPlanConfig';
import { AlertCircle, Check, Clock, CreditCard, Crown, Star, Zap } from 'lucide-react';
import './Subscription.css';

const SETTINGS_ID = 'default';

const PERIOD_LABELS = {
  monthly: '/mês',
  quarterly: '/trimestre',
  semiannual: '/semestre',
  annual: '/ano',
};

const LEGACY_PLAN_NAMES = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  trial_15: 'Teste grátis',
  trial_admin: 'Teste liberado pelo administrador',
};

const TIER_ICONS = {
  basic: <Zap size={28} />,
  advanced: <Star size={28} />,
  premium: <Crown size={28} />,
};

function getDaysLeft(dateValue) {
  if (!dateValue) return 0;
  const end = new Date(dateValue).getTime();
  if (Number.isNaN(end)) return 0;
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatCurrency(value) {
  return Number(value || 0).toFixed(2).replace('.', ',');
}

function getPlanName(planCode, config) {
  if (!planCode) return '';
  if (LEGACY_PLAN_NAMES[planCode]) return LEGACY_PLAN_NAMES[planCode];

  const [tierId, cycleId] = planCode.split('_');
  const tierName = config.tiers?.[tierId]?.name;
  const cycleName = BILLING_CYCLES.find((cycle) => cycle.id === cycleId)?.name;

  return [tierName, cycleName].filter(Boolean).join(' ');
}

export default function Subscription({ onboarding = false }) {
  const { user, startTrial, choosePlan, logout, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [planConfig, setPlanConfig] = useState(() => mergeSubscriptionPlanConfig());
  const [selectedCycleId, setSelectedCycleId] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPlanConfig = async () => {
      if (!supabase) return;

      const { data, error: loadError } = await supabase
        .from('subscription_plan_settings')
        .select('plan_config')
        .eq('id', SETTINGS_ID)
        .maybeSingle();

      if (cancelled || loadError) return;

      const mergedConfig = mergeSubscriptionPlanConfig(data?.plan_config || {});
      setPlanConfig(mergedConfig);

      const enabledCycle = BILLING_CYCLES.find((cycle) => mergedConfig.billingCycles?.[cycle.id]?.enabled);
      if (enabledCycle) {
        setSelectedCycleId((currentCycleId) => (
          mergedConfig.billingCycles?.[currentCycleId]?.enabled ? currentCycleId : enabledCycle.id
        ));
      }
    };

    loadPlanConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  const subscription = user?.subscription || null;
  const trialDaysLeft = useMemo(() => getDaysLeft(subscription?.trial_ends_at || subscription?.ends_at), [subscription]);
  const isTrial = subscription?.status === 'trialing' && trialDaysLeft > 0;
  const currentPlanName = useMemo(() => getPlanName(subscription?.plan_code, planConfig), [subscription?.plan_code, planConfig]);

  const enabledCycles = useMemo(() => (
    BILLING_CYCLES.filter((cycle) => planConfig.billingCycles?.[cycle.id]?.enabled)
  ), [planConfig]);

  const selectedCycle = enabledCycles.find((cycle) => cycle.id === selectedCycleId) || enabledCycles[0] || BILLING_CYCLES[0];

  const plans = useMemo(() => (
    SUBSCRIPTION_TIERS
      .filter((tier) => planConfig.tiers?.[tier.id]?.enabled)
      .map((tier) => {
        const tierConfig = planConfig.tiers[tier.id];
        const limits = planConfig.limits?.[tier.id] || {};
        const enabledModules = ACCESS_MODULES.filter((module) => planConfig.access?.[tier.id]?.[module.id]);
        const visibleFeatures = enabledModules.slice(0, 6).map((module) => module.label);

        return {
          id: `${tier.id}_${selectedCycle.id}`,
          tierId: tier.id,
          name: tierConfig.name || tier.name,
          description: tierConfig.description,
          price: Number(planConfig.prices?.[tier.id]?.[selectedCycle.id] || 0),
          period: PERIOD_LABELS[selectedCycle.id] || `/${selectedCycle.name.toLowerCase()}`,
          icon: TIER_ICONS[tier.id] || <CreditCard size={28} />,
          color: tier.accent,
          features: visibleFeatures,
          modulesCount: enabledModules.length,
          highlight: Boolean(tierConfig.highlighted),
          support: limits.support,
          limits,
        };
      })
  ), [planConfig, selectedCycle]);

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

    const result = await choosePlan({
      ...plan,
      name: `${plan.name} ${selectedCycle.name}`,
      billingCycle: selectedCycle.id,
    });
    setSaving(false);

    if (!result?.success) {
      setError(result?.error || 'Não foi possível selecionar o plano.');
      return;
    }

    setMessage(`Plano ${plan.name} ${selectedCycle.name} selecionado. Em breve conectaremos o pagamento automático; por enquanto, o status fica como pagamento pendente.`);
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
                : currentPlanName
                  ? `${currentPlanName} — ${subscription?.status === 'active' ? 'Ativo' : 'Pagamento pendente'}`
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

      <div className="billing-cycle-selector" role="tablist" aria-label="Periodicidade da assinatura">
        {enabledCycles.map((cycle) => (
          <button
            key={cycle.id}
            type="button"
            className={`billing-cycle-btn ${selectedCycle.id === cycle.id ? 'active' : ''}`}
            onClick={() => setSelectedCycleId(cycle.id)}
          >
            <span>{cycle.name}</span>
            {Number(planConfig.billingCycles?.[cycle.id]?.discountPercent || 0) > 0 && (
              <small>{planConfig.billingCycles[cycle.id].discountPercent}% off</small>
            )}
          </button>
        ))}
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card card ${plan.highlight ? 'plan-highlighted' : ''}`}>
            {plan.highlight && <div className="plan-badge">Mais Popular</div>}
            <div className="plan-icon" style={{ color: plan.color, backgroundColor: `${plan.color}15` }}>
              {plan.icon}
            </div>
            <h3 className="plan-name">{plan.name}</h3>
            <p className="plan-description">{plan.description}</p>
            <div className="plan-price">
              <span className="price-currency">R$</span>
              <span className="price-value">{formatCurrency(plan.price)}</span>
              <span className="price-period">{plan.period}</span>
            </div>
            <div className="plan-limits">
              <span>{plan.limits.properties} propriedade(s)</span>
              <span>{plan.limits.users} usuário(s)</span>
              <span>{plan.modulesCount} módulos</span>
            </div>
            <ul className="plan-features">
              {plan.features.map((feature) => (
                <li key={feature}><Check size={16} style={{ color: plan.color }} /> {feature}</li>
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
