import React, { useState } from 'react';
import { useSoil } from '../context/SoilContext';
import { Trash2, FileText, Calendar, Droplets, ChevronDown, ChevronUp, MapPin, Building, Beaker, User, GitCompareArrows, X, CheckSquare, Square, Edit2, Save } from 'lucide-react';
import './History.css';

export default function History() {
  const { history, parameters, getLevelInfo, deleteAnalysis, updateAnalysis, properties } = useSoil();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProps, setSelectedProps] = useState([]);

  // Flatten all property + talhão combos for selection
  const allTargets = [];
  properties.forEach(prop => {
    allTargets.push({ type: 'property', id: prop.id, label: prop.name });
    (prop.talhoes || []).forEach(t => {
      allTargets.push({ type: 'talhao', id: `${prop.id}__${t.id}`, label: `${prop.name} › ${t.name || 'Talhão'}` });
    });
  });

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setConfirmDelete(id);
  };

  const confirm = (id, e) => {
    e.stopPropagation();
    deleteAnalysis(id);
    setConfirmDelete(null);
    setSelectedForCompare(prev => prev.filter(s => s !== id));
  };

  const cancel = (e) => {
    e.stopPropagation();
    setConfirmDelete(null);
  };

  const toggleExpand = (id) => {
    if (showComparison) return;
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (editingId === id) setEditingId(null);
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedForCompare(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const openComparison = () => {
    if (selectedForCompare.length === 2) {
      setShowComparison(true);
      setExpanded([]);
    }
  };

  const closeComparison = () => {
    setShowComparison(false);
  };

  const getComparisonData = () => {
    const a = history.find(h => h.id === selectedForCompare[0]);
    const b = history.find(h => h.id === selectedForCompare[1]);
    return { a, b };
  };

  const renderComparisonArrow = (valA, valB) => {
    if (!valA || !valB || isNaN(valA) || isNaN(valB)) return '';
    const diff = parseFloat(valB) - parseFloat(valA);
    if (diff > 0) return <span className="arrow-up">▲ +{diff.toFixed(2)}</span>;
    if (diff < 0) return <span className="arrow-down">▼ {diff.toFixed(2)}</span>;
    return <span className="arrow-equal">= 0</span>;
  };

  const startEditing = (item, e) => {
    e.stopPropagation();
    setEditingId(item.id);
    setSelectedProps(item.linkedProperties || []);
    if (!expanded.includes(item.id)) {
      setExpanded(prev => [...prev, item.id]);
    }
  };

  const saveEditing = (id, e) => {
    e.stopPropagation();
    updateAnalysis(id, { linkedProperties: selectedProps });
    setEditingId(null);
  };

  const togglePropSelection = (id) => {
    setSelectedProps(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const getTargetLabels = (linkedIds) => {
    if (!linkedIds || linkedIds.length === 0) return [];
    return linkedIds.map(id => {
      const target = allTargets.find(t => t.id === id);
      return target ? target.label : id;
    });
  };

  return (
    <div className="history-page container animate-fade-in">
      <div className="history-header">
        <div>
          <h2>Histórico de Análises</h2>
          <p className="text-muted">Selecione duas análises para comparar a evolução do solo.</p>
        </div>
        {selectedForCompare.length === 2 && !showComparison && (
          <button className="btn btn-primary" onClick={openComparison}>
            <GitCompareArrows size={18} /> Comparar Selecionados
          </button>
        )}
        {selectedForCompare.length > 0 && !showComparison && (
          <span className="selection-info">{selectedForCompare.length}/2 selecionados</span>
        )}
      </div>

      {showComparison && (() => {
        const { a, b } = getComparisonData();
        if (!a || !b) return null;
        return (
          <div className="comparison-section animate-fade-in">
            <div className="comparison-header">
              <h3><GitCompareArrows size={20} /> Comparação de Análises</h3>
              <button className="btn-icon" onClick={closeComparison} title="Fechar Comparação">
                <X size={22} />
              </button>
            </div>

            <div className="comparison-meta">
              <div className="comparison-col-header col-a">
                <strong>{a.amostra || a.fileName || 'Análise A'}</strong>
                <span className="text-muted">{a.data || a.date}</span>
                {getTargetLabels(a.linkedProperties).map((l, i) => <span key={i} className="text-muted" style={{display:'block', fontSize:'0.75rem'}}><MapPin size={10} /> {l}</span>)}
              </div>
              <div className="comparison-col-header col-b">
                <strong>{b.amostra || b.fileName || 'Análise B'}</strong>
                <span className="text-muted">{b.data || b.date}</span>
                {getTargetLabels(b.linkedProperties).map((l, i) => <span key={i} className="text-muted" style={{display:'block', fontSize:'0.75rem'}}><MapPin size={10} /> {l}</span>)}
              </div>
            </div>

            <div className="comparison-table-container card">
              <table className="results-table comparison-table">
                <thead>
                  <tr>
                    <th>Parâmetro</th>
                    <th>Análise A</th>
                    <th>Análise B</th>
                    <th>Variação</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(parameters).map(key => {
                    const param = parameters[key];
                    if (!param) return null;
                    const valA = a.results?.[key];
                    const valB = b.results?.[key];
                    const levelA = getLevelInfo(key, valA);
                    const levelB = getLevelInfo(key, valB);

                    return (
                      <tr key={key}>
                        <td>
                          <span className="param-symbol">{param.symbol}</span> {param.name}
                          <span className="text-muted" style={{ fontSize: '0.7rem', marginLeft: '0.3rem' }}>({param.unit})</span>
                        </td>
                        <td>
                          <span className="compare-value">
                            {valA || '-'}
                            {valA && (
                              <span className="status-badge mini" style={{ backgroundColor: `${levelA.color}20`, color: levelA.color }}>
                                {levelA.name}
                              </span>
                            )}
                          </span>
                        </td>
                        <td>
                          <span className="compare-value">
                            {valB || '-'}
                            {valB && (
                              <span className="status-badge mini" style={{ backgroundColor: `${levelB.color}20`, color: levelB.color }}>
                                {levelB.name}
                              </span>
                            )}
                          </span>
                        </td>
                        <td>{renderComparisonArrow(valA, valB)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {!showComparison && history.length === 0 && (
        <div className="empty-state card">
          <Droplets size={48} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Nenhuma análise salva</h3>
          <p className="text-muted">Faça o upload de uma análise e clique em "Salvar no Histórico" para vê-la aqui.</p>
        </div>
      )}

      {!showComparison && history.length > 0 && (
        <div className="history-grid">
          {history.map((item) => {
            const isSelected = selectedForCompare.includes(item.id);
            const linkedLabels = getTargetLabels(item.linkedProperties);

            return (
              <div key={item.id} className={`history-card card ${isSelected ? 'selected' : ''}`} onClick={() => toggleExpand(item.id)}>
                <div className="history-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      className={`select-btn ${isSelected ? 'checked' : ''}`}
                      onClick={(e) => toggleSelect(item.id, e)}
                      title="Selecionar para comparar"
                    >
                      {isSelected ? <CheckSquare size={22} /> : <Square size={22} />}
                    </button>
                    <div>
                      <h3 className="history-filename">
                        <FileText size={18} />
                        {item.amostra || item.fileName || 'Análise sem nome'}
                      </h3>
                      <span className="history-date"><Calendar size={14} /> {item.data || item.date}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      className="btn-icon"
                      onClick={(e) => startEditing(item, e)}
                      title="Editar Vínculos"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="btn-icon text-danger"
                      onClick={(e) => handleDeleteClick(item.id, e)}
                      title="Excluir Análise"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button className="btn-icon">
                      {expanded.includes(item.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {confirmDelete === item.id && (
                  <div className="delete-confirm" onClick={e => e.stopPropagation()}>
                    <p>Tem certeza que deseja excluir esta análise?</p>
                    <div className="delete-actions">
                      <button className="btn-secondary btn-sm" onClick={cancel}>Cancelar</button>
                      <button className="btn-danger btn-sm" onClick={(e) => confirm(item.id, e)}>Excluir</button>
                    </div>
                  </div>
                )}

                {!expanded.includes(item.id) && (
                  <div className="history-preview">
                    <div className="preview-tags">
                      {item.proprietario && <span className="preview-tag"><User size={12} /> {item.proprietario}</span>}
                      {linkedLabels.length > 0 ? (
                         linkedLabels.map((l, i) => <span key={i} className="preview-tag" style={{backgroundColor:'rgba(46,139,87,0.1)', color:'var(--color-accent)'}}><MapPin size={12} /> {l}</span>)
                      ) : (
                         item.propriedade && <span className="preview-tag"><MapPin size={12} /> {item.propriedade}</span>
                      )}
                      {item.results?.ph_agua && <span className="preview-tag">pH: {item.results.ph_agua}</span>}
                      {item.results?.v && <span className="preview-tag">V%: {item.results.v}</span>}
                      {item.results?.p_mehlich && <span className="preview-tag">P: {item.results.p_mehlich}</span>}
                    </div>
                  </div>
                )}

                {expanded.includes(item.id) && (
                  <div className="history-details animate-fade-in" onClick={e => e.stopPropagation()}>
                    
                    {editingId === item.id ? (
                      <div className="property-selection card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--color-bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16} /> Editar Vínculo</h4>
                          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={(e) => saveEditing(item.id, e)}>
                            <Save size={14} /> Salvar Vínculo
                          </button>
                        </div>
                        <div className="prop-selection-list" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                          {allTargets.map(target => (
                            <div key={target.id} className={`prop-select-item ${selectedProps.includes(target.id) ? 'selected' : ''}`} onClick={() => togglePropSelection(target.id)} style={{ padding: '0.5rem' }}>
                              {selectedProps.includes(target.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                              <span style={{ fontSize: '0.85rem' }}>{target.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="metadata-summary">
                        {linkedLabels.length > 0 && (
                          <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                            <MapPin size={14} className="text-accent" /> 
                            <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>Vínculos: {linkedLabels.join(', ')}</span>
                          </div>
                        )}
                        {!linkedLabels.length && item.propriedade && <div className="meta-item"><MapPin size={14} /> <span>{item.propriedade}</span></div>}
                        {item.proprietario && <div className="meta-item"><User size={14} /> <span>{item.proprietario}</span></div>}
                        {item.laboratorio && <div className="meta-item"><Building size={14} /> <span>{item.laboratorio}</span></div>}
                        {item.amostra && <div className="meta-item"><Beaker size={14} /> <span>{item.amostra}</span></div>}
                      </div>
                    )}

                    <div className="results-table-container">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th>Parâmetro</th>
                            <th>Valor</th>
                            <th>Classificação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(item.results || {}).map(([key, value]) => {
                            const param = parameters[key];
                            if (!param) return null;
                            const levelInfo = getLevelInfo(key, value);

                            return (
                              <tr key={key}>
                                <td><strong>{param.name}</strong> <span className="text-muted" style={{ fontSize: '0.75rem' }}>({param.unit})</span></td>
                                <td>{value || '-'}</td>
                                <td>
                                  {value && (
                                    <span
                                      className="status-badge"
                                      style={{
                                        backgroundColor: `${levelInfo.color}20`,
                                        color: levelInfo.color,
                                      }}
                                    >
                                      {levelInfo.name}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
