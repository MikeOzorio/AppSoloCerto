import React, { useState } from 'react';
import { useSoil } from '../context/SoilContext';
import { Save, AlertCircle, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const { parameters, updateParameterRanges, fertilizationMonths, setFertilizationMonths } = useSoil();
  const [localParams, setLocalParams] = useState(parameters);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('quimicos');

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

  const [selectedMonths, setSelectedMonths] = useState(fertilizationMonths || {});

  React.useEffect(() => {
    setSelectedMonths(fertilizationMonths || {});
  }, [fertilizationMonths]);

  const toggleMonth = (id) => {
    setSelectedMonths(prev => {
      const next = { ...prev };
      if (next[id] !== undefined) delete next[id];
      else next[id] = 0;
      setSaved(false);
      return next;
    });
  };

  const updateMonthPercentage = (id, value) => {
    setSelectedMonths(prev => ({ ...prev, [id]: Number(value) }));
    setSaved(false);
  };

  const totalPercentage = Object.values(selectedMonths).reduce((acc, val) => acc + (val || 0), 0);
  const isValidPercentage = totalPercentage === 100;

  const tabs = [
    { id: 'quimicos', label: 'Químicos Básicos' },
    { id: 'macro', label: 'Macronutrientes' },
    { id: 'micro', label: 'Micronutrientes' },
    { id: 'indices', label: 'Índices e Acidez' },
    { id: 'meses', label: 'Divisão Mensal Global' }
  ];

  const handleRangeChange = (paramKey, rangeIndex, field, value) => {
    const newParams = { ...localParams };
    const ranges = [...newParams[paramKey].ranges];
    
    if (field === 'max') {
      ranges[rangeIndex].max = value === '' ? null : parseFloat(value);
    } else {
      ranges[rangeIndex][field] = value;
    }
    
    newParams[paramKey].ranges = ranges;
    setLocalParams(newParams);
    setSaved(false);
  };

  const addRange = (paramKey) => {
    const newParams = { ...localParams };
    const ranges = [...newParams[paramKey].ranges];
    
    // Create a new generic range before the "Muito Alto" if possible
    ranges.splice(ranges.length - 1, 0, {
      id: Date.now().toString(),
      name: 'Nova Faixa',
      max: 0,
      color: '#8b5a2b' // default brown color
    });
    
    newParams[paramKey].ranges = ranges;
    setLocalParams(newParams);
    setSaved(false);
  };

  const removeRange = (paramKey, rangeIndex) => {
    const newParams = { ...localParams };
    const ranges = [...newParams[paramKey].ranges];
    ranges.splice(rangeIndex, 1);
    newParams[paramKey].ranges = ranges;
    setLocalParams(newParams);
    setSaved(false);
  };

  const moveRange = (paramKey, rangeIndex, direction) => {
    const newParams = { ...localParams };
    const ranges = [...newParams[paramKey].ranges];
    if (direction === -1 && rangeIndex > 0) {
      // Move up
      const temp = ranges[rangeIndex - 1];
      ranges[rangeIndex - 1] = ranges[rangeIndex];
      ranges[rangeIndex] = temp;
    } else if (direction === 1 && rangeIndex < ranges.length - 1) {
      // Move down
      const temp = ranges[rangeIndex + 1];
      ranges[rangeIndex + 1] = ranges[rangeIndex];
      ranges[rangeIndex] = temp;
    } else {
      return;
    }
    
    newParams[paramKey].ranges = ranges;
    setLocalParams(newParams);
    setSaved(false);
  };

  const handleSave = () => {
    Object.keys(localParams).forEach(key => {
      updateParameterRanges(key, localParams[key].ranges);
    });
    setFertilizationMonths(selectedMonths);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const filteredParams = Object.entries(localParams).filter(([key, param]) => param.group === activeTab);

  return (
    <div className="settings-page container animate-fade-in">
      <div className="settings-header">
        <div>
          <h2>Parâmetros da Análise</h2>
          <p className="text-muted">Ajuste os limites numéricos para a classificação automática da sua região.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={18} /> Salvar Alterações
        </button>
      </div>

      {saved && (
        <div className="alert success">
          <AlertCircle size={18} /> Configurações salvas com sucesso!
        </div>
      )}

      <div className="tabs">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-grid">
        {filteredParams.map(([key, param]) => (
          <div key={key} className="param-card card">
            <div className="param-title">
              <div className="param-name-wrap">
                <h3>{param.name}</h3>
                <span className="param-symbol">{param.symbol}</span>
              </div>
              <span className="param-unit">{param.unit || 'adimensional'}</span>
            </div>
            
            <div className="ranges-list">
              {param.ranges.map((range, index) => (
                <div key={range.id} className="range-row">
                  <input 
                    type="color" 
                    className="color-picker" 
                    value={range.color.startsWith('var') ? '#cccccc' : range.color} 
                    onChange={(e) => handleRangeChange(key, index, 'color', e.target.value)}
                    title="Se não for cor padrão, escolha a cor aqui"
                  />
                  <input 
                    type="text" 
                    className="input range-name" 
                    value={range.name} 
                    onChange={(e) => handleRangeChange(key, index, 'name', e.target.value)}
                    placeholder="Nome da Faixa"
                  />
                  <div className="range-max-wrap">
                    <span className="max-label">Até:</span>
                    <input 
                      type="number" 
                      step="0.01"
                      className="input range-max" 
                      value={range.max === null || range.max === Infinity ? '' : range.max} 
                      onChange={(e) => handleRangeChange(key, index, 'max', e.target.value)}
                      placeholder="∞"
                    />
                  </div>
                  <div className="range-actions">
                    <button 
                      className="btn-icon btn-tiny" 
                      onClick={() => moveRange(key, index, -1)}
                      disabled={index === 0}
                      title="Mover para Cima"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      className="btn-icon btn-tiny" 
                      onClick={() => moveRange(key, index, 1)}
                      disabled={index === param.ranges.length - 1}
                      title="Mover para Baixo"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button 
                      className="btn-icon text-danger btn-tiny" 
                      onClick={() => removeRange(key, index)}
                      disabled={param.ranges.length <= 1}
                      title="Excluir Faixa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <button className="btn-secondary btn-sm add-range-btn" onClick={() => addRange(key)}>
                <Plus size={14} /> Adicionar Faixa
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'meses' && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>Meses de Adubação</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Defina aqui os meses de aplicação da fazenda. A porcentagem total deve fechar em 100%. Esta configuração será aplicada automaticamente na tela de Adubação.
              </p>
            </div>
            <span className={`percentage-badge ${isValidPercentage ? 'valid' : 'invalid'}`}>
              Total: {totalPercentage}% {isValidPercentage && <span style={{marginLeft: '4px'}}>✔</span>}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
            {MONTHS.map(month => {
              const isSelected = selectedMonths[month.id] !== undefined;
              return (
                <div key={month.id} style={{
                  border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  backgroundColor: isSelected ? 'rgba(139, 90, 43, 0.03)' : 'transparent'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleMonth(month.id)}
                    />
                    <span>{month.name}</span>
                  </label>
                  
                  {isSelected && (
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        className="input"
                        style={{ width: '100%', paddingRight: '2rem', textAlign: 'right' }}
                        placeholder="%"
                        value={selectedMonths[month.id] || ''}
                        onChange={(e) => updateMonthPercentage(month.id, e.target.value)}
                      />
                      <span style={{ position: 'absolute', right: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
