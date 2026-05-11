import React, { useState } from 'react';
import { useSoil } from '../context/SoilContext';
import { Save, AlertCircle, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const { parameters, updateParameterRanges } = useSoil();
  const [localParams, setLocalParams] = useState(parameters);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('quimicos');


  const tabs = [
    { id: 'quimicos', label: 'Químicos Básicos' },
    { id: 'macro', label: 'Macronutrientes' },
    { id: 'micro', label: 'Micronutrientes' },
    { id: 'indices', label: 'Índices e Acidez' }
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
    if (!window.confirm('Deseja realmente excluir esta faixa?')) return;
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
    if (!window.confirm('Deseja realmente salvar as alterações dos Parâmetros da Análise?')) return;
    Object.keys(localParams).forEach(key => {
      updateParameterRanges(key, localParams[key].ranges);
    });
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
    </div>
  );
}
