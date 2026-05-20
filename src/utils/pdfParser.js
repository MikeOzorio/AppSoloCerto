import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// We need to set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const rows = {};
      textContent.items.forEach(item => {
        const y = Math.round(item.transform[5] / 2) * 2;
        if (!rows[y]) rows[y] = [];
        rows[y].push(item);
      });
      
      const sortedY = Object.keys(rows).sort((a, b) => b - a);
      
      for (const y of sortedY) {
        const rowItems = rows[y].sort((a, b) => a.transform[4] - b.transform[4]);
        const lineText = rowItems.map(it => it.str).join('   ');
        fullText += lineText + '\n';
      }
    }
    
    return fullText;
  } catch (error) {
    console.error("Error reading PDF:", error);
    throw new Error("Failed to read PDF file.");
  }
};

/**
 * Remove seções de referência/interpretação do texto para evitar falsos positivos.
 */
const stripReferenceSection = (text) => {
  const markers = [
    /VALORES\s+GERAIS\s+DE\s+REFER/i,
    /Refer[êe]ncias?\s+Metodol[oó]gicas/i,
    /TABELA\s+DE\s+INTERPRETA/i,
    /N[IÍ]VEIS\s+DE\s+REFER/i,
    /OBSERVA[ÇC][ÕO]ES\s+IMPORTANTES/i,
    /Extra[çc][õo]es\s+utilizadas/i,
  ];
  let cutIndex = text.length;
  for (const marker of markers) {
    const match = text.match(marker);
    if (match && match.index < cutIndex) {
      cutIndex = match.index;
    }
  }
  return text.substring(0, cutIndex);
};

// Unidades conhecidas em laudos de solo
const KNOWN_UNITS = [
  'mg/dm3', 'mg/dm³',
  'cmolc/dm3', 'cmolc/dm³', 'cmol c/dm3', 'cmol c/dm³',
  'mmolc/dm3', 'mmolc/dm³', 'mmol c/dm3', 'mmol c/dm³',
  'dag/kg', 'dag/dm3', 'dag/dm³',
  'g/kg', 'g/dm3', 'g/dm³',
  '%',
];

/**
 * Extrai a unidade de uma linha de texto de laudo.
 */
const extractUnitFromLine = (line) => {
  const lower = line.toLowerCase();
  for (const unit of KNOWN_UNITS) {
    if (lower.includes(unit.toLowerCase())) return unit;
  }
  return '';
};

/**
 * Dado um array de linhas, procura a PRIMEIRA linha que contenha um dos
 * padrões (regex) e retorna o ÚLTIMO número + a unidade encontrada.
 * Isso é crucial porque a unidade frequentemente contém números (ex: mg/dm3).
 */
const findLastNumberInLine = (lines, patterns) => {
  for (const pattern of patterns) {
    for (const line of lines) {
      if (pattern.test(line)) {
        const allNumbers = [...line.matchAll(/(\d+[,.]?\d*)/g)];
        if (allNumbers.length > 0) {
          const lastMatch = allNumbers[allNumbers.length - 1][1];
          const num = parseFloat(lastMatch.replace(',', '.'));
          const unit = extractUnitFromLine(line);
          return { value: isNaN(num) ? null : String(num), unit };
        }
      }
    }
  }
  return { value: null, unit: '' };
};

export const parseSoilData = (fullText) => {
  const metadata = {
    laboratorio: '',
    proprietario: '',
    data: '',
    amostra: '',
    propriedade: ''
  };

  const extracted = {
    ph_agua: null, ph_cacl2: null, mo: null,
    p_mehlich: null, p_resina: null, k: null,
    ca: null, mg: null, s: null,
    al: null, h_al: null,
    b: null, cu: null, fe: null, mn: null, zn: null,
    sb: null, t: null, ctc: null, v: null, m: null
  };

  // ── Metadados (usa texto completo) ──
  const findText = (regexes) => {
    for (const regex of regexes) {
      const match = fullText.match(regex);
      if (match && match[1]) return match[1].trim();
    }
    return '';
  };

  metadata.proprietario = findText([
    /CLIENTE\s*:\s*([^\n]+)/i,
    /Propriet[áa]rio\s*:\s*([^\nCPF]+)/i,
    /Produtor\s*:\s*([^\n]+)/i
  ]);

  metadata.laboratorio = findText([
    /LABORAT[ÓO]RIO\s+DE\s+AN[ÁA]LISE[^\n]+/i,
    /LABORAT[ÓO]RIO[^\n]+/i
  ]) || 'Não Identificado';
  
  if (metadata.laboratorio === 'Não Identificado' && fullText.includes('FULLIN')) {
    metadata.laboratorio = 'Fullin';
  }

  metadata.data = findText([
    /DATA DE ENTRADA\s*:\s*([\d]{2}\/[\d]{2}\/[\d]{4})/i,
    /([\d]{2}\/[\d]{2}\/[\d]{4})\s+[\d]{2}\/[\d]{2}\/[\d]{4}/i
  ]);

  metadata.amostra = findText([
    /Amostra\s+[\d]+/i,
    /\d+\/\d+\s+AMOSTRA\s+-\s+[^\n]+/i
  ]);

  metadata.propriedade = findText([
    /PROPRIEDADE\s*:\s*([^\n]+)/i,
    /Propriedade\s*:\s*([^\n]*)/i
  ]);
  if (!metadata.propriedade) metadata.propriedade = '';

  // ── Valores: usar SOMENTE a seção de resultados, linha por linha ──
  const resultsText = stripReferenceSection(fullText);
  const lines = resultsText.split('\n');

  // Cada parâmetro: lista de regex para encontrar a linha, depois pega o último número dela
  extracted.ph_agua = findLastNumberInLine(lines, [
    /pH\s*(?:em\s*)?(?:H2O|H₂O|água|\(água\))/i,
    /\bpH\b(?!\s*(?:CaCl|SMP))/i
  ]);

  extracted.ph_cacl2 = findLastNumberInLine(lines, [
    /pH\s*(?:em\s*)?CaCl/i
  ]);

  extracted.mo = findLastNumberInLine(lines, [
    /Mat[ée]ria\s+Org[âa]nica/i,
    /\bM\.?O\.?\b/i
  ]);

  extracted.p_mehlich = findLastNumberInLine(lines, [
    /F[óo]sforo\s+Mehlich/i,
    /P\s*\(\s*Mehlich/i,
    /F[óo]sforo(?!\s*(?:Resina|reman))/i,
  ]);

  extracted.p_resina = findLastNumberInLine(lines, [
    /F[óo]sforo\s+Resina/i,
    /P\s*\(?\s*Resina/i
  ]);

  extracted.k = findLastNumberInLine(lines, [
    /Pot[áa]ssio/i,
    /\bK\s*\(\s*Mehlich/i,
  ]);

  extracted.ca = findLastNumberInLine(lines, [
    /C[áa]lcio/i,
    /\bCa\s*\(/i,
  ]);

  extracted.mg = findLastNumberInLine(lines, [
    /Magn[ée]sio/i,
    /\bMg\s*\(/i,
  ]);

  extracted.al = findLastNumberInLine(lines, [
    /Alum[ií]nio(?!\s*\(m)/i,
    /Acidez\s+Troc[áa]vel/i,
    /\bAl\s*\(\s*KCl/i,
  ]);

  extracted.h_al = findLastNumberInLine(lines, [
    /H\s*\+\s*Al/i,
    /Acidez\s+Potencial/i,
  ]);

  extracted.s = findLastNumberInLine(lines, [
    /Enxofre/i,
    /S-SO4/i,
    /\bS\s*\(\s*Fosfato/i,
  ]);

  extracted.b = findLastNumberInLine(lines, [
    /\bBoro\b/i,
    /\bB\s*\(\s*[Áá]gua/i,
  ]);

  extracted.cu = findLastNumberInLine(lines, [
    /\bCobre\b/i,
    /\bCu\s*\(/i,
  ]);

  extracted.fe = findLastNumberInLine(lines, [
    /\bFerro\b/i,
    /\bFe\s*\(/i,
  ]);

  extracted.mn = findLastNumberInLine(lines, [
    /Mangan[êe]s/i,
    /\bMn\s*\(/i,
  ]);

  extracted.zn = findLastNumberInLine(lines, [
    /\bZinco\b/i,
    /\bZn\s*\(/i,
  ]);

  extracted.sb = findLastNumberInLine(lines, [
    /Soma\s+de\s+Bases/i,
    /\bS\.?B\.?\s*\(/i,
  ]);

  extracted.t = findLastNumberInLine(lines, [
    /CTC\s+[Ee]fetiva/i,
  ]);

  extracted.ctc = findLastNumberInLine(lines, [
    /CTC\s+(?:a\s+)?pH\s*7/i,
    /CTC\s+Total/i,
  ]);

  extracted.v = findLastNumberInLine(lines, [
    /Satura[çc][ãa]o\s+(?:de|por)\s+[Bb]ases/i,
    /Sat\.\s+(?:de|por)\s+[Bb]ases/i,
  ]);

  extracted.m = findLastNumberInLine(lines, [
    /Sat\.\s+Alum[ií]nio/i,
    /Satura[çc][ãa]o\s+(?:de|por)?\s*Alum[ií]nio/i,
  ]);

  // Separar valores e unidades
  const results = {};
  const units = {};
  for (const [key, entry] of Object.entries(extracted)) {
    if (entry && typeof entry === 'object') {
      results[key] = entry.value;
      units[key] = entry.unit;
    } else {
      results[key] = entry;
      units[key] = '';
    }
  }

  return { metadata, results, units };
};
