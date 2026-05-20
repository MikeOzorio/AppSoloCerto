/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { DEFAULT_LIMING_GYPSUM_VALUES } from '../constants/limingGypsum';

const SoilContext = createContext();

export const BASIC_CLASSIFICATION_COLORS = [
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Cinza', value: '#6b7280' },
  { name: 'Marrom', value: '#8b5a2b' }
];

const defaultClassifications = [
  { id: 'default_muito_baixo', name: 'Muito baixo', color: '#ef4444' },
  { id: 'default_baixo', name: 'Baixo', color: '#f97316' },
  { id: 'default_medio', name: 'Médio', color: '#eab308' },
  { id: 'default_adequado', name: 'Adequado', color: '#22c55e' },
  { id: 'default_alto', name: 'Alto', color: '#3b82f6' },
  { id: 'default_muito_alto', name: 'Muito alto', color: '#8b5cf6' },
  { id: 'default_neutro', name: 'Neutro', color: '#6b7280' },
  { id: 'default_alcalino', name: 'Alcalino', color: '#8b5cf6' }
];

const createRanges = (low, med, adeq) => [
  { id: '1', classificationId: 'default_baixo', name: 'Baixo', comparisonType: 'lt', from: null, to: low, max: low, color: '#f97316' },
  { id: '2', classificationId: 'default_medio', name: 'Médio', comparisonType: 'between', from: low, to: med, max: med, color: '#eab308' },
  { id: '3', classificationId: 'default_adequado', name: 'Adequado', comparisonType: 'between', from: med, to: adeq, max: adeq, color: '#22c55e' },
  { id: '4', classificationId: 'default_muito_alto', name: 'Muito Alto', comparisonType: 'gt', from: adeq, to: null, max: Infinity, color: '#8b5cf6' }
];

const defaultParameters = {
  ph_agua: { symbol: 'pH', group: 'quimicos', name: 'pH (água)', unit: '', ranges: createRanges(5.0, 5.5, 6.5) },
  mo: { symbol: 'MO', group: 'quimicos', name: 'Matéria Orgânica', unit: 'dag/kg', ranges: createRanges(1.5, 3.0, 6.0) },
  p_mehlich: { symbol: 'P', group: 'macro', name: 'Fósforo Mehlich-1', unit: 'mg/dm³', ranges: createRanges(10, 20, 40) },
  p_resina: { symbol: 'P', group: 'macro', name: 'Fósforo Resina', unit: 'mg/dm³', ranges: createRanges(15, 30, 60) },
  k: { symbol: 'K', group: 'macro', name: 'Potássio', unit: 'mmolc/dm³', ranges: createRanges(1.5, 3.0, 4.5) },
  ca: { symbol: 'Ca', group: 'macro', name: 'Cálcio', unit: 'mmolc/dm³', ranges: createRanges(15, 25, 40) },
  mg: { symbol: 'Mg', group: 'macro', name: 'Magnésio', unit: 'mmolc/dm³', ranges: createRanges(5, 8, 15) },
  s: { symbol: 'S', group: 'macro', name: 'Enxofre', unit: 'mg/dm³', ranges: createRanges(5, 10, 20) },
  al: { symbol: 'Al', group: 'indices', name: 'Alumínio', unit: 'cmolc/dm³', ranges: createRanges(0.3, 0.5, 1.0) },
  h_al: { symbol: 'H+Al', group: 'indices', name: 'Acidez Potencial', unit: 'cmolc/dm³', ranges: createRanges(2.5, 5.0, 8.0) },
  b: { symbol: 'B', group: 'micro', name: 'Boro', unit: 'mg/dm³', ranges: createRanges(0.2, 0.4, 0.8) },
  cu: { symbol: 'Cu', group: 'micro', name: 'Cobre', unit: 'mg/dm³', ranges: createRanges(0.8, 1.5, 3.0) },
  fe: { symbol: 'Fe', group: 'micro', name: 'Ferro', unit: 'mg/dm³', ranges: createRanges(20, 40, 100) },
  mn: { symbol: 'Mn', group: 'micro', name: 'Manganês', unit: 'mg/dm³', ranges: createRanges(5, 15, 40) },
  zn: { symbol: 'Zn', group: 'micro', name: 'Zinco', unit: 'mg/dm³', ranges: createRanges(1.0, 2.5, 5.0) },
  sb: { symbol: 'SB', group: 'indices', name: 'Soma de Bases', unit: 'cmolc/dm³', ranges: createRanges(2.0, 4.0, 8.0) },
  t: { symbol: 't', group: 'indices', name: 'CTC Efetiva', unit: 'cmolc/dm³', ranges: createRanges(2.5, 5.0, 10.0) },
  ctc: { symbol: 'T', group: 'indices', name: 'CTC a pH 7', unit: 'cmolc/dm³', ranges: createRanges(5.0, 8.0, 15.0) },
  v: { symbol: 'V%', group: 'indices', name: 'Saturação por Bases', unit: '%', ranges: createRanges(40, 60, 80) },
  m: { symbol: 'm%', group: 'indices', name: 'Saturação por Al', unit: '%', ranges: createRanges(10, 20, 40) }
};

const defaultClones = [
  { id: 'es1', name: 'Vitória Incaper 8142', origin: 'ES', description: 'Alta produtividade, grãos grandes' },
  { id: 'es2', name: 'Diamante ES8112', origin: 'ES', description: 'Tolerante í  seca, maturação uniforme' },
  { id: 'es3', name: 'Jequitibá ES8122', origin: 'ES', description: 'Vigor vegetativo, boa qualidade de bebida' },
  { id: 'es4', name: 'Centenária ES8132', origin: 'ES', description: 'Resistência í  ferrugem' },
  { id: 'es5', name: 'Robustão Capixaba (Emcaper 8151)', origin: 'ES', description: 'Altamente produtivo' },
  { id: 'es6', name: 'Tributun (Incaper 8152)', origin: 'ES', description: 'Tolerância í  seca' },
  { id: 'ro1', name: 'BRS Ouro Preto (Cpafro 199)', origin: 'RO', description: 'Alta produtividade, tolerante í  seca' },
  { id: 'ro2', name: 'Conilon BRS 1216 (Robusta Amazônico)', origin: 'RO', description: 'Adaptado ao clima amazônico' },
  { id: 'ro3', name: 'Cpafro 194', origin: 'RO', description: 'Boa qualidade de bebida' },
];

const defaultRecommendations = [
  { id: 'ate_30', name: 'Até 30 sacas/ha', nutrients: { N: 150, P2O5: 40, K2O: 120 } },
  { id: '31_50', name: '31 - 50 sacas/ha', nutrients: { N: 320, P2O5: 60, K2O: 200 } },
  { id: 'acima_50', name: 'Acima de 50 sacas/ha', nutrients: { N: 400, P2O5: 80, K2O: 300 } }
];

const normalizeForJson = (value) => JSON.parse(JSON.stringify(value, (_key, val) => {
  if (typeof val === 'number' && !Number.isFinite(val)) return null;
  return val;
}));

const stripInternalSelectedMonths = (months = {}) => Object.fromEntries(
  Object.entries(months || {}).filter(([key]) => !String(key).startsWith('__'))
);

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : null;
};

const getTalhoesPlantTotal = (talhoes = []) => talhoes.reduce((total, talhao) => {
  const talhaoTotal = (talhao.clones || []).reduce((sum, clone) => sum + (toNumberOrNull(clone.quantidade) || 0), 0);
  return total + talhaoTotal;
}, 0);

const validatePropertyPlantLimit = (property) => {
  const plantCount = toNumberOrNull(property.plantCount);
  if (!plantCount || plantCount <= 0) {
    throw new Error('Informe a quantidade total de plantas da propriedade.');
  }

  const talhoesPlantTotal = getTalhoesPlantTotal(property.talhoes || []);
  if (talhoesPlantTotal > plantCount) {
    throw new Error('A soma de plantas dos talhões não pode passar da quantidade total da propriedade.');
  }
};

const getFriendlyDbErrorMessage = (operation, error) => {
  const message = String(error?.message || error || '');
  const constraint = String(error?.details || error?.hint || error?.code || message).toLowerCase();
  const isDuplicate = error?.code === '23505' || message.toLowerCase().includes('duplicate key');
  const normalizedOperation = String(operation || '').toLowerCase();

  if (!isDuplicate) return message || 'Erro desconhecido.';

  if (constraint.includes('nutrient_classifications') || normalizedOperation.includes('classificação')) {
    return 'Já existe uma classificação cadastrada com esse nome.';
  }
  if (constraint.includes('coffee_clones')) {
    return 'Já existe um clone cadastrado com esse código ou nome.';
  }
  if (constraint.includes('productivity_tables')) {
    return 'Já existe uma tabela de produtividade cadastrada com esse código ou nome.';
  }
  if (constraint.includes('crop_plans') || normalizedOperation.includes('planejamento de safra')) {
    return 'Já existe um plano de safra para este ano, propriedade e talhão.';
  }
  if (constraint.includes('analysis_parameters')) {
    return 'Já existe um parâmetro de análise cadastrado com essa chave.';
  }
  if (constraint.includes('user_settings')) {
    return 'Já existe uma configuração cadastrada com essa chave para este usuário.';
  }
  if (constraint.includes('profiles')) {
    return 'Já existe um usuário cadastrado com esses dados.';
  }
  if (constraint.includes('subscriptions')) {
    return 'Já existe uma assinatura cadastrada para este usuário.';
  }

  return 'Já existe um cadastro com esses dados. Verifique as informações e tente novamente.';
};

const showDbError = (operation, error) => {
  console.error(operation, error);
  if (typeof window !== 'undefined') {
    window.alert(`Erro ao salvar/carregar no banco (${operation}): ${getFriendlyDbErrorMessage(operation, error)}`);
  }
};

const isRlsError = (error) => {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('row-level security') || message.includes('rls');
};

const isDuplicateError = (error) => {
  const message = String(error?.message || error || '').toLowerCase();
  return error?.code === '23505' || message.includes('duplicate key');
};

const normalizeSingleRow = (data) => Array.isArray(data) ? data[0] : data;

const mapClassificationRow = (row) => ({
  id: row.id,
  name: row.name,
  color: row.color,
  isDefault: row.owner_id === null,
  sortOrder: row.sort_order ?? 0
});

const mergeClassificationRows = (current, rows) => {
  const byId = new Map();
  current.forEach((item) => {
    if (item?.id) byId.set(item.id, item);
  });
  rows.forEach((row) => {
    const mapped = mapClassificationRow(row);
    if (mapped.id) byId.set(mapped.id, mapped);
  });
  return Array.from(byId.values()).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
};

const mergeDefaultAndDbClassifications = (dbClassifications) => {
  const byName = new Map();
  dbClassifications.forEach((item) => {
    byName.set(String(item.name).toLowerCase(), item);
  });
  return Array.from(byName.values()).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
};

const normalizeRangeRow = (row) => {
  const classification = row.nutrient_classifications || row.classification || {};
  const comparisonType = row.comparison_type || row.comparisonType || 'between';
  const valueFrom = row.value_from ?? row.from ?? null;
  const valueTo = row.value_to ?? row.to ?? row.max ?? null;
  return {
    id: row.id || `${row.classification_id || row.classificationId || row.name}-${row.sort_order || 0}`,
    classificationId: row.classification_id || row.classificationId || classification.id || '',
    name: classification.name || row.name || 'Classificação',
    color: classification.color || row.color || '#6b7280',
    comparisonType,
    from: valueFrom,
    to: valueTo,
    max: comparisonType === 'gt' ? null : valueTo,
    sortOrder: row.sort_order ?? 0
  };
};

const mapParameterRows = (rows = []) => {
  const mapped = { ...defaultParameters };
  rows.forEach((row) => {
    const relationalRanges = (row.analysis_parameter_ranges || [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(normalizeRangeRow);

    mapped[row.param_key] = {
      id: row.id,
      symbol: row.symbol,
      group: row.parameter_group,
      name: row.name,
      unit: row.unit || '',
      ranges: relationalRanges.length ? relationalRanges : (row.ranges || []).map(normalizeRangeRow)
    };
  });
  return mapped;
};

const remapParametersToClassifications = (params, classifications) => {
  const byName = new Map(classifications.map((item) => [String(item.name).toLowerCase(), item]));
  return Object.fromEntries(Object.entries(params).map(([key, param]) => [
    key,
    {
      ...param,
      ranges: (param.ranges || []).map((range) => {
        const classification = byName.get(String(range.name).toLowerCase());
        if (!classification) return range;
        return {
          ...range,
          classificationId: classification.id,
          name: classification.name,
          color: classification.color
        };
      })
    }
  ]));
};

const mapCloneRow = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  origin: row.origin,
  description: row.description || ''
});

const mapRecommendationRow = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  minBagsPerHa: row.min_bags_per_ha,
  maxBagsPerHa: row.max_bags_per_ha,
  nutrients: row.nutrients || {}
});

const getLevelInfoFromParameters = (parameters, key, value) => {
  if (value === '' || value === null || value === undefined || isNaN(value)) return { name: 'N/A', color: 'var(--color-text-muted)' };
  const val = parseFloat(value);
  const param = parameters[key];
  if (!param) return { name: 'N/A', color: 'var(--color-text-muted)' };

  for (const range of param.ranges || []) {
    const type = range.comparisonType || range.comparison_type || 'between';
    const from = range.from === '' || range.from === null || range.from === undefined ? null : Number(range.from);
    const to = range.to === '' || range.to === null || range.to === undefined ? null : Number(range.to ?? range.max);

    if (type === 'lt' && to !== null && val < to) return { name: range.name, color: range.color };
    if (type === 'lte' && to !== null && val <= to) return { name: range.name, color: range.color };
    if (type === 'gt' && from !== null && val > from) return { name: range.name, color: range.color };
    if (type === 'gte' && from !== null && val >= from) return { name: range.name, color: range.color };
    if (type === 'between') {
      const fromOk = from === null || val >= from;
      const toOk = to === null || val <= to;
      if (fromOk && toOk) return { name: range.name, color: range.color };
    }

    // Compatibilidade com faixas antigas baseadas apenas em "Até".
    if (!range.comparisonType && range.max !== undefined) {
      const maxVal = range.max === null || range.max === undefined ? Infinity : Number(range.max);
      if (val <= maxVal) return { name: range.name, color: range.color };
    }
  }
  const last = param.ranges?.[param.ranges.length - 1];
  return last ? { name: last.name, color: last.color } : { name: 'N/A', color: 'var(--color-text-muted)' };
};

const mapTalhaoRow = (row) => ({
  id: row.id,
  propertyId: row.property_id,
  name: row.name,
  area: row.area ?? '',
  dataPlantio: row.planting_date || '',
  clones: (row.plot_clones || []).map((pc) => ({
    id: pc.id,
    cloneId: pc.clone_id,
    quantidade: pc.quantity ?? '',
    cloneName: pc.coffee_clones?.name
  }))
});

const mapPropertyRelationalRow = (row) => ({
  id: row.id,
  name: row.name,
  area: row.area ?? '',
  plantCount: row.plant_count ?? row.plantCount ?? '',
  talhoes: (row.property_plots || []).map(mapTalhaoRow)
});

const mapAnalysisRelationalRow = (row) => ({
  id: row.id,
  ...(row.metadata || {}),
  title: row.title,
  fileName: row.file_name || row.metadata?.fileName,
  data: row.metadata?.data || row.analysis_date,
  analysisDate: row.analysis_date || row.metadata?.analysisDate || row.metadata?.data,
  propertyId: row.property_id,
  talhaoId: row.plot_id || row.talhao_id,
  plotId: row.plot_id,
  results: Object.fromEntries((row.soil_analysis_results || []).map((item) => [item.parameter_key, String(item.value ?? '')]))
});

const mapCropPlanRelationalRow = (row) => {
  const selectedMonthsJson = row.selected_months || {};
  const embeddedAnalysis = selectedMonthsJson.__analysis || {};
  const embeddedApplications = selectedMonthsJson.__applications || {};
  const cleanSelectedMonths = stripInternalSelectedMonths(selectedMonthsJson);
  const nutrientsFromRows = (row.crop_plan_nutrients || []).map((item) => ({
    id: item.id,
    nutrient: item.nutrient,
    need: item.need_kg_per_ha ?? '',
    fertilizer: item.fertilizer_name || '',
    percentage: item.fertilizer_percentage ?? '',
    bagSize: item.bag_size_kg ?? '',
    price: item.bag_price ?? '',
    calculatedCost: item.calculated_cost ?? 0
  }));
  const monthsFromRows = (row.crop_plan_months || []).reduce((acc, item) => {
    const nutrient = item.nutrient;
    if (!acc[nutrient]) acc[nutrient] = [];
    acc[nutrient].push(item.month_number);
    return acc;
  }, {});
  const storedMonths = cleanSelectedMonths && Object.keys(cleanSelectedMonths).length
    ? cleanSelectedMonths
    : monthsFromRows;
  const analysisSnapshot = row.analysis_snapshot && Object.keys(row.analysis_snapshot).length
    ? row.analysis_snapshot
    : embeddedAnalysis;
  return {
    id: row.id,
    cropYear: String(row.crop_year || ''),
    propertyId: row.property_id || '',
    talhaoId: row.plot_id || row.talhao_id || '',
    plotId: row.plot_id || '',
    recommendationId: row.productivity_table_id || row.recommendation_id || '',
    analysisId: row.analysis_id || embeddedAnalysis.id || '',
    analysisSnapshot,
    applications: embeddedApplications,
    nutrients: nutrientsFromRows,
    selectedMonths: storedMonths,
    totalCost: row.total_cost,
    createdAt: row.created_at
  };
};

const calculateNutrientCost = (row) => {
  const need = Number(row.need || 0);
  const percentage = Number(row.percentage || 0);
  const bagSize = Number(row.bagSize || 50);
  const price = Number(row.price || 0);
  if (!need || !percentage || !bagSize || !price) return 0;
  return (need / (percentage / 100) / bagSize) * price;
};

export const SoilProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState(defaultParameters);
  const [classifications, setClassifications] = useState(defaultClassifications);
  const [history, setHistory] = useState([]);
  const [clones, setClones] = useState(defaultClones);
  const [properties, setProperties] = useState([]);
  const [recommendations, setRecommendations] = useState(defaultRecommendations);
  const [cropPlans, setCropPlans] = useState([]);
  const [fertilizationMonths, setFertilizationMonthsState] = useState({});
  const [limingGypsumValues, setLimingGypsumValuesState] = useState(DEFAULT_LIMING_GYPSUM_VALUES);

  const getSupabaseUserId = async () => {
    if (!supabase) return null;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.access_token) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Erro ao validar usuario autenticado no Supabase:', error);
      return null;
    }
    return data?.user?.id || null;
  };

  const syncClassificationsFromDb = async (fallbackRows = []) => {
    const { data: rpcRows, error: rpcError } = await supabase.rpc('list_nutrient_classifications');
    if (!rpcError && rpcRows?.length) {
      setClassifications(prev => mergeClassificationRows(prev, rpcRows));
      return true;
    }
    if (fallbackRows.length) {
      setClassifications(prev => mergeClassificationRows(prev, fallbackRows));
      return true;
    }
    return false;
  };

  const refreshData = async () => {
    if (!supabase) return;
    const ownerId = await getSupabaseUserId();
    if (!ownerId) return;
    setLoading(true);
    try {
      const [parametersRes, classificationsRes, clonesRes, productivityRes, propertiesRes, analysesRes, cropPlansRes, settingsRes] = await Promise.all([
        supabase
          .from('analysis_parameters')
          .select('*, analysis_parameter_ranges(*, nutrient_classifications(*))')
          .or(`owner_id.is.null,owner_id.eq.${ownerId}`)
          .order('created_at', { ascending: true }),
        supabase
          .from('nutrient_classifications')
          .select('*')
          .or(`owner_id.is.null,owner_id.eq.${ownerId}`)
          .order('sort_order', { ascending: true }),
        supabase.from('coffee_clones').select('*').or(`owner_id.is.null,owner_id.eq.${ownerId}`).eq('active', true).order('origin', { ascending: true }),
        supabase.from('productivity_tables').select('*').or(`owner_id.is.null,owner_id.eq.${ownerId}`).eq('active', true).order('created_at', { ascending: true }),
        supabase
          .from('properties')
          .select('*, property_plots(*, plot_clones(*, coffee_clones(name)))')
          .eq('user_id', ownerId)
          .order('created_at', { ascending: false }),
        supabase
          .from('soil_analyses')
          .select('*, soil_analysis_results!soil_analysis_results_analysis_id_fkey(*)')
          .eq('user_id', ownerId)
          .order('created_at', { ascending: false }),
        supabase
          .from('crop_plans')
          .select('*, crop_plan_nutrients(*), crop_plan_months(*)')
          .eq('user_id', ownerId)
          .order('created_at', { ascending: false }),
        supabase.from('user_settings').select('setting_key,setting_value').eq('user_id', ownerId)
      ]);

      const firstError = [parametersRes, classificationsRes, clonesRes, productivityRes, propertiesRes, analysesRes, cropPlansRes, settingsRes]
        .find((response) => response.error)?.error;
      if (firstError) throw firstError;


      let classificationRows = classificationsRes.data || [];
      if (!classificationRows.length) {
        const { data: rpcClassifications, error: rpcClassificationsError } = await supabase.rpc('list_nutrient_classifications');
        if (!rpcClassificationsError && rpcClassifications?.length) {
          classificationRows = rpcClassifications;
        }
      }
      const mappedClassifications = mergeDefaultAndDbClassifications(classificationRows.map(mapClassificationRow));
      const mappedParameters = parametersRes.data?.length ? mapParameterRows(parametersRes.data) : defaultParameters;
      setParameters(remapParametersToClassifications(mappedParameters, mappedClassifications));
      setClassifications(mappedClassifications);
      setClones(clonesRes.data?.length ? clonesRes.data.map(mapCloneRow) : defaultClones);
      setRecommendations(productivityRes.data?.length ? productivityRes.data.map(mapRecommendationRow) : defaultRecommendations);
      setProperties((propertiesRes.data || []).map(mapPropertyRelationalRow));
      setHistory((analysesRes.data || []).map(mapAnalysisRelationalRow));
      setCropPlans((cropPlansRes.data || []).map(mapCropPlanRelationalRow));

      const monthsSetting = (settingsRes.data || []).find((row) => row.setting_key === 'fertilizationMonths');
      setFertilizationMonthsState(monthsSetting?.setting_value || {});
      const limingGypsumSetting = (settingsRes.data || []).find((row) => row.setting_key === 'limingGypsumValues');
      setLimingGypsumValuesState({
        ...DEFAULT_LIMING_GYPSUM_VALUES,
        ...(limingGypsumSetting?.setting_value || {})
      });
    } catch (error) {
      showDbError('carregar dados relacionais', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setParameters(defaultParameters);
      setClassifications(defaultClassifications);
      setHistory([]);
      setClones(defaultClones);
      setProperties([]);
      setRecommendations(defaultRecommendations);
      setCropPlans([]);
      setFertilizationMonthsState({});
      setLimingGypsumValuesState(DEFAULT_LIMING_GYPSUM_VALUES);
      return;
    }
    refreshData();
  }, [isAuthenticated, user?.id]);

  const ensureUserParameter = async (key, current) => {
    const authUserId = await getSupabaseUserId();
    if (!authUserId) throw new Error('Sessão do Supabase expirada. Faça logout e login novamente.');
    const { data, error } = await supabase.from('analysis_parameters').upsert({
      owner_id: authUserId,
      param_key: key,
      symbol: current.symbol,
      name: current.name,
      parameter_group: current.group,
      unit: current.unit || '',
      ranges: [],
      updated_at: new Date().toISOString()
    }, { onConflict: 'owner_id,param_key' }).select('*').single();
    if (error) throw error;
    return data;
  };

  const updateParameterRanges = async (key, newRanges) => {
    const current = parameters[key];
    const normalizedRanges = (newRanges || []).map((range, index) => {
      const classification = classifications.find((item) => item.id === range.classificationId) || {};
      return {
        ...range,
        id: range.id || `${Date.now()}-${index}`,
        name: classification.name || range.name,
        color: classification.color || range.color,
        sortOrder: index
      };
    });
    const next = { ...current, ranges: normalizedRanges };
    setParameters(prev => ({ ...prev, [key]: next }));
    const authUserId = await getSupabaseUserId();
    if (!authUserId) return showDbError('salvar faixas relacionais dos parâmetros de análise', 'Sessão do Supabase expirada. Faça logout e login novamente.');
    try {
      const parameter = await ensureUserParameter(key, next);
      const { error: deleteError } = await supabase
        .from('analysis_parameter_ranges')
        .delete()
        .eq('owner_id', authUserId)
        .eq('parameter_id', parameter.id);
      if (deleteError) throw deleteError;

      const rows = normalizedRanges
        .filter((range) => range.classificationId)
        .map((range, index) => ({
          owner_id: authUserId,
          parameter_id: parameter.id,
          classification_id: range.classificationId,
          comparison_type: range.comparisonType || 'between',
          value_from: toNumberOrNull(range.from),
          value_to: toNumberOrNull(range.to),
          sort_order: index
        }));
      if (rows.length) {
        const { error: insertError } = await supabase.from('analysis_parameter_ranges').insert(rows);
        if (insertError) throw insertError;
      }
      await refreshData();
    } catch (error) {
      showDbError('salvar faixas relacionais dos parâmetros de análise', error);
    }
  };

  const addClassification = async (classification) => {
    const authUserId = await getSupabaseUserId();
    if (!supabase || !authUserId) {
      showDbError('salvar classificação de nutriente', 'Sessão do Supabase expirada. Faça logout e login novamente.');
      return false;
    }
    const payload = {
      owner_id: authUserId,
      name: classification.name?.trim(),
      color: classification.color || '#6b7280',
      sort_order: classifications.length + 1,
      active: true
    };
    let { data, error } = await supabase.rpc('create_nutrient_classification', {
      p_color: payload.color,
      p_name: payload.name,
      p_sort_order: payload.sort_order
    });

    if (error && String(error.message || '').toLowerCase().includes('function')) {
      const insertResult = await supabase.from('nutrient_classifications').insert(payload).select('*').single();
      data = insertResult.data;
      error = insertResult.error;
    }

    if (error && isDuplicateError(error)) {
      const { data: existingFromRpc, error: existingRpcError } = await supabase
        .rpc('find_nutrient_classification', { p_name: payload.name });
      const existingFromRpcRow = normalizeSingleRow(existingFromRpc);

      if (!existingRpcError && existingFromRpcRow?.id) {
        setClassifications(prev => {
          if (prev.some((item) => item.id === existingFromRpcRow.id)) return prev;
          return [...prev, mapClassificationRow(existingFromRpcRow)];
        });
        if (typeof window !== 'undefined') {
          window.alert('Já existe uma classificação cadastrada com esse nome. O registro existente foi recarregado na lista.');
        }
        return false;
      }

      const { data: existingRows, error: existingError } = await supabase
        .from('nutrient_classifications')
        .select('*')
        .eq('name', payload.name)
        .or(`owner_id.is.null,owner_id.eq.${authUserId}`)
        .order('owner_id', { ascending: false });
      if (!existingError && existingRows?.length) {
        const existingRow = existingRows.find((row) => row.owner_id === authUserId) || existingRows[0];
        setClassifications(prev => {
          if (prev.some((item) => item.id === existingRow.id)) return prev;
          return [...prev, mapClassificationRow(existingRow)];
        });
        if (typeof window !== 'undefined') {
          window.alert('Já existe uma classificação cadastrada com esse nome. O registro existente foi recarregado na lista.');
        }
        return false;
      }
    }

    if (error) return showDbError('salvar classificação de nutriente', error);
    const savedRow = normalizeSingleRow(data);
    if (savedRow?.id) {
      setClassifications(prev => mergeClassificationRows(prev, [savedRow]));
      await syncClassificationsFromDb([savedRow]);
      return true;
    }
    const { data: fetchedAfterSave } = await supabase.rpc('find_nutrient_classification', { p_name: payload.name });
    const fetchedAfterSaveRow = normalizeSingleRow(fetchedAfterSave);
    if (fetchedAfterSaveRow?.id) {
      setClassifications(prev => mergeClassificationRows(prev, [fetchedAfterSaveRow]));
      await syncClassificationsFromDb([fetchedAfterSaveRow]);
      return true;
    }
    showDbError('salvar classificação de nutriente', 'Não foi possível confirmar o cadastro no banco. Atualize a página e tente novamente.');
    return false;
  };

  const updateClassification = async (id, classification) => {
    const authUserId = await getSupabaseUserId();
    if (!supabase || !authUserId) {
      showDbError('editar classificação de nutriente', 'Sessão do Supabase expirada. Faça logout e login novamente.');
      return false;
    }
    let { data, error } = await supabase.from('nutrient_classifications').update({
      name: classification.name?.trim(),
      color: classification.color || '#6b7280',
      updated_at: new Date().toISOString()
    }).eq('id', id).eq('owner_id', authUserId).select('*').single();

    if (error && isRlsError(error)) {
      const rpcResult = await supabase.rpc('update_nutrient_classification', {
        p_id: id,
        p_color: classification.color || '#6b7280',
        p_name: classification.name?.trim()
      });
      data = rpcResult.data;
      error = rpcResult.error;
    }

    if (error) return showDbError('editar classificação. Classificações padrão não podem ser editadas diretamente; crie uma própria.', error);
    const savedRow = normalizeSingleRow(data);
    if (savedRow?.id) {
      setClassifications(prev => prev.map(item => item.id === id ? mapClassificationRow(savedRow) : item));
    }
    await refreshData();
    return true;
  };

  const removeClassification = async (id) => {
    if (!id) {
      showDbError('excluir classificação de nutriente', 'Não foi possível identificar a classificação. Atualize a página e tente novamente.');
      await refreshData();
      return false;
    }
    const authUserId = await getSupabaseUserId();
    if (!supabase || !authUserId) {
      showDbError('excluir classificação de nutriente', 'Sessão do Supabase expirada. Faça logout e login novamente.');
      return false;
    }
    let { error } = await supabase.from('nutrient_classifications').delete().eq('id', id).eq('owner_id', authUserId);
    if (error && isRlsError(error)) {
      const rpcResult = await supabase.rpc('delete_nutrient_classification', { p_id: id });
      error = rpcResult.error;
    }
    if (error) return showDbError('excluir classificação. Classificações padrão ou já usadas não podem ser excluídas.', error);
    setClassifications(prev => prev.filter(item => item.id && item.id !== id));
    await refreshData();
    return true;
  };

  const getLevelInfo = (key, value) => getLevelInfoFromParameters(parameters, key, value);

  const saveAnalysis = async (metadata, results, pdfUnits = {}) => {
    if (!user?.id) return;
    const linkedTargets = metadata.linkedProperties?.length ? metadata.linkedProperties : ['__global__'];
    const savedRows = [];

    for (const target of linkedTargets) {
      const isGlobal = target === '__global__';
      const isPlot = !isGlobal && String(target).includes('__');
      const [propertyId, plotId] = isGlobal ? [null, null] : isPlot ? String(target).split('__') : [target, null];
      const payload = {
        user_id: user.id,
        property_id: propertyId || metadata.propertyId || null,
        plot_id: plotId || metadata.plotId || metadata.talhaoId || null,
        talhao_id: plotId || metadata.talhaoId || null,
        title: metadata.amostra || metadata.fileName || 'Análise de Solo',
        file_name: metadata.fileName || null,
        analysis_date: metadata.analysisDate || null,
        metadata: normalizeForJson({ ...metadata, propertyId: propertyId || metadata.propertyId || null, talhaoId: plotId || metadata.talhaoId || null }),
        results: {}
      };
      const { data, error } = await supabase.from('soil_analyses').insert(payload).select('*').single();
      if (error) return showDbError('salvar análise de solo', error);
      const resultRows = Object.entries(results || {}).map(([parameterKey, rawValue]) => {
        const value = toNumberOrNull(rawValue);
        const levelInfo = getLevelInfoFromParameters(parameters, parameterKey, rawValue);
        return {
          analysis_id: data.id,
          parameter_key: parameterKey,
          value,
          unit: pdfUnits[parameterKey] || parameters[parameterKey]?.unit || '',
          level_name: levelInfo.name,
          level_color: levelInfo.color
        };
      });
      if (resultRows.length) {
        const { error: itemError } = await supabase.from('soil_analysis_results').insert(resultRows);
        if (itemError) return showDbError('salvar itens da análise de solo', itemError);
      }
      savedRows.push(mapAnalysisRelationalRow({ ...data, soil_analysis_results: resultRows }));
    }
    setHistory(prev => [...savedRows, ...prev]);
  };

  const deleteAnalysis = async (id) => {
    const { error } = await supabase.from('soil_analyses').delete().eq('id', id).eq('user_id', user.id);
    if (error) return showDbError('excluir análise de solo', error);
    setHistory(prev => prev.filter(a => a.id !== id));
  };

  const updateAnalysis = async (id, data) => {
    const current = history.find(a => a.id === id) || {};
    const metadata = { ...current, ...data };
    delete metadata.results;
    const { data: updated, error } = await supabase.from('soil_analyses').update({
      title: metadata.amostra || metadata.fileName || 'Análise de Solo',
      property_id: metadata.propertyId || null,
      plot_id: metadata.plotId || metadata.talhaoId || null,
      talhao_id: metadata.talhaoId || metadata.plotId || null,
      metadata: normalizeForJson(metadata),
      updated_at: new Date().toISOString()
    }).eq('id', id).eq('user_id', user.id).select('*, soil_analysis_results!soil_analysis_results_analysis_id_fkey(*)').single();
    if (error) return showDbError('editar análise de solo', error);
    setHistory(prev => prev.map(a => a.id === id ? mapAnalysisRelationalRow(updated) : a));
  };

  const addClone = async (clone) => {
    const payload = { owner_id: user.id, code: clone.code || null, name: clone.name, origin: clone.origin, description: clone.description || '' };
    const { data, error } = await supabase.from('coffee_clones').insert(payload).select('*').single();
    if (error) return showDbError('salvar clone de café', error);
    setClones(prev => [...prev, mapCloneRow(data)]);
  };

  const updateClone = async (id, data) => {
    const { data: updated, error } = await supabase.from('coffee_clones').update({
      name: data.name,
      origin: data.origin,
      description: data.description || '',
      updated_at: new Date().toISOString()
    }).eq('id', id).eq('owner_id', user.id).select('*').single();
    if (error) return showDbError('editar clone. Clones padrão não podem ser editados diretamente; crie um clone próprio.', error);
    setClones(prev => prev.map(c => c.id === id ? mapCloneRow(updated) : c));
  };

  const removeClone = async (id) => {
    const { error } = await supabase.from('coffee_clones').delete().eq('id', id).eq('owner_id', user.id);
    if (error) return showDbError('excluir clone. Clones padrão não podem ser excluídos.', error);
    setClones(prev => prev.filter(c => c.id !== id));
  };

  const saveTalhoesForProperty = async (propertyId, talhoes = []) => {
    const { error: deleteError } = await supabase.from('property_plots').delete().eq('property_id', propertyId).eq('user_id', user.id);
    if (deleteError) throw deleteError;

    for (const talhao of talhoes) {
      const { data: plot, error: plotError } = await supabase.from('property_plots').insert({
        user_id: user.id,
        property_id: propertyId,
        name: talhao.name || 'Talhão',
        area: toNumberOrNull(talhao.area),
        planting_date: talhao.dataPlantio || null
      }).select('*').single();
      if (plotError) throw plotError;

      const cloneRows = (talhao.clones || [])
        .filter((item) => item.cloneId)
        .map((item) => ({
          user_id: user.id,
          property_id: propertyId,
          plot_id: plot.id,
          clone_id: item.cloneId,
          quantity: toNumberOrNull(item.quantidade)
        }));
      if (cloneRows.length) {
        const { error: cloneError } = await supabase.from('plot_clones').insert(cloneRows);
        if (cloneError) throw cloneError;
      }
    }
  };

  const addProperty = async (prop) => {
    try {
      validatePropertyPlantLimit(prop);
      const { data, error } = await supabase.from('properties').insert({
        user_id: user.id,
        name: prop.name,
        area: toNumberOrNull(prop.area),
        plant_count: toNumberOrNull(prop.plantCount),
        talhoes: []
      }).select('*').single();
      if (error) throw error;
      await saveTalhoesForProperty(data.id, prop.talhoes || []);
      await refreshData();
    } catch (error) {
      showDbError('salvar propriedade/talhões/clones', error);
    }
  };

  const updateProperty = async (id, data) => {
    try {
      validatePropertyPlantLimit(data);
      const { error } = await supabase.from('properties').update({
        name: data.name,
        area: toNumberOrNull(data.area),
        plant_count: toNumberOrNull(data.plantCount),
        talhoes: [],
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await saveTalhoesForProperty(id, data.talhoes || []);
      await refreshData();
    } catch (error) {
      showDbError('editar propriedade/talhões/clones', error);
    }
  };

  const removeProperty = async (id) => {
    const { error } = await supabase.from('properties').delete().eq('id', id).eq('user_id', user.id);
    if (error) return showDbError('excluir propriedade', error);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const addRecommendation = async (rec) => {
    const { data, error } = await supabase.from('productivity_tables').insert({
      owner_id: user.id,
      code: rec.code || null,
      name: rec.name,
      min_bags_per_ha: toNumberOrNull(rec.minBagsPerHa),
      max_bags_per_ha: toNumberOrNull(rec.maxBagsPerHa),
      nutrients: normalizeForJson(rec.nutrients || {})
    }).select('*').single();
    if (error) return showDbError('salvar tabela de produtividade', error);
    setRecommendations(prev => [...prev, mapRecommendationRow(data)]);
  };

  const updateRecommendation = async (id, data) => {
    const { data: updated, error } = await supabase.from('productivity_tables').update({
      name: data.name,
      min_bags_per_ha: toNumberOrNull(data.minBagsPerHa),
      max_bags_per_ha: toNumberOrNull(data.maxBagsPerHa),
      nutrients: normalizeForJson(data.nutrients || {}),
      updated_at: new Date().toISOString()
    }).eq('id', id).eq('owner_id', user.id).select('*').single();
    if (error) return showDbError('editar tabela de produtividade. Faixas padrão não podem ser editadas diretamente; crie uma faixa própria.', error);
    setRecommendations(prev => prev.map(r => r.id === id ? mapRecommendationRow(updated) : r));
  };

  const removeRecommendation = async (id) => {
    const { error } = await supabase.from('productivity_tables').delete().eq('id', id).eq('owner_id', user.id);
    if (error) return showDbError('excluir tabela de produtividade. Faixas padrão não podem ser excluídas.', error);
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };

  const getCropPlanPayload = (plan, authUserId) => {
    const totalCost = plan.totalCost ?? (plan.nutrients || []).reduce((acc, row) => acc + calculateNutrientCost(row), 0);
    const analysisSnapshot = normalizeForJson(plan.analysisSnapshot || {});
    const applicationsPayload = normalizeForJson(plan.applications || {});
    const selectedMonthsPayload = normalizeForJson({
      ...(plan.selectedMonths || {}),
      ...(plan.analysisId ? { __analysis: { id: plan.analysisId, ...analysisSnapshot } } : {}),
      ...(Object.keys(applicationsPayload).length ? { __applications: applicationsPayload } : {})
    });
    const plotId = plan.talhaoId || plan.plotId || null;

    return {
      user_id: authUserId,
      crop_year: Number(plan.cropYear),
      property_id: plan.propertyId || null,
      plot_id: plotId,
      talhao_id: plotId,
      analysis_id: plan.analysisId || null,
      analysis_snapshot: analysisSnapshot,
      productivity_table_id: selectedRecommendationIdToUuid(plan.recommendationId, recommendations),
      recommendation_id: plan.recommendationId || null,
      nutrients: [],
      selected_months: selectedMonthsPayload,
      total_cost: toNumberOrNull(totalCost)
    };
  };

  const getCropPlanNutrientRows = (planId, nutrients = []) => nutrients.map((row) => ({
    crop_plan_id: planId,
    nutrient: row.nutrient || '',
    need_kg_per_ha: toNumberOrNull(row.need),
    fertilizer_name: row.fertilizer || '',
    fertilizer_percentage: toNumberOrNull(row.percentage),
    bag_size_kg: toNumberOrNull(row.bagSize),
    bag_price: toNumberOrNull(row.price),
    calculated_cost: toNumberOrNull(row.calculatedCost ?? calculateNutrientCost(row))
  }));

  const getCropPlanMonthRows = (planId, selectedMonths = {}) => {
    const monthRows = [];
    Object.entries(selectedMonths || {}).forEach(([nutrient, months]) => {
      const monthList = Array.isArray(months) ? months : typeof months === 'object' && months ? Object.values(months) : [];
      monthList.forEach((month) => {
        monthRows.push({ crop_plan_id: planId, nutrient, month_number: Number(month) });
      });
    });
    return monthRows;
  };

  const assertNoDuplicateCropPlan = async (plan, authUserId, ignoredPlanId = '') => {
    const cropYear = Number(plan.cropYear);
    const propertyId = plan.propertyId || null;
    const plotId = plan.talhaoId || plan.plotId || null;

    let duplicateQuery = supabase
      .from('crop_plans')
      .select('id, plot_id, talhao_id')
      .eq('user_id', authUserId)
      .eq('crop_year', cropYear);

    duplicateQuery = propertyId
      ? duplicateQuery.eq('property_id', propertyId)
      : duplicateQuery.is('property_id', null);

    const { data: duplicateRows, error: duplicateError } = await duplicateQuery;
    if (duplicateError) throw duplicateError;

    const hasDuplicatePlan = (duplicateRows || []).some((row) => {
      const rowPlotId = row.plot_id || row.talhao_id || null;
      return row.id !== ignoredPlanId && rowPlotId === plotId;
    });

    if (hasDuplicatePlan) {
      if (typeof window !== 'undefined') {
        window.alert('Já existe um plano de safra para este ano, propriedade e talhão.');
      }
      return false;
    }

    return true;
  };

  const saveCropPlanChildren = async (planId, plan) => {
    const nutrientRows = getCropPlanNutrientRows(planId, plan.nutrients || []);
    if (nutrientRows.length) {
      const { error: nutrientError } = await supabase.from('crop_plan_nutrients').insert(nutrientRows);
      if (nutrientError) throw nutrientError;
    }

    const monthRows = getCropPlanMonthRows(planId, plan.selectedMonths || {});
    if (monthRows.length) {
      const { error: monthError } = await supabase.from('crop_plan_months').insert(monthRows);
      if (monthError) throw monthError;
    }
  };

  const addCropPlan = async (plan) => {
    try {
      const authUserId = await getSupabaseUserId();
      if (!authUserId) {
        showDbError('salvar planejamento de safra', 'Sessao do Supabase expirada. Faca logout e login novamente.');
        return false;
      }

      const cropYear = Number(plan.cropYear);
      const propertyId = plan.propertyId || null;
      const plotId = plan.talhaoId || plan.plotId || null;

      let duplicateQuery = supabase
        .from('crop_plans')
        .select('id, plot_id, talhao_id')
        .eq('user_id', authUserId)
        .eq('crop_year', cropYear);

      duplicateQuery = propertyId
        ? duplicateQuery.eq('property_id', propertyId)
        : duplicateQuery.is('property_id', null);

      const { data: duplicateRows, error: duplicateError } = await duplicateQuery;
      if (duplicateError) throw duplicateError;
      const hasDuplicatePlan = (duplicateRows || []).some((row) => {
        const rowPlotId = row.plot_id || row.talhao_id || null;
        return rowPlotId === plotId;
      });
      if (hasDuplicatePlan) {
        if (typeof window !== 'undefined') {
          window.alert('Já existe um plano de safra para este ano, propriedade e talhão. Exclua o plano existente antes de criar outro.');
        }
        return false;
      }

      const totalCost = plan.totalCost ?? (plan.nutrients || []).reduce((acc, row) => acc + calculateNutrientCost(row), 0);
      const analysisSnapshot = normalizeForJson(plan.analysisSnapshot || {});
      const applicationsPayload = normalizeForJson(plan.applications || {});
      const selectedMonthsPayload = normalizeForJson({
        ...(plan.selectedMonths || {}),
        ...(plan.analysisId ? { __analysis: { id: plan.analysisId, ...analysisSnapshot } } : {}),
        ...(Object.keys(applicationsPayload).length ? { __applications: applicationsPayload } : {})
      });
      const cropPlanPayload = {
        user_id: authUserId,
        crop_year: cropYear,
        property_id: propertyId,
        plot_id: plotId,
        talhao_id: plotId,
        analysis_id: plan.analysisId || null,
        analysis_snapshot: analysisSnapshot,
        productivity_table_id: selectedRecommendationIdToUuid(plan.recommendationId, recommendations),
        recommendation_id: plan.recommendationId || null,
        nutrients: [],
        selected_months: selectedMonthsPayload,
        total_cost: toNumberOrNull(totalCost)
      };
      let { data, error } = await supabase.from('crop_plans').insert(cropPlanPayload).select('*').single();
      if (error && String(error.message || '').toLowerCase().includes('analysis_')) {
        const legacyPayload = { ...cropPlanPayload };
        delete legacyPayload.analysis_id;
        delete legacyPayload.analysis_snapshot;
        const retryResult = await supabase.from('crop_plans').insert(legacyPayload).select('*').single();
        data = retryResult.data;
        error = retryResult.error;
      }
      if (error) throw error;

      const nutrientRows = (plan.nutrients || []).map((row) => ({
        crop_plan_id: data.id,
        nutrient: row.nutrient || '',
        need_kg_per_ha: toNumberOrNull(row.need),
        fertilizer_name: row.fertilizer || '',
        fertilizer_percentage: toNumberOrNull(row.percentage),
        bag_size_kg: toNumberOrNull(row.bagSize),
        bag_price: toNumberOrNull(row.price),
        calculated_cost: toNumberOrNull(row.calculatedCost ?? calculateNutrientCost(row))
      }));
      if (nutrientRows.length) {
        const { error: nutrientError } = await supabase.from('crop_plan_nutrients').insert(nutrientRows);
        if (nutrientError) throw nutrientError;
      }

      const monthRows = [];
      Object.entries(plan.selectedMonths || {}).forEach(([nutrient, months]) => {
        const monthList = Array.isArray(months) ? months : typeof months === 'object' && months ? Object.values(months) : [];
        monthList.forEach((month) => {
          monthRows.push({ crop_plan_id: data.id, nutrient, month_number: Number(month) });
        });
      });
      if (monthRows.length) {
        const { error: monthError } = await supabase.from('crop_plan_months').insert(monthRows);
        if (monthError) throw monthError;
      }
      await refreshData();
      return true;
    } catch (error) {
      showDbError('salvar planejamento de safra relacional', error);
      return false;
    }
  };

  const updateCropPlan = async (id, plan) => {
    try {
      const authUserId = await getSupabaseUserId();
      if (!authUserId) {
        showDbError('editar planejamento de safra', 'Sessao do Supabase expirada. Faca logout e login novamente.');
        return false;
      }

      const canSave = await assertNoDuplicateCropPlan(plan, authUserId, id);
      if (!canSave) return false;

      const cropPlanPayload = {
        ...getCropPlanPayload(plan, authUserId),
        updated_at: new Date().toISOString()
      };

      let { error } = await supabase
        .from('crop_plans')
        .update(cropPlanPayload)
        .eq('id', id)
        .eq('user_id', authUserId);

      if (error && String(error.message || '').toLowerCase().includes('analysis_')) {
        const legacyPayload = { ...cropPlanPayload };
        delete legacyPayload.analysis_id;
        delete legacyPayload.analysis_snapshot;
        const retryResult = await supabase
          .from('crop_plans')
          .update(legacyPayload)
          .eq('id', id)
          .eq('user_id', authUserId);
        error = retryResult.error;
      }
      if (error) throw error;

      const { error: nutrientDeleteError } = await supabase
        .from('crop_plan_nutrients')
        .delete()
        .eq('crop_plan_id', id);
      if (nutrientDeleteError) throw nutrientDeleteError;

      const { error: monthDeleteError } = await supabase
        .from('crop_plan_months')
        .delete()
        .eq('crop_plan_id', id);
      if (monthDeleteError) throw monthDeleteError;

      await saveCropPlanChildren(id, plan);
      await refreshData();
      return true;
    } catch (error) {
      showDbError('editar planejamento de safra relacional', error);
      return false;
    }
  };

  const updateCropPlanApplications = async (id, applications = {}) => {
    try {
      const authUserId = await getSupabaseUserId();
      if (!authUserId) {
        showDbError('salvar aplicacoes da safra', 'Sessao do Supabase expirada. Faca logout e login novamente.');
        return false;
      }

      const plan = cropPlans.find((item) => item.id === id);
      if (!plan) {
        showDbError('salvar aplicacoes da safra', 'Planejamento nao encontrado para salvar as aplicacoes.');
        return false;
      }

      const applicationsPayload = normalizeForJson(applications || {});
      const analysisSnapshot = normalizeForJson(plan.analysisSnapshot || {});
      const selectedMonthsPayload = normalizeForJson({
        ...(plan.selectedMonths || {}),
        ...(plan.analysisId ? { __analysis: { id: plan.analysisId, ...analysisSnapshot } } : {}),
        ...(Object.keys(applicationsPayload).length ? { __applications: applicationsPayload } : {})
      });

      const { error } = await supabase
        .from('crop_plans')
        .update({
          selected_months: selectedMonthsPayload,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', authUserId);

      if (error) throw error;

      setCropPlans(prev => prev.map((item) => (
        item.id === id ? { ...item, applications: applicationsPayload } : item
      )));
      return true;
    } catch (error) {
      showDbError('salvar aplicacoes da safra', error);
      return false;
    }
  };

  const removeCropPlan = async (id) => {
    const { error } = await supabase.from('crop_plans').delete().eq('id', id).eq('user_id', user.id);
    if (error) return showDbError('excluir planejamento de safra', error);
    setCropPlans(prev => prev.filter(p => p.id !== id));
  };

  const setFertilizationMonths = async (months) => {
    setFertilizationMonthsState(months);
    if (!user?.id) return;
    const { error } = await supabase.from('user_settings').upsert({
      user_id: user.id,
      setting_key: 'fertilizationMonths',
      setting_value: normalizeForJson(months),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,setting_key' });
    if (error) showDbError('salvar divisão mensal global', error);
  };

  const saveLimingGypsumValues = async (values) => {
    const mergedValues = {
      ...DEFAULT_LIMING_GYPSUM_VALUES,
      ...(values || {})
    };
    const nextValues = Object.fromEntries(
      Object.keys(DEFAULT_LIMING_GYPSUM_VALUES).map((key) => [key, mergedValues[key] ?? ''])
    );

    const authUserId = await getSupabaseUserId();
    if (!supabase || !authUserId) {
      showDbError('salvar calagem e gessagem', 'Sessao do Supabase expirada. Faca logout e login novamente.');
      return false;
    }

    const { error } = await supabase.from('user_settings').upsert({
      user_id: authUserId,
      setting_key: 'limingGypsumValues',
      setting_value: normalizeForJson(nextValues),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,setting_key' });

    if (error) {
      showDbError('salvar calagem e gessagem', error);
      return false;
    }

    setLimingGypsumValuesState(nextValues);
    return true;
  };

  return (
    <SoilContext.Provider value={{
      parameters, classifications, addClassification, updateClassification, removeClassification, updateParameterRanges, getLevelInfo,
      history, saveAnalysis, deleteAnalysis, updateAnalysis,
      clones, addClone, updateClone, removeClone,
      properties, addProperty, updateProperty, removeProperty,
      recommendations, addRecommendation, updateRecommendation, removeRecommendation,
      cropPlans, addCropPlan, updateCropPlan, updateCropPlanApplications, removeCropPlan,
      fertilizationMonths, setFertilizationMonths,
      limingGypsumValues, saveLimingGypsumValues,
      loading, refreshData
    }}>
      {children}
    </SoilContext.Provider>
  );
};

const selectedRecommendationIdToUuid = (id, recommendations) => {
  const rec = recommendations.find((item) => item.id === id);
  if (!rec?.id) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rec.id) ? rec.id : null;
};

export const useSoil = () => useContext(SoilContext);
