import React, { useState } from 'react';
import { useSoil } from '../context/SoilContext';
import { Plus, Trash2, MapPin, Calendar, Ruler, Leaf, ChevronDown, ChevronUp, Edit2, Save, X } from 'lucide-react';
import './Properties.css';

export default function Properties() {
  const { properties, clones, addProperty, updateProperty, removeProperty } = useSoil();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const emptyForm = {
    name: '',
    area: '',
    talhoes: []
  };
  const [form, setForm] = useState(emptyForm);

  const emptyTalhao = {
    id: '',
    name: '',
    area: '',
    dataPlantio: '',
    clones: [] // [{cloneId, quantidade}]
  };

  const handleAddTalhao = () => {
    setForm(prev => ({
      ...prev,
      talhoes: [...prev.talhoes, { ...emptyTalhao, id: Date.now().toString() }]
    }));
  };

  const handleRemoveTalhao = (talhaoId) => {
    setForm(prev => ({
      ...prev,
      talhoes: prev.talhoes.filter(t => t.id !== talhaoId)
    }));
  };

  const handleTalhaoChange = (talhaoId, field, value) => {
    setForm(prev => ({
      ...prev,
      talhoes: prev.talhoes.map(t => t.id === talhaoId ? { ...t, [field]: value } : t)
    }));
  };

  const handleAddCloneToTalhao = (talhaoId) => {
    setForm(prev => ({
      ...prev,
      talhoes: prev.talhoes.map(t => {
        if (t.id !== talhaoId) return t;
        return {
          ...t,
          clones: [...t.clones, { cloneId: '', quantidade: '' }]
        };
      })
    }));
  };

  const handleRemoveCloneFromTalhao = (talhaoId, index) => {
    setForm(prev => ({
      ...prev,
      talhoes: prev.talhoes.map(t => {
        if (t.id !== talhaoId) return t;
        const newClones = [...t.clones];
        newClones.splice(index, 1);
        return { ...t, clones: newClones };
      })
    }));
  };

  const handleCloneChange = (talhaoId, index, field, value) => {
    setForm(prev => ({
      ...prev,
      talhoes: prev.talhoes.map(t => {
        if (t.id !== talhaoId) return t;
        const newClones = [...t.clones];
        newClones[index] = { ...newClones[index], [field]: value };
        return { ...t, clones: newClones };
      })
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateProperty(editingId, form);
    } else {
      addProperty({
        id: Date.now().toString(),
        ...form
      });
    }
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (prop) => {
    setForm({ name: prop.name, area: prop.area, talhoes: prop.talhoes || [] });
    setEditingId(prop.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const getCloneName = (cloneId) => {
    const c = clones.find(cl => cl.id === cloneId);
    return c ? c.name : 'Clone desconhecido';
  };

  return (
    <div className="properties-page container animate-fade-in">
      <div className="properties-header">
        <div>
          <h2>Propriedades e Talhões</h2>
          <p className="text-muted">Cadastre suas fazendas, talhões, clones plantados e áreas.</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Nova Propriedade
          </button>
        )}
      </div>

      {/* FORMULÁRIO */}
      {showForm && (
        <div className="property-form card animate-fade-in">
          <h3>{editingId ? 'Editar Propriedade' : 'Nova Propriedade'}</h3>
          
          <div className="form-row">
            <div className="input-group">
              <label><MapPin size={14} /> Identificador / Nome</label>
              <input type="text" className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Fazenda São José" />
            </div>
            <div className="input-group">
              <label><Ruler size={14} /> Área Total (m²)</label>
              <input type="number" className="input" value={form.area} onChange={e => setForm({...form, area: e.target.value})} placeholder="50000" />
            </div>
          </div>

          <div className="talhoes-section">
            <div className="talhoes-header">
              <h4>Talhões</h4>
              <button className="btn-secondary btn-sm" onClick={handleAddTalhao}><Plus size={14} /> Adicionar Talhão</button>
            </div>

            {form.talhoes.map((talhao, tIdx) => (
              <div key={talhao.id} className="talhao-card">
                <div className="talhao-top">
                  <h5>Talhão #{tIdx + 1}</h5>
                  <button className="btn-icon text-danger" onClick={() => handleRemoveTalhao(talhao.id)}><Trash2 size={16} /></button>
                </div>
                <div className="form-row-3">
                  <div className="input-group">
                    <label>Identificador</label>
                    <input type="text" className="input" value={talhao.name} onChange={e => handleTalhaoChange(talhao.id, 'name', e.target.value)} placeholder="Ex: Talhão A - Morro" />
                  </div>
                  <div className="input-group">
                    <label>Área (m²)</label>
                    <input type="number" className="input" value={talhao.area} onChange={e => handleTalhaoChange(talhao.id, 'area', e.target.value)} placeholder="12000" />
                  </div>
                  <div className="input-group">
                    <label><Calendar size={14} /> Data de Plantio</label>
                    <input type="date" className="input" value={talhao.dataPlantio} onChange={e => handleTalhaoChange(talhao.id, 'dataPlantio', e.target.value)} />
                  </div>
                </div>

                <div className="clones-in-talhao">
                  <div className="clones-talhao-header">
                    <span><Leaf size={14} /> Clones Plantados</span>
                    <button className="btn-secondary btn-sm" onClick={() => handleAddCloneToTalhao(talhao.id)}><Plus size={12} /> Clone</button>
                  </div>
                  {talhao.clones.map((tc, cIdx) => (
                    <div key={cIdx} className="clone-row">
                      <select className="input" value={tc.cloneId} onChange={e => handleCloneChange(talhao.id, cIdx, 'cloneId', e.target.value)}>
                        <option value="">Selecione o clone...</option>
                        {clones.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.origin})</option>
                        ))}
                      </select>
                      <input type="number" className="input clone-qty" value={tc.quantidade} onChange={e => handleCloneChange(talhao.id, cIdx, 'quantidade', e.target.value)} placeholder="Qtd" />
                      <button className="btn-icon text-danger" onClick={() => handleRemoveCloneFromTalhao(talhao.id, cIdx)}><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {talhao.clones.length === 0 && <p className="text-muted" style={{fontSize:'0.8rem'}}>Nenhum clone adicionado.</p>}
                </div>
              </div>
            ))}
            {form.talhoes.length === 0 && <p className="text-muted" style={{textAlign:'center',padding:'1rem'}}>Clique em "Adicionar Talhão" para começar.</p>}
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={handleCancel}><X size={16} /> Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim()}><Save size={16} /> Salvar Propriedade</button>
          </div>
        </div>
      )}

      {/* LISTA */}
      {!showForm && properties.length === 0 && (
        <div className="empty-state card">
          <MapPin size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3>Nenhuma propriedade cadastrada</h3>
          <p className="text-muted">Cadastre sua primeira fazenda para vincular análises de solo.</p>
        </div>
      )}

      {!showForm && properties.map(prop => (
        <div key={prop.id} className="property-card card" onClick={() => setExpanded(expanded === prop.id ? null : prop.id)}>
          <div className="property-card-header">
            <div>
              <h3><MapPin size={18} /> {prop.name}</h3>
              {prop.area && <span className="text-muted">{Number(prop.area).toLocaleString('pt-BR')} m²</span>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="talhao-count">{(prop.talhoes || []).length} talhão(ões)</span>
              <button className="btn-icon" onClick={e => { e.stopPropagation(); handleEdit(prop); }}><Edit2 size={16} /></button>
              <button className="btn-icon text-danger" onClick={e => { e.stopPropagation(); removeProperty(prop.id); }}><Trash2 size={16} /></button>
              {expanded === prop.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>

          {expanded === prop.id && (
            <div className="property-details animate-fade-in" onClick={e => e.stopPropagation()}>
              {(prop.talhoes || []).map((t, idx) => (
                <div key={t.id} className="talhao-summary">
                  <strong>{t.name || `Talhão #${idx+1}`}</strong>
                  <div className="talhao-meta">
                    {t.area && <span><Ruler size={12} /> {Number(t.area).toLocaleString('pt-BR')} m²</span>}
                    {t.dataPlantio && <span><Calendar size={12} /> {t.dataPlantio}</span>}
                  </div>
                  {t.clones && t.clones.length > 0 && (
                    <div className="talhao-clones">
                      {t.clones.map((tc, ci) => (
                        <span key={ci} className="preview-tag"><Leaf size={12} /> {getCloneName(tc.cloneId)} × {tc.quantidade}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {(prop.talhoes || []).length === 0 && <p className="text-muted">Nenhum talhão cadastrado.</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
