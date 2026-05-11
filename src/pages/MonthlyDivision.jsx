import React, { useEffect, useState } from 'react';
import { Save, AlertCircle, CalendarDays } from 'lucide-react';
import { useSoil } from '../context/SoilContext';
import './Settings.css';

export default function MonthlyDivision() {
  const { fertilizationMonths, setFertilizationMonths } = useSoil();
  const [selectedMonths, setSelectedMonths] = useState(fertilizationMonths || {});
  const [saved, setSaved] = useState(false);

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

  useEffect(() => {
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

  const handleSave = () => {
    if (!isValidPercentage) {
      alert('A soma das porcentagens precisa fechar em 100% antes de salvar.');
      return;
    }
    if (!window.confirm('Deseja realmente salvar a Divisão Mensal Global?')) return;
    setFertilizationMonths(selectedMonths);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-page container animate-fade-in">
      <div className="settings-header">
        <div>
          <h2><CalendarDays size={24} /> Divisão Mensal Global</h2>
          <p className="text-muted">Defina os meses de aplicação da fazenda. Esta configuração será aplicada automaticamente na tela de Planejamento Safra.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={18} /> Salvar Divisão
        </button>
      </div>

      {saved && (
        <div className="alert success">
          <AlertCircle size={18} /> Divisão mensal salva no banco com sucesso!
        </div>
      )}

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>Meses de Adubação</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Marque os meses e informe o percentual de aplicação. A soma deve ser exatamente 100%.
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
                  <input type="checkbox" checked={isSelected} onChange={() => toggleMonth(month.id)} />
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
    </div>
  );
}
