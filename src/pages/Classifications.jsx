import { useState } from 'react';
import { Plus, Save, X, Trash2, Edit2, Tags } from 'lucide-react';
import { useSoil } from '../context/SoilContext';
import { BASIC_CLASSIFICATION_COLORS } from '../context/SoilContext';
import './Classifications.css';

function ColorSelect({ value, onChange, customColor, onCustomColorChange }) {
  const selectedColor = BASIC_CLASSIFICATION_COLORS.find((color) => color.value === value);
  const isCustom = Boolean(value) && !selectedColor;

  const handleCustomColorChange = (nextColor) => {
    onCustomColorChange(nextColor);
    onChange(nextColor);
  };

  return (
    <div className="color-select">
      <div className="color-options" role="group" aria-label="Cores padrão">
        {BASIC_CLASSIFICATION_COLORS.map((color) => (
          <button
            type="button"
            key={color.value}
            className={`color-option ${value === color.value ? 'active' : ''}`}
            onClick={() => onChange(color.value)}
            title={`${color.name} ${color.value}`}
          >
            <span className="color-preview" style={{ backgroundColor: color.value }} />
            <span>{color.name}</span>
          </button>
        ))}
      </div>
      <label className={`custom-color-field ${isCustom ? 'active' : ''}`}>
        <span className="color-preview" style={{ backgroundColor: customColor }} />
        <span>Outra cor</span>
        <input
          type="color"
          value={customColor}
          onChange={(e) => handleCustomColorChange(e.target.value)}
          title="Escolher outra cor"
        />
      </label>
    </div>
  );
}

export default function Classifications() {
  const { classifications, addClassification, updateClassification, removeClassification } = useSoil();
  const [form, setForm] = useState({ name: '', color: '' });
  const [formCustomColor, setFormCustomColor] = useState('#ffffff');
  const [editingId, setEditingId] = useState(null);
  const [editMode, setEditMode] = useState('update');
  const [editForm, setEditForm] = useState({ name: '', color: '' });
  const [editCustomColor, setEditCustomColor] = useState('#ffffff');

  const isDefaultClassification = (item) => item.isDefault || String(item.id).startsWith('default_');

  const handleAdd = async () => {
    if (!form.name.trim()) {
      window.alert('Favor digitar o nome da classificação.');
      return;
    }
    if (!form.color) {
      window.alert('Favor selecionar a cor da classificação.');
      return;
    }
    const saved = await addClassification(form);
    if (!saved) return;
    setForm({ name: '', color: '' });
    setFormCustomColor('#ffffff');
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditMode(isDefaultClassification(item) ? 'copy' : 'update');
    setEditForm({ name: item.name, color: item.color });
    setEditCustomColor(BASIC_CLASSIFICATION_COLORS.some((color) => color.value === item.color) ? '#ffffff' : item.color);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      window.alert('Favor digitar o nome da classificação.');
      return;
    }
    if (!editForm.color) {
      window.alert('Favor selecionar a cor da classificação.');
      return;
    }
    if (!window.confirm('Deseja realmente editar esta classificação?')) return;
    const saved = editMode === 'copy'
      ? await addClassification(editForm)
      : await updateClassification(editingId, editForm);
    if (!saved) return;
    setEditingId(null);
    setEditMode('update');
  };

  const handleRemove = async (item) => {
    if (isDefaultClassification(item)) {
      window.alert('Classificações padrão não podem ser excluídas. Crie uma classificação própria para editar ou excluir depois.');
      return;
    }
    if (!window.confirm('Deseja realmente excluir esta classificação? Parâmetros que usam esta classificação podem impedir a exclusão.')) return;
    await removeClassification(item.id);
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
            <ColorSelect
              value={form.color}
              onChange={(color) => setForm({ ...form, color })}
              customColor={formCustomColor}
              onCustomColorChange={setFormCustomColor}
            />
          </div>
          <button className="btn btn-primary add-classification-btn" onClick={handleAdd}>
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </div>

      <div className="classification-list">
        {classifications.map((item) => (
          <div key={item.id} className="classification-item card">
            {editingId === item.id ? (
              <div className="classification-edit-grid">
                <div className="input-group">
                  <label>Nome</label>
                  <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Cor</label>
                  <ColorSelect
                    value={editForm.color}
                    onChange={(color) => setEditForm({ ...editForm, color })}
                    customColor={editCustomColor}
                    onCustomColorChange={setEditCustomColor}
                  />
                </div>
                <div className="classification-edit-actions">
                  <button className="btn-secondary btn-sm" onClick={() => setEditingId(null)}><X size={14} /> Cancelar</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}><Save size={14} /> Salvar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="classification-info">
                  <span className="classification-dot" style={{ backgroundColor: item.color }} />
                  <div>
                    <strong>{item.name}</strong>
                    {isDefaultClassification(item) && <span className="default-badge">Padrão</span>}
                  </div>
                </div>
                <div className="classification-actions">
                  <button className="btn-icon" onClick={() => startEdit(item)} title="Editar classificação"><Edit2 size={16} /></button>
                  <button className="btn-icon text-danger" onClick={() => handleRemove(item)} title={isDefaultClassification(item) ? 'Classificação padrão não pode ser excluída' : 'Excluir classificação'}><Trash2 size={16} /></button>
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
