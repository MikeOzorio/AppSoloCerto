import React, { useState } from 'react';
import { Plus, Save, X, Trash2, Edit2, Tags } from 'lucide-react';
import { useSoil } from '../context/SoilContext';
import { BASIC_CLASSIFICATION_COLORS } from '../context/SoilContext';
import './Classifications.css';

export default function Classifications() {
  const { classifications, addClassification, updateClassification, removeClassification } = useSoil();
  const [form, setForm] = useState({ name: '', color: '#22c55e' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', color: '#22c55e' });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await addClassification(form);
    setForm({ name: '', color: '#22c55e' });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, color: item.color });
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) return;
    if (!window.confirm('Deseja realmente editar esta classificação?')) return;
    await updateClassification(editingId, editForm);
    setEditingId(null);
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta classificação? Parâmetros que usam esta classificação podem impedir a exclusão.')) return;
    await removeClassification(id);
  };

  return (
    <div className="classifications-page container animate-fade-in">
      <div className="classifications-header">
        <div>
          <h2>Classificações de Nutrientes</h2>
          <p className="text-muted">Cadastre classes como Muito Alto, Baixo, Médio, Neutro, Alcalino e outras. Essas opções aparecem em Parâmetros da Análise.</p>
        </div>
      </div>

      <div className="card classification-form-card">
        <h3><Plus size={18} /> Nova Classificação</h3>
        <div className="classification-form-grid">
          <div className="input-group">
            <label>Nome</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Baixo, Adequado, Alcalino" />
          </div>
          <div className="input-group">
            <label>Cor</label>
            <select className="input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
              {BASIC_CLASSIFICATION_COLORS.map((color) => (
                <option key={color.value} value={color.value}>{color.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary add-classification-btn" onClick={handleAdd} disabled={!form.name.trim()}>
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </div>

      <div className="classification-list">
        {classifications.map((item) => (
          <div key={item.id} className="classification-item card">
            {editingId === item.id ? (
              <div className="classification-edit-grid">
                <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <select className="input" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}>
                  {BASIC_CLASSIFICATION_COLORS.map((color) => (
                    <option key={color.value} value={color.value}>{color.name}</option>
                  ))}
                </select>
                <button className="btn-secondary btn-sm" onClick={() => setEditingId(null)}><X size={14} /> Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}><Save size={14} /> Salvar</button>
              </div>
            ) : (
              <>
                <div className="classification-info">
                  <span className="classification-dot" style={{ backgroundColor: item.color }} />
                  <div>
                    <strong>{item.name}</strong>
                    {item.isDefault && <span className="default-badge">Padrão</span>}
                  </div>
                </div>
                <div className="classification-actions">
                  <button className="btn-icon" onClick={() => startEdit(item)} title="Editar classificação"><Edit2 size={16} /></button>
                  <button className="btn-icon text-danger" onClick={() => handleRemove(item.id)} title="Excluir classificação"><Trash2 size={16} /></button>
                </div>
              </>
            )}
          </div>
        ))}
        {classifications.length === 0 && <p className="text-muted empty-state"><Tags size={20} /> Nenhuma classificação cadastrada.</p>}
      </div>
    </div>
  );
}
