import { useMemo, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import './UnitConverter.css';

const nutrients = [
  {
    key: 'k',
    name: 'Pot\u00e1ssio (K)',
    factor: 391
  },
  {
    key: 'ca',
    name: 'C\u00e1lcio (Ca)',
    factor: 200
  },
  {
    key: 'mg',
    name: 'Magn\u00e9sio (Mg)',
    factor: 121.5
  },
  {
    key: 'al',
    name: 'Alum\u00ednio (Al)',
    factor: 90
  }
];

const conversions = [
  {
    key: 'mg_to_cmol',
    name: 'mg/dm\u00b3 \u2192 cmol/dm\u00b3',
    label: 'mg/dm\u00b3',
    resultLabel: 'cmol/dm\u00b3',
    precision: 4,
    needsNutrient: true,
    formulaLabel: (nutrient, displayValue) => `${displayValue} / ${nutrient.factor}`,
    calculate: (value, massFactor) => value / massFactor
  },
  {
    key: 'cmol_to_mg',
    name: 'cmol/dm\u00b3 \u2192 mg/dm\u00b3',
    label: 'cmol/dm\u00b3',
    resultLabel: 'mg/dm\u00b3',
    precision: 2,
    needsNutrient: true,
    formulaLabel: (nutrient, displayValue) => `${displayValue} x ${nutrient.factor}`,
    calculate: (value, massFactor) => value * massFactor
  },
  {
    key: 'cmol_to_mmol',
    name: 'cmol/dm\u00b3 \u2192 mmol/dm\u00b3',
    label: 'cmol/dm\u00b3',
    resultLabel: 'mmol/dm\u00b3',
    precision: 3,
    formulaLabel: (_nutrient, displayValue) => `${displayValue} x 10`,
    calculate: (value) => value * 10
  },
  {
    key: 'mmol_to_cmol',
    name: 'mmol/dm\u00b3 \u2192 cmol/dm\u00b3',
    label: 'mmol/dm\u00b3',
    resultLabel: 'cmol/dm\u00b3',
    precision: 4,
    formulaLabel: (_nutrient, displayValue) => `${displayValue} / 10`,
    calculate: (value) => value / 10
  }
];

export default function UnitConverter() {
  const [value, setValue] = useState('');
  const [nutrientKey, setNutrientKey] = useState('k');
  const [conversionType, setConversionType] = useState('mg_to_cmol');

  const selectedConversion = useMemo(
    () => conversions.find((conversion) => conversion.key === conversionType) || conversions[0],
    [conversionType]
  );

  const selectedNutrient = useMemo(
    () => nutrients.find((nutrient) => nutrient.key === nutrientKey) || nutrients[0],
    [nutrientKey]
  );

  const numericValue = value.trim() === '' ? null : Number(value);
  const displayValue = Number.isFinite(numericValue) ? numericValue : 'Valor';
  const formulaText = selectedConversion.formulaLabel(selectedNutrient, displayValue);

  const calculate = () => {
    if (!Number.isFinite(numericValue)) return '-';

    if (selectedConversion.needsNutrient) {
      return selectedConversion
        .calculate(numericValue, selectedNutrient.factor)
        .toFixed(selectedConversion.precision);
    }

    return selectedConversion.calculate(numericValue).toFixed(selectedConversion.precision);
  };

  return (
    <div className="converter-page container animate-fade-in">
      <div className="converter-header">
        <div>
          <h2>{'Convers\u00e3o de Unidades'}</h2>
          <p className="text-muted">
            {'Escolha o tipo de convers\u00e3o, informe o valor e veja o resultado.'}
          </p>
        </div>
      </div>

      <div className="converter-card card">
        <div className="calc-header">
          <ArrowRightLeft size={24} className="text-primary" />
          <h3>Conversor de Unidades do Solo</h3>
        </div>

        <div className="calc-form">
          <div className="converter-controls">
            <div className="input-group">
              <label>{'Tipo de convers\u00e3o'}</label>
              <select
                className="input"
                value={conversionType}
                onChange={(event) => setConversionType(event.target.value)}
              >
                {conversions.map((conversion) => (
                  <option key={conversion.key} value={conversion.key}>{conversion.name}</option>
                ))}
              </select>
            </div>

            {selectedConversion.needsNutrient && (
              <div className="input-group">
                <label>Nutriente</label>
                <select
                  className="input"
                  value={nutrientKey}
                  onChange={(event) => setNutrientKey(event.target.value)}
                >
                  {nutrients.map((nutrient) => (
                    <option key={nutrient.key} value={nutrient.key}>{nutrient.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="converter-io">
            <div className="input-group">
              <label>Valor ({selectedConversion.label})</label>
              <input
                type="number"
                className="input converter-input"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="converter-arrow" aria-hidden="true">
              <ArrowRightLeft size={24} />
            </div>

            <div className="input-group">
              <label>Resultado ({selectedConversion.resultLabel})</label>
              <div className="converter-output-row">
                <div className="converter-result-box">
                  {calculate()}
                </div>

                <div className="converter-formula-box">
                  <span>{'C\u00e1lculo'}</span>
                  <strong>{formulaText}</strong>
                  {selectedConversion.needsNutrient && (
                    <small>
                      {`${selectedNutrient.name}: 1 cmol/dm\u00b3 = ${selectedNutrient.factor} mg/dm\u00b3`}
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
