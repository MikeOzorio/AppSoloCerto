import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, AlertCircle, Edit2, Save, History, Building, User, Calendar, MapPin, Beaker, CheckSquare, Square, ListChecks } from 'lucide-react';
import { useSoil } from '../context/SoilContext';
import { extractTextFromPDF, parseSoilData } from '../utils/pdfParser';
import './Analysis.css';

export default function Analysis() {
  const { parameters, getLevelInfo, saveAnalysis, properties } = useSoil();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [results, setResults] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedProps, setSelectedProps] = useState([]);
  const [showPropError, setShowPropError] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Por favor, selecione um arquivo PDF válido.');
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setError('');
    setResults(null);
    setMetadata(null);
    setSavedSuccess(false);

    try {
      const text = await extractTextFromPDF(file);
      const parsedData = parseSoilData(text);
      
      setEditValues(parsedData.results);
      setResults(parsedData.results);
      setMetadata({
        fileName: file.name,
        ...parsedData.metadata
      });
    } catch (err) {
      console.error('Detalhes do erro do PDF:', err);
      setError('Erro ao ler o PDF. Certifique-se de que é um PDF de texto e não uma imagem escaneada.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current.click();
  };

  const handleEdit = (key) => {
    setEditing(key);
  };

  const handleSaveEdit = (key) => {
    setResults(prev => ({
      ...prev,
      [key]: editValues[key]
    }));
    setEditing(null);
  };

  const handleMetadataChange = (field, value) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Flatten all property + talhão combos for selection
  const allTargets = [];
  properties.forEach(prop => {
    allTargets.push({ type: 'property', id: prop.id, label: prop.name });
    (prop.talhoes || []).forEach(t => {
      allTargets.push({ type: 'talhao', id: `${prop.id}__${t.id}`, label: `${prop.name} › ${t.name || 'Talhão'}` });
    });
  });

  const togglePropSelection = (id) => {
    setSelectedProps(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    setShowPropError(false);
  };

  const selectAllProps = () => {
    if (selectedProps.length === allTargets.length) {
      setSelectedProps([]);
    } else {
      setSelectedProps(allTargets.map(t => t.id));
    }
    setShowPropError(false);
  };

  const handleSaveToHistory = () => {
    if (allTargets.length > 0 && selectedProps.length === 0) {
      setShowPropError(true);
      return;
    }
    const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const metaToSave = {
      ...metadata,
      data: metadata.data || dataAtual,
      linkedProperties: selectedProps
    };
    
    saveAnalysis(metaToSave, results);
    setSavedSuccess(true);
    setTimeout(() => {
      navigate('/history');
    }, 1500);
  };

  return (
    <div className="analysis-page container animate-fade-in">
      <div className="analysis-header">
        <h2>Leitura de Análise de Solo</h2>
        <p className="text-muted">Faça o upload do seu laudo em PDF para extração e classificação automática.</p>
      </div>

      <div className="upload-section card">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="application/pdf" 
          style={{ display: 'none' }}
        />
        <div className="upload-dropzone" onClick={handleTriggerUpload}>
          <Upload size={48} className="upload-icon" />
          <h3>Clique para selecionar seu PDF</h3>
          <p>ou arraste o arquivo até aqui</p>
          {fileName && <p className="file-name"><FileText size={16} /> {fileName}</p>}
        </div>
        
        {loading && <div className="loading-spinner">Lendo arquivo...</div>}
        {error && <div className="error-message"><AlertCircle size={18} /> {error}</div>}
      </div>

      {results && metadata && (
        <div className="results-section animate-fade-in">
          
          <div className="metadata-section card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} className="text-primary" /> Informações da Amostra
            </h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>Confirme ou preencha as informações abaixo antes de salvar no histórico.</p>
            
            <div className="metadata-grid">
              <div className="input-group">
                <label><Building size={14} /> Laboratório</label>
                <input type="text" className="input" value={metadata.laboratorio} onChange={(e) => handleMetadataChange('laboratorio', e.target.value)} />
              </div>
              <div className="input-group">
                <label><User size={14} /> Proprietário / Cliente</label>
                <input type="text" className="input" value={metadata.proprietario} onChange={(e) => handleMetadataChange('proprietario', e.target.value)} />
              </div>
              <div className="input-group">
                <label><MapPin size={14} /> Propriedade / Fazenda</label>
                <input type="text" className="input" value={metadata.propriedade} onChange={(e) => handleMetadataChange('propriedade', e.target.value)} />
              </div>
              <div className="input-group">
                <label><Beaker size={14} /> Identificação da Amostra</label>
                <input type="text" className="input" value={metadata.amostra} onChange={(e) => handleMetadataChange('amostra', e.target.value)} />
              </div>
              <div className="input-group">
                <label><Calendar size={14} /> Data da Análise</label>
                <input type="text" className="input" placeholder="DD/MM/AAAA" value={metadata.data} onChange={(e) => handleMetadataChange('data', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Seleção de Propriedade/Talhão */}
          {allTargets.length > 0 && (
            <div className="property-selection card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ListChecks size={20} className="text-primary" /> Vincular a Propriedade / Talhão
                </h3>
                <button className="btn-secondary btn-sm" onClick={selectAllProps}>
                  {selectedProps.length === allTargets.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>
              <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>Selecione a qual propriedade ou talhão esta análise pertence. <strong>Obrigatório.</strong></p>
              {showPropError && (
                <div className="login-error" style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={16} /> Selecione pelo menos uma propriedade ou talhão.
                </div>
              )}
              <div className="prop-selection-list">
                {allTargets.map(target => (
                  <div key={target.id} className={`prop-select-item ${selectedProps.includes(target.id) ? 'selected' : ''}`} onClick={() => togglePropSelection(target.id)}>
                    {selectedProps.includes(target.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    <span>{target.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3>Resultados Extraídos</h3>
              <p>Verifique os valores lidos. Clique no lápis para corrigir se necessário.</p>
            </div>
            {!savedSuccess ? (
              <button className="btn btn-primary" onClick={handleSaveToHistory}>
                <History size={18} /> Salvar no Histórico
              </button>
            ) : (
              <div className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                <CheckCircle2 size={18} /> Salvo! Redirecionando...
              </div>
            )}
          </div>

          <div className="results-table-container card" style={{ marginTop: '1.5rem' }}>
            <table className="results-table">
              <thead>
                <tr>
                  <th>Símbolo</th>
                  <th>Parâmetro</th>
                  <th>Valor Lido</th>
                  <th>Unidade</th>
                  <th>Classificação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(results).map(([key, value]) => {
                  const param = parameters[key];
                  if (!param) return null;
                  
                  const levelInfo = getLevelInfo(key, value);
                  const isEditing = editing === key;

                  return (
                    <tr key={key}>
                      <td><span className="param-symbol">{param.symbol}</span></td>
                      <td><strong>{param.name}</strong></td>
                      <td>
                        {isEditing ? (
                          <input 
                            type="number" 
                            step="0.1"
                            className="input small-input" 
                            value={editValues[key] || ''}
                            onChange={(e) => setEditValues(prev => ({...prev, [key]: e.target.value}))}
                            autoFocus
                          />
                        ) : (
                          <span className={!value ? 'text-muted' : ''}>
                            {value ? value : 'N/D'}
                          </span>
                        )}
                      </td>
                      <td className="text-muted">{param.unit}</td>
                      <td>
                        {value && (
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: levelInfo.color === 'var(--color-text-muted)' ? 'transparent' : `${levelInfo.color}20`,
                              color: levelInfo.color,
                              borderColor: levelInfo.color === 'var(--color-text-muted)' ? 'var(--color-border)' : `${levelInfo.color}50`
                            }}
                          >
                            {levelInfo.name}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <button className="btn-icon text-success" onClick={() => handleSaveEdit(key)}>
                            <Save size={18} />
                          </button>
                        ) : (
                          <button className="btn-icon" onClick={() => handleEdit(key)}>
                            <Edit2 size={18} />
                          </button>
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
}
