import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const SoilContext = createContext();

const createRanges = (low, med, adeq) => [
  { id: '1', name: 'Baixo', max: low, color: '#ef4444' },
  { id: '2', name: 'Médio', max: med, color: '#fb923c' },
  { id: '3', name: 'Adequado', max: adeq, color: '#22c55e' },
  { id: '4', name: 'Muito Alto', max: Infinity, color: '#8b5cf6' }
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

// Clones pré-carregados: Espírito Santo e Rondônia
const defaultClones = [
  // Espírito Santo (Incaper)
  { id: 'es1', name: 'Vitória Incaper 8142', origin: 'ES', description: 'Alta produtividade, grãos grandes' },
  { id: 'es2', name: 'Diamante ES8112', origin: 'ES', description: 'Tolerante à seca, maturação uniforme' },
  { id: 'es3', name: 'Jequitibá ES8122', origin: 'ES', description: 'Vigor vegetativo, boa qualidade de bebida' },
  { id: 'es4', name: 'Centenária ES8132', origin: 'ES', description: 'Resistência à ferrugem' },
  { id: 'es5', name: 'Robustão Capixaba (Emcaper 8151)', origin: 'ES', description: 'Altamente produtivo' },
  { id: 'es6', name: 'Tributun (Incaper 8152)', origin: 'ES', description: 'Tolerância à seca' },
  { id: 'es7', name: 'Bamburral (Incaper 8121)', origin: 'ES', description: 'Grãos de peneira alta' },
  { id: 'es8', name: 'Pirata (Incaper 8111)', origin: 'ES', description: 'Precoce, produtivo' },
  { id: 'es9', name: 'Verdim (Incaper 8131)', origin: 'ES', description: 'Boa adaptação regional' },
  { id: 'es10', name: 'P2 (Clone 02)', origin: 'ES', description: 'Clone tradicional capixaba' },
  { id: 'es11', name: 'Clone 03 (Emcapa 03)', origin: 'ES', description: 'Clone tradicional capixaba' },
  { id: 'es12', name: 'Clone 12 (Emcapa 12)', origin: 'ES', description: 'Peneira alta, produtivo' },
  { id: 'es13', name: 'Clone 153 (Emcapa 153)', origin: 'ES', description: 'Produtivo, rústico' },
  // Rondônia (Embrapa)
  { id: 'ro1', name: 'BRS Ouro Preto (Cpafro 199)', origin: 'RO', description: 'Alta produtividade, tolerante à seca' },
  { id: 'ro2', name: 'Conilon BRS 1216 (Robusta Amazônico)', origin: 'RO', description: 'Adaptado ao clima amazônico' },
  { id: 'ro3', name: 'Cpafro 194', origin: 'RO', description: 'Boa qualidade de bebida' },
  { id: 'ro4', name: 'Cpafro 167', origin: 'RO', description: 'Vigor vegetativo alto' },
  { id: 'ro5', name: 'Cpafro 180', origin: 'RO', description: 'Maturação uniforme' },
  { id: 'ro6', name: 'Cpafro 160', origin: 'RO', description: 'Precoce, grãos grandes' },
  { id: 'ro7', name: 'Robusta Tropical (BRS 2299)', origin: 'RO', description: 'Tolerante à ferrugem' },
  { id: 'ro8', name: 'Cpafro 175', origin: 'RO', description: 'Altamente produtivo em Rondônia' },
];

// Recomendações Padrão de Produtividade
const defaultRecommendations = [
  {
    id: 'rec1',
    name: 'Até 30 sacas/ha',
    nutrients: { N: 150, P2O5: 40, K2O: 120 }
  },
  {
    id: 'rec2',
    name: '31 - 50 sacas/ha',
    nutrients: { N: 320, P2O5: 60, K2O: 200 }
  },
  {
    id: 'rec3',
    name: 'Acima de 50 sacas/ha',
    nutrients: { N: 400, P2O5: 80, K2O: 300 }
  }
];

const DATA_KEYS = {
  parameters: 'parameters_v5',
  history: 'history',
  clones: 'clones',
  properties: 'properties',
  recommendations: 'recommendations',
  cropPlans: 'cropPlans',
  fertilizationMonths: 'fertilizationMonths'
};

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const normalizeForJson = (value) => JSON.parse(JSON.stringify(value, (_key, val) => {
  if (typeof val === 'number' && !Number.isFinite(val)) return null;
  return val;
}));

async function loadUserData(userId) {
  if (!supabase || !userId) return {};
  const { data, error } = await supabase.from('app_data').select('data_key,data').eq('user_id', userId);
  if (error) {
    console.error('Erro ao carregar dados do Supabase:', error);
    return {};
  }
  return (data || []).reduce((acc, row) => {
    acc[row.data_key] = row.data;
    return acc;
  }, {});
}

async function saveUserData(userId, dataKey, data) {
  if (!supabase || !userId) return;
  const { error } = await supabase.from('app_data').upsert({
    user_id: userId,
    data_key: dataKey,
    data: normalizeForJson(data),
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,data_key' });
  if (error) console.error(`Erro ao salvar ${dataKey} no Supabase:`, error);
}

export const SoilProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState(defaultParameters);
  const [history, setHistory] = useState([]);
  const [clones, setClones] = useState(defaultClones);
  const [properties, setProperties] = useState([]);
  const [recommendations, setRecommendations] = useState(defaultRecommendations);
  const [cropPlans, setCropPlans] = useState([]);
  const [fertilizationMonths, setFertilizationMonthsState] = useState({});

  const persist = (dataKey, setter) => (updater) => {
    setter(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (user?.id) saveUserData(user.id, dataKey, next);
      return next;
    });
  };

  const setParametersPersisted = persist(DATA_KEYS.parameters, setParameters);
  const setHistoryPersisted = persist(DATA_KEYS.history, setHistory);
  const setClonesPersisted = persist(DATA_KEYS.clones, setClones);
  const setPropertiesPersisted = persist(DATA_KEYS.properties, setProperties);
  const setRecommendationsPersisted = persist(DATA_KEYS.recommendations, setRecommendations);
  const setCropPlansPersisted = persist(DATA_KEYS.cropPlans, setCropPlans);
  const setFertilizationMonthsPersisted = persist(DATA_KEYS.fertilizationMonths, setFertilizationMonthsState);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isAuthenticated || !user?.id) {
        setParameters(defaultParameters);
        setHistory([]);
        setClones(defaultClones);
        setProperties([]);
        setRecommendations(defaultRecommendations);
        setCropPlans([]);
        setFertilizationMonthsState({});
        return;
      }
      setLoading(true);
      const stored = await loadUserData(user.id);
      if (cancelled) return;
      setParameters(stored[DATA_KEYS.parameters] || cloneValue(defaultParameters));
      setHistory(stored[DATA_KEYS.history] || []);
      setClones(stored[DATA_KEYS.clones] || cloneValue(defaultClones));
      setProperties(stored[DATA_KEYS.properties] || []);
      setRecommendations(stored[DATA_KEYS.recommendations] || cloneValue(defaultRecommendations));
      setCropPlans(stored[DATA_KEYS.cropPlans] || []);
      setFertilizationMonthsState(stored[DATA_KEYS.fertilizationMonths] || {});
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  const updateParameterRanges = (key, newRanges) => {
    setParametersPersisted(prev => ({
      ...prev,
      [key]: { ...prev[key], ranges: newRanges }
    }));
  };

  const getLevelInfo = (key, value) => {
    if (!value || isNaN(value)) return { name: 'N/A', color: 'var(--color-text-muted)' };
    const val = parseFloat(value);
    const param = parameters[key];
    if (!param) return { name: 'N/A', color: 'var(--color-text-muted)' };
    for (const range of param.ranges) {
      const maxVal = range.max === null || range.max === undefined ? Infinity : Number(range.max);
      if (val <= maxVal) return { name: range.name, color: range.color };
    }
    const last = param.ranges[param.ranges.length - 1];
    return { name: last.name, color: last.color };
  };

  // History
  const saveAnalysis = (metadata, results) => {
    const newEntry = { id: Date.now().toString(), ...metadata, results };
    setHistoryPersisted(prev => [newEntry, ...prev]);
  };
  const deleteAnalysis = (id) => setHistoryPersisted(prev => prev.filter(a => a.id !== id));
  const updateAnalysis = (id, data) => setHistoryPersisted(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));

  // Clones
  const addClone = (clone) => setClonesPersisted(prev => [...prev, clone]);
  const updateClone = (id, data) => setClonesPersisted(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  const removeClone = (id) => setClonesPersisted(prev => prev.filter(c => c.id !== id));

  // Properties
  const addProperty = (prop) => setPropertiesPersisted(prev => [...prev, prop]);
  const updateProperty = (id, data) => setPropertiesPersisted(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  const removeProperty = (id) => setPropertiesPersisted(prev => prev.filter(p => p.id !== id));

  // Recommendations
  const addRecommendation = (rec) => setRecommendationsPersisted(prev => [...prev, rec]);
  const updateRecommendation = (id, data) => setRecommendationsPersisted(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  const removeRecommendation = (id) => setRecommendationsPersisted(prev => prev.filter(r => r.id !== id));

  // Crop Plans
  const addCropPlan = (plan) => setCropPlansPersisted(prev => [...prev, plan]);
  const removeCropPlan = (id) => setCropPlansPersisted(prev => prev.filter(p => p.id !== id));

  return (
    <SoilContext.Provider value={{
      parameters, updateParameterRanges, getLevelInfo,
      history, saveAnalysis, deleteAnalysis, updateAnalysis,
      clones, addClone, updateClone, removeClone,
      properties, addProperty, updateProperty, removeProperty,
      recommendations, addRecommendation, updateRecommendation, removeRecommendation,
      cropPlans, addCropPlan, removeCropPlan,
      fertilizationMonths, setFertilizationMonths: setFertilizationMonthsPersisted,
      loading
    }}>
      {children}
    </SoilContext.Provider>
  );
};

export const useSoil = () => useContext(SoilContext);
