import { useCallback, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Coins,
  FileText,
  MapPin,
  Package,
  Sprout,
  Target
} from 'lucide-react';
import { useSoil } from '../context/SoilContext';
import './Reports.css';

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

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const formatNumber = (value, digits = 2) => Number(value || 0).toLocaleString('pt-BR', {
  maximumFractionDigits: digits,
  minimumFractionDigits: digits
});

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

const getPlantBasisLabel = (context) => {
  if (context.plantCount > 0) {
    return context.isTalhaoPlan ? 'Quantidade do talhão' : 'Quantidade da propriedade';
  }
  return context.isTalhaoPlan ? 'Cadastre plantas no talhão' : 'Informe plantas na propriedade';
};

const normalizeMonthPercentages = (months = {}) => Object.entries(months || {})
  .map(([monthId, percent]) => ({
    monthId: Number(monthId),
    percent: toNumber(percent)
  }))
  .filter((month) => month.monthId >= 1 && month.monthId <= 12 && month.percent > 0)
  .sort((a, b) => a.monthId - b.monthId);

const normalizePlanYear = (plan) => String(plan?.cropYear || '').trim() || 'Sem safra';
const getPlanScopeId = (plan) => String(plan?.plotId || plan?.talhaoId || '').trim() || '__property__';
const getPlanTimestamp = (plan) => {
  const timestamp = new Date(plan?.createdAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getPlanAnalysisId = (plan) => plan?.analysisId || plan?.analysisSnapshot?.id || '';
const getMetricKey = (item) => [
  String(item?.nutrient || '').trim().toLowerCase(),
  String(item?.fertilizer || '').trim().toLowerCase()
].join('|');
const createTalhaoDerivedPlan = (plan, talhao) => ({
  ...plan,
  id: `${plan.id}__talhao__${talhao.id}`,
  talhaoId: talhao.id,
  plotId: talhao.id,
  generatedFromPropertyPlanId: plan.id
});

export default function Reports() {
  const {
    cropPlans,
    properties,
    history,
    recommendations,
    fertilizationMonths
  } = useSoil();

  const [filterYear, setFilterYear] = useState(CURRENT_YEAR);
  const [filterPropertyId, setFilterPropertyId] = useState('');
  const [filterTalhaoId, setFilterTalhaoId] = useState('');
  const [expandedPlans, setExpandedPlans] = useState({});

  const getProperty = useCallback(
    (id) => properties.find((property) => String(property.id) === String(id)),
    [properties]
  );
  const getTalhao = useCallback((property, talhaoId) => {
    const normalizedTalhaoId = String(talhaoId || '').trim();
    if (!normalizedTalhaoId) return null;
    return (property?.talhoes || []).find((talhao) => String(talhao.id) === normalizedTalhaoId);
  }, []);

  const uniqueCropPlans = useMemo(() => {
    const byScope = new Map();
    cropPlans.forEach((plan) => {
      const key = [
        normalizePlanYear(plan),
        plan.propertyId || '__general__',
        getPlanScopeId(plan)
      ].join('|');
      const current = byScope.get(key);
      if (!current || getPlanTimestamp(plan) > getPlanTimestamp(current)) {
        byScope.set(key, plan);
      }
    });
    return Array.from(byScope.values());
  }, [cropPlans]);

  const uniqueYears = useMemo(() => {
    const years = new Set(uniqueCropPlans.map((plan) => normalizePlanYear(plan)).filter(Boolean));
    years.add(CURRENT_YEAR);

    return [...years].sort((a, b) => {
      const aNumber = Number(a);
      const bNumber = Number(b);
      if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return bNumber - aNumber;
      if (Number.isFinite(aNumber)) return -1;
      if (Number.isFinite(bNumber)) return 1;
      return a.localeCompare(b, 'pt-BR');
    });
  }, [uniqueCropPlans]);

  const availableFilterTalhoes = useMemo(() => {
    const selectedProperty = filterPropertyId ? getProperty(filterPropertyId) : null;
    const sourceProperties = selectedProperty ? [selectedProperty] : properties;

    return sourceProperties.flatMap((property) => (property?.talhoes || []).map((talhao) => ({
      ...talhao,
      propertyId: property.id,
      propertyName: property.name
    })));
  }, [filterPropertyId, getProperty, properties]);

  const filteredPlans = useMemo(() => {
    return uniqueCropPlans.filter((plan) => {
      if (filterYear && normalizePlanYear(plan) !== filterYear) return false;
      if (filterPropertyId && String(plan.propertyId) !== String(filterPropertyId)) return false;

      if (filterTalhaoId) {
        const scopeId = getPlanScopeId(plan);
        if (scopeId !== '__property__') return String(scopeId) === String(filterTalhaoId);

        const property = getProperty(plan.propertyId);
        return (property?.talhoes || []).some((talhao) => String(talhao.id) === String(filterTalhaoId));
      }

      return true;
    });
  }, [filterPropertyId, filterTalhaoId, filterYear, getProperty, uniqueCropPlans]);

  const getRecName = (id) => recommendations.find((item) => item.id === id)?.name || 'Personalizada';
  const getAnalysisLabel = useCallback((plan) => {
    const analysisId = getPlanAnalysisId(plan);
    const analysis = history.find((item) => item.id === analysisId);
    const snapshot = plan.analysisSnapshot || {};
    const name = analysis?.amostra
      || analysis?.title
      || analysis?.fileName
      || snapshot.name
      || 'Análise não informada';
    const date = analysis?.data || analysis?.analysisDate || snapshot.date;
    return date ? `${name} - ${date}` : name;
  }, [history]);
  const shouldSharePlantDose = (leftPlan, rightPlan) => {
    if (!leftPlan || !rightPlan || leftPlan.id === rightPlan.id) return false;
    const leftId = getPlanAnalysisId(leftPlan);
    const rightId = getPlanAnalysisId(rightPlan);
    if (leftId && rightId) return leftId === rightId;
    return true;
  };

  const getPlanContext = (plan) => {
    const property = getProperty(plan.propertyId);
    const scopeId = getPlanScopeId(plan);
    const isTalhaoPlan = scopeId !== '__property__';
    const propertyTalhoes = property?.talhoes || [];
    const matchedTalhao = isTalhaoPlan ? getTalhao(property, scopeId) : null;
    const singleTalhaoFallback = isTalhaoPlan && !matchedTalhao && propertyTalhoes.length === 1
      ? propertyTalhoes[0]
      : null;
    const talhao = matchedTalhao || singleTalhaoFallback;
    const propertyAreaM2 = getPropertyAreaM2(property);
    const propertyPlantCount = getPropertyPlantCount(property);
    const talhaoAreaM2 = talhao ? toNumber(talhao.area) : 0;
    const areaM2 = talhaoAreaM2 || propertyAreaM2 || 10000;
    const areaHa = areaM2 > 0 ? areaM2 / 10000 : 1;
    const talhaoPlantCount = talhao ? getPlantCountFromTalhao(talhao) : 0;
    const plantCount = isTalhaoPlan ? talhaoPlantCount : propertyPlantCount;

    return {
      property,
      talhao,
      scopeId,
      areaHa,
      areaM2,
      plantCount,
      isTalhaoPlan,
      usingPropertyFallback: isTalhaoPlan && !talhao,
      locationName: talhao
        ? talhao.name || 'Talh\u00e3o sem nome'
        : isTalhaoPlan
          ? 'Talh\u00e3o vinculado'
        : property?.name || 'Planejamento geral'
    };
  };

  const getPropertyContextForPlan = (plan) => {
    const property = getProperty(plan.propertyId);
    const areaM2 = getPropertyAreaM2(property) || 10000;
    const plantCount = getPropertyPlantCount(property);

    return {
      property,
      talhao: null,
      scopeId: '__property__',
      areaHa: areaM2 > 0 ? areaM2 / 10000 : 1,
      areaM2,
      plantCount,
      isTalhaoPlan: false,
      usingPropertyFallback: false,
      locationName: property?.name || 'Planejamento geral'
    };
  };

  const getNutrientMetrics = (plan, context, referenceMetrics = null) => (plan.nutrients || []).map((nutrient, index) => {
    const needKgHa = toNumber(nutrient.need);
    const concentration = toNumber(nutrient.percentage);
    const bagSize = toNumber(nutrient.bagSize || 50) || 50;
    const bagPrice = toNumber(nutrient.price);
    const pricePerKg = bagSize > 0 ? bagPrice / bagSize : 0;
    const baseAnnualKgHa = concentration > 0 ? needKgHa / (concentration / 100) : 0;
    const reference = referenceMetrics?.get(getMetricKey(nutrient));
    const inheritedAnnualGramsPerPlant = reference?.annualGramsPerPlant;
    const annualKgTotal = inheritedAnnualGramsPerPlant && context.plantCount > 0
      ? (inheritedAnnualGramsPerPlant * context.plantCount) / 1000
      : baseAnnualKgHa * context.areaHa;
    const annualKgHa = inheritedAnnualGramsPerPlant && context.areaHa > 0
      ? annualKgTotal / context.areaHa
      : baseAnnualKgHa;
    const totalCost = annualKgTotal * pricePerKg;
    const annualGramsPerPlant = context.plantCount > 0
      ? (annualKgTotal * 1000) / context.plantCount
      : null;

    return {
      ...nutrient,
      id: nutrient.id || `${plan.id}-${index}`,
      needKgHa,
      concentration,
      bagSize,
      bagPrice,
      annualKgHa,
      annualKgTotal,
      annualBags: bagSize > 0 ? annualKgTotal / bagSize : 0,
      totalCost,
      annualGramsPerPlant,
      inheritedDose: Boolean(inheritedAnnualGramsPerPlant)
    };
  });

  const getReferenceMetricsMap = (referencePlan) => {
    if (!referencePlan) return null;
    const context = getPlanContext(referencePlan);
    return new Map(getNutrientMetrics(referencePlan, context).map((item) => [getMetricKey(item), item]));
  };

  const getMonthlySchedule = (plan) => {
    const planMonths = normalizeMonthPercentages(plan.selectedMonths);
    if (planMonths.length) return planMonths;
    return normalizeMonthPercentages(fertilizationMonths);
  };

  const getPlanTotals = (plan, forcedContext = null, referenceMetrics = null) => {
    const context = forcedContext || getPlanContext(plan);
    const metrics = getNutrientMetrics(plan, context, referenceMetrics);
    return {
      areaM2: context.areaM2,
      plantCount: context.plantCount,
      totalCost: metrics.reduce((total, item) => total + item.totalCost, 0),
      totalKg: metrics.reduce((total, item) => total + item.annualKgTotal, 0)
    };
  };

  const getVisibleYearPlans = (yearGroup) => {
    const talhaoPlans = Array.from(yearGroup.talhaoPlans.values()).flatMap((item) => item.plans);
    return [...yearGroup.propertyPlans, ...talhaoPlans];
  };

  const getSameAnalysisReferencePlan = (plans, plan) => {
    const analysisId = getPlanAnalysisId(plan);
    if (!analysisId) return plans.find((candidate) => candidate.id !== plan.id) || null;
    return plans.find((candidate) => candidate.id !== plan.id && getPlanAnalysisId(candidate) === analysisId) || null;
  };

  const getPlansSummary = (plans, contextResolver = null, referenceResolver = null) => plans.reduce((summary, plan) => {
    const referencePlan = referenceResolver ? referenceResolver(plan) : null;
    const totals = getPlanTotals(
      plan,
      contextResolver ? contextResolver(plan) : null,
      referencePlan ? getReferenceMetricsMap(referencePlan) : null
    );
    return {
      areaM2: summary.areaM2 + totals.areaM2,
      plantCount: summary.plantCount + totals.plantCount,
      totalCost: summary.totalCost + totals.totalCost,
      totalKg: summary.totalKg + totals.totalKg
    };
  }, {
    areaM2: 0,
    plantCount: 0,
    totalCost: 0,
    totalKg: 0
  });

  const getTalhaoPlans = (yearGroup) => Array.from(yearGroup.talhaoPlans.values()).flatMap((item) => item.plans);

  const getDisplayTalhaoGroups = (yearGroup, property) => {
    const groupsById = new Map(yearGroup.talhaoPlans);
    const primaryPlan = yearGroup.propertyPlans[0] || null;

    if (primaryPlan) {
      const propertyTalhoes = property?.talhoes || [];
      if (propertyTalhoes.length) {
        const storedGroups = Array.from(groupsById.values());
        return propertyTalhoes.map((talhao) => {
          return storedGroups.find((group) => String(group.talhao?.id) === String(talhao.id))
            || { talhao, plans: [] };
        });
      }
    }

    return Array.from(groupsById.values());
  };

  const getPrimaryYearSummary = (yearGroup) => {
    if (yearGroup.propertyPlans.length) return getPlansSummary(yearGroup.propertyPlans);

    const talhaoPlans = getTalhaoPlans(yearGroup);
    if (talhaoPlans.length === 1) {
      return getPlansSummary(
        talhaoPlans,
        (plan) => getPropertyContextForPlan(plan),
        (plan) => plan
      );
    }

    return getPlansSummary(
      talhaoPlans,
      null,
      (plan) => getSameAnalysisReferencePlan(talhaoPlans, plan)
    );
  };

  const groupedPlans = useMemo(() => {
    const groups = new Map();

    filteredPlans.forEach((plan) => {
      const property = getProperty(plan.propertyId);
      const groupKey = property?.id || '__general__';
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          property,
          yearGroups: new Map()
        });
      }

      const group = groups.get(groupKey);
      const yearKey = normalizePlanYear(plan);
      if (!group.yearGroups.has(yearKey)) {
        group.yearGroups.set(yearKey, {
          cropYear: yearKey,
          propertyPlans: [],
          talhaoPlans: new Map()
        });
      }

      const yearGroup = group.yearGroups.get(yearKey);
      const scopeId = getPlanScopeId(plan);
      const talhao = scopeId === '__property__'
        ? null
        : getTalhao(property, scopeId)
          || (property?.talhoes?.length === 1 ? property.talhoes[0] : null)
          || {
            id: scopeId,
            name: 'Talhão vinculado',
            area: getPropertyAreaM2(property) || '',
            clones: (property?.talhoes || []).flatMap((item) => item.clones || [])
          };

      if (talhao) {
        if (!yearGroup.talhaoPlans.has(talhao.id)) {
          yearGroup.talhaoPlans.set(talhao.id, { talhao, plans: [] });
        }
        yearGroup.talhaoPlans.get(talhao.id).plans.push(plan);
      } else {
        yearGroup.propertyPlans.push(plan);
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      const aName = a.property?.name || 'Planejamento geral';
      const bName = b.property?.name || 'Planejamento geral';
      return aName.localeCompare(bName, 'pt-BR');
    });
  }, [filteredPlans, getProperty, getTalhao]);

  const renderPlan = (plan, nested = false, referencePlan = null) => {
    const isDerivedPlan = Boolean(plan.generatedFromPropertyPlanId);
    const context = getPlanContext(plan);
    const shouldInheritDose = nested && shouldSharePlantDose(plan, referencePlan);
    const metrics = getNutrientMetrics(
      plan,
      context,
      shouldInheritDose ? getReferenceMetricsMap(referencePlan) : null
    );
    const schedule = getMonthlySchedule(plan);
    const isExpanded = Boolean(expandedPlans[plan.id]);
    const totalCost = metrics.reduce((total, item) => total + item.totalCost, 0);
    const totalKg = metrics.reduce((total, item) => total + item.annualKgTotal, 0);
    const totalGramsPerPlant = context.plantCount > 0 ? (totalKg * 1000) / context.plantCount : null;

    return (
      <div key={plan.id} className={`report-plan-card ${nested ? 'nested' : ''}`}>
        <button
          type="button"
          className="report-plan-header"
          onClick={() => setExpandedPlans((current) => ({ ...current, [plan.id]: !current[plan.id] }))}
        >
          <div className="report-title-area">
            <h3 className="report-title">
              <Target size={18} /> {nested ? 'Plano do talh\u00e3o' : 'Plano principal'}
            </h3>
            <div className="report-tags">
                <span className={context.isTalhaoPlan ? 'report-tag specific' : 'report-tag global'}>
                  {context.isTalhaoPlan ? <MapPin size={12} /> : <Target size={12} />}
                  {context.isTalhaoPlan ? context.locationName : 'Plano principal'}
                </span>
              {context.usingPropertyFallback && (
                <span className="report-tag muted">Base da propriedade</span>
              )}
              {shouldInheritDose && (
                <span className="report-tag muted">Dose do plano principal</span>
              )}
              {isDerivedPlan && (
                <span className="report-tag muted">Detalhe do plano principal</span>
              )}
              <span className="report-tag muted">An&aacute;lise: {getAnalysisLabel(plan)}</span>
              <span className="report-tag muted">Meta: {getRecName(plan.recommendationId)}</span>
            </div>
          </div>

          <div className="report-actions">
            <div className="report-total-cost">
              <span>Custo estimado</span>
              <strong>{formatCurrency(totalCost)}</strong>
            </div>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {isExpanded && (
          <div className="report-details animate-fade-in">
            <div className="report-summary-grid">
              <div className="summary-box">
                <span>&Aacute;rea considerada</span>
                <strong>{formatNumber(context.areaHa, 2)} ha</strong>
                <small>
                  {context.areaM2 > 0
                    ? `${formatNumber(context.areaM2, 0)} m\u00b2${context.usingPropertyFallback ? ' (base da propriedade)' : ''}`
                    : 'Informe a \u00e1rea no cadastro'}
                </small>
              </div>
              <div className="summary-box">
                <span>P&eacute;s de caf&eacute;</span>
                <strong>{context.plantCount > 0 ? formatNumber(context.plantCount, 0) : '-'}</strong>
                <small>{getPlantBasisLabel(context)}</small>
              </div>
              <div className="summary-box">
                <span>Produto anual</span>
                <strong>{formatNumber(totalKg, 2)} kg</strong>
                <small>{totalGramsPerPlant !== null ? `${formatNumber(totalGramsPerPlant, 1)} g/planta no ano` : 'Sem c\u00e1lculo por planta'}</small>
              </div>
              <div className="summary-box highlight">
                <span>Custo total</span>
                <strong>{formatCurrency(totalCost)}</strong>
                <small>{formatCurrency(context.areaHa > 0 ? totalCost / context.areaHa : 0)} / ha</small>
              </div>
            </div>

            <section className="report-section">
              <h4><Package size={18} /> Resumo anual por adubo</h4>
              <div className="fertilizer-list">
                {metrics.map((item) => (
                  <div key={item.id} className="fertilizer-row">
                    <div>
                      <strong>{item.fertilizer || item.nutrient || 'Adubo'}</strong>
                      <span>
                        {item.nutrient || 'Nutriente'}: {formatNumber(item.needKgHa, 2)} kg/ha | Conc. {formatNumber(item.concentration, 1)}%
                        {item.inheritedDose ? ' | dose por planta herdada do principal' : ''}
                      </span>
                    </div>
                    <div className="fertilizer-values">
                      <span>{formatNumber(item.annualKgHa, 2)} kg/ha</span>
                      <span>{formatNumber(item.annualKgTotal, 2)} kg total</span>
                      <span>{formatNumber(item.annualBags, 1)} saco(s) de {formatNumber(item.bagSize, 0)} kg</span>
                      <strong>{formatCurrency(item.totalCost)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="report-section">
              <h4><Sprout size={18} /> Cronograma mensal e aplica&ccedil;&atilde;o</h4>
              {schedule.length === 0 ? (
                <div className="report-warning">
                  Configure a Divis&atilde;o Mensal Global para detalhar quanto aplicar em cada m&ecirc;s.
                </div>
              ) : (
                <div className="monthly-report-grid">
                  {schedule.map((month) => {
                    const monthInfo = MONTHS.find((item) => item.id === month.monthId);
                    return (
                      <div key={month.monthId} className="month-report-card">
                        <div className="month-report-header">
                          <strong>{monthInfo?.fullName || `M\u00eas ${month.monthId}`}</strong>
                          <span>{formatNumber(month.percent, 0)}%</span>
                        </div>

                        <div className="application-list">
                          {metrics.map((item) => {
                            const monthlyKgHa = item.annualKgHa * (month.percent / 100);
                            const monthlyKgTotal = item.annualKgTotal * (month.percent / 100);
                            const gramsPerPlant = context.plantCount > 0
                              ? (monthlyKgTotal * 1000) / context.plantCount
                              : null;

                            return (
                              <div key={`${plan.id}:${month.monthId}:${item.id}`} className="application-row">
                                <div className="application-main">
                                  <strong>{item.fertilizer || item.nutrient || 'Adubo'}</strong>
                                  <span>{formatNumber(monthlyKgHa, 2)} kg/ha | {formatNumber(monthlyKgTotal, 2)} kg total</span>
                                </div>
                                <div className="application-dose">
                                  {gramsPerPlant !== null ? (
                                    <>
                                      <strong>{formatNumber(gramsPerPlant, 1)} g</strong>
                                      <span>por planta</span>
                                    </>
                                  ) : (
                                    <>
                                      <strong>-</strong>
                                      <span>cadastre p&eacute;s</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="reports-page container animate-fade-in">
      <div className="reports-header">
        <div>
          <h2>Relat&oacute;rios de Safra</h2>
          <p className="text-muted">
            Veja o plano por propriedade e talh&atilde;o, com custo, quantidade mensal e dose por planta.
          </p>
        </div>
      </div>

      <div className="reports-filters card">
        <div className="input-group">
          <label>Filtrar por Ano de Safra</label>
          <select className="input" value={filterYear} onChange={(event) => setFilterYear(event.target.value)}>
            <option value="">Todos os anos</option>
            {uniqueYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        <div className="input-group">
          <label>Filtrar por Propriedade</label>
          <select
            className="input"
            value={filterPropertyId}
            onChange={(event) => {
              setFilterPropertyId(event.target.value);
              setFilterTalhaoId('');
            }}
          >
            <option value="">Todas as propriedades</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Filtrar por Talh&atilde;o</label>
          <select
            className="input"
            value={filterTalhaoId}
            onChange={(event) => setFilterTalhaoId(event.target.value)}
          >
            <option value="">Todos os talh&otilde;es</option>
            {availableFilterTalhoes.map((talhao) => (
              <option key={`${talhao.propertyId}-${talhao.id}`} value={talhao.id}>
                {filterPropertyId ? talhao.name : `${talhao.propertyName} - ${talhao.name}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {cropPlans.length === 0 && (
        <div className="empty-state card">
          <FileText size={48} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Nenhum plano salvo</h3>
          <p className="text-muted">V&aacute; em Planejamento de Safra para criar ou revisar seus planejamentos.</p>
        </div>
      )}

      {cropPlans.length > 0 && filteredPlans.length === 0 && (
        <div className="empty-state card">
          <FileText size={42} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Nenhum plano para os filtros selecionados</h3>
          <p className="text-muted">Altere os filtros para visualizar outros planejamentos.</p>
        </div>
      )}

      <div className="reports-groups">
        {groupedPlans.map((group) => {
          const yearGroups = Array.from(group.yearGroups.values())
            .sort((a, b) => Number(b.cropYear) - Number(a.cropYear));
          const groupPlans = yearGroups.flatMap(getVisibleYearPlans);
          const propertyPlantCount = getPropertyPlantCount(group.property);
          const groupSummary = yearGroups.reduce((summary, yearGroup) => {
            const yearSummary = getPrimaryYearSummary(yearGroup);
            return {
              areaM2: summary.areaM2 + yearSummary.areaM2,
              plantCount: summary.plantCount + yearSummary.plantCount,
              totalCost: summary.totalCost + yearSummary.totalCost,
              totalKg: summary.totalKg + yearSummary.totalKg
            };
          }, {
            areaM2: 0,
            plantCount: 0,
            totalCost: 0,
            totalKg: 0
          });

          return (
            <section key={group.key} className="property-report-group">
              <div className="property-report-header">
                <div>
                  <h3><MapPin size={20} /> {group.property?.name || 'Planejamento geral'}</h3>
                  <p>
                    {group.property?.area ? `${formatNumber(group.property.area, 0)} m\u00b2` : 'Sem propriedade vinculada'}
                    {' | '}
                    {propertyPlantCount > 0 ? `${formatNumber(propertyPlantCount, 0)} plantas` : 'Sem plantas cadastradas'}
                    {' | '}
                    {groupPlans.length} plano(s)
                  </p>
                </div>
                <div className="property-report-total">
                  <Coins size={18} />
                  <span>{formatCurrency(groupSummary.totalCost)}</span>
                </div>
              </div>

              <div className="safra-report-list">
                {yearGroups.map((yearGroup) => {
                  const primaryPlan = yearGroup.propertyPlans[0] || null;
                  const allTalhaoGroups = getDisplayTalhaoGroups(yearGroup, group.property);
                  const talhaoGroups = filterTalhaoId
                    ? allTalhaoGroups.filter(({ talhao }) => String(talhao.id) === String(filterTalhaoId))
                    : allTalhaoGroups;
                  const talhaoPlans = getTalhaoPlans(yearGroup);
                  const yearPlans = getVisibleYearPlans(yearGroup);
                  const yearSummary = getPrimaryYearSummary(yearGroup);
                  const shouldShowTalhaoGroups = primaryPlan ? Boolean(expandedPlans[primaryPlan.id]) : true;
                  const summaryBasePlan = primaryPlan || (talhaoPlans.length === 1 ? talhaoPlans[0] : null);
                  const gramsPerPlant = yearSummary.plantCount > 0
                    ? (yearSummary.totalKg * 1000) / yearSummary.plantCount
                    : null;
                  const mainSummaryLabel = yearGroup.propertyPlans.length
                    ? 'Plano da propriedade'
                    : talhaoPlans.length === 1
                      ? 'Estimativa da propriedade pelo plano do talhão'
                      : 'Resumo dos talhões';
                  const summaryAnalysisLabel = summaryBasePlan
                    ? getAnalysisLabel(summaryBasePlan)
                    : 'Análises dos talhões';

                  return (
                    <div key={yearGroup.cropYear} className="safra-report-group">
                      <div className="safra-report-header">
                        <h4><Calendar size={18} /> Safra {yearGroup.cropYear}</h4>
                        <span>{yearPlans.length} plano(s) | {formatCurrency(yearSummary.totalCost)}</span>
                      </div>

                      <div className="safra-main-summary">
                        <div>
                          <strong>Principal</strong>
                          <span>{mainSummaryLabel}</span>
                        </div>
                        <div>
                          <span>Análise base</span>
                          <strong>{summaryAnalysisLabel}</strong>
                        </div>
                        <div>
                          <span>Custo</span>
                          <strong>{formatCurrency(yearSummary.totalCost)}</strong>
                        </div>
                        <div>
                          <span>Produto anual</span>
                          <strong>{formatNumber(yearSummary.totalKg, 2)} kg</strong>
                        </div>
                        <div>
                          <span>Dose m&eacute;dia</span>
                          <strong>{gramsPerPlant !== null ? `${formatNumber(gramsPerPlant, 1)} g/planta` : '-'}</strong>
                        </div>
                      </div>

                      {yearGroup.propertyPlans.length > 0 && (
                        <div className="property-plan-list">
                          {yearGroup.propertyPlans.map((plan) => renderPlan(plan))}
                        </div>
                      )}

                      {shouldShowTalhaoGroups && talhaoGroups.length > 0 && (
                        <div className="talhao-report-list">
                          {talhaoGroups.map(({ talhao, plans }) => (
                            <div key={talhao.id} className="talhao-report-group">
                              <div className="talhao-report-header">
                                <div>
                                  <h4>{talhao.name || 'Talh\u00e3o sem nome'}</h4>
                                  <span>
                                    {talhao.area ? `${formatNumber(talhao.area, 0)} m\u00b2` : 'Sem \u00e1rea'}
                                    {' | '}
                                    {formatNumber(getPlantCountFromTalhao(talhao), 0)} p&eacute;s
                                  </span>
                                </div>
                              </div>
                              {(plans.length ? plans : primaryPlan ? [createTalhaoDerivedPlan(primaryPlan, talhao)] : []).map((plan) => {
                                const referencePlan = primaryPlan && shouldSharePlantDose(plan, primaryPlan)
                                  ? primaryPlan
                                  : getSameAnalysisReferencePlan(talhaoPlans, plan);
                                return renderPlan(plan, true, referencePlan);
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
