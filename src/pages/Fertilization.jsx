import React, { useState, useEffect } from 'react';
import { useSoil } from '../context/SoilContext';
import { Calculator, Sprout, PlusCircle, Trash2, Target, Calendar, MapPin, Save, DollarSign } from 'lucide-react';
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

export default function Fertilization() {
  const { recommendations, properties, addCropPlan, fertilizationMonths } = useSoil();
  
  const [selectedRecId, setSelectedRecId] = useState('none');
  const [cropYear, setCropYear] = useState(new Date().getFullYear().toString());
  const [propertyId, setPropertyId] = useState('');
  const [talhaoId, setTalhaoId] = useState('');
  
  const [nutrientsData, setNutrientsData] = useState([]);
  
  const [selectedMonths, setSelectedMonths] = useState({});

  useEffect(() => {
    setSelectedMonths(fertilizationMonths || {});
  }, [fertilizationMonths]);

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

  const handleSavePlan = () => {
    if (!cropYear || !selectedRecId || selectedRecId === 'none' || nutrientsData.length === 0) {
      alert("Preencha o Ano de Produção e selecione a Produtividade e os Adubos.");
      return;
    }

    const plan = {
      id: Date.now().toString(),
      cropYear,
      propertyId,
      talhaoId,
      recommendationId: selectedRecId,
      nutrients: nutrientsData,
      selectedMonths,
      createdAt: new Date().toISOString()
    };

    addCropPlan(plan);
    alert('Plano de Safra salvo com sucesso! Você pode consultá-lo na tela de Relatórios.');
  };

  const selectedProperty = properties.find(p => p.id === propertyId);
  const selectedTalhao = selectedProperty?.talhoes?.find(t => t.id === talhaoId);

  // Calculate Grand Totals
  let grandTotalCost = 0;
  const areaMultiplier = selectedTalhao && selectedTalhao.area ? (parseFloat(selectedTalhao.area) / 10000) : 1; // area in hectares

  return (
    <div className="fertilization-page container animate-fade-in">
      <div className="fert-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Planejamento de Safra</h2>
          <p className="text-muted">Crie o seu plano de adubação, insira os custos e salve para o ano de produção.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSavePlan}>
          <Save size={18} /> Salvar Plano de Produção
        </button>
      </div>

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
              <select className="input" value={propertyId} onChange={e => { setPropertyId(e.target.value); setTalhaoId(''); }}>
                <option value="">-- Selecione --</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label>Talhão (Opcional)</label>
              <select className="input" value={talhaoId} onChange={e => setTalhaoId(e.target.value)} disabled={!propertyId}>
                <option value="">-- Planejamento Global --</option>
                {selectedProperty?.talhoes?.map(t => <option key={t.id} value={t.id}>{t.name} ({Number(t.area).toLocaleString('pt-BR')} m²)</option>)}
              </select>
            </div>
          </div>
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
                {nutrientsData.map((nut, idx) => {
                  const need = parseFloat(nut.need);
                  const perc = parseFloat(nut.percentage);
                  const bagSize = parseFloat(nut.bagSize || 50);
                  const priceBag = parseFloat(nut.price || 0);
                  const pricePerKg = bagSize > 0 ? priceBag / bagSize : 0;
                  
                  let totalCalculated = 0; // kg/ha
                  if (!isNaN(need) && !isNaN(perc) && perc > 0) {
                    totalCalculated = (need / perc) * 100;
                  }

                  const bags50 = totalCalculated / 50;
                  const bags25 = totalCalculated / 25;
                  const costPerHa = totalCalculated * pricePerKg;
                  const totalCost = costPerHa * areaMultiplier;
                  grandTotalCost += totalCost;

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
                          <label>Preço (R$/{bagSize > 0 ? bagSize : '?'}kg)</label>
                          <input type="number" step="0.01" className="input" placeholder="Ex: 180.00" value={nut.price} onChange={e => updateNutrientData(nut.id, 'price', e.target.value)} />
                        </div>
                      </div>
                      <div className="multi-fert-summary" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span>
                          Volume Anual: <strong>{totalCalculated > 0 ? `${totalCalculated.toFixed(2)} kg/ha` : '-'}</strong>
                          {totalCalculated > 0 && (
                            <span style={{ marginLeft: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                              ≈ {bags50.toFixed(1)} sacos 50kg &nbsp;|&nbsp; {bags25.toFixed(1)} sacos 25kg
                            </span>
                          )}
                        </span>
                        {priceBag > 0 && (
                          <span style={{ color: 'var(--color-primary-dark)' }}>
                            Custo/ha: <strong>R$ {costPerHa.toFixed(2)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!selectedRecId && (
                <button className="btn-text btn-add-nut" onClick={addManualNutrient} style={{ marginTop: '1rem' }}>
                  <PlusCircle size={16} /> Adicionar outro nutriente
                </button>
              )}

              {grandTotalCost > 0 && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--color-primary-dark)', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'white' }}>Custo Total Estimado de Adubação</h3>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
                      {talhaoId ? `Para o talhão ${selectedTalhao.name} (${areaMultiplier.toFixed(2)} ha)` : 'Custo por hectare (Planejamento Global)'}
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
