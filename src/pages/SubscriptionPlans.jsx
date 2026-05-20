import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  ACCESS_MODULES,
  BILLING_CYCLES,
  DEFAULT_SUBSCRIPTION_PLAN_CONFIG,
  LIMIT_FIELDS,
  SUBSCRIPTION_TIERS,
  SUPPORT_OPTIONS,
  mergeSubscriptionPlanConfig,
} from '../constants/subscriptionPlanConfig';
import { useSubscriptionAccess } from '../context/subscriptionAccessCore';
import './SubscriptionPlans.css';

const SETTINGS_ID = 'default';

const formatCurrency = (value) => {
  const numericValue = Number(value || 0);
  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const createPlanRows = (config) => (
  SUBSCRIPTION_TIERS.flatMap((tier) => (
    BILLING_CYCLES.map((cycle) => {
      const enabledModules = ACCESS_MODULES
        .filter((module) => config.access?.[tier.id]?.[module.id])
        .map((module) => module.label);

      return {
        code: `${tier.id}_${cycle.id}`,
        name: `${config.tiers[tier.id]?.name || tier.name} ${cycle.name}`,
        billing_period: cycle.id,
        price_cents: Math.round(Number(config.prices?.[tier.id]?.[cycle.id] || 0) * 100),
        trial_days: 0,
        features: enabledModules,
        active: Boolean(config.tiers?.[tier.id]?.enabled && config.billingCycles?.[cycle.id]?.enabled),
      };
    })
  ))
);

export default function SubscriptionPlans() {
  const { user, isAdmin } = useAuth();
  const { reloadAccessConfig } = useSubscriptionAccess();
  const [config, setConfig] = useState(() => mergeSubscriptionPlanConfig());
  const [activeTierId, setActiveTierId] = useState('advanced');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const groupedModules = useMemo(() => (
    ACCESS_MODULES.reduce((groups, module) => {
      if (!groups[module.group]) groups[module.group] = [];
      groups[module.group].push(module);
      return groups;
    }, {})
  ), []);

  const activeTier = SUBSCRIPTION_TIERS.find((tier) => tier.id === activeTierId) || SUBSCRIPTION_TIERS[0];
  const activeModulesCount = ACCESS_MODULES.filter((module) => config.access?.[activeTierId]?.[module.id]).length;

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      setLoading(true);
      setError('');

      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error: loadError } = await supabase
        .from('subscription_plan_settings')
        .select('plan_config, updated_at')
        .eq('id', SETTINGS_ID)
        .maybeSingle();

      if (cancelled) return;

      if (loadError) {
        setError('Não foi possível carregar as configurações. Rode o arquivo supabase/subscription_plan_settings.sql no Supabase e tente novamente.');
        setConfig(mergeSubscriptionPlanConfig(DEFAULT_SUBSCRIPTION_PLAN_CONFIG));
      } else {
        setConfig(mergeSubscriptionPlanConfig(data?.plan_config || DEFAULT_SUBSCRIPTION_PLAN_CONFIG));
        setLastUpdated(data?.updated_at || '');
      }

      setLoading(false);
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateTier = (tierId, field, value) => {
    setConfig((current) => ({
      ...current,
      tiers: {
        ...current.tiers,
        [tierId]: {
          ...current.tiers[tierId],
          [field]: value,
        },
      },
    }));
  };

  const updatePrice = (tierId, cycleId, value) => {
    setConfig((current) => ({
      ...current,
      prices: {
        ...current.prices,
        [tierId]: {
          ...current.prices[tierId],
          [cycleId]: value,
        },
      },
    }));
  };

  const updateBillingCycle = (cycleId, field, value) => {
    setConfig((current) => ({
      ...current,
      billingCycles: {
        ...current.billingCycles,
        [cycleId]: {
          ...current.billingCycles[cycleId],
          [field]: value,
        },
      },
    }));
  };

  const updateAccess = (tierId, moduleId, value) => {
    setConfig((current) => ({
      ...current,
      access: {
        ...current.access,
        [tierId]: {
          ...current.access[tierId],
          [moduleId]: value,
        },
      },
    }));
  };

  const setTierGroupAccess = (tierId, modules, value) => {
    setConfig((current) => ({
      ...current,
      access: {
        ...current.access,
        [tierId]: {
          ...current.access[tierId],
          ...Object.fromEntries(modules.map((module) => [module.id, value])),
        },
      },
    }));
  };

  const copyAccess = (fromTierId, toTierId) => {
    setConfig((current) => ({
      ...current,
      access: {
        ...current.access,
        [toTierId]: {
          ...current.access[toTierId],
          ...current.access[fromTierId],
        },
      },
    }));
  };

  const updateLimit = (tierId, field, value) => {
    setConfig((current) => ({
      ...current,
      limits: {
        ...current.limits,
        [tierId]: {
          ...current.limits[tierId],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    if (!isAdmin) {
      setError('Apenas administradores podem salvar configurações de planos.');
      return;
    }

    if (!supabase) {
      setError('Supabase não configurado.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    const normalizedConfig = mergeSubscriptionPlanConfig(config);
    const now = new Date().toISOString();

    const { error: settingsError } = await supabase
      .from('subscription_plan_settings')
      .upsert({
        id: SETTINGS_ID,
        plan_config: normalizedConfig,
        updated_by: user?.id || null,
        updated_at: now,
      }, { onConflict: 'id' });

    if (settingsError) {
      setSaving(false);
      setError(settingsError.message || 'Não foi possível salvar as configurações dos planos.');
      return;
    }

    const planRows = createPlanRows(normalizedConfig);
    const { error: plansError } = await supabase
      .from('subscription_plans')
      .upsert(planRows, { onConflict: 'code' });

    if (plansError) {
      setSaving(false);
      setLastUpdated(now);
      setConfig(normalizedConfig);
      await reloadAccessConfig?.();
      setMessage('Configurações salvas. Os registros comerciais em subscription_plans não foram atualizados porque a política do Supabase bloqueou essa tabela.');
      return;
    }

    setSaving(false);
    setLastUpdated(now);
    setConfig(normalizedConfig);
    await reloadAccessConfig?.();
    setMessage('Configurações de planos salvas com sucesso.');
  };

  if (!isAdmin) {
    return (
      <div className="subscription-plans-page container animate-fade-in">
        <div className="restricted-card card">
          <ShieldCheck size={28} />
          <div>
            <h2>Acesso restrito</h2>
            <p className="text-muted">A configuração de planos fica disponível apenas para administradores.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-plans-page container animate-fade-in">
      <div className="subscription-plans-header">
        <div>
          <span className="page-kicker"><SlidersHorizontal size={16} /> Administração</span>
          <h2>Configuração de Planos</h2>
          <p className="text-muted">Controle preços, períodos, limites e acessos por plano.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={handleSave} disabled={saving || loading}>
          <Save size={18} />
          {saving ? 'Salvando...' : 'Salvar planos'}
        </button>
      </div>

      {(message || error) && (
        <div className={`alert ${error ? 'danger' : 'success'} plan-alert`}>
          {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {error || message}
        </div>
      )}

      <div className="plans-overview">
        <div className="overview-item">
          <span>Planos</span>
          <strong>3 níveis</strong>
        </div>
        <div className="overview-item">
          <span>Periodicidades</span>
          <strong>Mensal a anual</strong>
        </div>
        <div className="overview-item">
          <span>Última alteração</span>
          <strong>{lastUpdated ? formatDateTime(lastUpdated) : 'Ainda não salvo'}</strong>
        </div>
      </div>

      <section className="plan-config-section">
        <div className="section-title-row">
          <div>
            <h3>Estrutura sugerida</h3>
            <p className="text-muted">Básico para operação essencial, Avançado para planejamento completo e Premium para equipe e várias propriedades.</p>
          </div>
        </div>

        <div className="tier-editor-grid">
          {SUBSCRIPTION_TIERS.map((tier) => {
            const tierConfig = config.tiers[tier.id];
            const isActive = activeTierId === tier.id;

            return (
              <button
                key={tier.id}
                type="button"
                className={`tier-editor-card ${isActive ? 'active' : ''}`}
                style={{ '--tier-accent': tier.accent }}
                onClick={() => setActiveTierId(tier.id)}
              >
                <span className="tier-dot" />
                <strong>{tierConfig?.name || tier.name}</strong>
                <small>{tierConfig?.enabled ? 'Disponível' : 'Desativado'}</small>
              </button>
            );
          })}
        </div>

        <div className="active-tier-panel" style={{ '--tier-accent': activeTier.accent }}>
          <div className="tier-form-grid">
            <label className="field-label">
              Nome do plano
              <input
                className="input"
                value={config.tiers[activeTierId]?.name || ''}
                onChange={(event) => updateTier(activeTierId, 'name', event.target.value)}
              />
            </label>

            <label className="field-label tier-description-field">
              Descrição comercial
              <textarea
                className="input"
                rows="3"
                value={config.tiers[activeTierId]?.description || ''}
                onChange={(event) => updateTier(activeTierId, 'description', event.target.value)}
              />
            </label>

            <div className="switch-stack">
              <label className="plan-switch">
                <input
                  type="checkbox"
                  checked={Boolean(config.tiers[activeTierId]?.enabled)}
                  onChange={(event) => updateTier(activeTierId, 'enabled', event.target.checked)}
                />
                <span />
                Plano ativo
              </label>

              <label className="plan-switch">
                <input
                  type="checkbox"
                  checked={Boolean(config.tiers[activeTierId]?.highlighted)}
                  onChange={(event) => updateTier(activeTierId, 'highlighted', event.target.checked)}
                />
                <span />
                Destacar na assinatura
              </label>
            </div>
          </div>

          <div className="tier-metrics">
            <div>
              <span>Módulos liberados</span>
              <strong>{activeModulesCount}/{ACCESS_MODULES.length}</strong>
            </div>
            <div>
              <span>Menor preço</span>
              <strong>{formatCurrency(Math.min(...BILLING_CYCLES.map((cycle) => Number(config.prices?.[activeTierId]?.[cycle.id] || 0))))}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="plan-config-section">
        <div className="section-title-row">
          <div>
            <h3>Preços por periodicidade</h3>
            <p className="text-muted">Configure Mensal, Trimestral, Semestral e Anual para cada plano.</p>
          </div>
          <CreditCard size={22} />
        </div>

        <div className="pricing-table-wrap">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Período</th>
                {SUBSCRIPTION_TIERS.map((tier) => (
                  <th key={tier.id}>{config.tiers[tier.id]?.name || tier.name}</th>
                ))}
                <th>Desconto</th>
              </tr>
            </thead>
            <tbody>
              {BILLING_CYCLES.map((cycle) => (
                <tr key={cycle.id}>
                  <td>
                    <label className="compact-check">
                      <input
                        type="checkbox"
                        checked={Boolean(config.billingCycles[cycle.id]?.enabled)}
                        onChange={(event) => updateBillingCycle(cycle.id, 'enabled', event.target.checked)}
                      />
                      <span>{cycle.name}</span>
                    </label>
                  </td>
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <td key={`${tier.id}-${cycle.id}`}>
                      <div className="money-input">
                        <span>R$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={config.prices[tier.id]?.[cycle.id] ?? 0}
                          onChange={(event) => updatePrice(tier.id, cycle.id, event.target.value)}
                        />
                      </div>
                    </td>
                  ))}
                  <td>
                    <div className="percent-input">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={config.billingCycles[cycle.id]?.discountPercent ?? 0}
                        onChange={(event) => updateBillingCycle(cycle.id, 'discountPercent', event.target.value)}
                      />
                      <span>%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="plan-config-section">
        <div className="section-title-row">
          <div>
            <h3>Acessos por plano</h3>
            <p className="text-muted">Marque os módulos que cada assinatura poderá usar.</p>
          </div>
          <ShieldCheck size={22} />
        </div>

        <div className="access-action-bar">
          <button type="button" className="btn btn-secondary access-action-btn" onClick={() => copyAccess('basic', 'advanced')}>
            <Copy size={16} /> Copiar Básico para Avançado
          </button>
          <button type="button" className="btn btn-secondary access-action-btn" onClick={() => copyAccess('advanced', 'premium')}>
            <Copy size={16} /> Copiar Avançado para Premium
          </button>
        </div>

        <div className="access-matrix">
          <div className="access-header">
            <span>Módulo</span>
            {SUBSCRIPTION_TIERS.map((tier) => (
              <span key={tier.id}>{config.tiers[tier.id]?.name || tier.name}</span>
            ))}
          </div>

          {Object.entries(groupedModules).map(([groupName, modules]) => (
            <div key={groupName} className="access-group">
              <div className="access-group-title">
                <strong>{groupName}</strong>
                <div className="access-group-actions">
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <span key={`${groupName}-${tier.id}`}>
                      {config.tiers[tier.id]?.name || tier.name}
                      <button type="button" onClick={() => setTierGroupAccess(tier.id, modules, true)}>Todos</button>
                      <button type="button" onClick={() => setTierGroupAccess(tier.id, modules, false)}>Nenhum</button>
                    </span>
                  ))}
                </div>
              </div>
              {modules.map((module) => (
                <div key={module.id} className="access-row">
                  <div className="module-name">
                    <strong>{module.label}</strong>
                    <span>{module.route}</span>
                  </div>
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <label key={`${tier.id}-${module.id}`} className="access-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(config.access[tier.id]?.[module.id])}
                        onChange={(event) => updateAccess(tier.id, module.id, event.target.checked)}
                        aria-label={`${config.tiers[tier.id]?.name || tier.name}: ${module.label}`}
                      />
                      <span><Check size={14} /></span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="plan-config-section">
        <div className="section-title-row">
          <div>
            <h3>Limites e atendimento</h3>
            <p className="text-muted">Use limites para diferenciar os planos sem criar telas novas.</p>
          </div>
        </div>

        <div className="limits-grid">
          {SUBSCRIPTION_TIERS.map((tier) => (
            <div key={tier.id} className="limits-card" style={{ '--tier-accent': tier.accent }}>
              <div className="limits-card-header">
                <span className="tier-dot" />
                <strong>{config.tiers[tier.id]?.name || tier.name}</strong>
              </div>
              {LIMIT_FIELDS.map((field) => (
                <label key={`${tier.id}-${field.id}`} className="field-label">
                  {field.label}
                  <input
                    className="input"
                    value={config.limits[tier.id]?.[field.id] ?? ''}
                    placeholder={field.placeholder}
                    onChange={(event) => updateLimit(tier.id, field.id, event.target.value)}
                  />
                </label>
              ))}
              <label className="field-label">
                Atendimento
                <select
                  className="input"
                  value={config.limits[tier.id]?.support || SUPPORT_OPTIONS[0]}
                  onChange={(event) => updateLimit(tier.id, 'support', event.target.value)}
                >
                  {SUPPORT_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
