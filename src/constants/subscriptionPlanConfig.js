export const SUBSCRIPTION_TIERS = [
  { id: 'basic', name: 'Básico', accent: '#3b82f6' },
  { id: 'advanced', name: 'Avançado', accent: '#8b5a2b' },
  { id: 'premium', name: 'Premium', accent: '#2e8b57' }
];

export const BILLING_CYCLES = [
  { id: 'monthly', name: 'Mensal', months: 1 },
  { id: 'quarterly', name: 'Trimestral', months: 3 },
  { id: 'semiannual', name: 'Semestral', months: 6 },
  { id: 'annual', name: 'Anual', months: 12 }
];

export const ACCESS_MODULES = [
  { id: 'dashboard', label: 'Início', group: 'Geral', route: '/' },
  { id: 'tasks', label: 'Tarefas', group: 'Geral', route: '/tasks' },
  { id: 'properties', label: 'Propriedades e talhões', group: 'Cadastros', route: '/properties' },
  { id: 'clones', label: 'Clones', group: 'Cadastros', route: '/clones' },
  { id: 'classifications', label: 'Classificações', group: 'Cadastros', route: '/classifications' },
  { id: 'analysis', label: 'Análise de Solo', group: 'Agronomia', route: '/analysis' },
  { id: 'history', label: 'Histórico de análises', group: 'Agronomia', route: '/history' },
  { id: 'fertilization', label: 'Planejamento de Safra', group: 'Agronomia', route: '/fertilization' },
  { id: 'applications', label: 'Aplicações da Safra', group: 'Agronomia', route: '/applications' },
  { id: 'reports', label: 'Relatórios de Safra', group: 'Agronomia', route: '/reports' },
  { id: 'limingGypsum', label: 'Calagem e Gessagem', group: 'Agronomia', route: '/liming-gypsum' },
  { id: 'converter', label: 'Conversão de Unidades', group: 'Agronomia', route: '/converter' },
  { id: 'recommendations', label: 'Tabelas de Produtividade', group: 'Configurações', route: '/recommendations' },
  { id: 'monthlyDivision', label: 'Divisão Mensal Global', group: 'Configurações', route: '/monthly-division' },
  { id: 'analysisParameters', label: 'Parâmetros da Análise', group: 'Configurações', route: '/settings' },
  { id: 'users', label: 'Usuários da conta', group: 'Administração', route: '/users' },
  { id: 'support', label: 'Suporte', group: 'Atendimento', route: '/support' }
];

export const LIMIT_FIELDS = [
  { id: 'properties', label: 'Propriedades', placeholder: '1' },
  { id: 'plots', label: 'Talhões', placeholder: '3' },
  { id: 'analysesPerMonth', label: 'Análises/mês', placeholder: '10' },
  { id: 'users', label: 'Usuários', placeholder: '1' }
];

export const SUPPORT_OPTIONS = [
  'E-mail',
  'Prioritário',
  'Prioritário + consultivo'
];

const allModules = ACCESS_MODULES.map((item) => item.id);
const basicModules = [
  'dashboard',
  'tasks',
  'properties',
  'clones',
  'analysis',
  'history',
  'reports',
  'support'
];
const advancedModules = [
  ...basicModules,
  'classifications',
  'fertilization',
  'applications',
  'limingGypsum',
  'converter',
  'monthlyDivision'
];

export const DEFAULT_SUBSCRIPTION_PLAN_CONFIG = {
  tiers: {
    basic: {
      name: 'Básico',
      enabled: true,
      description: 'Para produtores que precisam registrar dados e acompanhar análises essenciais.'
    },
    advanced: {
      name: 'Avançado',
      enabled: true,
      highlighted: true,
      description: 'Para quem já faz planejamento de safra e acompanhamento de aplicações.'
    },
    premium: {
      name: 'Premium',
      enabled: true,
      description: 'Para consultorias, equipes e operações com mais propriedades.'
    }
  },
  billingCycles: {
    monthly: { enabled: true, discountPercent: 0 },
    quarterly: { enabled: true, discountPercent: 8 },
    semiannual: { enabled: true, discountPercent: 15 },
    annual: { enabled: true, discountPercent: 25 }
  },
  prices: {
    basic: { monthly: 49.9, quarterly: 134.7, semiannual: 254.4, annual: 449.1 },
    advanced: { monthly: 89.9, quarterly: 242.7, semiannual: 458.4, annual: 809.1 },
    premium: { monthly: 149.9, quarterly: 404.7, semiannual: 764.4, annual: 1349.1 }
  },
  access: {
    basic: Object.fromEntries(allModules.map((moduleId) => [moduleId, basicModules.includes(moduleId)])),
    advanced: Object.fromEntries(allModules.map((moduleId) => [moduleId, advancedModules.includes(moduleId)])),
    premium: Object.fromEntries(allModules.map((moduleId) => [moduleId, true]))
  },
  limits: {
    basic: { properties: 1, plots: 3, analysesPerMonth: 10, users: 1, support: 'E-mail' },
    advanced: { properties: 5, plots: 20, analysesPerMonth: 50, users: 3, support: 'Prioritário' },
    premium: { properties: 999, plots: 999, analysesPerMonth: 999, users: 10, support: 'Prioritário + consultivo' }
  }
};

export const mergeSubscriptionPlanConfig = (storedConfig = {}) => {
  const defaults = DEFAULT_SUBSCRIPTION_PLAN_CONFIG;

  return {
    tiers: Object.fromEntries(SUBSCRIPTION_TIERS.map((tier) => [
      tier.id,
      {
        ...defaults.tiers[tier.id],
        ...(storedConfig.tiers?.[tier.id] || {})
      }
    ])),
    billingCycles: Object.fromEntries(BILLING_CYCLES.map((cycle) => [
      cycle.id,
      {
        ...defaults.billingCycles[cycle.id],
        ...(storedConfig.billingCycles?.[cycle.id] || {})
      }
    ])),
    prices: Object.fromEntries(SUBSCRIPTION_TIERS.map((tier) => [
      tier.id,
      Object.fromEntries(BILLING_CYCLES.map((cycle) => [
        cycle.id,
        storedConfig.prices?.[tier.id]?.[cycle.id] ?? defaults.prices[tier.id][cycle.id]
      ]))
    ])),
    access: Object.fromEntries(SUBSCRIPTION_TIERS.map((tier) => [
      tier.id,
      Object.fromEntries(ACCESS_MODULES.map((module) => [
        module.id,
        storedConfig.access?.[tier.id]?.[module.id] ?? defaults.access[tier.id][module.id] ?? false
      ]))
    ])),
    limits: Object.fromEntries(SUBSCRIPTION_TIERS.map((tier) => [
      tier.id,
      {
        ...defaults.limits[tier.id],
        ...(storedConfig.limits?.[tier.id] || {})
      }
    ]))
  };
};
