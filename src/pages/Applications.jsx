import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Circle,
  Filter,
  MapPin,
  Package,
  Save,
  Sprout,
  Target
} from 'lucide-react';
import { useSoil } from '../context/SoilContext';
import './Applications.css';

const MONTHS = [
  { id: 1, name: 'Jan', fullName: 'Janeiro' },
  { id: 2, name: 'Fev', fullName: 'Fevereiro' },
  { id: 3, name: 'Mar', fullName: 'Mar\u00e7o' },
  { id: 4, name: 'Abr', fullName: 'Abril' },
  { id: 5, name: 'Mai', fullName: 'Maio' },
  { id: 6, name: 'Jun', fullName: 'Junho' },
  { id: 7, name: 'Jul', fullName: 'Julho' },
  { id: 8, name: 'Ago', fullName: 'Agosto' },
  { id: 9, name: 'Set', fullName: 'Setembro' },
  { id: 10, name: 'Out', fullName: 'Outubro' },
  { id: 11, name: 'Nov', fullName: 'Novembro' },
  { id: 12, name: 'Dez', fullName: 'Dezembro' }
];

const CURRENT_YEAR = String(new Date().getFullYear());
const TODAY = new Date().toISOString().slice(0, 10);

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value, digits = 2) => Number(value || 0).toLocaleString('pt-BR', {
  maximumFractionDigits: digits,
  minimumFractionDigits: digits
});

const getPlanScopeId = (plan) => String(plan?.plotId || plan?.talhaoId || '').trim() || '__property__';
const getPlanYear = (plan) => String(plan?.cropYear || '').trim() || 'Sem safra';
const getPlanAnalysisId = (plan) => plan?.analysisId || plan?.analysisSnapshot?.id || '';
const getMetricKey = (item) => [
  String(item?.nutrient || '').trim().toLowerCase(),
  String(item?.fertilizer || '').trim().toLowerCase()
].join('|');

const getPlantCountFromTalhao = (talhao) => (talhao?.clones || []).reduce((total, clone) => {
  return total + toNumber(clone.quantidade ?? clone.quantity);
}, 0);

const getPropertyAreaM2 = (property) => {
  const propertyArea = toNumber(property?.area);
  if (propertyArea > 0) return propertyArea;
  return (property?.talhoes || []).reduce((total, talhao) => total + toNumber(talhao.area), 0);
};

const getPropertyPlantCount = (property) => {
  const propertyPlantCount = toNumber(property?.plantCount ?? property?.plant_count);
  if (propertyPlantCount > 0) return propertyPlantCount;
  return (property?.talhoes || []).reduce((total, talhao) => total + getPlantCountFromTalhao(talhao), 0);
};

const normalizeMonthPercentages = (months = {}) => Object.entries(months || {})
  .filter(([key]) => !String(key).startsWith('__'))
  .map(([monthId, percent]) => ({
    monthId: Number(monthId),
    percent: toNumber(percent)
  }))
  .filter((month) => month.monthId >= 1 && month.monthId <= 12 && month.percent > 0)
  .sort((a, b) => a.monthId - b.monthId);

const normalizeKeyPart = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const getApplicationKey = (monthId, nutrient) => [
  monthId,
  normalizeKeyPart(nutrient.nutrient || 'nutriente'),
  normalizeKeyPart(nutrient.fertilizer || 'adubo')
].join('|');

const parseTalhaoFilter = (value) => {
  const [propertyId, talhaoId] = String(value || '').split('|');
  return { propertyId: propertyId || '', talhaoId: talhaoId || '' };
};

export default function Applications() {
  const {
    cropPlans,
    properties,
    recommendations,
    fertilizationMonths,
    updateCropPlanApplications
  } = useSoil();

  const [filterYear, setFilterYear] = useState(CURRENT_YEAR);
  const [filterPropertyId, setFilterPropertyId] = useState('');
  const [filterTalhaoKey, setFilterTalhaoKey] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [draftApplications, setDraftApplications] = useState({});
  const [expandedMonthGroups, setExpandedMonthGroups] = useState({});
  const [savingPlanId, setSavingPlanId] = useState('');

  const getProperty = useCallback(
    (id) => properties.find((property) => String(property.id) === String(id)),
    [properties]
  );
  const getTalhao = useCallback((property, talhaoId) => {
    const normalizedTalhaoId = String(talhaoId || '').trim();
    if (!normalizedTalhaoId) return null;
    return (property?.talhoes || []).find((talhao) => String(talhao.id) === normalizedTalhaoId);
  }, []);

  const getPlanDrafts = useCallback((plan) => {
    return draftApplications[plan.id] || plan.applications || {};
  }, [draftApplications]);

  const uniqueYears = useMemo(() => {
    const years = new Set((cropPlans || []).map(getPlanYear).filter(Boolean));
    years.add(CURRENT_YEAR);
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [cropPlans]);

  const talhaoOptions = useMemo(() => {
    const selectedProperty = filterPropertyId ? getProperty(filterPropertyId) : null;
    const sourceProperties = selectedProperty ? [selectedProperty] : properties;

    return sourceProperties.flatMap((property) => (property?.talhoes || []).map((talhao) => ({
      id: talhao.id,
      name: talhao.name,
      propertyId: property.id,
      propertyName: property.name,
      value: `${property.id}|${talhao.id}`
    })));
  }, [filterPropertyId, getProperty, properties]);

  const getPlanContext = useCallback((plan) => {
    const property = getProperty(plan.propertyId);
    const scopeId = getPlanScopeId(plan);
    const isTalhaoPlan = scopeId !== '__property__';
    const talhao = isTalhaoPlan ? getTalhao(property, scopeId) : null;
    const areaM2 = talhao ? toNumber(talhao.area) : getPropertyAreaM2(property);
    const plantCount = talhao ? getPlantCountFromTalhao(talhao) : getPropertyPlantCount(property);

    return {
      property,
      talhao,
      scopeId,
      isTalhaoPlan,
      areaHa: areaM2 > 0 ? areaM2 / 10000 : 1,
      plantCount,
      locationName: talhao
        ? talhao.name || 'Talh\u00e3o sem nome'
        : property?.name || 'Planejamento geral'
    };
  }, [getProperty, getTalhao]);

  const getPlanSchedule = useCallback((plan) => {
    const planSchedule = normalizeMonthPercentages(plan.selectedMonths);
    return planSchedule.length ? planSchedule : normalizeMonthPercentages(fertilizationMonths);
  }, [fertilizationMonths]);

  const getReferencePlan = useCallback((plan) => {
    if (getPlanScopeId(plan) === '__property__') return null;
    const analysisId = getPlanAnalysisId(plan);

    return (cropPlans || []).find((candidate) => {
      if (candidate.id === plan.id) return false;
      if (getPlanScopeId(candidate) !== '__property__') return false;
      if (getPlanYear(candidate) !== getPlanYear(plan)) return false;
      if (String(candidate.propertyId || '') !== String(plan.propertyId || '')) return false;

      const candidateAnalysisId = getPlanAnalysisId(candidate);
      if (analysisId && candidateAnalysisId) return analysisId === candidateAnalysisId;
      return true;
    }) || null;
  }, [cropPlans]);

  const getNutrientMetrics = useCallback((plan, context, referenceMetrics = null) => {
    return (plan.nutrients || []).map((nutrient) => {
      const concentration = toNumber(nutrient.percentage);
      const needKgHa = toNumber(nutrient.need);
      const baseAnnualKgHa = concentration > 0 ? needKgHa / (concentration / 100) : 0;
      const reference = referenceMetrics?.get(getMetricKey(nutrient));
      const inheritedAnnualGramsPerPlant = Number.isFinite(reference?.annualGramsPerPlant)
        ? reference.annualGramsPerPlant
        : null;
      const annualKgTotal = inheritedAnnualGramsPerPlant !== null && context.plantCount > 0
        ? (inheritedAnnualGramsPerPlant * context.plantCount) / 1000
        : baseAnnualKgHa * context.areaHa;
      const annualKgHa = inheritedAnnualGramsPerPlant !== null && context.areaHa > 0
        ? annualKgTotal / context.areaHa
        : baseAnnualKgHa;
      const annualGramsPerPlant = context.plantCount > 0
        ? (annualKgTotal * 1000) / context.plantCount
        : null;

      return {
        ...nutrient,
        annualKgHa,
        annualKgTotal,
        annualGramsPerPlant,
        inheritedDose: inheritedAnnualGramsPerPlant !== null
      };
    });
  }, []);

  const getPlanApplicationRows = useCallback((plan) => {
    const context = getPlanContext(plan);
    const schedule = getPlanSchedule(plan);
    const referencePlan = getReferencePlan(plan);
    const referenceMetrics = referencePlan
      ? new Map(getNutrientMetrics(referencePlan, getPlanContext(referencePlan)).map((item) => [getMetricKey(item), item]))
      : null;
    const metrics = getNutrientMetrics(plan, context, referenceMetrics);

    return schedule.flatMap((month) => metrics.map((metric) => {
      const monthlyKgHa = metric.annualKgHa * (month.percent / 100);
      const monthlyKgTotal = metric.annualKgTotal * (month.percent / 100);
      const monthlyGramsPerPlant = context.plantCount > 0
        ? (monthlyKgTotal * 1000) / context.plantCount
        : null;

      return {
        key: getApplicationKey(month.monthId, metric),
        monthId: month.monthId,
        monthPercent: month.percent,
        monthName: MONTHS.find((item) => item.id === month.monthId)?.fullName || `M\u00eas ${month.monthId}`,
        nutrient: metric.nutrient || 'Nutriente',
        fertilizer: metric.fertilizer || metric.nutrient || 'Adubo',
        monthlyKgHa,
        monthlyKgTotal,
        monthlyGramsPerPlant,
        annualGramsPerPlant: metric.annualGramsPerPlant,
        inheritedDose: metric.inheritedDose
      };
    }));
  }, [getNutrientMetrics, getPlanContext, getPlanSchedule, getReferencePlan]);

  const getPlanProgress = useCallback((plan) => {
    const rows = getPlanApplicationRows(plan);
    const planDrafts = getPlanDrafts(plan);
    const applied = rows.filter((row) => planDrafts[row.key]?.applied).length;
    return {
      total: rows.length,
      applied,
      pending: rows.length - applied,
      percent: rows.length ? Math.round((applied / rows.length) * 100) : 0
    };
  }, [getPlanApplicationRows, getPlanDrafts]);

  const filteredPlans = useMemo(() => {
    const talhaoFilter = parseTalhaoFilter(filterTalhaoKey);

    return [...(cropPlans || [])]
      .filter((plan) => {
        if (filterYear && getPlanYear(plan) !== filterYear) return false;
        if (filterPropertyId && String(plan.propertyId) !== String(filterPropertyId)) return false;

        if (talhaoFilter.talhaoId) {
          const scopeId = getPlanScopeId(plan);
          if (String(plan.propertyId) !== String(talhaoFilter.propertyId)) return false;
          if (scopeId !== '__property__') return String(scopeId) === String(talhaoFilter.talhaoId);
          return true;
        }

        return true;
      })
      .filter((plan) => {
        if (!filterStatus) return true;
        const progress = getPlanProgress(plan);
        if (filterStatus === 'done') return progress.total > 0 && progress.pending === 0;
        if (filterStatus === 'pending') return progress.pending > 0;
        return true;
      })
      .sort((a, b) => {
        const yearDiff = Number(getPlanYear(b)) - Number(getPlanYear(a));
        if (yearDiff) return yearDiff;
        const aContext = getPlanContext(a);
        const bContext = getPlanContext(b);
        return aContext.locationName.localeCompare(bContext.locationName, 'pt-BR');
      });
  }, [cropPlans, filterPropertyId, filterStatus, filterTalhaoKey, filterYear, getPlanContext, getPlanProgress]);

  const updateApplicationDraft = (plan, applicationKey, patch) => {
    const planId = plan.id;
    setDraftApplications((current) => ({
      ...current,
      [planId]: {
        ...(current[planId] || plan.applications || {}),
        [applicationKey]: {
          ...((current[planId] || plan.applications || {})[applicationKey] || {}),
          ...patch
        }
      }
    }));
  };

  const toggleApplication = (plan, row) => {
    const current = getPlanDrafts(plan)[row.key] || {};
    const applied = !current.applied;
    updateApplicationDraft(plan, row.key, {
      applied,
      appliedAt: applied ? current.appliedAt || TODAY : current.appliedAt || '',
      quantityKg: applied ? current.quantityKg || String(Number(row.monthlyKgTotal.toFixed(2))) : current.quantityKg || '',
      updatedAt: new Date().toISOString()
    });
  };

  const savePlanApplications = async (plan) => {
    setSavingPlanId(plan.id);
    const saved = await updateCropPlanApplications(plan.id, getPlanDrafts(plan));
    setSavingPlanId('');

    if (saved) {
      window.alert('Acompanhamento de aplica\u00e7\u00f5es salvo com sucesso.');
    }
  };

  const getRecommendationName = (id) => recommendations.find((item) => item.id === id)?.name || 'Meta personalizada';
  const getAnalysisLabel = (plan) => {
    const snapshot = plan.analysisSnapshot || {};
    const name = snapshot.name || plan.analysisName || 'An\u00e1lise n\u00e3o informada';
    const date = snapshot.date || '';
    return date ? `${name} - ${date}` : name;
  };

  const getPlanOptionLabel = (plan) => {
    const context = getPlanContext(plan);
    return `Safra ${getPlanYear(plan)} - ${context.locationName}`;
  };

  const activePlan = filteredPlans.find((plan) => plan.id === selectedPlanId) || filteredPlans[0] || null;
  const activePlanContext = activePlan ? getPlanContext(activePlan) : null;
  const activePlanRows = activePlan ? getPlanApplicationRows(activePlan) : [];
  const activePlanDrafts = activePlan ? getPlanDrafts(activePlan) : {};
  const visibleRows = activePlanRows.filter((row) => {
    if (filterMonth && String(row.monthId) !== String(filterMonth)) return false;
    if (filterStatus === 'done') return Boolean(activePlanDrafts[row.key]?.applied);
    if (filterStatus === 'pending') return !activePlanDrafts[row.key]?.applied;
    return true;
  });
  const visibleMonthGroups = visibleRows.reduce((groups, row) => {
    const existingGroup = groups.find((group) => group.monthId === row.monthId);
    if (existingGroup) {
      existingGroup.rows.push(row);
      return groups;
    }

    groups.push({
      monthId: row.monthId,
      monthName: row.monthName,
      monthPercent: row.monthPercent,
      rows: [row]
    });
    return groups;
  }, []);
  const activeProgress = activePlan ? getPlanProgress(activePlan) : { applied: 0, total: 0, pending: 0, percent: 0 };
  const getMonthGroupKey = (planId, monthId) => `${planId}:${monthId}`;
  const toggleMonthGroup = (planId, monthId) => {
    const monthKey = getMonthGroupKey(planId, monthId);
    setExpandedMonthGroups((current) => ({
      ...current,
      [monthKey]: !current[monthKey]
    }));
  };
  const setVisibleMonthsExpanded = (expanded) => {
    if (!activePlan) return;
    setExpandedMonthGroups((current) => {
      const next = { ...current };
      visibleMonthGroups.forEach((monthGroup) => {
        next[getMonthGroupKey(activePlan.id, monthGroup.monthId)] = expanded;
      });
      return next;
    });
  };
  const hasExpandedVisibleMonth = activePlan
    ? visibleMonthGroups.some((monthGroup) => expandedMonthGroups[getMonthGroupKey(activePlan.id, monthGroup.monthId)])
    : false;
  const hasCollapsedVisibleMonth = activePlan
    ? visibleMonthGroups.some((monthGroup) => !expandedMonthGroups[getMonthGroupKey(activePlan.id, monthGroup.monthId)])
    : false;

  return (
    <div className="applications-page container animate-fade-in">
      <div className="applications-header">
        <div>
          <h2><CheckSquare size={24} /> Aplica&ccedil;&otilde;es da Safra</h2>
          <p className="text-muted">
            Marque cada aplica&ccedil;&atilde;o realizada por m&ecirc;s, adubo, propriedade ou talh&atilde;o.
          </p>
        </div>
      </div>

      <div className="applications-filters card">
        <div className="filter-title">
          <Filter size={18} />
          <span>Filtros</span>
        </div>

        <div className="input-group">
          <label>Ano de Safra</label>
          <select
            className="input"
            value={filterYear}
            onChange={(event) => {
              setFilterYear(event.target.value);
              setSelectedPlanId('');
            }}
          >
            <option value="">Todos os anos</option>
            {uniqueYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        <div className="input-group">
          <label>Propriedade</label>
          <select
            className="input"
            value={filterPropertyId}
            onChange={(event) => {
              setFilterPropertyId(event.target.value);
              setFilterTalhaoKey('');
              setSelectedPlanId('');
            }}
          >
            <option value="">Todas as propriedades</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Talh&atilde;o</label>
          <select
            className="input"
            value={filterTalhaoKey}
            onChange={(event) => {
              setFilterTalhaoKey(event.target.value);
              setSelectedPlanId('');
            }}
          >
            <option value="">Todos os talh&otilde;es</option>
            {talhaoOptions.map((talhao) => (
              <option key={talhao.value} value={talhao.value}>
                {filterPropertyId ? talhao.name : `${talhao.propertyName} - ${talhao.name}`}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Planejamento</label>
          <select
            className="input"
            value={activePlan?.id || ''}
            onChange={(event) => setSelectedPlanId(event.target.value)}
            disabled={filteredPlans.length === 0}
          >
            {filteredPlans.length === 0 ? (
              <option value="">Nenhum planejamento</option>
            ) : filteredPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>{getPlanOptionLabel(plan)}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>M&ecirc;s</label>
          <select className="input" value={filterMonth} onChange={(event) => setFilterMonth(event.target.value)}>
            <option value="">Todos os meses</option>
            {MONTHS.map((month) => (
              <option key={month.id} value={month.id}>{month.fullName}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Status da aplica&ccedil;&atilde;o</label>
          <select className="input" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="done">Conclu&iacute;dos</option>
          </select>
        </div>
      </div>

      {cropPlans.length === 0 && (
        <div className="empty-state card">
          <Package size={46} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Nenhum planejamento salvo</h3>
          <p className="text-muted">Crie um planejamento de safra antes de acompanhar as aplica&ccedil;&otilde;es.</p>
        </div>
      )}

      {cropPlans.length > 0 && filteredPlans.length === 0 && (
        <div className="empty-state card">
          <AlertCircle size={42} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Nenhuma aplica&ccedil;&atilde;o encontrada</h3>
          <p className="text-muted">Altere os filtros para visualizar outros planejamentos.</p>
        </div>
      )}

      {activePlan && (
        <section className="application-workspace card">
          <div className="application-workspace-header">
            <div>
              <h3><Calendar size={20} /> Safra {getPlanYear(activePlan)}</h3>
              <div className="application-plan-tags">
                <span><MapPin size={14} /> {activePlanContext.locationName}</span>
                <span><Target size={14} /> {getRecommendationName(activePlan.recommendationId)}</span>
                <span><Sprout size={14} /> An&aacute;lise: {getAnalysisLabel(activePlan)}</span>
              </div>
            </div>

            <div className="application-save-panel">
              <div className="application-progress-box">
                <strong>{activeProgress.applied}/{activeProgress.total}</strong>
                <span>{activeProgress.pending} pendente(s)</span>
                <div className="application-progress-track">
                  <div style={{ width: `${activeProgress.percent}%` }} />
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => savePlanApplications(activePlan)}
                disabled={savingPlanId === activePlan.id}
              >
                <Save size={18} />
                {savingPlanId === activePlan.id ? 'Salvando...' : 'Salvar lan\u00e7amentos'}
              </button>
            </div>
          </div>

          {activePlanRows.length === 0 ? (
            <div className="application-warning">
              Configure a divis&atilde;o mensal e os adubos do planejamento para gerar o checklist de aplica&ccedil;&otilde;es.
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="application-warning neutral">
              Nenhuma linha para os filtros de m&ecirc;s e status selecionados.
            </div>
          ) : (
            <div className="application-entry-table">
              <div className="application-month-toolbar">
                <span>{visibleMonthGroups.length} m&ecirc;s(es) no filtro</span>
                <div>
                  <button
                    type="button"
                    className="application-compact-button"
                    onClick={() => setVisibleMonthsExpanded(true)}
                    disabled={!hasCollapsedVisibleMonth}
                  >
                    Expandir todos
                  </button>
                  <button
                    type="button"
                    className="application-compact-button"
                    onClick={() => setVisibleMonthsExpanded(false)}
                    disabled={!hasExpandedVisibleMonth}
                  >
                    Recolher todos
                  </button>
                </div>
              </div>

              <div className="application-entry-head">
                <span>OK</span>
                <span>Adubo</span>
                <span>Planejado</span>
                <span>Data</span>
                <span>Qtd. aplicada</span>
                <span>Observa&ccedil;&atilde;o</span>
              </div>

              {visibleMonthGroups.map((monthGroup) => {
                const appliedInMonth = monthGroup.rows.filter((row) => activePlanDrafts[row.key]?.applied).length;
                const monthKey = getMonthGroupKey(activePlan.id, monthGroup.monthId);
                const isMonthExpanded = Boolean(expandedMonthGroups[monthKey]);

                return (
                  <div key={monthGroup.monthId} className="application-month-group">
                    <button
                      type="button"
                      className="application-month-divider"
                      onClick={() => toggleMonthGroup(activePlan.id, monthGroup.monthId)}
                      aria-expanded={isMonthExpanded}
                    >
                      <div className="application-month-divider-text">
                        <strong>{monthGroup.monthName}</strong>
                        <span>
                          {formatNumber(monthGroup.monthPercent, 0)}% do planejamento | {appliedInMonth}/{monthGroup.rows.length} aplicado(s)
                        </span>
                      </div>
                      {isMonthExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {isMonthExpanded && monthGroup.rows.map((row) => {
                      const draft = activePlanDrafts[row.key] || {};
                      const isApplied = Boolean(draft.applied);

                      return (
                        <div key={row.key} className={`application-entry-row ${isApplied ? 'applied' : ''}`}>
                          <button
                            type="button"
                            className="application-entry-check"
                            onClick={() => toggleApplication(activePlan, row)}
                            aria-label={isApplied ? 'Marcar como pendente' : 'Marcar como aplicado'}
                          >
                            {isApplied ? <CheckCircle2 size={21} /> : <Circle size={21} />}
                          </button>

                          <div className="entry-product">
                            <strong>{row.fertilizer}</strong>
                            <span>
                              {row.nutrient}
                              {row.inheritedDose ? ' | dose igual ao principal' : ''}
                            </span>
                          </div>

                          <div className="entry-dose">
                            <strong>{row.monthlyGramsPerPlant !== null ? `${formatNumber(row.monthlyGramsPerPlant, 1)} g/planta` : '-'}</strong>
                            <span>{formatNumber(row.monthlyKgTotal, 2)} kg total</span>
                          </div>

                          <div className="entry-field">
                            <label>Data</label>
                            <input
                              type="date"
                              className="input"
                              value={draft.appliedAt || ''}
                              onChange={(event) => updateApplicationDraft(activePlan, row.key, {
                                appliedAt: event.target.value,
                                applied: Boolean(event.target.value) || isApplied,
                                updatedAt: new Date().toISOString()
                              })}
                            />
                          </div>

                          <div className="entry-field">
                            <label>Qtd. aplicada (kg)</label>
                            <input
                              type="number"
                              className="input"
                              min="0"
                              step="0.01"
                              placeholder={formatNumber(row.monthlyKgTotal, 2)}
                              value={draft.quantityKg || ''}
                              onChange={(event) => updateApplicationDraft(activePlan, row.key, {
                                quantityKg: event.target.value,
                                updatedAt: new Date().toISOString()
                              })}
                            />
                          </div>

                          <div className="entry-field">
                            <label>Observa&ccedil;&atilde;o</label>
                            <input
                              className="input"
                              value={draft.notes || ''}
                              placeholder="Opcional"
                              onChange={(event) => updateApplicationDraft(activePlan, row.key, {
                                notes: event.target.value,
                                updatedAt: new Date().toISOString()
                              })}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
