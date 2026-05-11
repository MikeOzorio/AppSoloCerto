import React, { useState } from 'react';
import { useSoil } from '../context/SoilContext';
import { Plus, Trash2, Edit2, Save, X, Target, PlusCircle } from 'lucide-react';
import './Recommendations.css';

export default function Recommendations() {
  const { recommendations, addRecommendation, updateRecommendation, removeRecommendation } = useSoil();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formName, setFormName] = useState('');
  const [formNutrients, setFormNutrients] = useState([{ name: 'N', value: '' }, { name: 'P2O5', value: '' }, { name: 'K2O', value: '' }]);

  const startNew = () => {
    setFormName('');
    setFormNutrients([{ name: 'N', value: '' }, { name: 'P2O5', value: '' }, { name: 'K2O', value: '' }]);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (rec) => {
    setFormName(rec.name);
    const nutArr = Object.entries(rec.nutrients).map(([k, v]) => ({ name: k, value: v }));
    setFormNutrients(nutArr.length > 0 ? nutArr : [{ name: '', value: '' }]);
    setEditingId(rec.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const updateNutrient = (index, field, val) => {
    const newNut = [...formNutrients];
    newNut[index][field] = val;
    setFormNutrients(newNut);
  };

  const addNutrientField = () => {
    setFormNutrients([...formNutrients, { name: '', value: '' }]);
  };

  const removeNutrientField = (index) => {
    setFormNutrients(formNutrients.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    
    // Convert array to object
    const nutObj = {};
    formNutrients.forEach(n => {
      if (n.name.trim() && n.value !== '') {
        nutObj[n.name.trim()] = Number(n.value);
      }
    });

    if (editingId) {
      if (!window.confirm('Deseja realmente editar esta faixa de produtividade?')) return;
      updateRecommendation(editingId, { name: formName, nutrients: nutObj });
    } else {
      addRecommendation({ id: Date.now().toString(), name: formName, nutrients: nutObj });
    }
    setShowForm(false);
  };

  return (
    <div className="recommendations-page container animate-fade-in">
      <div className="rec-header">
        <div>
          <h2>Tabelas de Produtividade</h2>
          <p className="text-muted">Cadastre as faixas de produtividade esperada e a exigência de nutrientes para cada uma.</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={startNew}>
            <Plus size={18} /> Nova Faixa
          </button>
        )}
      </div>

      {showForm && (
        <div className="rec-form-card card animate-fade-in">
          <h3>{editingId ? 'Editar Faixa de Produtividade' : 'Nova Faixa de Produtividade'}</h3>
          
          <div className="input-group" style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
            <label>Nome da Faixa (Ex: 31 - 50 sacas/ha)</label>
            <input 
              type="text" 
              className="input" 
              value={formName} 
              onChange={e => setFormName(e.target.value)} 
              placeholder="Ex: 31 - 50 sacas/ha"
            />
          </div>

          <div className="nutrients-setup">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Exigência de Nutrientes (kg/ha)</label>
            <div className="nutrients-grid">
              {formNutrients.map((nut, idx) => (
                <div key={idx} className="nutrient-row">
                  <input 
                    type="text" 
                    className="input nut-name" 
                    placeholder="Nutriente (N)" 
                    value={nut.name}
                    onChange={e => updateNutrient(idx, 'name', e.target.value)}
                  />
                  <input 
                    type="number" 
                    className="input nut-val" 
                    placeholder="Qtd (kg/ha)" 
                    value={nut.value}
                    onChange={e => updateNutrient(idx, 'value', e.target.value)}
                  />
                  <button className="btn-icon text-danger" onClick={() => removeNutrientField(idx)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button className="btn-text btn-add-nut" onClick={addNutrientField}>
              <PlusCircle size={16} /> Adicionar Nutriente
            </button>
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={cancelForm}><X size={18} /> Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!formName.trim()}>
              <Save size={18} /> Salvar Faixa
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="rec-list">
          {recommendations.map(rec => (
            <div key={rec.id} className="rec-card card">
              <div className="rec-card-header">
                <h3 className="rec-title"><Target size={20} className="text-primary" /> {rec.name}</h3>
                <div className="rec-actions">
                  <button className="btn-icon" onClick={() => startEdit(rec)}><Edit2 size={18} /></button>
                  <button className="btn-icon text-danger" onClick={() => { if (window.confirm('Deseja realmente excluir esta faixa de produtividade?')) removeRecommendation(rec.id); }}><Trash2 size={18} /></button>
                </div>
              </div>
              <div className="rec-nutrients">
                {Object.keys(rec.nutrients).length === 0 && <span className="text-muted">Nenhum nutriente cadastrado.</span>}
                {Object.entries(rec.nutrients).map(([k, v]) => (
                  <div key={k} className="rec-badge">
                    <strong>{k}</strong>
                    <span>{v} kg/ha</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {recommendations.length === 0 && (
            <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
              Nenhuma faixa de produtividade cadastrada.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
