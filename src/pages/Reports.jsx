import React, { useState } from 'react';
import { useSoil } from '../context/SoilContext';
import { FileText, MapPin, Target, DollarSign, Calendar, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import './Reports.css';

export default function Reports() {
  const { cropPlans, properties, recommendations, removeCropPlan } = useSoil();
  
  const [filterYear, setFilterYear] = useState('');
  const [expandedPlan, setExpandedPlan] = useState(null);

  // Get unique years for the filter
  const uniqueYears = [...new Set(cropPlans.map(p => p.cropYear))].sort((a, b) => b - a);
  
  const filteredPlans = filterYear ? cropPlans.filter(p => p.cropYear === filterYear) : cropPlans;

  const getPropertyName = (id) => properties.find(p => p.id === id)?.name || 'Desconhecida';
  const getTalhaoName = (propId, talhaoId) => {
    const prop = properties.find(p => p.id === propId);
    if (!prop) return 'Desconhecido';
    const talhao = prop.talhoes?.find(t => t.id === talhaoId);
    return talhao ? talhao.name : 'Desconhecido';
  };
  const getTalhaoArea = (propId, talhaoId) => {
    const prop = properties.find(p => p.id === propId);
    if (!prop) return 0;
    const talhao = prop.talhoes?.find(t => t.id === talhaoId);
    return talhao && talhao.area ? parseFloat(talhao.area) / 10000 : 1;
  };
  const getRecName = (id) => recommendations.find(r => r.id === id)?.name || 'Personalizada';

  return (
    <div className="reports-page container animate-fade-in">
      <div className="reports-header">
        <div>
          <h2>Relatórios de Safra</h2>
          <p className="text-muted">Consulte os planos de adubação e custos projetados por ano de produção.</p>
        </div>
      </div>

      <div className="reports-filters card">
        <div className="input-group" style={{ maxWidth: '300px' }}>
          <label>Filtrar por Ano de Safra</label>
          <select className="input" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">Todos os Anos</option>
            {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
      </div>

      {cropPlans.length === 0 && (
        <div className="empty-state card">
          <FileText size={48} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Nenhum plano salvo</h3>
          <p className="text-muted">Vá em "Adubação", crie um planejamento para uma safra e clique em Salvar Plano.</p>
        </div>
      )}

      <div className="reports-grid">
        {filteredPlans.map(plan => {
          const areaMultiplier = plan.talhaoId ? getTalhaoArea(plan.propertyId, plan.talhaoId) : 1;
          const isGlobal = !plan.talhaoId;
          
          let grandTotalCost = 0;
          plan.nutrients.forEach(nut => {
            const need = parseFloat(nut.need);
            const perc = parseFloat(nut.percentage);
            const bagSize = parseFloat(nut.bagSize || 50);
            const priceBag = parseFloat(nut.price || 0);
            const pricePerKg = bagSize > 0 ? priceBag / bagSize : 0;
            if (!isNaN(need) && !isNaN(perc) && perc > 0) {
              const kgPerHa = (need / perc) * 100;
              grandTotalCost += (kgPerHa * pricePerKg * areaMultiplier);
            }
          });

          const isExpanded = expandedPlan === plan.id;

          return (
            <div key={plan.id} className="report-card card">
              <div className="report-card-header" onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}>
                <div className="report-title-area">
                  <h3 className="report-title">
                    <Calendar size={18} /> Safra {plan.cropYear}
                  </h3>
                  <div className="report-tags">
                    {isGlobal ? (
                      <span className="report-tag global"><Target size={12} /> Planejamento Global (por ha)</span>
                    ) : (
                      <span className="report-tag specific"><MapPin size={12} /> {getPropertyName(plan.propertyId)} - {getTalhaoName(plan.propertyId, plan.talhaoId)}</span>
                    )}
                    <span className="report-tag text-muted">Meta: {getRecName(plan.recommendationId)}</span>
                  </div>
                </div>
                <div className="report-actions">
                  <div className="report-total-cost">
                    <span>Custo Estimado</span>
                    <strong>R$ {grandTotalCost.toFixed(2)}</strong>
                  </div>
                  <button className="btn-icon" onClick={(e) => { e.stopPropagation(); removeCropPlan(plan.id); }}>
                    <Trash2 size={18} className="text-danger" />
                  </button>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {isExpanded && (
                <div className="report-details animate-fade-in">
                  <h4>Resumo de Adubos</h4>
                  <div className="report-table-wrapper">
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>Nutriente</th>
                          <th>Adubo</th>
                          <th>Conc.</th>
                          <th>kg/ha</th>
                          <th>Sacos 50kg</th>
                          <th>Sacos 25kg</th>
                          {!isGlobal && <th>Total ({areaMultiplier.toFixed(2)} ha)</th>}
                          <th>Custo/ha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.nutrients.map(nut => {
                          const need = parseFloat(nut.need);
                          const perc = parseFloat(nut.percentage);
                          const bagSize = parseFloat(nut.bagSize || 50);
                          const priceBag = parseFloat(nut.price || 0);
                          const pricePerKg = bagSize > 0 ? priceBag / bagSize : 0;
                          let kgPerHa = 0;
                          if (!isNaN(need) && !isNaN(perc) && perc > 0) {
                            kgPerHa = (need / perc) * 100;
                          }
                          const kgTotal = kgPerHa * areaMultiplier;
                          const costPerHa = kgPerHa * pricePerKg;

                          return (
                            <tr key={nut.id}>
                              <td>{nut.nutrient} ({nut.need} kg/ha)</td>
                              <td>{nut.fertilizer || '-'}</td>
                              <td>{nut.percentage}%</td>
                              <td>{kgPerHa.toFixed(2)}</td>
                              <td>{(kgPerHa / 50).toFixed(1)}</td>
                              <td>{(kgPerHa / 25).toFixed(1)}</td>
                              {!isGlobal && <td><strong>{kgTotal.toFixed(2)}</strong> kg</td>}
                              <td>R$ {costPerHa.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {plan.selectedMonths && Object.keys(plan.selectedMonths).length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                        *A distribuição mensal deste plano usou a seguinte configuração: 
                        {Object.entries(plan.selectedMonths).filter(([_,v])=>v>0).map(([k,v]) => ` Mês ${k} (${v}%)`).join(', ')}.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
