import React, { useState } from 'react';
import { useSoil } from '../context/SoilContext';
import { Plus, Trash2, Leaf, Edit2, Save, X } from 'lucide-react';
import './Clones.css';

export default function Clones() {
  const { clones, addClone, updateClone, removeClone } = useSoil();
  const [newName, setNewName] = useState('');
  const [newOrigin, setNewOrigin] = useState('ES');
  const [newDescription, setNewDescription] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', origin: '', description: '' });

  const handleAdd = () => {
    if (!newName.trim()) return;
    addClone({ id: Date.now().toString(), name: newName.trim(), origin: newOrigin, description: newDescription.trim() });
    setNewName(''); setNewDescription('');
  };

  const startEdit = (clone) => {
    setEditingId(clone.id);
    setEditForm({ name: clone.name, origin: clone.origin, description: clone.description || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', origin: '', description: '' });
  };

  const saveEdit = () => {
    if (!editForm.name.trim()) return;
    updateClone(editingId, editForm);
    setEditingId(null);
  };

  const filtered = filter === 'all' ? clones : clones.filter(c => c.origin === filter);

  return (
    <div className="clones-page container animate-fade-in">
      <div className="clones-header">
        <div>
          <h2>Cadastro de Clones</h2>
          <p className="text-muted">Gerencie os clones de Café Conilon disponíveis para cadastro nos talhões.</p>
        </div>
      </div>

      <div className="add-clone-form card">
        <h3><Plus size={18} /> Novo Clone</h3>
        <div className="clone-form-grid">
          <div className="input-group">
            <label>Nome do Clone</label>
            <input type="text" className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Vitória Incaper 8142" />
          </div>
          <div className="input-group">
            <label>Origem / Estado</label>
            <select className="input" value={newOrigin} onChange={e => setNewOrigin(e.target.value)}>
              <option value="ES">Espírito Santo (ES)</option>
              <option value="RO">Rondônia (RO)</option>
              <option value="BA">Bahia (BA)</option>
              <option value="MG">Minas Gerais (MG)</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div className="input-group">
            <label>Descrição (opcional)</label>
            <input type="text" className="input" value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Ex: Alta produtividade, tolerante à seca" />
          </div>
          <button className="btn btn-primary add-clone-btn" onClick={handleAdd} disabled={!newName.trim()}>
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </div>

      <div className="clone-filters">
        <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos ({clones.length})</button>
        <button className={`tab-btn ${filter === 'ES' ? 'active' : ''}`} onClick={() => setFilter('ES')}>ES ({clones.filter(c=>c.origin==='ES').length})</button>
        <button className={`tab-btn ${filter === 'RO' ? 'active' : ''}`} onClick={() => setFilter('RO')}>RO ({clones.filter(c=>c.origin==='RO').length})</button>
      </div>

      <div className="clones-list">
        {filtered.map(clone => (
          <div key={clone.id} className="clone-item card">
            {editingId === clone.id ? (
              <div className="clone-edit-form">
                <div className="clone-edit-row">
                  <input type="text" className="input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Nome" />
                  <select className="input" value={editForm.origin} onChange={e => setEditForm({...editForm, origin: e.target.value})} style={{maxWidth:'140px'}}>
                    <option value="ES">ES</option>
                    <option value="RO">RO</option>
                    <option value="BA">BA</option>
                    <option value="MG">MG</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <input type="text" className="input" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Descrição" style={{marginTop:'0.5rem'}} />
                <div className="clone-edit-actions">
                  <button className="btn-secondary btn-sm" onClick={cancelEdit}><X size={14} /> Cancelar</button>
                  <button className="btn btn-primary btn-sm" onClick={saveEdit}><Save size={14} /> Salvar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="clone-info">
                  <Leaf size={18} className="clone-icon" />
                  <div>
                    <strong>{clone.name}</strong>
                    <span className="clone-origin">{clone.origin}</span>
                    {clone.description && <p className="clone-desc text-muted">{clone.description}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-icon" onClick={() => startEdit(clone)} title="Editar Clone"><Edit2 size={16} /></button>
                  <button className="btn-icon text-danger" onClick={() => removeClone(clone.id)} title="Excluir Clone"><Trash2 size={16} /></button>
                </div>
              </>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>Nenhum clone encontrado.</p>}
      </div>
    </div>
  );
}
