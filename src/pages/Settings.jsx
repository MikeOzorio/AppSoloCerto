import React, { useEffect, useState } from 'react';
import { useSoil } from '../context/SoilContext';
import { Save, AlertCircle, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import './Settings.css';

const comparisonOptions = [
  { value: 'between', label: 'De ... Até' },
  { value: 'lt', label: 'Menor que' },
  { value: 'gt', label: 'Maior que' }
];

export default function Settings() {
  const { parameters, classifications, updateParameterRanges } = useSoil();
  const [localParams, setLocalParams] = useState(parameters);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('quimicos');

  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  const tabs = [
    { id: 'quimicos', label: 'Químicos Básicos' },
    { id: 'macro', label: 'Macronutrientes' },
    { id: 'micro', label: 'Micronutrientes' },
    { id: 'indices', label: 'Índices e Acidez' }
  ];

  const getClassification = (id) => classifications.find((item) => item.id === id) || classifications[0] || {};

  const handleRangeChange = (paramKey, rangeIndex, field, value) => {
    const newParams = { ...localParams };
    const ranges = [...newParams[paramKey].ranges];
    const nextRange = { ...ranges[rangeIndex] };

    if (field === 'classificationId') {
      const classification = getClassification(value);
      nextRange.classificationId = value;
      nextRange.name = classification.name;
      nextRange.color = classification.color;
    } else if (field === 'from' || field === 'to') {
      nextRange[field] = value === '' ? null : parseFloat(value);
      nextRange.max = nextRange.to;
    } else if (field === 'comparisonType') {
      nextRange.comparisonType = value;
      if (value === 'lt') nextRange.from = null;
      if (value === 'gt') nextRange.to = null;
    } else {
      nextRange[field] = value;
    }

    ranges[rangeIndex] = nextRange;
    newParams[paramKey] = { ...newParams[paramKey], ranges };
    setLocalParams(newParams);
    setSaved(false);
  };

  const addRange = (paramKey) => {
    const newParams = { ...localParams };
    const ranges = [...newParams[paramKey].ranges];
    const classification = classifications[0] || { id: '', name: 'Nova Classificação', color: '#6b7280' };

    ranges.push({
      id: Date.now().toString(),
      classificationId: classification.id,
      name: classification.name,
      comparisonType: 'between',
      from: null,
      to: null,
      max: null,
      color: classification.color
    });

    newParams[paramKey] = { ...newParams[paramKey], ranges };
    setLocalParams(newParams);
    setSaved(false);
  };

  const removeRange = (paramKey, rangeIndex) => {
    if (!window.confirm('Deseja realmente excluir esta faixa?')) return;
    const newParams = { ...localParams };
    const ranges = [...newParams[paramKey].ranges];
    ranges.splice(rangeIndex, 1);
    newParams[paramKey] = { ...newParams[paramKey], ranges };
    setLocalParams(newParams);
    setSaved(false);
  };

  const moveRange = (paramKey, rangeIndex, direction) => {
    const newParams = { ...localParams };
    const ranges = [...newParams[paramKey].ranges];
    if (direction === -1 && rangeIndex > 0) {
      const temp = ranges[rangeIndex - 1];
      ranges[rangeIndex - 1] = ranges[rangeIndex];
      ranges[rangeIndex] = temp;
    } else if (direction === 1 && rangeIndex < ranges.length - 1) {
      const temp = ranges[rangeIndex + 1];
      ranges[rangeIndex + 1] = ranges[rangeIndex];
      ranges[rangeIndex] = temp;
    } else {
      return;
    }

    newParams[paramKey] = { ...newParams[paramKey], ranges };
    setLocalParams(newParams);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!window.confirm('Deseja realmente salvar as alterações dos Parâmetros da Análise?')) return;
    for (const key of Object.keys(localParams)) {
      await updateParameterRanges(key, localParams[key].ranges);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const filteredParams = Object.entries(localParams).filter(([, param]) => param.group === activeTab);

  return (
    <div className="settings-page container animate-fade-in">
      <div className="settings-header">
        <div>
          <h2>Parâmetros da Análise</h2>
          <p className="text-muted">Configure as faixas por nutriente usando classificações cadastradas e regras do tipo De/Até, Menor que ou Maior que.</p>
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
                <div key={range.id || index} className="range-row relational-range-row">
                  <span className="classification-dot-small" style={{ backgroundColor: range.color || '#6b7280' }} />

                  <select
                    className="input range-classification"
                    value={range.classificationId || ''}
                    onChange={(e) => handleRangeChange(key, index, 'classificationId', e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {classifications.map((classification) => (
                      <option key={classification.id} value={classification.id}>{classification.name}</option>
                    ))}
                  </select>

                  <select
                    className="input range-comparison"
                    value={range.comparisonType || 'between'}
                    onChange={(e) => handleRangeChange(key, index, 'comparisonType', e.target.value)}
                  >
                    {comparisonOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>

                  {(range.comparisonType || 'between') === 'between' && (
                    <>
                      <div className="range-value-wrap"><span>De</span><input type="number" step="0.01" className="input range-value" value={range.from ?? ''} onChange={(e) => handleRangeChange(key, index, 'from', e.target.value)} /></div>
                      <div className="range-value-wrap"><span>Até</span><input type="number" step="0.01" className="input range-value" value={range.to ?? ''} onChange={(e) => handleRangeChange(key, index, 'to', e.target.value)} /></div>
                    </>
                  )}

                  {(range.comparisonType || 'between') === 'lt' && (
                    <div className="range-value-wrap"><span>Menor que</span><input type="number" step="0.01" className="input range-value" value={range.to ?? ''} onChange={(e) => handleRangeChange(key, index, 'to', e.target.value)} /></div>
                  )}

                  {(range.comparisonType || 'between') === 'gt' && (
                    <div className="range-value-wrap"><span>Maior que</span><input type="number" step="0.01" className="input range-value" value={range.from ?? ''} onChange={(e) => handleRangeChange(key, index, 'from', e.target.value)} /></div>
                  )}

                  <div className="range-actions">
                    <button className="btn-icon btn-tiny" onClick={() => moveRange(key, index, -1)} disabled={index === 0} title="Mover para Cima"><ArrowUp size={14} /></button>
                    <button className="btn-icon btn-tiny" onClick={() => moveRange(key, index, 1)} disabled={index === param.ranges.length - 1} title="Mover para Baixo"><ArrowDown size={14} /></button>
                    <button className="btn-icon text-danger btn-tiny" onClick={() => removeRange(key, index)} disabled={param.ranges.length <= 1} title="Excluir Faixa"><Trash2 size={14} /></button>
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
