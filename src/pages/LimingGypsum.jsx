import { useMemo, useState } from 'react';
import { CheckCircle2, Droplets, Info, Save, Target } from 'lucide-react';
import { useSoil } from '../context/SoilContext';
import { DEFAULT_LIMING_GYPSUM_VALUES } from '../constants/limingGypsum';
import './LimingGypsum.css';

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateLiming = ({ v1, v2, ctc, prnt }) => {
  const currentSaturation = parseNumber(v1);
  const targetSaturation = parseNumber(v2);
  const ctcValue = parseNumber(ctc);
  const prntValue = parseNumber(prnt);

  if (
    currentSaturation === null ||
    targetSaturation === null ||
    ctcValue === null ||
    prntValue === null ||
    prntValue === 0
  ) {
    return null;
  }

  const result = ((targetSaturation - currentSaturation) * ctcValue) / prntValue;
  return Math.max(0, result).toFixed(2);
};

const calculateGypsum = ({ ca, mg, k, al }) => {
  const currentCalcium = parseNumber(ca);
  const magnesium = parseNumber(mg);
  const potassium = parseNumber(k);
  const aluminum = parseNumber(al);

  if (
    currentCalcium === null ||
    magnesium === null ||
    potassium === null ||
    aluminum === null
  ) {
    return null;
  }

  const effectiveCtc = currentCalcium + magnesium + potassium + aluminum;
  const result = ((currentCalcium * effectiveCtc) - currentCalcium) * 2.5;

  return result.toFixed(2);
};

export default function LimingGypsum() {
  const { limingGypsumValues, saveLimingGypsumValues } = useSoil();
  const [draftValues, setDraftValues] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const storedValues = useMemo(() => ({
    ...DEFAULT_LIMING_GYPSUM_VALUES,
    ...(limingGypsumValues || {})
  }), [limingGypsumValues]);

  const values = draftValues || storedValues;

  const nc = useMemo(() => calculateLiming(values), [values]);
  const ng = useMemo(() => calculateGypsum(values), [values]);

  const effectiveCtc = useMemo(() => {
    const currentCalcium = parseNumber(values.ca);
    const magnesium = parseNumber(values.mg);
    const potassium = parseNumber(values.k);
    const aluminum = parseNumber(values.al);

    if (
      currentCalcium === null ||
      magnesium === null ||
      potassium === null ||
      aluminum === null
    ) {
      return null;
    }

    return (currentCalcium + magnesium + potassium + aluminum).toFixed(2);
  }, [values]);

  const handleChange = (field) => (event) => {
    const nextValue = event.target.value;
    setDraftValues((current) => ({
      ...(current || values),
      [field]: nextValue
    }));
    setSaved(false);
  };

  const saveValues = async () => {
    setSaving(true);
    setSaved(false);
    const success = await saveLimingGypsumValues(values);
    setSaving(false);

    if (success) {
      setDraftValues(null);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="liming-page container animate-fade-in">
      <div className="liming-header">
        <div>
          <h2>Calagem e Gessagem</h2>
          <p className="text-muted">
            Calculadora para corre&ccedil;&atilde;o do solo, com os &uacute;ltimos valores salvos.
          </p>
        </div>

        <div className="liming-save-area">
          <button type="button" className="btn btn-primary liming-save-btn" onClick={saveValues} disabled={saving}>
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar valores'}
          </button>

          {saved && (
            <div className="liming-save-feedback">
              <CheckCircle2 size={15} /> Valores salvos no banco
            </div>
          )}
        </div>
      </div>

      <div className="calculators-grid">
        <div className="calculator-card card">
          <div className="calc-header">
            <Target size={24} className="text-primary" />
            <h3>Necessidade de Calagem (NC)</h3>
          </div>
          <p className="calc-desc text-muted">
            M&eacute;todo de Satura&ccedil;&atilde;o por Bases: NC (t/ha) = (V2 - V1) x CTC / PRNT.
          </p>

          <div className="calc-form">
            <div className="input-group">
              <label>V1 - Satura&ccedil;&atilde;o de Bases Atual (%)</label>
              <input
                type="number"
                className="input"
                value={values.v1}
                onChange={handleChange('v1')}
                placeholder="Ex: 40"
              />
            </div>

            <div className="input-group">
              <label>V2 - Satura&ccedil;&atilde;o de Bases Desejada (%)</label>
              <input
                type="number"
                className="input"
                value={values.v2}
                onChange={handleChange('v2')}
                placeholder="Ex: 60"
              />
            </div>

            <div className="input-group">
              <label>CTC a pH 7,0 (cmolc/dm&sup3;)</label>
              <input
                type="number"
                className="input"
                value={values.ctc}
                onChange={handleChange('ctc')}
                placeholder="Ex: 8.5"
              />
            </div>

            <div className="input-group">
              <label>PRNT do Calc&aacute;rio (%)</label>
              <input
                type="number"
                className="input"
                value={values.prnt}
                onChange={handleChange('prnt')}
                placeholder="Ex: 100"
              />
            </div>

            {nc !== null && (
              <div className="calc-result">
                <h4>Resultado:</h4>
                <div className="result-value">{nc} <span className="unit">t/ha</span></div>
              </div>
            )}
          </div>
        </div>

        <div className="calculator-card card">
          <div className="calc-header">
            <Droplets size={24} className="text-accent" />
            <h3>Necessidade de Gessagem (NG)</h3>
          </div>
          <p className="calc-desc text-muted">
            F&oacute;rmula: NG = ((Ca x (Ca + Mg + K + Al)) - Ca) x 2,5.
          </p>

          <div className="calc-form">
            <div className="input-row">
              <div className="input-group">
                <label>Ca atual (cmolc/dm&sup3;)</label>
                <input
                  type="number"
                  className="input"
                  value={values.ca}
                  onChange={handleChange('ca')}
                  placeholder="Ex: 1.2"
                />
              </div>

              <div className="input-group">
                <label>Mg (cmolc/dm&sup3;)</label>
                <input
                  type="number"
                  className="input"
                  value={values.mg}
                  onChange={handleChange('mg')}
                  placeholder="Ex: 0.5"
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>K (cmolc/dm&sup3;)</label>
                <input
                  type="number"
                  className="input"
                  value={values.k}
                  onChange={handleChange('k')}
                  placeholder="Ex: 0.15"
                />
              </div>

              <div className="input-group">
                <label>Al (cmolc/dm&sup3;)</label>
                <input
                  type="number"
                  className="input"
                  value={values.al}
                  onChange={handleChange('al')}
                  placeholder="Ex: 0.3"
                />
              </div>
            </div>

            {ng !== null && (
              <div className="calc-result gypsum-result">
                <h4>Resultado:</h4>
                <div className="result-value">{ng} <span className="unit">t/ha</span></div>
                {effectiveCtc !== null && (
                  <p className="info-text">
                    <Info size={14} />
                    Soma Ca+Mg+K+Al: {effectiveCtc} cmolc/dm&sup3;.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
