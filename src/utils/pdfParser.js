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
      
      // Spatial grouping: Group by Y coordinate (transform[5])
      const rows = {};
      textContent.items.forEach(item => {
        // Round to nearest 2 pixels to group slightly misaligned items on the same line
        const y = Math.round(item.transform[5] / 2) * 2;
        if (!rows[y]) rows[y] = [];
        rows[y].push(item);
      });
      
      // Sort Y descending (top to bottom reading)
      const sortedY = Object.keys(rows).sort((a, b) => b - a);
      
      for (const y of sortedY) {
        // Sort X ascending (left to right)
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

// Heuristics to find soil parameters in text
export const parseSoilData = (text) => {
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

  const findText = (regexes) => {
    for (const regex of regexes) {
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '';
  };

  // Metadados
  metadata.proprietario = findText([
    /CLIENTE\s*:\s*([^\n]+)/i,
    /Proprietário\s*:\s*([^\nCPF]+)/i,
    /Produtor\s*:\s*([^\n]+)/i
  ]);

  metadata.laboratorio = findText([
    /LABORATÓRIO\s+DE\s+ANÁLISE[^\n]+/i,
    /LABORATÓRIO[^\n]+/i
  ]) || 'Não Identificado';
  
  if (metadata.laboratorio === 'Não Identificado' && text.includes('FULLIN')) {
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

  // Se a propriedade vier vazia da regex de Propriedade:
  if (!metadata.propriedade) {
    metadata.propriedade = '';
  }

  // Improved helper: looks for a pattern and returns the first captured group
  // Supports formats where value is right after the key: "pH 5,5" or "pH ... 5.5"
  const findValue = (regexes) => {
    for (const regex of regexes) {
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1].replace(',', '.');
      }
    }
    return null;
  };

  // To support the weird tabular format (pdf2) where we have values first then labels, 
  // we would need spatial parsing, but we can try to catch common patterns.
  // We use multiple regexes in order of precision.

  extracted.ph_agua = findValue([
    /pH\s*(?:em)?\s*H2O[^\d]*(\d+[,.]\d+)/i,
    /pH\s*\(?água\)?[^\d]*(\d+[,.]\d+)/i,
    /pH[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.ph_cacl2 = findValue([
    /pH\s*CaCl2[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.mo = findValue([
    /Mat[ée]ria Org[âa]nica[^\d]*(\d+[,.]\d+)/i,
    /M\.?O\.?(?:\s*\(Oxi-Red\.\))?[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.p_mehlich = findValue([
    /Fósforo Mehlich-?1?[^\d]*(\d+[,.]?\d*)/i,
    /P \(Mehlich-1\)[^\d]*(\d+[,.]?\d*)/i,
    /\bP\s*(?:mg\/dm3)?[^\d]*(\d+[,.]?\d*)/i,
    /Fósforo[^\d]*(\d+[,.]?\d*)/i
  ]);

  extracted.p_resina = findValue([
    /Fósforo Resina[^\d]*(\d+[,.]?\d*)/i,
    /P \(?Resina\)?[^\d]*(\d+[,.]?\d*)/i
  ]);

  extracted.k = findValue([
    /Potássio[^\d]*(\d+[,.]\d+)/i,
    /K \(Mehlich-1\)[^\d]*(\d+[,.]\d+)/i,
    /\bK\s*(?:mmolc\/dm3|mg\/dm3)?[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.ca = findValue([
    /Cálcio[^\d]*(\d+[,.]\d+)/i,
    /\bCa\b\s*\(Kcl[^\)]+\)[^\d]*(\d+[,.]\d+)/i,
    /\bCa\s*(?:cmol[c]?\/dm3|mmolc\/dm3)?[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.mg = findValue([
    /Magnésio[^\d]*(\d+[,.]\d+)/i,
    /\bMg\b\s*\(Kcl[^\)]+\)[^\d]*(\d+[,.]\d+)/i,
    /\bMg\s*(?:cmol[c]?\/dm3|mmolc\/dm3)?[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.al = findValue([
    /Alumínio \(Acidez Trocável\)[^\d]*(\d+[,.]\d+)/i,
    /\bAl\b\s*\(Kcl[^\)]+\)[^\d]*(\d+[,.]\d+)/i,
    /Acidez Trocável \(Al\)[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.h_al = findValue([
    /H\+Al \(Acidez Potencial\)[^\d]*(\d+[,.]\d+)/i,
    /Acidez Potencial \(H \+ Al\)[^\d]*(\d+[,.]\d+)/i,
    /H \+ Al[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.s = findValue([
    /Enxofre[^\d]*(\d+[,.]\d+)/i,
    /\bS\s*\(Fosfato[^\)]+\)[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.b = findValue([
    /Boro[^\d]*(\d+[,.]\d+)/i,
    /\bB\s*\(Água quente\)[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.cu = findValue([
    /Cobre[^\d]*(\d+[,.]\d+)/i,
    /\bCu\s*\(Mehlich[^\)]*\)[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.fe = findValue([
    /Ferro[^\d]*(\d+[,.]\d+)/i,
    /\bFe\s*\(Mehlich[^\)]*\)[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.mn = findValue([
    /Manganês[^\d]*(\d+[,.]\d+)/i,
    /\bMn\s*\(Mehlich[^\)]*\)[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.zn = findValue([
    /Zinco[^\d]*(\d+[,.]\d+)/i,
    /\bZn\s*\(Mehlich[^\)]*\)[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.sb = findValue([
    /Soma de Bases \(SB\)[^\d]*(\d+[,.]\d+)/i,
    /S\.B\. \(Soma de bases\)[^\d]*(\d+[,.]\d+)/i,
    /Soma de Bases[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.t = findValue([
    /CTC efetiva \(t\)[^\d]*(\d+[,.]\d+)/i,
    /CTC Efetiva[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.ctc = findValue([
    /CTC a pH 7,0 \(T\)[^\d]*(\d+[,.]\d+)/i,
    /C\.T\.C\. \(C\.T\.C\.\)[^\d]*(\d+[,.]\d+)/i,
    /CTC a pH 7[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.v = findValue([
    /Saturação de bases \(V\)[^\d]*(\d+[,.]\d+)/i,
    /V% \(Saturação de bases\)[^\d]*(\d+[,.]\d+)/i,
    /Saturação por Bases \(V\)[^\d]*(\d+[,.]\d+)/i,
    /Sat\. de Bases \(V%\)[^\d]*(\d+[,.]\d+)/i
  ]);

  extracted.m = findValue([
    /Sat\. Alumínio \(m\)[^\d]*(\d+[,.]\d+)/i,
    /Saturação de Alumínio \( m \)[^\d]*(\d+[,.]\d+)/i
  ]);

  return { metadata, results: extracted };
};
