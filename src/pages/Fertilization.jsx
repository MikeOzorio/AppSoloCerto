import { useMemo, useState } from 'react';
import { useSoil } from '../context/SoilContext';
import { Sprout, PlusCircle, Trash2, Target, Calendar, MapPin, Save, FileText, Edit2, X } from 'lucide-react';
import './Fertilization.css';

const getNutrientName = (symbol) => {
  const map = {
    'N': 'Nitrogênio', 'P': 'Fósforo', 'P2O5': 'Fósforo',
    'K': 'Potássio', 'K2O': 'Potássio', 'CA': 'Cálcio',
    'MG': 'Magnésio', 'S': 'Enxofre', 'B': 'Boro',
    'ZN': 'Zinco', 'CU': 'Cobre', 'MN': 'Manganês', 'FE': 'Ferro'
  };
  return map[symbol?.trim().toUpperCase()] || symbol || 'Nutriente';
};

const MONTHS = [
  { id: 1, name: 'Jan', fullName: 'Janeiro' },
  { id: 2, name: 'Fev', fullName: 'Fevereiro' },
  { id: 3, name: 'Mar', fullName: 'Março' },
  { id: 4, name: 'Abr', fullName: 'Abril' },
  { id: 5, name: 'Mai', fullName: 'Maio' },
  { id: 6, name: 'Jun', fullName: 'Junho' },
  { id: 7, name: 'Jul', fullName: 'Julho' },
  { id: 8, name: 'Ago', fullName: 'Agosto' },
  { id: 9, name: 'Set', fullName: 'Setembro' },
  { id: 10, name: 'Out', fullName: 'Outubro' },
  { id: 11, name: 'Nov', fullName: 'Novembro' },
  { id: 12, name: 'Dez', fullName: 'Dezembro' },
];

const getAnalysisLabel = (analysis) => {
  if (!analysis) return 'Análise não selecionada';
  const name = analysis.amostra || analysis.title || analysis.fileName || analysis.name || 'Análise de solo';
  const date = analysis.data || analysis.analysisDate || analysis.date;
  return date ? `${name} - ${date}` : name;
};

export default function Fertilization() {
  const {
    recommendations,
    properties,
    cropPlans,
    addCropPlan,
    updateCropPlan,
    removeCropPlan,
    fertilizationMonths,
    history
  } = useSoil();
  
  const [selectedRecId, setSelectedRecId] = useState('none');
  const [cropYear, setCropYear] = useState(new Date().getFullYear().toString());
  const [propertyId, setPropertyId] = useState('');
  const [talhaoId, setTalhaoId] = useState('');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  const [editingPlanId, setEditingPlanId] = useState('');
  
  const [nutrientsData, setNutrientsData] = useState([]);
  
  const [savingPlan, setSavingPlan] = useState(false);
  const selectedMonths = fertilizationMonths || {};
  const selectedProperty = properties.find(p => p.id === propertyId);
  const selectedTalhao = selectedProperty?.talhoes?.find(t => t.id === talhaoId);
  const availableAnalyses = useMemo(() => {
    return (history || []).filter((analysis) => {
      if (!propertyId) return true;
      const analysisPropertyId = analysis.propertyId || '';
      const analysisTalhaoId = analysis.plotId || analysis.talhaoId || '';
      if (talhaoId) {
        return analysisTalhaoId === talhaoId
          || (!analysisTalhaoId && analysisPropertyId === propertyId)
          || !analysisPropertyId;
      }
      return analysisPropertyId === propertyId || !analysisPropertyId;
    });
  }, [history, propertyId, talhaoId]);
  const selectedAnalysis = availableAnalyses.find((analysis) => analysis.id === selectedAnalysisId)
    || (history || []).find((analysis) => analysis.id === selectedAnalysisId);
  const editingPlan = cropPlans.find((plan) => plan.id === editingPlanId);
  const sortedCropPlans = useMemo(() => {
    return [...(cropPlans || [])].sort((a, b) => {
      const yearDiff = Number(b.cropYear || 0) - Number(a.cropYear || 0);
      if (yearDiff) return yearDiff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [cropPlans]);

  const getPropertyName = (id) => properties.find((property) => property.id === id)?.name || 'Sem propriedade';
  const getTalhaoName = (plan) => {
    const property = properties.find((item) => item.id === plan.propertyId);
    const plotId = plan.plotId || plan.talhaoId;
    if (!plotId) return 'Plano principal';
    return property?.talhoes?.find((talhao) => talhao.id === plotId)?.name || 'Talhão não encontrado';
  };

  const resetPlanForm = () => {
    setSelectedRecId('none');
    setCropYear(new Date().getFullYear().toString());
    setPropertyId('');
    setTalhaoId('');
    setSelectedAnalysisId('');
    setNutrientsData([]);
    setEditingPlanId('');
  };

  const handleEditPlan = (plan) => {
    const knownRecommendation = recommendations.some((item) => item.id === plan.recommendationId);
    setEditingPlanId(plan.id);
    setCropYear(String(plan.cropYear || new Date().getFullYear()));
    setPropertyId(plan.propertyId || '');
    setTalhaoId(plan.plotId || plan.talhaoId || '');
    setSelectedAnalysisId(plan.analysisId || plan.analysisSnapshot?.id || '');
    setSelectedRecId(knownRecommendation ? plan.recommendationId : 'manual');
    setNutrientsData((plan.nutrients || []).map((nutrient, index) => ({
      id: nutrient.id || `${plan.id}-${index}`,
      nutrient: nutrient.nutrient || '',
      need: nutrient.need ?? '',
      fertilizer: nutrient.fertilizer || '',
      percentage: nutrient.percentage ?? '',
      bagSize: nutrient.bagSize || '50',
      price: nutrient.price ?? ''
    })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePlan = async (plan) => {
    if (!window.confirm('Deseja realmente excluir este planejamento de safra?')) return;
    await removeCropPlan(plan.id);
    if (editingPlanId === plan.id) resetPlanForm();
  };

  const handleRecChange = (recId) => {
    setSelectedRecId(recId);
    if (recId === 'none') {
      setNutrientsData([]);
      return;
    }
    if (recId === 'manual') {
      setNutrientsData([{ id: Date.now().toString(), nutrient: '', need: '', fertilizer: '', percentage: '', bagSize: '50', price: '' }]);
      return;
    }
    
    const rec = recommendations.find(r => r.id === recId);
    if (rec && rec.nutrients) {
      const newRows = Object.entries(rec.nutrients).map(([k, v]) => ({
        id: k,
        nutrient: k,
        need: v.toString(),
        fertilizer: '',
        percentage: '',
        bagSize: '50',
        price: ''
      }));
      setNutrientsData(newRows);
    }
  };

  const updateNutrientData = (id, field, value) => {
    setNutrientsData(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const addManualNutrient = () => {
    setNutrientsData(prev => [...prev, { id: Date.now().toString(), nutrient: '', need: '', fertilizer: '', percentage: '', bagSize: '50', price: '' }]);
  };

  const removeNutrient = (id) => {
    setNutrientsData(prev => prev.filter(n => n.id !== id));
  };

  const handleSavePlan = async () => {
    if (savingPlan) return;
    if (!cropYear || !selectedRecId || selectedRecId === 'none' || nutrientsData.length === 0) {
      alert("Preencha o Ano de Produção e selecione a Produtividade e os Adubos.");
      return;
    }
    if (!selectedAnalysisId || !selectedAnalysis) {
      alert('Selecione a análise de solo que será usada como base do planejamento.');
      return;
    }

    const plan = {
      id: editingPlanId || Date.now().toString(),
      cropYear,
      propertyId,
      talhaoId,
      analysisId: selectedAnalysisId,
      analysisSnapshot: {
        id: selectedAnalysis.id,
        name: selectedAnalysis.amostra || selectedAnalysis.title || selectedAnalysis.fileName || 'Análise de solo',
        date: selectedAnalysis.data || selectedAnalysis.analysisDate || '',
        propertyId: selectedAnalysis.propertyId || '',
        talhaoId: selectedAnalysis.plotId || selectedAnalysis.talhaoId || ''
      },
      recommendationId: selectedRecId,
      nutrients: nutrientsData,
      applications: editingPlan?.applications || {},
      selectedMonths,
      createdAt: editingPlan?.createdAt || new Date().toISOString()
    };

    setSavingPlan(true);
    try {
      const saved = editingPlanId
        ? await updateCropPlan(editingPlanId, plan)
        : await addCropPlan(plan);
      if (!saved) return;
      alert(editingPlanId
        ? 'Planejamento de safra atualizado com sucesso.'
        : 'Plano de Safra salvo com sucesso! Você pode consultá-lo na tela de Relatórios.');
      resetPlanForm();
    } finally {
      setSavingPlan(false);
    }
  };

  const areaMultiplier = selectedTalhao && selectedTalhao.area ? (parseFloat(selectedTalhao.area) / 10000) : 1; // area in hectares
  const nutrientMetrics = useMemo(() => nutrientsData.map((nut) => {
    const need = parseFloat(nut.need);
    const perc = parseFloat(nut.percentage);
    const bagSize = parseFloat(nut.bagSize || 50);
    const priceBag = parseFloat(nut.price || 0);
    const pricePerKg = bagSize > 0 ? priceBag / bagSize : 0;
    const totalCalculated = !isNaN(need) && !isNaN(perc) && perc > 0 ? (need / perc) * 100 : 0;
    const costPerHa = totalCalculated * pricePerKg;

    return {
      ...nut,
      bagSize,
      priceBag,
      totalCalculated,
      bags50: totalCalculated / 50,
      bags25: totalCalculated / 25,
      costPerHa,
      totalCost: costPerHa * areaMultiplier
    };
  }), [areaMultiplier, nutrientsData]);
  const grandTotalCost = nutrientMetrics.reduce((total, nut) => total + nut.totalCost, 0);

  return (
    <div className="fertilization-page container animate-fade-in">
      <div className="fert-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Planejamento de Safra</h2>
          <p className="text-muted">Crie, revise e edite seus planos de adubação. O relatório apenas reflete o que estiver salvo aqui.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSavePlan} disabled={savingPlan}>
          <Save size={18} /> {savingPlan ? 'Salvando...' : editingPlanId ? 'Salvar edição' : 'Salvar Plano de Produção'}
        </button>
      </div>

      <div className="saved-plans-card card">
        <div className="fert-card-header">
          <h3 className="fert-card-title"><FileText size={20} /> Planejamentos salvos</h3>
          {editingPlanId && (
            <button type="button" className="btn-secondary btn-sm" onClick={resetPlanForm}>
              <X size={14} /> Cancelar edição
            </button>
          )}
        </div>

        {sortedCropPlans.length === 0 ? (
          <p className="text-muted">Nenhum planejamento salvo ainda.</p>
        ) : (
          <div className="saved-plans-list">
            {sortedCropPlans.map((plan) => (
              <div key={plan.id} className={`saved-plan-row ${editingPlanId === plan.id ? 'active' : ''}`}>
                <div className="saved-plan-info">
                  <strong>Safra {plan.cropYear || '-'}</strong>
                  <span>{getPropertyName(plan.propertyId)} | {getTalhaoName(plan)} | {getAnalysisLabel(plan.analysisSnapshot)}</span>
                </div>
                <div className="saved-plan-actions">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => handleEditPlan(plan)}>
                    <Edit2 size={14} /> Editar
                  </button>
                  <button type="button" className="btn-secondary btn-sm danger" onClick={() => handleDeletePlan(plan)}>
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingPlanId && (
        <div className="analysis-basis editing">
          <Edit2 size={16} />
          <span>Editando <strong>Safra {editingPlan?.cropYear}</strong>. Ao salvar, o Relatório de Safra será atualizado automaticamente.</span>
        </div>
      )}

      <div className="fert-grid">
        <div className="fert-card card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="fert-card-title"><MapPin size={20} /> Identificação da Safra e Área</h3>
          <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="input-group">
              <label>Ano de Produção (Safra)</label>
              <input type="number" className="input" value={cropYear} onChange={e => setCropYear(e.target.value)} placeholder="Ex: 2026" />
            </div>
            
            <div className="input-group">
              <label>Propriedade (Opcional)</label>
              <select className="input" value={propertyId} onChange={e => { setPropertyId(e.target.value); setTalhaoId(''); setSelectedAnalysisId(''); }}>
                <option value="">-- Selecione --</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label>Talhão (Opcional)</label>
              <select className="input" value={talhaoId} onChange={e => { setTalhaoId(e.target.value); setSelectedAnalysisId(''); }} disabled={!propertyId}>
                <option value="">-- Planejamento Global --</option>
                {talhaoId && !selectedTalhao && <option value={talhaoId}>Talhão não encontrado</option>}
                {selectedProperty?.talhoes?.map(t => <option key={t.id} value={t.id}>{t.name} ({Number(t.area).toLocaleString('pt-BR')} m²)</option>)}
              </select>
            </div>

            <div className="input-group">
              <label>Análise base</label>
              <select className="input" value={selectedAnalysisId} onChange={e => setSelectedAnalysisId(e.target.value)}>
                <option value="">-- Selecione a análise --</option>
                {availableAnalyses.map((analysis) => (
                  <option key={analysis.id} value={analysis.id}>{getAnalysisLabel(analysis)}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedAnalysis ? (
            <div className="analysis-basis">
              <FileText size={16} />
              <span>Planejamento baseado em <strong>{getAnalysisLabel(selectedAnalysis)}</strong></span>
            </div>
          ) : (
            <div className="analysis-basis warning">
              <FileText size={16} />
              <span>Selecione uma análise salva para identificar a base técnica deste planejamento.</span>
            </div>
          )}
        </div>

        <div className="fert-card card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="fert-card-title"><Target size={20} /> Metas de Produtividade</h3>
          
          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label>Selecione a Produtividade Esperada</label>
            <select className="input" value={selectedRecId} onChange={e => handleRecChange(e.target.value)}>
              <option value="none" disabled>-- Escolha uma Opção --</option>
              <option value="manual">-- Modo Manual (Adicionar Nutrientes) --</option>
              {recommendations.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {selectedRecId !== 'none' && (
            <>
              <h3 className="fert-card-title"><Sprout size={20} /> Adubos, Nutrientes e Custos</h3>
              
              <div className="multi-fert-list">
                {nutrientMetrics.map((nut) => {
                  return (
                    <div key={nut.id} className="multi-fert-row">
                      <div className="multi-fert-header">
                        <h4>{getNutrientName(nut.nutrient)}</h4>
                        {selectedRecId === 'manual' && nutrientsData.length > 1 && (
                          <button className="btn-icon text-danger" onClick={() => removeNutrient(nut.id)}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div className="multi-fert-inputs" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
                        <div className="input-group">
                          <label>Alvo</label>
                          <input type="text" className="input" placeholder="Ex: N" value={nut.nutrient} onChange={e => updateNutrientData(nut.id, 'nutrient', e.target.value)} disabled={selectedRecId !== 'manual'} />
                        </div>
                        <div className="input-group">
                          <label>Meta (kg/ha)</label>
                          <input type="number" className="input" placeholder="Ex: 300" value={nut.need} onChange={e => updateNutrientData(nut.id, 'need', e.target.value)} disabled={selectedRecId !== 'manual'} />
                        </div>
                        <div className="input-group">
                          <label>Adubo Comercial</label>
                          <input type="text" className="input" placeholder="Ex: Ureia" value={nut.fertilizer} onChange={e => updateNutrientData(nut.id, 'fertilizer', e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>Conc. (%)</label>
                          <input type="number" className="input" placeholder="Ex: 45" value={nut.percentage} onChange={e => updateNutrientData(nut.id, 'percentage', e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>Embalagem (kg)</label>
                          <input type="number" className="input" placeholder="50" value={nut.bagSize} onChange={e => updateNutrientData(nut.id, 'bagSize', e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>Preço (R$/{nut.bagSize > 0 ? nut.bagSize : '?'}kg)</label>
                          <input type="number" step="0.01" className="input" placeholder="Ex: 180.00" value={nut.price} onChange={e => updateNutrientData(nut.id, 'price', e.target.value)} />
                        </div>
                      </div>
                      <div className="multi-fert-summary" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span>
                          Volume Anual: <strong>{nut.totalCalculated > 0 ? `${nut.totalCalculated.toFixed(2)} kg/ha` : '-'}</strong>
                          {nut.totalCalculated > 0 && (
                            <span style={{ marginLeft: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                              ≈ {nut.bags50.toFixed(1)} sacos 50kg &nbsp;|&nbsp; {nut.bags25.toFixed(1)} sacos 25kg
                            </span>
                          )}
                        </span>
                        {nut.priceBag > 0 && (
                          <span style={{ color: 'var(--color-primary-dark)' }}>
                            Custo/ha: <strong>R$ {nut.costPerHa.toFixed(2)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedRecId === 'manual' && (
                <button className="btn-text btn-add-nut" onClick={addManualNutrient} style={{ marginTop: '1rem' }}>
                  <PlusCircle size={16} /> Adicionar outro nutriente
                </button>
              )}

              {grandTotalCost > 0 && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--color-primary-dark)', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'white' }}>Custo Total Estimado de Adubação</h3>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
                      {talhaoId
                        ? selectedTalhao
                          ? `Para o talhão ${selectedTalhao.name} (${areaMultiplier.toFixed(2)} ha)`
                          : 'Para talhão não encontrado (base por hectare)'
                        : 'Custo por hectare (Planejamento Global)'}
                    </p>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    R$ {grandTotalCost.toFixed(2)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {Object.keys(selectedMonths).length === 0 && selectedRecId !== 'none' && (
        <div className="alert warning" style={{ marginTop: '1rem' }}>
          Você ainda não configurou a Divisão Mensal Global. Vá em <strong>Configurações &gt; Divisão Mensal Global</strong> para parametrizar os meses de aplicação.
        </div>
      )}

      {Object.keys(selectedMonths).length > 0 && nutrientsData.some(n => parseFloat(n.need) > 0 && parseFloat(n.percentage) > 0) && (
        <div className="results-section card animate-fade-in">
          <h3 className="fert-card-title"><Calendar size={20} /> Cronograma de Aplicação (Meses Globais)</h3>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            Volume exato de produto comercial que deverá ser aplicado em cada mês (baseado nas suas Configurações).
          </p>

          <div className="timeline-grid">
            {MONTHS.filter(m => selectedMonths[m.id] !== undefined).map(month => {
              const perc = selectedMonths[month.id] || 0;
              return (
                <div key={month.id} className="timeline-item timeline-multi">
                  <div className="timeline-month">{month.fullName} ({perc}%)</div>
                  
                  <div className="timeline-breakdown">
                    {nutrientsData.map(nut => {
                      const need = parseFloat(nut.need);
                      const conc = parseFloat(nut.percentage);
                      if (isNaN(need) || isNaN(conc) || conc <= 0) return null;
                      
                      const totalAmount = (need / conc) * 100;
                      const amount = totalAmount * (perc / 100);
                      
                      return (
                        <div key={nut.id} className="breakdown-row">
                          <span className="breakdown-name">{nut.fertilizer || nut.nutrient}</span>
                          <span className="breakdown-val">{amount.toFixed(2)} <span>kg/ha</span></span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
